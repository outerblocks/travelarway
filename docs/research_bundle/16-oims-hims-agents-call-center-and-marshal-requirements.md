# 16 — OIMS, HIMS, Agents, Call Center and Marshal Requirements

**Product:** Travelar · **Parent company:** OuterBlocks Limited · **Intended operating entity:** OuterBlocks Destinations Limited (verification required)  
**Date:** 23 October 2026 · **Status:** Consolidated operational product requirements; business and regulatory confirmation remains required.

## 1. Organizational boundary

Travelar contains two enterprise-facing management surfaces with different authorities:

- **OIMS — Operator Management System:** operator-owned daily operating workflows for bus/ferry providers and their permitted staff. It is tenant-scoped and must support both Travelar-hosted operations and integration with existing operator systems.
- **HIMS — Headquarters Internal Management System:** OuterBlocks Destinations Limited's internal governance/operations console (under parent OuterBlocks Limited, subject to legal verification) for country and mode activation, supplier/provider configuration, operator onboarding, finance, support, compliance, staff and security administration.

Travelar's own agents are intended to be managed/contracted through OuterBlocks Destinations Limited, subject to contract/legal validation. Operator agents and branch cashiers are managed by their respective operators. Boarding marshals validate tickets for a specific trip and have no general management or finance authority. These boundaries must not be reduced to a single generic “admin” role.

## 2. OIMS requirements

### 2.1 Operator onboarding and activation

Lifecycle proposal:

`APPLICATION_DRAFT → SUBMITTED → DOCUMENT_REVIEW → COMMERCIAL_REVIEW → REGULATORY/OPERATING_CHECKS → CONTRACT_PENDING → CONFIGURATION → TESTING → APPROVED_FOR_ACTIVATION → ACTIVE`

Exception states: `MORE_INFORMATION_REQUIRED`, `REJECTED`, `SUSPENDED`, `EXIT_PENDING`, `CLOSED`. Transitions require role and evidence checks. HIMS/authorized compliance or partnership reviewers own Travelar-level activation; the operator cannot approve itself into live ticket distribution. Suspension stops new sales only as defined by policy and must preserve access to existing bookings, manifests, refund operations and records where lawful/operationally required.

Checklist:

- Verify legal identity/company documentation, tax/business documents and relevant transport/operator/route/vessel information against current rules. Which exact documents apply is country/mode-specific and not finalized here.
- Execute operator, marketplace/distribution, data processing, settlement, commission and customer-support agreements as applicable.
- Choose operating model: Travelar OIMS as primary source of truth; integrated adapter to operator's existing system; or distribution-only where Travelar does not manage the operator's schedule/inventory.
- Configure branches, locations, agents, routes, schedules, service classes, fares, seat layouts or ferry capacities, refunds, channel commissions, notification recipients and access policy.
- Test schedules/fare/availability, booking create/read/cancel, ticket issuance/validation, manifest export/required regulator submission, reconciliation, outage/failure handling and support escalation.
- Record who accepted test evidence and when, provider/adapter versions, approved markets/channels, contract dates, and the rollback/deactivation process.

### 2.2 Organization, branches and workforce

OIMS should model one operator as an organization with a hierarchy such as country/operating company → branch/office/terminal → operational team. The model must support organizations that have no conventional office or operate multiple terminals. Do not assume every operator has the same staff structure.

Required functions:

- Invite/deactivate employees; assign roles and branch/trip scope; require reauthentication/MFA for privileged operations.
- Configure branches, terminals, counters and cashiers; retain history if a branch name/location changes.
- Assign Travelar agents, operator agents, cashiers, supervisors, dispatch staff and marshals distinctly.
- Manage shifts with opening float, transactions, refunds/voids, cash received, electronic receipts, expected versus counted cash, variances and supervisor approval.
- Keep all effective-dated policy/role changes auditable. Staff termination or agency expiry revokes sessions, tokens and scheduled access promptly.

### 2.3 Fleet, vessels and service configuration

#### Bus

