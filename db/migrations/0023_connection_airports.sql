-- 0023 — Connection airports seen on Travelport LHR–DAR shops
--
-- Search still uses whatever IATA Travelport returns. These rows only give the
-- details panel a stored name and country for hubs that were missing from 0021/0022.

insert into app.location (name, code, country_code, kind, slug, is_searchable, is_active, source, notes)
values
  ('London Stansted (STN)', 'STN', 'GB', 'airport', 'iata-stn', true, true, 'reference', 'IATA STN'),
  ('Hamad International Airport (DOH)', 'DOH', 'QA', 'airport', 'iata-doh', true, true, 'reference', 'IATA DOH'),
  ('Cairo International Airport (CAI)', 'CAI', 'EG', 'airport', 'iata-cai', true, true, 'reference', 'IATA CAI'),
  ('Muscat International Airport (MCT)', 'MCT', 'OM', 'airport', 'iata-mct', true, true, 'reference', 'IATA MCT'),
  ('Kigali International Airport (KGL)', 'KGL', 'RW', 'airport', 'iata-kgl', true, true, 'reference', 'IATA KGL'),
  ('Adolfo Suárez Madrid-Barajas (MAD)', 'MAD', 'ES', 'airport', 'iata-mad', true, true, 'reference', 'IATA MAD'),
  ('Milan Malpensa Airport (MXP)', 'MXP', 'IT', 'airport', 'iata-mxp', true, true, 'reference', 'IATA MXP'),
  ('Josep Tarradellas Barcelona-El Prat (BCN)', 'BCN', 'ES', 'airport', 'iata-bcn', true, true, 'reference', 'IATA BCN')
on conflict (kind, code, country_code) do update
   set name = excluded.name,
       slug = excluded.slug,
       is_searchable = true,
       is_active = true,
       notes = excluded.notes,
       updated_at = now();

grant select on app.location to travelar_app;
