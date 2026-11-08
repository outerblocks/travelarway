# 13 — Travelar Product Requirements and Business Rules

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Research cut-off:** 23 October 2026  
**Status:** Consolidated research specification — proposed requirements, not implementation approval  
**Related documents:** `06-booking-mode-and-supplier-capability-matrix.md`, `07A-gds-provider-comparison-and-integration-strategy.md`, `08-train-ferry-and-bus-integration-research.md`, `10-psp-communications-and-ussd-provider-comparison.md`, `11-revenue-model-and-unit-economics.md`, `12-financial-accounting-settlement-and-reconciliation.md`, `14-public-website-sitemap-and-landing-page-brief.md`, `15-mode-specific-search-and-booking-field-matrix.md`, `16-oims-hims-agents-call-center-and-marshal-requirements.md`, `17-role-permission-and-approval-matrix.md`.

## 1. Purpose and authority

This document consolidates the product owner's stated requirements and the research-backed constraints into a traceable baseline for later review. It is not a final API contract, schema, legal opinion, supplier contract, or authorization to build/launch. Requirements that depend on market-specific law, contract, supplier support or regulator decisions remain unresolved until documented evidence is attached.

### Status vocabulary

- **USER** — explicit product-owner requirement or direction.
- **VERIFIED** — supported by cited primary documentation, only to the scope stated.
- **PROPOSED** — product/engineering requirement recommended for review.
- **UNRESOLVED** — depends on evidence or a decision not yet available.
- **REJECTED** — assumption specifically disallowed by the source of truth.

Priority: **P0** launch/safety/integrity blocker; **P1** required for a commercially credible initial release; **P2** planned extension; **P3** optional/conditional. “MVP” means the minimum operationally lawful and commercially fulfillable scope—not a simplified UI that bypasses controls.

## 2. Product principles

1. **One product identity:** Travelar; intended to be operated by OuterBlocks Destinations Limited under parent OuterBlocks Limited, subject to documentary/legal verification. Domains such as `travelarway.com`, `oims.travelarway.com`, `hims.travelarway.com`, and `agents.travelarway.com` are proposed configurations and must be verified before use.
2. **Six booking modes:** bus, ferry, flights, train, stays and experiences. A mode may be disabled in a market when authorized inventory or fulfilment is not available.
3. **Provider-neutral integration:** use separate adapters for Travelport, Sabre, Amadeus, PSPs, email, SMS/messaging, USSD gateways, fiscal systems, operator systems and direct suppliers. More than one provider can be active for a mode or market.
4. **Capability-aware routing:** only select providers that are active, contract-authorized, correctly configured, in coverage, within rate limits and able to perform the required action. No automatic reroute may change the supplier of an existing reservation without an explicit supported workflow.
5. **Trust authoritative systems:** price, booking status, availability, permissions, payment status, taxes, commission and settlement obligations come from trusted backend records and approved source systems—not from client input.
6. **Correctness before conversion:** ticketing/inventory, payment, money records, privacy and regulatory obligations cannot be weakened to improve checkout completion.
7. **Channel-aware attribution:** Travelar-generated and operator-originated bookings must be distinguishable through audited facts; the source cannot be changed casually after a sale to avoid an agreed commission.
8. **Minimum necessary data:** collect passenger fields required by the market, mode, carrier/operator, supplier and legal purpose. Do not collect an ID, date of birth, gender or residence field merely because a form can display it.
9. **Graceful failure:** a supplier outage must produce a clearly stated unavailable or pending outcome, never a fabricated confirmation. A provider timeout is not evidence that an operation failed.
10. **Traceability:** every requirement has acceptance criteria, dependencies, applicable markets/modes, security impact and a test/evidence path.

## 3. Scope and exclusions

### In scope for this specification

- Public website information architecture and six mode-specific searches.
- Guest and registered-user journeys.
- Common booking, payment, ticket, refund, notification and settlement concepts.
- Bus and ferry operator management (OIMS), company headquarters management (HIMS), Travelar agent tools, operator agent/cashier tools, call-center workflows and marshal validation.
- Provider-neutral supplier, PSP and communications adapter principles.
- Roles, approvals, audit, country activation and market-specific configuration.
- Acceptance criteria and unresolved commercial/regulatory questions.

### Not yet approved/finalized

- Production database schema and migrations.
- Final hosting region or interpretation of national data-residency obligations.
- Exact business/licence classification, LATRA route, ferry distribution authorization or Zanzibar scope.
- Merchant-of-record/principal-versus-agent status by mode.
- Any provider as contracted, production-enabled or entitled to ticket all inventory in a market.
- Supplier rates, commissions, PSP tariffs, service-level guarantees or projected market share.
- Launch of flights, stays, rail or experiences before the specific supply, consumer, tax and servicing obligations have been verified.

