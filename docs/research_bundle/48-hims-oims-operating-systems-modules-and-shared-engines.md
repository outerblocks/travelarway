# 48 — HIMS, OIMS, Shared Engines and Operational System Blueprint

**Product:** Travelar · **Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Stage:** 19 · **Date:** 24 October 2026  
**Status:** Proposed target blueprint; workflow owners and local operating procedures require validation.

## 1. Purpose

HIMS and OIMS are operational work systems, not simply admin dashboards. They need queues, tasks, records, approvals, exception handling, searchable evidence, reporting and role-specific actions. The user's landing page, public booking flow, agent/call-center tools and marshal app share a common domain foundation but expose different safe capabilities.

- **HIMS (Headquarters Internal Management System):** OuterBlocks' control plane for markets, supplier/operator access, configuration governance, commercial terms, platform operations, finance, compliance, customer support, security and internal audit.
- **OIMS (Operator Management System):** operator-tenant control plane for authorized service setup and daily delivery of bus/ferry operations, counter/agent sales where enabled, staff/branch control, manifests, cash shifts, disruption management and operator reports.
- **Shared platform engines:** services and domain modules used by public web, HIMS, OIMS, agents, call centre and marshal clients. Shared code does not imply shared permissions or unrestricted shared data.

## 2. Deployment and architectural boundaries

Use the current proposed modular-monolith-first architecture: one controlled backend deployment composed of domain modules with explicit module/API boundaries, PostgreSQL as authoritative transactional store, background workers/outbox for asynchronous work, and provider-neutral adapters. Extract a service only for a demonstrated scaling, isolation, compliance, operational or team-ownership reason.

HIMS/OIMS are distinct application experiences and authorization scopes; they need not start as separate backend deployments. They must not share a generic `admin` permission. Separate UI routes/clients, role/capability sets, session audiences where useful, tenancy context, API scopes, audit queries and data-projection rules. The server derives actor organization and tenant scope from verified identity/session and stored membership, never trusts arbitrary tenant IDs submitted by the browser.

## 3. Shared engine catalogue

### 3.1 Identity, organization and authorization engine

Users, organizations, memberships, branches, teams, role assignments, capabilities, scopes, temporary grants, access expiry, MFA/step-up requirements, approvals and access reviews. Keycloak is the current identity candidate; Travelar's backend remains authoritative for business membership, tenant ownership and domain permissions. Apply deny-by-default and verify object/field/action scopes on every protected request.

### 3.2 Master data and configuration engine

Country/market/locale/currency/timezone, mode capability, location hierarchy, operator/supplier, branch, stop/port/station/airport, route, schedules, field schemas, policy/contract versions, publication lifecycle and source-of-truth registry. See Document 47.

### 3.3 Catalog and search/discovery engine

Builds eligible search profiles from active config and current data; requests data from the correct authority; supports indexed location search, aliases, geospatial proximity where relevant, filters, pagination, sorting, freshness, availability and provider provenance. Its result is an offer/reference, not a promise of globally authoritative inventory unless the source supports that.

### 3.4 Pricing and quote engine

Takes an authenticated/contextual request plus current fare/offer and applicable rule versions; applies only authorized fees, commission/markup display rules, coupon allocations, passenger categories, currencies and taxes/rounding policies. Produces a time-bounded quote with line items and version snapshots. The server recomputes or revalidates price at the required checkout boundary. It never trusts a browser-submitted total.

### 3.5 Inventory and availability engine

Has explicit mode strategies:
- Bus: seat allocation over all route segments, using atomic transactional checks for overlap.
- Ferry: sailing/class capacity allocations, not bus-style seat maps by default.
- Flights/stays/train/experiences: supplier-specific offer/hold/order semantics; Travelar states what is known and does not claim to own supplier inventory it cannot reserve.

Uses holds only when supported, expiry/lease policies, idempotent allocation, conflict queues, reconciliation and freshness limits.

### 3.6 Booking orchestration engine

A common order/booking envelope plus mode/supplier-specific state machines. Coordinates quote, inventory/offer reservation, payment intent, supplier confirmation, ticket/voucher/booking reference, notification, cancellations/refunds and recovery. State transitions are explicit and audited. Uncertain provider outcomes enter `UNKNOWN`/review/reconciliation states rather than being guessed.