- Vehicles/fleet: registration ID, capacity, vehicle class, seat layout/template, amenities and operator-assigned identifier. Validate duplicate fleet identifiers within the relevant authority/market; retain audit history.
- Route pattern: ordered stops, stop IDs, operational boarding/drop-off permissions, direction, timing offsets or schedule points, valid dates, route/fare references and revision history.
- Timetable: trip/date/time, vehicle assignment, crew/operating notes where appropriate, cancellations and substitutions.
- Inventory: seat + all route segments on which a seat is occupied; maintain overlapping-segment conflicts across online, counter, agent and integrated channels. External inventory updates must reconcile before treating Travelar cache as final.
- Pricing: origin/destination segment fare table or eligible fare rules, passenger category, date, route/trip, channel, currency, tax/fee components and effective period. Fare changes do not silently retroactively change confirmed tickets.

#### Ferry

- Vessel identity, licensed/certified status fields where applicable, route/port list, sailing schedule and vessel substitutions.
- Passenger class definitions and available capacity per sailing/class; no seat map as the default model.
- Passenger categories, resident/non-resident or other fare categories only when supported by operator/legal rules; required ID/manifest fields are configurable and purpose-limited.
- Delay, cancellation, missed sailing, class substitution, vessel substitution and re-accommodation workflow with customer communication and refund/credit policy.

### 2.4 Booking, ticket, manifest and boarding operations

- Unified booking view includes internal ID, source channel, operator/source system, route/segment or sailing/class, passenger count, status, payment reference/status, ticket reference/status, change/refund status and support case.
- Do not use “ticket” as a synonym for “booking”; track issuance and validation separately.
- Passenger manifest views/export are scoped to assigned trip, operational need and required legal purpose; hide personal identity fields not needed by the staff role.
- Counter agents can issue eligible bookings only for their authorized operator/branch/services. Refunds, fare overrides, manual ticket voids, manifest export and duplicate-ticket resolution require explicit permissions and configured approvals.
- Ticket print/reprint records the actor, terminal/device, reason and whether reprinting invalidates an older artifact (only where system/operator rules support invalidation). A reprint does not create a second booking or double-count capacity.
- Boarding scan is idempotent for a ticket/trip, logs the validation result and handles wrong trip/date, cancellation/refund, duplicate boarding, offline cache, stale manifest and cross-device sync conflict.

### 2.5 OTC/cashier and operator-originated bookings

Operator-originated transactions should carry verifiable source evidence: authenticated operator tenancy/branch, role, terminal/shift, channel code, payment method/evidence, timestamp and system of record. A client field saying `operator_originated=true` is not sufficient. For API integrations, the source should be derived from authenticated partner credentials and contract scope; for counter sales, from the cashier's authenticated shift and action.

Revenue assurance controls:

- Separate fare collection from cash-count approval and refund approval.
- Require supervisor authorization for adjustments above configured thresholds, manual price override, high-value refund or correction of source attribution.
- Store an event history for voids/refunds and link them to original booking/payment/ticket.
- Reconcile expected cash against count plus authorized movements. Variances cannot be silently edited; they become an exception with owner and resolution record.
- Apply marketplace commission only under the effective signed contract/channel rules; never charge a default commission simply because Travelar software processed operator-originated sale.

### 2.6 Operator reporting

Standard report candidates:

- Scheduled vs completed/cancelled/departed trips, load factor/capacity sold, revenue by route/segment/class and channel, unused capacity, no-show, ticket validation.
- Bookings by source channel and operator branch; counter shift and cash variance; refunds/cancellations; fare adjustments.
- Receivable/payable and settlement statement, commission calculation, PSP transactions, unmatched settlement items and aged disputes.
- Staff actions/access review, manifest access/export, duplicate ticket attempts, support contacts and security exceptions.

Reports must disclose whether the figures come from Travelar's own system, reconciled adapter data or operator-imported data with a last-sync timestamp. No single report should claim completeness if integrations are partial.

## 3. OIMS integration modes

| Mode | Authority/source of truth | Travelar responsibilities | Required exit/failure handling |
|---|---|---|---|
| Travelar OIMS-primary | Travelar's authorized inventory/schedule record, subject to regulatory submission/approval where applicable | Schedule, inventory, tickets, manifests, operator workflows, API distribution, payments/reconciliation as contracted | Export operator-owned records; maintain access to existing bookings; define lawful transition and audit retention. |
| Existing operator system integrated | Operator system authoritative for explicitly agreed fields/actions; Travelar's booking ledger authoritative for its own transactions | Adapter, mapping, synchronization, stale-data detection, event reconciliation, conflict queue, support workflows | Stop selling when required inventory freshness is lost; reconcile in-flight operations; no hidden source-of-truth flip. |
| Distribution-only | Operator/approved third party controls inventory/ticket issuance | Present offers, create supported booking request, persist supplier reference/status, payments if authorized, messages/support | Any unsupported post-booking action is referred to authorized channel and disclosed; no claims that OIMS replaced operator system. |