## 4. Consolidated requirements register

| ID | Requirement | Status | Priority | Acceptance criteria | Dependencies / security & privacy | Coverage |
|---|---|---:|---:|---|---|---|
| TR-CORE-001 | Keep Travelar as the product brand; use OuterBlocks Limited as parent and OuterBlocks Destinations Limited as intended operating entity, with legal verification before contracting. | USER | P0 | Product/brand, parent and operating entity are separately represented; correct intended names appear in drafts; no contracts, merchant accounts or licences are activated until registry and authority evidence is reviewed. | BRELA records, tax/licence counsel, signatory and payment-account verification. | All |
| TR-CORE-002 | Support six first-class travel modes: bus, ferry, flights, stays, train and experiences. | USER | P0 | All six appear in product scope, sitemap/navigation, search matrix, domain model, adapter contracts and acceptance plan; each has a distinct search schema and lifecycle. | Supplier availability affects transactional activation, not whether the mode is in product scope. | All |
| TR-CORE-003 | Allow market/mode activation only after an authorized supply and fulfilment path is approved. | PROPOSED | P0 | A mode can remain disabled per market; activation records evidence, effective date, approver, contract and rollback. | HIMS approval controls; audit. | All |
| TR-CORE-004 | Implement a capability registry for every provider adapter. | PROPOSED | P0 | Registry exposes market, mode, operation, currency, ticketing/servicing rights, limits, health, contract/effective dates and test/production status. | Secrets vault, config governance. | All integrations |
| TR-CORE-005 | Keep provider-specific behavior within adapters and normalize only truly common concepts. | USER/PROPOSED | P0 | Business domain contains no provider-specific endpoints/status assumptions; capability differences and error codes remain traceable. | Adapter contract/contract tests. | All integrations |
| TR-CORE-006 | Use multiple eligible supplier providers concurrently where value and rights support it. | USER | P1 | Search aggregation compares normalized offers while retaining provider offer IDs, terms, price timestamp and source; bookings stay with selected provider. | Supplier terms, latency and duplicate results. | Flights/stays/rail/experiences, where supported |
| TR-CORE-007 | Use multiple PSP adapters, with market and payment-method-aware routing. | USER | P0 | Provider choice follows enabled coverage, method, currency, cost/policy and health; no assumption that all PSPs support refunds, payouts or signatures identically. | PSP contracts, funds-flow/legal review. | Payments |
| TR-CORE-008 | Use multiple communication adapters with controlled fallback. | USER | P1 | Email/SMS/messaging jobs use provider-specific adapters, normalized results, delivery events, deduplication and route-specific permissions; callback/API acceptance is not proof of recipient delivery. | Sender ID, consent, country reach, vendor contract. | Notifications |
| TR-CORE-009 | Public pages clearly distinguish live booking, referral/redirect and unsupported modes. | PROPOSED | P0 | A user is never led to believe an externally redirected or unavailable itinerary is confirmed by Travelar. | Supplier rights, consumer disclosures. | Public website |
| TR-BUS-001 | Search bus trips by origin, destination, travel date and passenger count, with additional supported filters. | USER | P1 | Origin/destination are valid stops and ordered on eligible routes; search returns only trips covering the requested segment. | Operator schedule and stop data. | Bus |
| TR-BUS-002 | Price and inventory are segment-aware. | USER | P0 | A seat is unavailable if any overlapping segment conflicts with an active/confirmed allocation; non-overlapping segments may reuse the same physical seat. | Transactional inventory allocator; schedule versioning. | Bus |
| TR-BUS-003 | Prevent concurrent double booking across overlapping segments. | PROPOSED | P0 | Concurrency tests with competing requests never exceed segment/seat capacity; one winner or controlled expiry; all losers receive explicit unavailable outcomes. | Strong transactional enforcement; concurrency testing. | Bus |
| TR-BUS-004 | Support seat selection, eligible auto-allocation and operator seat layouts. | USER/PROPOSED | P1 | Layout is schedule/vehicle-specific and versioned; only eligible seats can be sold; changes preserve existing allocations or enter controlled remediation. | Operator configuration/route plan. | Bus, USSD different UX |
| TR-BUS-005 | Support Travelar-channel and operator-originated booking attribution. | USER | P0 | Immutable creation source and authorized channel actor are recorded; commission policy is evaluated against versioned contract; changes require an approval/audit trail. | Contract, agent identity, counter workflow. | Bus |
| TR-BUS-006 | Support guest booking and secure retrieval. | USER | P1 | Booking reference alone is insufficient to disclose sensitive details or issue privileged changes; retrieval uses additional verification. | PII minimization, rate limits. | Bus and all modes |
| TR-BUS-007 | Generate ticket only after supplier/regulatory and payment prerequisites for the selected flow are satisfied. | PROPOSED | P0 | Ticket state and authoritative provider evidence agree; uncertain payment/submission enters exception queue rather than generating a paid ticket. | LATRA/approved provider, PSP, ticket authority. | Bus |
| TR-FERRY-001 | Manage ferry inventory by sailing and class capacity, not bus-style passenger seat maps. | USER | P0 | Atomic capacity allocation prevents overselling each class; releases happen only according to hold/refund/operator policy. | Vessel/class configuration, schedule versions. | Ferry |
| TR-FERRY-002 | Support port pairs, sailings, passenger types, residence/fare rules and required identifiers when actually required. | USER/PROPOSED | P1 | Field validation derives from operator/mode/country rules with version and reason; unused sensitive fields are not requested. | Operator/TASAC and Zanzibar confirmation. | Ferry |
| TR-AIR-001 | Support one-way, return and multi-city searches where the active provider supports the requested itinerary type. | USER/PROPOSED | P1 | UI prevents invalid itinerary date order and supports adult/child/infant combinations allowed by each provider. | GDS/provider capabilities and market. | Flights |
| TR-AIR-002 | Separate flight shopping, fare reprice, order creation, ticket issue and after-sales operations. | PROPOSED | P0 | Every operation has a provider reference and status; a reservation is not displayed as ticketed unless ticket issuance is verified. | GDS/consolidator/IATA or other ticketing path. | Flights |
| TR-AIR-003 | Show final total and fare restrictions from fresh provider response. | PROPOSED | P0 | Total, taxes/fees, fare conditions, baggage and cancel/change rules are not fabricated or silently overwritten; reprice changes require user acceptance. | Provider response, local consumer/tax rules. | Flights |
| TR-RAIL-001 | Treat Train as a first-class mode now; support rail search/booking according to each network's authorized supply path. | USER / PROPOSED | P0 | Train appears in navigation, search matrix and architecture; each network has its own adapter capability registry; live booking only when authorized; permitted handoff is clearly labeled; no scraping is treated as integration. | TRC/Kenya Railways/vendor agreement and country rules. [40] | Rail |
| TR-RAIL-002 | Preserve station, service, segment, class/fare, local time and provider-specific ticket lifecycle information. | PROPOSED | P0 | Search results preserve official station/service identity, stop/segment data when supplied, price freshness, fare rules, ticket source and unsupported capabilities. | Official station and schedule source; adapter tests. [40] | Rail |
| TR-RAIL-003 | Support supplier-authoritative booking, ticket retrieval, changes/cancellations and refund outcomes. | PROPOSED | P0 | Adapter capability flags govern every action; uncertain requests are reconciled with the supplier before retry; Travelar never creates a false confirmed ticket. | Partner contract, official flow, payment/settlement model. [40] | Rail |

