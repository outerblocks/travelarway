-- 0015 — SGR trips and per-seat, per-segment inventory
--
-- Why segments and not just seats: a Dar es Salaam → Dodoma journey passes Morogoro, and a
-- seat sold for the first half is free for the second. Tracking a seat as one boolean makes
-- either answer wrong — refusing the second passenger loses a sale, allowing it double-sells
-- a seat for the first leg. So inventory is (seat, stop interval), and the database, not the
-- application, decides whether two claims overlap.
--
-- The exclusion constraint below is that decision. Two HELD/SOLD/BLOCKED segments on the same
-- seat may not overlap their stop ranges, and the conflict is raised by PostgreSQL rather
-- than by a check-then-insert race in code. This is the only mechanism that survives N people
-- tapping the same seat at the same instant, which is the case that costs real money.
--
-- btree_gist is required for the mixed integer-range + equality exclusion. It is installed
-- here rather than assumed: on a managed cluster it may need to be enabled by an operator,
-- and a migration that silently skips the constraint would leave the double-sell protection
-- absent while everything still appeared to work.
--
-- Layouts are copied into a trip, not referenced through to the live version. If an operator
-- reconfigures coach 3 next month, a ticket sold against the old map must still be able to
-- say which seat it was.

create extension if not exists btree_gist;

-- ── A dated service ─────────────────────────────────────────────────────────────
create table if not exists app.sgr_trips (
  id                     uuid primary key default gen_random_uuid(),
  -- The operator's own service identifier, e.g. "SGR-DOD-0600". Unique so a re-import of the
  -- timetable cannot create a second copy of the same running train.
  service_ref            text not null unique,
  trainset_type_id       uuid not null references app.sgr_trainset_types(id),
  origin_station_id      uuid not null references app.location(id),
  destination_station_id uuid not null references app.location(id),
  departs_at             timestamptz not null,
  arrives_at             timestamptz not null,
  -- The published coach layouts, copied at creation. Read it from here, not from
  -- sgr_coach_layouts, when rendering a seat map for this trip.
  layout_snapshot        jsonb not null default '[]'::jsonb,
  inventory_mode         text not null default 'ALLOCATED_BLOCK' check (inventory_mode in
                          ('ALLOCATED_BLOCK', 'PUSH_SYNC', 'LIVE_VERIFY')),
  status                 text not null default 'SCHEDULED' check (status in
                          ('SCHEDULED', 'ON_SALE', 'DEPARTED', 'COMPLETED', 'CANCELLED')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  check (arrives_at > departs_at),
  check (origin_station_id <> destination_station_id)
);

create index if not exists ix_sgr_trips_corridor_date
  on app.sgr_trips (origin_station_id, destination_station_id, departs_at);

comment on column app.sgr_trips.inventory_mode is
  'Who owns the seat count. ALLOCATED_BLOCK: Travelar is authoritative for the seats it was given. PUSH_SYNC / LIVE_VERIFY: TRC is, and their answer wins.';

-- ── Where it stops, in order ────────────────────────────────────────────────────
create table if not exists app.sgr_trip_stops (
  trip_id    uuid not null references app.sgr_trips(id) on delete cascade,
  station_id uuid not null references app.location(id),
  seq        smallint not null check (seq >= 0),
  arrives_at timestamptz,
  departs_at timestamptz,
  primary key (trip_id, seq)
);

comment on column app.sgr_trip_stops.seq is
  'Boarding position along the trip. A seat segment is expressed between two of these, so a seat sold Dar→Morogoro stays sellable Morogoro→Dodoma.';

-- ── The seats a trip can offer ──────────────────────────────────────────────────
create table if not exists app.sgr_trip_seats (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references app.sgr_trips(id) on delete cascade,
  coach_no      smallint not null check (coach_no > 0),
  seat_number   integer not null check (seat_number > 0),
  seat_class_id uuid not null references app.sgr_seat_classes(id),
  seat_label    text not null,
  position      text not null check (position in ('WINDOW', 'MIDDLE', 'AISLE', 'SINGLE')),
  seat_kind     text not null default 'STANDARD' check (seat_kind in ('STANDARD', 'ACCESSIBLE')),
  -- False for seats on the train that Travelar was not allocated. They are drawn on the map
  -- as NOT_SELLABLE rather than hidden, so a passenger is not told a coach is empty when the
  -- seats are simply not ours to sell.
  sellable      boolean not null default false,
  unique (trip_id, coach_no, seat_number)
);

create index if not exists ix_sgr_trip_seats_class
  on app.sgr_trip_seats (trip_id, seat_class_id) where sellable;

-- ── Holds ───────────────────────────────────────────────────────────────────────
create table if not exists app.sgr_holds (
  id          uuid primary key default gen_random_uuid(),
  -- Client-supplied idempotency key. A passenger who taps twice, or a client that retries
  -- after a timeout, holds the same seats once.
  hold_key    text not null unique,
  trip_id     uuid not null references app.sgr_trips(id) on delete cascade,
  expires_at  timestamptz not null,
  status      text not null default 'HELD' check (status in ('HELD', 'CONFIRMED', 'RELEASED', 'EXPIRED')),
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ix_sgr_holds_expiry on app.sgr_holds (expires_at) where status = 'HELD';

-- ── Inventory: one row per seat per claimed interval ────────────────────────────
create table if not exists app.sgr_seat_segments (
  id              uuid primary key default gen_random_uuid(),
  trip_seat_id    uuid not null references app.sgr_trip_seats(id) on delete cascade,
  from_seq        smallint not null check (from_seq >= 0),
  to_seq          smallint not null check (to_seq > from_seq),
  state           text not null default 'AVAILABLE' check (state in
                    ('AVAILABLE', 'HELD', 'SOLD', 'BLOCKED')),
  hold_id         uuid references app.sgr_holds(id),
  booking_item_id uuid,
  hold_expires_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- A HELD, SOLD or BLOCKED interval may not overlap another on the same seat. Available
  -- rows are excluded from the constraint so the materialiser can keep one wide
  -- AVAILABLE row per seat without colliding with itself.
  constraint sgr_seat_segments_no_overlap
    exclude using gist (
      trip_seat_id with =,
      int4range(from_seq, to_seq) with &&
    ) where (state in ('HELD', 'SOLD', 'BLOCKED')),
  -- A hold that has been taken must say when it lapses, or the sweeper has no way to know
  -- the seat is stuck rather than merely reserved.
  check (state <> 'HELD' or (hold_id is not null and hold_expires_at is not null))
);

create index if not exists ix_sgr_seat_segments_seat_state
  on app.sgr_seat_segments (trip_seat_id, state, from_seq, to_seq);
create index if not exists ix_sgr_seat_segments_hold on app.sgr_seat_segments (hold_id) where hold_id is not null;
create index if not exists ix_sgr_seat_segments_booking on app.sgr_seat_segments (booking_item_id) where booking_item_id is not null;

comment on table app.sgr_seat_segments is
  'Seat inventory as (seat, stop interval, state). Overlap between live claims is refused by the database, not by application logic.';

-- ── External identifiers stay out of the booking tables ────────────────────────
create table if not exists app.sgr_provider_refs (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('trip', 'seat', 'segment', 'hold', 'booking_item')),
  entity_id   uuid not null,
  provider    text not null,
  external_id text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  unique (entity_type, entity_id, provider)
);

comment on table app.sgr_provider_refs is
  'Where a TRC (or future reseller) identifier lives. Booking and inventory tables carry no provider-specific columns, so changing provider does not change the schema.';
