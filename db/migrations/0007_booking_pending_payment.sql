-- 0007 — A booking may exist before the money does
--
-- Until now a booking was written straight to `issued` the moment the checkout form was
-- submitted, and a ledger row went with it. That records revenue for money nobody has
-- collected: the platform could not tell a real sale from an abandoned checkout, and a
-- reconciliation would "find" income that never reached a bank.
--
-- A booking now starts `pending_payment` and reaches `issued` only when a payment record
-- proves the money arrived. The ledger row moves with it, so revenue and collection are
-- the same event.
--
-- The new label gets its own migration because PostgreSQL refuses to use an enum value in
-- the same transaction that creates it, and every migration here runs inside one.

alter type app.booking_status add value if not exists 'pending_payment';
