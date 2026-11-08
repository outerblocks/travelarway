# 15 — Mode-Specific Search and Booking Field Matrix

**Product:** Travelar · **Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Date:** 24 October 2026 · **Status:** Logical field matrix for validation; not a final API schema.

## 1. Interpretation rules

- **Required for Travelar search** means the customer cannot execute that search without it under the proposed UX. It does not mean every upstream supplier uses the same parameter name.
- **Conditional** means the field appears only when the itinerary, supplier, country, fare or passenger requires it.
- **Supplier-specific** means the API/contract decides the exact shape and whether the operation supports the field. Keep that data in the adapter mapping, not hard-coded into common product logic.
- Persist both normalized values and provider references. Do not discard provider-specific terms, option IDs, price tokens, cancellation conditions, rate tokens, rail fare restrictions or ticketing data.
- On the UI, do not collect high-risk personal data early unless it is required to search or book. Some supplier flows require passenger names before booking; others permit shopping anonymously.

## Product-scope rule for Train and Experiences

Train and Experiences are first-class Travelar modes alongside Bus, Ferry, Flights and Stays. Their fields below are in scope for product design, user journeys, provider adapters and testing now. Per-country HIMS configuration controls whether the mode is transactionally enabled, uses a contractually permitted referral/handoff, or displays an honest unavailability state. A missing public partner API does not downgrade a mode to “future”; it creates a supplier-access blocker and an explicit fulfillment behavior.

## 2. Search matrix for all six modes

| Mode | Required search inputs | Conditional/optional inputs | Results must expose before checkout | Key validation rules |
|---|---|---|---|---|
| **Bus** | Origin stop/city, destination stop/city, travel date, passenger quantity/category where fare depends on age/type | Return date (only where supported), boarding/drop-off point where multiple points exist, seat preference, vehicle class/operator, accessibility needs, promo code | Operator, route and ordered stops, departure/arrival local times, boarding/drop-off, trip/vehicle class if supplied, total currency/amount, seat/segment availability, refund/change policy, source system | Destination must be after origin on the scheduled stop sequence; selected sailing/trip must serve the requested segment; date valid; passenger count within limits; seat available for every overlapping segment. No inference that city-pair is valid merely because the vehicle runs through both cities. |
| **Ferry** | Origin port, destination port, sailing date, passenger categories/counts | Return journey where supported, class, resident/non-resident or other fare category if operator rules require it, passenger ID/residence details at the stage they become necessary | Operator/vessel/sailing where provided, departure/arrival times, port, class, fare breakdown, capacity availability, required documents, baggage and changes/refund terms | Port pair must be served; sailing must be bookable; allocate class capacity atomically; don't create a bus-style seat-map requirement; check route/jurisdiction permits, including Zanzibar scope. |
| **Flights** | Origin airport/city, destination airport/city, departure date, itinerary type, passenger counts by allowed type | Return date, multi-city legs, passenger date of birth/age depending passenger type/provider, cabin, direct-only preference, preferred carrier, max stops, time windows, currency and point-of-sale/market context | Carrier and operating carrier if available, flight numbers, leg sequence, airport, local departure/arrival times, duration if provider returns it, stops, baggage/ancillary inclusions, fare family, taxes and total, currency, change/refund restrictions | Date order and city/airport codes validated; passenger combinations conform to provider; each multi-city leg ordered; shopping result expiration/reprice applied; never add or infer baggage/carry-on benefits without provider data. |
| **Train** | Origin station, destination station, departure date, passenger count/types as supported | Return date, class, time preference, railcard/discount eligibility, age, accessibility, country/operator-specific identity inputs | Operator/train/segments, stations, local times, changes/transfers, fare/class, baggage/accessibility rules if supplied, ticket/document type, refund/change terms, ticketing route/source | Only allow search/booking when an authorized integration or verified official booking handoff exists; valid station pair/date; provider terms and discounts applied only when eligible; no scraping represented as booking API. |
| **Stays** | Destination/property, check-in date, check-out date, adults, room count | Children + each child's age where requested by provider, property/region ID, room preferences, bed type, accessibility, meal, cancellation/refund preference, star/rating/location filters, loyalty/member rate, currency/market/language | Property identity/location, room/occupancy, available rate plan, total stay price, currency, tax/service/property fee breakdown where supplied/required, pay-now/pay-later terms, cancellation deadline and penalties, inclusions and supplier | Check-out after check-in; positive valid occupancy; child age required when provider rules say so; enforce provider room/request limits; perform rate check/preview before booking; show any material rate change and require acceptance. |
| **Experiences** | Destination/activity keyword or category, activity date (or date range when supported), participant count | Age/category distribution, time slot/start time, language, pickup/meeting-point filters, duration, accessibility, private/shared option, transfer needs, time zone | Activity and supplier, selected option, date/time zone and slot, total/currency, participant eligibility, duration, meeting/pickup place, included/excluded items, confirmation/voucher method, cancellation and reschedule terms | Slot and capacity validated; participant ages/rules satisfied; meeting-point/time-zone explicit; activity time not silently converted; supplier access level supports the requested transaction or else referral handoff is explicit. |