### 3.7 Provider and integration engine

Registry, capabilities, contract/credential references, country/mode eligibility, adapter version, health, rate limits, timeouts, retries, idempotency, circuit-breakers, mapping versions, raw events and normalized states. GDS/OTA/rail/transport/PSP/SMS/email APIs are not assumed to have identical operations.

### 3.8 Payment, ledger and settlement engine

Payment attempts, provider callbacks/status enquiries, verified evidence, refunds, chargebacks, double-entry journals, mode subledgers, commission and markup calculations, supplier payables, settlement matching, payout approvals and bank reconciliation. Financial state is distinct from booking and ticket status. See Documents 43–45.

### 3.9 Workflow and case-management engine

Tasks, queues, owner/assignee, due dates, approvals, escalation, evidence, comments, transition rules and history for operator onboarding, change publication, support, payment exceptions, refunds, disruptions, content review, access review and incidents. Start with explicit state machines and durable task records within the modular monolith. Evaluate BPMN/DMN or durable workflow infrastructure only when business workflow complexity, wait duration, human handoffs, recovery needs and ownership justify it. Never let a generic workflow editor bypass domain invariants.

### 3.10 Communications engine

Durable notification intents, localized template/version, approved purpose/consent, provider attempts, deduplication, acceptance/delivery/failure/unknown status and controlled failover. It does not equate provider acceptance with delivery or change booking/payment state by itself.

### 3.11 Content and destination knowledge engine

Destinations, guides, article revisions, official sources, review date, expiry/review tasks, localized versions, campaigns/offers, image rights, editorial approval and publication windows. Visa/immigration/safety content needs source provenance and review alerts; the CMS is not an authority for inventing legal requirements.

### 3.12 Audit, risk and security operations engine

Append-only domain audit events for configuration, permissions, sensitive records, financial actions, exports, provider actions and approvals; security alert routing; incident tasks; evidence retention; redaction and monitoring-health checks. Application logs and accounting audit records serve different purposes and must both be protected.

### 3.13 Reporting and analytics engine

Role-scoped dashboards and reports built from identified source systems, reconciled facts and versioned metric definitions. Shows data freshness, incomplete-provider coverage and exceptions. Operational analytics should not silently become an authoritative ledger; posted accounting entries remain the financial book of record.

### 3.14 Background job and event engine

Transactional outbox for important domain changes; durable queues for provider polling, reconciliation, notifications, report preparation, cache invalidation, schedule alerts and review expiry. Jobs need idempotency, retry limits, dead-letter/exception queue and replay safeguards. Retried work must not create duplicate tickets, payments, refunds or payouts.

## 4. HIMS module catalogue

### H1. Executive control and performance

Company-wide summary by mode, market, operator/supplier, booking funnel, revenue/accounting status, support, service disruptions, integration health, security incidents and unresolved risk. Every metric identifies the source, currency, period and reconciliation/freshness status. Executive access does not automatically grant raw passenger ID or money-movement permissions.

### H2. Market, country and mode activation

Configure supported country/market/mode combinations, locale/currency/time zone, applicable field policy, regulatory evidence, supplier coverage and launch state. Activation is evidence-gated at the appropriate market × mode × provider/operator scope—not one blanket global switch.

### H3. Supplier/operator onboarding and partnerships

Lead/application, due diligence, verification, legal/operating checks, contracts, commercial terms, capability assessment, setup, tests, approval, activation, renewal, performance concerns, suspension/exit. Tracks required evidence, reviewers, expiry and reasons. Commercial targets cannot override compliance/provider gates.

### H4. Configuration studio

Scoped editor for locations/routes/search profiles/card schemas/fields/fees/policies/templates/approval rules and display settings; validation, simulation, impact preview, approval, publish, rollback/supersede and audit views. It does not edit source code or store secrets.

### H5. Provider and integration control

Provider registry, adapter operations supported, eligible markets/modes, contracts, credential references, environment/production entitlement status, health, latency/error rates, rate-limit status, outage timeline, mapping and version, reconciliation queue. Secret values are never displayed.

### H6. Commercial contract and rule registry

