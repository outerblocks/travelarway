# 79 — Data-Driven Runtime, Search Cards, Booking Forms and Policy Rendering

**Product:** Travelar · **Stage:** 25 · **Status:** Target architecture, to be reconciled with Documents 47, 50 and 70.

## 1. “Data-driven everywhere” clarified

All changeable business/catalog/content/configuration values are authoritative database records or live supplier/provider records accessed through backend APIs. The frontend does not contain production route lists, location catalogs, fares, operator-specific fields, payment methods, seat availability, eligibility, staff roles, provider capabilities, approval thresholds, fee/commission rules or policy text as hardcoded business truth.

This does not mean that the database may redefine all executable code. Reviewed code defines supported field types, safe rendering components, state machines, validation, authorization and transaction/inventory invariants. Configuration chooses among supported, validated types. No arbitrary JavaScript, SQL, JSX/HTML or unrestricted scripts from the database.

### Data provenance by field

Every important field has an identified authority. Examples:

- Travelar-owned operator route/stop schedule, fleet, published seat map, tickets and customer-support cases: Travelar PostgreSQL through domain APIs.
- Supplier-controlled flight/hotel/train/experience offer, availability, price, booking locator and ticket/reference: the authorized supplier adapter/status inquiry, with the required snapshot stored for Travelar history.
- Payment result, fee and payout: provider evidence plus Travelar reconciliation/ledger, not browser redirect.
- Operator contract commission/markup, cancellation terms and approved channel: signed/effective-dated contract/policy record.
- Legal content and destination advice: governed CMS record with authoritative source, reviewer, publish/review/expiry dates.

Search/index caches and frontend state are derived views, never authorities for a new booking or financial mutation.

## 2. Runtime configuration bootstrap

The client loads a scoped configuration envelope containing schema/config version, market/country, mode, locale, currency, publish state, feature availability, search form profile, filter/card profile, content placements, support routes and privacy-safe runtime flags. The server determines eligible scopes from host/market/session; clients cannot request privileged HIMS/OIMS configuration simply by changing a parameter.

Configuration publishing pipeline: Draft → schema validation → business validation → preview/simulation → approval if required → effective-dated publication → cache invalidation → audit/version record → monitored rollout → rollback/supersede if necessary. Older clients either receive a compatible profile or a controlled minimum-client error; do not deliver a schema they cannot interpret.

## 3. Search form schemas

Mode form profiles consist of safe field keys, input types, localization keys, validators, data-source endpoints, dependencies, requiredness rules and mode-specific options. Examples:

- Bus: origin, destination, date, passengers, boarding and drop-off point when distinct from city, optional return date.
- Ferry: port pair, sailing date/time, passenger mix and vehicle/cabin information only when supported.
- Flights: origin/destination, one-way/return/multi-city, dates, adult/child/infant counts, cabin/preference fields supported by chosen adapters.
- Stays: destination/property, check-in/check-out, rooms, adults/children/ages.
- Train: station pair, service date, passenger categories, class/seat preferences supported by provider.
- Experiences: destination/activity, date/time slot, participants, age bands and accessibility needs when relevant.

Each field has `supportedBy` capability and a source; field schema cannot force collection of a sensitive identifier without purpose, legal basis, provider requirement and privacy review. Backend schemas mirror frontend schemas and enforce rules independently.

## 4. Result card profiles

HIMS configures a versioned profile per market × mode × channel. A profile contains allowed field keys, order, labels/translations, formatting, visibility policy, data freshness requirements, badge rules and actions. The renderer uses an allow-listed component registry, e.g. text, time pair, currency, amenity chips, availability indicator, operator logo, location path, rating where sourced, cancellation summary, CTA. It never renders arbitrary markup from a provider or a database field.

### Bus card canonical payload example

The backend may return:

- `offerId`, `tripId`, `operatorPublicProfile`, `routeVersionId`;
- `origin` and `destination` stable IDs plus localized display names;
- `viaStops[]` ordered and safely abbreviated;
- `departureAt`, `arrivalAt`, local offsets/time zones, expected duration;
- `vehicleClass`, `vehicleMake`, `vehicleModel`, `registrationDisplay` only if verified/assigned/publicly permitted;
- `amenities[]` with structured code, localized label, verification state and source timestamp;
- `segmentAvailability.availableCount` for the selected origin/destination and `asOf`/freshness;
- `price` with currency, base fare, tax/levy/fee components, discount and total, plus `quoteRequired`/`quoteExpiresAt` where appropriate;
- `policies` summaries and links to effective policy snapshots;
- `actions[]` from server-approved product capabilities, never arbitrary callback names.

