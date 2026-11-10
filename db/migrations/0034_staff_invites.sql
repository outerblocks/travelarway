-- 0034 — Partner invitations (HIMS onboards operators; invitee sets their own password)
--
-- Travellers still self-register. Operator partners do not. Travelar stores the
-- invite lifecycle; Keycloak stores credentials. Assignment stays pending until
-- the invitee completes the in-app password form.

alter table app.staff_assignment
  drop constraint if exists staff_assignment_status_check;

alter table app.staff_assignment
  add constraint staff_assignment_status_check
  check (status in ('pending', 'active', 'disabled'));

create table if not exists app.staff_invite (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  kind              text not null check (kind in ('oims', 'hims')),
  operator_id       uuid references app.operator (id),
  hims_desk         text check (hims_desk in ('finance', 'admin')),
  user_id           uuid not null references app.internal_user (id),
  keycloak_subject  text not null,
  token_hash        text not null unique,
  invited_by        uuid not null references app.internal_user (id),
  expires_at        timestamptz not null,
  accepted_at       timestamptz,
  revoked_at        timestamptz,
  created_at        timestamptz not null default now(),
  check (
    (kind = 'oims' and operator_id is not null and hims_desk is null)
    or (kind = 'hims' and operator_id is null and hims_desk is not null)
  )
);

create index if not exists staff_invite_email_idx on app.staff_invite (lower(email));
create index if not exists staff_invite_operator_idx on app.staff_invite (operator_id);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'travelar_app') then
    grant select, insert, update, delete on app.staff_invite to travelar_app;
  end if;
end $$;
