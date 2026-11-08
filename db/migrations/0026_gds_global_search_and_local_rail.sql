-- 0026 — GDS search is worldwide; TRC SGR and Madaraka stay operator-direct
--
-- Flights and stays resolve locations without a Tanzania country lock. International
-- rail is a separate GDS product and stays BLOCKED until entitlement and a proven
-- request shape exist. Kenya Railways Madaraka Express stations are reference
-- geography only — no invented timetable or fares.

insert into app.location (name, code, country_code, kind, slug, is_searchable, is_active, source, notes)
values
  ('Nairobi Terminus (Madaraka Express)', 'NBO-MAD', 'KE', 'station', 'madaraka-nairobi', true, true, 'reference', 'Kenya Railways Madaraka Express'),
  ('Mombasa Terminus (Madaraka Express)', 'MBA-MAD', 'KE', 'station', 'madaraka-mombasa', true, true, 'reference', 'Kenya Railways Madaraka Express'),
  ('Athi River Station', 'ATHI', 'KE', 'station', 'madaraka-athi-river', true, true, 'reference', 'Kenya Railways Madaraka Express'),
  ('Emali Station', 'EMALI', 'KE', 'station', 'madaraka-emali', true, true, 'reference', 'Kenya Railways Madaraka Express'),
  ('Kibwezi Station', 'KIBWEZI', 'KE', 'station', 'madaraka-kibwezi', true, true, 'reference', 'Kenya Railways Madaraka Express'),
  ('Mtito Andei Station', 'MTITO', 'KE', 'station', 'madaraka-mtito-andei', true, true, 'reference', 'Kenya Railways Madaraka Express'),
  ('Voi Station', 'VOI', 'KE', 'station', 'madaraka-voi', true, true, 'reference', 'Kenya Railways Madaraka Express'),
  ('Mariakani Station', 'MARIAKANI', 'KE', 'station', 'madaraka-mariakani', true, true, 'reference', 'Kenya Railways Madaraka Express')
on conflict (kind, code, country_code) do update
   set name = excluded.name,
       slug = excluded.slug,
       is_searchable = true,
       is_active = true,
       notes = excluded.notes,
       updated_at = now();

insert into app.provider_capabilities
  (provider, product, api_version, operation, status, evidence_note, evidence_date, environment, enabled)
values
  (
    'travelport', 'rail', 'unspecified', 'search', 'BLOCKED',
    'International rail is GDS-scoped and separate from TRC SGR and Kenya Railways Madaraka Express. No Travelar entitlement or proven request shape yet.',
    '2026-11-08', 'PREPROD', false
  ),
  (
    'sabre', 'rail', 'current', 'search', 'BLOCKED',
    'Sabre rail order flow is a sibling contract. Do not mix with TRC SGR or Madaraka Express inventory.',
    '2026-11-08', 'PREPROD', false
  )
on conflict (provider, product, api_version, operation, environment) do nothing;

grant select on app.location to travelar_app;
grant select, insert, update, delete on app.provider_capabilities to travelar_app;