Cards never calculate the final fare in the browser. If the seat count or price cannot be verified fresh enough, return an explicit unavailable/refresh-required state rather than a fake number.

### Other modes

Ferries show sailing, vessel/class/capacity and fare categories; do not imply a numbered seat map if not supplied. Flights show itinerary/segments, carriers, cabin/fare brand, baggage/terms and provider-sourced emissions/rating only where supported. Stays show property, room/rate plan, occupancy, stay dates and cancellation policy. Trains show service/coach/class/seat only when sourced. Experiences show operator/activity, dated slot, location, inclusions and participant constraints.

## 5. Booking flow: server-authoritative data

1. User submits stable location/product IDs and travel parameters.
2. Backend validates market/mode/customer context, current route/provider coverage and eligible origin-destination/date.
3. Search orchestration retrieves current Travelar inventory and/or eligible supplier offers. It records provider, capability and freshness metadata.
4. User chooses an offer; backend retrieves current price/availability according to supplier workflow.
5. Quote/order service calculates Travelar fee, contract commission/markup, discounts and taxes/levies from effective-dated policy. Returns line items, currency, expiry, cancellation terms and required passenger schema.
6. Passenger form fields are generated from the applicable safe schema, but all values are validated server-side.
7. At checkout, backend revalidates price and inventory/provider availability, allocates inventory atomically where Travelar owns it, records the commercial/terms snapshot and begins a provider-aware payment/booking state machine.
8. Payment verification comes from a server-authenticated provider response/status query/webhook. Ticket/confirmation fulfillment follows mode/provider conditions; it is not inferred from the frontend page transition.
9. Send durable confirmation intent and record delivery status independently. Provide status/recovery route for uncertain outcomes.
10. Bookings retain immutable snapshots of route/stop labels, vehicle/seat/capacity data where relevant, price components, terms, fare policy, channel evidence and supplier records needed to explain the sale at purchase time.

## 6. Booking dialogue and confirmation pattern

Every destructive or financial action has a meaningful confirm step showing the affected record, amount/currency, consequences, policy and recovery path. A button click is not an authorization decision. The backend rechecks permission and current state when the command is submitted.

Examples:
- Fare publish: show effective date, affected routes/trips, old/new values and bookings not changed retroactively.
- Trip cancellation: show affected bookings, ticket/manifest/notification/refund workflow and require reason.
- Seat map or vehicle change: show incompatible seat claims and passenger re-accommodation plan.
- Refund: show original tender, amount, deductions, rule/approval, status pending vs completed.
- Payout: show payable, approved beneficiary, gross/fees/net, settlement rail, prior payout search and irreversibility.
- Staff privilege change: show capabilities and scope, conflict-of-duties warnings, expiry and approver.

After submission, show resulting state based on server response. `Pending`, `Unknown`, `Rejected`, and `Completed` are distinct. Disable duplicate submission visually but enforce idempotency at backend/database.

## 7. Versioned terms and policy snapshot

Maintain reusable Travelar core terms, per-mode terms, operator-specific terms, supplier policy and country-market legal notices with language, version, source/owner, effective dates, approval and publication state. Checkout composes only applicable approved texts and captures accepted versions/time/context against the booking. Do not author legal clauses by guessing or let an operator alter mandatory Travelar/legal terms. Terms shown at booking must remain retrievable even after the live policy changes.

## 8. Acceptance criteria

- Switching modes/market/locales loads safe configuration from API; no hardcoded catalog and fare fallbacks are used as source of truth.
- Card fields render from a typed profile while the UI only permits registered components.
- Backend rejects tampered totals, IDs, fares, role assignments, action/state names and unauthorized configuration versions.
- Provider-owned availability and price are revalidated according to provider workflow and freshness.
- Old booking retains original fare/terms/stop/seat/policy snapshots after configuration changes.
- A configuration rollout is versioned, approved where needed, auditable and reversible without deleting history.
- Every confirmation dialogue has corresponding backend authorization, valid transition and audit event.
