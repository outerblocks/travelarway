-- 0021 — Airport rows for the flights From/To picker
--
-- The flights tab asks /api/locations?mode=flights, which only returns kind = airport.
-- Stations, ports and towns already exist; no airport rows were ever imported, so the
-- picker correctly said "No matches found". These are IATA-identified aerodromes, not
-- invented inventory. A successful shop still depends on Travelport returning offers.

insert into app.location (name, code, country_code, kind, slug, is_searchable, is_active, source, notes)
values
  ('Julius Nyerere International Airport (DAR)', 'DAR', 'TZ', 'airport', 'iata-dar', true, true, 'reference', 'IATA DAR'),
  ('Kilimanjaro International Airport (JRO)', 'JRO', 'TZ', 'airport', 'iata-jro', true, true, 'reference', 'IATA JRO'),
  ('Abeid Amani Karume International Airport (ZNZ)', 'ZNZ', 'TZ', 'airport', 'iata-znz', true, true, 'reference', 'IATA ZNZ'),
  ('Mwanza Airport (MWZ)', 'MWZ', 'TZ', 'airport', 'iata-mwz', true, true, 'reference', 'IATA MWZ'),
  ('Arusha Airport (ARK)', 'ARK', 'TZ', 'airport', 'iata-ark', true, true, 'reference', 'IATA ARK'),
  ('Dodoma Airport (DOD)', 'DOD', 'TZ', 'airport', 'iata-dod', true, true, 'reference', 'IATA DOD'),
  ('Songwe Airport (MBI)', 'MBI', 'TZ', 'airport', 'iata-mbi', true, true, 'reference', 'IATA MBI'),
  ('Tanga Airport (TGT)', 'TGT', 'TZ', 'airport', 'iata-tgt', true, true, 'reference', 'IATA TGT'),
  ('Mtwara Airport (MYW)', 'MYW', 'TZ', 'airport', 'iata-myw', true, true, 'reference', 'IATA MYW'),
  ('Iringa Airport (IRI)', 'IRI', 'TZ', 'airport', 'iata-iri', true, true, 'reference', 'IATA IRI'),
  ('Bukoba Airport (BKZ)', 'BKZ', 'TZ', 'airport', 'iata-bkz', true, true, 'reference', 'IATA BKZ'),
  ('Pemba Airport (PMA)', 'PMA', 'TZ', 'airport', 'iata-pma', true, true, 'reference', 'IATA PMA'),
  ('Jomo Kenyatta International Airport (NBO)', 'NBO', 'KE', 'airport', 'iata-nbo', true, true, 'reference', 'IATA NBO'),
  ('Wilson Airport (WIL)', 'WIL', 'KE', 'airport', 'iata-wil', true, true, 'reference', 'IATA WIL'),
  ('Moi International Airport (MBA)', 'MBA', 'KE', 'airport', 'iata-mba', true, true, 'reference', 'IATA MBA'),
  ('Entebbe International Airport (EBB)', 'EBB', 'UG', 'airport', 'iata-ebb', true, true, 'reference', 'IATA EBB'),
  ('Addis Ababa Bole International Airport (ADD)', 'ADD', 'ET', 'airport', 'iata-add', true, true, 'reference', 'IATA ADD'),
  ('O.R. Tambo International Airport (JNB)', 'JNB', 'ZA', 'airport', 'iata-jnb', true, true, 'reference', 'IATA JNB')
on conflict (kind, code, country_code) do update
   set name = excluded.name,
       slug = excluded.slug,
       is_searchable = true,
       is_active = true,
       notes = excluded.notes,
       updated_at = now();

grant select on app.location to travelar_app;
