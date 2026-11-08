-- 0014 — SGR layouts as data: trainsets, classes, coaches, cells, seats
--
-- Until now the shape of a train lived in TypeScript: `src/data/sgr.ts` carried coach
-- inventories, seat counts and a class surcharge table. That is exactly the hardcoding the
-- platform has been removing mode by mode, and it is wrong for a railway: the coach mix
-- differs per trainset (the EMU is 8 cars, the Express is 14), classes are the operator's,
-- fares are approved by LATRA and change, and seat maps are versioned because a coach
-- interior gets reconfigured. None of that belongs in source.
--
-- Scope of this migration is the **layout** side only: what a coach looks like, and what
-- classes and fares exist. Trips, per-seat inventory segments, holds and the provider
-- interface come after, and nothing here blocks them.
--
-- Per the operator's own capture, a seat's identity is (trip, coach_no, seat_number): the
-- same seat number appears in more than one coach, so no uniqueness may span coaches.
--
-- Lookup tables rather than native enums, matching the brief: adding a class or a cell type
-- must be an insert, not a DDL migration. Vocabulary that is fixed geometry (layout kind,
-- seat position, cell type) is constrained with CHECKs, which is how this schema already
-- does it in `seat_layout_cell`.

create extension if not exists pgcrypto;

-- ── Rolling stock ───────────────────────────────────────────────────────────────
create table if not exists app.sgr_trainset_types (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  name          text not null,
  total_coaches smallint not null check (total_coaches > 0),
  created_at    timestamptz not null default now()
);

comment on table app.sgr_trainset_types is
  'A class of rolling stock, e.g. TRC_SGR_EMU_8CAR. Coaches of a trainset are numbered against it.';

-- ── Classes, and the baggage allowance each one carries ─────────────────────────
create table if not exists app.sgr_seat_classes (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  name             text not null,
  rank             smallint not null default 0,
  -- Left null until the operator confirms it. A guessed allowance would be printed on a
  -- ticket and argued about at the platform.
  free_baggage_kg  integer check (free_baggage_kg is null or free_baggage_kg >= 0),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

comment on column app.sgr_seat_classes.free_baggage_kg is
  'Baggage allowance the class includes. NULL means not yet confirmed by the operator, never zero.';

-- ── One published layout per coach of a trainset ────────────────────────────────
create table if not exists app.sgr_coach_layouts (
  id              uuid primary key default gen_random_uuid(),
  trainset_type_id uuid not null references app.sgr_trainset_types(id),
  coach_no        smallint not null check (coach_no > 0),
  seat_class_id   uuid not null references app.sgr_seat_classes(id),
  layout_kind     text not null check (layout_kind in
                    ('TWO_PLUS_ONE', 'TWO_PLUS_TWO', 'TWO_PLUS_TWO_FLIPPED',
                     'TWO_PLUS_TWO_IRREGULAR', 'THREE_PLUS_TWO')),
  grid_rows       integer not null check (grid_rows > 0),
  grid_cols       integer not null check (grid_cols > 0),
  -- Where the aisle falls, because it is not always in the middle: EMU and Express premium
  -- coaches have 4 rows with the aisle after row 1, Express economy has 5 rows after row 2.
  aisle_after_row smallint not null check (aisle_after_row >= 0 and aisle_after_row < grid_rows),
  seat_count      integer not null check (seat_count >= 0),
  version         integer not null default 1 check (version > 0),
  status          text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED', 'RETIRED')),
  source          text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- An edit to a published coach is a new version, never a mutation of the old one: a trip
  -- that sold seat 12 of coach 3 must still be able to say what seat 12 was.
  unique (trainset_type_id, coach_no, version)
);

create index if not exists ix_sgr_coach_layouts_published
  on app.sgr_coach_layouts (trainset_type_id, coach_no)
  where status = 'PUBLISHED';

comment on table app.sgr_coach_layouts is
  'The shape of one car: grid, class, aisle position and seat count. Versioned, because interiors get reconfigured.';

-- ── Cells: every position in the grid, seat or fixture ──────────────────────────
create table if not exists app.sgr_layout_cells (
  id              uuid primary key default gen_random_uuid(),
  coach_layout_id uuid not null references app.sgr_coach_layouts(id) on delete cascade,
  cell_type       text not null check (cell_type in
                    ('SEAT', 'LUGGAGE', 'WC', 'TABLE', 'AISLE', 'DOOR')),
  row_idx         integer not null check (row_idx >= 0),
  col_idx         integer not null check (col_idx >= 0),
  unique (coach_layout_id, row_idx, col_idx)
);

comment on column app.sgr_layout_cells.cell_type is
  'SEAT cells have a matching row in sgr_layout_seats. Fixtures (WC, LUGGAGE) are cells with no seat: they occupy the grid and cannot be sold.';

-- ── Seats: label stored, never derived ─────────────────────────────────────────
create table if not exists app.sgr_layout_seats (
  id              uuid primary key default gen_random_uuid(),
  coach_layout_id uuid not null references app.sgr_coach_layouts(id) on delete cascade,
  cell_row_idx    integer not null check (cell_row_idx >= 0),
  cell_col_idx    integer not null check (cell_col_idx >= 0),
  seat_number     integer not null check (seat_number > 0),
  seat_label      text not null,
  -- Position is a property of where the seat sits across the coach, not of its number:
  -- coaches 6-8 of the EMU are mirrored, so the same number is a window seat in one coach
  -- and an aisle seat in another.
  position        text not null check (position in ('WINDOW', 'MIDDLE', 'AISLE', 'SINGLE')),
  seat_kind       text not null default 'STANDARD' check (seat_kind in ('STANDARD', 'ACCESSIBLE')),
  -- Screen markers the operator has not explained (a blue outline that may mean accessible
  -- seating) live here as observations, and do not change what can be sold.
  attributes      jsonb not null default '{}'::jsonb,
  unique (coach_layout_id, seat_number),
  unique (coach_layout_id, cell_row_idx, cell_col_idx),
  constraint fk_sgr_layout_seats_cell
    foreign key (coach_layout_id, cell_row_idx, cell_col_idx)
    references app.sgr_layout_cells (coach_layout_id, row_idx, col_idx) on delete cascade
);

comment on table app.sgr_layout_seats is
  'One seat of a coach layout. Identity within a train is (trip, coach_no, seat_number): numbers repeat across coaches.';

-- ── Fares as approved data ──────────────────────────────────────────────────────
create table if not exists app.sgr_fares (
  id                 uuid primary key default gen_random_uuid(),
  origin_station_id  uuid not null references app.location(id),
  destination_station_id uuid not null references app.location(id),
  seat_class_id      uuid not null references app.sgr_seat_classes(id),
  passenger_type     text not null check (passenger_type in ('adult', 'child')),
  amount             numeric(14, 2) not null check (amount >= 0),
  currency           text not null,
  valid_from         timestamptz not null default now(),
  valid_to           timestamptz,
  -- LATRA approves fares. The reference is recorded when known and left null when it is
  -- not, so an unapproved price is visible as unapproved rather than looking official.
  approval_ref       text,
  check (origin_station_id <> destination_station_id),
  check (valid_to is null or valid_to > valid_from)
);

create index if not exists ix_sgr_fares_lookup
  on app.sgr_fares (origin_station_id, destination_station_id, seat_class_id, passenger_type)
  where valid_to is null;

comment on table app.sgr_fares is
  'LATRA-approved published fares per station pair, class and passenger type. Prices are never constants in code.';
