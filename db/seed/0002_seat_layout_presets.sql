-- Seat map presets A and B
--
-- Public system templates (owner NULL) so any operator can adopt them from the library.
-- Labels are stored per seat exactly as specified — the right-hand pair numbers
-- right-to-left in Preset A, and the rear-bench centre seat takes the last number.
-- Idempotent: on conflict do nothing, keyed on (family_id, version).

-- ── Preset A: AC Luxury 53 ─────────────────────────────────────────────────────────
insert into app.seat_layout
  (id, family_id, version, operator_id, name, description, visibility, rows, cols, decks,
   status, row_count, lanes)
values
  ('aa000000-0000-4000-8000-000000000001', 'aa000000-0000-4000-8000-000000000001', 1, null,
   'AC Luxury 53',
   '2+2 rows with a 5-seat rear bench; front door, middle door and toilet on the left.',
   'public', 14, 5, 1, 'published', 14, array['A', 'B', 'C', 'D'])
on conflict (family_id, version) do nothing;

insert into app.seat_layout_cell (layout_id, deck, row, col, cell_type) values
  ('aa000000-0000-4000-8000-000000000001', 0, 0,  1, 'door_front'),
  ('aa000000-0000-4000-8000-000000000001', 0, 0,  5, 'driver'),
  ('aa000000-0000-4000-8000-000000000001', 0, 1,  3, 'aisle'),
  ('aa000000-0000-4000-8000-000000000001', 0, 2,  3, 'aisle'),
  ('aa000000-0000-4000-8000-000000000001', 0, 3,  3, 'aisle'),
  ('aa000000-0000-4000-8000-000000000001', 0, 4,  3, 'aisle'),
  ('aa000000-0000-4000-8000-000000000001', 0, 5,  3, 'aisle'),
  ('aa000000-0000-4000-8000-000000000001', 0, 6,  3, 'aisle'),
  ('aa000000-0000-4000-8000-000000000001', 0, 7,  3, 'aisle'),
  ('aa000000-0000-4000-8000-000000000001', 0, 8,  3, 'aisle'),
  ('aa000000-0000-4000-8000-000000000001', 0, 9,  3, 'aisle'),
  ('aa000000-0000-4000-8000-000000000001', 0, 10, 3, 'aisle'),
  ('aa000000-0000-4000-8000-000000000001', 0, 11, 3, 'aisle'),
  ('aa000000-0000-4000-8000-000000000001', 0, 12, 3, 'aisle'),
  ('aa000000-0000-4000-8000-000000000001', 0, 13, 3, 'aisle'),
  ('aa000000-0000-4000-8000-000000000001', 0, 6,  1, 'toilet'),
  ('aa000000-0000-4000-8000-000000000001', 0, 7,  1, 'door_mid')
on conflict do nothing;

insert into app.seat_layout_seat (layout_id, deck, row, col, label, is_window, is_aisle)
select 'aa000000-0000-4000-8000-000000000001', 0, s.row, s.col, s.label,
       s.col in (1, 5), s.col in (2, 4)
from (values
  (1,1,'01'),(1,2,'02'),(1,4,'04'),(1,5,'03'),
  (2,1,'05'),(2,2,'06'),(2,4,'08'),(2,5,'07'),
  (3,1,'09'),(3,2,'10'),(3,4,'12'),(3,5,'11'),
  (4,1,'13'),(4,2,'14'),(4,4,'16'),(4,5,'15'),
  (5,1,'17'),(5,2,'18'),(5,4,'20'),(5,5,'19'),
  (6,4,'22'),(6,5,'21'),
  (7,4,'24'),(7,5,'23'),
  (8,1,'25'),(8,2,'26'),(8,4,'28'),(8,5,'27'),
  (9,1,'29'),(9,2,'30'),(9,4,'32'),(9,5,'31'),
  (10,1,'33'),(10,2,'34'),(10,4,'36'),(10,5,'35'),
  (11,1,'37'),(11,2,'38'),(11,4,'40'),(11,5,'39'),
  (12,1,'41'),(12,2,'42'),(12,4,'44'),(12,5,'43'),
  (13,1,'45'),(13,2,'46'),(13,4,'48'),(13,5,'47'),
  (14,1,'49'),(14,2,'50'),(14,3,'53'),(14,4,'52'),(14,5,'51')
) as s(row, col, label)
on conflict do nothing;