| TR-STAY-001 | Search stays by destination/property, check-in/out, occupants, room count and child ages when required. | PROPOSED | P1 | Date and occupancy validation follows active partner schemas; availability and rate terms are displayed with freshness and cancellation conditions. | Hotel supplier contract and geography/content feeds. | Stays |
| TR-STAY-002 | Revalidate rate and terms before booking. | VERIFIED pattern / PROPOSED Travelar rule | P0 | The supplier's current price-check/preview step runs immediately before booking where required; user accepts material price/terms changes. | Expedia Rapid requires confirmed Price Check; Booking.com Search/Look/Book uses preview/create. [1][2] | Stays |
| TR-STAY-003 | Preserve supplier confirmation and cancellation references. | PROPOSED | P0 | Reservation retrieval matches supplier record; changes and cancellations are submitted through that supplier's documented route and independently reconciled. | Supplier servicing capabilities. | Stays |
| TR-EXP-001 | Treat Experiences as a first-class mode now; model products as date/time-slot, option, participant and capacity-based bookable items. | USER / PROPOSED | P0 | Experiences appears in navigation, search matrix, domain model, adapter contracts and test plan; the flow supports activity-specific options and states. | Viator/GYG/Expedia partner access or direct supplier agreements. [40] | Experiences |
| TR-EXP-002 | Do not imply transactional access when partner rights are content-only. | VERIFIED constraint / PROPOSED rule | P0 | Referral/content-only paths are visibly distinct; Travelar only creates a transactional booking when the partner entitlement and API/contract support it. | GYG/Viator/provider contract. [3][40] | Experiences |
| TR-EXP-003 | Verify activity-specific availability, price, participant requirements, time zone, cancellation rules and confirmation type before checkout. | PROPOSED | P0 | A fresh pre-book check is used where supported; age bands and required booking questions are validated; manual confirmation stays pending; vouchers follow authoritative supplier status. | Provider capability and direct supplier rules. [40] | Experiences |
| TR-EXP-004 | Support a vetted direct-supplier onboarding route for local African experiences. | PROPOSED | P1 | HIMS can review legal identity/permissions, activity safety, insurance where applicable, pricing, capacity, cancellations, payouts, customer data and emergency/support arrangements before activation. | Country-specific legal/commercial review and auditable onboarding workflow. [40] | Experiences |
| TR-BOOK-001 | Maintain canonical Travelar order/booking IDs and separate supplier references. | PROPOSED | P0 | Every supplier action correlates to internal ID, tenant/channel, provider, provider reference and idempotency key without leaking provider secrets. | Domain model. | All |
| TR-BOOK-002 | Use explicit booking lifecycle states and allowed transitions. | PROPOSED | P0 | Invalid transitions fail closed and produce audit evidence; retries do not duplicate reservations. | State-machine tests; adapter idempotency behavior. | All |
| TR-BOOK-003 | Record authoritative source-of-truth by field/operation. | PROPOSED | P0 | Configuration identifies whether schedule, fare, inventory, booking, ticket and refund status come from Travelar, supplier, operator or regulator. | Integration certification. | All |
| TR-PAY-001 | Never trust browser/USSD/app payment-success messages as authoritative. | USER / PROPOSED | P0 | Backend confirms through each PSP's documented verification route, validates callback/authentication as applicable and reconciles delayed/duplicate events. | PSP adapter tests. | All payments |
| TR-PAY-002 | Make payment operations idempotent and secure against replay. | PROPOSED | P0 | Duplicate callback or retry does not create duplicate receipt, booking, refund or journal; invalid signatures/tokens go to security log and do not settle. | Provider-specific mechanism; replay window. | Payments |
| TR-PAY-003 | Resolve payment-success/booking-failure and expired-hold races. | PROPOSED | P0 | No paid ticket is created without valid inventory and supplier confirmation; exception workflow attempts safe recovery, alternative/refund per policy and reconciles money. | Inventory hold policy and supplier/PSP contracts. | Bus/ferry + all supplier modes |
| TR-PAY-004 | Avoid customer card surcharges until explicit legal/contractual clearance. | PROPOSED based on stage-4 issue | P0 | Checkout does not apply an unapproved surcharge; costs are modelled against merchant revenue until reviewed. | Tanzania/Kenya legal and PSP terms. | Payments |
| TR-FIN-001 | Keep an immutable/append-only double-entry journal for posted monetary events. | PROPOSED | P0 | Each posted journal balances per currency; corrections use reversing/adjusting entries, not destructive mutation. | Chart of accounts and accounting review. | Finance |
| TR-FIN-002 | Reconcile bookings, PSP events, bank settlements and supplier liabilities. | PROPOSED | P0 | Exceptions are aged, assigned, resolved and audited; payout eligibility uses verified settlement state. | Provider reports/API, finance procedures. | Finance |
| TR-FIN-003 | Distinguish gross booking value from revenue recognized by Travelar. | PROPOSED | P0 | Finance configuration and reporting separate customer money, supplier payables, tax, PSP cost, fee, markup, commission and recognized revenue. | Contract/accounting policy. | Finance |
| TR-COMMS-001 | Use provider-neutral email/SMS/messaging adapters. | USER | P1 | Message job records purpose, template/version, locale, recipient, consent/legal basis, provider attempt and status; secrets remain server-side. | Provider coverage and PDPC review. | Notifications |
| TR-COMMS-002 | Fail over only when safe for the message semantics. | USER/PROPOSED | P1 | On uncertain submission, query/reconcile or wait according to provider capability before switching; idempotency/deduplication policy prevents duplicate ticket or refund notices where possible. | Delivery reports and vendor semantics. | Notifications |
| TR-COMMS-003 | Separate created/queued/accepted/sent/delivered/failed/unknown states as supported. | PROPOSED | P1 | UI/admin reports do not label API accepted as delivered; out-of-order callbacks do not regress status. | Provider status mapping tests. | Notifications |
| TR-ACC-001 | Passenger may use guest checkout; account is optional unless specific supplier/regulation requires it. | USER/PROPOSED | P1 | Registration is not forced merely to buy; booking contact and consent purposes are distinct from marketing consent. | Supplier field rules, privacy. | Public |
| TR-ACC-002 | Secure guest booking retrieval and ticket resend. | USER | P0 | Requester verifies possession of the registered contact or equivalent challenge; sensitive ID details are masked; sensitive modifications need stronger reauthentication. | Rate limit, token expiry, access audit. | Public/support |
| TR-ACC-003 | Provide account recovery and passenger profile management with consent controls. | USER | P1 | Recovery expires safely; security events invalidate sessions as needed; user can review/update/delete data subject to legal retention exceptions. | PDPC/data rights confirmation. | Accounts |
| TR-OIMS-001 | Support operator organizations, branches, terminals, users, fleet/vessels, routes, schedules, fares, inventory, tickets and manifests. | USER | P1 | Tenant and branch scope enforced on every API; bus segment inventory and ferry capacity have distinct implementations. | Operator workflows and regulator interface. | OIMS |
| TR-OIMS-002 | Support onboarding and production activation lifecycle. | PROPOSED | P0 | Draft → documents submitted → verification → contract → configuration → sandbox/operational tests → approval → activated; suspension prevents new sales but preserves service to existing travellers. | Contracts/licence checks, HIMS. | OIMS/HIMS |
| TR-OIMS-003 | Support OTC/cashier and operator-originated tickets with shift reconciliation. | USER | P1 | Cashier shifts track opening float, transactions, voids/refunds, expected cash, counted cash, variance and supervisor signoff. | Finance/audit policy. | OIMS |
| TR-HIMS-001 | HIMS governs country/mode activation, provider setup, roles, operator onboarding, pricing/commission rules and critical configuration. | USER | P1 | Critical changes are versioned, tested, approved by distinct actors and reversible. | RBAC/maker-checker. | HIMS |
| TR-HIMS-002 | Administrator role does not automatically grant ability to move money or read all passenger identity fields. | USER | P0 | Separate privileged functions and sensitive-data access; access is purpose-bound and audited. | Permission model/ABAC. | HIMS |
| TR-AGT-001 | Distinguish Travelar agents, operator agents, cashiers and marshals. | USER | P0 | Roles are assigned within owning organization; operator agents cannot see other operators; Travelar agents' commissions and operator agent pay are accounted for separately. | Employment/agent contracts. | Agent/OIMS |
| TR-CC-001 | Support assisted booking, booking retrieval, payment investigation, rescheduling/refunds, complaints and supplier escalation. | USER | P1 | Each case has category, state, owner, SLA policy if contracted, evidence and access audit; refund execution permissions separate from support triage. | Support script/approval policies. | Call center |
| TR-MAR-001 | Marshal can view authorized manifest and validate tickets for assigned trip only. | USER | P0 | Access expires after assignment/trip; validation events are device/user/trip/time linked; off-trip and cross-operator access fail. | Device enrollment, minimum data. | Marshal |
| TR-MAR-002 | Offline validation uses signed/limited cached data and explicit conflict handling. | PROPOSED | P0 for offline launch | Test duplicate scans on multiple disconnected devices, stale manifests and revocation. Product must state residual risk; never claim conflict-free offline double-use detection without shared connectivity. | Token design, device sync, operator policy. | Marshal |
| TR-RBAC-001 | Apply deny-by-default and least privilege. | VERIFIED guidance / PROPOSED Travelar rule | P0 | Authorization tests cover tenant, object, field and function boundaries; new route/action is denied absent an explicit grant. OWASP recommends least privilege and deny by default. [4] | Threat model and periodic review. | All internal systems |
| TR-AUD-001 | Audit sensitive reads, financial operations, approvals, tenant/admin changes and adapter/config changes. | PROPOSED | P0 | Event contains actor, scope, action, target, timestamp, correlation ID, before/after representation where appropriate, reason and approval references; secrets/IDs excluded or redacted. | Retention and access policy. | All |
| TR-PRIV-001 | Apply market, mode, purpose and supplier-specific passenger-field configuration. | USER/PROPOSED | P0 | Field is required only when justified by active policy/contract; form stores rule source/version; data access and retention rules documented. | PDPC and supplier requirements. | All |
| TR-PRIV-002 | Do not assume a URL path (e.g., `/tanzania`) creates data sovereignty. | VERIFIED design premise | P0 | Hosting/storage/backup/support/vendor data flow documented separately from website routing. Tanzania PDPC's cross-border-transfer permit page requires information about data, purpose, destination/recipient, duration/method and safeguards. [5] | Country legal review and PDPC. | Platform |
| TR-OBS-001 | Instrument booking, payment, adapter, ticket, notification and reconciliation workflows. | PROPOSED | P1 | Correlation ID spans UI/backend/provider callback without logging sensitive payloads; alerts detect rising unknown/pending and unmatched funds. | Observability design. | Platform |
| TR-TEST-001 | No module is complete because its UI renders. | USER | P0 | Acceptance evidence covers business logic, backend, DB, API, auth, audits, integration failures, concurrency, tests, security, performance, monitoring, documentation, deployment and rollback where applicable. | IDE agent charter. | All |

