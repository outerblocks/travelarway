-- 0031 — HIMS finance control system
--
-- ADR-FIN-002 / Doc 43 / Doc 80: mode-isolated subledgers, contract-dated commission,
-- append-only journals, payout intents that do not move money, HQ audit separate from
-- the ledger. ClickPesa payout APIs are not called from this migration or the app
-- without a later human-approved live test.
--
-- Amounts stay in major currency units (same convention as booking.total_minor).
-- Do not mix modes in one journal. Do not treat a provider "accepted" payout as settled.

alter table app.commission_rate
  add column if not exists approval_status text not null default 'approved'
    check (approval_status in ('draft', 'approved', 'rejected')),
  add column if not exists proposed_by text,
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz,
  add column if not exists reason text;

comment on column app.commission_rate.rate is
  'Share of gross due to Travelar under a commission agreement. Per operator and mode. Never a global hardcoded percentage.';

create table if not exists app.booking_commercial (
  booking_id          uuid primary key references app.booking(id) on delete restrict,
  operator_id         uuid not null references app.operator(id),
  mode                text not null,
  currency            char(3) not null,
  commission_rate_id  uuid references app.commission_rate(id),
  rate                numeric(6,5) not null check (rate >= 0 and rate <= 1),
  revenue_type        text not null check (revenue_type in ('commission')),
  gross_minor         bigint not null check (gross_minor >= 0),
  travelar_minor      bigint not null check (travelar_minor >= 0),
  operator_net_minor  bigint not null check (operator_net_minor >= 0),
  captured_at         timestamptz not null default now(),
  check (travelar_minor + operator_net_minor = gross_minor)
);

comment on table app.booking_commercial is
  'Immutable snapshot of the operator agreement applied at sale. Later rate edits do not rewrite this row.';

create table if not exists app.finance_account (
  id     uuid primary key default gen_random_uuid(),
  mode   text not null check (mode in ('bus', 'ferry', 'flights', 'stays', 'train', 'experiences')),
  code   text not null,
  name   text not null,
  kind   text not null check (kind in ('asset', 'liability', 'revenue', 'expense')),
  unique (mode, code)
);

create table if not exists app.journal (
  id           uuid primary key default gen_random_uuid(),
  mode         text not null check (mode in ('bus', 'ferry', 'flights', 'stays', 'train', 'experiences')),
  currency     char(3) not null,
  source_type  text not null,
  source_id    text not null,
  memo         text not null,
  posted_at    timestamptz not null default now(),
  unique (source_type, source_id)
);

create table if not exists app.journal_line (
  id           uuid primary key default gen_random_uuid(),
  journal_id   uuid not null references app.journal(id) on delete restrict,
  account_id   uuid not null references app.finance_account(id),
  operator_id  uuid references app.operator(id),
  debit_minor  bigint not null default 0 check (debit_minor >= 0),
  credit_minor bigint not null default 0 check (credit_minor >= 0),
  check (debit_minor = 0 or credit_minor = 0),
  check (debit_minor + credit_minor > 0)
);

create index if not exists ix_journal_line_journal on app.journal_line (journal_id);
create index if not exists ix_journal_line_account on app.journal_line (account_id);
create index if not exists ix_journal_mode_posted on app.journal (mode, posted_at desc);

create or replace function app.journal_must_balance() returns trigger
language plpgsql as $$
declare
  debit bigint;
  credit bigint;
  line_mode text;
  journal_mode text;
begin
  select coalesce(sum(debit_minor), 0), coalesce(sum(credit_minor), 0)
    into debit, credit
    from app.journal_line
   where journal_id = coalesce(new.journal_id, old.journal_id);
  if debit <> credit then
    raise exception 'journal_unbalanced';
  end if;
  select j.mode into journal_mode from app.journal j
   where j.id = coalesce(new.journal_id, old.journal_id);
  select fa.mode into line_mode from app.finance_account fa
   where fa.id = new.account_id;
  if tg_op <> 'DELETE' and line_mode is distinct from journal_mode then
    raise exception 'journal_mode_mismatch';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_journal_line_balance on app.journal_line;
