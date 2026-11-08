> **Stage 21 correction (24 October 2026):** any earlier statement in this historical clarification that names `Travelar Destinations Limited` or treats `OuterBlocks Limited` as the operating entity is superseded by the product owner's current confirmation: `OuterBlocks Limited` is parent; `OuterBlocks Destinations Limited` is the intended Travelar operating subsidiary/entity of record. Registry and regulatory proof remain required.

# 39 — Current Frontend Baseline and Product-Owner Clarifications

**Product:** Travelar  
**Research / clarification date:** 24 October 2026  
**Status:** Product-owner supplied requirements; consolidated for review. Not evidence that the existing frontend has been inspected or that any feature is implemented.  
**Current company baseline (Stage 21):** OuterBlocks Limited is the parent; OuterBlocks Destinations Limited is the intended Travelar operating subsidiary/entity of record. This explicit owner decision supersedes the earlier assumptions below. The actual registry status, ownership relationship, authority and licences still require documentary verification before contracting or production.

## 1. Purpose and implementation boundary

This document captures the current intended experience and operating model supplied by the product owner. It is an additive clarification to documents `13`, `15`, `16`, `17`, `21`, `23`, `24`, `28`, `29`, `31` and the Keycloak/hosting ADRs. It does not authorize production bookings or replace regulatory, supplier or hosting verification.

The existing frontend is described by the owner as frontend-only and already in progress. The actual source code, repository, screenshots, routes and design tokens were not attached to this conversation for inspection. Therefore this document must not claim that the existing implementation has been reviewed, preserved or verified. Any future frontend review should begin with the actual codebase and current design system, then map existing screens against these requirements before recommending rewrites.

## 2. Product scope and booking modes

### Confirmed product scope: all six modes are first-class

Travelar's public product and product requirements explicitly include all six modes from the outset:

1. **Bus** — intercity and supported city/region-to-city/region journeys, with route-segment inventory, seat selection, boarding/drop-off points and passenger fields.
2. **Ferry** — enabled where the country, route, operator and port are supported; class/capacity rather than a normal seat map; residency-aware fares only where verified by the operator and applicable rules.
3. **Flights** — supplier/GDS adapters including Travelport, Amadeus and Sabre, based on actual product permissions, commercial arrangements and market eligibility.
4. **Stays/hotels** — accommodation supplier adapters and a distinct lodging booking lifecycle.
5. **Train** — its own first-class tab, search and booking lifecycle, with country/railway-specific stations, services, fares, ticket types and after-sales rules.
6. **Experiences** — its own first-class tab and booking lifecycle for activities/tours, with destination, date/time slots, options, participant categories, capacity, supplier questions and vouchers.

Train and Experiences are **not deferred product modes**. They must be included in the sitemap/navigation, product requirements, mode-specific search matrix, domain model, adapter standards, acceptance tests and implementation dependency graph. Their supplier integrations are researched and planned now.

Product scope is distinct from transaction readiness. HIMS may keep a mode or provider unavailable for live booking in a particular country until authorized supply, contractual rights and end-to-end fulfillment tests exist. In that case, the mode remains part of Travelar and must present a truthful configured state (for example, supported departures/activities when available, an explicit unavailable or official-provider handoff state where legally permitted), rather than silently disappearing from the product roadmap or pretending a live booking integration exists.

No mode may appear as transactionally available merely because its tab exists. HIMS country/mode activation requires documented supplier authority, correct booking/payment/ticket or voucher lifecycle, support/refund process and successful production-readiness review.

## 3. Country, language, currency and location behavior

- Initial market: Tanzania.
- Initial languages: English and Swahili.
- Support additional languages, countries and currencies through localization and market configuration rather than branching hard-coded rules throughout the application.
- A country context may be suggested using a permitted coarse IP-derived signal, user-selected country or, where genuinely useful, browser geolocation after permission. Do not silently force a redirect solely from GPS/IP inference. Always provide a visible country/market override and remember the user's choice subject to privacy policy.
- Country context determines which modes, providers, payment methods, legal disclosures, passenger fields, currency choices and support information are eligible. It does not by itself determine data residency.
- Store money as exact decimal/minor-unit values with ISO currency codes, and use the relevant market timezone for user display. Do not assume TZS and USD example fares are exchange-rate equivalents or mix currencies in a total without a clearly stated conversion and rate source.
- Use translation keys and locale-aware date/number formatting. The examples use `dd/mm/yy`; the UI must still be unambiguous about year and travel-local time.

## 4. Bus search and results

