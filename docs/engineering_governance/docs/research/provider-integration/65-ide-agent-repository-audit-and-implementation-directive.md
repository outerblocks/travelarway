# Travelar IDE Agent — Repository Audit and Full-Stack Implementation Directive

**Instruction status:** Start from this directive and the installed Travelar engineering governance pack.  
**Date:** 28 October 2026  
**Current project status from owner:** The visible repository is an incomplete frontend. The owner expects the engineering pack to govern remediation and implementation of backend and database functionality as well. The IDE has a PostgreSQL connection configured, but its environment, privileges and safety are not yet independently verified.

## Mission

Audit the actual repository and source-of-truth engineering pack, retain sound work, correct incomplete or conflicting implementation, and implement the required Travelar system across frontend, backend, database, authorization, integrations, tests, operations and documentation. Do not treat the current frontend as a complete product, and do not replace it wholesale without evidence that a specific part is unusable.

Work as a senior engineering agent, not a code generator. Follow the controlling sequence:

**SOURCE OF TRUTH → REPOSITORY AUDIT → GAPS / CONTRADICTIONS → RESEARCH → REQUIREMENT / ADR UPDATE → PLAN → IMPLEMENT → TEST → SECURITY REVIEW → PERFORMANCE / FAILURE REVIEW → DOCUMENT → RECONCILE EVIDENCE → NEXT DEPENDENCY.**

The agent should make progress through bounded, low-risk implementation steps without repeatedly asking the owner to approve ordinary, reversible code changes. Human approval remains mandatory for destructive database work, production deployments, production payment/refund activity, credentials/permissions changes, regulated go-live claims, and other high-risk operations defined by `AGENTS.md`.

## Phase 0 — Establish repository reality

1. Read root `AGENTS.md`, Cursor rules, Antigravity/Agent Skills if present, Travelar source-of-truth requirements, ADRs, assumptions/contradictions registers, acceptance tests and relevant addenda in full enough to identify dependencies.
2. Record current working directory, branch, base commit, `git status`, package manager, existing package scripts, dependencies, runtime versions and CI configuration. Do not discard or overwrite user changes.
3. Inventory the existing frontend: routes, components, state/context, data fixtures, domain types, generated route files, tests, accessibility, API assumptions and build configuration. Do not assume screenshots represent the whole repository.
4. Inventory backend modules and API routes; database/ORM configuration and migrations; environment variable schema; authentication and authorization; job/work queues; integration adapters; observability; deploy/release files; tests; docs. Record present, partial, absent and unknown separately.
5. Treat generated files carefully. Do not edit generated route trees or compiled output when their source generator should be changed. Do not edit `dist`, build output or test results as if they were source.
6. Produce a repository-to-requirement gap matrix with requirement ID, source-of-truth location, current evidence/path, status, gap/risk, dependencies, intended remediation, test, and acceptance evidence.

## Phase 1 — Database connection and environment preflight

A configured IDE database connection is evidence of IDE-to-database connectivity only. It does not prove that the backend can connect at runtime, that the app can deploy, or that the connected database is safe for automated writes.

Begin with read-only inspection using the least-privileged credential available. Record sanitized results for server version, current database, current role, TLS status if observable, available extensions, schema ownership/grants, network route, hosting environment and whether the target is local, development, staging or production. Never print connection strings, passwords, tokens, private keys or customer data into agent logs.

Before any write, classify the target environment. If it cannot be positively identified as development or a purpose-built test database, stop writes and report `blocked: target environment not verified`.

Do not automatically run `DROP DATABASE`, `DROP SCHEMA`, `TRUNCATE`, bulk destructive cleanup, broad `ALTER` statements, server configuration changes, role/permission changes, major upgrades or production migrations. Backups must not be assumed to exist; request or verify a tested restore point before material data/schema changes.

## Phase 2 — Update decisions and implement in dependency order

1. Reconcile the source-of-truth stack with the repository. The current baseline is React + TanStack Start, NestJS + TypeScript/Fastify, PostgreSQL, Drizzle + node-postgres provisionally, a modular monolith first and an outbox/worker pattern where needed. Verify current code and dependencies before changing them.
2. Apply ADR-064, `64-postgresql-baseline-and-architecture-decision.md`, and `66-postgresql-connection-and-docker-guidance.md`.
3. Establish environment validation, typed configuration, secrets handling, backend application startup, health/readiness checks, request validation, error envelope, logging/correlation IDs and graceful shutdown.
4. Establish database schema, versioned migrations and deterministic seed/reference data. Run migrations only against the identified development/test database. Do not use IDE SQL editor mutations as a substitute for repository migrations.
5. Implement authentication and authorization boundaries, tenant and branch scoping, audit events and approval controls before sensitive business flows. If Keycloak is selected, keep its identity database separate.
6. Implement domain models for all six modes as first-class capabilities; stage production integrations according to the requirements/decision gates. Do not collapse all travel products into bus-only tables or hardcoded UI fixtures.
7. Implement shared engines and vertical slices in dependency order: configuration/market governance; operator onboarding and organization access; product search and authoritative quotes; inventory/holds; booking/order state; payment abstraction and reconciliation; ticket/manifest; cancellations/refunds; accounting/commission/settlement; HIMS/OIMS workflows; content/guides; integrations and communications; reports/observability.
8. Connect the existing frontend to real backend APIs incrementally. Keep mock fixtures only where explicitly labelled for design/storybook/test and ensure they cannot be mistaken for live data.
9. Deliver integration, contract, concurrency, authorization, security and end-to-end tests. A green UI test alone is not evidence that backend/database behavior works.

