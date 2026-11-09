-- 0029 — Search aliases for airport From/To matching
--
-- Official IATA names often omit the place travellers type (Bali, Maldives,
-- Durban). OurAirports municipality, ISO 3166-2 subdivision and keywords hold
-- those labels. This column stores them for matching only; it is not inventory.

alter table app.location
  add column if not exists search_aliases text;

comment on column app.location.search_aliases is
  'Comma-separated OurAirports municipality, subdivision and keywords used when matching the From/To picker. Not a schedule or offer.';
