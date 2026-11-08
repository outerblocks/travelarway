# ADR-DATA-003 — Data-Driven Configuration with Code-Enforced Invariants

**Date:** 24 October 2026 · **Status:** Proposed, pending product/engineering owner approval

## Context
Travelar spans six booking modes, multiple markets, operators, branches, providers and customer/internal channels. Production values and business policies must not be duplicated in frontend arrays or scattered hardcoded conditionals. At the same time, arbitrary database-driven executable behavior would create security, audit and correctness risks.

## Decision

1. Use a central, typed, scoped and versioned configuration/master-data model backed by PostgreSQL and exposed through typed APIs.
2. Treat routes, stops, market availability, fare/contract rules, passenger-field schemas, safe search/card profiles, content, operational approval thresholds and provider eligibility as governed data wherever variable by market/operator/supplier.
3. Use a publication lifecycle with semantic validation, impact preview, approval where required, effective dates, audit, propagation status and rollback via superseding versions.
4. Make public search and internal modules fetch current relevant configuration/data from authorized APIs; UI renderers use a registry of safe implemented component types.
5. Keep security, tenancy, state-transition, inventory-concurrency, payment-verification, ledger-balance, idempotency and provider-authentication invariants enforceable in reviewed code/database constraints. Configuration cannot disable them.
6. Preserve applied configuration and contract versions on quotes, bookings, tickets, financial records, actions and decisions.
7. Start without a general-purpose BPM platform. Implement explicit state machines, tasks, approvals, transactional outbox and workers in the modular monolith. Evaluate DMN/BPMN/durable workflow products by a contained pilot if complex rules and human workflows justify them.

## Consequences

**Benefits:** fewer redeploys for valid operational changes; less cross-mode drift; better explainability and audit; safer market expansion; consistent behavior across public/OIMS/HIMS channels.

**Costs:** configuration administration, data modeling, validation tests, version resolution, cache invalidation, change governance and operator training are first-class product work. Poor configuration quality can become a platform-wide incident; publication and rollback must be engineered as carefully as code deployment.

## Rejected alternatives

- Hardcoded frontend lists and scattered business constants: rejected because updates drift and require releases, cannot be reliably tenant/market scoped and cannot explain historical decisions.
- Arbitrary executable code in database fields: rejected because it broadens privilege, safety and review risks.
- One universal no-code workflow engine for every business process from day one: rejected pending evidence that its complexity is justified.

## Acceptance
See Documents 47 and 50 for the configuration schema/lifecycle and mandatory test matrix. Revisit after a representative end-to-end prototype proves runtime configuration, permissions, history, cache propagation and rollback.
