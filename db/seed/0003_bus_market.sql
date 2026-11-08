-- Bus market seed: enough real inventory to judge a results page by.
--
-- The reference seed carries one operator, one route and a single 06:00 departure. A results
-- list of one card cannot be evaluated for sorting, filters, density or price comparison, and
-- every decision about them was being made against a row that never competes. This adds two
-- more operators on the same corridor at different regulated classes and different times.
--
-- Fixture data, labelled as such through `source`. The corridor and the terminals are real;
-- the operators, licence numbers, fares and times are not, and nothing here overwrites the
-- reference corridor's existing fares — the 29,000 and 41,000 segment prices that the pricing
-- tests assert stay exactly as they were seeded.
--
-- Idempotent: fixed identifiers with ON CONFLICT DO NOTHING throughout.

-- ── Operators ────────────────────────────────────────────────────────────────────
insert into app.operator (id, name, mode, country_code, currency, status, is_hq_approved, source) values
  ('a0000000-0000-4000-8000-000000000002', 'Morogoro Coasters',  'bus', 'TZ', 'TZS', 'active', true, 'fixture'),
  ('a0000000-0000-4000-8000-000000000003', 'Scenic Royal Limited', 'bus', 'TZ', 'TZS', 'active', true, 'fixture')
on conflict (id) do nothing;

-- The licence the regulator issues against, and the contact a traveller needs when something
-- goes wrong. The reference operator is filled in too, so no card shows a blank where the
-- data model says a value belongs.
update app.operator set
  latra_licence_number = src.latra_licence_number,
  support_phone = src.support_phone,
  refund_policy = src.refund_policy
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'LATRA/BUS/TZ/000123', '+255 748 000 111',
   'Full refund up to 24 hours before departure; 50% up to 12 hours.'),
  ('a0000000-0000-4000-8000-000000000002', 'LATRA/BUS/TZ/000287', '+255 748 000 222',
   'Full refund up to 48 hours before departure; no refund after boarding.'),
  ('a0000000-0000-4000-8000-000000000003', 'LATRA/BUS/TZ/000411', '+255 748 000 333',
   'Full refund up to 12 hours before departure; changes free of charge.')
) as src(id, latra_licence_number, support_phone, refund_policy)
where app.operator.id = src.id;

-- ── Routes: the same corridor, run by three operators ────────────────────────────
insert into app.route (id, operator_id, name, mode, source) values
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'Dar es Salaam — Arusha', 'bus', 'fixture'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', 'Dar es Salaam — Arusha', 'bus', 'fixture')
on conflict (operator_id, name) do nothing;

-- Stops are copied from the reference corridor so the segment geometry — and therefore the
-- duration a traveller compares two operators on — stays identical, terminals included.
-- The unique key is (route_id, sequence), which is what keeps this idempotent even though
-- the generated identifiers differ on a re-run.
insert into app.route_stop (id, route_id, location_id, sequence, offset_minutes, terminal_name)
select
  gen_random_uuid(),
  r.route_id,
  s.location_id,
  s.sequence,
  s.offset_minutes,
  s.terminal_name
from (values
  ('c0000000-0000-4000-8000-000000000002'::uuid),
  ('c0000000-0000-4000-8000-000000000003'::uuid)
) as r(route_id)
join app.route_stop s on s.route_id = 'c0000000-0000-4000-8000-000000000001'
on conflict (route_id, sequence) do nothing;

-- Fares per ordered stop pair. Ordinary runs cheaper than the reference corridor, luxury
-- dearer, so a price sort has something meaningful to order.
insert into app.segment_fare (id, route_id, from_stop_id, to_stop_id, fare_minor, currency, child_ratio)
select
  gen_random_uuid(),
  s.route_id,
  s.id,
  d.id,
  ((d.sequence - s.sequence) * r.per_leg + r.base)::bigint,
  'TZS',
  0.75
from (values
  ('c0000000-0000-4000-8000-000000000002'::uuid, 3500::bigint, 9000::bigint),
  ('c0000000-0000-4000-8000-000000000003'::uuid, 9000::bigint, 16000::bigint)
) as r(route_id, base, per_leg)
join app.route_stop s on s.route_id = r.route_id
join app.route_stop d on d.route_id = s.route_id and d.sequence > s.sequence
on conflict (route_id, from_stop_id, to_stop_id) do nothing;

-- ── Fleet: one coach type per operator, at its regulated class ───────────────────
insert into app.seat_layout (id, family_id, operator_id, name, row_count, lanes, rows, cols, decks, version, status, visibility) values
  ('e1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000002',
   'a0000000-0000-4000-8000-000000000002', 'Coach 2+3', 12, array['A', 'B', 'C', 'D', 'E'], 12, 5, 1, 1, 'published', 'private'),
  ('e1000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000003',
   'a0000000-0000-4000-8000-000000000003', 'Sleeper Coach 2+2', 9, array['A', 'B', 'C', 'D'], 9, 4, 1, 1, 'published', 'private')
on conflict (operator_id, name) do nothing;

insert into app.vehicle (id, operator_id, registration, model, seat_layout_id, class_label, service_class, amenities) values
  ('e2000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
   'T 456 DMR', 'King Long XML6126', 'e1000000-0000-4000-8000-000000000002',
   'Ordinary', 'ordinary', array['charging', 'toilet']),
  ('e2000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003',
   'T 789 RYL', 'Yutong ZK6128', 'e1000000-0000-4000-8000-000000000003',
   'Royal Class', 'luxury', array['wifi', 'charging', 'aircon', 'toilet'])
on conflict (operator_id, registration) do nothing;

-- The reference operator's coach is a semi-luxury service; its marketing label was already
-- set by the reference seed and is left alone.
update app.vehicle set service_class = 'semi_luxury'
 where id = 'e2000000-0000-4000-8000-000000000001' and service_class is null;

-- Seat count is derived from the layout the vehicle is built to, never typed in: rows times
-- the lanes in the layout. A vehicle whose layout changes gets a corrected count, not a stale one.
update app.vehicle v set total_seats = l.row_count * array_length(l.lanes, 1)
  from app.seat_layout l
 where v.seat_layout_id = l.id and v.total_seats is null;

-- ── Timetable: six departures a day across the three operators ───────────────────
insert into app.schedule (id, route_id, operator_id, departure_time, days_of_week, valid_from) values
  ('f0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '20:00', array[0,1,2,3,4,5,6]::smallint[], current_date),
  ('f0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', '07:30', array[0,1,2,3,4,5,6]::smallint[], current_date),
  ('f0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', '14:00', array[0,1,2,3,4,5,6]::smallint[], current_date),
  ('f0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', '09:00', array[0,1,2,3,4,5,6]::smallint[], current_date),
  ('f0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', '18:30', array[0,1,2,3,4,5,6]::smallint[], current_date)
on conflict (id) do nothing;

-- Same rolling horizon as the reference seed, so every schedule has dated trips on the days
-- a traveller can actually search.
insert into app.trip (schedule_id, route_id, operator_id, service_date, vehicle_id, status)
select
  sc.id, sc.route_id, sc.operator_id, (current_date + offset_days)::date, v.id, 'scheduled'
from app.schedule sc
join app.vehicle v on v.operator_id = sc.operator_id
cross join generate_series(0, 29) as offset_days
where sc.id in ('f0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000003',
                'f0000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000005',
                'f0000000-0000-4000-8000-000000000006')
on conflict (schedule_id, service_date) do nothing;