### Search inputs

- Departure location and destination location. These can resolve to country, region, city, terminal, official stop or supported pickup/drop-off location, according to the operator's route model.
- Travel date with calendar pop-up.
- Adult/passenger count, child count and infant count as separate controls, with caps and age rules driven by the configured service.
- Search submit, disabled/loading state, skeleton results, retry/error state and useful empty results.
- Validate that origin and destination are valid and ordered on the selected service's route before offering booking.

### Required distinction: complete service route vs requested passenger segment

A result must make both concepts clear:

- **Full operator service:** the vehicle's trip start and final destination, plus ordered intermediate stops.
- **Passenger segment:** the selected boarding/origin stop and drop-off/destination stop requested by this customer.

For example, a Dar es Salaam–Mbeya service passing Morogoro, Dodoma and Iringa must be discoverable for eligible subsegments such as Dar es Salaam–Dodoma or Morogoro–Iringa. Fares, departure/arrival times and seat availability must correspond to the requested segment, not merely show the full route's terminal times and end-to-end fare. The full route should remain visible as context so users understand which service they are boarding.

### Segment inventory invariant

Represent a passenger journey as an ordered route interval `[origin_stop_index, destination_stop_index)`. A seat is unavailable for any new request whose interval overlaps an existing active hold or confirmed booking on that seat. Two non-overlapping journey intervals may use the same physical seat if operator policy and turnaround constraints permit. This must be implemented atomically in the backend with concurrency-safe constraints/locking; the frontend's display is not the inventory authority.

Seat holds require a server-issued expiry. Payment attempts, webhook arrival and expiry racing with one another must have a deterministic reconciliation path. On schedule/vehicle/route changes, preserve booking history and explicitly revalidate affected reservations; do not silently move passengers or rewrite issued tickets.

### Bus result card content

Present a compact, readable result with:

- Operator name and logo.
- Vehicle class configured by the operator (examples such as AC Luxury VIP/VVIP, AC Semi Luxury or Non-AC Semi Luxury are examples, not fixed enums).
- Vehicle model and registration/plate when the operator has supplied it and the field is appropriate to expose.
- Amenities configured for that vehicle/service.
- Full service origin and final destination, with route context.
- The passenger's requested boarding and drop-off stops and the corresponding segment departure/arrival times and dates.
- Duration for the requested segment; show full-route duration only if labelled separately.
- Available seats for the requested segment, based on authoritative availability at the time of display.
- Total segment price and currency, with applicable passenger-category/fare detail where required.
- Clear “Book bus” action.

Do not treat a result card's cached availability as a reservation guarantee. Recheck availability and price when selecting/holding the seat.

## 5. Bus passenger details flow and screen structure

The current desired bus flow is:

**Search → Results → Bus details (one screen containing seat selection, boarding/drop-off choices and passenger information) → Booking Information Review → Checkout → Confirmed ticket.**

The seat layout must be derived from the active vehicle/seat-layout configuration. The operator may configure seats, seat labels, blocked seats and service/class mapping. A layout change must be versioned and must not corrupt existing seat assignments.

On the bus details screen, keep these related sections on the same screen/page or route step rather than forcing navigation to separate screens:

1. Seat selection for each passenger.
2. Boarding and drop-off points for each relevant passenger/booking item.
3. Passenger-information form.

The visual design should remain clean and should **not add the extra booking-summary cards the owner specifically rejected for this screen**. A distinct subsequent **Booking Information Review** step is required before checkout. This does not prohibit necessary inline validation, price/fare disclosure or clear field-level guidance.

### Passenger data candidates

- Full name as shown on the required identification document.
- Email address and telephone with country calling code; product design must decide which fields belong to the lead booker versus each passenger, and avoid unnecessary repetition.
- Gender dropdown with the requested Male/Female choices, subject to legal/provider validation and a configurable field policy.
- Passenger category, including adult, child and an explicit infant handling rule.
- Country of residence, using a maintained international country list.
- Identification type, ID number and issuing country for bus are optional unless a validated country/operator/service rule requires them.
- Supported ID types may include national ID, passport, driver's licence and voter card only where accepted by the applicable operator/regulation.

Fields described as required by the owner should be validated at the frontend and backend. However, passenger fields must be versioned by country/mode/operator/service and must not be made universally mandatory without a documented operational, supplier or legal reason. ID numbers are sensitive personal data and require purpose-limited access, masking, retention and deletion rules.

