# 89 — Travelport Stays: Source Review, Workflow and Schema Mapping Requirements

**Research cut-off:** 28 October 2026  
**Status:** Official-documentation review; not proof of access or production entitlement.  
**Primary sources:** Owner-supplied Travelport TripServices Stays documentation, linked in `93-provider-source-inventory-stage27.md`.

## 1. Executive finding

The pack previously contained a provider-neutral stays flow, but not enough Travelport-specific contract evidence to claim a complete adapter. The supplied docs provide a useful current reference set for Stays API v11 and the SearchComplete v12 path. Implement the provider adapter only after the exact product, version, endpoint, and account access are confirmed against the current release notes and provisioned Travelport access group.

**Version-status caution:** the Stays API overview is titled “Stays API v11 overview”; the guide describes SearchComplete as an ODM v12 search API and the migration guide describes its redesigned combined search behavior. The general guide also contains language saying SearchComplete is “currently in development.” Because these official pages are not perfectly aligned on rollout status, do not infer universal production availability. Confirm current release notes, API reference status, pre-production access, and account entitlement with Travelport before selecting it for production. Keep the v11 workflow available behind a distinct adapter capability until that gate is closed.

## 2. Documented workflow choices

### A. Stays v11 workflow

Minimum documented sequence:

1. Authenticate through Travelport OAuth 2.0 and obtain a bearer token.
2. Search by location or property ID. Search-by-airport is a supported use case.
3. Optionally retrieve property details and images.
4. Request Availability for the relevant property and dates to obtain available room/rate offers.
5. Optionally retrieve Rules for a selected offer.
6. Create Reservation with the offer identifier plus traveler, form-of-payment and payment details.
7. Persist Travelar booking reference and all returned Travelport/supplier confirmation identifiers.
8. Retrieve the reservation for confirmation, customer support, or reconciliation; cancel through the documented cancellation flow when eligible.

The guide says search returns up to 100 properties and availability up to 100 rates per response, with pagination for additional results. The adapter must preserve pagination tokens/identifiers and avoid presenting page one as the entire result set.

### B. SearchComplete v12 candidate workflow

SearchComplete combines search, property details and availability data into one search response and supports a pagination operation using the identifier supplied in the initial response. The docs show `POST /search/searchcomplete` and `GET /search/searchcomplete/{identifier}` for additional pages. Rules can be requested if needed, and booking then uses the v11 Create Reservation workflow. SearchComplete is v12 search, not a blanket upgrade of every Stays operation to v12.

Use the SearchComplete path only when current documentation, release status, entitlement and contract tests establish that it is available for the Travelar access group. Do not mix v11 and v12 payload objects without an explicit mapping boundary.

## 3. Required Travelport request metadata

Official documentation lists common headers including:

- `Accept-Encoding: gzip, deflate`
- `Cache-Control: no-cache`
- `Accept: application/json`
- `Content-Type: application/json`
- `Authorization: Bearer {token}`
- `XAUTH_TRAVELPORT_ACCESSGROUP: {provisioned access group}`
- optional end-to-end tracking identifier (the precise accepted header is version-specific; see v11/v12 trace guidance)

The OAuth access token is documented as valid for 24 hours. Cache it securely until expiry and refresh when necessary; do not fetch a token for every request, put credentials in browser code, or expose the access group in public client state.

Base paths in the current endpoint page:

- v11 pre-production: `https://api.pp.travelport.net/11/hotel/`
- v11 production: `https://api.travelport.net/11/hotel/`
- v12 SearchComplete has a separate `/12/hotel/` base path; the agent must confirm the exact current production and pre-production endpoint from the page and current release notes before implementation.
- token endpoints documented: pre-production `https://auth.pp.travelport.net/oauth/token`; production `https://auth.travelport.net/oauth/token`.

## 4. Trace and transaction identifiers

Travelport documents version-specific trace headers. v11 uses `TraceId`; SearchComplete v12 uses `TVP-Trace-Id`. Responses may include a trace ID in both headers and payload. Some responses include a `transactionId`, which the documentation says is not consistently returned and is not intended for customer use. Preserve provider trace IDs and Travelar correlation IDs for internal support; never expose internal diagnostics or provider identifiers as customer-facing booking codes by default.

Every request in a booking workflow should carry or propagate a unique workflow trace ID. Each operation must additionally have a durable Travelar operation ID and safe idempotency/reconciliation strategy. A provider timeout does not prove failure; retrieve/query the reservation before repeating a non-idempotent Create Reservation or Cancel operation.

## 5. Booking-change and failure semantics

Travelport states hotel inventory is volatile. If availability or terms/price change between the latest check and Create Reservation, the workflow may pause and allow the developer/customer to accept the changes or discard the booking and restart search. Travelar must surface a Travelar-branded price/terms-change confirmation, preserve the original quote snapshot, and require explicit acceptance before continuing. Never silently accept a changed amount or cancellation condition.