## 5. Canonical lifecycles and invariants

### 5.1 Booking lifecycle (conceptual; each supplier may require a different mapping)

`DRAFT → QUOTED → HOLD_PENDING (if supported) → PAYMENT_PENDING (if customer funds are required) → SUPPLIER_CONFIRMATION_PENDING → CONFIRMED → FULFILLED/COMPLETED`

Side states include `EXPIRED`, `CANCEL_REQUESTED`, `CANCEL_PENDING`, `CANCELLED`, `REJECTED`, `FAILED`, `PARTIALLY_FULFILLED`, `NEEDS_REVIEW` and `UNKNOWN`. These are Travelar domain states; provider-specific statuses must be retained as raw/normalized evidence. Not every mode has a hold. A ticket/voucher may be a separate fulfilment artifact.

**Invariant:** `CONFIRMED` means that the booking is confirmed by the authoritative source for that product—not that the customer merely clicked Pay. For operator inventory hosted by Travelar, confirmation additionally requires a valid inventory allocation.

### 5.2 Inventory lifecycle

`AVAILABLE → HELD → ALLOCATED/CONFIRMED → USED`

Hold termination: `HELD → RELEASE_PENDING → AVAILABLE` only after the relevant timeout/cancellation/reconciliation rules confirm that release is safe. Avoid releasing inventory based only on the browser closing. Expired holds with payment in an unknown state enter exception handling; the system must prevent a second customer from consuming inventory while the first payment/booking outcome remains materially uncertain, or define a safe compensation path that does not produce a paid no-ticket outcome.

