# 49 — Role-Based Daily Workflows and User Journeys for HIMS, OIMS and Travelar Operations

**Product:** Travelar · **Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Stage:** 19 · **Date:** 24 October 2026  
**Status:** Operational workflow baseline for validation with actual role owners; time limits and approval thresholds are not assumed.

## 1. How to read this document

A workflow is not just a form. Every material flow identifies its trigger, owner, required records/evidence, allowed actions, approvals, status transitions, side effects, notifications, exceptions and audit evidence. Exact approval amounts, service-level targets and statutory retention periods remain unconfigured until the responsible owner supplies approved policy.

## 2. Daily HIMS work by function

### 2.1 Executive management

**Start of day:** Review the company summary, mode/country activation status, sales/conversion and financial reports, outstanding supplier/customer liabilities, provider availability, major disruptions, customer complaints, security events and overdue control items.

**Actions:** Decide delegated commercial/risk matters; approve country/mode/provider activation only after required evidence; review unresolved incidents and exceptions; assign accountable owners and due dates.

**Must not do:** Edit posted ledger entries, directly alter passenger payment state, approve own prepared payout, or activate an unsupported provider because a dashboard looks healthy.

**Evidence:** decision record, scope, supporting metrics/source status, approval chain and follow-up owner.

### 2.2 Operations/control-room officer

**Start of day:** Review today's trips/sailings, delayed/cancelled services, availability feeds that exceeded freshness threshold, supplier outages, unissued tickets, booking/payment mismatches and customer disruption cases.

**Actions:** Confirm source status, open/assign an incident or service case, apply approved trip/disruption workflow, coordinate with operator/supplier, send approved customer communication, monitor resolution.

**Exceptions:** If provider outcome is unknown, preserve evidence and queue reconciliation; do not mark service fulfilled by assumption. Any stop-selling decision must be scoped to the affected mode/provider/route/tenant where possible and preserve servicing of existing bookings.

**Evidence:** affected booking/trip IDs, source status/time, action/approver, customer impacts and resolution.

### 2.3 Operator partnerships/onboarding officer

1. Create prospect/operator record and assign owner.
2. Request documents and record expiry/source.
3. Route legal/operational/regulatory review to relevant departments.
4. Agree commercial terms and payment model; attach signed contract and effective dates.
5. Capture operator mode, market, route, data authority and existing-system integration profile.
6. Coordinate OIMS setup and integration test cases.
7. Collect evidence for schedule/fare/availability, booking, ticket, manifest, cancellation/refund, notification, reconciliation, access and outage behavior.
8. Route approval to authorized distinct reviewers; activate only the approved scope.
9. Schedule contract/license/configuration expiry reviews and monitor performance.

**Terminal states:** active within permitted scope, more information required, rejected, suspended, exit/closed. Every state change requires an actor/reason and applicable evidence. Sales staff cannot self-approve the legal, regulatory or funds-flow gate.

### 2.4 Finance/treasury officer

**Start of day:** Load or fetch available PSP/bank/operator/supplier statements; review payment and payout items in `PENDING` or `UNKNOWN`; review failed/late provider events, unallocated funds, unmatched payments, refund queues, supplier payables and prior-day cash variance.

**Matching loop:**
1. Match internal payment/booking/reference to provider transaction and statement line.
2. Match provider settlement batch/fees to bank movement and the expected net amount.
3. Match contract-calculated commission/markup to the applicable order snapshot.
4. Match supplier invoice/settlement obligation to the booking and agreed settlement date.
5. Record known fee/FX/rounding differences using approved policy; create exceptions for unexplained differences.
6. Assign unmatched items to an owner with age/reason/next action.
7. Prepare payout batch using verified payee and approval policy; a separate authorized approver reviews before execution when required.
8. Check provider result and bank settlement; do not mark paid-out merely because an API accepted the instruction.
9. Close the period only when required reconciliation criteria are met or exceptions have documented approval under policy.

**Must not do:** edit history to make a batch balance, approve own high-risk payout, infer successful payment from the browser, or treat gross booking value as the company's recognized revenue.

**Evidence:** statement file/provider ref, match IDs, journal references, calculation version, approver, payout batch, bank evidence and exception resolution.

### 2.5 Customer experience/support agent

1. Receive case via contact channel or queue.
2. Verify requester's right to access booking using an approved challenge; a booking reference alone is not enough for sensitive details.
3. Fetch a scoped booking timeline: booking/supplier status, quote snapshot, payment attempts, ticket/voucher, communications and earlier cases.
4. Classify case (booking, payment pending, ticket, cancellation/refund, disruption, complaint, supplier escalation, privacy request).
5. Explain the current verified state; use `pending`/`unknown` honestly.
6. Initiate an allowed action request with customer acceptance and reason.
7. Route approval/execution to finance/operations/supplier workflow as appropriate.
8. Send a state-appropriate update, track the external outcome and close only when closure criteria are met.

**Separation:** support may initiate a refund request and communicate status without necessarily having the ability to approve/execute payment movement. Sensitive identity fields are masked and accessed only for approved purpose.

### 2.6 Legal/compliance/privacy officer