**Unresolved passenger-type rule:** the search includes infant count, but the requested detail form only explicitly lists Adult/Child. Before implementation, configure age bands, seats/occupancy, fare treatment, ID requirements and operator-specific policies for infants, children and adults separately by mode/country. Do not silently classify infants as children.

## 6. Ferry search, results and passenger details

### Search

The flow is similar in overall shape to bus search but uses departure port and destination port, rather than bus locations. Only configured and operationally enabled operator routes/sailings are searchable. Date and passenger-category controls must follow the route/service policy.

### Ferry result content

- Operator identity and logo.
- Vessel name from the operator fleet, where supplied.
- Vessel class or ticket class offered on that sailing (examples: Economy, Business, VIP, Royal); available classes are configured per vessel/sailing.
- Price by class, passenger category and valid residency/fare rule.
- Travel date and departure/arrival times for the selected sailing.
- Clear class-level availability and booking action.

Ferry inventory is **capacity-based** by sailing and class, not a bus-style numbered passenger seat map unless an operator's approved product explicitly supports reserved seats/cabins. Concurrent bookings must not exceed sellable class capacity.

### Residency and pricing examples

The owner proposed TZS fares for residents and USD fares for non-residents. The example amounts are **illustrative, internally ambiguous and not approved tariffs**. They must not be treated as live fare data. Before launch, the operator and legal/compliance team must confirm:

- What definition and evidence establish “resident” for each route and operator.
- Whether residency or citizenship is the actual pricing criterion.
- Required proof at booking/boarding, who verifies it and how disputes are handled.
- Adult/child/infant tariffs per class and applicable taxes/fees.
- Which currency is charged, displayed, settled and printed on a ticket.
- Foreign-exchange handling, if any, and the source/time of the rate.

A customer must not be asked to assert eligibility that cannot be explained or verified. Pricing configuration must be versioned, approved and effective-dated.

### Passenger fields and flow

The ferry flow is: **Search → Results/select vessel class and sailing → Passenger details → Trip/booking review → Checkout → Confirmed ticket.**

The owner states ferry ID is mandatory for residents and non-residents. Implement this as a proposed ferry-service rule that must be confirmed against the actual operator/route/regulations and accepted identification types before production. The data access and retention controls described for bus ID data apply here with stricter validation where required.

## 7. Checkout, payment and ticket issuance

- Booking review must state the selected service, passenger segment/sailing, passengers, seats or class capacity, applicable fare, taxes/fees, discounts and final currency/amount.
- Coupon/discount codes must be validated server-side against effective dates, eligibility, usage limits and combinability rules.
- Payment options are configured per country, currency, channel, supplier and PSP adapter capability. The UI must show only eligible methods.
- The client is never authoritative for price, discount, fee, currency conversion, payment status, ticket status or permission.
- PSP callbacks/webhooks must be authenticated according to the specific adapter, replay-protected, idempotently processed and recorded. Where supported, verify status server-to-server; reconcile provider settlement later. A browser return or client success screen is never proof of payment.
- Ticket issuance requires a verified payment outcome **and** a valid confirmed booking/inventory/supplier state appropriate to the mode. A payment webhook alone is not sufficient if the seat/class hold has expired or a supplier reservation has failed.
- If payment is confirmed but the necessary inventory or supplier confirmation cannot be completed, do not issue a false confirmed ticket. Enter an explicit exception/reconciliation state, preserve evidence and follow the approved recovery/refund workflow.
- Bus/ferry ticket issuance is triggered only once the required state transitions are confirmed. Ticket IDs must be unique and issuance/retries idempotent.
- Ticket output should have a thermal-printer-friendly layout and downloadable PDF using a tested supported thermal page size. Include validated trip, passenger, operator, fare, ticket reference, terms and required regulatory/fiscal information. QR/barcode content must not expose raw sensitive passenger data.
- A ticket-print animation appears only after the backend confirms successful ticket generation. A card/POS checkout animation indicates “processing” while payment is pending; it must not show payment success, imitate a real terminal approval or create a false impression before authoritative confirmation. Respect reduced-motion accessibility settings and provide a non-animated success path.
- Email/SMS notifications are asynchronous adapters. A sent/accepted response is not the same as delivery; notification failure must not reverse a confirmed ticket.

## 8. Accounts, guest booking and authentication