For buses, conflicts are evaluated over all route segments intersecting the passenger's segment. For ferries, enforce class/sailing capacity with atomic decrement/reservation. For GDS content, use supplier offer/order semantics; Travelar cannot guarantee global supplier inventory integrity outside the provider's supported methods.

### 5.3 Payment lifecycle

`CREATED → INITIATED → PENDING → VERIFIED_SUCCEEDED | VERIFIED_FAILED | EXPIRED | UNKNOWN`

Post-success events may include `REVERSED`, `CHARGEBACK_OPEN`, `CHARGEBACK_WON`, `CHARGEBACK_LOST`. Refund is a separate lifecycle: `REQUESTED → APPROVAL_PENDING (where policy requires) → SUBMITTED → PROVIDER_PENDING → COMPLETED | FAILED | UNKNOWN`. A provider's acknowledgement that it accepted a refund request is not necessarily proof that the recipient's money was returned.

**Invariants:**
- Only a server-verified provider event/status can transition a payment into verified success.
- Callback signature/token/IP controls are provider-specific; a source IP allowlist alone is not sufficient evidence of message authenticity.
- Every external event and command is correlated, idempotently applied and auditable.
- When payment success is verified but inventory/fulfilment cannot be completed, the order enters a recovery queue with explicit make-good/refund policy; it is not silently marked confirmed.
- Never capture/store prohibited card data; applicable PCI scope and provider-hosted/tokenized collection are confirmed during design.