No integration is “complete” without a field ownership map that states who is authoritative for schedule, fare, availability, reservation, ticket, refund, manifest and settlement.

## 4. HIMS requirements

### 4.1 Platform administration

- Country, market and mode activation gates with evidence and effective dates.
- Provider/adapter registry: products, modes, countries, payment methods/currencies, supported operations, contract and credentials status, sandbox/live state, service windows, limits and circuit-breaker status.
- Operator onboarding/verification, commercial contracts, permitted routes/modes, assigned source model and activation/suspension.
- Versioned fares, commissions, permitted markups, discounts, taxes/fees, passenger data rules, refund rules and notification templates. Use approval for financially/materially important changes.
- User/org/branch/role administration, support queues, audit/event search and security dashboards.
- Finance close, settlement exceptions, payables, payment provider reports, journal export and maker-checker approval queues.
- Incident management for supplier/provider outages, payment integrity failures, manifest issues, privacy incidents and suspected fraud.
- Data-rights and retention workflows: access/deletion requests, legal holds, regulatory transfer permit inventory and subprocessor list.

### 4.2 Departments and responsibilities

| Function | HIMS responsibilities | Forbidden shortcut |
|---|---|---|
| Executive management | Approve strategy, country activation and risk appetite within delegated authority | No unrestricted direct edit of ledger or passenger IDs by title alone. |
| Operations | Operator activation recommendations, support/outage metrics, trip disruption monitoring | Cannot override regulatory conditions or silently mark supplier-confirmation pending as confirmed. |
| Finance/Treasury | Reconciliation, payout batches, bank/PSP statements, cash variance, close and reports | Preparer must not self-approve sensitive payout/refund where maker-checker is required. |
| Operator partnerships | Due diligence, contracts, configuration coordination and account health | Sales target cannot bypass legal/provider approval gate. |
| Customer experience | Case queue, contact history, allowed ticket resend, escalation | Support agents cannot access full card data or trigger unrestricted refunds. |
| Compliance/Legal | Licence/contract evidence, data map, policies, regulator requests and incident advice | Do not approve a legal position without identified authority/evidence owner. |
| HR/Admin | Employee onboarding/offboarding, devices, employment/agent documents | HR does not grant finance/admin privileges without owner approval. |
| Technology/IT | Deployments, provider configuration, observability, incident triage, credential lifecycle | Engineers do not change production financial rules without approval/change record. |
| Cybersecurity | Alert triage, incident evidence, vulnerability/privileged-access reviews | Automated response must have safeguards and not destroy evidence. |
| Internal audit/risk | Independent review of financial controls, access and exceptions | Audit has read/access needed for assurance, not operational payment approval by default. |

### 4.3 High-risk action approvals

High-risk examples (actual thresholds are decisions): adding/changing a PSP bank/settlement account; releasing supplier payouts; refund over threshold; write-off/chargeback decision; manual financial journal; changing commissions/markups/tax rules; enabling a new country/provider/mode; altering ticket-source attribution; exporting full manifest; changing retention/deletion behavior; granting privileged roles; disabling an adapter circuit breaker; or replaying provider operations that could make bookings or move money.

For each action define: preparer, reviewer/approver, executor if separate, audit reviewer, max amount/limit, evidence required, emergency path, expiry, monitoring and reversal plan. The person who requests a change should not be its sole approver and auditor.

## 5. Travelar agent portal

Travelar agents work under OuterBlocks Limited's programme and contracts, not under the operator's employment hierarchy merely because they sell that operator's ticket.

Minimum capabilities:

- Assigned markets, modes, suppliers/operators and commission contract visible as read-only policy.
- Search eligible inventory, book under approved channel, secure payment/cash handoff flow if expressly enabled, retrieve/resend ticket, view attributable commission and required reconciliation obligations.
- Record customer permission/contact purposes and only required passenger information.
- Agent balance/commission reports must distinguish earned, pending, paid, reversed/refunded and withheld/disputed amounts.
- No agent can alter source attribution, commission percentage, supplier fare, payment status or payout bank details. Corrections use supervisor/finance workflow.
- Offline/cash transactions must be constrained by authorized float/credit and reconciliation policy; no untracked personal-wallet collection unless explicitly lawful and contract-approved.

