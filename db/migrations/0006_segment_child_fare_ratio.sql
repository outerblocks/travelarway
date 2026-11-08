-- 0006 — Child fare ratio belongs to the segment, not the browser
--
-- The child discount was a constant inside src/domain/pricing.ts, which meant the price a
-- customer paid was decided by code running on their device. Moving it onto the segment
-- makes the server the authority and lets an operator price children per route, which is
-- how intercity bus tariffs actually differ.
--
-- The default mirrors the value the client used (0.500) so this migration changes no
-- existing price. It relocates the decision; it does not make one.

alter table app.segment_fare
  add column if not exists child_ratio numeric(4,3) not null default 0.500;

do $$ begin
  alter table app.segment_fare
    add constraint segment_fare_child_ratio_chk check (child_ratio >= 0 and child_ratio <= 1);
exception when duplicate_object then null; end $$;

comment on column app.segment_fare.child_ratio is
  'Fraction of the adult segment fare charged for a child. Server-authoritative.';