### 5.4 Ticket/fulfilment lifecycle

`NOT_ELIGIBLE → ELIGIBLE → ISSUANCE_PENDING → ISSUED → DELIVERED_TO_CHANNEL (optional) → VALIDATED/USED`

Exception states: `ISSUANCE_FAILED`, `ISSUANCE_UNKNOWN`, `VOID_PENDING`, `VOIDED`, `REFUND_PENDING`, `REFUNDED`, `DUPLICATE_OR_REPLAY_FLAGGED`. Ticket issuance and message delivery are separate: a ticket may exist even if an SMS/email provider is down; recovery should resend the ticket artifact through an authorized channel without issuing a second ticket.

### 5.5 Notifications lifecycle

`CREATED → QUEUED → SUBMITTED → ACCEPTED | REJECTED | UNKNOWN → SENT → DELIVERED | FAILED` where channel/provider supports those events. Delivery callbacks may be missing or out of order. Status is monotonic in evidentiary strength where possible; later authoritative results may resolve `UNKNOWN`, but stale callbacks must not regress a completed record. Fallback depends on message purpose, recipient preference/consent, content sensitivity, market, provider capability and duplicate risk.

### 5.6 Settlement and ledger lifecycle

`EXPECTED → DUE → SUBMITTED/IN_TRANSIT → SETTLED | PARTIAL | FAILED | DISPUTED`, reconciled separately from payment verification. Ledger postings are balanced and append-only. Provider statements, internal PSP transactions, bank credits/debits, supplier invoices and booking liabilities must be matched; unmatched funds go to suspense with an owner and aging policy.

