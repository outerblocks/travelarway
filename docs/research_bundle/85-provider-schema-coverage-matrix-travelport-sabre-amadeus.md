# 85 — Provider Schema Coverage Matrix: Travelport, Sabre, Amadeus and Other Suppliers

**Research date:** 28 October 2026  
**Status:** Required schema inventory and field-mapping plan. Not a set of copied vendor schemas, and not proof of account access.

## 1. Answer to “did we cover the required schema?”

We covered a **canonical domain outline and selected sample response**, not the complete provider-specific schema set. The pack must maintain three separate schema layers:

1. **Provider contract schema:** the exact current request/response format published or delivered by that supplier, per API family/version and enabled operation.
2. **Adapter mapping:** explicit transformations from provider fields/statuses/references to Travelar canonical fields, including source path and loss/ambiguity notes.
3. **Travelar canonical domain/API schema:** stable Travelar-owned contracts used by the website, OIMS, HIMS, agent portal, partner APIs and internal services.

Do not write one universal DTO that pretends GDS, NDC, hotels, buses, trains and activities have identical semantics. Use common fields plus typed mode-specific objects and a governed provider-extension area. All public fields must be mapped deliberately; preserve meaningful supplier capabilities that are not represented in the common model.

## 2. Provider status and documentation paths

### Travelport

The current official page describes **TripServices Flights API v11** as REST/JSON and links per-operation API references with object details, accepted values and examples. Travelport also has separate Stays and Pay products and a legacy developer portal/Universal API surface. Do not mix TripServices v11 schema with Universal API SOAP/XML or legacy endpoints in the same adapter.

Current starting points:
- Flights v11: https://developer.travelport.com/docs/flights
- Flights API endpoint inventory: https://developer.travelport.com/docs/flights/general/flights-api-endpoints
- Flights search guide: https://developer.travelport.com/docs/flights/guides/flights-search-guide
- Booking guide: https://developer.travelport.com/docs/flights/guides/booking-and-reservations/flights-booking-guide
- Ticketing guide: https://developer.travelport.com/docs/flights/guides/ticketing-guide
- Exchange/refund/void guide: https://developer.travelport.com/docs/flights/guides/exchange-refund-and-void-guide
- API getting-started and Stays references: https://developer.travelport.com/docs/getting-started
- Certification requirements: https://developer.travelport.com/docs/getting-started/ready-to-certify — Travelport says production access is based on contracted APIs, requires at least 15 days’ notice before planned production move, and asks for request/response examples for every API and workflow. It also specifies certification examples for ADT/CHD/INF (child and infant ages required), a connecting round trip, multi-guest/multi-room stays, exact content-source selection, endpoint/version/headers and token-refresh documentation.

Documented workflow-specific distinctions include search-cache duration by GDS/NDC content, workbench expiry, held reservation versus ticket issue, GDS versus NDC form-of-payment treatment, differing locator structure for NDC, ticketless-carrier flows, optional seats/ancillaries, and distinct exchange/void/refund paths. Every timing or capability must be represented in a versioned provider capability profile rather than as a platform-wide constant.

### Sabre

The supplied URL list mixes multiple catalog generations and products. Current Sabre public catalog includes the newer **Mosaic air workflow** (Flight Shop, Flight Check, Booking Management, Flight Reshop) and older individually versioned REST/SOAP endpoints. They must be treated as distinct adapter profiles until Sabre confirms an approved migration/compatibility path.

Current starting points:
- Sabre Developer Hub: https://developer.sabre.com/
- New-to-Sabre air workflows: https://developer.sabre.com/product-collection/new-to-sabre/v1/help-documentation/guides.html
- NDC guide: https://developer.sabre.com/product-collection/new-distribution-capability-ndc/v1/index.html
- Hotel details current public page: https://developer.sabre.com/rest-api/get-hotel-details/v2/index.html
- Rail content: https://developer.sabre.com/rest-api/content-services-rail/v2/index.html

As of the research date, the hub's latest-update panel listed Booking Management REST v1 updated 23 October 2026, Get Hotel Avail SOAP v5.0.0 updated 21 October 2026, and Bargain Finder Max Premium SOAP v7.2.0 as deprecated on 15 October 2026. The supplied `Bargain Finder Max v5` REST URL is not the same named product/version as the deprecated BFM Premium SOAP v7.2.0; inspect the exact catalog record and entitlement before making a status claim. Similarly, the supplied Get Hotel Avail v4.1 URL may be an older version than the currently listed v5.0.0 and needs explicit version review.

Rail content requires specific permission and rail-vendor agreements according to Sabre's current Content Services Rail page. Do not infer access from endpoint visibility.

### Amadeus

**Access-path correction:** the current Amadeus for Developers portal says the Self-Service portal was decommissioned on 17 July and redirects to Enterprise APIs. A February 2026 report states Self-Service API keys were disabled on 17 July 2026. The former Self-Service resources may remain indexed or archived; they must not be treated as a new Travelar production integration path without written Amadeus confirmation.