The error documentation groups examples into impairment errors, common object validation errors (code family 1000), system-wide errors (2000) and hotel-specific errors (13000). It distinguishes API-originated from supplier-originated errors and documents retry categories in some new-format errors. Mapping rules must be data-driven by provider product/version and retain a redacted raw error record; do not hardcode every string as a one-off UI message. Retrying must depend on error category and operation idempotency, not HTTP status alone.

## 6. Multiple rooms and guests

The supplied multi-room use case says the request should include the required traveler data for all guests and room quantity at Create Reservation (`NumberOfRooms`), while search/availability input is based on the number of guests and does not necessarily send room quantity in the same way. Preserve the exact provider request contract per API version. Travelar’s canonical StaySearch and StayBooking models must represent multiple rooms, room-to-guest allocation, child ages, lead guest, contact details, meal plan, rate plan, cancellation rules, payment requirements and per-room price breakdown.

Do not assume a single room-level cancellation/refund is equivalent to cancelling every room in a multi-room reservation. Persist returned reservation locators and confirmation codes as a collection with their locator types and room-level association when provided.

## 7. Reservation and cancellation identifiers

The cancellation use case requires an existing reservation and the aggregator locator/PNR. It explains that hotel bookings can return multiple locator codes and identifies the aggregator PNR locator in the returned receipt/confirmation structure. Travelar must persist the locator type alongside every value, distinguish Travelar booking ID from aggregator locator and hotel/supplier confirmation, and retrieve reservation details if required identifiers are missing.

Cancellation must capture the policy, deadline, expected penalty/refund and provider acknowledgement. A cancellation API success response is not automatically proof the refund reached the payer or that Travelar’s financial ledger is reconciled. Keep reservation cancellation, payment refund, fiscal adjustment and supplier reconciliation as separate states.

## 8. Passive segments

Travelport documents passive segments separately. Do not treat creation of a passive segment/PNR representation as equivalent to inventory being reserved or a hotel supplier confirming the booking. The user-facing confirmation state must reflect the real supplier reservation state, not the existence of a passive segment.

## 9. Travelar canonical model proposal (not provider field names)

Canonical `StaySearchRequest` should support:

- location / airport / property-ID search selector;
- check-in and check-out dates as local dates, property time zone when known;
- adult count, child count and individual child ages;
- rooms requested and guest allocation;
- currency, property/rate filters, private-rate code only when authorized;
- result pagination/cursor, search timestamp and search correlation ID.

Canonical `StayOffer` should preserve:

- stable Travelar offer ID plus provider name/product/version;
- provider offer and property identifiers (securely stored); property, room type, occupancy, meal/board, refundable/non-refundable and cancellation policy;
- itemized base, taxes, mandatory fees, optional fees, currency, per-night versus full-stay totals, and whether amounts are estimates or confirmed;
- rate/terms snapshot, observed timestamp, provider validity or expiry if supplied, and availability freshness;
- exact upstream provenance for every field displayed in the UI.

Canonical `StayReservation` should preserve:

- Travelar booking ID, provider operation ID, aggregator locator and all supplier confirmation locators with their types;
- room-to-guest allocation, accepted offer/price/policy snapshot, supplier status, payment/funding reference, confirmation-document references;
- provider trace/correlation identifiers, created/updated timestamps, cancellation/refund states and reconciliation state.

These are Travelar-owned contracts, not claims about Travelport JSON property names. Implement exact source-to-canonical mappings only from the live API reference and approved examples.

## 10. Required contract and scenario tests

Before marking Travelport Stays implemented, test: v11 search by location; property-ID search; airport search; pagination; details; availability; rules; single room; multiple rooms and guests; child ages; private-rate access where contracted; price/policy changed at booking; offer no longer available; successful and failed reservation; ambiguous timeout after Create Reservation; retrieve with aggregator locator; several locator codes; cancellation success/failure; retry-category handling; token expiry/refresh; access-group failure; trace propagation; redaction of provider errors; and explicitly unsupported/disabled SearchComplete access.

## 11. Official sources

See `93-provider-source-inventory-stage27.md`. Key pages: [Travelport Stays overview](https://developer.travelport.com/docs/stays), [general guide](https://developer.travelport.com/docs/stays/guides/stays-general-guide), [SearchComplete object model](https://developer.travelport.com/docs/stays/tutorials/search-complete-api-object-model), [headers](https://developer.travelport.com/docs/stays/general/common-stays-api-headers), [endpoints](https://developer.travelport.com/docs/stays/general/stays-api-endpoints), [trace IDs](https://developer.travelport.com/docs/stays/general/trace-and-transaction-ids), [multi-room booking](https://developer.travelport.com/docs/stays/use-cases/booking-stays/book-single-or-multiple-rooms), [reservation cancellation](https://developer.travelport.com/docs/stays/use-cases/modifying-reservations/cancel-a-reservation), and [error messaging](https://developer.travelport.com/docs/stays/general/stays-api-error-messaging).