Daily/periodic queue: expiring agreements and licence evidence; regulator/supplier requests; data subject requests; cross-border/processor changes; policy or consent review; complaints and incidents with legal implications; public travel-guide source freshness; retention/legal-hold deadlines.

Actions: assess required evidence, assign accountable owner, approve/reject within delegated authority, record jurisdiction and applicable scope, add expiry/review tasks and document unresolved legal questions. A status marked `verified` must link to evidence and record who verified its scope/date.

### 2.7 Content editor / destination-information reviewer

1. Select or create destination, guide, offer or article from database records.
2. Draft localized content with sources, retrieval date, applicable traveler/country scope, last-checked date and next-review date.
3. For visa/entry, health/safety or legal facts, attach current official or otherwise authorized primary evidence and flag uncertainty.
4. Check imagery/use rights, links and translation completeness.
5. Submit to editor/reviewer; high-impact guide cannot self-approve if policy requires separation.
6. Publish with version/time window; scheduled review/expiry alerts create a queue item.
7. Correct outdated pages with a new version and clear history; preserve audit trail rather than silently rewriting what was published.

Offers are only labelled bookable when connected to verified products/pricing/availability and valid commercial rules. Editorial destination content is distinct from paid promotion and from inventory.

### 2.8 Engineering/IT operations

Review build/deploy status, error budget/health alarms, dependency and vulnerability findings, adapter error rates, queue backlogs, failed background jobs, database capacity, backup status/restore evidence, configuration publish failures and change approvals.

A production fix follows issue/incident record → change plan → tests/security review → approval → versioned deployment → verification/rollback decision → documentation. Engineers may investigate data but should not bypass financial approvers or directly alter commercial policy in production without the governed change path.

### 2.9 Cybersecurity officer / responder

Review severity-ranked alerts, identity/admin events, anomalous exports, configuration changes, suspicious API activity, endpoint/server/database events, missing-monitoring signals and third-party incident notices. Triage against documented playbooks, preserve evidence, isolate only within approved response policy, revoke affected credentials as appropriate and record incident actions. Security systems require their own health alerts so missing telemetry is detectable.

### 2.10 HR/administration

For joiner/mover/leaver requests: verify approved employment/contractor request; request domain-owner authorization for special roles; provision minimum scope; check MFA/device needs; record effective period; on exit remove access and active sessions/credentials through the defined process; verify completion. HR cannot grant finance or engineering production privileges solely on HR role authority.

### 2.11 Internal audit

Work from approved audit plan and risk/control records; select transactions/config changes/roles, inspect source evidence and logs, test maker-checker/reconciliation/tenant isolation, record exceptions, assign remediation owner and retest. Audit access is read-only by default and does not include transaction approval.

## 3. Daily OIMS workflows by operator role

### 3.1 Operator owner/admin

Review operational and commercial summaries, branches, staff access, service readiness, cash/settlement exceptions, customer complaints, schedules/fare change proposals and data-sync health. Approve only operator-level actions permitted by contract and role. Cannot alter Travelar's platform-wide commission rule or bypass Travelar activation/regulatory gates.

### 3.2 Dispatcher/schedule manager

1. Open service calendar, unresolved change requests and vehicle/vessel status.
2. Create trip/sailing from the approved service/route and assign resource according to capability.
3. Validate route order, permissible boarding/drop-off pairs, times/timezone, class/capacity, fare coverage and active operating date.
4. Preview impact against already sold tickets, inventory holds, staff and external system authority.
5. Publish with appropriate approval; a material change after sales invokes change/disruption/reaccommodation workflow.
6. Monitor departure readiness, delays/cancellations and close the trip with operational evidence.

### 3.3 Ticket-office manager/cashier

**Open shift:** authenticate, select permitted branch/terminal, record opening float and obtain acknowledgment. **Sell:** search valid current trip/segment/sailing, select eligible origin/destination or class, validate availability and authoritative price, capture only policy-required passenger data, create booking, follow approved payment route, issue ticket only after required confirmations and provide receipt. **Correct:** request/referral for override, void or refund under permission and reason; never erase original sale. **Close shift:** total cash/electronic tender, compare expected vs counted funds, list movements, submit variance and obtain supervisor review. Duplicate print must not create a second booking or capacity allocation.

### 3.4 Operator finance officer

Review mode-specific sales, PSP transactions, direct operator collection, Travelar collection when applicable, commission statements, expected settlement and payout, cash shifts, refunds/chargebacks and unmatched cases. Download scoped statement/report; challenge disagreements using booking and contract snapshots; create dispute case with evidence. Can view, not edit, Travelar-owned commission policy unless separately authorized in a governance process.

### 3.5 Customer-service supervisor

Review open cases, operator service disruptions, ticket validation conflicts, complaint trends and overdue customer responses. Assign cases, approve actions only within delegated operator scope, coordinate with Travelar HIMS when Travelar controls supplier/payment/support action and monitor completion.

### 3.6 Boarding marshal

