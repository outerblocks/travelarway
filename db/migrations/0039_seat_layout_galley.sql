-- 0039 — Galley (coffee / pantry) as an allow-listed facility cell
--
-- Coaches in the wild put a drinks counter on the rear row next to the toilet.
-- VIP is a seat class, not a cell type.

alter table app.seat_layout_cell drop constraint if exists seat_layout_cell_cell_type_check;

alter table app.seat_layout_cell
  add constraint seat_layout_cell_cell_type_check
  check (cell_type in (
    'seat', 'aisle', 'empty', 'door_front', 'door_mid', 'driver',
    'toilet', 'stairs', 'luggage', 'galley'
  ));
