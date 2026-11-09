-- 0030 — OIMS bus and ferry operations
--
-- LATRA Transport Licensing (Public Service Vehicles) Regulations, 2020:
--   r.4 licence + Authority-approved electronic ticketing; r.33 passenger manifest in
--   triplicate (police / office / vehicle), retained five years; Fourth Schedule fields.
-- TASAC / Merchant Shipping (Small Ships) Regulations, 2004 r.7: passengers must not
--   exceed the Certificate of Seaworthiness. TASAC facilitation rules require a passenger
--   list at departure; this table stores the list. It does not submit to Maritime Single Window.
-- Ferries Act: ply-for-hire needs a licence. We store the number; we do not issue licences.
-- Staff invitations stay blocked until the identity provider is live (Doc 78 / ADR-AUTH).

alter table app.operator
  add column if not exists electronic_ticketing_registered boolean not null default false,
  add column if not exists licence_valid_to date,
  add column if not exists tasac_licence_number text,
  add column if not exists passenger_certificate_max integer
    check (passenger_certificate_max is null or passenger_certificate_max > 0);

comment on column app.operator.electronic_ticketing_registered is
  'LATRA r.4(2)(c): licensee must be registered to an Authority-approved electronic ticketing system. False means bus trips cannot be published.';
comment on column app.operator.tasac_licence_number is
  'Maritime/ferry ply-for-hire or TASAC authorisation number as stated by the operator. Displayed, never invented.';
comment on column app.operator.passenger_certificate_max is
  'Maximum passengers on the vessel Certificate of Seaworthiness. Ferry class totals must not exceed this.';

alter table app.schedule
  add column if not exists service_timezone text not null default 'Africa/Dar_es_Salaam',
  add column if not exists vessel_id uuid,
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'published', 'paused', 'archived'));

comment on column app.schedule.service_timezone is
  'IANA timezone for local departure dates. Tanzania services use Africa/Dar_es_Salaam; do not assume every market shares it.';

create table if not exists app.schedule_exception (
  id          uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references app.schedule(id) on delete cascade,
  service_date date not null,
  kind        text not null check (kind in ('blackout', 'extra')),
  unique (schedule_id, service_date)
);

create table if not exists app.vessel (
  id                         uuid primary key default gen_random_uuid(),
  operator_id                uuid not null references app.operator(id) on delete cascade,
  name                       text not null,
  registration               text,
  passenger_certificate_max  integer not null check (passenger_certificate_max > 0),
  status                     text not null default 'active'
    check (status in ('active', 'maintenance', 'dry_dock', 'retired')),
  last_inspection            date,
  created_at                 timestamptz not null default now(),
  unique (operator_id, name)
);

create table if not exists app.vessel_class (
  id                  uuid primary key default gen_random_uuid(),
  vessel_id           uuid not null references app.vessel(id) on delete cascade,
  name                text not null,
  capacity            integer not null check (capacity > 0),
  adult_fare_minor    bigint not null check (adult_fare_minor >= 0),
  child_fare_minor    bigint not null check (child_fare_minor >= 0),
  resident_adult_minor bigint,
  resident_child_minor bigint,
  currency            char(3) not null,
  unique (vessel_id, name)
);

alter table app.schedule
  drop constraint if exists schedule_vessel_fk;
alter table app.schedule
  add constraint schedule_vessel_fk
  foreign key (vessel_id) references app.vessel(id);

alter table app.trip
  add column if not exists vessel_id uuid references app.vessel(id),
  add column if not exists service_timezone text not null default 'Africa/Dar_es_Salaam';

create table if not exists app.sailing_inventory (
  trip_id         uuid not null references app.trip(id) on delete cascade,
  vessel_class_id uuid not null references app.vessel_class(id),
  capacity        integer not null check (capacity > 0),
  primary key (trip_id, vessel_class_id)
);

create table if not exists app.trip_crew (
  id             uuid primary key default gen_random_uuid(),
  trip_id        uuid not null references app.trip(id) on delete cascade,
  role           text not null check (role in ('driver', 'conductor', 'master', 'crew')),
  full_name      text not null,
  licence_number text,
  phone          text,
  unique (trip_id, role, full_name)
);

alter table app.booking_passenger
  add column if not exists phone text,
  add column if not exists citizenship text,
  add column if not exists next_of_kin_phone text,
  add column if not exists from_stop_id uuid references app.route_stop(id),
  add column if not exists to_stop_id uuid references app.route_stop(id),
  add column if not exists vessel_class_id uuid references app.vessel_class(id);

create table if not exists app.manifest_issue (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references app.trip(id) on delete cascade,
  operator_id uuid not null references app.operator(id),
  copies      text[] not null,
  payload     jsonb not null,
  actor       text not null,
  issued_at   timestamptz not null default now()
);

comment on table app.manifest_issue is
  'LATRA r.33 triplicate issue record (police, office, vehicle) or TASAC passenger-list snapshot. Not a police filing and not a Maritime Single Window submission.';

create table if not exists app.oims_audit (
  id          bigserial primary key,
  operator_id uuid not null references app.operator(id),
  actor       text not null,
  action      text not null,
  object_type text not null,
  object_id   uuid,
  diff        jsonb not null default '{}'::jsonb,
  at          timestamptz not null default now()
);
create index if not exists ix_oims_audit_operator on app.oims_audit (operator_id, at desc);

grant select, insert, update, delete on all tables in schema app to travelar_app;
grant usage, select on all sequences in schema app to travelar_app;
