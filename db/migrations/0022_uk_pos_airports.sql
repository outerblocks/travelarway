-- 0022 — Airports useful on the Travelport EMEA:UK / GBP preprod branch
--
-- The welcome mail prices GBP from a UK point of sale. Tanzanian IATA rows remain;
-- these additional hubs match carriers on that test catalog (BA, AA, UA, QF, SQ, LH, KE).

insert into app.location (name, code, country_code, kind, slug, is_searchable, is_active, source, notes)
values
  ('London Heathrow (LHR)', 'LHR', 'GB', 'airport', 'iata-lhr', true, true, 'reference', 'IATA LHR'),
  ('London Gatwick (LGW)', 'LGW', 'GB', 'airport', 'iata-lgw', true, true, 'reference', 'IATA LGW'),
  ('London City (LCY)', 'LCY', 'GB', 'airport', 'iata-lcy', true, true, 'reference', 'IATA LCY'),
  ('Manchester Airport (MAN)', 'MAN', 'GB', 'airport', 'iata-man', true, true, 'reference', 'IATA MAN'),
  ('Edinburgh Airport (EDI)', 'EDI', 'GB', 'airport', 'iata-edi', true, true, 'reference', 'IATA EDI'),
  ('John F. Kennedy International Airport (JFK)', 'JFK', 'US', 'airport', 'iata-jfk', true, true, 'reference', 'IATA JFK'),
  ('Newark Liberty International Airport (EWR)', 'EWR', 'US', 'airport', 'iata-ewr', true, true, 'reference', 'IATA EWR'),
  ('Los Angeles International Airport (LAX)', 'LAX', 'US', 'airport', 'iata-lax', true, true, 'reference', 'IATA LAX'),
  ('Singapore Changi Airport (SIN)', 'SIN', 'SG', 'airport', 'iata-sin', true, true, 'reference', 'IATA SIN'),
  ('Sydney Kingsford Smith Airport (SYD)', 'SYD', 'AU', 'airport', 'iata-syd', true, true, 'reference', 'IATA SYD'),
  ('Frankfurt Airport (FRA)', 'FRA', 'DE', 'airport', 'iata-fra', true, true, 'reference', 'IATA FRA'),
  ('Incheon International Airport (ICN)', 'ICN', 'KR', 'airport', 'iata-icn', true, true, 'reference', 'IATA ICN'),
  ('Dubai International Airport (DXB)', 'DXB', 'AE', 'airport', 'iata-dxb', true, true, 'reference', 'IATA DXB'),
  ('Amsterdam Schiphol Airport (AMS)', 'AMS', 'NL', 'airport', 'iata-ams', true, true, 'reference', 'IATA AMS'),
  ('Paris Charles de Gaulle Airport (CDG)', 'CDG', 'FR', 'airport', 'iata-cdg', true, true, 'reference', 'IATA CDG')
on conflict (kind, code, country_code) do update
   set name = excluded.name,
       slug = excluded.slug,
       is_searchable = true,
       is_active = true,
       notes = excluded.notes,
       updated_at = now();

grant select on app.location to travelar_app;
