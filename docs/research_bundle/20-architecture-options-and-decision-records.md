# 20 — Architecture Options and Decision Records

**Product:** Travelar | **Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required) | **Status:** Proposed recommendations, conditional on evidence gates | **As of:** 24 October 2026

## 1. Decision summary

| Decision area | Recommended starting point | Status | Revisit trigger |
|---|---|---|---|
| Application shape | Modular monolith with explicit domain modules; async workers separated as deployable process if useful | Recommended | Independent scaling, separate team ownership, release/risk isolation or regulatory boundary requires extraction. |
| Primary data | PostgreSQL relational system of record | Strong recommendation | Workload benchmarks reveal a specific fit gap. |
| Backend | NestJS + TypeScript, using Fastify adapter subject to proof-of-concept | Recommended baseline | Revisit after team-skill review and representative API benchmark. |
| Inventory concurrency | Database transactions, constraints and row locking/conditional updates; cache is not the source of truth | Required invariant | Never relaxed for performance. |
| GDS, PSP and communications | Provider-neutral adapters and capability registry | Owner-confirmed direction | None; provider instances/coverage can change. |
| Queue | PostgreSQL outbox plus a managed durable queue or a small worker system initially | Provisional | Volume, lag, ordering or availability requirements justify a dedicated broker. |
| Redis | Optional for cache/rate-limit/ephemeral coordination; no sole record of confirmed inventory or money | Conditional | Measured latency, rate limits or workload justify it. |
| Kubernetes | Do not begin with Kubernetes absent a demonstrated operational need | Recommended restraint | Multiple services/teams and deployment requirements justify orchestration. |
| Hosting and database region | Choose only after legal transfer analysis and written provider evidence | Open decision | PDPC/ODPC/counsel advice and vendor contracts clear a specific deployment. |
| Supabase | Not selected as the platform; direct PostgreSQL + custom backend is the confirmed direction. Supabase is not required for the stack. | Decision recorded | Reopen only if the product owner explicitly reverses this preference. |

## 2. Architecture shape: modular monolith versus microservices

### Option A — modular monolith

**Advantages:** simpler local development and deployment; one transaction can protect booking/inventory/financial invariants where appropriate; lower initial operational overhead; fewer network failure modes; easier end-to-end testing for a small team.

**Costs/risks:** needs disciplined module boundaries; some components share release cycles and database operations; future scaling requires planned extraction rather than assuming every module is independent.

**Fit for Travelar:** preferred for initial launch because product scope is wide while supplier access, operating volumes and team size are not yet verified. Keep provider calls and notifications in background workers and keep adapter interfaces stable.

### Option B — microservices from day one

**Advantages:** independent deployment and scaling; stronger runtime isolation for selected services; teams can own domains independently.

**Costs/risks:** distributed transactions, duplicated telemetry/identity/configuration, more service-to-service authentication, more complex deployments, network failures and difficult end-to-end recovery. It does not automatically create tenant isolation or regulatory compliance.

**Fit:** not justified until measurable domain needs appear. Do not infer that 100 million registered users automatically requires microservices; registered-user count alone does not define throughput.

### Option C — managed backend/BaaS-first

Can accelerate identity, storage, database provisioning and standard CRUD. Risk emerges when provider-specific transaction orchestration, accounting, regulatory connectors, tenant authorization and fine-grained business workflows are pushed into client-side access or an opaque vendor layer.

**Fit:** selected managed components may be useful. Core inventory allocation, price calculation, payment verification, journal posting, refunds, role changes and supplier orchestration must run through a server-controlled domain boundary.

## 3. Proposed technology baseline

