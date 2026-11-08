-- 0013 — Train classes are the operator's, and a seat map belongs to one car
--
-- 0012 added `seat_layout.service_class` with a CHECK listing First Normal, Second Sleeping
-- and Third Normal. Those are the classes of TRC's *conventional* (metre-gauge) trains. The
-- SGR books **Royal Class, Business and Economy** — which this repository already knew: they
-- are in `src/data/sgr.ts`, captured from the operator's own ticketing system. A CHECK that
-- permits the wrong train's classes is worse than no CHECK, because it would reject every
-- correct value and accept none of them.
--
-- The model was also in the wrong place. `app.seat_class` already exists, already carries
-- `operator_id` (null = system-wide), a rank and an active flag, and `seat-map.ts` already
-- joins it to seats. That is where classes belong: data an operator configures, not an
-- enumeration baked into DDL. So the column goes away rather than being re-spelled.
--
-- What replaces it answers the other half of the request. A train is not one seat map: the
-- SGR EMU is eight coaches, each with its own class, its own column count and its own seat
-- numbering, and coach 4 is a 2+2 that is not regular. A layout therefore has to say which
-- trainset it belongs to and which car within it.

alter table app.seat_layout
  drop column if exists service_class;

alter table app.seat_layout
  add column if not exists trainset text,
  add column if not exists coach_no smallint;

alter table app.seat_layout
  drop constraint if exists seat_layout_coach_no_positive_check;
alter table app.seat_layout
  add constraint seat_layout_coach_no_positive_check
  check (coach_no is null or coach_no > 0);

comment on column app.seat_layout.trainset is
  'The rolling stock this layout describes, e.g. TRC_SGR_EMU_8CAR. Grouping key for "seat map by car".';
comment on column app.seat_layout.coach_no is
  'Which car of that trainset. Null for a single-vehicle layout such as a bus or ferry deck.';

-- Bus classes stay as they were: `vehicle.service_class` carries the LATRA Regulation 22
-- category (ordinary, semi_luxury, luxury), which is a property of the coach and is correct.
-- Train classes are per seat, because one train carries several of them at once.

-- A layout is only usable by a trip if exactly one layout exists per car of a trainset;
-- two coaches of the same train sharing a layout would put every passenger in the same seats.
create unique index if not exists ux_seat_layout_trainset_coach
  on app.seat_layout (trainset, coach_no)
  where trainset is not null and coach_no is not null;