## 6. Operator agent and branch cashier portal

Operator agents are provisioned by a particular operator, branch and contract; they do not see Travelar's internal books or other operator customers. Features may mirror booking search/creation and ticket retrieval, but default financial ownership, settlement, commission and support responsibility belong to the operator unless the contract says otherwise.

Cashier functions include authenticated shift open/close, sale receipt, ticket print/reprint, permitted void/refund, cash and electronic tender, expected/count reconciliation, supervisor variance approval and printable/exportable close summary. Reprint and cancellation policies are operator-specific.

## 7. Call-center console

### Case categories and workflow

- Find booking by secure lookup and verification challenge; do not expose a passenger's identity from a booking reference alone.
- Payment investigation: link booking, payment intent, PSP attempts/events, provider status, provider transaction reference, ledger journal and reconciliation exception. Agents can explain status but only authorized finance/recovery workflows may change the money outcome.
- Ticket resend/retrieval: re-send the existing valid artifact through a consent-/purpose-compliant route; do not generate a second ticket.
- Change/cancellation/refund: retrieve provider/operator conditions; quote penalties and new price; collect required customer acceptance; execute supported action with step-up permission; track pending state and provider confirmation.
- Disruption handling: supplier/operator status, affected trips/passengers, approved alternatives, manual contact attempts, refund/credit policy and incident log.
- Complaints and supplier escalation: case owner, category, urgency, evidence, supplier references, deadlines where contractually known and resolution code.
- Call recording only where lawful and with appropriate notice/consent and retention/security policy; no default assumption that all calls may be recorded.

### Call-center controls

- Mask IDs, payment details and unnecessary passenger information; access to full manifest is not required for normal support.
- Restrict bulk customer lookup, exports, password resets and refund operations. Log search reasons for high-risk sensitive records.
- Do not allow support to alter fare, supplier contract, payment status or commission to make a case “look resolved.”
- Use approved scripts/templates whose facts derive from booking/payment/provider state, including “pending/under investigation” states.
- Measure first response/resolution times only against an established service policy; do not invent an SLA before staffing/vendor arrangements exist.

## 8. Marshal application

### Device and trip lifecycle

- Invite/enroll an assigned employee; strong device authentication, encrypted local data, short offline authorization window and remotely revocable device credentials when it reconnects.
- Download only manifests needed for assigned trip(s), limited to allowed pre-departure window, with only fields required for boarding.
- Ticket QR/token verification validates authenticity/format, intended trip/operator/date, ticket current status and previous use in available online state.
- Online scan is idempotent for ticket/trip. Repeat scan returns “already validated” with prior event details permitted to marshal, and never increments boarding twice.
- Offline mode uses signed, time-bounded manifest/ticket data and local append-only scan events; displays “offline provisional validation” when central status cannot be checked.
- Synchronization submits unique event IDs; server resolves duplicate/conflicting scans deterministically and retains all evidence. If two offline devices accepted the same ticket, software cannot retroactively guarantee which passenger physically boarded; operator procedure and manual resolution are essential.
- On device loss, revoke credentials, expire cached authorization at design limits and alert on unusual access when device reconnects. Use remote wipe if technically available, but do not assume it will succeed while offline.

### Marshal acceptance tests

- Valid ticket on assigned trip accepted once.
- Ticket for another trip/date/operator rejected.
- Cancelled/refunded/voided ticket rejected when current status is accessible.
- Duplicate online scan flagged.
- Two offline devices scan one ticket: both local states and subsequent server conflict are explicit; no false promise of universal offline prevention.
- Device disabled/revoked after reconnect loses further access and sync preserves audit evidence.
- Marshal cannot search arbitrary booking, edit passenger data, issue refund, change fare or download another operator's manifest.

## 9. Cross-system service principles