## 3. Booking and passenger data matrix

| Field/category | Bus | Ferry | Flights | Train | Stays | Experiences | Rule |
|---|---|---|---|---|---|---|---|
| Contact full name | Usually at booking / operator rules | Operator rules | Commonly required before ticket/order creation; exact format per supplier | Supplier rules | Guest name per room/booking | Lead participant / supplier rules | Validate and preserve original characters; do not force a Western name order globally. |
| Email and phone (with country code) | Contact/receipt, operator dependent | Contact/receipt, operator dependent | Contact required by provider/agency flow | Provider-dependent | Supplier-required lead guest contact | Supplier-dependent | Store separately from passenger identity; validate format; do not assume a verified phone proves passenger identity. |
| Passenger date of birth/age | Conditional by fare/child policy | Conditional fare/ID policy | Required by passenger type/provider; exact date for infant/child/adult rules where needed | Provider-dependent | Children ages are often required for occupancy/pricing | Often age category; exact DOB only where required | Ask when needed; don't collect DOB for every mode by default. |
| Gender/sex | Only when official/provider requirement applies | Only where required | As supplier/airline booking schema requires; implementation must reflect documented options | Only where required | Generally not assumed as default guest field | Only where required | Do not use a single universal gender dropdown as an unquestioned requirement; verify field meaning, allowed codes and purpose. |
| Nationality/country of residence | Only under operator/regulator/fare conditions | May affect fares/document checks | Conditional by ticketing/visa/operational use; not universally required at search | Provider rules | May affect tax/rates at destination; only if required | Supplier-specific | Distinguish citizenship/nationality, residence and issuing country; never conflate them. |
| ID type, number, issuing country | Conditional on legal/operator rule | Conditional on ferry/operator/port requirements | Conditional by route/carrier/security/ticketing requirements | Conditional by railway | Usually not universal for search; check-in rules may differ | Only if supplier needs it | Minimize, encrypt/restrict, mask in support, log no full value. Retention/legal basis requires country review. |
| Passenger category | Adult/child/infant, operator categories | Adult/child/infant and residency classes as configured | Adult/child/infant supported by provider, age rules | Provider-specific fare category | Adults and children + ages per room | Participant category/age | Map the internal category to provider code in adapter with version and validation. |
| Accessibility needs | Optional request unless service rules require | Optional request unless service rules require | Optional special-service request, supplier restrictions apply | Optional special assistance | Property feature/preferences | Activity suitability/accessibility | Do not promise fulfilment until supplier confirms. Keep sensitive health details to the minimum necessary. |
| Emergency/contact person | Only where operationally required | As operator requires | Typically not universal at shopping; provider may require under some flows | Provider rules | Supplier-specific | Supplier-specific | Do not collect universally without a documented reason. |
| Invoice/business tax ID | Only if tax/legal/business sales require | Ditto | Market/fare-specific | Market/operator-specific | Jurisdiction/rate-specific | Jurisdiction/supplier-specific | Configure per market and invoice type; never add a tax ID field just because one provider has it for another country. |
| Marketing consent | Not required for ticket fulfilment | Not required for ticket fulfilment | Not required for ticket fulfilment | Not required for ticket fulfilment | Not required for booking | Not required for booking | Separate opt-in/consent record from necessary service messages and legal basis. |

## 4. Search/result/checkout state matrix

| State | UI behavior | Backend action | Prohibited behavior |
|---|---|---|---|
| Empty search | Explain fields missing; focus first invalid field | No supplier call until required schema validates | Submit guessed/default itinerary silently. |
| Loading | Show clear progress and allow safe cancellation | Create correlation ID; enforce timeout/budget and cancellation handling | Infinite spinner with no recovery path. |
| Partial provider failure | Show available results and accurate note if result set is incomplete, when safe/legal | Record provider failure and health metrics; no false cache success | Label incomplete results “all options.” |
| No results | Suggest safe changes to dates/routes/filters; preserve inputs | Store aggregate diagnostic event without passenger PII | Fabricate sample inventory as a real result. |
| Offer expired / rate changed | Reprice/revalidate, show new amount and material conditions, require acceptance | Refresh with supplier or discard expired provider token | Charge a new amount without explicit acceptance. |
| Seat/class/slot sold out | Explain unavailable and show alternatives | Recheck authoritative inventory or adapter response | Retain a dead hold or issue a ticket against over-capacity inventory. |
| Payment pending/unknown | Explain not yet confirmed; give safe next action, avoid repeat payment | Verify original transaction; reconcile callbacks/retries | Issue a paid ticket based only on redirect or client display. |
| Payment verified but supplier pending | Use a neutral pending/recovery screen and support reference | Resolve supplier state; retry only if idempotent/safe; hold/refund per documented policy | Claim booking is confirmed before supplier confirmation. |
| Booking confirmed, communication pending | Show ticket/voucher in secure web/account flow if legitimately issued; show notification pending | Retry/failover safely; preserve same ticket ID | Create a second ticket to solve delivery failure. |
| Refund pending | Show request status, expected next update only if SLA known | Query/reconcile provider status; retain liability | Tell customer funds returned just because refund request was accepted. |
| Supplier outage/maintenance | Disable new flow or show retry/alternative/referral status; protect existing booking access | Circuit-break new requests under defined policy; maintain after-sales and incident log | Automatically book existing customer through another supplier without explicit repricing/re-consent. |

