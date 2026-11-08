# 34 — Technology Stack Evaluation and Recommendation

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Date:** 24 October 2026  
**Decision status:** Recommended baseline, conditional on a representative proof of concept and operational-team review  
**Scope:** Web frontends, core backend, database access, job execution, APIs, testing, deployment and long-term operations

## 1. Executive recommendation


### Identity platform update (24 October 2026)

The current preference is **self-hosted Keycloak in a verified Tanzanian environment**, conditional on legal, hosting, security-operations and proof-of-concept gates. Keycloak's current official supported configurations list PostgreSQL 18.x, and the latest listed release at the research date is 26.8.1. This allows the identity service to use the PostgreSQL major-version baseline selected for Travelar without requiring the database to be Supabase-managed.

This choice is motivated by deployment/location control. It is not a claim that Tanzanian law universally requires all personal data to remain in-country, or that Keycloak is secure without competent operations. OuterBlocks assumes responsibility for patching, hardening, availability, backups, restore tests, abuse controls, admin access and incident response. Auth0 remains a contingency after written transfer, contract, region and pricing review. See `33-authentication-provider-and-identity-architecture.md`, `35-keycloak-and-local-identity-hosting-assessment.md`, and `ADR-AUTH-001-keycloak-first-local-identity.md`.

Adopt a TypeScript-first architecture for the initial Travelar platform, with clear boundaries between the web framework and the core business backend:

