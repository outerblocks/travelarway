# 82 — Platform-Wide Data-Driven Acceptance Matrix and Build Order

**Product:** Travelar · **Stage:** 25 · **Status:** Engineering acceptance requirements.

## 1. The scope of “complete platform”

The data-driven rule applies to the six-mode public marketplace, search and booking, operator and agent channels, HIMS, OIMS, finance, staff/authorization, API/developer portal, integrations, communications, reporting, audit, security and operational automation. “Dynamic” does not mean arbitrary runtime code; the database stores validated business data/policy while reviewed code enforces types, permissions, transactions and invariants.

## 2. Acceptance matrix

|Domain|Minimum acceptance evidence|Common failure to reject|
|---|---|---|
|Master data|Create/edit/approve/retire location, route, branch, operator and mode; IDs/aliases/localization effective dates persist|Locations or routes baked into JSX/JSON fixtures in production|
|Route setup|Ordered stops, eligible board/alight pairs, versioned route publication, immutable past bookings|Route is a label with no operational stop relations|
|Recurring schedules|Preview date range through next month; generate occurrences; no duplicates; handle exceptions/time zones|Trips manually hardcoded one by one; duplicate recurrence on retry|
|Vehicle/fleet|Verified vehicle, registration, model/type, amenity and maintenance data; audit|Card uses fake plate or stale vehicle properties|
|Seat map|Versioned structured layout; vehicle/trip link; safe seat assignment and change-impact workflow|Seat map is a static image without seat identity or inventory logic|
|Bus inventory|Concurrent overlapping segment seat claims denied; non-overlap only permitted when appropriate|Check-then-insert race creates double booking|
|Ferry inventory|Concurrent class capacity reservation never exceeds capacity|Bus seatmap reused for ferry with no evidence|
|Fare engine|Effective-dated fare matrix by route/segment/class/category/channel; server quote; booking snapshots|Hardcoded totals or client-submitted price trusted|
|Search cards|Profile-driven registered fields; fresh availability; accurate origin/via/destination/times/amenities/vehicle details|Card displays supplier field that is missing or unverified as fact|
|Booking|Idempotency, quote expiry/revalidation, state machines, payment confirmation and reconciliation|Client success page marks paid/issued|
|Operator/agent staff|Invitation lifecycle, scopes, MFA policy, role templates, role revocation, audit|Role stored in browser or single generic `admin` role|
|Authorization|Negative tests for cross-tenant/branch object access and forbidden actions on every API path|Security checks only hide buttons in UI|
|Configuration governance|Draft/validate/preview/approve/publish/version/rollback with audit and cache invalidation|Settings mutate live without version/history/approval|
|HIMS workflow|Owned queues, evidence, deadlines, escalation, closure reason and role-specific actions|Overview dashboard without operational work handling|
|Automated payouts|Eligibility, beneficiary verification, idempotent candidate, approval policy, status poll and reconciliation|Scheduled job sends payout based only on a mutable total|
|Finance|Balanced ledger, mode subledger, settlement exceptions and reversals not edits|Ledger represented by editable balance fields|
|Audit|Actor/scope/action/time/reason/approval/correlation/diff; protected retention; export permission|Only console logs or mutable `updated_by` columns|
|Operational logging|Structured/correlated logs, PII/secret redaction, log-delivery monitoring and alerts|Raw tokens, passenger data or whole request bodies logged|
|Security|Least privilege, credential lifecycle, rate limit, MFA/step-up where needed, incident/restore controls|Secrets committed to repo; API trusts submitted tenant ID|
|Public API|OpenAPI validates; scoped partner credentials; idempotency; tenant isolation; deprecation policy|Expose supplier API directly or undocumented route with unrestricted token|
|Webhooks|Signature/sequence/dedup/retry/dead-letter/replay and delivery monitoring|Duplicate callback creates second ticket or payout|
|Terms/policies|Approved effective-dated texts, localized display, accepted version attached to booking|Live changed terms overwrite prior booking evidence|
|Testing|Unit/component/integration/contract/E2E/security/concurrency/restore as applicable, evidence recorded|Only screenshot or one happy-path UI test|
|Deployment|Env separation, migrations, backup/restore, secret injection, health/metrics, rollback, launch gates|IDE direct DB access is mistaken for deployed backend readiness|