| Concern | Candidate | Rationale and conditions |
|---|---|---|
| Language/backend | TypeScript + NestJS or a comparable typed server framework | Shared TypeScript types can help web/API integration; architecture and security discipline are more important than framework. Validate team expertise. |
| Database | Supported PostgreSQL release, managed or self-operated | Transactions, relational integrity, indexing, row locking and accounting data fit core needs. Choose currently supported release after hosting/platform compatibility assessment. |
| DB access | Typed data layer/query builder or ORM with visible SQL and migration discipline | Must support explicit locks, constraints, isolation and ledger-safe transactions. Critical SQL should be code reviewed. |
| Cache | Redis only for measured ephemeral workloads | Cache must not be authority for price, seat inventory, payment state or ledger. |
| Async | Transactional outbox + durable job queue; broker chosen by measured need | Retry, dedupe, dead-letter handling and replay are required. Queue ordering assumptions must be explicit. |
| Objects | S3-compatible object storage with lifecycle, encryption and region evidence | Store PDFs/receipts/support files only as needed; protect manifests and ID documents. |
| Search | PostgreSQL search/geospatial initially where adequate; dedicated search only after measurement | Catalog search is distinct from current inventory truth. PostGIS can support route/nearby-location queries where useful. |
| Web | Responsive web app / PWA first, native/cross-platform app after user research | Offline ticketing and QR verification require separate device/security design. |
| Infrastructure | Containerized services, CI/CD, infrastructure as code, secrets store | Avoid a platform choice that cannot meet data location and operational skills. |
| Observability | OpenTelemetry-compatible instrumentation plus selected metrics/logs/traces backend | Preserve ability to change monitoring backend; minimize personal/financial content in telemetry. |

## 4.1 Confirmed stack direction (24 October 2026)

The current baseline is React + TanStack Start for web, a separate NestJS + TypeScript API on Fastify, and PostgreSQL 18.x as the domain database. Supabase is not the selected platform. Use Drizzle + node-postgres provisionally, with reviewed SQL for critical inventory/ledger transactions. Node.js 24 LTS is the runtime candidate on the research date. The baseline and proof requirements are recorded in `ADR-STACK-001-tanstack-start-nestjs-fastify-postgres18.md`.

Authentication should be supplied by a standards-based identity provider, with self-hosted Keycloak in verified Tanzania hosting as the preferred direction subject to legal-location, hosting, staffing and recovery checks; Auth0 is a contingency. Do not build authentication from scratch for launch. See `33-authentication-provider-and-identity-architecture.md` and `ADR-AUTH-001-keycloak-first-local-identity.md`.

## 4. Supabase comparison

