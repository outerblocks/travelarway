-- 0009 — The index expiry needs
--
-- A booking that is never paid must not stay "pending" forever. The sweeper looks for
-- bookings whose payment window has closed, so the predicate it filters on is the index:
-- a partial index on the deadline keeps that scan proportional to the backlog rather than
-- to every booking the platform has ever taken.
--
-- No new columns: `payment_due_at` and the `expired` status already exist. This migration
-- only makes the query that enforces them cheap.

create index if not exists ix_booking_overdue
  on app.booking (payment_due_at)
  where status = 'pending_payment';

comment on index app.ix_booking_overdue is
  'Backlog of pending bookings for the expiry sweeper; excludes settled history.';
