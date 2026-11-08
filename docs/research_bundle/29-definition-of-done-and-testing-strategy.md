# 29 — Definition of Done and Testing Strategy

**Product:** Travelar · **Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Status:** Proposed engineering standard  
**Updated:** 23 October 2026

## 1. Definition of Done is evidence, not assertion

A module is complete only when requirements applicable to that module have accepted test evidence, operational documentation, security review, monitoring and a reversible deployment path. UI completion, compile success, mock-based tests or a developer statement do not establish production readiness.

Security references to use and version-check during delivery include OWASP ASVS 5.0.0 (published 30 May 2025), OWASP API Security Top 10:2023, NIST SSDF SP 800-218 and NIST incident response SP 800-61 Rev. 3. Sources: https://asvs.owasp.org/ ; https://devguide.owasp.org/en/07-training-education/07-api-top-ten/ ; https://csrc.nist.gov/pubs/sp/800/218/final ; https://csrc.nist.gov/pubs/sp/800/61/r3/final .

## 2. Eighteen-point module Definition of Done

For each module, record pass/fail/not-applicable plus evidence for:

1. **Business logic:** approved rules and allowed transitions implemented; assumptions explicitly flagged.
2. **Backend:** boundary validation, authorization, error contracts, timeout and failure handling implemented.
3. **Database integrity:** constraints, migrations, transactions, foreign keys, idempotency and retention enforced.
4. **API contracts:** schema/versioning, authorization, compatibility and contract tests pass.
5. **Frontend/interface:** loading, success, empty, unavailable, error, retry and accessibility states work.
6. **Authentication and authorization:** least privilege; tenant/object/function/property authorization tested negatively.
7. **Audit and financial controls:** sensitive actions attributable; maker-checker and balanced-ledger controls where applicable.
8. **Integrations:** production contract verified when access exists; mock/simulator use labelled; provider-specific failure states preserved.
9. **Concurrency/inventory:** race, retry, oversell and duplicate-processing tests pass where relevant.
10. **Error handling/recovery:** unknown external outcome reconciled; no unsafe blind retry; recoverability demonstrated.
11. **Offline behavior:** disconnected conflict and sync behavior tested where applicable; limitations disclosed.
12. **Automated/integration tests:** required CI suites green on the exact commit; flaky or skipped tests listed.
13. **Security review:** threat controls verified; secrets/permissions/dependencies scanned; findings dispositioned.
14. **Performance review:** named thresholds, workload model, test results and limitations recorded.
15. **Observability:** useful logs, metrics, traces, correlation IDs and actionable alerts; sensitive data excluded.
16. **Technical/operational documentation:** runbooks, API docs, data changes, support steps and known limits current.
17. **Deployment/migrations/rollback:** deploy and recovery procedures exercised; data-safe rollback/forward-fix strategy stated.
18. **Acceptance/source-of-truth reconciliation:** requirement IDs linked to code/tests/evidence; ADRs and unresolved questions updated.

Applicable “N/A” decisions require a reason and reviewer; they cannot be used to skip unresolved work.

## 3. Test strategy and layers

### Unit tests

Pure business rules: fare/commission calculation; contract effective dates; permitted booking transitions; access policy; currency rounding; tax-calculation inputs; inventory overlap; idempotency keys; ledger balancing. Unit tests must not assert only that a mocked method was called when the underlying business outcome is what matters.

### Database integration tests

Use PostgreSQL-compatible test instances and the actual migration chain. Verify constraints, isolation, locks, transaction rollback, deadlocks, serializable failures where used, tenant filters and ledger balance enforcement. In-memory substitutes are insufficient for inventory and financial correctness.

### API and contract tests

Validate request/response schemas, authentication, tenant boundaries, rate limiting, pagination, error mapping and versioning. For each adapter, maintain a provider capability fixture and contract suite. Provider documentation/examples do not prove production entitlement.

### End-to-end tests

Consumer search-to-ticket and search-to-voucher paths; operator OTC sale; agent booking; booking lookup; cancellation/refund; cashier close; supplier settlement; failed ticket issue after payment; customer notification failure. At least one test per supported mode and activated provider path is required.

### Fault-injection tests

Simulate timeouts after the provider accepted a request, duplicate/out-of-order webhooks, provider maintenance, rate limits, token expiry, invalid signatures, partial response, price change, customer abort, queue backlog, delayed settlement file, email/SMS uncertain submission, database primary failover and loss of one application instance.

### Concurrency tests

