-- 0028 — IATA city rows for stay search (not airports)
--
-- Hotel v11 SearchByCity needs a city code (LON, DXB, DAR). Stay search was offering
-- airport rows first, so "London" and "Dubai" became Heathrow / DXB airport radius
-- searches. These names and codes are IATA city codes, not invented inventory.

insert into app.location (name, code, country_code, kind, slug, is_searchable, is_active, source, notes)
values
  ('Dar es Salaam', 'DAR', 'TZ', 'city', 'iata-city-dar', true, true, 'reference', 'IATA city DAR'),
  ('London', 'LON', 'GB', 'city', 'iata-city-lon', true, true, 'reference', 'IATA city LON'),
  ('Dubai', 'DXB', 'AE', 'city', 'iata-city-dxb', true, true, 'reference', 'IATA city DXB'),
  ('Nairobi', 'NBO', 'KE', 'city', 'iata-city-nbo', true, true, 'reference', 'IATA city NBO'),
  ('Mombasa', 'MBA', 'KE', 'city', 'iata-city-mba', true, true, 'reference', 'IATA city MBA'),
  ('Addis Ababa', 'ADD', 'ET', 'city', 'iata-city-add', true, true, 'reference', 'IATA city ADD'),
  ('Johannesburg', 'JNB', 'ZA', 'city', 'iata-city-jnb', true, true, 'reference', 'IATA city JNB'),
  ('Cape Town', 'CPT', 'ZA', 'city', 'iata-city-cpt', true, true, 'reference', 'IATA city CPT'),
  ('Doha', 'DOH', 'QA', 'city', 'iata-city-doh', true, true, 'reference', 'IATA city DOH'),
  ('Amsterdam', 'AMS', 'NL', 'city', 'iata-city-ams', true, true, 'reference', 'IATA city AMS'),
  ('Paris', 'PAR', 'FR', 'city', 'iata-city-par', true, true, 'reference', 'IATA city PAR'),
  ('Cairo', 'CAI', 'EG', 'city', 'iata-city-cai', true, true, 'reference', 'IATA city CAI'),
  ('Istanbul', 'IST', 'TR', 'city', 'iata-city-ist', true, true, 'reference', 'IATA city IST'),
  ('New York', 'NYC', 'US', 'city', 'iata-city-nyc', true, true, 'reference', 'IATA city NYC'),
  ('Zanzibar', 'ZNZ', 'TZ', 'city', 'iata-city-znz', true, true, 'reference', 'IATA city ZNZ'),
  ('Kampala', 'EBB', 'UG', 'city', 'iata-city-ebb', true, true, 'reference', 'IATA city EBB (Kampala/Entebbe)'),
  ('Kigali', 'KGL', 'RW', 'city', 'iata-city-kgl', true, true, 'reference', 'IATA city KGL'),
  ('Jeddah', 'JED', 'SA', 'city', 'iata-city-jed', true, true, 'reference', 'IATA city JED'),
  ('Abu Dhabi', 'AUH', 'AE', 'city', 'iata-city-auh', true, true, 'reference', 'IATA city AUH'),
  ('Mumbai', 'BOM', 'IN', 'city', 'iata-city-bom', true, true, 'reference', 'IATA city BOM'),
  ('Singapore', 'SIN', 'SG', 'city', 'iata-city-sin', true, true, 'reference', 'IATA city SIN'),
  ('Hong Kong', 'HKG', 'HK', 'city', 'iata-city-hkg', true, true, 'reference', 'IATA city HKG')
on conflict (kind, code, country_code) do update
   set name = excluded.name,
       slug = excluded.slug,
       is_searchable = true,
       is_active = true,
       notes = excluded.notes,
       updated_at = now();
