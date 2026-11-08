-- 0011 — Reversed and refunded are post-payment states
--
-- `app.payment` said: `paid_at` is set exactly when the status is `paid` or `unallocated`.
-- That was true while a reversal could not be recorded. Once `reversed`/`refunded` exist,
-- the money did arrive — that is *why* it had to be given back — so `paid_at` must stay set
-- while the status moves on. Without this, recording a reversal failed the constraint and
-- rolled the whole transaction back, leaving an issued ticket for money that went back to
-- the customer.
--
-- `paid_at` now means "money arrived at some point", which is exactly what a reversal
-- needs to remember.

alter table app.payment drop constraint if exists payment_check;

alter table app.payment
  add constraint payment_paid_at_state_chk
  check ((status in ('paid', 'unallocated', 'reversed', 'refunded')) = (paid_at is not null));

comment on column app.payment.paid_at is
  'When the provider confirmed the money arrived. Stays set after a reversal: it records that the money was once received.';
