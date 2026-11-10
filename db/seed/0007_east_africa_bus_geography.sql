-- East African bus geography: searchable cities, EAC/SADC border posts, corridor
-- *references*. No operators, no trips, no fares. A From/To pair that finds zero
-- trips must stay empty until a licensed operator is onboarded.

insert into app.location (name, code, country_code, kind, slug, is_searchable, is_active, source, notes)
values
  ('Lilongwe', 'LLW', 'MW', 'city', 'iata-city-llw', true, true, 'reference', 'IATA city LLW. Searchable bus endpoint; no Travelar inventory.'),
  ('Blantyre', 'BLZ', 'MW', 'city', 'iata-city-blz', true, true, 'reference', 'IATA city BLZ. Searchable bus endpoint; no Travelar inventory.')
on conflict (kind, code, country_code) do update
   set is_searchable = true,
       is_active = true,
       notes = excluded.notes,
       updated_at = now();

-- Existing IATA city rows (0028) for Nairobi, Mombasa, Kampala, Kigali, Addis Ababa
-- stay searchable. Bus search no longer forces country=TZ, so they become From/To
-- vocabulary without becoming timetables.

insert into app.border_post (id, code, name, country_a, country_b, counterpart_name, instrument, source_name, source_url, is_osbp)
values
  ('aa000000-0000-4000-8000-000000000001', 'NAMANGA', 'Namanga', 'KE', 'TZ', 'Namanga',
   'EAC One Stop Border Posts Act 2016 schedule', 'EAC OSBP Act 2016',
   'https://www.eac.int/travelling-within-the-eac', true),
  ('aa000000-0000-4000-8000-000000000002', 'HOLILI_TAVETA', 'Holili', 'KE', 'TZ', 'Taveta',
   'EAC One Stop Border Posts Act 2016 schedule', 'EAC OSBP Act 2016',
   'https://www.eac.int/travelling-within-the-eac', true),
  ('aa000000-0000-4000-8000-000000000003', 'SIRARI_ISEBANIA', 'Sirari', 'KE', 'TZ', 'Isebania',
   'EAC One Stop Border Posts Act 2016 schedule', 'EAC OSBP Act 2016',
   'https://www.eac.int/travelling-within-the-eac', true),
  ('aa000000-0000-4000-8000-000000000004', 'LUNGA_HOROHORO', 'Horohoro', 'KE', 'TZ', 'Lunga Lunga',
   'EAC One Stop Border Posts Act 2016 schedule', 'EAC OSBP Act 2016',
   'https://www.eac.int/travelling-within-the-eac', true),
  ('aa000000-0000-4000-8000-000000000005', 'BUSIA_KE_UG', 'Busia', 'KE', 'UG', 'Busia',
   'EAC One Stop Border Posts Act 2016 schedule', 'EAC OSBP Act 2016',
   'https://kentrade.go.ke/blog-post/what-you-need-to-know-when-crossing-east-africa-community-trade-border-posts', true),
  ('aa000000-0000-4000-8000-000000000006', 'MALABA', 'Malaba', 'KE', 'UG', 'Malaba',
   'EAC One Stop Border Posts Act 2016 schedule', 'EAC OSBP Act 2016',
   'https://www.eac.int/travelling-within-the-eac', true),
  ('aa000000-0000-4000-8000-000000000007', 'MUTUKULA', 'Mutukula', 'TZ', 'UG', 'Mutukula',
   'EAC One Stop Border Posts Act 2016 schedule', 'EAC OSBP Act 2016',
   'https://www.eac.int/travelling-within-the-eac', true),
  ('aa000000-0000-4000-8000-000000000008', 'RUSUMO', 'Rusumo', 'RW', 'TZ', 'Rusumo',
   'EAC One Stop Border Posts Act 2016 schedule', 'EAC OSBP Act 2016',
   'https://www.eac.int/travelling-within-the-eac', true),
  ('aa000000-0000-4000-8000-000000000009', 'SONGWE_KASUMULU', 'Songwe', 'MW', 'TZ', 'Kasumulu',
   'Not on the EAC OSBP Act 2016 schedule. Malawi Revenue Authority / LogCluster LCA.',
   'WFP Logistics Cluster Malawi 2.3.1 Songwe Land Border Crossing',
   'https://lca.logcluster.org/malawi-231-songwe-land-border-crossing', false)
