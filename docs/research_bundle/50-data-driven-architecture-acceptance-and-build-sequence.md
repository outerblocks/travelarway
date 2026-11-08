# 50 — Data-Driven Architecture Acceptance, Test Matrix and Build Sequence

**Product:** Travelar · **Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Stage:** 19 · **Date:** 24 October 2026  
**Status:** Proposed engineering acceptance standard; repository-specific commands remain to be set after inspection.

## 1. Non-negotiable engineering standard

A module is not complete when its UI renders. A feature is complete only when a configured, permissioned and audited end-to-end workflow works against the actual data model, APIs, state transitions, authorization controls, integrations, error states and operational procedures that apply to that feature.

Use this workflow for each implementation change:

`SOURCE OF TRUTH → REVIEW → GAPS/CONTRADICTIONS → RESEARCH → ADR/REQUIREMENT UPDATE → DESIGN → IMPLEMENT → TEST → SECURITY REVIEW → PERFORMANCE REVIEW → DOCUMENT → RECONCILE SOURCE OF TRUTH → NEXT DEPENDENCY`.

No agent may bypass a conflict by selecting a hardcoded constant, inventing a supplier capability, fabricating a test result or marking unknown external behavior as passed.

## 2. Required data-driven proofs

### 2.1 Geography and search

- Add a region/city, route and stop through authorized configuration; it becomes searchable for only the correct scope after publication, without rebuilding the client.
- Verify from/to values use stable IDs and that origin/destination combinations are eligible for selected service/date.
- Verify localized labels/aliases do not alter canonical IDs or routing correctness.
- Verify boarding/drop-off choices are constrained to that operator's trip and ordered route stops.
- Verify invalid, stale or unpublished locations cannot be submitted to create a booking.
- Verify all search query parameters are server-side validated and paginated; huge catalogs are not loaded into the browser.
- Verify search cache keys include the effective market/mode/config scope and cannot leak one operator/tenant's data.

### 2.2 Search card/profile configuration

- Change an allowed card field order/label in a draft config, validate, approve/publish, then verify intended market sees new renderer while old/historical booking snapshots remain unchanged.
- Attempt arbitrary HTML/JS, unknown component types, disallowed private fields and unsupported provider values; publication/rendering rejects or safely omits them with an observable diagnostic.
- Verify mode-specific components don't assume the same field model for all modes.

### 2.3 Pricing, commission, markup, coupon and policy

- Run boundary tests for fixed, percentage, tiered and capped rules only where supported; validate currency, rounding and eligible base.
- Verify conflicting effective dates/overlaps cannot publish without explicit resolution.
- Verify booking records the exact rule/contract version and line-item inputs, can be explained later, and is not silently re-priced when current config changes.
- Verify unsupported/uncontracted markup or commission cannot activate just because a config value was entered.
- Verify backend recomputation rejects client-submitted total/fee/currency manipulation.

### 2.4 Configuration lifecycle and governance

- Unauthorized user cannot edit/publish; operator admin cannot modify platform-wide provider, commission or another tenant's route.
- A material change requires separate preparer/reviewer when policy requires; self-approval is rejected.
- Invalid relations (missing route stop, inactive country, expired contract, unsupported method/currency, invalid threshold) block publication.
- Publication is versioned, auditable, propagation status observable and rollback uses a new superseding version without altering transaction history.
- Missing config fails closed for sensitive decisions, and no hidden frontend default quietly restores an old business rule.

### 2.5 HIMS/OIMS permission and workflows

- Same route/service, price, booking, financial status and refund logic is called from public, agent, OIMS and HIMS channels where authorized; channel-specific permissions are enforced centrally.
- Role-scope tests cover HQ vs operator, operator A vs operator B, branch, assigned trip, field-level passenger data, read vs create vs approve vs execute, and expiry of temporary access.
- Daily workflow scenario tests exercise task ownership, approval, rejection, retry, timeout, evidence, notifications, escalation and final state.
- A dashboard action cannot mutate a protected status without the backend state-transition service.

### 2.6 Integration and failure recovery

- Simulate adapter timeout, rate limit, out-of-order/duplicate callbacks, stale data, unavailable supplier, partial success, unknown outcome and authentication failure.
- Verify raw provider event/evidence is retained safely, normalized state is correct and source authority/freshness is clear.
- Verify retry and reconciliation are idempotent; stop selling or queue manual review when required to preserve correctness.
- Every dead-letter task has an owner/alert and replay guard; accepting a task does not prove customer delivery or supplier confirmation.

## 3. Data source quality levels