The precise sequence can be adjusted when the requirement dependency graph or verified repository state proves it necessary. Any material sequence change must be logged with reasoning.

## PostgreSQL rules

- PostgreSQL is the source of truth for transactional inventory, bookings, payment state, ledger, tenant data and versioned business configuration.
- No browser-to-PostgreSQL connection. All data access goes through the authorized backend.
- Prefer least-privilege roles: separate application runtime, migration and read-only diagnostic roles where applicable. Runtime role must not be a superuser, database owner or able to administer roles.
- Require encrypted connections for remote database traffic and validate certificates/hostname according to the hosting provider's supported configuration. Do not expose the server to the whole public internet merely to make the IDE connect.
- Keep credentials in untracked environment secrets or an approved secret manager; include only placeholders in examples. Check `.gitignore` and secret scanners.
- Use parameterized queries and ORM/query-builder bindings. Never concatenate untrusted input into SQL identifiers or values.
- Version every schema change. Generated migrations must be inspected, tested on a fresh database and a copy of the prior schema/data shape, and documented with preflight, impact, expected lock/downtime, rollback or forward-fix and verification.
- Prefer expand-and-contract for changes that must coexist with deployed code. Do not assume rollback is safe after writes have occurred.
- Protect booking capacity and money with database transactions, constraints, correct locking/isolation and idempotency. Redis may coordinate or cache, but is not the authoritative inventory or ledger.
- Add and test tenant isolation in the API and, where appropriate, PostgreSQL row-level security. Test direct unauthorized access and incorrect/missing tenant context.

## Tests and evidence

1. First inspect scripts that actually exist; do not invent package commands. Add missing scripts and CI jobs only after confirming project conventions.
2. Test layers: lint/format; typecheck; unit tests; API integration tests; migration/fresh-database test; authorization/tenant tests; booking/concurrency tests; provider contract tests using mocks or an approved sandbox; browser E2E; build; dependency/secret/security scans as supported.
3. Each test report includes exact command, exit code, runtime/tool versions, database target label (`isolated test`, `development`, `sandbox`, or `production`) and evidence path. Never report tests run unless they ran.
4. Payment tests default to mocks. No live provider transaction or payout without explicit human authorization.
5. On failure, fix the root cause or document a genuine blocker. Never weaken expected behavior, authorization or tests merely to get a green build.
6. Mark incomplete requirements `blocked`, `proposed`, `unresolved` or `not run` rather than `implemented`/`tested` without evidence.

## Docker rule

Docker is optional, not a default requirement. Do not add Docker/Compose merely by habit.

Use a direct connection to the already-provisioned PostgreSQL server for non-destructive read-only inspection and for development/integration testing only when the connection is secure, the target is verified, an isolated test database is available, permissions are limited, data is non-sensitive and tests cannot damage shared data.

Recommend a local/ephemeral PostgreSQL container or other isolated disposable database if one or more are true: no safe test database exists; reproducible CI is required; schema tests risk damaging a shared environment; service versions/extensions must be pinned; tests need to reset the database; or local offline development is required. Prefer reproducibility and isolation, not Docker as a goal in itself. If Docker is unavailable or prohibited, provide an equivalent safe test database strategy.

## Definition of completion

A module is not complete because a page looks correct or an API endpoint responds. Cover applicable requirements for business logic, data model, constraints/transactions/migrations, API contract, frontend/accessibility, identity/authorization, audit, integration behavior, concurrency, recovery, offline/retry behavior, tests, security, performance, observability, documentation, deployment/configuration, rollback and evidence reconciliation.

## Required deliverables from the agent

- `repository-audit.md` and a requirement gap matrix.
- Updated ADR/requirements/assumption register where justified.
- Ordered task plan with dependencies and risk classification.
- A migration inventory and database environment safety report, without secrets.
- Implemented bounded changes, tests and evidence logs.
- Deployment and rollback plan distinguishing local/dev/staging/production.
- Final requirement-by-requirement acceptance matrix and honest residual-risk list.

Start by auditing, not by generating a new application skeleton. Preserve good existing work and implement the pack's missing requirements systematically.
