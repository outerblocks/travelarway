-- 0043 — Sabre Mosaic / hotel / rail capability gates
--
-- ADR-GDS-004: Mosaic air, hotel and rail stay separate from each other and from
-- TRC SGR / Madaraka. Rows are BLOCKED. enabled cannot become true without PROVEN
-- evidence_date (provider_capabilities_enable_proven).

insert into app.provider_capabilities
  (provider, product, api_version, operation, status, evidence_note, evidence_date, environment, enabled)
values
  (
    'sabre', 'mosaic-air', 'current', 'revalidate', 'BLOCKED',
    'Mosaic Flight Check is a separate operation from Flight Shop. No CERT contract test yet.',
    '2026-11-10', 'PREPROD', false
  ),
  (
    'sabre', 'mosaic-air', 'current', 'booking', 'BLOCKED',
    'Mosaic createBooking is not search. No passenger/FOP/entitlement evidence yet.',
    '2026-11-10', 'PREPROD', false
  ),
  (
    'sabre', 'mosaic-air', 'current', 'ticketing', 'BLOCKED',
    'Mosaic fulfillFlightTickets is not a PNR create. Agency ticketing authority unverified.',
    '2026-11-10', 'PREPROD', false
  ),
  (
    'sabre', 'hotel', 'current', 'booking', 'BLOCKED',
    'Sabre hotel booking is not implied by hotel search. No account entitlement recorded.',
    '2026-11-10', 'PREPROD', false
  ),
  (
    'sabre', 'rail', 'current', 'booking', 'BLOCKED',
    'Sabre rail prebook/confirm is separate from TRC SGR and Madaraka Express.',
    '2026-11-10', 'PREPROD', false
  )
on conflict (provider, product, api_version, operation, environment) do nothing;
