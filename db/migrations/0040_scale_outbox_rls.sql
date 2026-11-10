-- 0040 — Shared outbox fields, search indexes, tenant RLS on operator-owned tables.
-- RLS is a second wall. Application still filters by operator_id. An empty
-- app.operator_id setting keeps guest/catalog paths working.

alter table app.outbox_event
  add column if not exists last_error text,
  add column if not exists idempotency_key text;

create unique index if not exists ux_outbox_idempotency
  on app.outbox_event (idempotency_key);

create index if not exists ix_sgr_trip_stops_station
  on app.sgr_trip_stops (station_id);

create or replace function app.tenant_allows(p_operator uuid)
returns boolean
language sql
stable
as $$
  select
    coalesce(nullif(current_setting('app.operator_id', true), ''), '') = ''
    or (
      p_operator is not null
      and p_operator = nullif(current_setting('app.operator_id', true), '')::uuid
    );
$$;

comment on function app.tenant_allows(uuid) is
  'True when no operator is bound to the session, or when the row belongs to that operator.';

grant execute on function app.tenant_allows(uuid) to travelar_app;

do $$
declare
  t text;
begin
  foreach t in array array[
    'oims_audit',
    'vessel',
    'manifest_issue',
    'otc_idempotency',
    'operator_licence',
    'payout_beneficiary',
    'payout_batch'
  ]
  loop
    if exists (
      select 1 from information_schema.tables
       where table_schema = 'app' and table_name = t
    ) then
      execute format('alter table app.%I enable row level security', t);
      execute format('drop policy if exists %I on app.%I', t || '_tenant', t);
      execute format(
        'create policy %I on app.%I for all to travelar_app using (app.tenant_allows(operator_id)) with check (app.tenant_allows(operator_id))',
        t || '_tenant',
        t
      );
    end if;
  end loop;

  if exists (
    select 1 from information_schema.tables
     where table_schema = 'app' and table_name = 'staff_assignment'
  ) then
    alter table app.staff_assignment enable row level security;
    drop policy if exists staff_assignment_tenant on app.staff_assignment;
    create policy staff_assignment_tenant on app.staff_assignment
      for all to travelar_app
      using (
        app.tenant_allows(operator_id)
        or (
          hims_desk is not null
          and (
            coalesce(current_setting('app.hims_desk', true), '') = ''
            or hims_desk = current_setting('app.hims_desk', true)
          )
        )
      )
      with check (
        app.tenant_allows(operator_id)
        or (
          hims_desk is not null
          and (
            coalesce(current_setting('app.hims_desk', true), '') = ''
            or hims_desk = current_setting('app.hims_desk', true)
          )
        )
      );
  end if;
end
$$;

grant select, insert, update, delete on app.outbox_event to travelar_app;
grant usage, select on all sequences in schema app to travelar_app;