## 6. Pricing, commission and channel attribution

- The backend computes authoritative price using a versioned offer, contractual supplier price, taxes/fees, permitted markups, discounts, currency/FX policy and customer-facing fees only where lawful/contractually allowed.
- Provider offers are time-bound. Reprice or revalidate before final confirmation where the provider requires it. Show a material change and require fresh acceptance rather than silently charging more.
- Commission rules are versioned by agreement and may include operator/supplier, service/route, market, channel, campaign, applicable tax basis, start/end time and refund/cancellation treatment.
- Store both immutable booking-source event and any subsequent correction with approval. User agent strings or client-submitted “channel” values are not authoritative attribution alone.
- Operator-originated bookings are not charged Travelar marketplace commission unless a signed contractual exception applies, per the explicit product requirement.
- Travelar's own agents and call center count as Travelar-originated only where the approved source policy says so; operator's own support work does not automatically create commission.
- A refund reverses/adjusts payable, commission, tax and PSP-cost treatment according to contract/accounting policy. It does not overwrite the original journal.

## 7. Privacy, identity and passenger fields

Field requirements are configured using `market + mode + supplier/operator + service + passenger type + rule version`. Forms should explain why mandatory data are requested. Government-issued identification data, children's data, manifest data and gender/residence fields require purpose-specific review. Mask identity values in support UI and logs. Set access/retention/reuse for: booking fulfilment, regulatory manifest, finance, fraud/security, customer support and marketing as distinct purposes.

Tanzania PDPC says organizations must register as a controller or processor before personal-data processing; the Commission also has a permit process for transfers outside Tanzania. This is a constraint to assess, not a conclusion that every category of data must always be hosted only within Tanzania. [5][6]

## 8. Provider adapter contract requirements

Each adapter family must document, at minimum:

- Stable internal interface, schema version and provider-specific extension boundary.
- Operations supported: search, revalidate/price, create, retrieve, modify, cancel/refund/void, ticket/voucher, webhook/status notification and reconciliation—as applicable.
- Provider ID, product/mode, country/market, currency, required credentials/permissions, contract evidence and production approval state.
- Idempotency semantics, request timeout, retryability, rate limits, circuit-breaker conditions, timeout ambiguity and recovery lookup.
- Normalized errors plus retained safe raw/provider code for operations and incident diagnosis.
- Webhook/callback authenticity checks, replay policy, event ordering and duplicate handling.
- Data sent/returned, retention, cross-border movement and logging redaction.
- Contract tests, sandbox/live-test strategy, failure simulation and evidence for production readiness.
- Health/maintenance state and capability-aware provider selection. Do not fail over by changing supplier for an already confirmed booking unless a documented re-accommodation workflow explicitly permits it.

## 9. Research-backed constraints and references

1. Expedia Group Rapid Lodging, “About the Booking API”: booking uses a rate confirmed through Price Check, and successful responses contain itinerary retrieval/cancellation links. https://developers.expediagroup.com/rapid/lodging/booking/about-booking-api
2. Booking.com Demand API, “Search, look and book”: search, availability, `/orders/preview` and `/orders/create` form its documented in-platform accommodation booking flow where enabled. https://developers.booking.com/demand/docs/development-guide/application-flows/search-look-book
3. GetYourGuide, “API integration and requirements,” updated 4 September 2026: access level ranges from basic content to availability and transactional booking, with differing eligibility and contracts. https://partner.getyourguide.support/hc/en-us/articles/13981133907613-API-integration-and-requirements
4. OWASP Authorization Cheat Sheet: least privilege and deny-by-default guidance. https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
5. Tanzania PDPC, “Cross-Border Data Transfer Permit”: permit process and requested data/purpose/destination/recipient/duration/method/safeguards. https://pdpc.go.tz/services/cross-border-data-transfer-permit/
6. Tanzania PDPC, “Registration”: states that collection/processing requires registration as controller or processor. https://pdpc.go.tz/services/registration/
7. OWASP API Security Top 10: object/function-level authorization, resource consumption, improper inventory management and unsafe API consumption risks. https://devguide.owasp.org/en/07-training-education/07-api-top-ten/
8. TRC, official SGR ticketing portal and historic TRC/eGA e-ticketing information: https://sgrticket.trc.co.tz/ and https://www.trc.co.tz/uploads/publications/sw1586000927-HOT%20DG%20KWA%20UZINDUZI%20WA%20mfumo%20wa%20tiketi%20wa%20kielectroniki_updated.pdf — confirms public/official ticketing surfaces, not third-party API access.
9. Kenya Railways, Madaraka Express FAQ: https://krc.co.ke/madaraka-express-faq/ — current public booking channels and service-specific rules; not third-party API permission.
10. Viator Partner API v2: https://docs.viator.com/partner-api/technical/ — booking capabilities and partner-tier restrictions.
11. GetYourGuide API integration and requirements (updated 4 September 2026): https://partner.getyourguide.support/hc/en-us/articles/13981133907613-API-integration-and-requirements — access tiers and eligibility.
12. Expedia Rapid Activities: https://developers.expediagroup.com/rapid/activities — early access/partner-gated product information; current availability must be confirmed.
13. Airbnb Experiences booking tool: https://www.airbnb.com/help/article/2589 — publicly states its embedded Experiences booking tool is being discontinued.
14. `40-train-and-experiences-first-class-mode-research.md` — current integration implications, supplier decision gates and acceptance criteria.

