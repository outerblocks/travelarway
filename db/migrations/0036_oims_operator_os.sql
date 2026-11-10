-- 0036 — OIMS as operator tenant OS
--
-- Operator roles are data. Bus and ferry staff inherit a seeded role. Pipeline Active
-- is required before an OIMS assignment can sell. HQ roles stay separate.

insert into app.permission (code, description) values
  ('oims.routes.manage', 'Create and edit own routes and fares'),
  ('oims.schedules.manage', 'Publish own dated trips'),
  ('oims.fleet.manage', 'Manage vehicles'),
  ('oims.vessels.manage', 'Manage vessels and classes'),
  ('oims.manifest.view', 'View and issue manifests'),
  ('oims.otc.sell', 'Walk-in counter sales'),
  ('oims.finance.view', 'Own mode statement'),
  ('oims.users.manage', 'Invite operator staff'),
  ('oims.bookings.view', 'List own bookings')
on conflict (code) do nothing;

insert into app.role (id, code, name, department_id, system) values
  ('c0000000-0000-4000-8000-000000000011', 'oims_admin', 'Operator Admin', null, true),
  ('c0000000-0000-4000-8000-000000000012', 'oims_finance', 'Operator Finance', null, true),
  ('c0000000-0000-4000-8000-000000000013', 'oims_ops', 'Operator Ops', null, true),
  ('c0000000-0000-4000-8000-000000000014', 'oims_sales', 'Operator Sales', null, true)
on conflict (code) do nothing;

insert into app.role_permission (role_id, permission_code) values
  ('c0000000-0000-4000-8000-000000000011', 'oims.routes.manage'),
  ('c0000000-0000-4000-8000-000000000011', 'oims.schedules.manage'),
  ('c0000000-0000-4000-8000-000000000011', 'oims.fleet.manage'),
  ('c0000000-0000-4000-8000-000000000011', 'oims.vessels.manage'),
  ('c0000000-0000-4000-8000-000000000011', 'oims.manifest.view'),
  ('c0000000-0000-4000-8000-000000000011', 'oims.otc.sell'),
  ('c0000000-0000-4000-8000-000000000011', 'oims.finance.view'),
  ('c0000000-0000-4000-8000-000000000011', 'oims.users.manage'),
  ('c0000000-0000-4000-8000-000000000011', 'oims.bookings.view'),
  ('c0000000-0000-4000-8000-000000000012', 'oims.finance.view'),
  ('c0000000-0000-4000-8000-000000000012', 'oims.bookings.view'),
  ('c0000000-0000-4000-8000-000000000013', 'oims.routes.manage'),
  ('c0000000-0000-4000-8000-000000000013', 'oims.schedules.manage'),
  ('c0000000-0000-4000-8000-000000000013', 'oims.fleet.manage'),
  ('c0000000-0000-4000-8000-000000000013', 'oims.vessels.manage'),
  ('c0000000-0000-4000-8000-000000000013', 'oims.manifest.view'),
  ('c0000000-0000-4000-8000-000000000013', 'oims.bookings.view'),
  ('c0000000-0000-4000-8000-000000000014', 'oims.otc.sell'),
  ('c0000000-0000-4000-8000-000000000014', 'oims.manifest.view'),
  ('c0000000-0000-4000-8000-000000000014', 'oims.bookings.view')
on conflict do nothing;

update app.staff_assignment
   set role_id = 'c0000000-0000-4000-8000-000000000011'
 where kind = 'oims' and role_id is null;

create table if not exists app.otc_idempotency (
  idempotency_key text primary key,
  operator_id     uuid not null references app.operator (id),
  actor           text not null,
  trip_id         uuid not null references app.trip (id),
  booking_id      uuid not null references app.booking (id),
  created_at      timestamptz not null default now()
);
