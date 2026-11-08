-- Reference seed: locations and one bus corridor.
--
-- Idempotent: fixed identifiers plus ON CONFLICT DO NOTHING. The stations are real; the
-- operator, fares and schedule are fixtures and are labelled as such so nothing here can
-- be mistaken for live inventory.

-- ── Locations ───────────────────────────────────────────────────────────────────
insert into app.location (id, name, code, country_code, kind, source) values
  ('b0000000-0000-4000-8000-000000000001', 'Dar es Salaam', 'DAR', 'TZ', 'city',     'reference'),
  ('b0000000-0000-4000-8000-000000000002', 'Morogoro',      'MOR', 'TZ', 'city',     'reference'),
  ('b0000000-0000-4000-8000-000000000003', 'Dodoma',        'DOM', 'TZ', 'city',     'reference'),
  ('b0000000-0000-4000-8000-000000000004', 'Arusha',        'ARK', 'TZ', 'city',     'reference'),
  ('b0000000-0000-4000-8000-000000000005', 'Mbeya',         'MBI', 'TZ', 'city',     'reference'),
  ('b0000000-0000-4000-8000-000000000006', 'Mwanza',        'MWZ', 'TZ', 'city',     'reference')
on conflict (kind, code, country_code) do nothing;

-- ── Operator (fixture) ─────────────────────────────────────────────────────────
insert into app.operator (id, name, mode, country_code, currency, status, is_hq_approved, source)
values ('a0000000-0000-4000-8000-000000000001', 'Kilimanjaro Express', 'bus', 'TZ', 'TZS', 'active', true, 'fixture')
on conflict (id) do nothing;

insert into app.commission_rate (operator_id, mode, rate, revenue_type, effective_from)
select 'a0000000-0000-4000-8000-000000000001', 'bus', 0.08000, 'commission', now()
where not exists (
  select 1 from app.commission_rate
  where operator_id = 'a0000000-0000-4000-8000-000000000001' and mode = 'bus'
);

-- ── Route: Dar es Salaam → Morogoro → Dodoma → Arusha ──────────────────────────
insert into app.route (id, operator_id, name, mode, source)
values ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
        'Dar es Salaam — Arusha', 'bus', 'fixture')
on conflict (operator_id, name) do nothing;

insert into app.route_stop (id, route_id, location_id, sequence, offset_minutes, terminal_name) values
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 0,   0, 'Ubungo Terminal'),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 1, 180, 'Morogoro Bus Stand'),
  ('d0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', 2, 390, 'Dodoma Central'),
  ('d0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000004', 3, 690, 'Arusha Terminal')
on conflict (route_id, sequence) do nothing;

-- Segment fares for every ordered stop pair (fixture pricing, in TZS minor units).
insert into app.segment_fare (id, route_id, from_stop_id, to_stop_id, fare_minor, currency)
select
  gen_random_uuid(),
  s.route_id,
  s.id,
  d.id,
  -- 25,000 per completed leg for the fixture corridor.
  (5000 + 12000 * (d.sequence - s.sequence))::bigint,
  'TZS'
from app.route_stop s
join app.route_stop d on d.route_id = s.route_id and d.sequence > s.sequence
where s.route_id = 'c0000000-0000-4000-8000-000000000001'
on conflict (route_id, from_stop_id, to_stop_id) do nothing;

-- ── Fleet and schedule ─────────────────────────────────────────────────────────
insert into app.seat_layout (id, family_id, operator_id, name, row_count, lanes, rows, cols, decks, version, status, visibility)
values ('e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001',
        'a0000000-0000-4000-8000-000000000001',
        'Coach 2+2', 11, array['A', 'B', 'C', 'D'], 11, 5, 1, 1, 'published', 'private')
on conflict (operator_id, name) do nothing;

insert into app.vehicle (id, operator_id, registration, model, seat_layout_id)
values ('e2000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
        'T 123 ABC', 'Yutong F12', 'e1000000-0000-4000-8000-000000000001')
on conflict (operator_id, registration) do nothing;

insert into app.schedule (id, route_id, operator_id, departure_time, days_of_week, valid_from)
values ('f0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
        'a0000000-0000-4000-8000-000000000001', '06:00', array[0,1,2,3,4,5,6]::smallint[], current_date)
on conflict (id) do nothing;

-- Rolling 30-day horizon of dated trips. Unique (schedule_id, service_date) keeps this
-- idempotent, and the horizon is generated rather than hand-listed.
insert into app.trip (schedule_id, route_id, operator_id, service_date, vehicle_id, status)
select
  'f0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  (current_date + offset_days)::date,
  'e2000000-0000-4000-8000-000000000001',
  'scheduled'
from generate_series(0, 29) as offset_days
on conflict (schedule_id, service_date) do nothing;
