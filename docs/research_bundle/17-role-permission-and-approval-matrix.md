# 17 — Travelar Role, Permission and Approval Matrix

**Product:** Travelar · **Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Date:** 23 October 2026 · **Status:** Proposed access-control baseline for review; not a final HR or legal delegation instrument.

## 1. Design rules

Travelar must use deny-by-default access, least privilege and server-enforced authorization. OWASP notes that access-control decisions should be specified for resource/action combinations, tested, and periodically reviewed; hidden buttons are not an authorization control. https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html

Use **RBAC + scoped attributes (ABAC)**. A role grants a class of actions; attributes narrow the scope. Relevant attributes can include owning legal entity, tenant/operator ID, country, mode, branch, assigned trip, case assignment, transaction amount, sensitivity class, data purpose, user/device status, time window and contract state.

### Symbols

- **—** no permission by default.
- **R** read within assigned scope, with sensitive fields masked unless noted.
- **C/U** create/update within assigned scope; destructive mutation is prohibited for ledger/audit records.
- **EXEC** execute a workflow that already meets policy and approval requirements.
- **PREP** prepare a change/request but cannot approve or execute it alone.
- **APP** approve under delegated limit; still cannot approve own request.
- **AUD** read-only independent review/audit.
- **LIMIT** capability limited by country/mode/operator/branch/assigned trip/value threshold.
- **Break-glass** emergency access requiring reason, alert, short expiry and post-event review; not a standard role.

## 2. Role catalogue

### OuterBlocks Limited internal roles

1. **Executive Sponsor** — strategy, delegated country/mode activation approval and risk acceptance; not automatically entitled to full passenger IDs or payment execution.
2. **Platform Operations Admin** — operational configuration and incident operations; no default finance release or unrestricted manifest/identity access.
3. **Operator Partnerships Manager** — onboarding/contract workflow, documentation and operator configuration preparation.
4. **Compliance/Legal Officer** — licence/contract/data-protection evidence and regulatory workflow; scoped sensitive access for legal purpose.
5. **Finance Preparer** — statements, journals/payout batches/refund requests, reconciliations; cannot approve own payout/refund/journal.
6. **Finance Approver/Treasury** — approves defined finance operations within limits; separate from preparer where feasible.
7. **Customer Support Agent** — booking lookup after verification, case notes, approved ticket resend and escalation; no ledger edits or unrestricted refunds.
8. **Customer Support Supervisor** — support queue supervision and defined escalations, not unlimited finance control.
9. **Sales/Marketing Manager** — campaign/content preparation, aggregate funnel analysis; no passenger manifest or sensitive ID by default.
10. **HR/Admin** — staff/contractor/device lifecycle; may deactivate access but does not self-grant privileged finance or security roles.
11. **Engineer/DevOps** — deployments, logs/metrics and technical configuration under change control; no routine ability to initiate payouts or retrieve plaintext passenger ID.
12. **Security Officer** — alert triage, access review, incident evidence and time-limited containment; response actions logged and subject to safeguards.
13. **Internal Auditor/Risk Reviewer** — read-only access to evidence and approvals; no operational change or payment approval by default.
14. **Travelar Agent** — assigned marketplace sales and commission reporting; cannot change commission policy or provider status.

### Operator roles

15. **Operator Owner/Admin** — manages own organization users and settings only within contract/policy; cannot approve Travelar platform activation for self.
16. **Operator Operations Manager/Dispatcher** — schedules, fleet/vessels, trips, operational inventory and disruptions within assigned operator.
17. **Operator Finance Preparer** — statements, cashier close and settlement requests for own operator.
18. **Operator Finance Approver** — approves operator refund/adjustment/settlement actions within operator delegation; not a Travelar PSP payout approver unless separately authorized under a distinct role.
19. **Operator Branch Supervisor** — branch staff/shift and exception review within branch scope.
20. **Operator Cashier** — sell permitted tickets, accept tender according to contracted method, open/close own shift, print existing ticket; no self-approval of discrepancies/refunds over limit.
21. **Operator Agent** — assigned products/routes and contracted sales channel only.
22. **Marshal/Boarding Staff** — assigned trip manifest and ticket validation; no booking administration, customer search, fare, finance or refund capability.
23. **Integration Service Account** — machine-to-machine, contracted operations and named scopes only; no interactive login; credentials rotated and request identity logged.

## 3. Capability matrix (default permissions)

This table is a minimum baseline. The final policy must add explicit scoped rules and be enforced in backend APIs and data queries.

