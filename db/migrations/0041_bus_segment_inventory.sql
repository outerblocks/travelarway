-- 0041 — Bus interval occupancy, stop boarding rights, ferry class counters
--
-- Bus seats are a physical unit occupied across a half-open stop interval [from_seq, to_seq).
-- Adjacent claims that share only an endpoint do not overlap. Whole-trip uniqueness
-- (ux_seat_hold_active / ux_seat_sold_once) cannot express that, so it is replaced by GiST
-- exclusion — the same rule SGR already uses.
--
-- Existing holds and sold seats without a segment are backfilled to the full route so a
-- ticket already issued for "the bus" does not suddenly free intermediate sections.
--
-- Ferry has no numbered seat map. Capacity is a counter on sailing_inventory, not a layout.

create extension if not exists btree_gist;

alter table app.route_stop
  add column if not exists pickup_allowed boolean not null default true,
  add column if not exists dropoff_allowed boolean not null default true;

alter table app.seat_hold
  add column if not exists from_stop_id uuid references app.route_stop(id),
  add column if not exists to_stop_id uuid references app.route_stop(id),
  add column if not exists from_seq integer,
  add column if not exists to_seq integer;

alter table app.booking_passenger
  add column if not exists from_seq integer,
  add column if not exists to_seq integer;

-- Full-route backfill for rows that predate interval occupancy.
update app.seat_hold h
   set from_stop_id = bounds.from_id,
       to_stop_id   = bounds.to_id,
       from_seq     = bounds.min_seq,
       to_seq       = bounds.max_seq
  from (
    select t.id as trip_id,
           first_stop.id as from_id,
           last_stop.id as to_id,
           first_stop.sequence as min_seq,
           case
             when last_stop.sequence > first_stop.sequence then last_stop.sequence
             else first_stop.sequence + 1
           end as max_seq
      from app.trip t
      join lateral (
        select rs.id, rs.sequence from app.route_stop rs
         where rs.route_id = t.route_id order by rs.sequence asc limit 1
      ) first_stop on true
      join lateral (
        select rs.id, rs.sequence from app.route_stop rs
         where rs.route_id = t.route_id order by rs.sequence desc limit 1
      ) last_stop on true
  ) bounds
 where h.trip_id = bounds.trip_id
   and h.from_seq is null;

update app.booking_passenger bp
   set from_stop_id = coalesce(bp.from_stop_id, bounds.from_id),
       to_stop_id   = coalesce(bp.to_stop_id, bounds.to_id),
       from_seq     = bounds.min_seq,
       to_seq       = bounds.max_seq
  from (
    select t.id as trip_id,
           first_stop.id as from_id,
           last_stop.id as to_id,
           first_stop.sequence as min_seq,
           case
             when last_stop.sequence > first_stop.sequence then last_stop.sequence
             else first_stop.sequence + 1
           end as max_seq
      from app.trip t
      join lateral (
        select rs.id, rs.sequence from app.route_stop rs
         where rs.route_id = t.route_id order by rs.sequence asc limit 1
      ) first_stop on true
      join lateral (
        select rs.id, rs.sequence from app.route_stop rs
         where rs.route_id = t.route_id order by rs.sequence desc limit 1
      ) last_stop on true
  ) bounds
 where bp.trip_id = bounds.trip_id
   and bp.seat_no is not null
   and bp.from_seq is null;

alter table app.seat_hold
  alter column from_stop_id set not null,
  alter column to_stop_id set not null,
  alter column from_seq set not null,
  alter column to_seq set not null;

alter table app.seat_hold
  drop constraint if exists seat_hold_interval_chk;
alter table app.seat_hold
  add constraint seat_hold_interval_chk check (to_seq > from_seq);

alter table app.booking_passenger
  drop constraint if exists booking_passenger_interval_chk;
alter table app.booking_passenger
  add constraint booking_passenger_interval_chk check (
    seat_no is null
    or (from_stop_id is not null and to_stop_id is not null
        and from_seq is not null and to_seq is not null and to_seq > from_seq)
  );

-- Unique sold-once only covered status = 'active'. Pending checkout rows could sit on
-- the same seat. Interval exclusion covers pending too, so an unpaid leftover yields
-- to the issued passenger.
update app.booking_passenger pending
   set status = 'cancelled'
  from app.booking_passenger sold
 where pending.trip_id = sold.trip_id
   and pending.seat_no is not null
   and pending.seat_no = sold.seat_no
   and pending.status = 'pending'
   and sold.status = 'active'
   and pending.id <> sold.id;

drop index if exists app.ux_seat_hold_active;
drop index if exists app.ux_seat_sold_once;

alter table app.seat_hold
  drop constraint if exists seat_hold_no_overlap;
alter table app.seat_hold
  add constraint seat_hold_no_overlap
  exclude using gist (
    trip_id with =,
    seat_no with =,
    int4range(from_seq, to_seq, '[)') with &&
  ) where (status = 'active');

alter table app.booking_passenger
  drop constraint if exists booking_passenger_no_overlap;
alter table app.booking_passenger
  add constraint booking_passenger_no_overlap
  exclude using gist (
    trip_id with =,
    seat_no with =,
    int4range(from_seq, to_seq, '[)') with &&
  ) where (seat_no is not null and status in ('pending', 'active'));

alter table app.sailing_inventory
  add column if not exists sold_count integer not null default 0;

update app.sailing_inventory si
   set sold_count = coalesce((
     select count(*)::int
       from app.booking_passenger bp
      where bp.trip_id = si.trip_id
        and bp.vessel_class_id = si.vessel_class_id
        and bp.status in ('pending', 'active')
   ), 0);

alter table app.sailing_inventory
  drop constraint if exists sailing_inventory_sold_chk;
alter table app.sailing_inventory
  add constraint sailing_inventory_sold_chk
  check (sold_count >= 0 and sold_count <= capacity);
