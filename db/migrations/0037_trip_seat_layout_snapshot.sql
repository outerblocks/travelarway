-- 0037 — Trip keeps the seat-layout version it was sold on
--
-- Vehicles may move to a new published version. Existing trips must keep the geometry
-- passengers already saw. Reseating after an incompatible swap is a later workflow.

alter table app.trip
  add column if not exists seat_layout_id uuid references app.seat_layout (id);

update app.trip t
   set seat_layout_id = v.seat_layout_id
  from app.vehicle v
 where t.vehicle_id = v.id
   and t.seat_layout_id is null
   and v.seat_layout_id is not null;

create index if not exists ix_trip_seat_layout on app.trip (seat_layout_id)
  where seat_layout_id is not null;

comment on column app.trip.seat_layout_id is
  'Layout version copied from the vehicle when the trip was published. Later vehicle edits do not rewrite this.';
