# 71 — HIMS/OIMS Operating Workflows, Approvals and Audit

**Date:** 28 October 2026  
**Status:** Product/operations requirements proposal, derived from Travelar's existing HIMS/OIMS research and current integration themes. Role/limits must be approved before production.

## 1. Operating model

HIMS is Travelar headquarters' command center; OIMS is the operator's operational system. Agent portals, call-center tools and operator/customer channels use the same authoritative booking/payment/inventory/ledger engines through separately authorized interfaces. Do not create parallel logic in each UI.

Support at least these OIMS integration operating modes per operator/mode:

1. **OIMS as source of record:** operator configures and manages routes/inventory/ticketing within Travelar OIMS.
2. **Integrated operator system:** operator's existing platform remains source of inventory/ticketing; Travelar exchanges data via an approved adapter and handles only contracted actions.
3. **Distribution-only:** supplier owns booking/ticketing; Travelar discovers/distributes and stores the minimum order/reference details allowed by contract.

These modes must be operator- and mode-scoped, effective-dated, audited and approved; the same operator could use different models for different travel modes.

## 2. HIMS module map

| Module | Everyday purpose and core actions | Key queues / controls |
|---|---|---|
| Executive control and readiness | Review market launch, risk, growth, incidents, margin, supplier status and readiness gates. | Only verified metrics; unresolved launch gates and decisions; no unapproved override. |
| Market and mode configuration | Activate markets/modes and control channels, currency, locale, feature flags and eligibility. | Approval, effective dates, rollback snapshot, launch checklist. |
| Operator/supplier partnerships | Applications, KYB/legal review, contracts, rates, integration status, service performance and suspension. | Documents missing, contract renewal, compliance evidence, provider SLA incidents, account freeze/restore approvals. |
| Provider integration control | Credentials by environment, API/adapter health, rate limits, scopes, versions, webhook endpoints, circuit breakers. | Expired credential, schema drift, failure spike, entitlements and production gates. Secrets remain in secrets manager, never in editable business tables. |
| Configuration studio | Manage data-driven field schema, routes/stops, destination catalog, mode capabilities, result profiles, policies and content parameters. | Draft → validate → reviewer → approved → scheduled/published → monitor → rollback; immutable version and diff. |
| Commercial rules | Operator-specific commission, markup, discount, channel attribution, settlement and contract effective dates. | Changes require maker-checker, counterfactual preview and audit; immutable booking price/commercial snapshot. |
| Finance and treasury | Reconciliation, subledgers, supplier payables, collections, payout batches, refunds, fees, FX, taxes/levies. | Daily reconciliation, suspense/unallocated collections, payout approvals, unmatched statement items, close-period controls. |
| Operations control room | Booking/availability failures, trips/sailings, disruptions, inventory holds, schedule changes, system incidents. | Severity/SLA queues, owner assignment, approved incident playbooks, customer impact. |
| Customer experience | Cases, refunds, cancellation, reschedule, payment disputes, complaints, notices and escalations. | Role-scoped access, supplier evidence, refund/case SLA, approval state, communications log. |
| Content and destination information | Guides, destination content, deals, imagery and official-source review. | Editorial review, source expiry/revalidation, locale translation review, publish/unpublish approval. |
| Legal/compliance/privacy | Regulatory records, permissions, data rights, consent/retention, contracts, breach/fraud case. | Legal hold, regulator deadline, DSR, cross-border assessment, approved freeze/suspension. |
| People and access governance | Roles, tenant/branch assignments, MFA status, joiner/mover/leaver, operator account lifecycle. | Least-privilege review, MFA gap, privileged changes, emergency access expiry. |
| Cybersecurity and incidents | Alerts, suspicious access, credential compromise, vulnerabilities, provider breach or outage. | Severity response, containment approvals, evidence preservation, incident timeline and postmortem. |
| Audit, risk and internal controls | Review financial/configuration/access events and policy exceptions. | Immutable event references, maker-checker proof, periodic control sampling, exceptions and remediation owner. |
| Reporting/data quality | Marketplace performance, operator performance, provider quality, freshness and reconciliation. | Lineage, metric definitions, data quality defects, source/staleness labels and export permissions. |

## 3. OIMS modules

