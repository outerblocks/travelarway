# 80 — HIMS Automation, Payout Control, Audit, Logging and Security Operations

**Product:** Travelar · **Stage:** 25 · **Status:** Target requirements. Provider/legal settlement capabilities remain contract-gated.

## 1. HIMS is a control room plus work queues

Each HIMS module must combine authorized overview, searchable records, queues, decision/action surfaces, approval states, evidence, audit timeline, exports under permission, SLA timers, alerts and runbooks. It must not be a dashboard of untraceable mutable totals.

Core queues include: operator onboarding/KYB, expiring contracts/licenses, unapproved configurations, schedule publication exceptions, payment `UNKNOWN`, late/partial/mismatched collection, provider webhook failures, supplier ticket/booking unknown, refund requests, chargebacks, payout-ready/payout-unknown/settlement mismatch, overdue operator payables, manifest/regulatory sync errors, notification failures, access reviews, suspicious logins, vulnerability/incident tasks, guide-review expirations and backup/restore test failures.

Every queue item has stable case ID, business object, status, severity, owner/team, created/due/last-updated times, next action, linked evidence, attempts/reason history, escalation policy and closure code.

## 2. Automatic operator payout lifecycle

Automatic payout means an evidence-based policy engine schedules and orchestrates authorized disbursement. It does not mean an unattended job can send any balance to any account.

### Policy and eligibility

A payout policy is effective-dated and attached to market, operator/contract, currency, channel/mode if appropriate, settlement rail and trigger (e.g. daily, weekly, post-departure, or threshold). It defines minimum payout, reserve/holdback if contractually permitted, fee bearer, eligible payable types, reconciliation gate, refund/dispute/chargeback hold, maker-checker thresholds, maximum amount, frequency, retry and escalation rules. It must be supported by signed agreements, the payment-provider contract, current law and funds-flow advice. Automatic split settlement is not assumed.

### Durable payout flow

1. Ledger/reconciliation determines the eligible payable; never compute payable from a front-end balance.
2. A scheduled worker creates an immutable payout candidate/batch with a unique business key and links source ledger lines/bookings.
3. Eligibility engine checks operator state/KYB, approved beneficiary account and recent change, contract and due date, available funds, currency/FX, refunds/disputes, open reconciliation exceptions, legal/provider gates and payout limits.
4. Ineligible candidates remain held with explicit reason and owner; no silent drop.
5. For high-risk/material amounts, one authorized user prepares and another approves. An automation policy may pre-authorize only a clearly bounded rule approved by humans; beneficiary changes, rule changes, exception overrides and certain thresholds require maker-checker.
6. Preview the payout with the PSP/bank when available; compare resolved beneficiary name, amount, fee, currency conversion and available balance.
7. Persist a unique payout intent before calling provider; apply per-provider rate limit and a serialized scheduler if required. ClickPesa mobile-money and Lipa Namba docs currently describe one payout create request per merchant per 60 seconds, so a batch worker must honor the limit rather than one payout per ticket. Sources: https://docs.clickpesa.com/payout-api/mobile-money-payout-api/mobile-money-payout-api-overview and https://docs.clickpesa.com/payout-api/lipa-namba-payout-api/lipa-namba-payout-api-overview.
8. After create, record raw provider result and normalized state. `AUTHORIZED`/accepted is not treated as completed beneficiary credit where provider docs define it as pending/asynchronous. Query status and process verified webhooks/reports; an initiation timeout is `UNKNOWN` until reconciled.
9. On confirmed completion, post the appropriate balanced ledger movement; on failure/refund, preserve event history and return amount to the appropriate control account. Do not create a second payout to “fix” uncertainty.
10. Reconcile provider payout, merchant balance, bank/provider statement and operator payable. Close only with matched evidence or approved exception resolution.

### Controls

- Verify bank/recipient account under policy and use a cooling period after a beneficiary change.
- Separate staff who modify beneficiary records, prepare payouts, approve payouts and reconcile them.
- Maintain idempotency/unique reference and query-before-retry when provider semantics are uncertain.
- Enforce rate limit globally per merchant/provider, not merely per worker instance.
- Support emergency pause with reason, owner, expiry/review timer and release path.
- No auto-payout where provider availability/settlement method or legal approval is unknown.

## 3. Audit log is not application log and neither is the accounting ledger

### Domain audit trail

Append-oriented record of who did what, to which object and tenant, when, via which channel/request, whether it succeeded, the reason/approval and a safe before/after diff. Capture high-risk reads/exports as policy and law require. Core fields: event ID, occurred/recorded timestamps, actor/service identity, organization/tenant/branch scope, action, resource type/ID, result, reason/ticket, correlation/trace ID, source channel, approval ID, changed-field names and redacted values, integrity/retention classification.