| Capability | Exec | Ops Admin | Partnerships | Compliance | Finance Prep | Finance Approver | Support | Engineer | Security | Auditor | Travelar Agent | Operator Admin | Op Ops Mgr | Op Finance | Cashier/Agent | Marshal |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| View aggregate platform KPIs | R | R | R scoped | R scoped | R finance | R finance | R support | R tech | R sec | AUD | R own sales | R own operator | R own ops | R own finance | R own channel | R assigned trip counts |
| View customer booking summary after authorized need | LIMITED | LIMITED | LIMITED | PURPOSE | LIMITED | LIMITED | R verified case | No by default | PURPOSE | AUD restricted | R own sourced bookings | R own operator | R assigned service | R own finance references | R own sales | R assigned ticket check only |
| View full passenger identity/ID | — by default | PURPOSE | — | PURPOSE | — | — by default | — by default | — | PURPOSE during incident | AUD by exception | — by default | PURPOSE if operationally required | PURPOSE | — | — by default | Only minimum assigned manifest fields |
| Search all bookings globally | — | LIMITED | LIMITED | PURPOSE | LIMITED | LIMITED | — | — | PURPOSE | AUD | — | — | — | — | — | — |
| Search assigned operator/branch/trip | — | R scoped | R onboarding context | PURPOSE | R finance context | R finance context | R verified case | — | PURPOSE | AUD | R assigned channel | R own operator | R own operator | R own finance scope | R own branch/channel | R assigned trip only |
| Create/edit routes/schedules/fleet/vessels | — | PREP/EXEC config | PREP onboarding | Review constraints | — | — | — | — | — | AUD | — | LIMITED own setup | C/U own scope | — | — | — |
| Create/edit fares or markups | APP high risk only if delegated; never sole executor | PREP/EXEC only via approval | PREP contract terms | Review legality | R | APP finance policy only where delegated | — | — | — | AUD | — | PREP own proposal | PREP fare request | — | — | — |
| Allocate bus seat / ferry capacity | — | EXEC support/repair with audit | — | — | — | — | Limited support workflow | — | — | AUD | Create booking within channel | R own inventory | EXEC ops | R finance context | EXEC allowed sale | Validate only |
| Create booking | — | Exceptional/admin action only if separately granted | Test only | — | — | — | Assisted workflow where permitted | — | — | AUD | EXEC own channel | EXEC own operator | EXEC own operator | — | EXEC own channel | — |
| Change passenger details | — | LIMITED audited correction | — | Purpose if legal request | — | — | Only approved safe fields | — | Purpose | AUD | Limited pre-ticket rule | Own operator booking per contract | Limited | — | Limited by contract | — |
| Issue/reissue/reprint ticket | — | Recovery role with approval/audit | — | — | — | — | Resend existing artifact; no reissue | — | Purpose in incident | AUD | Resend existing authorized ticket | Own operator rules | EXEC ops | — | Authorized issue/reprint | Validate; no issue |
| Cancel booking / request refund | — | PREP/execute only assigned workflow | — | Legal review where required | PREP | APP/EXEC within limits | PREP/request only | — | — | AUD | Request within allowed policy | Request own operator flow | Request per policy | PREP | Request within limit | — |
| Approve refund or payout | No default | — by default | — | — | — | APP within delegation | — | — | — | AUD | — | Operator Finance APP own obligations | — | Operator Finance APP own scope | — | — |
| Execute provider payout batch | — | — | — | — | PREP | EXEC after separate approval | — | — | — | AUD | — | — | — | Only separate operator-authorized payout system, not Travelar treasury | — | — |
| Post/manual-adjust finance journal | — | — | — | — | PREP | APP/EXEC separation required | — | — | — | AUD | — | — | — | PREP own books if authorized | — | — |
| Reconcile PSP/bank/operator settlement | R aggregate | R ops exceptions | R contract context | R compliance exceptions | C/U match & prepare | APP/review | R case-status only | R technical status, no ledger edit | R security events | AUD | R own commission statement | R own operator statement | R ops exceptions | C/U own operator records | R own shift | — |
| Manage commission contract/config | APP delegated governance; not self-change | PREP only | PREP | Review compliance | R | R finance | — | — | — | AUD | R own contract | R own agreement | R own agreement | R own agreement | R own rate display | — |
| Approve provider or country activation | APP only in formal workflow | PREP/execute after approval | PREP evidence | APP compliance gate | R financial readiness | APP financial readiness | — | PREP technical test | APP security gate | AUD | — | — | — | — | — | — |
| Change adapter credentials/provider config | — | PREP/EXEC with approval | — | — | — | — | — | PREP/EXEC under change | APP review for secrets/scope | AUD | — | — | — | — | — | — |
| Manage users/roles | — | Role grants per policy, cannot self-elevate | Invite scoped partner contacts | Review mandated role | — | — | Supervisor assign queue only | — | Privileged access review | AUD | Manage own agent profile only | Own users under operator scope | Branch assignments | Finance scoped users | Own shift profile | Device-bound profile only |
| View/export manifest | — | PURPOSE and approved case | — | PURPOSE | — | — | Limited case fields | — | PURPOSE during incident | AUD controlled | — unless assigned trip is part of role | R own trips if needed | R own trips | — | — | R assigned trip minimal fields |
| Export bulk passenger/customer data | — by default | PREP + approval | — | PURPOSE + approval | — | — | — | — | Emergency only with approval | AUD restricted/approved | — | — by default | — | — | — | — |
| View audit log | Summary | R ops-scope | R onboarding actions | R compliance-scope | R finance-scope | R finance-scope | Case-scope | Technical-scope, redacted | R security-scope | AUD broad | Own actions | Own operator actions | Own operator actions | Own financial actions | Own branch actions | Own validation events |
| Delete or rewrite audit/journal history | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| Suspend user/device | — | LIMITED per ops workflow | Partner invite pending only | Compliance hold by workflow | — | — | Supervisor deactivation request | Tech service account under change | EXEC security containment | AUD | — | Own staff except self-protection constraints | Own staff per policy | Own finance team per policy | — | Revoke/report device only |