Current starting points:
- Current Enterprise portal: https://developers.amadeus.com/toolbox
- Enterprise hotel search/shopping: https://developers.amadeus.com/enterprise/category/hotel/api/search-and-shopping
- Enterprise booking-management / PNR elements: https://developers.amadeus.com/enterprise/category/booking-management/api/pnr-elements
- Enterprise API access and catalogue: https://developers.amadeus.com/
- Historical Self-Service FAQ (reference only, not current access proof): https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/

Obtain the Enterprise catalogue, current OpenAPI/WSDL/XML schemas, sandbox/environment, authentication model, API versions, product-specific workflows, current market eligibility and commercial terms directly through Amadeus. Enterprise has REST/JSON and SOAP/XML products; do not assume all Amadeus operations share one protocol or schema family. The prior Self-Service flight flow (search → price → create order → order management) is historical reference and is not enough to design current Enterprise operation contracts.

## 3. Required canonical schema families

| Schema family | Minimum fields Travelar must model | Important non-universal/provider-specific details |
|---|---|---|
| `ProviderIntegrationProfile` | provider, product, API family/version, environment, base URL profile, documentation URL/hash, account reference, market/POS, currencies, enabled operations, rate limits, support contact, entitlement evidence, effective dates, owner/approver | Never store secrets inline in a public configuration table; credentials live in a secrets manager and are referenced by ID. |
| `ProviderOperationContract` | operation key, HTTP/SOAP method, path/action, request schema ID/version, response schema ID/version, auth scopes/headers, required references, error schema, idempotency/retry rules, timeout, rate-limit policy | SOAP/WSDL operations and REST/JSON operations need separate contract tooling. |
| `ProviderEvidenceRecord` | URL, accessed date, product/version, schema file hash or source snapshot, license/redistribution note, named reviewer, entitlement confirmation, fixture ID and test environment | Keep legally permitted source/schema artifacts; otherwise preserve link, hash, extracted field map and review record. |
| `SearchRequest` | mode, market, POS, locale, currency, origin/destination, dates, passengers/guests, child ages, room count, route legs, cabin/class/preferences, provider filters | Different modes and provider products support different fields. Validate supported capabilities before sending. |
| `ProviderOfferSnapshot` | Travelar offer ID, provider/product/content source, private provider reference(s), itinerary/property/activity, price components, currency, fare/rate conditions, baggage/ancillaries, refundable/changeable flags when evidenced, freshness/expiry, provider raw status, policy versions | Store supplier references privately. Preserve original provider offer IDs and reference lists where later calls require them. |
| `AirItinerary` / `AirSegment` | origin/destination codes and canonical location IDs, departure/arrival timestamps with offsets, terminal, marketing and operating carrier, flight number, elapsed/layover duration, segment order, aircraft/equipment if provided, connection and stop details | Preserve segment-level baggage, booking class/RBD, fare basis, married-segment restrictions, codeshares and provider reference identity when supplied. |
| `PassengerRequirement` | passenger category, quantity, birth date/age when required, adult-infant relationship, names, contact, document/APIS requirements where legally and operationally required, SSR/accessibility needs | Avoid forcing government ID or passport into every mode. Provider/carrier/market may impose field-specific rules. |
| `FareQuote` | quote ID, issue/expiry, passenger and segment applicability, base, taxes/levies, supplier fees, Travelar service fee/markup/discount, currency, total, rounding rules, fare conditions, ancillary totals, source timestamp | Use decimal-safe money representation. Distinguish informational search price from verified checkout quote and ticketed amount. |
| `ReservationReferenceSet` | Travelar booking ID, provider reservation locator(s), carrier locator, agency/passive locator, order ID, provider booking ID, created time, deadline/expiry, supplier state | Never assume one provider reference per booking; preserve type, issuer, source, sensitivity and lookup operation. |
| `TicketDocument` | document number/type, passenger association, segment/coupon references, issuance status/time, validating carrier, refund/void/exchange status, supplier locator, last provider verification | “Reservation confirmed” must never imply ticket issued. EMDs and other documents must not be modelled as flight tickets. |
| `SeatOffer` / `AncillaryOffer` | traveler association, segment association, seat map ID/version, row/column/seat label, price, currency, paid/free, restrictions, SSR/EMD/document relation, expiration | A seat shown as free or available at search time is not final assignment until the provider confirms. |
| `StayOffer` / `RoomOffer` | provider and property IDs, room/rate-plan ID, number of rooms, adult/child/age occupancy, dates, inclusions, cancellation deadline with timezone, prepay/deposit/guarantee, taxes/fees, property collection vs Travelar collection, content provenance | Availability/content and bookability are separate capabilities. Property ID namespaces may differ across providers. |
| `SupplierActionEligibility` | current reservation/ticket state, available action, eligibility source, fare/rate rules, deadlines, quote and fees, provider capability, required approval, final status | Cancel, void, refund and exchange are separate operations, not interchangeable booleans. |
| `ProviderTransactionEvidence` | operation/correlation/trace ID, provider account, timestamps, response hash, redacted request/response or secure object reference, normalized result, raw result, retry and reconciliation status | Never log tokens, full payment details or unnecessary passenger PII. Limit access and retention for encrypted raw payloads. |
| `CapabilitySnapshot` | operation support state, conditionality, preconditions, API version, market/source/airline/property/channel, data freshness, last tested date, evidence/approval IDs | Unknown is not the same as unsupported; do not enable unverified capability. |

