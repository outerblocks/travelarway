-- Public coach templates: 2+2 letters with toilet and mid door, 2+2 galley rear,
-- 2+1 VIP, US 3+2, and a two-deck 2+2 with stairs. Numeric 2+2 rear-bench maps
-- already exist as AC Luxury 53 and AC Semi Luxury 57.
-- Idempotent: keyed on layout (family_id, version) and cell/seat primary keys.

insert into app.seat_class (id, operator_id, name, rank)
select 'c1000000-0000-4000-8000-000000000001'::uuid, null, 'VIP', 20
where not exists (
  select 1 from app.seat_class where id = 'c1000000-0000-4000-8000-000000000001'::uuid
);

-- ── 2+2 letters, toilet + mid door ──────────────────────────────────────────────
insert into app.seat_layout
  (id, family_id, version, operator_id, name, description, visibility, rows, cols, decks,
   status, row_count, lanes)
values
  ('d1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 1, null,
   'Coach 2+2 toilet and door',
   '2+2 with letter labels, toilet and mid door on the left, five-seat rear bench.',
   'public', 12, 5, 1, 'published', 12, array['A', 'B', 'C', 'D'])
on conflict (family_id, version) do nothing;

insert into app.seat_layout_cell (layout_id, deck, row, col, cell_type)
select 'd1000000-0000-4000-8000-000000000001'::uuid, 0, 0, 1, 'door_front'
union all select 'd1000000-0000-4000-8000-000000000001'::uuid, 0, 0, 5, 'driver'
union all select 'd1000000-0000-4000-8000-000000000001'::uuid, 0, r, 3, 'aisle' from generate_series(1, 12) r
union all select 'd1000000-0000-4000-8000-000000000001'::uuid, 0, 6, 1, 'toilet'
union all select 'd1000000-0000-4000-8000-000000000001'::uuid, 0, 7, 1, 'door_mid'
on conflict do nothing;

insert into app.seat_layout_seat (layout_id, deck, row, col, label, is_window, is_aisle)
select 'd1000000-0000-4000-8000-000000000001'::uuid, 0, s.row, s.col, s.label, s.col in (1, 5), s.col in (2, 4)
from (
  select r as row, c.col, c.lane || r::text as label
    from generate_series(1, 12) r
    cross join (values (1, 'A'), (2, 'B'), (4, 'C'), (5, 'D')) as c(col, lane)
   where not (r in (6, 7) and c.col = 1)
  union all
  select 12, 3, 'E12'
) s
on conflict do nothing;

-- ── 2+2 rear galley + toilet (no five-seat bench) ────────────────────────────────
insert into app.seat_layout
  (id, family_id, version, operator_id, name, description, visibility, rows, cols, decks,
   status, row_count, lanes)
values
  ('d2000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', 1, null,
   'Coach 2+2 toilet and galley',
   '2+2 with toilet and galley on the last row instead of a rear bench.',
   'public', 11, 5, 1, 'published', 11, array['A', 'B', 'C', 'D'])
on conflict (family_id, version) do nothing;

insert into app.seat_layout_cell (layout_id, deck, row, col, cell_type)
select 'd2000000-0000-4000-8000-000000000001'::uuid, 0, 0, 1, 'door_front'
union all select 'd2000000-0000-4000-8000-000000000001'::uuid, 0, 0, 5, 'driver'
union all select 'd2000000-0000-4000-8000-000000000001'::uuid, 0, r, 3, 'aisle' from generate_series(1, 11) r
union all select 'd2000000-0000-4000-8000-000000000001'::uuid, 0, 11, 1, 'toilet'
union all select 'd2000000-0000-4000-8000-000000000001'::uuid, 0, 11, 2, 'galley'
on conflict do nothing;

insert into app.seat_layout_seat (layout_id, deck, row, col, label, is_window, is_aisle)
select 'd2000000-0000-4000-8000-000000000001'::uuid, 0, r, c.col,
       lpad((((r - 1) * 4) + c.n)::text, 2, '0'),
       c.col in (1, 5), c.col in (2, 4)
  from generate_series(1, 10) r
  cross join (values (1, 1), (2, 2), (4, 3), (5, 4)) as c(col, n)
on conflict do nothing;

-- ── 2+1 VIP (single seat, aisle, pair) ───────────────────────────────────────────
insert into app.seat_layout
  (id, family_id, version, operator_id, name, description, visibility, rows, cols, decks,
   status, row_count, lanes)
values
  ('d3000000-0000-4000-8000-000000000001', 'd3000000-0000-4000-8000-000000000001', 1, null,
   'Coach 2+1 VIP',
   'Executive 2+1 with VIP on the single-seat side, mid door and toilet.',
   'public', 11, 4, 1, 'published', 11, array['A', 'C', 'D'])
