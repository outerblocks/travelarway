# ADR-STACK-001 — React/TanStack Start + NestJS/Fastify + PostgreSQL 18

- **Status:** Recommended baseline; final lock requires technical proof and team-skill review
- **Date:** 24 October 2026
- **Decision owner:** OuterBlocks Limited

## Context

Travelar needs a public SEO-capable marketplace, authenticated operator/agent/admin web apps, APIs consumed by web/mobile/USSD/marshal channels, multiple external supplier and payment adapters, segment-level seat inventory, ferry class capacity, a double-entry ledger, secure multitenant authorization and future scale. The user preference is a custom backend/database, not Supabase.

## Decision

- Frontend: React + TanStack Start with TypeScript/TanStack Router.
- Core backend: NestJS + TypeScript, using Fastify as the HTTP adapter subject to compatibility/performance tests.
- Database: PostgreSQL 18.x, direct dedicated PostgreSQL environment; do not use Supabase as the system-of-record platform.
- Runtime: Node.js 24 LTS on the research date; revalidate supported LTS at implementation lock.
- DB access: Drizzle ORM + `node-postgres` as candidate, with explicit SQL and reviewed migrations for integrity-critical functionality.
- Application structure: modular monolith; API/worker processes may be deployed separately from the same codebase. No microservices/Kubernetes/Kafka until measurable requirements justify them.
- Core API: versioned REST/OpenAPI. TanStack server functions may implement UI-oriented BFF calls but may not duplicate or bypass core business-domain validation.
- Identity: standards-based IdP integration; Auth0 candidate subject to ADR-AUTH-001 gates.

## Why

TanStack Start is documented as stable and supports SSR, server routes/functions, typed routing and flexible deployment. NestJS supplies module/guard/DI/testing patterns that support a broad domain model. Fastify is a supported Nest adapter. PostgreSQL 18.6 is the latest listed PostgreSQL 18 minor on the decision date and is supported through November 2030. Drizzle is integrated in Nest's database overview and supports PostgreSQL transactions while allowing explicit SQL for specialized behavior.

Source docs:
- https://tanstack.com/start/latest/docs/framework/react/overview
- https://docs.nestjs.com/techniques/performance
- https://docs.nestjs.com/data/overview
- https://orm.drizzle.team/docs/get-started-postgresql
- https://orm.drizzle.team/docs/transactions
- https://www.postgresql.org/support/versioning/
- https://nodejs.org/en/about/previous-releases

## Consequences

### Benefits
- One primary application language reduces frontend/backend skill fragmentation.
- Distinct core API means non-browser clients do not depend on TanStack server-function contracts.
- Strong module boundaries and dependency injection support provider adapters, security guards and testing.
- PostgreSQL is portable and supports required transactional constraints and locking.

### Risks/costs
- TypeScript does not eliminate runtime validation or authorization needs.
- NestJS has framework overhead and the team must not confuse module structure with true domain boundaries.
- TanStack Start integration with the selected IdP must be tested; don't assume an official Auth0-specific adapter exists.
- Drizzle requires reviewed SQL/migrations and proof for advanced PostgreSQL constraints; switch to Kysely/direct `pg` for a material fit issue.
- Hosting region/backup topology remains subject to data-transfer review; a custom backend does not solve hosting compliance by itself.

## Proof-of-concept exit criteria

- Build one TanStack SSR route and one authenticated BFF flow against a NestJS API.
- Validate API access-token issuer/audience/signature/time claims and internal RBAC/ABAC denial paths.
- Verify PostgreSQL 18 + Drizzle transaction/locking constraints through concurrent inventory tests.
- Post an idempotent double-entry journal in one transaction; reject unbalanced posting.
- Process duplicate/delayed PSP events and provider timeouts without duplicate payment or ticket.
- Run worker/outbox retry/replay tests.
- Run representative API/load/security tests and migration/restore rehearsal.
- Confirm a legally acceptable database location and an operator-able backup/recovery plan.

## Revisit triggers

- Team leadership has substantially stronger experience in Java/Spring, .NET or Go.
- Benchmarks expose event-loop or framework constraints under realistic load.
- Selected data-center provider does not support PostgreSQL 18 or required recovery features.
- Drizzle's constraint/migration tools prove insufficient in representative tests.
- A specific legal or commercial boundary requires a separately deployed service.

---

**Status note:** Recommended baseline; no code or production database is created by this ADR.
