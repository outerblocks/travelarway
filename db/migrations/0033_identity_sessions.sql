-- 0033 — Internal users, IdP subjects, BFF sessions, staff assignments
--
-- Keycloak authenticates. Travelar authorizes. Staff rights live here, not in
-- a realm role alone. Guest booking-access JWTs stay a separate mechanism.

create table if not exists app.internal_user (
  id         uuid primary key default gen_random_uuid(),
  status     text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now()
);

create table if not exists app.external_identity (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references app.internal_user (id),
  issuer     text not null,
  subject    text not null,
  email      text,
  created_at timestamptz not null default now(),
  unique (issuer, subject)
);

create table if not exists app.app_session (
  id            uuid primary key,
  user_id       uuid not null references app.internal_user (id),
  id_token_hint text,
  expires_at    timestamptz not null,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists app_session_user_idx on app.app_session (user_id);

create table if not exists app.staff_assignment (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references app.internal_user (id),
  kind        text not null check (kind in ('oims', 'hims')),
  operator_id uuid references app.operator (id),
  hims_desk   text check (hims_desk in ('finance', 'admin')),
  status      text not null default 'active' check (status in ('active', 'disabled')),
  created_at  timestamptz not null default now(),
  check (
    (kind = 'oims' and operator_id is not null and hims_desk is null)
    or (kind = 'hims' and operator_id is null and hims_desk is not null)
  )
);

create unique index if not exists staff_assignment_oims_uq
  on app.staff_assignment (user_id, operator_id)
  where kind = 'oims' and status = 'active';

create unique index if not exists staff_assignment_hims_uq
  on app.staff_assignment (user_id, hims_desk)
  where kind = 'hims' and status = 'active';

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'travelar_app') then
    grant usage on schema app to travelar_app;
    grant select, insert, update, delete on all tables in schema app to travelar_app;
    grant usage, select on all sequences in schema app to travelar_app;
    execute 'alter default privileges in schema app grant select, insert, update, delete on tables to travelar_app';
  end if;
end $$;