- Tenant/operator profile, legal/business records, contracts and operating mode.
- Branch/station/port/terminal/location and agent/point-of-sale assignment.
- Workforce/roles/access; shift start/end; branch and register assignment; staff training/certification evidence when legally required.
- Bus fleet, vehicle registrations and segment-based route inventory; ferry vessels, capacity/class and sailing schedule; other modes only where permitted and integrated.
- Route/stop/boarding/drop-off catalog and effective-dated schedules.
- Fares, occupancy, seat/segment or capacity inventory, discounts and approved sales windows.
- Booking/ticket/manifest, passenger changes, ticket validation, duplicate/reissue controls and refund process.
- Counter POS for available payment modes; order-linked BillPay, assisted USSD, approved QR allocation, operator-direct collection and approved offline behavior.
- Trip/sailing operations: dispatch/manifest close, departure, boarding, capacity, disruption, no-show and arrival.
- Operator finance: booking revenue, taxes/levies, Travelar commission/markup according to contract, settlement/payables, cash/QR/POS reconciliation and end-of-shift close.
- Service/disruption cases and passenger notifications.
- Integrations, failed sync queue, audit log, dashboards/reports and data exports.

Do not require ferry to use bus seat-map logic; do not model bus inventory only as vehicle endpoints (seat occupancy must be segment-aware). Do not imply a non-integrated mode has live inventory/ticket issuance just because the UI exists.

## 4. Role separation

Illustrative role families (final role/action matrix is in Document 17 and must be reconciled before implementation):

- Travelar public customer.
- Travelar agent / agent supervisor.
- Call-center agent / call-center supervisor.
- Operator ticket clerk / counter cashier.
- Operator dispatcher / trip supervisor.
- Operator finance clerk / finance approver.
- Operator administrator (tenant-scoped, not platform-global).
- Travelar support operations / operations supervisor.
- Supplier integration operator / integration engineer.
- Finance analyst / finance approver / treasury approver.
- Compliance/legal officer.
- Content editor / content approver.
- Security analyst / incident commander.
- Platform administrator / IAM administrator.
- Internal auditor / read-only regulator-review role where contractually/legal permitted.

Access is denied by default. Authorization checks execute in the backend on every request, with explicit tenant, operator, branch, mode and record scope. UI hiding is not authorization. Use strong separation between platform administration and operator administration. High-risk changes and payments require separate initiating and approving identities when configured.

## 5. Approval matrix

| Action | Initiator | Required control/approver | Non-negotiable evidence |
|---|---|---|---|
| Publish new route/fare/schedule | Operator operations | Operator supervisor, plus authority approval if required by law/contract | Before/after values, effective time, schedule affected and external sync result. |
| Configure Travelar commission/markup/discount | Commercial/finance staff | Independent finance/commercial approver | Contract version, calculation preview, test examples, effective dates and affected bookings. |
| Change payment-provider routing or method | Payments/integration operator | Authorized finance + technical/compliance approver as policy requires | Provider capability snapshot, account eligibility, funds-flow review, rollback and tests. |
| Create operator payout | Finance initiator | Different payout approver per amount/risk thresholds | Preview, beneficiary, amount/currency/fee, payable, batch, provider ref and final status. |
| Manual payment allocation | Finance/counter staff | Independent reviewer for ambiguous/over-limit cases | Provider transaction evidence, reason, booking, discrepancy and dual approval. |
| Refund/cancel/reschedule | Customer care/agent | According to fare/contract threshold and supplier response | Eligibility quote, customer confirmation, supplier action result and journal links. |
| Freeze/suspend operator | Compliance/operations | Authorized supervisor/executive; emergency path audited after action | Cause, scope, effective time, customer/operator impact and reinstatement criteria. |
| Publish terms/privacy or guide | Legal/content editor | Legal/content approver; subject-matter reviewer for high-risk travel advice | Version, source links, locale, review date, approval and effective date. |
| Publish platform config/feature | Product/config operator | Independent reviewer for material changes | Validation results, diff, dependency check, canary plan and rollback snapshot. |
| Change privileged access / break-glass | IAM/security operator | Independent approval where possible; immediate expiry | Requested scope, actor, approver, time range, reason, alert and post-event review. |
| Resolve ledger reconciliation adjustment | Finance analyst | Finance approver; auditor-visible | Original entries, reason, correcting entries, provider evidence, batch and approval. |

Thresholds are not hardcoded in frontend/source code; they are approved, effective-dated config and protected by code-enforced invariants.

## 6. Confirmation dialogue and high-risk UX rules