Supabase bundles PostgreSQL, Auth, Storage, Realtime and related platform functionality. Its published May 2026 note identifies PostgreSQL 17 as the platform default at that time, while individual projects can differ; Travelar has selected a direct PostgreSQL 18.x baseline and must verify the actual server version in any test environment. Its managed service reduces some database/identity maintenance but creates provider and region constraints that require review. Published managed-project region choices are listed at [Supabase regions](https://supabase.com/docs/guides/platform/regions); the list reviewed on 23 October 2026 does not show an African region. The selected region controls primary project data location, but project region alone does not prove compliance for backups, logs, subprocessors, support access or external integrations.

### Managed Supabase

**Pros:** managed Postgres operations; integrated auth/storage/realtime; managed daily backups on paid plans and optional PITR depending on plan/configuration; faster initial setup.

**Cons:** region list may not meet a local-data requirement if one applies; plan limits/cost and platform-specific behavior; data transfer and support/subprocessor questions; requires careful RLS and key management; managed service is not a substitute for application-layer authorization.

### Self-hosted Supabase

**Pros:** greater choice of physical location/infrastructure; more direct infrastructure control; can keep a deployment within a selected national facility if vendor/network/legal terms support it.

**Cons:** Supabase says self-hosters are responsible for server provisioning, maintenance, security hardening, OS/service updates, Postgres maintenance, HA, backups, DR, monitoring and uptime; some managed features are unavailable. Local hosting only shifts responsibility; it does not solve staffing or disaster-recovery design.

### Custom backend + PostgreSQL + selected identity service

**Pros:** clear application boundary; explicit transaction patterns, authorization and integrations; flexibility to deploy app and data in separate legally reviewed locations; less dependence on BaaS-specific client access semantics.

**Cons:** OuterBlocks must manage application security, identity integration, database operation, migration/backups, observability and incident response or contract competent vendors to do so.

### Hybrid

Recommended evaluation route: custom domain backend; PostgreSQL as the source of truth; managed identity, mail, object storage or database services only where their data-processing terms, regions and integration capabilities pass due diligence. Do not expose sensitive transactional tables for unrestricted client-side CRUD. Supabase can still be an option for managed Postgres/auth if region and legal gates are cleared.

## 5. Proposed ADRs

### ADR-ARCH-001 — Modular monolith first

- **Decision:** begin with a modular monolith and separately runnable background workers as needed.
- **Context:** six modes and enterprise modules create broad scope; actual user load and staffing are unknown.
- **Alternatives:** microservices, BaaS-first client CRUD, serverless-only.
- **Why:** lowest avoidable operational complexity while protecting transactional rules and keeping extraction possible.
- **Guardrails:** module ownership; no arbitrary cross-module writes; outbox for async external work; external adapters; automated dependency checks; release/rollback discipline.
- **Status:** recommended, subject to engineering capacity review.

### ADR-DATA-001 — PostgreSQL transactional core; hosting undecided

- **Decision:** use PostgreSQL relational invariants for bookings, holds, seat/segment claims, payments and ledger; do not make cache/queue/provider API the sole source of truth for internal records.
- **Alternatives:** document database primary, BaaS direct table access, per-mode databases.
- **Why:** relationships and financial integrity require constraints/transactions; a shared transactional core simplifies initial correctness.
- **Status:** domain decision recommended; deployment location/platform remains open pending local counsel/provider RFIs.

### ADR-PLATFORM-001 — Supabase is an evaluated component, not an assumption

- **Decision:** do not commit to managed Supabase as production primary storage until country data flows, regions, backup locations, subprocessors, support access, plan/cost and exit route are verified.
- **Use permitted during assessment:** prototypes and non-sensitive environments; no real passenger or financial records until approvals and safeguards are in place.
- **Self-hosting:** acceptable only with funded operating ownership and demonstrated DR.

### ADR-ADAPTER-001 — Provider-neutral integrations

GDS, local suppliers, PSPs, email/SMS and other providers use explicit adapters. Use capability-based routing and provider-specific state models. Keep provider credentials server-side and preserve external references and raw evidence safely.

## 6. Vendor and stack evaluation scorecard

Score candidates 1–5 with evidence, not vendor reputation alone:

| Criterion | Weight (suggested) |
|---|---:|
| Legal/data-location fit and subprocessor transparency | 20% |
| Booking/payment transaction and consistency requirements | 20% |
| Security, IAM, audit and incident-response capability | 15% |
| Backup/restore/DR and support commitments | 15% |
| Integration/function compatibility | 10% |
| Total cost including staff/ops and data egress | 10% |
| Migration/export and vendor exit | 5% |
| Team capability and maintainability | 5% |

Weights are a starting proposal and should be changed only with recorded reasoning. Unknown is not scored as 5; missing evidence becomes a diligence task.

## 7. Decision gates before production

- Counsel writes country-specific data-flow position.
- Host confirms exact primary, backup, log and DR locations in contract.
- Restore rehearsal passes with measured RPO/RTO.
- Load and concurrency tests pass against realistic departure inventory.
- Secrets, privileged access, tenant isolation and audit tests pass.
- Cost model includes database, storage, egress, logs, backup retention, on-call and security work.
- Exit process tested: schema/data export, identity migration assumptions, object files, audit evidence and provider credential rotation.

## 8. Sources

- Supabase regions: https://supabase.com/docs/guides/platform/regions
- Supabase self-hosting and responsibilities: https://supabase.com/docs/guides/self-hosting
- Supabase backups/PITR: https://supabase.com/docs/guides/platform/backups
- PostgreSQL 18 explicit locking: https://www.postgresql.org/docs/18/explicit-locking.html
- OpenTelemetry: https://opentelemetry.io/docs/


### Current stack references (24 October 2026)
- TanStack Start stable overview: https://tanstack.com/start/latest/docs/framework/react/overview
- NestJS Fastify adapter: https://docs.nestjs.com/techniques/performance
- Nest database options: https://docs.nestjs.com/data/overview
- PostgreSQL 18 support: https://www.postgresql.org/support/versioning/
- Supabase current version guidance: https://supabase.com/docs/guides/database/postgres/which-version-of-postgres