Effective-dated operator, supplier, channel, commission, markup, permitted fee, tax/receipt, cancellation, refund, payment route and settlement terms. Supports approvals, attached evidence, expiry alerts, transaction snapshots and reports of rules not confirmed by written contract.

### H7. Finance and treasury

Mode/tenant subledgers, payment status, provider transactions, cash shift variances, commissions, supplier payables, refunds, chargebacks, settlement runs, payout batches, bank statements, reconciliation exceptions, close and exports. Maker-checker applies to material sensitive actions. Read access and move-money access are distinct capabilities.

### H8. Operations control room

Upcoming trips/sailings, cancellations/delays, stale inventory, provider outages, failed issuance, booking/payment mismatch, boarding/manifests issues and supplier incidents. Authorized staff use explicit intervention workflows; dashboard buttons cannot directly rewrite underlying evidence.

### H9. Customer experience and case management

Secure booking lookup, complaints, payment investigation, change/cancel/refund request, travel disruption, supplier escalation, contact history, templates, assignment/priority/due date and resolution. Sensitive identity and refund execution permissions are purpose-specific.

### H10. Content, deals and destination information

Offers/campaigns, destination pages, guide/article drafts, official-source registry, editorial review, multilingual versions, image rights, schedule/effective dates, expiry/review alerts and search publication. Offers must be connected to a real supplier/product/price/eligibility or be clearly editorial rather than bookable.

### H11. Compliance, legal and privacy

Evidence register, contracts/licence dates, jurisdiction-specific obligations, data maps/subprocessors, data-subject request cases, retention/legal holds, incident records, regulator correspondence and export history. Exact process and retention intervals require legal review.

### H12. People, teams and access administration

Staff lifecycle, organizational department/team, role/capability assignments, joiner/mover/leaver tasks, device status where appropriate, temporary access and periodic access recertification. This is platform administration, not an assumption that Travelar must build a complete payroll/HCM product.

### H13. Security and incident operations

Alerts, triage, severity, incident owner, affected tenant/service, evidence, containment task, credential revocation request, notifications, post-incident actions and monitoring-health. High-impact security changes are separately permissioned and audited.

### H14. Internal audit and risk

Read-only assurance workbench, scoped audit evidence, sampled transactions, control tests, unresolved exceptions, access reviews and sign-off. Auditors cannot approve the transaction they independently test by default.

### H15. Reporting and data operations

Versioned reports, data-quality exceptions, provider sync status, source authority/freshness, exports with permissions, scheduled report jobs and metric definitions. Export actions are logged and scope-limited.

## 5. OIMS module catalogue

### O1. Operator home and daily operations queue

Today's and upcoming trips/sailings, sales, capacity, unresolved tickets, cash shifts, staff/terminal notices, data-sync issues and disruptions. All data is scoped to the operator and permitted branch/service.

### O2. Organization, branch, terminal and workforce

Operator-owned company profile, offices/counters/terminals, staff, roles, shifts, branch permissions, agent assignments and marshal trip assignments. Operator cannot assign itself Travelar-HQ capabilities.

### O3. Fleet/vessel and service catalog

Bus vehicles, identifiers, seating templates, amenities and service class; ferry vessels, class inventory and capacity; active/inactive records and substitution history. Required certification/operating fields are configurable by market and verified policy.

### O4. Routes, stops/ports and schedules

Ordered route stops, permitted boarding/drop-off pairs, service dates, timetable, sailing, arrival/departure times, exceptions and revisions. Changes affecting existing sales trigger an impact preview and disruption/re-accommodation process rather than silently overwriting tickets.

### O5. Fares, availability and inventory

Effective-dated fares, passenger category, channel eligibility, eligible route segments, class fares, caps and holds. Editing published fares needs authorization; already-confirmed booking prices remain historically reproducible.

### O6. Bookings, ticketing and manifests

Search by authorized identifiers, creation if permitted, reservation/ticket status, printing/reprint with reason, cancellations/void/refund request, passenger manifest, boarding status and change history. Booking, payment and ticket status remain distinct.

### O7. Counter sales/POS and cashier shifts