## 5. Search response normalization contract

All adapters should return a normalized envelope plus provider-specific data:

- `requestId`, `providerId`, `providerProduct`, `market`, `fetchedAt`, `currency`, `locale`, `dataFreshness`/expiry if supplied.
- `offers[]`: stable Travelar search-result ID, provider offer reference/token, mode, itinerary/option summary, component price, taxes/fees as returned, display total, currency, conditions, availability status and required next action (reprice, preview, prebook or book).
- `capabilityFlags`: canSearch, canReprice, canHold, canBook, canIssueTicket/voucher, canRetrieve, canModify, canCancel, canRefund, supportsWebhook/notification, supportsIdempotency (with provider semantics documented).
- `warnings[]` and `limitations[]`, preserving safe provider error codes and data gaps.

Never normalize away conditions that materially change what the customer is buying. A redirect product must be modeled as an offer with `fulfillmentMode=EXTERNAL_REDIRECT` rather than as a Travelar-owned confirmed booking.

## 6. Field configuration policy

A field policy should be versioned by country, mode, provider/supplier, operator/service, passenger type and effective dates. It needs:

- Field identifier, localized label/help, data type, allowed values, validation, required condition and rule source/reference.
- Purpose/legal basis/consent category, whether sent to supplier or regulator, access roles, masking, retention/deletion class and data residency/transfer assessment.
- Provider map and capability prerequisite; if provider does not support a mandatory field/rule, route selection must fail before checkout or select a valid alternative rather than silently drop data.
- Test scenarios for adult/child/infant, international phone numbers, script/diacritics, invalid document format where applicable, multi-room occupancy, multi-city itinerary, differing time zones and a required-field policy changing between quote and book.

## 7. Core acceptance tests

1. Bus passenger books city B to C on a bus A–B–C–D; seat is sellable if B–C is free and is unavailable to conflicting A–D or C–D allocations only when segment overlap exists.
2. Two concurrent requests attempt the final capacity unit on one ferry class; exactly one allocation succeeds.
3. Flight return and multi-city date validation rejects impossible sequence without losing valid form inputs.
4. Hotel children ages and occupancy map correctly; supplier price is rechecked; changed total must be accepted before order creation.
5. Rail product with no authorized booking adapter is clearly referral-only and cannot enter Travelar's confirmed booking state.
6. Experiences partner content-only credential cannot access a simulated booking command.
7. Passenger ID field is absent unless the applicable configuration rule justifies it; full ID value never appears in logs or regular call-center search results.
8. PSP status unknown cannot transition a booking into paid/confirmed; retry is idempotent.
9. Provider failover does not create duplicate payment attempts or messages without resolving the first attempt's state.
10. Guest booking reference without verification cannot retrieve passenger ID/manifest or cancel/refund a booking.

## 8. References

- Amadeus Self-Service tutorials enumerate Flight Offers Search, Price, Create Orders and Order Management as separate operations. https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/resources/
- Expedia Rapid documents lodging search, Price Check/revalidation and booking workflow. https://developers.expediagroup.com/rapid/lodging
- Booking.com Demand API documents preview/create for search-look-book flows. https://developers.booking.com/demand/docs/development-guide/application-flows/search-look-book
- Sabre Content Services Rail documents search, prebook, booking and voiding as separate operations and states access needs vendor agreements/permissions. https://developer.sabre.com/rest-api/content-services-rail/v2/index.html
- GetYourGuide API access levels differ by content/availability/booking rights. https://partner.getyourguide.support/hc/en-us/articles/13981133907613-API-integration-and-requirements
- PDPC Tanzania data-controller/processor registration and cross-border permits: https://pdpc.go.tz/services/registration/ and https://pdpc.go.tz/services/cross-border-data-transfer-permit/

## Stage 13 clarification — bus/ferry search and detail flows (24 October 2026)

See `39-frontend-current-requirements-and-product-owner-clarifications.md`. Bus results must distinguish the full operator service from the searched passenger segment; segment fare, departure/arrival time, duration and seat availability are all tied to the requested segment. The bus seat map, pickup/drop-off points and passenger form remain on one details screen, followed by a separate Booking Information Review. Ferry flows use ports, sailing times and class capacity, with no standard seat map. Resident/non-resident example fares remain unverified and must never be hard-coded as production prices. Search counts include adult/child/infant controls; the infant category and age/fare policy is an explicit open question.
