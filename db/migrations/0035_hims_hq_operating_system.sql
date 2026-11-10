-- 0035 — HIMS as Travelar HQ operating system
--
-- Markets and legal entities are first-class. Tanzania is the first configured
-- market, not a hardcoded schema. Staff rights live in roles and permissions;
-- hims_desk remains only as a cutover map from finance/admin desks.
-- Work cases, approvals and escalations are one engine used by every department.

create table if not exists app.market (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  name         text not null,
  country_code char(2) not null,
  currency     char(3) not null,
  timezone     text not null default 'Africa/Dar_es_Salaam',
  status       text not null default 'active' check (status in ('active', 'planned', 'suspended')),
  created_at   timestamptz not null default now()
);

create table if not exists app.legal_entity (
  id         uuid primary key default gen_random_uuid(),
  market_id  uuid not null references app.market (id),
  name       text not null,
  status     text not null default 'active' check (status in ('active', 'planned')),
  created_at timestamptz not null default now()
);
create index if not exists ix_legal_entity_market on app.legal_entity (market_id);

create table if not exists app.department (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  sort_order integer not null default 0
);

create table if not exists app.permission (
  code        text primary key,
  description text not null
);

create table if not exists app.role (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  department_id uuid references app.department (id),
  system      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists ix_role_department on app.role (department_id);

create table if not exists app.role_permission (
  role_id         uuid not null references app.role (id) on delete cascade,
  permission_code text not null references app.permission (code),
  primary key (role_id, permission_code)
);

alter table app.staff_assignment
  add column if not exists role_id uuid references app.role (id),
  add column if not exists department_id uuid references app.department (id),
  add column if not exists market_id uuid references app.market (id);

alter table app.staff_assignment
  drop constraint if exists staff_assignment_check;

alter table app.staff_assignment
  add constraint staff_assignment_kind_scope_check check (
    (kind = 'oims' and operator_id is not null)
    or (kind = 'hims' and operator_id is null and (role_id is not null or hims_desk is not null))
  );

create index if not exists ix_staff_assignment_role on app.staff_assignment (role_id);
create index if not exists ix_staff_assignment_market on app.staff_assignment (market_id);

alter table app.staff_invite
  add column if not exists role_id uuid references app.role (id),
  add column if not exists department_id uuid references app.department (id),
  add column if not exists market_id uuid references app.market (id);

alter table app.staff_invite
  drop constraint if exists staff_invite_check;

alter table app.staff_invite
  add constraint staff_invite_kind_scope_check check (
    (kind = 'oims' and operator_id is not null)
    or (kind = 'hims' and operator_id is null and (role_id is not null or hims_desk is not null))
  );

alter table app.operator
  add column if not exists pipeline_status text,
  add column if not exists market_id uuid references app.market (id);

update app.operator
   set pipeline_status = case status
     when 'active' then 'active'
     when 'suspended' then 'suspended'
     else 'lead'
   end
 where pipeline_status is null;

alter table app.operator
  alter column pipeline_status set default 'lead';

alter table app.operator
  drop constraint if exists operator_pipeline_status_check;

alter table app.operator
  add constraint operator_pipeline_status_check check (pipeline_status in (
    'lead', 'qualified', 'due_diligence', 'compliance_review', 'commercial',
    'contracted', 'technical_setup', 'training', 'pilot', 'approved',
    'active', 'suspended', 'terminated'
  ));

create table if not exists app.work_case (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in (
    'support', 'refund', 'payment_exception', 'disruption', 'supplier_onboarding',
    'compliance', 'access_request', 'dsar', 'executive', 'product', 'commercial',
    'revenue', 'risk', 'people'
  )),
  priority      text not null default 'p3' check (priority in ('p1', 'p2', 'p3', 'p4')),
  status        text not null default 'open' check (status in (
    'open', 'assigned', 'pending_party', 'escalated', 'resolved', 'closed'
  )),
  title         text not null,
  market_id     uuid references app.market (id),
  owner_user_id uuid references app.internal_user (id),
  booking_id    uuid references app.booking (id),
  operator_id   uuid references app.operator (id),
  sla_due_at    timestamptz,
  created_by    uuid not null references app.internal_user (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists ix_work_case_status on app.work_case (status, sla_due_at);
create index if not exists ix_work_case_kind on app.work_case (kind, created_at desc);
create index if not exists ix_work_case_booking on app.work_case (booking_id);
create index if not exists ix_work_case_operator on app.work_case (operator_id);

create table if not exists app.work_event (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references app.work_case (id) on delete cascade,
  actor      text not null,
  kind       text not null,
  note       text,
  at         timestamptz not null default now()
);
create index if not exists ix_work_event_case on app.work_event (case_id, at);

create table if not exists app.approval_item (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in (
    'commission', 'payout', 'refund', 'supplier_activation', 'supplier_suspend',
    'bank_change', 'inventory_pause', 'access'
  )),
  status       text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected', 'withdrawn')),
  object_type  text not null,
  object_id    text not null,
  maker        text not null,
  checker      text,
  reason       text,
  decided_reason text,
  mode         text,
  created_at   timestamptz not null default now(),
  decided_at   timestamptz,
  check (checker is null or checker <> maker)
);
create index if not exists ix_approval_item_status on app.approval_item (status, created_at desc);
create unique index if not exists ux_approval_item_open
  on app.approval_item (kind, object_id) where status = 'submitted';

create table if not exists app.escalation (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references app.work_case (id) on delete cascade,
  severity     text not null check (severity in ('p1', 'p2')),
  commander    text,
  raised_by    text not null,
  raised_at    timestamptz not null default now(),
  resolved_at  timestamptz
);
create index if not exists ix_escalation_case on app.escalation (case_id);

create table if not exists app.decision_register (
  code        text primary key,
  title       text not null,
  why         text not null,
  owner       text not null,
  status      text not null default 'open' check (status in ('open', 'accepted', 'deferred')),
  created_at  timestamptz not null default now()
);

alter table app.hq_audit
  add column if not exists reason text,
  add column if not exists correlation_id text;

insert into app.market (id, code, name, country_code, currency, timezone)
values (
  'a0000000-0000-4000-8000-000000000001',
  'TZ-ML',
  'Tanzania Mainland',
  'TZ',
  'TZS',
  'Africa/Dar_es_Salaam'
)
on conflict (code) do nothing;

insert into app.legal_entity (id, market_id, name)
values (
  'a0000000-0000-4000-8000-000000000011',
  'a0000000-0000-4000-8000-000000000001',
  'OuterBlocks Limited'
)
on conflict (id) do nothing;

insert into app.department (id, code, name, sort_order) values
  ('b0000000-0000-4000-8000-000000000001', 'executive', 'Executive', 10),
  ('b0000000-0000-4000-8000-000000000002', 'product', 'Product', 20),
  ('b0000000-0000-4000-8000-000000000003', 'supply', 'Supply', 30),
  ('b0000000-0000-4000-8000-000000000004', 'operations', 'Operations', 40),
  ('b0000000-0000-4000-8000-000000000005', 'cx', 'Customer Experience', 50),
  ('b0000000-0000-4000-8000-000000000006', 'commercial', 'Commercial', 60),
  ('b0000000-0000-4000-8000-000000000007', 'revenue', 'Revenue and Marketing', 70),
  ('b0000000-0000-4000-8000-000000000008', 'finance', 'Finance', 80),
  ('b0000000-0000-4000-8000-000000000009', 'risk', 'Risk', 90),
  ('b0000000-0000-4000-8000-00000000000a', 'compliance', 'Compliance', 100),
  ('b0000000-0000-4000-8000-00000000000b', 'people', 'People', 110)
on conflict (code) do nothing;

insert into app.permission (code, description) values
  ('hq.executive.view', 'Executive dashboard'),
  ('hq.finance.view', 'Mode-isolated finance'),
  ('hq.finance.propose', 'Propose commission or payout'),
  ('hq.finance.settle', 'Record payout intent'),
  ('hq.approvals.decide', 'Approve or reject HQ items'),
  ('hq.operators.view', 'View suppliers'),
  ('hq.operators.manage', 'Create supplier leads'),
  ('hq.operators.invite', 'Invite operator admins after activation'),
  ('hq.supply.decide', 'Advance or suspend supplier pipeline'),
  ('hq.users.manage', 'Invite HQ staff'),
  ('hq.roles.manage', 'View roles and permissions'),
  ('hq.audit.view', 'HQ audit log'),
  ('hq.cases.view', 'Work queues'),
  ('hq.cases.manage', 'Create and own cases'),
  ('hq.cases.escalate', 'Escalate a case'),
  ('hq.ops.tower', 'Operations control tower'),
  ('hq.compliance.view', 'Compliance and licence expiry'),
  ('hq.settings.manage', 'HQ settings')
on conflict (code) do nothing;

insert into app.role (id, code, name, department_id, system) values
  ('c0000000-0000-4000-8000-000000000001', 'hq_admin', 'HQ Admin', 'b0000000-0000-4000-8000-000000000001', true),
  ('c0000000-0000-4000-8000-000000000002', 'hq_finance_analyst', 'Finance Analyst', 'b0000000-0000-4000-8000-000000000008', true),
  ('c0000000-0000-4000-8000-000000000003', 'hq_finance_controller', 'Finance Controller', 'b0000000-0000-4000-8000-000000000008', true),
  ('c0000000-0000-4000-8000-000000000004', 'hq_cx_l1', 'CX L1', 'b0000000-0000-4000-8000-000000000005', true),
  ('c0000000-0000-4000-8000-000000000005', 'hq_cx_l2', 'CX L2', 'b0000000-0000-4000-8000-000000000005', true),
  ('c0000000-0000-4000-8000-000000000006', 'hq_mode_ops', 'Mode Operations', 'b0000000-0000-4000-8000-000000000004', true),
  ('c0000000-0000-4000-8000-000000000007', 'hq_supply', 'Supply Onboarding', 'b0000000-0000-4000-8000-000000000003', true),
  ('c0000000-0000-4000-8000-000000000008', 'hq_compliance', 'Compliance / DPO', 'b0000000-0000-4000-8000-00000000000a', true),
  ('c0000000-0000-4000-8000-000000000009', 'hq_auditor', 'Auditor', 'b0000000-0000-4000-8000-000000000001', true)
on conflict (code) do nothing;

insert into app.role_permission (role_id, permission_code)
select 'c0000000-0000-4000-8000-000000000001', code from app.permission
on conflict do nothing;

insert into app.role_permission (role_id, permission_code) values
  ('c0000000-0000-4000-8000-000000000002', 'hq.executive.view'),
  ('c0000000-0000-4000-8000-000000000002', 'hq.finance.view'),
  ('c0000000-0000-4000-8000-000000000002', 'hq.finance.propose'),
  ('c0000000-0000-4000-8000-000000000002', 'hq.operators.view'),
  ('c0000000-0000-4000-8000-000000000002', 'hq.cases.view'),
  ('c0000000-0000-4000-8000-000000000003', 'hq.executive.view'),
  ('c0000000-0000-4000-8000-000000000003', 'hq.finance.view'),
  ('c0000000-0000-4000-8000-000000000003', 'hq.finance.settle'),
  ('c0000000-0000-4000-8000-000000000003', 'hq.approvals.decide'),
  ('c0000000-0000-4000-8000-000000000003', 'hq.operators.view'),
  ('c0000000-0000-4000-8000-000000000003', 'hq.audit.view'),
  ('c0000000-0000-4000-8000-000000000003', 'hq.cases.view'),
  ('c0000000-0000-4000-8000-000000000004', 'hq.cases.view'),
  ('c0000000-0000-4000-8000-000000000004', 'hq.cases.manage'),
  ('c0000000-0000-4000-8000-000000000004', 'hq.operators.view'),
  ('c0000000-0000-4000-8000-000000000005', 'hq.cases.view'),
  ('c0000000-0000-4000-8000-000000000005', 'hq.cases.manage'),
  ('c0000000-0000-4000-8000-000000000005', 'hq.cases.escalate'),
  ('c0000000-0000-4000-8000-000000000005', 'hq.operators.view'),
  ('c0000000-0000-4000-8000-000000000005', 'hq.finance.view'),
  ('c0000000-0000-4000-8000-000000000006', 'hq.ops.tower'),
  ('c0000000-0000-4000-8000-000000000006', 'hq.cases.view'),
  ('c0000000-0000-4000-8000-000000000006', 'hq.cases.manage'),
  ('c0000000-0000-4000-8000-000000000006', 'hq.cases.escalate'),
  ('c0000000-0000-4000-8000-000000000006', 'hq.operators.view'),
  ('c0000000-0000-4000-8000-000000000007', 'hq.operators.view'),
  ('c0000000-0000-4000-8000-000000000007', 'hq.operators.manage'),
  ('c0000000-0000-4000-8000-000000000007', 'hq.operators.invite'),
  ('c0000000-0000-4000-8000-000000000007', 'hq.supply.decide'),
  ('c0000000-0000-4000-8000-000000000007', 'hq.cases.view'),
  ('c0000000-0000-4000-8000-000000000008', 'hq.compliance.view'),
  ('c0000000-0000-4000-8000-000000000008', 'hq.operators.view'),
  ('c0000000-0000-4000-8000-000000000008', 'hq.cases.view'),
  ('c0000000-0000-4000-8000-000000000008', 'hq.cases.manage'),
  ('c0000000-0000-4000-8000-000000000008', 'hq.audit.view'),
  ('c0000000-0000-4000-8000-000000000009', 'hq.executive.view'),
  ('c0000000-0000-4000-8000-000000000009', 'hq.finance.view'),
  ('c0000000-0000-4000-8000-000000000009', 'hq.audit.view'),
  ('c0000000-0000-4000-8000-000000000009', 'hq.operators.view'),
  ('c0000000-0000-4000-8000-000000000009', 'hq.cases.view')
on conflict do nothing;

update app.staff_assignment a
   set role_id = case a.hims_desk
         when 'admin' then 'c0000000-0000-4000-8000-000000000001'::uuid
         when 'finance' then 'c0000000-0000-4000-8000-000000000002'::uuid
       end,
       department_id = case a.hims_desk
         when 'admin' then 'b0000000-0000-4000-8000-000000000001'::uuid
         when 'finance' then 'b0000000-0000-4000-8000-000000000008'::uuid
       end,
       market_id = 'a0000000-0000-4000-8000-000000000001'
 where a.kind = 'hims' and a.role_id is null;

insert into app.decision_register (code, title, why, owner) values
  ('D-01', 'Contracting entity', 'Determines licence applications, contracts, tax and liability.', 'CEO + Legal + CFO'),
  ('D-02', 'LATRA e-ticketing role', 'Role determines the bus production control path.', 'Legal + Compliance'),
  ('D-03', 'First launch mode and supplier cohort', 'Each mode has different inventory and regulatory requirements.', 'CEO + COO + Product'),
  ('D-04', 'Tourist Agency Licence', 'May affect legal structure and market entry.', 'Legal'),
  ('D-05', 'Principal versus agent by mode', 'Changes terms, tax, refunds and disclosures.', 'Legal + CFO + Product'),
  ('D-06', 'Who holds funds', 'Could change payment-system classification. No wallet until resolved.', 'CFO + Legal'),
  ('D-07', 'Data hosting and cross-border transfers', 'LATRA local hosting text and PDPA apply per system.', 'CTO + DPO + Legal'),
  ('D-08', 'Provider confirmation fallback', 'Prevents duplicate bookings and financial loss.', 'COO + CTO'),
  ('D-09', '24/7 coverage for overnight transport', 'Support must match real service hours.', 'COO'),
  ('D-10', 'Zanzibar regime', 'Mainland and Zanzibar must not share one permit pack.', 'Legal + Country Manager')
on conflict (code) do nothing;

update app.operator set market_id = 'a0000000-0000-4000-8000-000000000001' where market_id is null;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'travelar_app') then
    grant select, insert, update, delete on
      app.market, app.legal_entity, app.department, app.permission, app.role, app.role_permission,
      app.work_case, app.work_event, app.approval_item, app.escalation, app.decision_register
      to travelar_app;
  end if;
end $$;
