---
name: data-driven-platform-operations
description: Audit and implement Travelar OIMS routes, schedules, trips, fleet/seat maps, data-driven search cards, staff permissions, HIMS payout automation, audit/logging/security and partner APIs.
---

# Data-Driven Platform Operations Skill

## Required source documents

Read the current repository's `AGENTS.md` first. In the Travelar research pack, read Documents 47, 48, 49, 50, 64, 65, 66, 70, 71, 72, 76, 77, 78, 79, 80, 81, 82 and 83; also review ADR-OIMS-002 and ADR-API-001. Reconcile these against the actual repository and any newer approved ADR before editing.

## Workflow

1. Inspect Git state, source tree, route tree, modules, database schema/migrations, environment configuration and tests. Do not assume the frontend is complete.
2. Build a requirement traceability matrix with statuses: present-and-tested, present-unverified, partial, missing, conflict, blocked-by-evidence, not-applicable-with-reason.
3. Draw the current domain boundaries and data ownership map. Mark each field as Travelar DB, live supplier/provider, signed contract/policy, or governed CMS source.
4. Propose dependency-ordered changes and safe migrations. Use direct connected PostgreSQL only for authorized, non-destructive inspection and normal development operations. Use a separate test database for tests that write/reset data. Do not force Docker if an isolated test database or reproducible local service is already available.
5. Implement one bounded change at a time, with migration, backend logic, frontend, auth, audit, logs, tests, rollback and docs together as applicable.
6. Run unit, database integration, concurrency, authorization, provider contract and browser/E2E tests appropriate to the change. Preserve real test output. Mocks do not count as provider certification.
7. Reconcile acceptance evidence and update the requirements, ADRs, known issues and deployment notes.

## Mandatory domain patterns

### Routes and schedules

Keep location, route definition/version, recurring schedule, dated trip instance, vehicle/trip assignment and inventory allocation separate. Preview exact occurrences before generating trips; enforce idempotency and duplicate protection; include service timezone, effective dates, exceptions, vehicle/crew conflicts and fare coverage. Published changes require impact analysis.

### Inventory and seats

Represent each seat as a versioned entity in a structured layout. Allocate bus seats by ordered route segment in one transaction, using a database-enforced concurrency strategy. Ferry capacity is a separate capacity model. A stale cache or browser selection never proves availability.

### Data-driven UI

Read operational values from scoped APIs. Use safe field schemas and an allow-listed component registry; do not evaluate database content as executable code. Server recomputes quote, permissions and state transitions. Keep booking-time snapshots for fare, route/seat labels and terms.

### Organization and access

Store organizations, memberships, branch/resource scopes, role templates, capability grants and invite lifecycle. Check authorization in the backend for every object/action; implement PostgreSQL RLS as defense in depth where appropriate and test its bypass assumptions. Privileged role grants, payout approvals and reconciliation must respect separation of duties.

### Payouts and automation

Workers use a durable outbox/job with idempotency and explicit attempt/status history. Eligibility comes from ledger, contract and verified beneficiary records. Use preview/approval when supported, serialize requests within provider rate limits, and query/reconcile unknown results before any retry. Record provider acceptance separately from actual completion/settlement.

### Audit and logs

Separate domain audit, operational/security telemetry and double-entry accounting. Use structured logs and correlation IDs, redact credentials/tokens and unnecessary PII, restrict access/retention, and alert on logging/queue failure. Never overwrite posted journal or erase audit history to correct mistakes.

### API product

Publish only implemented, authorized Travelar-owned API operations. Generate OpenAPI from code and DTO/schema validators; document auth/scopes, errors, idempotency, limits, state transitions, freshness, webhook retries, versioning and privacy. Each partner credential has an owner, scopes, quotas, rotation/revocation, tenant binding and usage metering. Test object-level and property-level authorization. Do not expose GDS/PSP contracts directly as Travelar API.

## Safety gates

Human approval is required for production deploys, destructive database operations, live payments/payouts/refunds, production supplier booking, credential disclosure/rotation, security exceptions, material financial rule changes, and permission grants that create privileged access. Never store secrets in code or logs. A successful mock/UI flow is not production readiness.