Application/database privileges should prevent ordinary users and application services from rewriting/deleting audit rows. Export audit streams to separately permissioned log/retention storage; integrity controls and independent backups are needed because a database-only “append-only” design is insufficient against a privileged administrator.

### Operational/security logs

Use structured JSON logs with timestamp, severity, service, environment, trace ID, request/job ID, actor pseudonymous/internal ID where justified, tenant scope where safe, route/operation, latency, result, error class, provider correlation and retry count. Capture startup/shutdown, auth decisions, permission denials, privileged actions, validation failures, rate limit events, configuration publishes, webhook verification failures, payout/refund attempts, job retries, backup/restore events and security incident activity.

Never log passwords, access/refresh tokens, API keys, database connection strings, private keys, payment credentials, full card data or raw high-risk passenger/identity data. Redact or hash session identifiers; keep PII out of URLs. Do not blindly log whole request/response bodies, provider payloads, passenger manifests or authorization headers. Apply field-level redaction, sampling rules, restricted access, retention and deletion/hold policies. Alert if logging stops or log delivery backs up. Reference: OWASP Logging Cheat Sheet https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html.

### Financial ledger

The ledger records balanced debit/credit events, payable/receivable control accounts, fees, refunds, reserve, settlements and FX. It is not a generic audit table and should not be rewritten to “correct” a transaction. Corrections use authorized reversing/adjusting journals. The ledger, domain audit and operational log link via correlation and business references but have different retention/access semantics.

## 4. Security control plane

HIMS should provide role-scoped views of:
- Users, active sessions where available, MFA posture, privileged roles, access reviews and stale memberships.
- Provider credentials as secret references/status only; never display secret material after creation. Rotate/revoke via approved secret management workflow.
- Integration endpoints/environment, allowlists where justified, webhook signing status and secret rotation dates.
- API clients/keys, scopes, last use, quota, expiry/revocation, webhook endpoints and recent auth failures.
- Rate-limits, suspicious volume, repeated denied access, enumeration patterns, impossible state transitions, payout beneficiary changes and abnormal refund/booking activity.
- Vulnerabilities/dependencies, release approvals, incident cases and disaster-recovery evidence.

Security is enforced in backend policies and deployment controls, not just HIMS switches. OWASP lists broken object authorization, authentication, property-level authorization, resource consumption, function-level authorization and sensitive business flows among core API risks: https://api-security.owasp.org/.

## 5. Monitoring and incident orchestration

For each critical workflow define SLI/SLO target only after collecting representative baseline and business need. Track booking success, provider latency/error/timeout, payment unknown-age, unpaid holds, seat allocation conflict, schedule generation failure, notification delivery, webhook lag, payout pending age, ledger reconciliation variance, API error/rate-limit metrics, DB connection pool and query saturation, queue age, backup freshness and restore-test outcome.

Alerts create a durable incident/task with severity, on-call owner, start time, impact, affected mode/market/provider, customer messaging policy, regulator notice gate if applicable, timeline, mitigation, evidence and post-incident actions. Provider status pages are evidence but do not replace Travelar's synthetic health checks or actual transaction reconciliation.

## 6. Automated worker safety

Use a durable job/outbox pattern for schedule generation, notification send, payment/payout reconciliation, provider status polling, expired-hold cleanup, access review, content expiry and reports. Every job includes stable idempotency/business key, attempt count, created/deadline times, retry policy, last safe result and trace ID. Distinguish retryable from permanent/unknown results; use bounded exponential backoff with jitter. Financial side effects require provider idempotency or query-before-retry. Dead-letter items have owner and replay controls; replay is itself audited.

## 7. Acceptance criteria

- Scheduled payout creates candidates only from eligible ledger payables and approved beneficiary accounts.
- Double worker execution does not duplicate a payout intent; provider rate limits hold across instances.
- Timeout after payout initiation leads to a status query/reconciliation, never an automatic blind duplicate.
- Payout accepted/pending is not labelled settled; only reconciled provider evidence can close the payout.
- Payout batch totals reconcile to journal, provider result and bank statement; mismatches create an owned exception.
- User cannot approve own payout or exploit altered tenant IDs to see another operator's records.
- Audit events for role/fare/route/seat/payout/beneficiary changes are recorded, protected and searchable by authorized users.
- Logs redact secrets and unnecessary PII; security tests check for token/password leakage and untrusted-body logging.
- Disabled logging, queue backlog, delayed webhooks and stale payout state generate monitored alerts.
- Runbook exercises demonstrate pause, investigate, reconcile, resume and audit for a payout incident.