- Support guest booking and registered passenger accounts.
- Social login is desired; Keycloak can broker supported external identity providers subject to configuration, country/provider availability, terms and data-transfer review.
- Public passenger identity, operator identity and HQ workforce access must have distinct application clients, authorization policy and session boundaries. Whether these require distinct Keycloak realms or distinct clients/groups within a realm must be settled by the identity architecture and threat model; distinct subdomains alone do not create isolation.
- OIMS on `oims.travelarway.com`, HIMS on `hims.travelarway.com`, and the public website on `travelarway.com` are proposed domains. Verify control, DNS, TLS, cookies and session boundaries before production.
- Ticket/booking retrieval cannot be authorized by possession of a booking reference alone. Use additional verification, risk-limited tokens or authenticated access.

## 9. OIMS, HIMS and organization roles

### OIMS

Bus and ferry operators have different workflows, inventory rules and data needs. They must not see each other's tenants, records or administration. Use distinct portal experiences and strict tenant/type-scoped authorization; shared backend modules may be reused where the business invariants genuinely match, rather than duplicating the full codebase.

Bus OIMS configures operators, branches, employees/agents, vehicles, seat layout templates, stops, routes, trip schedules, fares, bookings, ticketing, manifests, boarding and cashier workflows. Ferry OIMS configures vessels, vessel classes, sellable capacities, ports, routes/sailings, fares, passenger lists, boarding and vessel substitution/disruption workflows.

Each operator is manually onboarded by an authorized HQ workflow: application/verification, contracts, configuration, capability tests, approval, activation, suspension and offboarding. No operator self-activation of live ticketing without authorization.

### HIMS

HIMS oversees country/mode activation, onboarding approval, commercial agreements, provider registry and health, staff, customer support, refunds/escalations, financial approvals, marketing configuration, compliance, system configuration and audit.

Departments proposed by the owner include Finance & Accounting; Marketing; Operations; Customer Experience/Service/Support; Compliance, Regulatory Affairs & Legal; Human Resources; Technology/IT/Engineering; Executive Management; Partnerships & Business Development; Corporate Communications/PR; Administration; and Internal Audit. Department presence never automatically grants access to all data or money. Apply least privilege, separation of duties, maker-checker and audited emergency access.

### Corporate entity reconciliation

This section was written before the Stage 21 owner decision and is retained only as history. The current direction is OuterBlocks Limited (parent) → OuterBlocks Destinations Limited (intended Travelar operating entity). `Travelar Destinations Limited` is superseded. Before contracts, provider accounts, terms or licences are issued, verify the registered entities, ownership/IP relationship, authorized contracting party per flow, employer, recipient of customer funds, supplier settlement obligor, tax/fiscal issuer and regulator eligibility.

## 10. Configuration and product governance

“Business logic is configurable” means customer-facing policies such as enabled markets/modes, schedules, routes/stops, vehicle templates, class capacities, field requirements, currencies, fare rules, coupons, payment methods, communications routes and role assignments are represented as validated, versioned configuration with scope and effective dates.

It does **not** mean a nontechnical administrator can disable fundamental security, financial-integrity or inventory constraints. Invariants such as price being computed server-side, tenant isolation, verified payment, non-overlapping seat allocation, double-entry balance and ticket issuance eligibility must remain enforced in code/database constraints and require controlled engineering changes to alter.

Configuration changes affecting price, ticket validity, legal fields, financial accounts, operator permissions or market enablement require appropriate maker-checker approval, audit history, staged preview/testing and rollback.

## 11. User-interface and accessibility behavior

- Preserve the current design system; do not replace it without code review and a documented gap.
- The selected travel-mode tab controls that mode's form; avoid duplicated mode selectors.
- Implement skeletons for search/result loading, explicit no-results states, unavailable-service handling, retry behavior and backend-validation messages.
- Avoid the rejected extra summary cards on the combined bus details screen. Use the dedicated Booking Information Review step before checkout.
- Payment and ticket animations must be truthful representations of backend state and offer reduced-motion alternatives.
- Use keyboard-operable controls, clear validation, sufficient contrast, accessible labels and status announcements.
- Do not rely on animations alone to communicate pending, failed or successful outcomes.

### Public homepage content direction — owner clarification (24 October 2026)

The homepage is a useful travel discovery/preparation surface, **not a marketing brochure**. Prioritize Hot Deals & Offers, Explore Destinations, and Travel Guides & Tips, while keeping the six-mode search and Help/Manage Booking accessible. Do not add generic “How it works,” “Why choose us,” empty feature-card grids, unsupported testimonials or corporate promotional copy merely to fill the page. Destination examples supplied by the owner include Paris, Zanzibar, Greece, Bali and Dar es Salaam; keep each canonical destination unique, and distinguish countries/regions/cities correctly. Use “Popular Destinations” only when backed by documented booking/search/popularity data; otherwise use “Explore Destinations.”