## 3. Dependency-ordered implementation plan

The IDE agent must first inspect the actual repository and write a requirement-to-code/test gap matrix. The sequence below is a dependency guide; adjust based on the real dependency graph and record why.

### Stage A — source of truth and foundation

1. Confirm repository/branch/working tree, package scripts, existing route tree, auth, backend, database connection and current schema/migrations.
2. Reconcile approved requirements and existing ADRs; mark requirement status `verified`, `proposed`, `blocked`, `implemented-unverified` or `verified-implemented`.
3. Configure environment-separated PostgreSQL access and least-privilege runtime/migration/test roles. Verify version and backup posture without destructive operations.
4. Establish module boundaries, API error envelope, request validation, correlation IDs, auth identity-to-internal-user mapping, tenant membership and authorization policy service.
5. Add migration tooling, safe seeding, integration-test DB instructions, transactional outbox/job framework and test evidence reporting.

### Stage B — master data and operator control plane

6. Implement organizations/operators/branches, locations/stops, route versions, schedule rules, trip generation previews and durable job idempotency.
7. Implement fleet/vehicle/amenities, seat layouts and trip assignments; add database-backed segment inventory or mode-specific capacity model with concurrency tests.
8. Implement fare policies/quotes, search projection, public-card profile config and immutable booking policy snapshots.
9. Implement staff invitation, role/capability catalog, tenant/branch scopes and authorization negative tests.
10. Build OIMS screens and public search driven only by API responses; remove production hardcoded fixtures but retain test fixtures in test-only paths.

### Stage C — booking and money movement

11. Implement canonical booking/order state machine and provider authority registry; make provider integration modes explicit (`mock`, `sandbox`, `production`), each evidence-gated.
12. Implement payment attempt/verified event/refund lifecycle and finance ledger/subledgers before enabling real payments.
13. Implement payout eligibility/batches, maker-checker, recipient verification, provider rate limiter, provider status reconciliation, bank/operator subledger matching and incident controls.
14. Implement notification outbox/templates and status independently from booking/payment state.

### Stage D — HIMS, APIs and reliability

15. Build HIMS queues/configuration governance/operator onboarding/provider controls/finance/reconciliation/security audit/reporting.
16. Publish partner API OpenAPI from actual code, issue scoped credentials, implement webhooks and developer portal only for routes with stable contracts.
17. Add security test suite, load/concurrency tests, operational dashboards/alerts, backup restore drills, deployment/environment separation and runbooks.
18. Execute launch-readiness review for each market × mode × provider × channel. Legal, commercial, provider entitlement and regulatory gates must be closed before any live operation.

## 4. Evidence requirements per item

For each acceptance row, the agent records:

- Requirement/doc/ADR ID and source/evidence class.
- Files and migrations changed; commit SHA.
- Command/test name, environment, timestamp, exit code and sanitized evidence path.
- Expected behavior, actual behavior and pass/fail/blocked result.
- Security/tenant/privacy implications, concurrency and failure tests.
- For integrations: provider product/version/contract, account entitlement, environment and live-action authorization evidence.
- For workflows: actor, permission, state transition, audit event and recovery/rollback behavior.
- Open questions and residual risks. No unsupported feature may be labeled complete.

## 5. Non-negotiable invariants

- All important business reads and mutations occur through authenticated, authorized domain APIs; no untrusted browser writes directly into database or provider credentials.
- The backend computes and validates all financial amounts, route/trip eligibility, seat claims, payout eligibility and status changes.
- PostgreSQL is the authoritative transactional store for Travelar-owned data; caches are derived data.
- Inventory, ledger and provider side effects are idempotent/concurrency-safe; unknown outcome triggers reconciliation, not guesswork.
- Tenant and object authorization are checked every request. Database RLS can provide defense in depth but is not a substitute for application policy.
- Audit history and posted ledger events are not overwritten to erase mistakes.
- External provider availability, test environment and production permission are verified per exact operation and market.
- No actual production release, live payment/payout/refund, destructive database action or privileged security/financial change without explicit human approval.
