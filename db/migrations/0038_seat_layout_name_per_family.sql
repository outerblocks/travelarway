-- 0038 — Layout versions share a name inside a family
--
-- 0001 unique (operator_id, name) assumed one row per map. Versioning needs the same
-- name on v1 and v2. Identity is (family_id, version).

alter table app.seat_layout
  drop constraint if exists seat_layout_operator_id_name_key;
