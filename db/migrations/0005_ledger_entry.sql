-- 0005 — Ledger entries
--
-- One row per document, plus one per reversal. Bus, ferry and train earn commission;
-- flights, stays and experiences earn markup on net. The row keeps both the customer's
-- gross and the supplier's cost, because "revenue" is not "profit" and the two must never
-- be collapsed into a single number somebody later reads as earnings.
--
-- Status follows the document lifecycle: issued on sale, settled by a payout, and
-- voided/refunded by a reversal row rather than an edit. History is append-only.
--
-- Deliberately NOT created yet: settlement tables. A ledger without settlements is
-- incomplete but honest; settlements without a ledger would be fiction.

do $$ begin
  create type app.revenue_type as enum ('commission', 'markup', 'service_fee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app.ledger_status as enum ('held', 'issued', 'settled', 'lapsed', 'voided', 'refunded');
exception when duplicate_object then null; end $$;

create table if not exists app.ledger_entry (
  id                   uuid primary key default gen_random_uuid(),
  booking_id           uuid not null references app.booking(id) on delete restrict,

  -- The document the money belongs to. A booking can produce several (ticket, EMD, voucher).
  document_type        text not null default 'voucher',
  document_number      text not null,

  party_type           text not null check (party_type in ('operator', 'supplier')),
  party_id             uuid,
  mode                 text not null,
  pos_country          char(2),
  fare_basis_type      text check (fare_basis_type in ('base_ticket', 'inclusive_tour')),

  department_id        uuid,
  agent_account_id     uuid,
  account_code         text,

  revenue_type         app.revenue_type not null,
  currency             char(3) not null,

  base_minor           bigint not null default 0 check (base_minor >= 0),
  taxes_minor          bigint not null default 0 check (taxes_minor >= 0),
  fees_minor           bigint not null default 0 check (fees_minor >= 0),
  ancillaries_minor    bigint not null default 0 check (ancillaries_minor >= 0),
  gross_minor          bigint not null check (gross_minor >= 0),

  supplier_cost_minor  bigint not null default 0 check (supplier_cost_minor >= 0),
  costs_minor          bigint not null default 0 check (costs_minor >= 0),
  revenue_minor        bigint not null check (revenue_minor >= 0),

  status               app.ledger_status not null default 'issued',
  settlement_id        uuid,
  reverses             uuid references app.ledger_entry(id),

  held_at              timestamptz,
  issued_at            timestamptz,
  settled_at           timestamptz,
  created_at           timestamptz not null default now(),

  -- The decomposition must add up, or the statement lies.
  check (gross_minor >= base_minor + taxes_minor + fees_minor + ancillaries_minor),
  -- Revenue can never exceed what the customer paid.
  check (revenue_minor <= gross_minor),
  -- A reversal points at an entry; nothing else may.
  check ((status in ('voided', 'refunded')) = (reverses is not null)),
  -- Settled money must have a settlement.
  check ((status = 'settled') <= (settlement_id is not null))
);

create index if not exists ix_ledger_booking on app.ledger_entry (booking_id);
create index if not exists ix_ledger_party_mode on app.ledger_entry (party_id, mode, status);
create index if not exists ix_ledger_unsettled on app.ledger_entry (created_at)
  where status = 'issued';

-- One revenue row per booking document for now: a booking that issues the same document
-- twice would double-count revenue, which is the failure this index prevents.
create unique index if not exists ux_ledger_document
  on app.ledger_entry (document_type, document_number)
  where reverses is null;

comment on table app.ledger_entry is
  'Append-only revenue record. Reversals are new rows with reverses set, never edits.';

grant select, insert, update, delete on app.ledger_entry to travelar_app;