- Bus: many booking attempts for the same seat over overlapping origin-destination segments; partial route overlap; multiple channels; timeout and retry.
- Ferry: concurrent bookings at the last available capacity unit in one class/sailing.
- Payments: duplicate callback, duplicated client request and repeated worker execution.
- Ledger: same source event posted concurrently must create one effective journal only.

Acceptance: zero oversells, duplicate confirmed tickets or duplicate effective ledger postings in the agreed test run. Report attempts, duration, dataset shape, DB version, concurrency, errors and any untested configurations.

### Performance, load, stress and soak

Use separate workload profiles for search/read-heavy, inventory-write-heavy, payment webhook bursts, supplier outage queues, holiday peaks and recovery traffic. Define service targets before testing. Report p50/p95/p99 latency, throughput, error rate, queue age/depth, pool saturation, database waits, cache hit rate and recovery behavior. Do not derive a production promise directly from theoretical user count.

### Security tests

Map controls to OWASP ASVS 5.0.0 and API Security Top 10:2023, with tailored focus on BOLA, broken authentication, excessive resource use, sensitive business-flow abuse, SSRF, unsafe upstream API consumption, webhook replay, tenant leakage, privilege escalation, malicious uploads, secrets exposure and supply-chain issues. Include SAST, dependency/container scans, secret scanning, DAST and independent penetration testing at a risk-appropriate stage.

### Recovery and operational tests

Restore backups into an isolated environment; verify booking, ticket, ledger and audit consistency; test disaster-recovery communications; rotate compromised credentials; revoke provider credentials; reconcile queued events; exercise provider failover and roll back a release. NIST SP 800-61 Rev. 3 is the current NIST incident response reference cited by this plan.

## 4. Travelar state-machine invariant tests

### Booking and inventory

- Only allowed state transitions occur.
- Holds expire deterministically and release only the relevant inventory.
- Ticket issuance requires validated fulfilment and the relevant verified payment/credit condition.
- An unknown provider outcome enters status inquiry/reconciliation, not blind replay.
- Cancellation/refund outcomes match both supplier terms and Travelar's records.

### Payment

- Browser redirects are never authoritative.
- Webhook authenticity is checked using each PSP's required process; replay and duplicate events are safe.
- Amount, currency, merchant and transaction reference match the stored intent.
- A late payment after hold expiry follows approved recovery/refund/exception policy.
- Refund request acceptance is not the same as refund completion.

### Accounting

- Every posted journal balances by currency.
- Corrections/reversals preserve the original journal and reason.
- Revenue recognition uses approved contract/accounting rules rather than gross booking value.
- Unmatched bank/PSP/operator records remain in suspense/exception queues and cannot be silently discarded.

### Communications

- API acceptance does not equal recipient delivery.
- Uncertain submission does not trigger indiscriminate failover that creates duplicates.
- Alternative provider use respects destination country, sender identity, consent, content and channel eligibility.
- Out-of-order delivery callbacks do not regress a terminal state incorrectly.

## 5. CI/CD release gates

A release pipeline must fail if required tests, migrations, dependency checks, secrets checks or build steps fail. Skipping a test requires explicit scope, reason, risk owner and expiry/replacement plan. Production deployment requires independent approval for high-risk changes, audit visibility and a tested recovery strategy.

Each CI result must identify commit, environment, command, test suite, totals, failures and artifact. A test not executed must be reported as “not run,” never as passed.

## 6. Evidence packet per module

Store: requirement IDs; source/ADR links; code commit; schema/migration versions; test report; test data/profile; security scan and finding dispositions; performance result; adapter contract version; monitoring dashboard/alerts; runbook; deploy/rollback record; known issues; approver and date. Use a tamper-evident evidence store appropriate to the risk; a hash chain alone does not make logs immutable or independently protected.

## Stage 15 — IDE-agent evidence requirements (24 October 2026)

For AI-assisted changes, append the agent's evidence report to the normal Definition of Done record. It must include requirement IDs; base and resulting commit; files changed; actual commands and exit codes; test artifacts/logs; environment and provider mode (mock/sandbox/production); security findings; concurrency/performance review; data/migration/rollback plan; observability/runbook changes; unresolved questions; reviewer and acceptance decision.

Never accept a claim based only on a rendered UI, browser recording, green-looking summary, model assertion or generated test file. Independently inspect the behavior and ensure tests exercise the requirement. A browser recording is supplementary evidence; it does not prove backend authorization, database integrity, inventory correctness or financial-state integrity.

Use the tool-neutral repository controls and controlled pilot defined in Document `41`. OWASP ASVS 5.0.0 and NIST SSDF SP 800-218 are references for developing and testing security controls, not a claim of certification.