For operational data, record whether each fact is:
- **Authoritative and current:** required source confirmed within its defined freshness bound.
- **Authoritative but stale:** genuine source, refresh beyond permitted bound; may be viewable but sale/action rules apply.
- **Cached/projection:** derived copy with source/version/time.
- **Imported/manual:** uploaded or entered by an authorized actor, provenance and review status explicit.
- **Provider-claimed/unverified:** upstream says this, but Travelar has not reconciled/verified the relevant fact.
- **Unknown/conflicted:** conflicting or absent evidence; sensitive action stops or enters an exception workflow.

An interface should not show all six as a plain boolean `available=true`.

## 4. Core entity and constraint review

Before writing UI for a domain, define at least: stable identity, owner/tenant scope, lifecycle status, source-of-truth, effective dates/version, natural uniqueness, foreign-key relationships, audit needs, retention class, concurrency behavior and deletion/archive policy. Use database constraints and transactions for conditions the database can guarantee; use reviewed domain services for richer state transitions. Shared-table tenancy is acceptable only with comprehensive ownership scoping, appropriate database protections and negative-path tests.

## 5. Build sequence

1. **Configuration and source ownership ADR:** field catalogue, scopes, precedence, versions, effective periods, publish/rollback and source-of-truth registry.
2. **Identity/tenancy/audit primitives:** verified actor membership, scope checks, permissions, maker-checker and access audit.
3. **Reference/master data:** country/market, language/currency/timezone, locations and aliases, providers/suppliers/operators, mode capability.
4. **Operator catalog:** branches, routes, ordered stops, fleets/vessels, service classes, trips/sailings, field schemas and eligibility.
5. **Config studio:** edit, validate, preview, approve, publish, monitor, supersede/rollback.
6. **Search API and renderer contract:** dynamic search profiles, location options, mode result DTOs, sorting/filtering, pagination, freshness and source provenance.
7. **Pricing/quote and policy snapshot:** fare, fees, coupon allocation, commission/markup, refund rules and currency policy with historical versions.
8. **Inventory, booking and provider orchestration:** per-mode state models; concurrency and unknown-outcome recovery.
9. **HIMS/OIMS task/approval system:** module-specific queues and role journeys based on real daily operations.
10. **Finance/settlement and reports:** source-linked accounting/settlement reconciliations and exceptions.
11. **Public content and guide CMS:** destinations/deals/source provenance/review schedules.
12. **End-to-end permission/security/performance/recovery and operational acceptance:** evidence bundle before feature or market activation.

These stages are dependencies, not a promise to deploy everything at once. Build representative slices end-to-end and validate them with actual operators and department owners before broad expansion.

## 6. Research and technology decisions

- The current proposed stack is React/TanStack Start + NestJS/Fastify + PostgreSQL 18 with a modular monolith and background workers/outbox. Confirm through a proof of concept in the actual repo.
- Keycloak is the current identity candidate. It can support RBAC and more fine-grained policy models, but Travelar still must enforce application/domain authorization and operator tenancy.
- DMN-style decision tables can be considered for bounded explainable rules with many combinations; do not push inventory, double-entry posting, signature verification or authorization invariants into generic editable rules.
- A process/workflow engine is a separate decision. Persisted state machines and task queues are the starting point; adopt BPMN/durable workflow infrastructure only after a focused pilot shows the value outweighs operations and hosting overhead.

References:
- OWASP Authorization: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Multi-Tenant Security: https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html
- Keycloak Authorization Services: https://www.keycloak.org/docs/latest/authorization_services/index.html
- Camunda DMN: https://camunda.com/dmn/
- Temporal durable execution: https://docs.temporal.io/temporal

## 7. Required implementation evidence per module

Every module/feature completion report includes:
1. Requirements and decisions implemented, with source-of-truth references.
2. Changed data model/migrations/indexes/constraints and rollback notes.
3. API schemas/endpoints and authorization scope.
4. Configurable vs invariant behavior classification.
5. State transition and exception handling design.
6. Tests actually run, environment/data fixture type, command, result and omissions.
7. Cross-tenant/unauthorized/invalid-input negative tests.
8. Integration mocks versus real provider evidence, with explicit scope.
9. Concurrency/idempotency/recovery results where relevant.
10. Security, privacy, observability, performance and accessibility checks.
11. Operator/support/finance procedures and dashboards/alerts needed to run it.
12. Known gaps, unresolved external dependencies and explicit production go/no-go status.

Generated UI, mock success, a single happy-path test, or a provider API document must never be reported as proof of a complete production integration.