Every dialog must state **what changes, scope, consequence, whether irreversible, the source of the decision and who is performing it**. Buttons should say “Publish version”, “Approve payout”, “Deactivate method”, “Submit refund”, “Accept changed price” rather than vague “OK”. Display diff/amount/beneficiary before payment approval. Disable double submission and use backend idempotency. Cancel closes the dialog and has no side effect. High risk requires re-authentication/MFA or a second approver as policy dictates.

Never use a confirmation dialog to bypass authorization or replace backend policy validation. Bulk operations require a server-computed preview and affected-item count/list; if preview has changed, invalidate approval.

## 7. Audit event contract

Minimum event fields:

- `id`, `occurredAt`, `receivedAt`, event type/schema version.
- actor ID/type, authentication/session context, roles/claims at time, tenant/operator/branch/mode scope.
- action, resource type/ID, previous/new state references or redacted diff.
- outcome (`success`, `denied`, `failed`, `pending`, `unknown`), reason code, required approval IDs and distinct approver IDs.
- correlation/request/trace ID, idempotency key hash, provider identifier and provider request/reference IDs where applicable.
- source channel (web/app/agent/call center/OIMS/HIMS/API), client/device context at appropriate privacy level.
- policy/config/contract/price/fee/terms version IDs.
- security classification, retention class and payload-redaction indicator.

Audit events should be append-only or otherwise tamper-evident with restricted writes. Do not place access tokens, API keys, card data, passwords, bank credentials or full sensitive identity documents in audit payloads. Store large redacted artifacts in access-controlled evidence storage and reference hashes/IDs. Denied authorization and privileged configuration attempts must also be auditable.

## 8. Workflow engine/work queues

Start with durable domain states, database transactions, task tables, outbox/workers and retry policies within the agreed modular monolith. A dedicated BPMN/DMN/durable workflow product is an ADR/PoC decision, not a prerequisite. Every cross-system workflow must include idempotency, timeout/dead-letter path, compensation/repair path, owner and observable SLA.

Queue classes: onboarding/KYB, provider integration, booking/fulfillment recovery, payment reconciliation, payout approval, refunds/after-sales, regulator sync, security incident, content revalidation, config publication, access review and data-quality defects.

## 9. Daily operating routines

### Opening / on-call

- Confirm provider/PSP health, credential status, regulator sync status, schedule imports, pending queue backlog, prior-day reconciliation exceptions, on-call roster and active incident notices.
- Verify any market/mode activation still meets current gates; pause unsafe feature/channel if dependency unavailable.

### During shift

- Resolve customer/booking cases, process only permitted supplier operations, watch payment timeouts and late callbacks, route ambiguous money to reconciliation, watch seat/capacity conflicts and update customer notice from confirmed source.
- Do not repeatedly retry supplier or payment create calls when previous outcome is unknown; query/retrieve first.

### Shift close / daily close

- Reconcile POS/register collections to provider transactions and ledger; account for refunds, reversals, fees and unallocated payments.
- Close trip/manifest/sailing lists with permitted roles, record no-shows/disruptions and handle required regulator sync.
- Review supplier payable and payout batches; pending payouts stay in transit until final status evidence.
- Snapshot unresolved exceptions, assign owners/deadlines and produce supervisor sign-off.

## 10. Escalation examples

- Ticket payment received but no ticket → customer care plus supplier integration/operations; payment/booking reconciliation; no false ticket promise.
- Duplicate booking or seat conflict → stop repeated requests, lock/inspect authoritative inventory, reconcile provider reservations and route to incident commander if customer impact.
- Payout discrepancy → finance reconciliation; engineering only if provider/ledger sync is implicated; do not manually mark paid.
- Suspected fraud/data breach → security/compliance approved containment and evidence preservation; legal/regulator notice deadlines verified per jurisdiction.
- Operator schedule/vehicle/vessel disruption → operator operations queue, then customer care, then refund/finance if required.

## 11. Acceptance criteria

- HIMS/OIMS modules show work queues, ownership, approval states and action history, not only dashboards.
- Every high-risk action maps to server authorization and tests for denied roles/tenants/branches.
- Maker-checker prevents self-approval where required; approval invalidates after material changes.
- Cross-system tasks are durable, retriable, idempotent and observable.
- Audit entries exist for success, failure, denial, approval, rollback and manual override.
- Financial changes are journaled/reconciled without altering history.
- Every workflow has an exception path, SLA and assigned operational owner.