## 10. Definition of requirement acceptance

A requirement may be marked **implemented** only with a link to:

1. The implementation branch/commit and impacted files.
2. Tests covering positive, negative, permission, concurrency, provider timeout/replay and failure-recovery paths as applicable.
3. Evidence that the tests ran, including command/version and failures.
4. The approved current API/contract/decision record and migrations.
5. Security/privacy review for the relevant threat boundary.
6. Observable production readiness (dashboards, alerts, runbook, rollback and support owner) for critical paths.
7. Source-of-truth reconciliation showing status remains consistent across requirements, decision records and open questions.

No team may mark a supplier adapter “production complete” based on mocked responses alone or mark an application “complete” merely because its screens render.

## Stage 13 clarification — current owner-specified frontend flows (24 October 2026)

See `39-frontend-current-requirements-and-product-owner-clarifications.md` for the complete current baseline. The detailed bus/ferry search, passenger form, Booking Information Review, checkout, payment verification, ticket PDF/animation, country configuration, accounts and operating-portal requirements are now captured there. The bus flow deliberately keeps seat selection, boarding/drop-off selection and passenger details on one screen before Booking Information Review. Bus inventory is ordered-segment interval-based; ferry inventory is sailing/class-capacity based. Illustrative ferry amounts are not approved fares. Train and Experiences are first-class modes in Travelar scope, not deferred modes. Their search, result, booking, supplier-adapter and acceptance requirements must be built into the same baseline as bus, ferry, flights and stays; transactional activation in a country remains gated by lawful supplier access and verified fulfillment.

## Stage 19 addendum — data-driven platform requirement (24 October 2026)

All production-varying catalog values and allowed business policies must be database-backed, scoped, versioned, and delivered by authorized APIs. Frontend arrays may contain display-only static design tokens or safe enumerations of implemented component types, but not authoritative production regions, locations, routes, stops, search filters, fares, operator lists, availability, price/commission rules or passenger-field policy. See Documents `47` and `50` and `ADR-DATA-003`. Security, tenancy, payment verification, inventory concurrency and accounting invariants remain enforced by code/database controls and cannot be switched off by configuration.

## Stage 20 delta — channel taxonomy, fiscal/electronic-payment and authority capability

- Add database-backed stable channel records for Travelar web/app, Travelar agent, Travelar call center, operator POS/OTC, operator agent, operator call center, operator white-label and partner API. Channel provenance is server-authenticated and append-only; financial outcome is calculated from a versioned signed agreement, not solely from the channel ID.
- Keep `customer relationship owner`, supplier/operator, contracting legal entity, merchant/collector, data controller/processor and commission beneficiary as separate concepts.
- Treat operator-channel zero marketplace commission as an agreement-specific configurable policy. White-label/API commission remains unresolved per agreement unless explicitly signed. Agent incentive payable is separate from float/wallet and supplier commission.
- Add effective-dated payment-method eligibility by country/jurisdiction, mode/service, channel, collecting party, transaction type and legal evidence. GN 158C of 2026 is a new launch gate for listed categories including bus/ferry/air/rail, hotels and tourism-related services; application and transitional treatment require counsel confirmation.
- Add separate ticketing, PSP payment, fiscal receipt and regulatory submission states. A PDF ticket or PSP confirmation does not prove fiscal acceptance.
- Regulatory adapter features (LATRA/CeTS, TRA EFDMS/VFD and other country authorities) are capability-scoped and disabled until current production authorization/specs are verified.
- Agent float, top-ups and wallet-like stored value must not be enabled until legal/payment-service classification and PSP terms are approved. If approved, use the double-entry ledger and idempotent transaction flows.
- See Documents `51`–`55`, `ADR-CORP-001`, `ADR-CHAN-001`, `ADR-REG-002`, and Stage 20 evidence register.
