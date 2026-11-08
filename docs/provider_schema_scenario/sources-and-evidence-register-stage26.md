# Sources and Evidence Register — Stage 26

**Checked:** 28 October 2026. Public docs can change and do not prove Travelar account entitlements.

## Travelport

- Flights API v11 overview: https://developer.travelport.com/docs/flights — primary source states TripServices Flights v11 is REST/JSON and API references include request/response details and examples.
- Flights API endpoint list: https://developer.travelport.com/docs/flights/general/flights-api-endpoints — endpoint inventory and OAuth 2.0 references.
- Search guide: https://developer.travelport.com/docs/flights/guides/flights-search-guide — journey/leg search structures, catalog offerings, reference lists.
- Booking guide: https://developer.travelport.com/docs/flights/guides/booking-and-reservations/flights-booking-guide — workbench, GDS/NDC distinction, held booking, locators, workflow time limits and option-specific steps.
- Ticketing guide: https://developer.travelport.com/docs/flights/guides/ticketing-guide — distinction between ticketing and booking and retrieval of tickets/documents.
- Required workflow: https://developer.travelport.com/docs/flights/workflows/end-to-end-flows/json-apis-required-full-workflow
- Certification requirements: https://developer.travelport.com/docs/getting-started/ready-to-certify — examples include ADT/CHD/INF with ages for child/infant and round-trip connecting itinerary, among other product-specific criteria.
- Getting started/Stays/Pay navigation: https://developer.travelport.com/docs/getting-started

## Sabre

- Developer Hub and recent product changes: https://developer.sabre.com/ — page checked 28 October 2026; latest-update panel included Booking Management REST v1 (23 Oct 2026), Get Hotel Avail SOAP v5.0.0 (21 Oct 2026), Hotel Search/Rates beta, Structured Fare Rules SOAP v3.0.1 (22 Oct 2026) and Bargain Finder Max Premium SOAP v7.2.0 marked deprecated (15 Oct 2026).
- New-to-Sabre current air workflows: https://developer.sabre.com/product-collection/new-to-sabre/v1/help-documentation/guides.html — Flight Shop, Flight Check, Booking Management and Flight Reshop workflow across ATPCO, NDC and LCC content, subject to the specific offer/account capability.
- NDC product guide: https://developer.sabre.com/product-collection/new-distribution-capability-ndc/v1/index.html
- Current Get Hotel Details page: https://developer.sabre.com/rest-api/get-hotel-details/v2/index.html — v2 page exposes room/rate, pricing/policy and request/response schemas/samples.
- Rail Content Services v2: https://developer.sabre.com/rest-api/content-services-rail/v2/index.html — says access requires special permission and rail-vendor agreements.
- Exact user-supplied Sabre URLs remain in `travelar-user-supplied-urls.txt`; verify each path and product generation before use.

## Amadeus

- Current Enterprise portal: https://developers.amadeus.com/toolbox — page states Self-Service portal is decommissioned on July 17 and current page is for Enterprise APIs, request-based access, sandbox and support.
- Enterprise booking-management/PNR elements: https://developers.amadeus.com/enterprise/category/booking-management/api/pnr-elements — lists Enterprise Flight Create Orders and Flight Order Management and a mixture of REST/SOAP operations.
- Enterprise hotel search/shopping: https://developers.amadeus.com/enterprise/category/hotel/api/search-and-shopping
- Enterprise portal: https://developers.amadeus.com/
- Historical Self-Service FAQ: https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/ — retained as historical context only; not proof of current new-user/production entitlement.
- PhocusWire report dated 9 February 2026: https://phocuswire.com/amadeus-shut-down-self-service-apis-portal-developers — reports that Self-Service API keys would be disabled on 17 July 2026. Secondary confirmation of the official portal notice.

## Standards/tooling

- NestJS OpenAPI integration: https://docs.nestjs.com/openapi/introduction — generates OpenAPI descriptions from the application, supports DTO/decorator/schema approaches. Actual generation must be verified with the repository's chosen validation stack.
- OpenAPI overview: https://www.openapis.org/ — schema/tooling standard; use supported version agreed by tooling.

## Evidence limits

No provider account or Travelar credential was used in this audit. Public documentation establishes product descriptions and some workflows; it does not prove supplier contracts, production access, market coverage, data-use rights, payment rights, ticketing authority or completed certification. Provider schemas should be downloaded/hashed only where authorized by terms; otherwise maintain field mappings and redacted contract fixtures.
