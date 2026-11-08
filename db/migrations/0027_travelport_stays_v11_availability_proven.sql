-- 0027 — Travelport Stays v11 property details and availability proven on PREPROD
--
-- Evidence (2026-11-08): GET /11/hotel/search/propertiesdetail returned
-- PropertiesResponse with property images. POST
-- /11/hotel/availability/catalogofferingshospitality returned
-- CatalogOfferingsHospitalityResponse CatalogOffering rows with ProductHospitality
-- RoomType and Price.TotalPrice. Reservation /book/reservations stays blocked.

insert into app.provider_capabilities
  (provider, product, api_version, operation, status, evidence_note, evidence_date, environment, enabled)
values
  (
    'travelport', 'stays-v11', '11', 'property_detail', 'PROVEN',
    'GET hotel/search/propertiesdetail against api.pp.travelport.net returned PropertiesResponse with property Image list for chain/property from a prior v11 search.',
    date '2026-11-08', 'PREPROD', true
  ),
  (
    'travelport', 'stays-v11', '11', 'availability', 'PROVEN',
    'POST hotel/availability/catalogofferingshospitality against api.pp.travelport.net returned CatalogOfferingsHospitalityResponse CatalogOffering with ProductHospitality RoomType and Price.TotalPrice. Booking/reservations was not called.',
    date '2026-11-08', 'PREPROD', true
  )
on conflict (provider, product, api_version, operation, environment) do update
   set status = excluded.status,
       enabled = excluded.enabled,
       evidence_date = excluded.evidence_date,
       evidence_note = excluded.evidence_note,
       updated_at = now();