-- ── Preset B: AC Semi Luxury 57 ───────────────────────────────────────────────────
insert into app.seat_layout
  (id, family_id, version, operator_id, name, description, visibility, rows, cols, decks,
   status, row_count, lanes)
values
  ('bb000000-0000-4000-8000-000000000001', 'bb000000-0000-4000-8000-000000000001', 1, null,
   'AC Semi Luxury 57',
   '2+2 rows with a 5-seat rear bench; front door and driver only, no middle door or toilet.',
   'public', 14, 5, 1, 'published', 14, array['A', 'B', 'C', 'D'])
on conflict (family_id, version) do nothing;

insert into app.seat_layout_cell (layout_id, deck, row, col, cell_type) values
  ('bb000000-0000-4000-8000-000000000001', 0, 0,  1, 'door_front'),
  ('bb000000-0000-4000-8000-000000000001', 0, 0,  5, 'driver'),
  ('bb000000-0000-4000-8000-000000000001', 0, 1,  3, 'aisle'),
  ('bb000000-0000-4000-8000-000000000001', 0, 2,  3, 'aisle'),
  ('bb000000-0000-4000-8000-000000000001', 0, 3,  3, 'aisle'),
  ('bb000000-0000-4000-8000-000000000001', 0, 4,  3, 'aisle'),
  ('bb000000-0000-4000-8000-000000000001', 0, 5,  3, 'aisle'),
  ('bb000000-0000-4000-8000-000000000001', 0, 6,  3, 'aisle'),
  ('bb000000-0000-4000-8000-000000000001', 0, 7,  3, 'aisle'),
  ('bb000000-0000-4000-8000-000000000001', 0, 8,  3, 'aisle'),
  ('bb000000-0000-4000-8000-000000000001', 0, 9,  3, 'aisle'),
  ('bb000000-0000-4000-8000-000000000001', 0, 10, 3, 'aisle'),
  ('bb000000-0000-4000-8000-000000000001', 0, 11, 3, 'aisle'),
  ('bb000000-0000-4000-8000-000000000001', 0, 12, 3, 'aisle'),
  ('bb000000-0000-4000-8000-000000000001', 0, 13, 3, 'aisle')
on conflict do nothing;

insert into app.seat_layout_seat (layout_id, deck, row, col, label, is_window, is_aisle)
select 'bb000000-0000-4000-8000-000000000001', 0, s.row, s.col, s.label,
       s.col in (1, 5), s.col in (2, 4)
from (values
  (1,1,'03'),(1,2,'04'),(1,4,'02'),(1,5,'01'),
  (2,1,'07'),(2,2,'08'),(2,4,'06'),(2,5,'05'),
  (3,1,'11'),(3,2,'12'),(3,4,'10'),(3,5,'09'),
  (4,1,'15'),(4,2,'16'),(4,4,'14'),(4,5,'13'),
  (5,1,'19'),(5,2,'20'),(5,4,'18'),(5,5,'17'),
  (6,1,'23'),(6,2,'24'),(6,4,'22'),(6,5,'21'),
  (7,1,'27'),(7,2,'28'),(7,4,'26'),(7,5,'25'),
  (8,1,'31'),(8,2,'32'),(8,4,'30'),(8,5,'29'),
  (9,1,'35'),(9,2,'36'),(9,4,'34'),(9,5,'33'),
  (10,1,'39'),(10,2,'40'),(10,4,'38'),(10,5,'37'),
  (11,1,'43'),(11,2,'44'),(11,4,'42'),(11,5,'41'),
  (12,1,'47'),(12,2,'48'),(12,4,'46'),(12,5,'45'),
  (13,1,'51'),(13,2,'52'),(13,4,'50'),(13,5,'49'),
  (14,1,'53'),(14,2,'54'),(14,3,'57'),(14,4,'56'),(14,5,'55')
) as s(row, col, label)
on conflict do nothing;

-- ── Assign the sample fleet the AC Luxury 53 layout ─────────────────────────────────
-- The legacy "Coach 2+2" row still exists (it is the converted original), but the sample
-- vehicle declares class AC Luxury VVIP, so it must run the 53-seat map. Leaving it on the
-- old layout would give one bus two geometries.
update app.vehicle
   set seat_layout_id = 'aa000000-0000-4000-8000-000000000001'
 where registration = 'T 123 ABC'
   and seat_layout_id is distinct from 'aa000000-0000-4000-8000-000000000001';
