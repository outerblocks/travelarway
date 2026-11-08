-- 0004 — Layout ownership is optional
--
-- Public library templates have no owning operator: NULL owner + visibility 'public' is
-- how a system preset is represented. Migration 0003 introduced the concept but left the
-- NOT NULL from 0001 in place, so seeding a preset failed on this constraint.
--
-- Applied as a new migration rather than editing 0003: the runner records a checksum per
-- file and refuses to run a migration that changed after being applied, which is exactly
-- the behaviour that keeps environments reproducible.

alter table app.seat_layout
  alter column operator_id drop not null;

comment on column app.seat_layout.operator_id is
  'Owning operator. NULL means a system template available to every operator.';