- **Web:** React + TanStack Start, TypeScript, TanStack Router and route loaders for public SEO pages and authenticated operator/administrative web applications.
- **Core backend:** NestJS + TypeScript, running on the Fastify adapter, as a separately deployed API and worker codebase/applications within a **modular monolith**.
- **Runtime:** a currently supported Node.js LTS line; as of 24 October 2026, Node.js 24 is LTS while Node.js 26 is Current, so use Node 24 for production unless vendor/library tests show a justified reason to select another supported LTS. Verify support at implementation lock. [Node.js releases](https://nodejs.org/en/about/previous-releases).
- **Database:** direct PostgreSQL 18.x (latest listed minor 18.6 on the research date), using native transactions, constraints, row locks and explicit SQL for integrity-critical paths. Avoid PostgreSQL 19 release candidates in production. [PostgreSQL versioning](https://www.postgresql.org/support/versioning/).
- **DB access:** Drizzle ORM with the node-postgres driver as the first candidate, but use explicit reviewed SQL for segment inventory allocation, double-entry posting, idempotency claims and other high-integrity workflows. Validate Drizzle's migration/constraint handling in a proof of concept; switch to a typed SQL query builder or direct `pg` only if a test demonstrates a material fit problem. [Nest database integrations](https://docs.nestjs.com/data/overview), [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql), [Drizzle transactions](https://orm.drizzle.team/docs/transactions).
- **Contracts:** versioned REST APIs, OpenAPI as the service contract, generated clients where useful, and runtime validation at all untrusted boundaries. TypeScript types alone do not validate runtime input or permissions.
- **Authentication:** self-hosted Keycloak in a verified Tanzanian environment is the preferred direction, conditional on legal, hosting, security-operations and proof-of-concept gates. Auth0 is a contingency. Keep business authorization in the NestJS backend and Travelar database. See Documents 33 and 35 and ADR-AUTH-001.
- **Async work:** a PostgreSQL transactional outbox and separately runnable NestJS worker first. Introduce Redis/BullMQ only when operational requirements justify it; don't make a cache or Redis queue the sole authoritative record of money, ticketing or booking intent. Nest documents that BullMQ is actively developed and persists jobs in Redis. [Nest queues](https://docs.nestjs.com/techniques/queues).
- **Architecture:** no microservices, Kubernetes or Kafka in the initial baseline without measurable requirements. Keep modules extractable behind internal interfaces and documented contracts.

This stack is a reasoned recommendation for a product with six booking modes, many provider adapters, financial integrity requirements and multiple client surfaces. It is not a claim that TypeScript is universally superior to Java, C# or Go. If the actual engineering leadership has materially stronger experience in another mature stack, re-run the scorecard before the architecture lock.

## 2. The PostgreSQL 17 versus 18 issue

Supabase's published May 2026 change says PostgreSQL 17 is its default platform version at that time; individual projects may still be on different versions and should be checked directly. [Supabase Postgres version guidance](https://supabase.com/docs/guides/database/postgres/which-version-of-postgres), [Supabase Postgres 17 notice](https://supabase.com/changelog/46080-self-hosted-supabase-upgrading-from-pg-15-to-17-breaking-change).

PostgreSQL 18 was released on 25 September 2025; the official versioning table lists PostgreSQL 18.6 as current on the research date and indicates support through 14 November 2030. PostgreSQL 18 brings features such as `uuidv7()`, the asynchronous I/O subsystem, skip scans for additional multicolumn B-tree access cases and OAuth authentication support, among other changes. [PostgreSQL 18 release notes](https://www.postgresql.org/docs/18/release-18.html), [versioning policy](https://www.postgresql.org/support/versioning/).

Travelar may reasonably standardize directly on PostgreSQL 18 and own its migration cadence rather than depend on a BaaS release schedule. The database-version difference alone is not proof that Supabase is unsuitable; the decision also reflects the explicit preference for a custom backend/database, direct infrastructure control and a separately managed identity strategy. Keep PostgreSQL 18 current on supported minor releases and plan upgrades rather than treating the major version as permanent.

## 3. Frontend: React + TanStack Start

React's documentation recommends starting new applications with a framework rather than assembling an unstructured pile of single-page-app tools. TanStack Start is documented as stable and provides full-document server-side rendering, streaming, server routes, server functions, middleware and selectable per-route rendering. [React: Creating a React App](https://react.dev/learn/creating-a-react-app), [TanStack Start overview](https://tanstack.com/start/latest/docs/framework/react/overview).

### Why this fits

- Type-safe route paths, nested route layouts and search parameters help represent country/mode/date-driven search flows.
- Server-side rendering is useful for public travel-mode landing pages and crawlable route/destination content.
- Route loaders and streaming can improve perceived search UX when used responsibly.
- A single React/TypeScript ecosystem reduces skill fragmentation across consumer and internal web interfaces.

### Guardrails

- TanStack Start is the web framework and optional BFF, **not the canonical home of business logic**.
- Use server functions for UI-specific orchestration only; the core API owns booking, pricing, seat/class inventory, payments, refunds, account authorization and accounting.
- Do not rely on `beforeLoad` or hidden UI to secure data. Authorize every server function and every API endpoint on the server. [TanStack auth overview](https://tanstack.com/start/latest/docs/framework/react/guide/authentication-overview).
- Do not expose secrets in variables compiled into client bundles; keep private environment variables server-only.
- Run a technical proof using Keycloak/OIDC to confirm SSR callback/session behavior; do not assume an official first-party TanStack-specific Auth0 adapter exists.

Suggested surfaces: public marketplace on `travelarway.com`; operator web application associated with `oims.travelarway.com`; internal administration associated with `hims.travelarway.com`; agent portal associated with `agents.travelarway.com`. These remain proposed domain decisions; use a clearly specified API origin and cookie/session boundaries. Avoid broad domain cookies unless required and justified.

## 4. Backend candidates

### 4.1 Candidate scorecard

Score is an initial qualitative assessment (1 = weaker fit, 5 = stronger fit), not a benchmark. Weighting: domain/API structure 20%, integration ecosystem 15%, financial/inventory transaction support 20%, delivery productivity 15%, operations/hiring 15%, performance/scaling 10%, runtime flexibility 5%. Adjust after team experience is known.

| Backend option | Domain structure | Integrations | Transaction fit | Delivery speed | Operations/hiring | Performance potential | Assessment |
|---|---:|---:|---:|---:|---:|---:|---|
| **TypeScript + NestJS + Fastify** | 5 | 5 | 4 | 5 | 4 | 4 | **Recommended starting point**; shares language/contracts with React; organized modules/guards/testing; must keep async CPU-heavy work out of the request event loop. |
| Fastify directly (TypeScript) | 3 | 5 | 4 | 4 | 4 | 5 | Strong, lighter option but provides fewer built-in architectural conventions; more decisions on module boundaries, dependency management, authorization and test structure fall to the team. |
| Java/Kotlin + Spring Boot | 5 | 5 | 5 | 3 | 4 | 5 | Very strong for enterprise integration and long-lived transactional systems; choose if team leadership/staffing already has deep JVM expertise and accepts a second primary language. |
| C# + ASP.NET Core | 5 | 4 | 5 | 4 | 4 | 5 | Strong APIs, typing, concurrency and operational tooling; a sound alternative with an established .NET team. |
| Go | 3 | 4 | 4 | 3 | 3 | 5 | Good for efficient network services/workers; domain abstractions and delivery patterns require team discipline, and using it alongside React/TypeScript increases language diversity. |
| Hono as core backend | 3 | 4 | 3 | 5 | 3 | 4 | Useful lightweight web-standard framework across runtimes; less opinionated structure than NestJS for this many modules and roles. [Hono docs](https://hono.dev/docs). |

NestJS documents a Fastify adapter and database integrations including Drizzle, TypeORM, Prisma and others. The Fastify adapter may improve HTTP throughput but benchmarks should use the real middleware, serialization, auth and database workload, not framework headline numbers. [Nest performance/Fastify](https://docs.nestjs.com/techniques/performance), [Nest database overview](https://docs.nestjs.com/data/overview).

### 4.2 Why NestJS + Fastify

NestJS supplies modular composition, dependency injection, guards, request validation patterns, interceptors, testing support, API versioning and queue integration. Those conventions are valuable as Travelar's permissions, business workflows and adapters expand. Fastify is a host adapter to validate for efficient HTTP handling; performance is a hypothesis to benchmark, not a security or scale guarantee.

Use a **modular monolith** organized by domain modules:

- Identity mapping & access control
- Country/market configuration
- Organizations/operators/branches/agents
- Transport inventory (bus segments and ferry capacity)
- Supplier catalog and provider capabilities
- Search/offer normalization
- Booking orchestration
- Payments and refunds
- Ticketing/fulfilment
- Ledger/accounting/reconciliation
- Communications and delivery receipts
- Support/call-centre cases
- Audit, security events and administration

The API host and workers may run as separate processes/deployments from the same repository and modular codebase. Keep domain transactions in one PostgreSQL transaction where the invariant requires it. Extract a module as a separate service only after measuring an independent scaling, isolation, deployment, regulatory or failure-containment need.

### 4.3 Runtime and package management

- Use Node.js 24 LTS as the initial baseline on the research date; update only after compatibility and support review. Do not use Node.js Current as the automatic production choice.
- Use a single package manager/lockfile and a TypeScript monorepo only if shared packages and parallel apps justify it. Enforce dependency boundaries and do not share database/entity internals across frontend and backend.
- Use linting, type checks, dependency update automation, lockfile integrity, secret scanning, dependency/SBOM review and reproducible builds.
- Pin compatible runtime and major library versions; review security advisories and maintain a tested upgrade cadence.

## 5. Database access and schema change

**Candidate:** Drizzle ORM + `node-postgres`, migrations under version control, with carefully reviewed raw SQL for advanced PostgreSQL behavior.

Why Drizzle: SQL-like queries, TypeScript result inference, PostgreSQL driver support, transaction APIs, and a Nest-compatible integration are documented. [Drizzle + PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql), [transactions](https://orm.drizzle.team/docs/transactions), [Nest database overview](https://docs.nestjs.com/data/overview).

Critical paths must not be designed on assumptions about an ORM's abstraction. The proof of concept must demonstrate:

- `SELECT ... FOR UPDATE` or equivalent atomic claim semantics on inventory rows;
- unique/idempotency constraints and conditional updates;
- partial indexes, exclusion constraints, deferred constraints, and domain constraints where needed;
- multi-entry ledger posting in one transaction, with the debit/credit sum validated per currency/journal;
- migration generation and manual migration review, index build/rollback and expand-contract changes;
- serialization retry/deadlock handling; lock timeouts; connection pooling and graceful shutdown;
- test coverage for PostgreSQL 18 specifically, including correctness under concurrent bookings.

Use migrations as controlled change artifacts; never use application auto-sync to mutate production schema silently. PostgreSQL constraints and transactions—not only TypeScript validation—must enforce critical invariants.

## 6. Identity: self-hosted Keycloak preferred, not bespoke authentication

Use Documents 33 and 35 and ADR-AUTH-001 as the decision authority. Self-hosted Keycloak in a verified Tanzanian environment is the preferred proof-of-concept direction, not a production approval. Do not write bespoke password storage/session/token infrastructure for the first launch. Auth0 remains a contingency if its exact data processing is legally acceptable and a managed-service model proves materially preferable. OuterBlocks must fund an explicit Keycloak security and operations runbook.

Regardless of provider:

- Use OIDC/OAuth standards and keep an internal stable Travelar `user_id` separate from external `(issuer, subject)` identity.
- Use a server-side/BFF session with `Secure`, `HttpOnly`, correctly configured `SameSite` cookies for the browser where appropriate; native clients use Authorization Code + PKCE and platform-secure token storage.
- Validate API access tokens (signature, issuer, audience, time claims, allowed algorithm) and authorize every request from Travelar's current internal policy state.
- Keep role/tenant/branch/financial approval policy in the Travelar backend/database. Avoid trusting a client-provided role or stale token claim for critical decisions.
- Separate public passenger identity from privileged workforce/admin identity at an appropriate IdP/tenant/application boundary. Require strong MFA/passkeys and step-up authentication for HIMS, finance and privileged operations.
- Keep Keycloak/Auth0 migration feasible: provider-neutral identity mapping, token-validation strategy, export process and account recovery/migration plan documented.

## 7. Queues, caching and provider adapters

Start with PostgreSQL as the source of truth and a transactional outbox for events that must survive process failure. A worker can retry provider communications, reconcile PSP events, refresh external booking state and send notifications. Introduce Redis for rate limiting/cache or BullMQ for persistently queued tasks when load/testing shows it is justified. Redis/queue state is not the authoritative ledger or booking state.

Use adapter interfaces for GDS, rail, bus/ferry operators, PSPs, email, SMS, USSD, authentication/identity and fiscal systems. Keep each adapter's capability set explicit (e.g. price revalidation, ticket issuance, cancellation, refunds, webhook support, lookup, delivery receipt) rather than making unsupported operations appear universal.

Every external request should record a correlation ID, adapter/provider key, idempotency key when supported, request/response category, latency, attempt count and normalized outcome. Never store sensitive bearer tokens, full passenger manifests or payment secrets in logs.

## 8. Testing, operations and performance gates

Before technology lock, build a vertical slice that includes TanStack Start, OIDC login, NestJS Fastify API, PostgreSQL 18, Drizzle, one fake/test provider adapter and one authenticated transaction. The slice is a technical feasibility test, not a production booking release.

Acceptance tests must cover:

1. Login callback, logout, session revocation and direct API denial.
2. Tenant/branch scoping and privilege escalation tests.
3. One bus seat booked by concurrent overlapping segment requests—never two confirmed reservations.
4. Duplicate PSP webhook, delayed payment result, payment timeout and reconciliation.
5. Failed/out-of-order communication callback and duplicate suppression.
6. Ledger idempotency and balanced journal invariant.
7. Database restore into clean environment and tested recovery steps.
8. Load/error test using expected initial workload and a documented peak multiplier.
9. Deployment rollback and expand/contract migration rehearsal.
10. Provider outage with queue backlog monitoring and safe replay.

Set numeric SLO/latency/volume thresholds only after initial supplier and workload assumptions are measured and leadership approves them. Avoid claims that the stack by itself enables 100 million users.

## 9. Stack lock gates

Do not declare the stack frozen until:

- the engineering lead confirms team skill/hiring assumptions;
- PostgreSQL 18 is supported by the selected hosting target, driver and migration tooling;
- an actual Tanzanian/Kenyan data flow and backup/restore design has legal review;
- the Keycloak-first-vs-Auth0 contingency gate is reviewed with written location, operations and cost evidence;
- Drizzle + SQL proof covers critical transactional patterns;
- TanStack Start to NestJS API authentication/session pattern passes security testing;
- deployment platform and observability support backups, restore and emergency recovery;
- no architecture choice relies on unverified production supplier/API access.

## 10. Sources

- TanStack Start stable framework documentation: https://tanstack.com/start/latest/docs/framework/react/overview
- React guidance for creating an application: https://react.dev/learn/creating-a-react-app
- TanStack authentication and server boundary guidance: https://tanstack.com/start/latest/docs/framework/react/guide/authentication-overview
- NestJS performance/Fastify adapter: https://docs.nestjs.com/techniques/performance
- NestJS data integration options: https://docs.nestjs.com/data/overview
- NestJS queues: https://docs.nestjs.com/techniques/queues
- Drizzle PostgreSQL and transactions: https://orm.drizzle.team/docs/get-started-postgresql ; https://orm.drizzle.team/docs/transactions
- PostgreSQL version support: https://www.postgresql.org/support/versioning/
- PostgreSQL 18 release notes: https://www.postgresql.org/docs/18/release-18.html
- Node.js release policy: https://nodejs.org/en/about/previous-releases
- Supabase Postgres version guidance: https://supabase.com/docs/guides/database/postgres/which-version-of-postgres
- Auth0 tenant sub-region guidance: https://support.auth0.com/center/s/article/Tenant-Creation-in-a-Specific-Sub-region
- Keycloak OIDC overview: https://www.keycloak.org/securing-apps/overview
- Keycloak supported configurations: https://www.keycloak.org/server/supported-configurations
- Keycloak production configuration: https://www.keycloak.org/server/configuration-production
- Tanzania PDPA: https://oagmis.oag.go.tz/portal/acts/237
- Tanzania GN 449C of 2023: https://oagmis.oag.go.tz/portal/legislation/1350

---

**Status:** technology baseline recommended; provider, hosting region and final DB-access library remain conditional on documented proof gates. No production implementation has been authorized.