Travel guides must help people prepare for real journeys: visa/entry options and prerequisites, what the arrival process may involve, airport/port/station/terminal transfer, local transport, cash/cards/currency, connectivity/SIM, health/safety, customs/local laws, emergency contacts, accessibility and seasonal context. Visa and entry claims require official, current sources and context; do not infer nationality from IP, guarantee admission, or silently publish stale information. Public access to a source website does not grant API, republication or commercial data rights.

## 12. Critical unresolved questions

1. Has the intended OuterBlocks Destinations Limited parent/subsidiary structure been established in current BRELA records, and what evidence confirms authority to contract and operate the relevant regulated services?
2. All six modes are in Travelar product scope. Which train/experience suppliers can be transactionally enabled for the initial Tanzania launch, and which markets require an authorized handoff or unavailable state until contracts and technical access are secured?
3. What age bands, fare categories and seat/occupancy rules apply to infants by service and country?
4. What authoritative policies govern bus passenger gender fields and ID requirements per route/operator?
5. What is the validated residency definition and evidence for each proposed ferry resident/non-resident tariff?
6. What are the actual operator-approved fare tables and any fiscal receipt/ticket content obligations?
7. Which current frontend routes/components exist, and which design tokens and UI components must be preserved? Requires repository/ZIP or source access.
8. Which Keycloak realm/client separation model meets the threat model while allowing approved social login?
9. What is the exact payment recovery path when the PSP verifies money received but a seat/class reservation expired or supplier confirmation fails?
10. Which provider contracts and production permissions exist for every country/mode? Until verified, adapters remain non-production.

## 13. Minimum acceptance tests derived from this clarification

- Search a multi-stop bus route for several eligible intermediate segments; price and times reflect each requested segment.
- Run concurrent bookings for overlapping segments and prove that the same seat cannot be allocated twice; run disjoint-segment bookings and prove they can coexist where policy allows.
- Expire a hold while a payment event is delayed; reconcile without issuing an invalid ticket or losing financial evidence.
- Verify ferry concurrent reservations never exceed each sailing/class's sellable capacity.
- Verify the configured residency fare is applied only when the required eligibility evidence/policy passes; test unknown/inconsistent residency states.
- Verify country/mode/payment-method configuration hides unavailable transactional options without falsely implying integration readiness.
- Verify booking reference alone cannot retrieve private passenger data.
- Verify OIMS bus tenant A cannot read or mutate tenant B or ferry-only records; verify HIMS roles and maker-checker limits.
- Verify browser redirect alone never confirms payment and duplicate/out-of-order webhook deliveries cannot duplicate charges, ledger entries or tickets.
- Verify payment success followed by ticket-generation failure enters a recoverable exception state and does not issue a fake ticket.
- Verify the POS/payment animation remains pending until an authoritative backend result and ticket animation occurs only after confirmed issuance.
- Verify translated English/Swahili labels, locale-formatted times/currencies, manual country override and reduced-motion support.
- Verify the printed PDF fits the approved thermal format and contains the required, contractually/regulatorily approved fields.

- Verify homepage prioritizes working mode search, real Hot Deals & Offers, Explore Destinations and useful Travel Guides & Tips; prohibited generic marketing sections are absent unless explicitly approved.
- Verify expired/unavailable deals disappear or are clearly non-bookable; no unsupported discount/original-price or fabricated popularity claims appear.
- Verify destination identity/slugs are unique and hierarchy is correct; duplicate imported destination entries do not create duplicate cards.
- Verify visa/entry guides show source and review metadata, distinguish nationality/route-dependent rules, use official references, flag stale content, and never guarantee border admission.
- Verify content editors cannot publish or silently alter high-impact entry content without required review and an auditable revision history.

## 14. Source-of-truth classification

- **Explicit owner requirements:** flows and features described in the product-owner message dated 24 October 2026.
- **Established previous decisions:** custom backend, PostgreSQL 18, Keycloak-first subject to deployment gates, provider-neutral GDS/PSP/communications adapters, Tanzania-first rollout, no production before verification.
- **Proposals needing confirmation:** documentary authority of OuterBlocks Destinations Limited, supplier-level activation by country/mode, ferry pricing/residency details, age/ID rules and exact realm model.
- **Not established:** current frontend implementation completeness, deployed domains, signed supplier contracts, production credentials, regulator approval, final host selection or go-live readiness.