create constraint trigger trg_journal_line_balance
  after insert or update or delete on app.journal_line
  deferrable initially deferred
  for each row execute function app.journal_must_balance();

create or replace function app.reject_finance_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'finance_record_immutable';
end;
$$;

drop trigger if exists trg_journal_immutable on app.journal;
create trigger trg_journal_immutable
  before update or delete on app.journal
  for each row execute function app.reject_finance_mutation();

drop trigger if exists trg_journal_line_immutable on app.journal_line;
create trigger trg_journal_line_immutable
  before update or delete on app.journal_line
  for each row execute function app.reject_finance_mutation();

drop trigger if exists trg_commercial_immutable on app.booking_commercial;
create trigger trg_commercial_immutable
  before update or delete on app.booking_commercial
  for each row execute function app.reject_finance_mutation();

insert into app.finance_account (mode, code, name, kind)
select m.mode, a.code, a.name, a.kind
  from (values
    ('bus'), ('ferry'), ('flights'), ('stays'), ('train'), ('experiences')
  ) as m(mode)
  cross join (values
    ('1100', 'PSP cash clearing', 'asset'),
    ('2100', 'Operator payable', 'liability'),
    ('2200', 'Unallocated collections', 'liability'),
    ('2300', 'Payout clearing', 'liability'),
    ('4100', 'Travelar commission', 'revenue')
  ) as a(code, name, kind)
on conflict (mode, code) do nothing;

create table if not exists app.payout_beneficiary (
  id              uuid primary key default gen_random_uuid(),
  operator_id     uuid not null references app.operator(id),
  mode            text not null,
  currency        char(3) not null,
  display_name    text not null,
  account_hint    text not null,
  status          text not null default 'cooling'
    check (status in ('cooling', 'approved', 'frozen')),
  cooling_until   timestamptz not null default (now() + interval '24 hours'),
  created_by      text not null,
  created_at      timestamptz not null default now(),
  unique (operator_id, mode, currency)
);

comment on table app.payout_beneficiary is
  'Approved destination for operator payables. Account numbers are stored as a hint only. Cooling period before first use.';

create table if not exists app.payout_batch (
  id              uuid primary key default gen_random_uuid(),
  mode            text not null,
  operator_id     uuid not null references app.operator(id),
  currency        char(3) not null,
  amount_minor    bigint not null check (amount_minor > 0),
  status          text not null
    check (status in ('candidate', 'held', 'prepared', 'approved', 'intent', 'accepted', 'completed', 'failed', 'paused')),
  business_key    text not null unique,
  beneficiary_id  uuid references app.payout_beneficiary(id),
  hold_reason     text,
  prepared_by     text,
  approved_by     text,
  provider        text,
  provider_ref    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (approved_by is null or approved_by <> prepared_by)
);

comment on table app.payout_batch is
  'Payout candidate through intent. accepted is not completed. This table does not dispatch ClickPesa.';

create table if not exists app.payout_pause (
  id         uuid primary key default gen_random_uuid(),
  mode       text,
  reason     text not null,
  owner      text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists app.hq_audit (
  id          bigserial primary key,
  actor       text not null,
  desk        text not null,
  action      text not null,
  object_type text not null,
  object_id   text,
  mode        text,
  diff        jsonb not null default '{}'::jsonb,
  at          timestamptz not null default now()
);

drop trigger if exists trg_hq_audit_immutable on app.hq_audit;
create trigger trg_hq_audit_immutable
  before update or delete on app.hq_audit
  for each row execute function app.reject_finance_mutation();

create index if not exists ix_hq_audit_at on app.hq_audit (at desc);

grant select, insert on app.booking_commercial, app.journal, app.journal_line,
  app.payout_beneficiary, app.payout_batch, app.payout_pause, app.hq_audit to travelar_app;
grant select, insert, update on app.payout_beneficiary, app.payout_batch, app.payout_pause,
  app.commission_rate to travelar_app;
grant select on app.finance_account to travelar_app;
grant usage, select on all sequences in schema app to travelar_app;
