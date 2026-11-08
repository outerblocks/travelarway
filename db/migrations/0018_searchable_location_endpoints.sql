-- 0018 — Searchable location endpoints for bus From/To selection
--
-- This adds the two attributes a search selector needs and nothing else. The 52 records it
-- makes selectable are *possible* endpoints only: they do not assert that any operator runs a
-- service between any two of them, and no route, corridor, schedule or fare is derived from
-- them. A search that finds no trips must say so.
--
-- Reuses `app.location` rather than creating a parallel table, because that entity already
-- holds stations, ports and cities and the bus picker must not end up with a second source of
-- truth for "Dar es Salaam".
--
-- `is_searchable` is separate from `is_active` on purpose. A place stops being offered in
-- search (is_searchable = false) for reasons that have nothing to do with whether it exists
-- (is_active): it may be off the current bus dataset while a rail station at the same town is
-- still live. Collapsing the two would mean hiding a station to hide a bus stop.

alter table app.location
  add column if not exists slug          text,
  add column if not exists is_searchable boolean not null default false;

comment on column app.location.slug is
  'Stable, lower-case identifier supplied by the source dataset (e.g. "dar-es-salaam"). Names change; this is what an import matches on.';

comment on column app.location.is_searchable is
  'Offered in the passenger From/To selectors and operator route origin/destination pickers. Independent of is_active and of any transport actually being scheduled.';

-- Slugs are the import key, so one per country. Partial because most existing rows (stations,
-- properties) have no slug from this dataset and must not collide on null.
create unique index if not exists uq_location_country_slug
  on app.location (country_code, slug) where slug is not null;

-- The picker's query: every searchable place in a country, in name order.
create index if not exists ix_location_searchable
  on app.location (country_code, name) where is_searchable and is_active;

grant select on app.location to travelar_app;