**Important:** “Purpose” is not free-form permission. It requires a recorded business/legal reason, approved scope, data minimization, and audit. Sensitive-data roles should be granted separately from ordinary business roles.

## 4. Scope enforcement model

Every protected request must evaluate all applicable dimensions, not just the role name:

- `actor_id`, active identity, authentication strength, MFA state, assigned device and session risk.
- `organization_id`, `operator_id`, `branch_id`, `country_code`, `mode`, trip/sailing/date and current contract status.
- `resource_id`, resource owner, field sensitivity, purpose/consent/legal basis and retention/legal hold state.
- action permission, action amount/limit, approval state, second-person identity and separation-of-duties check.
- current market/mode/provider activation, source-of-truth status and whether the action is allowed in current booking/financial state.

A request is denied if any required scope is missing, contradictory or expired. Cache-based authorization must be invalidated/reduced promptly after deactivation or role change. Tenant boundaries must be tested on direct ID substitution and bulk/export endpoints.

## 5. Maker-checker and approval matrix

Thresholds below are deliberately **TBD**; dollar/TZS amounts must be set only after finance, risk and legal review. Policy must support both count/value thresholds and event categories.

| Action | Preparer | Required approver | Executor | Required evidence | Additional guardrail |
|---|---|---|---|---|---|
| Activate new country/mode | Partnerships + Operations | Compliance/Legal, Security, Finance readiness; delegated executive approval | Platform Ops release | legal status, supplier rights, funds flow, field/data map, test evidence, runbook | feature flag can roll back new sales; existing bookings remain serviceable |
| Enable provider/adapter in production | Technical owner | Security + commercial/finance owner + mode owner | authorized release operator | signed agreement/permissions, credential evidence, sandbox/controlled test, operation matrix, rollback | never paste secrets into tickets or logs; no self-approval |
| Change PSP settlement account | Finance/Treasury preparer | independent Finance Approver plus out-of-band verification per fraud policy | separate authorized executor | provider/account ownership confirmation and approval record | delay payout while details change; alert on unusual beneficiary/region |
| Execute payout batch | Finance Preparer | Finance Approver within authorized limit | Treasury/payment execution identity | reconciled payable list, bank/PSP total, supplier statement and exception review | totals match; no self-approval; idempotent batch reference |
| Refund above configured threshold/manual refund | Support/Finance preparer | Finance Approver or defined supervisor + finance for thresholds | PSP adapter/service or authorized user | original payment, booking/ticket state, supplier policy, reason and customer evidence | refund cannot exceed refundable amount; duplicate refund prevented |
| Manual price/fare override or commission change | Commercial/Operations preparer | Commercial owner + Finance; Compliance where market/legal issue | configuration release | signed contract/offer, effective dates, tax/commission basis and test results | versioned, future-effective by default, audited and reversible |
| Journal adjustment/write-off | Finance Preparer | independent Finance Approver; audit can review | Ledger posting service after approval | source document, linked original journal, variance reason | adjustment rather than delete; balanced entry per currency |
| Manifest bulk export/full-ID access | requester | authorized operations/compliance supervisor per policy | controlled export service | trip, legal/operational purpose, field list and expiry | encryption, watermark/log, short-lived download, no public links |
| Privileged role grant / break-glass | manager/requester | role owner + Security (dual approval where practicable) | identity admin | scope, duration, reason and re-review date | short expiry, reauthentication, alert and post-event review |
| Ticket-source/channel attribution correction | Operations/Finance requester | independent Finance/partnerships approver | controlled correction service | POS/agent/partner evidence and commission implications | preserves old source and correction history; no unrecorded overwrite |
| Deletion/retention exception | privacy/data owner | Compliance/Legal and system owner | controlled data workflow | request identity, legal obligations/retention reason, impacted copies/backups | don't delete regulatory/financial record if legally required; document exception |

