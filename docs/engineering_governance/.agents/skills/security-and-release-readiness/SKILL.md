---
name: security-and-release-readiness
description: Use for independent security, performance, failure-mode or release review of a Travelar change; do not deploy or activate production from this skill.
---
# Independent security and release review

1. Review the approved requirements/ADRs, diff, changed API/data surfaces, threat model and test evidence.
2. Check server-side authorization and tenant/branch scoping; input validation; session/token validation; CSRF/XSS/SQL injection/API object authorization; secrets; logging/redaction; dependency risks; data retention and external transfers.
3. Check every supplier/payment/communication adapter for timeouts, retries, idempotency, signatures, duplicate/out-of-order events, capability limits and reconciliation.
4. Check DB constraints/transactions/migration safety. Bus seats require segment-overlap concurrency tests; ferry inventory requires atomic class-capacity tests; ledger postings must balance and be immutable-by-adjustment.
5. Check performance, resource limits, timeouts, queue retry/dead-letter behavior, observability and incident/runbook coverage. State tests not run.
6. Do not treat automated review or browser artifacts as sufficient. Report severity, evidence, reproduction, affected requirements, remediation and residual risk.
7. Verify that CI evidence applies to the actual candidate commit and that all required human reviews/approvals and protected-branch requirements are satisfied.
8. State one status: `accepted`, `accepted with explicitly approved residual risk`, or `blocked`. Never perform deployment, live financial operation or supplier activation.
