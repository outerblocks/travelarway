-- 0017 — Geography: regions, stations, ports and corridor references
--
-- Everything a traveller can search for becomes a row, so that opening a new SGR station or
-- a ferry route is data entry in HIMS rather than a code change and a deploy. Until now the
-- station list lived in a TypeScript module, which meant the platform could only ever know
-- about the places someone had already typed into it.
--
-- Three deliberate choices:
--
-- **Region is a table, not a string column.** `app.location` had a free-text region, which
-- cannot be validated and drifts into "Arusha Region", "AR", "arusha" for the same place.
-- A link to a real row makes "all places in Manyara" one query and makes a typo impossible.
--
-- **City and town share a uniqueness rule; station and port do not.** Arusha the settlement
-- and Arusha SGR Station are two different things a traveller can book between, and both
-- must exist. But Arusha-the-city twice is a bug, so settlements are unique by name and
-- other kinds are unique by name *and* kind.
--
-- **Corridors are references, not parents.** The 43 LATRA corridors are a published
-- suggestion of what runs between two places. They are not the national register, and an
-- operator must be able to create a route with no matching corridor — so nothing here points
-- at an operator's route, and no route is required to point back.

-- ── Region ──────────────────────────────────────────────────────────────────────
create table if not exists app.region (
  id                   uuid primary key default gen_random_uuid(),
  country_code         char(2) not null,
  -- The identifier the source itself uses, e.g. 'tz-arusha'. Kept so a re-import can be
  -- matched back to the same row instead of creating a second one.
  code                 text not null,
  name                 text not null,
  administrative_scope text,
  is_active            boolean not null default true,
  source_name          text,
  source_url           text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (country_code, code),
  unique (country_code, name)
);

comment on table app.region is
  'First-level administrative regions, seeded from the national statistics source. A region is search vocabulary, not a bookable place.';

-- ── Places that were missing from the vocabulary ────────────────────────────────
-- 'port' did not exist, so the ferry terminals had nowhere to live; 'town' is what most of
-- the LATRA intercity places actually are.
alter table app.location drop constraint if exists location_kind_check;
alter table app.location add constraint location_kind_check check (
  kind in ('city', 'town', 'station', 'port', 'terminal', 'airport', 'property')
);

-- ── Location lifecycle and links ────────────────────────────────────────────────
-- HIMS deactivates rather than deletes: a place that has tickets sold against it must stay
-- resolvable forever, and a hard delete would take the route with it.
alter table app.location
  add column if not exists region_id  uuid references app.region(id),
  add column if not exists is_active  boolean not null default true,
  add column if not exists notes      text,
  add column if not exists source_url text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists ix_location_region on app.location (region_id) where region_id is not null;
create index if not exists ix_location_kind_active on app.location (kind, is_active, country_code);

-- Settlements are one place per name per country. Without this, importing the LATRA town list
-- next to the existing city rows would quietly create Arusha twice and the search card would
-- offer both.
create unique index if not exists uq_location_settlement_name
  on app.location (country_code, lower(name)) where kind in ('city', 'town');

-- Anything else — station, port, terminal, airport, property — is unique per kind, so
-- "Dar es Salaam" the city and "Dar es Salaam" the port coexist.
create unique index if not exists uq_location_named_place
  on app.location (country_code, lower(name), kind) where kind not in ('city', 'town');

-- ── Corridor references ─────────────────────────────────────────────────────────
create table if not exists app.route_corridor (
  id                    uuid primary key default gen_random_uuid(),
  country_code          char(2) not null,
  origin_location_id    uuid not null references app.location(id),
  destination_location_id uuid not null references app.location(id),
  -- Two corridors between the same pair are distinguished by what they go via: Dar → Arusha
  -- runs both via Chalinze and via Bagamoyo, and they are different journeys.
  via_description       text,
  distance_km           integer check (distance_km is null or distance_km > 0),
  mode                  text not null default 'bus' check (mode in ('bus', 'train', 'ferry')),
  source_name           text not null,
  source_url            text,
  effective_on          date,
  -- 'UNVERIFIED' is the honest default for anything imported rather than confirmed.
  verification_status   text not null default 'UNVERIFIED' check (verification_status in
                          ('VERIFIED', 'UNVERIFIED', 'DISPUTED')),
  is_active             boolean not null default true,
  note                  text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  check (origin_location_id <> destination_location_id)
);

create unique index if not exists uq_route_corridor_pair
  on app.route_corridor (origin_location_id, destination_location_id, mode, coalesce(via_description, ''));

create index if not exists ix_route_corridor_origin on app.route_corridor (origin_location_id) where is_active;

comment on table app.route_corridor is
  'Published corridor references (e.g. the LATRA intercity list). Reference data only: operator routes never have to match one, and this table is not the complete national register.';

-- ── Grants ──────────────────────────────────────────────────────────────────────
-- The application role reads geography and writes nothing to it; HIMS writes go through the
-- migrator-owned path the existing tables already use.
grant select on app.region, app.route_corridor to travelar_app;
grant select on app.location to travelar_app;
