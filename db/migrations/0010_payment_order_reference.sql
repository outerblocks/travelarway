-- 0010 — Our order reference, stored where a callback can find it
--
-- ClickPesa's documentation calls `orderReference` the join key for everything: the
-- collection request, the status query, the webhook and reconciliation. It is ours, not
-- theirs, so it must be generated deliberately and stored — deriving it again at callback
-- time from a PNR would break the moment the derivation changes.
--
-- Two constraints from their API shape this column:
--   * alphanumeric only, maximum 20 characters (a mobile-money provider limit),
--   * unique per payment attempt, not per booking, so a retry is never mistaken for a
--     duplicate charge (their endpoint returns 409 for a reused reference).
--
-- Nullable because rows written before this migration were never sent to a provider and
-- have no reference to claim.

alter table app.payment
  add column if not exists order_reference text;

create unique index if not exists ux_payment_order_reference
  on app.payment (provider, order_reference)
  where order_reference is not null;

comment on column app.payment.order_reference is
  'Our reference for the collection attempt: alphanumeric, <=20 chars, unique per attempt.';
