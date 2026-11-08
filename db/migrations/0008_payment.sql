-- 0008 — Payments, and the ticket is born from them
--
-- This migration gives the `pending_payment` state from 0007 something to wait for.
--
-- Three changes, one idea: the seat is reserved by a hold, the customer's intent is a
-- booking, and the sale happens when a provider confirms money. Until then the seat is
-- not sold and no revenue exists.
--
--   * seat_hold.booking_id   — the holds belong to a booking, so a payment can find them
--   * booking.paid_at        — money confirmed, set only from a verified provider result
--   * app.payment            — one row per collection attempt, with the provider's reference
--
-- The old booking check said `issued` and `issued_at` are the same fact. They no longer
-- are: `issued_at` is when the ticket became valid and it must never precede payment.
-- `paid_at` records that money arrived even in the unhappy case where the seat was lost
-- in the meantime — that money is real, it is owed back, and it must not vanish from the
-- record just because no ticket exists to carry it.

-- ── Holds remember their booking ───────────────────────────────────────────────
alter table app.seat_hold
  add column if not exists booking_id uuid references app.booking(id) on delete set null;

create index if not exists ix_seat_hold_booking on app.seat_hold (booking_id);

-- ── Passengers may exist before the sale ──────────────────────────────────────
-- A passenger name and seat intention are captured at checkout, but the seat is not sold
-- yet. ux_seat_sold_once only counts 'active', so a pending passenger does not block a
-- seat — the hold does, and it expires on its own.
do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname
      from pg_constraint
     where conrelid = 'app.booking_passenger'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table app.booking_passenger drop constraint %I', constraint_name);
  end loop;
end $$;

alter table app.booking_passenger
  add constraint booking_passenger_status_chk
  check (status in ('pending', 'active', 'cancelled'));

alter table app.booking_passenger alter column status set default 'pending';

-- ── Booking gains a payment window and a paid timestamp ───────────────────────
alter table app.booking
  add column if not exists paid_at timestamptz,
  add column if not exists payment_due_at timestamptz;

alter table app.booking alter column status set default 'pending_payment';

-- ── Repair the past rather than declare it paid ───────────────────────────────
-- Every booking written before this migration was set to `issued` on form submission,
-- before a payment provider existed. None of them has evidence of payment, so none of them
-- was a sale. They become what they actually are: pending bookings, with no ticket and a
-- lapsed ledger row. Revenue that was never collected must not survive as a number
-- somebody later reads as income.
update app.ledger_entry le
   set status = 'lapsed', issued_at = null
  from app.booking b
 where b.id = le.booking_id
   and b.status = 'issued'
   and b.paid_at is null;

update app.booking_passenger bp
   set status = 'pending'
  from app.booking b
 where b.id = bp.booking_id
   and b.status = 'issued'
   and b.paid_at is null;

update app.booking
   set status = 'pending_payment',
       issued_at = null,
       payment_due_at = created_at + interval '15 minutes'
 where status = 'issued' and paid_at is null;

do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname
      from pg_constraint
     where conrelid = 'app.booking'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%issued_at%'
  loop
    execute format('alter table app.booking drop constraint %I', constraint_name);
  end loop;
end $$;

-- No ticket without money. This is the invariant the whole migration exists for.
alter table app.booking
  add constraint booking_paid_before_issue_chk
  check (issued_at is null or paid_at is not null);

-- An issued booking always has its issue time; a paid booking that lost its seat has no
-- issue time at all, which is exactly how the two cases stay distinguishable.
alter table app.booking
  add constraint booking_issued_has_time_chk
  check (status <> 'issued' or issued_at is not null);

-- ── Payments ──────────────────────────────────────────────────────────────────
-- 'unallocated' is money the provider confirmed that could not be turned into a ticket —
-- the hold expired first, or the seat was taken in the gap. It is not a failure: the
-- customer paid. It is a refund obligation, and it needs to be visible as one instead of
-- being folded into 'failed'.
do $$ begin
  create type app.payment_status as enum (
    'initiated', 'pending', 'paid', 'failed', 'expired', 'unallocated', 'refunded', 'reversed'
  );
exception when duplicate_object then null; end $$;

create table if not exists app.payment (
  id                 uuid primary key default gen_random_uuid(),
  booking_id         uuid not null references app.booking(id) on delete restrict,
  provider           text not null,
  provider_reference text,
  method             text,
  amount_minor       bigint not null check (amount_minor >= 0),
  currency           char(3) not null,
  status             app.payment_status not null default 'initiated',
  failure_code       text,
  raw                jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  paid_at            timestamptz,

  -- A provider reference identifies one collection at the provider. Two bookings must not
  -- be able to claim the same payment, and a retried webhook must land on the same row.
  unique (provider, provider_reference),
  -- Money either arrived or it did not; paid_at is the evidence, not the label.
  check ((status in ('paid', 'unallocated')) = (paid_at is not null))
);

create index if not exists ix_payment_booking on app.payment (booking_id);
create index if not exists ix_payment_paid_at on app.payment (paid_at) where paid_at is not null;

-- One open collection attempt per booking. Without this, two checkout tabs can open two
-- intents and the customer can be charged twice for one set of seats.
create unique index if not exists ux_payment_open_per_booking
  on app.payment (booking_id) where status in ('initiated', 'pending');

comment on table app.payment is
  'One row per collection attempt. paid_at is set only from a verified provider result.';

grant select, insert, update, delete on app.payment to travelar_app;
