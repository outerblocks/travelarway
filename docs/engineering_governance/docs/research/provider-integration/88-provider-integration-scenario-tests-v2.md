# 88 — Provider Integration Scenario Tests v2

This matrix supplements Doc 75 with provider-generation-specific tests. It is a plan for execution; no tests are claimed to have passed.

| ID | Provider/product | Scenario | Expected result |
|---|---|---|---|
| TP-001 | Travelport TripServices Flights v11 | One-way shopping using references from current Search response | Request uses current version/header/schema, result fields and private reference IDs persist. |
| TP-002 | Travelport Flights v11 | Return itinerary with connection, adults + child + infant and required child/infant ages | Full passenger/leg mapping is correct; provider certification sample generated. |
| TP-003 | Travelport GDS | Workbench commit creates held reservation | Persist locator, deadline, raw status; do not mark ticketed. |
| TP-004 | Travelport NDC | Provider returns carrier locator and Travelport/passive locator | Both typed references retained and retrievable through correct paths. |
| TP-005 | Travelport GDS vs NDC | FOP supplied at booking vs ticketing | Follow capability-specific required steps; do not apply GDS FOP behavior to NDC. |
| TP-006 | Travelport | Search cache or workbench expiry occurs | Refresh/restart supported workflow; no stale-reference commit. |
| TP-007 | Travelport | Ticketless carrier is enabled | Skip separate ticketing only for an explicitly confirmed capability. |
| TP-008 | Travelport | Two-step commit warns of price/schedule/MCT change where applicable | Surface new detail and get explicit consent before final commit. |
| TP-009 | Travelport | Paid seat/ancillary produces a separate document/payment result | Link correct traveler/segment; ticket and EMD/ancillary states stay distinct. |
| TP-010 | Travelport | Refund/void/exchange response is conditional or asynchronous | Eligibility, quote, deadlines and final status remain distinct; no unsupported success. |
| SAB-001 | Sabre Mosaic | Flight Shop returns ATPCO/NDC/LCC offers within account entitlement | Preserve source/product capability; deduplicate only truly equivalent offers. |
| SAB-002 | Sabre Mosaic | Flight Check reports changed price or unavailable offer | Customer must accept updated terms; no blind create booking. |
| SAB-003 | Sabre Booking Management | Create booking succeeds and fulfillment is pending | Store all booking/order references and ticketing deadline; no ticket claim. |
| SAB-004 | Sabre Fulfillment | Fulfillment call times out | Reconcile order/tickets before repeat; no duplicate fulfillment. |
| SAB-005 | Sabre | Flight Reshop for exchange | Only enabled for eligible order/ticket and supported source; preserve original and replacement offer. |
| SAB-006 | Sabre legacy catalog | Supplied endpoint is deprecated or version not provisioned | CI gate blocks provider activation unless a reviewed compatibility exception exists. |
| SAB-007 | Sabre hotels | Old Get Hotel Avail v4.1 link vs current catalog v5.0.0 | Exact product/version is decided from the account and current documentation; schemas not mixed. |
| SAB-008 | Sabre hotels | Search/Rates API is beta | Cannot mark production-ready unless Sabre explicitly authorizes beta use in production. |
| SAB-009 | Sabre rail | Public docs exist but entitlement/rail agreements absent | Operation remains blocked; no customer sales or production call. |
| AMA-001 | Amadeus | Legacy Self-Service API key/path attempted for new integration | Integration is blocked; route to Amadeus Enterprise access workflow. |
| AMA-002 | Amadeus Enterprise | Current API catalogue/product/schema not yet provided | Capability remains unknown/mock-only; no guessed DTOs/endpoints. |
| AMA-003 | Amadeus Enterprise | Enterprise API mixes REST/JSON and SOAP/XML operations | Use family-specific adapter/parser/schema validation. |
| AMA-004 | Amadeus Enterprise | Search/booking lifecycle and post-ticket after-sales differs by product | Contract and after-sales ownership matrix must be signed off before checkout. |
| AMA-005 | Amadeus Enterprise | Hotel API content and booking availability are separate products | Never infer bookability, payment collection or servicing from hotel content/search alone. |
| CROSS-001 | All | Provider sends unknown critical status or required field | Do not advance booking/ticket/payment state; redacted evidence and integration case created. |
| CROSS-002 | All | Provider account/agency/point-of-sale context is wrong | Request rejected safely; no credentials or resource identifiers disclosed to customers. |
| CROSS-003 | All | Provider response schema differs from pinned fixture | Contract CI fails or production response is quarantined; update only after review. |
| CROSS-004 | All | Multi-provider search partial failure | Partial result policy and provider coverage telemetry are accurate. |
| CROSS-005 | All | Supplier reservation created but customer payment state is unknown | Query both systems, route reconciliation and prevent double-booking/recollection. |
| CROSS-006 | All | Customer payment succeeded but fulfillment failed | Keep paid/fulfillment-pending state; create owned case; no false confirmation. |
| CROSS-007 | All | API callback duplicate/out-of-order | Durable inbox and state transition guards prevent duplicate effects. |
| CROSS-008 | All | Contract or API version ends | Stop new use under gate, preserve existing booking retrieval and after-sales path. |

## Evidence per provider operation

Capture: provider and product family/version; docs URL and review date; account entitlement and market; request/response schema source or hash; redacted fixtures; field/status mapping; command/test ID/commit; environment; observed result; trace/correlation IDs; cleanup; reviewer; unresolved risks. For production certification, attach provider-specific approval evidence where required.