- OIMS/HIMS, agent/call center and marshal apps call the same authenticated backend business services; the UI never bypasses normal pricing, inventory, payment, authorization or audit.
- Shared identity may support multiple applications, but audience, tenant, device and role scopes remain separate. Do not share privileged sessions across `oims`, `hims` and `agents` domains by default.
- An adapter outage must preserve support and after-sales access to existing booking records where available. A disabled provider can stop new searches/bookings without erasing existing ticket status or customer service duties.
- Country, operator, trip and branch scope are attributes enforced server-side on every request, not just hidden navigation items.
- All financial and sensitive-data actions emit audit events with actor, reason, target, timestamp and correlation ID.

## 10. Unresolved decisions before implementation

1. The exact operator onboarding documents and legal/route checks by country/mode.
2. OIMS primary vs existing-system integration vs distribution-only pilot operators.
3. Which supplier, operator and regulator records are authoritative for each field.
4. Manifest columns, retention, permitted exports and jurisdiction-specific identity rules.
5. Offline marshal authorization window, QR/token format, supported devices and conflict escalation SOP.
6. Cash/credit/agent wallet limits, payout schedule, commissions, approval thresholds and dual-control policy.
7. Support operating hours, call-recording policy, complaint route and service levels.
8. Exact role naming and reporting hierarchy after OuterBlocks's initial team is staffed.

## 11. References

- PDPC Tanzania controller/processor registration and cross-border permit guidance: https://pdpc.go.tz/services/registration/ and https://pdpc.go.tz/services/cross-border-data-transfer-permit/
- OWASP Authorization Cheat Sheet (least privilege, deny-by-default, periodic permission review): https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Session Management Cheat Sheet (server-side expiry, secure session IDs, renew after privilege changes): https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP API Security Top 10 (object-level/function-level authorization, sensitive business flows, inventory management and unsafe API consumption): https://devguide.owasp.org/en/07-training-education/07-api-top-ten/
- LATRA official documents and current e-ticketing approvals remain launch evidence dependencies: https://www.latra.go.tz/

## Stage 13 clarification — separate operating portals and entity-role issue (24 October 2026)

See `39-frontend-current-requirements-and-product-owner-clarifications.md`. `travelarway.com`, `oims.travelarway.com` and `hims.travelarway.com` are proposed domains, not verified deployments. Public passenger, operator and HQ identity contexts require separate application trust boundaries and authorization; shared Keycloak deployment does not imply shared permissions or automatic session sharing. Bus and ferry OIMS need distinct workflows and strict data boundaries even if common backend modules are reused. Stage 21 supersedes the earlier entity-name contradiction: use OuterBlocks Limited as parent and OuterBlocks Destinations Limited as intended operating entity; do not use the superseded name Travelar Destinations Limited. Before contracts, licences, merchant accounts or supplier agreements are issued, verify registry records, signatory authority and regulated activity eligibility.

## Stage 19 addendum — operational workflow blueprint (24 October 2026)

Document `48-hims-oims-operating-systems-modules-and-shared-engines.md` adds a module-by-module target catalogue for HIMS/OIMS and shared domain engines. Document `49-role-based-daily-workflows-and-user-journeys.md` adds daily work loops for Executive, Operations, Partnerships, Finance/Treasury, Customer Experience, Legal/Compliance/Privacy, Content, Engineering/IT, Cybersecurity, HR/Admin, Internal Audit, operator owner, dispatcher, cashier, operator finance, service supervisor and marshal roles. These are proposed workflows requiring validation by the actual responsible role owners; approval amounts and SLAs are not invented.

## Stage 20 addition — portal and channel boundaries

The proposed named surfaces are `travelarway.com`, `hims.travelarway.com`, `oims.travelarway.com`, `agents.travelarway.com`, operator branch/agent contexts within OIMS, and verified custom-domain white-label/API surfaces. These are proposals until domain ownership/deployment is confirmed. All surfaces use the same core services and authoritative inventory but have distinct app client/audience, tenant, branch/trip and role scopes; do not share privileged sessions by default.

Channel source must be derived from trusted authentication/context (Travelar agent membership, HIMS call-center actor, OIMS branch/shift, verified white-label domain or partner API identity), not a user-editable `origin_source`. HIMS call-center and OIMS operator call-center bookings remain distinct commercial channels. Operator-originated commission treatment comes from the signed policy. Refer to Document `53` and `ADR-CHAN-001`.

Agent pre-fund/float is a separate financial concept from commission. Do not launch wallet-like functionality without payment-law classification and provider/contract approval. See Document `51`.