## 4. Operation-by-operation schema inventory (must be completed for each provider/product)

| Operation group | Required inbound schema evidence | Required output/state evidence | Key scenarios |
|---|---|---|---|
| Authentication/token | credential type, token endpoint, scopes/audience, signing/TLS requirements, token response, expiry, rotation | token cache/expiry/error, credential owner | expired token, revoked key, 401/403, clock skew, rotation |
| Location/reference data | city/airport/station/property IDs, code types, locale, timezone, market | provider location mapping and freshness | multiple codes for same city, airport alias, unknown location |
| Air availability/search | origin-destination legs, dates, passenger types and ages, cabin, POS, currency, modifiers | offer segments, fare/brand/terms references, baggage, prices, warnings/errors, expiry/freshness | one-way, return, connecting, multi-city, no results, partial provider failure |
| Price/revalidate/fare rules | original offer reference/full payload, passenger/segments, currency | current price, tax details, rules, available-to-sell/expiry | stale offer, price increase/decrease, new baggage/conditions, unavailable fare |
| Seat map / ancillaries | reservation or offer reference, segment/traveler IDs | seat map, paid/free seat offer, ancillary/EMD details | seat unavailable at commit, paid seat refund, unsupported seat source |
| Reservation create | verified offer/quote, passengers, contacts, required SSR/document data, corporate/agency fields as entitled | provider locator(s), status, deadline, warnings, duplicate locator, provider timestamps | timeout-after-commit, held vs instantly fulfilled, two locators, partial booking |
| Payment/FOP/ticketing/fulfillment | applicable FOP token/reference or payment data under provider's PCI-safe process, ticketing route, document requests | ticket/document IDs, coupon state if available, issue failure, time limit | payment succeeds then ticket fails, issue accepted but response lost, ticketless carrier |
| Retrieve / reconcile | provider locator/order ID, account context | current reservation, ticket/documents and history | Travelar status differs from provider; stale cached state |
| Change/cancel/refund/void/exchange | current booking/ticket, action, passenger/segment scope, reason, current quote/eligibility | new offer/quote, penalties, refund/exchange/void result, ticket documents, final state | action unavailable, quote expired, partial cancellation, involuntary disruption |
| Hotel content/availability | property/location, dates, room count, occupancy and child ages, currency, rate source | room/rate IDs, price breakdown, cancellation policy/timezone, inclusions, availability freshness | multi-room, child age, rate changed, sold out, content stale |
| Hotel reservation/servicing | selected exact room/rate reference, guest details, guarantee/payment model | confirmation IDs, property reference, terms, cancel deadlines and status | booking timeout, hotel confirms but payment unresolved, cancellation/no-show, partial room cancellation |
| Rail/ferry/experience | provider's actual service schema and contract | schedules, fare/class/capacity, ticket/voucher, operator confirmation, action eligibility | sold out, capacity change, seatless class, timed activity, operator cancellation |

## 5. Mapping rules

For each provider field, record:

`canonicalField`, `provider`, `product`, `apiFamily`, `apiVersion`, `operation`, `providerJsonPathOrXmlXPath`, `type`, `requiredWhen`, `enumMapping`, `nullMissingUnsupportedSemantics`, `sensitivity`, `normalizationRule`, `lossOrAmbiguity`, `fixtureId`, `reviewedAt`, `reviewer`.

Never map unknown provider values to a plausible default. Distinguish:
- absent/not returned;
- explicit null;
- unsupported by that provider/account/source;
- unknown because schema/evidence is incomplete;
- not applicable to this mode.

Store provider raw identifiers and statuses alongside canonical values. Normalize business meaning without discarding the source state. All canonical status mappings require tests.

## 6. Version and contract policy

- Pin a provider product/API family and version; do not update an endpoint because its URL looks newer.
- Build a per-operation schema file or adapter-local generated client only when the official/current source and license allow it.
- Where vendor schemas are not publicly accessible, capture documented field maps and create redacted contract fixtures from authorized sandbox responses after access is granted.
- Validate runtime responses at the adapter boundary. Unknown enum/status or incompatible response shape must not advance a financial or booking state.
- Track schema hash, documentation access date, change log and compatibility decision. New required fields, removed fields or changed enum meanings fail contract CI until reviewed.
- Keep raw and canonical models separate. Do not expose vendor raw payloads through Travelar public APIs.
