# Sources and Evidence Register — Stage 27

**Cut-off:** 28 October 2026.  
**Scope:** Owner-supplied Travelport Stays and Sabre booking/servicing documentation plus official current pages checked for workflow and version status.

| Evidence ID | Source | Evidence captured | Confidence / caveat |
|---|---|---|---|
| ST-01 | https://developer.travelport.com/docs/stays | Stays API overview titled v11; current docs sections include guides, API references, workflows. | Primary documentation; does not prove account entitlement. |
| ST-02 | https://developer.travelport.com/docs/stays/guides/stays-general-guide | v11 workflow and SearchComplete v12 behavior; search/availability limits and volatile booking inventory. | Primary documentation; contains rollout-language mismatch with migration page. |
| ST-03 | https://developer.travelport.com/docs/stays/guides/migration/stays-search-v11-to-search-complete | SearchComplete described as redesigned v12 search with richer data and cache behavior. | Primary documentation; verify current supported status and provisioned rights. |
| ST-04 | https://developer.travelport.com/docs/stays/general/common-stays-api-headers | OAuth, 24-hour token, common headers, access group, optional tracking header. | Primary documentation. |
| ST-05 | https://developer.travelport.com/docs/stays/general/stays-api-endpoints | v11/v12 base path overview and OAuth endpoint URLs. | Primary documentation; verify current environment and product entitlements. |
| ST-06 | https://developer.travelport.com/docs/stays/general/trace-and-transaction-ids | Version-specific trace ID headers; transactionId not for customer display. | Primary documentation. |
| ST-07 | https://developer.travelport.com/docs/stays/use-cases/booking-stays/book-single-or-multiple-rooms | Multi-room booking and traveler data requirements. | Primary documentation; exact field mappings require fixtures. |
| ST-08 | https://developer.travelport.com/docs/stays/use-cases/modifying-reservations/cancel-a-reservation | Cancellation uses reservation/aggregator locator; multiple locator codes may exist. | Primary documentation. |
| ST-09 | https://developer.travelport.com/docs/stays/general/stays-api-error-messaging | Error categories, source and retry guidance examples. | Primary documentation; map actual response schemas and versions. |
| SB-01 | https://developer.sabre.com/product-collection/new-to-sabre/v1/help-documentation/guides.html | Current Mosaic air flow Flight Shop -> Flight Check -> Create Booking -> Fulfill; optional Reshop; LCC and NDC deviations. | Primary documentation; account content entitlements required. |
| SB-02 | https://developer.sabre.com/product-collection/new-distribution-capability-ndc/v1/index.html | NDC offer/order APIs and servicing capabilities by operation. | Primary documentation; airline-specific variability and entitlement. |
| SB-03 | https://developer.sabre.com/product-collection/passenger-name-record-pnr-collection/v1/index.html | PNR APIs with both REST and SOAP versions, booking and retrieval functions. | Primary documentation; not interchangeable with Mosaic without mapping. |
| SB-04 | https://developer.sabre.com/rest-api/stateless-seats-api/1.4 | Seat shop, passenger-specific availability/pricing and seat add/change/remove flows. | Primary documentation; exact airline/content support varies. |
| SB-05 | https://developer.sabre.com/rest-api/content-services-rail/v2/index.html | Search and prebook reservation lifecycle for rail. | Primary documentation; vendor/market support must be confirmed. |
| SB-06 | https://developer.sabre.com/guide/rail-reservation/rail-reservation.html | Rail prebook, confirm, tickets, travel documents, cancel/void/refund/exchange workflows. | Primary documentation. |
| SB-07 | https://developer.sabre.com/product-collection/mcp-server/1.0/help-documentation/setup.html | Try it Out search-only vs CERT/PROD, OAuth bearer token and product order gate. | Primary documentation; production product is contract-gated. |
| SB-08 | https://developer.sabre.com/ | Recent API Hub version update listings; notes Booking Management update and some Beta/deprecated products. | Dynamic source: re-check at each integration release. |

## Key uncertainty register

- Travelport SearchComplete v12 rollout wording must be reconciled against current release notes and the actual provisioned access group.
- The complete current Sabre `air-booking.html` and related legacy guide content must be checked against the current Mosaic products and any required existing contract. Do not assume the owner-supplied path is the recommended version for new work.
- Travelport and Sabre account entitlements, production access, supplier markets, airline content, ticketing authority, FOP/funding and certification are unknown until the provider confirms in writing.
- The user-supplied list is not itself a schema. Exact request/response contracts must come from API references or provider-issued OpenAPI/JSON Schema/example payloads.

## Browse source refs for response citation

- Travelport guide: `turn121368view2`; headers: `turn121368view9`; endpoint page: `turn121368view10`; SearchComplete model: `turn121368view7`; multi-room use case: `turn121368view5`; cancellation: `turn121368view6`; error categories: `turn121368view8`; trace ID details: `turn637481search1`.
- Sabre current Mosaic flow: `turn499464search0`; current hub updates: `turn499464search10`; NDC product catalog: `turn614860search3`; rail: `turn499464search1` / `turn499464search7`; seat pricing: `turn614860search5`; MCP access: `turn637481search2`.