Before trip: authenticate assigned trip/device; synchronize only the permitted manifest and ticket-validation data; check data timestamp/connectivity. During boarding: scan ticket, validate intended operator/service/date and existing-use status where online data supports it; record unique validation event. Offline: show provisional/offline condition honestly, use signed/time-limited local data and append-only local events; sync when connected and route conflicts to exception resolution. Marshal cannot edit fares, change passenger records, view all company manifests or issue refunds.

## 4. Travelar agent daily flow

Review own assigned modes/markets/suppliers, eligibility and commission policy; search and book only within assignment; follow explicit customer-payment/cash-handoff rules; securely send/retrieve valid ticket; track own booking and commission status; reconcile approved float/cash where applicable; raise exceptions for failed payment, unissued ticket, refund and customer dispute. Agent cannot change transaction source attribution, fare, provider status, commission percentage or payout beneficiary.

## 5. Cross-system workflow catalog

Every workflow needs a named owner and state model. Initial catalog:

| Workflow | Trigger | Main owner | Approval/exit evidence |
|---|---|---|---|
| Operator onboarding | New supplier/operator lead | Partnerships | Legal/operational evidence, signed terms, tests and scoped activation approval |
| Configuration change | Edit request | Configuration owner | Validation, impact preview, reviewer, published version |
| Route/schedule change | Service create/edit or disruption | Operator operations | Conflict/impact check, appropriate approval, affected booking plan, notices |
| Fare/commission/markup change | Commercial request | Finance/partnerships | Contract basis, calculation tests, approval, effective date/version |
| New provider/market mode | Integration/commercial request | Partnerships + engineering + compliance | Contract/rights, provider capability, security/data/funds flow, successful evidence and activation gate |
| Payment unknown/unmatched | Provider callback/status/statement mismatch | Finance/reconciliation | Provider enquiry, references, journal impact and resolved state |
| Refund/cancel | Customer/operator request | CX/operations + finance as applicable | Policy, quote/customer acceptance, approval, provider confirmation and customer notification |
| Supplier payout | Scheduled payable or approved request | Finance/treasury | Payee verification, payable/available-funds check, maker-checker, provider/bank evidence |
| Cash shift close | Shift end | Cashier + supervisor | Count, expected amount, movements, variance record and review |
| Content guide publication | Draft/review date | Content editor + reviewer | Sources, applicable scope, rights, review date and approved version |
| Data subject/privacy request | User or authority request | Privacy/legal | Identity verification, scope/deadline, disposition and evidence subject to legal hold |
| Incident response | Security/operations/finance alert | Responder/incident commander | Evidence, containment, communications, recovery and post-incident actions |
| Staff joiner/mover/leaver | Approved HR request | HR + system owner | Least privilege, MFA, end date/session revocation, completion audit |
| Daily close | Period close time/finance trigger | Finance | Bank/PSP/cash/payable/ledger matching, outstanding exception report and sign-off |

## 6. Common queue item contract

A queue/task item should minimally contain: stable ID, workflow type, current state, tenant/market/mode scope, linked domain records, priority/risk, owner/team, created/updated timestamps, due time if an approved SLA exists, source/correlation IDs, evidence links, allowed actions, approval requirements, resolution reason, final actor and audit history. Queue display must derive allowed actions from the server, not from the client guessing by role name.

## 7. Event and state discipline

- Each state change is a command accepted by the backend, validated against the transition model, and recorded with actor/reason/evidence.
- Important side effects (payment provider call, supplier reservation, message, payout) use durable intents/outbox/idempotency and an exception queue. A page refresh is never the workflow engine.
- Provider raw status, normalized domain status and business decision remain separately traceable.
- `PENDING` and `UNKNOWN` are valid states requiring follow-up. A task cannot be closed as resolved just because someone manually changes a label.
- Escalation timers and SLAs are configuration scoped to a policy/contract and can be blank/unset until approved. Do not fabricate guarantees.

## 8. Acceptance tests based on real work

Run scenario tests that simulate a complete shift/day, not isolated forms:

1. Operator manager updates route; impact preview shows already booked tickets and disallowed new boarding/drop-off pairs; config cannot publish if inconsistent.
2. Cashier opens shift, sells from an allowed source, payment is pending/unknown, and does not issue premature ticket; after verified payment and correct inventory state ticket is issued once; close shift finds a discrepancy and routes it for approval.
3. Finance matches collection, PSP fees, settlement and bank movement; a duplicate callback causes no duplicate journal; an unknown payout is queried before retry.
4. Support agent verifies the customer, sees masked information, creates refund request but cannot approve it when permissions prohibit; customer sees accurate pending status.
5. Content editor drafts visa guide with expired source: publication is blocked or flagged according to content risk policy; reviewer sees scope, citation and last-checked date.
6. HIMS user attempts access to another tenant's manifest or payout: backend denies and audit signal appears.
7. Leaver access removal revokes session/credentials and pending access requests; event is recorded.
8. Integration becomes stale: search stops selling or shows non-bookable/last-updated status according to policy; no stale result is labelled live-available.

## 9. Source material and open items

Cross-reference Documents 16 and 17 for existing operator, HIMS, support, agent, marshal and authorization requirements. Validate this workflow catalog with actual department owners, approved finance/accounting policy, signed operator contracts and local legal/privacy obligations before production.
