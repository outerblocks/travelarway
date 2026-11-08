-- 0012 — What the regulator says a bus and a train must be able to state
--
-- The results card was asked to show "complete information". Before inventing fields, the
-- two authorities that define this market were consulted, and both are class-based:
--
--   LATRA (Land Transport Regulatory Authority), Regulation 22: intercity and regional bus
--   services are classified as *ordinary*, *semi-luxury* and *luxury*. That is a regulated
--   category, not a marketing name, and it is what an operator's licence is issued against.
--
--   TRC (Tanzania Railways Corporation), the operator of the SGR: passenger services run as
--   Ordinary, Deluxe and Mjini (commuter), and the booking classes offered are First Normal,
--   Second Sleeping and Third Normal — the distinction being seated versus sleeping, not
--   air-conditioning.
--
-- So the earlier assumption of an "AC type" was wrong: comfort is expressed through the
-- class, and air-conditioning is one amenity among several that an operator declares.
--
-- `class_label` stays as the operator's own marketing name ("Executive", "Royal Class"),
-- because customers recognise those and operators choose them. `service_class` is added
-- beside it as the regulated category, which is what filters and comparisons should group on.
-- Everything here is nullable: an operator that has not stated a licence number is shown as
-- not stated, never as a guess.

-- The licence a passenger is relying on when they board, and the two things they can do with
-- it: call the operator, and read what happens to their money if the trip is cancelled.
alter table app.operator
  add column if not exists latra_licence_number text,
  add column if not exists support_phone text,
  add column if not exists refund_policy text;

comment on column app.operator.latra_licence_number is
  'LATRA service licence the operator runs under. Displayed, never assumed.';
comment on column app.operator.support_phone is
  'Operator contact shown on the ticket and when no trips are found.';
comment on column app.operator.refund_policy is
  'Operator-specific refund terms. Falls back to the platform policy when null.';

-- Regulated comfort category (LATRA Regulation 22) plus the seat count a traveller needs to
-- judge "14 of 49 seats left" rather than "14 left".
alter table app.vehicle
  add column if not exists service_class text
    check (service_class in ('ordinary', 'semi_luxury', 'luxury')),
  add column if not exists total_seats integer
    check (total_seats > 0);

comment on column app.vehicle.service_class is
  'LATRA Regulation 22 category: ordinary, semi_luxury or luxury. Distinct from class_label, which is the operator''s marketing name.';
comment on column app.vehicle.total_seats is
  'Seats this vehicle carries. When null the seat layout''s geometry is used instead.';

-- Train classes are named by the operator of the railway, not by us. Kept as a check so an
-- SGR service cannot be labelled with a bus category.
alter table app.seat_layout
  add column if not exists service_class text
    check (service_class in ('first_normal', 'second_sleeping', 'third_normal'));

comment on column app.seat_layout.service_class is
  'SGR booking class (TRC): first normal, second sleeping or third normal. Bus classes live on the vehicle.';
