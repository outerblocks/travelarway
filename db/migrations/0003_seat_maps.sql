-- 0003 — Configurable seat maps
--
-- Decisions taken as CTO (recorded here, not in a chat log):
--
-- 1. Seats are addressable records. `seat_hold` and `booking_passenger` gain a nullable
--    `seat_id` FK and keep `seat_no` as a printed snapshot. Labels are operator-editable,
--    so label-only keys would orphan a live hold the moment someone renumbers. The
--    label-based unique indexes stay in force during the transition — two protections
--    during a migration is acceptable; none is not.
-- 2. Layouts are versioned inside a family. Editing a published layout inserts version+1;
--    vehicles and trips keep pointing at the version they were sold on.
-- 3. Ownership is nullable, which is what makes a public library template possible:
--    NULL owner + visibility 'public' = a system preset any operator may adopt.
-- 4. Decks exist as a column with validation from day one, but the editor is single-deck
--    in v1. The renderer filters by deck, so shipping double-deck later is data, not code.

-- ── Seat classes belong to operators ────────────────────────────────────────────────
create table if not exists app.seat_class (
  id          uuid primary key default gen_random_uuid(),
  operator_id uuid references app.operator(id) on delete cascade,   -- null = system-wide
  name        text not null,
  rank        smallint not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (operator_id, name)
);

-- ── Layout family and versioning ────────────────────────────────────────────────────
alter table app.seat_layout
  add column if not exists family_id     uuid,
  add column if not exists version       integer not null default 1,
  add column if not exists description   text,
  add column if not exists visibility    text not null default 'private',
  add column if not exists rows          integer,
  add column if not exists cols          integer,
  add column if not exists decks         smallint not null default 1,
  add column if not exists mirrored      boolean not null default false,
  add column if not exists status        text not null default 'published';

-- Existing rows: the family is the row itself, version 1.
update app.seat_layout set family_id = id where family_id is null;
-- The legacy model had one aisle implied between lanes 2 and 3, i.e. five columns.
update app.seat_layout set rows = row_count, cols = 5 where rows is null;

alter table app.seat_layout
  alter column family_id set not null,
  alter column rows set not null,
  alter column cols set not null;

do $$ begin
  alter table app.seat_layout add constraint seat_layout_visibility_chk
    check (visibility in ('private', 'shared', 'public'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table app.seat_layout add constraint seat_layout_status_chk
    check (status in ('draft', 'published', 'archived'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table app.seat_layout add constraint seat_layout_shape_chk
    check (rows between 1 and 60 and cols between 1 and 8 and decks between 1 and 2
           and version >= 1);
exception when duplicate_object then null; end $$;

create unique index if not exists ux_seat_layout_family_version
  on app.seat_layout (family_id, version);

-- ── Grid cells: what occupies a position ───────────────────────────────────────────
create table if not exists app.seat_layout_cell (
  layout_id uuid not null references app.seat_layout(id) on delete cascade,
  deck      smallint not null default 0,
  row       integer not null,
  col       integer not null,
  cell_type text not null,
  primary key (layout_id, deck, row, col),
  check (deck >= 0),
  check (row >= 0 and col >= 1),
  check (cell_type in ('seat', 'aisle', 'empty', 'door_front', 'door_mid', 'driver', 'toilet', 'stairs', 'luggage'))
);

-- ── Seats: one record per seat, label stored not derived ───────────────────────────
create table if not exists app.seat_layout_seat (
  id            uuid primary key default gen_random_uuid(),
  layout_id     uuid not null references app.seat_layout(id) on delete cascade,
  deck          smallint not null default 0,
  row           integer not null,
  col           integer not null,
  label         text not null,
  seat_class_id uuid references app.seat_class(id),
  is_window     boolean not null default false,
  is_aisle      boolean not null default false,
  extra_legroom boolean not null default false,
  accessible    boolean not null default false,
  check (deck >= 0),
  check (row >= 1 and col >= 1),
  unique (layout_id, deck, row, col),
  -- The duplicate "21" in the operator's sample is rejected here, not in the editor.
  unique (layout_id, deck, label)
);

create index if not exists ix_seat_layout_seat_layout on app.seat_layout_seat (layout_id);

-- ── Convert the existing 11-row layout so no fleet is left without a map ───────────
insert into app.seat_layout_cell (layout_id, deck, row, col, cell_type)
select sl.id, 0, 0, 1, 'door_front' from app.seat_layout sl
on conflict do nothing;

insert into app.seat_layout_cell (layout_id, deck, row, col, cell_type)
select sl.id, 0, 0, 5, 'driver' from app.seat_layout sl
on conflict do nothing;

insert into app.seat_layout_cell (layout_id, deck, row, col, cell_type)
select sl.id, 0, r, 3, 'aisle'
from app.seat_layout sl, generate_series(1, sl.rows) as r
on conflict do nothing;

insert into app.seat_layout_seat (layout_id, deck, row, col, label, is_window, is_aisle)
select sl.id, 0, r, c.col, r || c.lane, c.col in (1, 5), c.col in (2, 4)
from app.seat_layout sl
cross join generate_series(1, sl.rows) as r
cross join (values (1, 'A'), (2, 'B'), (4, 'C'), (5, 'D')) as c(col, lane)
on conflict do nothing;

-- ── Seat identity on the transactional tables ──────────────────────────────────────
alter table app.seat_hold
  add column if not exists seat_id uuid references app.seat_layout_seat(id);

alter table app.booking_passenger
  add column if not exists seat_id uuid references app.seat_layout_seat(id);

create index if not exists ix_seat_hold_seat on app.seat_hold (seat_id) where seat_id is not null;
create index if not exists ix_booking_passenger_seat on app.booking_passenger (seat_id) where seat_id is not null;

grant select, insert, update, delete on all tables in schema app to travelar_app;
grant usage, select on all sequences in schema app to travelar_app;