Opening float, sales, payment method/evidence, receipts, authorized void/refund, ticket prints, shift movements, closing count, expected/count variance, supervisor review and export. Cash receipt, cash custody and accounting approval are separated.

### O8. Trips, dispatch and boarding

Trip/service assignment, departure readiness, crew/operator procedures as applicable, trip change, manifest access, boarding progress, duplicate-scan resolution, departure event and trip closure. Marshal access is trip-scoped and privacy-limited.

### O9. Service disruption and customer resolution

Delay, cancellation, vessel/vehicle substitution, missed departure, capacity issue, customer communication, alternatives, refund/credit request, financial consequences and closure evidence. Operator action must follow contract/Travelar rules applicable to the channel.

### O10. Operator finance and reconciliation

Sales by channel, PSP transactions, operator-collected versus Travelar-collected routes, commission statement, settlement statement, expected receivables, payout status, cash shift close and unresolved finance cases. The operator sees only financial records it is entitled to see under contract and tenancy.

### O11. Integrations and data quality

Status of operator system feed, field ownership, last sync, stale or conflicting records, rejected updates and provider support contact. Operator must not silently overwrite an externally authoritative field where contract says the other system owns it.

### O12. Operator reports and audit

Trips, occupancy/load, revenue and refunds, channel attribution, route/segment performance, shifts, service delivery, manifests and audit events scoped to the tenant. Data limitations and last sync are visible.

## 6. Related portals are not generic admin clones

- **Travelar agent workspace:** assigned providers/markets and contracts, eligible search/booking, authorized assisted-sale/payment handoff, ticket retrieval, attribution, commission status and own exceptions. Cannot change commissions or attribution.
- **Call-centre workspace:** verified booking lookup, customer case, state explanation, supported change/refund request, supplier escalation and communication history. Triage is separate from executing refunds.
- **Marshal app:** assigned trips only, minimal manifest data, QR validation, online/offline state and conflict sync. No general passenger search or finance access.
- **Customer account/guest retrieval:** booking-specific access through verified contact/challenge; no dependency on a staff portal.

## 7. Cross-module rules

1. One domain record has one declared authority for each field/action, even where multiple systems keep copies.
2. All important operations have unique IDs, correlation IDs, idempotent commands where possible, state transitions and audit events.
3. Public UI, HIMS, OIMS and background jobs use the same backend business services and invariants—not separate implementations of commission, fare or payment logic.
4. APIs enforce scope even if the UI hides a button. Default deny.
5. Every exception goes to an explicit queue with owner/status/reason; do not bury unresolved conditions in logs alone.
6. Dashboard aggregates are projections, not a substitute for source records or the financial ledger.
7. Configuration changes have effective versions; historical transactions are not retroactively reinterpreted.
8. Onboarding/activation records the evidence and scope. A provider can be approved for one mode/market but not another.

## 8. Workflow technology position

Start with code-owned state machines and persisted workflow/task records, backed by transactions/outbox and workers. This is adequate for many finite operations such as publishing a configuration, closing a cashier shift, approving a commission change, or routing a support case. Prefer bounded declarative decision tables for policies with manageable inputs/outputs. A BPMN/DMN platform or durable workflow engine is an option to test if workflows demand long-running waits, cross-team visual modelling, timers, compensation and reliable replay. Do not add a new platform just because “workflow engine” appears in the requirements.

Temporal documents durable execution that resumes workflow state after failures; Camunda documents BPMN/DMN for processes and decisions. Those capabilities are useful candidate patterns, not evidence that either product is automatically right for Travelar's current team or hosting constraints:
- https://docs.temporal.io/temporal
- https://docs.camunda.io/docs/components/concepts/bpmn-dmn-feel/
- https://camunda.com/dmn/

## 9. Decisions needed from product/operations owners

Before final implementation, document and approve: actual org chart and delegated authority; named owners for each HIMS queue; operator branch/terminal variations; supported shift/cash rules; who can create/change trips after sales; disruption compensation rules; precise approval thresholds; role scope by mode/market; source-of-truth per integration field; retention/legal hold rules; content reviewer and visa-guide review cadence; escalation contacts/on-call; accounting reports and chart of accounts. Do not fabricate SLA, pay-out, legal or supplier rules in code.
