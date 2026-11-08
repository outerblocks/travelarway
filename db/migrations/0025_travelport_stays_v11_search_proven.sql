-- 0025 — Travelport Stays v11 property search proven on PREPROD
--
-- Evidence (2026-11-08): POST /11/hotel/search/properties/search against
-- api.pp.travelport.net returned PropertiesResponse.Properties.PropertyInfo
-- for SearchByCity DAR and SearchByAirport DAR (32 properties each).
-- SearchByAddress with City + Country only returned VALIDATION SourceCode 1470.
-- Availability, rules, reservation, booking and SearchComplete v12 stay blocked.

update app.provider_capabilities
   set status = 'PROVEN',
       enabled = true,
       evidence_date = date '2026-11-08',
       evidence_note = 'POST hotel/search/properties/search against api.pp.travelport.net returned PropertiesResponse PropertyInfo for SearchByCity DAR and SearchByAirport DAR. SearchByAddress (City+Country) returned VALIDATION 1470. Booking, availability, rules and SearchComplete v12 were not called.'
 where provider = 'travelport'
   and product = 'stays-v11'
   and operation = 'search'
   and environment = 'PREPROD';
