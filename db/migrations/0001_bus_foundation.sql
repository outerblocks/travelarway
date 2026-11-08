-- 0001 — Bus slice foundation
--
-- Applied by scripts/migrate.mjs as travelar_migrator. Every object lives in `app` so
-- the runtime role can be granted row access without ever owning structure.
--
-- Money is stored in minor units (bigint) with an explicit currency, because TZS has no
-- practical subdivision but USD does, and a float would be indefensible in a ledger.

create schema if not exists app;

-- Provenance: seeded reference data must be distinguishable from live operator data.
do $$ begin
  create type app.data_source as enum ('reference', 'operator_contract', 'fixture');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app.booking_status as enum ('held', 'issued', 'cancelled', 'refunded', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app.hold_status as enum ('active', 'released', 'consumed', 'expired');
exception when duplicate_object then null; end $$;

-- ── Organisation ────────────────────────────────────────────────────────────────
create table if not exists app.operator (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  mode            text not null check (mode in ('bus', 'ferry', 'train', 'flights', 'stays', 'experiences')),
  country_code    char(2) not null,
  currency        char(3) not null,
  status          text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  -- Commission is effective-dated in app.commission_rate; this column is the fallback.
  is_hq_approved  boolean not null default false,
  source          app.data_source not null default 'fixture',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists app.commission_rate (
  id             uuid primary key default gen_random_uuid(),
  operator_id    uuid not null references app.operator(id) on delete cascade,
  mode           text not null,
  rate           numeric(6,5) not null check (rate >= 0 and rate <= 1),
  revenue_type   text not null check (revenue_type in ('commission', 'markup')),
  effective_from timestamptz not null,
  effective_to   timestamptz,
  created_at     timestamptz not null default now(),
  check (effective_to is null or effective_to > effective_from)
);
create index if not exists ix_commission_rate_operator on app.commission_rate (operator_id, mode, effective_from desc);

-- ── Geography ───────────────────────────────────────────────────────────────────
create table if not exists app.location (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  code         text not null,                      -- IATA / station / operator code
  country_code char(2) not null,
  kind         text not null default 'city' check (kind in ('city', 'station', 'terminal', 'airport', 'property')),
  source       app.data_source not null default 'reference',
  unique (kind, code, country_code)
);
create index if not exists ix_location_name on app.location (lower(name));

-- ── Routes and fares ────────────────────────────────────────────────────────────
create table if not exists app.route (
  id          uuid primary key default gen_random_uuid(),
  operator_id uuid not null references app.operator(id) on delete cascade,
  name        text not null,
  mode        text not null check (mode in ('bus', 'ferry', 'train')),
  source      app.data_source not null default 'operator_contract',
  created_at  timestamptz not null default now(),
  unique (operator_id, name)
);

create table if not exists app.route_stop (
  id             uuid primary key default gen_random_uuid(),
  route_id       uuid not null references app.route(id) on delete cascade,
  location_id    uuid not null references app.location(id),
  sequence       integer not null check (sequence >= 0),
  offset_minutes integer not null check (offset_minutes >= 0),
  terminal_name  text,
  unique (route_id, sequence)
);

-- Fares are per segment (origin→destination pair), never a single route price: that is
-- what makes partial-route pricing honest.
create table if not exists app.segment_fare (
  id           uuid primary key default gen_random_uuid(),
  route_id     uuid not null references app.route(id) on delete cascade,
  from_stop_id uuid not null references app.route_stop(id) on delete cascade,
  to_stop_id   uuid not null references app.route_stop(id) on delete cascade,
  fare_minor   bigint not null check (fare_minor >= 0),
  currency     char(3) not null,
  unique (route_id, from_stop_id, to_stop_id),
  check (from_stop_id <> to_stop_id)
);

-- ── Inventory ───────────────────────────────────────────────────────────────────
create table if not exists app.seat_layout (
  id          uuid primary key default gen_random_uuid(),
  operator_id uuid not null references app.operator(id) on delete cascade,
  name        text not null,
  row_count   integer not null check (row_count > 0),
  lanes       text[] not null,
  unique (operator_id, name)
);

create table if not exists app.vehicle (
  id             uuid primary key default gen_random_uuid(),
  operator_id    uuid not null references app.operator(id) on delete cascade,
  registration   text not null,
  model          text,
  seat_layout_id uuid references app.seat_layout(id),
  unique (operator_id, registration)
);

create table if not exists app.schedule (
  id             uuid primary key default gen_random_uuid(),
  route_id       uuid not null references app.route(id) on delete cascade,
  operator_id    uuid not null references app.operator(id) on delete cascade,
  departure_time time not null,
  days_of_week   smallint[] not null,               -- 0 = Sunday … 6 = Saturday
  valid_from     date not null,
  valid_to       date,
  created_at     timestamptz not null default now(),
  check (valid_to is null or valid_to >= valid_from)
);

-- A dated, bookable instance. Capacity lives here, not on the schedule.
create table if not exists app.trip (
  id          uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references app.schedule(id) on delete cascade,
  route_id    uuid not null references app.route(id) on delete cascade,
  operator_id uuid not null references app.operator(id) on delete cascade,
  service_date date not null,
  vehicle_id  uuid references app.vehicle(id),
  status      text not null default 'scheduled' check (status in ('scheduled', 'departed', 'completed', 'cancelled')),
  unique (schedule_id, service_date)
);

-- ── Holds and bookings ──────────────────────────────────────────────────────────
create table if not exists app.seat_hold (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references app.trip(id) on delete cascade,
  seat_no    text not null,
  status     app.hold_status not null default 'active',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
-- One active hold per seat per trip. Released/expired rows may accumulate as history.
create unique index if not exists ux_seat_hold_active
  on app.seat_hold (trip_id, seat_no) where status = 'active';

create table if not exists app.booking (
  id             uuid primary key default gen_random_uuid(),
  pnr            text not null unique,
  operator_id    uuid not null references app.operator(id),
  trip_id        uuid not null references app.trip(id),
  status         app.booking_status not null default 'held',
  channel        text not null default 'online' check (channel in ('online', 'otc', 'call_centre')),
  total_minor    bigint not null check (total_minor >= 0),
  currency       char(3) not null,
  customer_name  text,
  customer_email text,
  customer_phone text,
  source         app.data_source not null default 'fixture',
  created_at     timestamptz not null default now(),
  issued_at      timestamptz,
  check ((status = 'issued') = (issued_at is not null))
);

create table if not exists app.booking_passenger (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references app.booking(id) on delete cascade,
  trip_id    uuid not null references app.trip(id),
  full_name  text not null,
  category   text not null check (category in ('adult', 'child', 'infant')),
  seat_no    text,
  fare_minor bigint not null default 0,
  status     text not null default 'active' check (status in ('active', 'cancelled'))
);

-- The double-sell guarantee. Not application logic: a second active passenger on the
-- same seat of the same trip is rejected by the database.
create unique index if not exists ux_seat_sold_once
  on app.booking_passenger (trip_id, seat_no)
  where seat_no is not null and status = 'active';

-- ── Audit and outbox ────────────────────────────────────────────────────────────
create table if not exists app.booking_event (
  id         bigserial primary key,
  booking_id uuid references app.booking(id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  actor      text not null default 'system',
  at         timestamptz not null default now()
);
create index if not exists ix_booking_event_booking on app.booking_event (booking_id, at desc);

create table if not exists app.outbox_event (
  id            bigserial primary key,
  type          text not null,
  payload       jsonb not null,
  status        text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts      integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index if not exists ix_outbox_pending on app.outbox_event (next_attempt_at) where status = 'pending';

-- ── Runtime grants for objects created above ────────────────────────────────────
-- ALTER DEFAULT PRIVILEGES covered future objects; these cover the ones just created.
grant select, insert, update, delete on all tables in schema app to travelar_app;
grant usage, select on all sequences in schema app to travelar_app;