on conflict (code) do nothing;

-- Corridor class only. verification_status UNVERIFIED: the border exists; Travelar
-- has no licensed operator or dated trips on these pairs.
insert into app.route_corridor (
  origin_location_id, destination_location_id, mode, country_code,
  origin_country_code, destination_country_code, border_post_id,
  via_description, source_name, source_url, verification_status, is_active, note
)
select
  o.id, d.id, 'bus', 'KE', 'KE', 'TZ', 'aa000000-0000-4000-8000-000000000001',
  'Namanga OSBP',
  'EAC travelling-within-the-EAC; Namanga listed as Kenya–Tanzania port of entry',
  'https://www.eac.int/travelling-within-the-eac',
  'UNVERIFIED', true,
  'Reference corridor class Nairobi–Dar es Salaam via Namanga. Not operator inventory.'
from app.location o, app.location d
where o.kind = 'city' and o.code = 'NBO' and o.country_code = 'KE'
  and d.kind = 'city' and d.code = 'DAR' and d.country_code = 'TZ'
  and not exists (
    select 1 from app.route_corridor c
    where c.origin_location_id = o.id and c.destination_location_id = d.id
      and c.mode = 'bus' and coalesce(c.via_description, '') = 'Namanga OSBP'
  );

insert into app.route_corridor (
  origin_location_id, destination_location_id, mode, country_code,
  origin_country_code, destination_country_code, border_post_id,
  via_description, source_name, source_url, verification_status, is_active, note
)
select
  o.id, d.id, 'bus', 'KE', 'KE', 'TZ', 'aa000000-0000-4000-8000-000000000004',
  'Lunga Lunga / Horohoro OSBP',
  'EAC OSBP Act 2016 schedule (Lunga Lunga and Horohoro)',
  'https://www.eac.int/travelling-within-the-eac',
  'UNVERIFIED', true,
  'Reference corridor class Mombasa–Dar es Salaam via the coastal OSBP pair. Not operator inventory.'
from app.location o, app.location d
where o.kind = 'city' and o.code = 'MBA' and o.country_code = 'KE'
  and d.kind = 'city' and d.code = 'DAR' and d.country_code = 'TZ'
  and not exists (
    select 1 from app.route_corridor c
    where c.origin_location_id = o.id and c.destination_location_id = d.id
      and c.mode = 'bus' and coalesce(c.via_description, '') = 'Lunga Lunga / Horohoro OSBP'
  );

insert into app.route_corridor (
  origin_location_id, destination_location_id, mode, country_code,
  origin_country_code, destination_country_code, border_post_id,
  via_description, source_name, source_url, verification_status, is_active, note
)
select
  o.id, d.id, 'bus', 'TZ', 'TZ', 'MW', 'aa000000-0000-4000-8000-000000000009',
  'Kasumulu / Songwe',
  'WFP Logistics Cluster Songwe Land Border Crossing (Malawi Songwe, Tanzania Kasumulu)',
  'https://lca.logcluster.org/malawi-231-songwe-land-border-crossing',
  'UNVERIFIED', true,
  'Reference corridor class Dar es Salaam–Malawi via Songwe/Kasumulu. Not operator inventory.'
from app.location o, app.location d
where o.kind = 'city' and o.code = 'DAR' and o.country_code = 'TZ'
  and d.kind = 'city' and d.code = 'LLW' and d.country_code = 'MW'
  and not exists (
    select 1 from app.route_corridor c
    where c.origin_location_id = o.id and c.destination_location_id = d.id
      and c.mode = 'bus' and coalesce(c.via_description, '') = 'Kasumulu / Songwe'
  );
