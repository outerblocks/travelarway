-- 0002 — Operator-declared vehicle class and amenities
--
-- The results card shows a class label ("AC Luxury VVIP") and amenity icons. Those are
-- facts the operator declares about a vehicle, not values the UI may invent, so they live
-- here and travel through the API.
--
-- Defaults are empty, not plausible: a vehicle with no declared class shows none, rather
-- than borrowing a neighbour's label.

alter table app.vehicle
  add column if not exists class_label text;

alter table app.vehicle
  add column if not exists amenities text[] not null default '{}'::text[];

comment on column app.vehicle.class_label is
  'Operator-declared service class for this vehicle, e.g. AC Luxury VVIP. Null means undeclared.';
comment on column app.vehicle.amenities is
  'Operator-declared amenity keys (wifi, charging, aircon, toilet). Empty means undeclared.';