## 6. Authentication and session requirements

- MFA mandatory for HIMS privileged users, finance approvers, security, role administrators and other high-risk internal roles; operator admin/finance MFA should be required for production access.
- Workforce accounts are individual; no shared cashier, support or admin logins. Service accounts are non-interactive and least-scoped.
- Invitation tokens expire and are single-use; role grants and resets are logged. Deactivation revokes sessions, refresh/access tokens and active device/USSD authorizations according to technical capability.
- Step-up authentication is required for risk-sensitive actions: payout, settlement-account change, high-value refund, privileged role change, full manifest export, or sensitive account recovery.
- Apply idle and absolute session timeouts server-side. Renew session identifiers after authentication or privilege changes; do not put PII/role data in opaque session IDs. OWASP guidance: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- Keep admin/internal interfaces logically separated; domain separation helps UX/security but does not replace authorization, cookie configuration, CSRF defenses and tenant checks.

## 7. Audit and recertification

Audit at minimum: sign-in failures, MFA recovery, new device enrollment, role/permission changes, privileged reads of personal data, manifest view/export, booking status correction, price/commission changes, ticket issuance/reprint/void, refund and payout actions, ledger adjustment, adapter credential/configuration, country/provider activation, reconciliation override, automated containment and break-glass activity.

Records need actor, organization/tenant, action, target identifier, timestamp, source/IP/device when legally appropriate, correlation ID, reason, approver and before/after values for changes. Redact secrets and excess PII; protect log integrity and restrict deletion. A hash chain can detect some changes but is not proof of immutable storage or independent backup security.

Suggested review frequency (proposal): privileged users monthly; finance/support/operator roles quarterly; ordinary inactive or temporary roles at contract/assignment end; all access after incident or organizational changes. Final frequencies should match legal and risk requirements.

## 8. Testing requirements

1. A Travelar agent cannot access operator admin, OIMS manifest, another agent's sales or another market without explicit assignment.
2. An operator admin cannot query another operator by changing IDs or invoking exports.
3. A cashier cannot approve their own cash variance, high-value refund or payout.
4. Support cannot retrieve full identity data absent a verified case and specific need.
5. Engineer access cannot initiate a refund, change commission or export passenger manifest by default.
6. Finance approver cannot approve their own prepared batch even if holding an unrelated admin role; conflict-of-interest check applies across roles.
7. Marshal can validate only assigned trip ticket and receives only policy-approved fields.
8. Expired contract, user deactivation, trip assignment end or market deactivation blocks new action; valid existing booking support remains available to authorized roles.
9. Role change revokes/re-evaluates current sessions and cached permissions.
10. Every denied sensitive operation is recorded without leaking queried resource details to unauthorized users.
11. Bulk export has independent permissions, explicit scope, reason, audit and download expiry.
12. Automated suspension can be appealed/released under governed process and preserves incident evidence.

## 9. Decisions still required

- Organizational title/role names appropriate to OuterBlocks's initial team.
- Exact financial approval thresholds per currency and payment/supplier method.
- Which refunds/support changes can be self-service vs maker-checker.
- Manifest legal field set and availability window per regulator/operator.
- HR/contract processes for employees and independent agents.
- Authentication provider, MFA options and recovery process after provider outage.
- Log retention, evidence residency and independent backup/security architecture.

## 10. Sources

- OWASP Authorization Cheat Sheet — least privilege, deny by default, scope design, permission testing and review: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Session Management Cheat Sheet — secure session identifiers, server-side timeout, renew after privilege changes: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP API Security Top 10 — object/function-level authorization and sensitive business-flow risks: https://devguide.owasp.org/en/07-training-education/07-api-top-ten/
- Tanzania PDPC registration and cross-border processing guidance: https://pdpc.go.tz/services/registration/ and https://pdpc.go.tz/services/cross-border-data-transfer-permit/

## Stage 19 addendum — authorization must match workflows and scopes (24 October 2026)

The permission matrix must be instantiated for each HIMS/OIMS module and workflow in Documents `48` and `49`. Validate not only role-to-screen access but action and data scopes: tenant, branch, mode, market, trip, field sensitivity, read/create/approve/execute, temporary access and expiry. All protected API operations enforce authorization server-side and deny by default. Frontend button hiding is not an authorization mechanism. See `ADR-OPS-001` and `ADR-DATA-003`.