on conflict (family_id, version) do nothing;

insert into app.seat_layout_cell (layout_id, deck, row, col, cell_type)
select 'd3000000-0000-4000-8000-000000000001'::uuid, 0, 0, 1, 'door_front'
union all select 'd3000000-0000-4000-8000-000000000001'::uuid, 0, 0, 4, 'driver'
union all select 'd3000000-0000-4000-8000-000000000001'::uuid, 0, r, 2, 'aisle' from generate_series(1, 11) r
union all select 'd3000000-0000-4000-8000-000000000001'::uuid, 0, 6, 1, 'door_mid'
union all select 'd3000000-0000-4000-8000-000000000001'::uuid, 0, 7, 1, 'toilet'
on conflict do nothing;

insert into app.seat_layout_seat (layout_id, deck, row, col, label, seat_class_id, is_window, is_aisle)
select 'd3000000-0000-4000-8000-000000000001'::uuid, 0, r, c.col, r::text || c.lane,
       case when c.col = 1 then 'c1000000-0000-4000-8000-000000000001'::uuid else null end,
       c.col in (1, 4), c.col in (1, 3)
  from generate_series(1, 11) r
  cross join (values (1, 'A'), (3, 'C'), (4, 'D')) as c(col, lane)
 where not (r in (6, 7) and c.col = 1)
on conflict do nothing;

-- ── US-style 3+2 commuter ────────────────────────────────────────────────────────
insert into app.seat_layout
  (id, family_id, version, operator_id, name, description, visibility, rows, cols, decks,
   status, row_count, lanes)
values
  ('d4000000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000001', 1, null,
   'Coach 3+2 commuter',
   'Six-column 3+2 with the aisle in column 4.',
   'public', 12, 6, 1, 'published', 12, array['A', 'B', 'C', 'D', 'E'])
on conflict (family_id, version) do nothing;

insert into app.seat_layout_cell (layout_id, deck, row, col, cell_type)
select 'd4000000-0000-4000-8000-000000000001'::uuid, 0, 0, 1, 'door_front'
union all select 'd4000000-0000-4000-8000-000000000001'::uuid, 0, 0, 6, 'driver'
union all select 'd4000000-0000-4000-8000-000000000001'::uuid, 0, r, 4, 'aisle' from generate_series(1, 12) r
on conflict do nothing;

insert into app.seat_layout_seat (layout_id, deck, row, col, label, is_window, is_aisle)
select 'd4000000-0000-4000-8000-000000000001'::uuid, 0, r, c.col,
       lpad((((r - 1) * 5) + c.n)::text, 2, '0'),
       c.col in (1, 6), c.col in (3, 5)
  from generate_series(1, 12) r
  cross join (values (1, 1), (2, 2), (3, 3), (5, 4), (6, 5)) as c(col, n)
on conflict do nothing;

-- ── Double-deck 2+2 with stairs; upper has no driver ─────────────────────────────
insert into app.seat_layout
  (id, family_id, version, operator_id, name, description, visibility, rows, cols, decks,
   status, row_count, lanes)
values
  ('d5000000-0000-4000-8000-000000000001', 'd5000000-0000-4000-8000-000000000001', 1, null,
   'Coach double deck 2+2',
   'Two 2+2 decks joined by stairs. Lower deck has the driver; upper does not.',
   'public', 9, 5, 2, 'published', 9, array['A', 'B', 'C', 'D'])
on conflict (family_id, version) do nothing;

insert into app.seat_layout_cell (layout_id, deck, row, col, cell_type)
select 'd5000000-0000-4000-8000-000000000001'::uuid, 0, 0, 1, 'door_front'
union all select 'd5000000-0000-4000-8000-000000000001'::uuid, 0, 0, 5, 'driver'
union all select 'd5000000-0000-4000-8000-000000000001'::uuid, d, r, 3, 'aisle'
  from generate_series(0, 1) d, generate_series(1, 9) r
union all select 'd5000000-0000-4000-8000-000000000001'::uuid, d, 5, 1, 'stairs'
  from generate_series(0, 1) d
on conflict do nothing;

insert into app.seat_layout_seat (layout_id, deck, row, col, label, is_window, is_aisle)
select 'd5000000-0000-4000-8000-000000000001'::uuid, d, r, c.col,
       (case when d = 0 then 'L' else 'U' end) || lpad((((r - 1) * 4) + c.n)::text, 2, '0'),
       c.col in (1, 5), c.col in (2, 4)
  from generate_series(0, 1) d
  cross join generate_series(1, 9) r
  cross join (values (1, 1), (2, 2), (4, 3), (5, 4)) as c(col, n)
 where not (r = 5 and c.col = 1)
on conflict do nothing;
