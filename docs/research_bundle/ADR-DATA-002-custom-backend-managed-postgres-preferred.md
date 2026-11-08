# ADR-DATA-002 — Custom Travelar Backend, PostgreSQL Core, Managed Hosting Preferred

- **Status:** Recommended direction; hosting and legal gates remain open
- **Decision date:** 23 October 2026
- **Owner:** OuterBlocks Limited (decision owner to assign)
- **Supersedes:** Does not erase ADR-DATA-001; refines its hosting gate and backend recommendation

## Context

Travelar must coordinate regulated transport inventory, external GDS and local supplier workflows, several PSPs and communications providers, tenant-scoped operator functions, and double-entry financial events. Its critical workflows require trusted server-side orchestration, concurrency-safe transactions, provider-specific recovery and independent reconciliation.

Supabase is built on PostgreSQL and integrates Auth, PostgREST/generated APIs, Realtime, Storage and Functions. Managed Supabase reduces some operational burden, but supported data regions and service terms are constraints to verify. Its region documentation states that a selected region controls primary-data location, while region choice alone does not prove regulatory compliance. The region list reviewed on 23 October 2026 does not list Tanzania or Kenya as available project regions. Official sources: https://supabase.com/docs/guides/getting-started/architecture and https://supabase.com/docs/guides/platform/regions .

Supabase's self-hosting documentation says the customer becomes responsible for server provisioning, service configuration, security hardening, Postgres maintenance, availability, scalability, backups, disaster recovery, monitoring and uptime; several managed features are not included in self-hosting. Source: https://supabase.com/docs/guides/self-hosting .

## Decision

1. Travelar should own its domain/business backend, with TypeScript and NestJS as the current framework candidate pending team validation.
2. PostgreSQL is the proposed transactional source of truth for Travelar-owned bookings, inventory, payment records, accounting journals, operator configuration and audit references.
3. Prefer a **managed PostgreSQL service** if its exact data location, contract/subprocessor terms, security capabilities, backup/restore, recovery objectives, connectivity and total cost satisfy legal and operational requirements.
4. Do not choose fully self-managed PostgreSQL solely for a generalized sense of “ownership.” Select it only if verified residency/control requirements or demonstrated economics/operations justify staffing for it.
5. Supabase remains a candidate as a managed Postgres/auth/supporting-services platform if it passes the same hosting and security gates. Do not make generated Supabase Data APIs or Edge Functions the implicit owner of core booking, inventory, payment or ledger orchestration.
6. Critical commands go through the trusted Travelar backend. If Supabase Auth, RLS or other Supabase services are selected, treat them as explicit dependencies with tested policies, server-side authorization and migration/export procedures.
7. Keep domain logic and adapter contracts portable. Avoid database-specific coupling when unnecessary; document any PostgreSQL features used for correctness.

## Alternatives

| Alternative | Strength | Main risk/trade-off | Decision |
|---|---|---|---|
| Full Supabase-managed application pattern | Fast delivery; integrated Auth/API/storage; less ops | Risk that product business logic becomes spread across client-accessible APIs/functions; current region constraint; platform-specific conventions | Not default for critical orchestration |
| Custom backend + managed PostgreSQL | Business control with reduced DB operations burden; portability and clear transactional boundary | Still requires backend/security/ops skill; vendor and region must pass due diligence | Preferred |
| Custom backend + self-managed PostgreSQL | More direct control over data location and infrastructure | Highest operational burden: HA, patching, backups, restore, monitoring, incident response | Conditional fallback |
| Self-hosted Supabase | Integrated stack within controlled infrastructure | Operational burden remains; official docs state several managed features are absent; self-hosting is community-supported for the described setup | Not first choice without strong need |
| Multiple databases by default | Isolation/flexibility in theory | Complexity, replication and cross-system consistency costs | Avoid until proven requirement |

## Consequences

Positive: critical workflow logic lives in a controlled server-side codebase; one core transaction database supports booking and accounting invariants; adapters can be tested and replaced; infrastructure can change without rewriting the whole domain.

Negative: OuterBlocks must build and maintain API contracts, auth integration, background jobs, deployment pipelines, observability, migrations and integration recovery. Managed database vendor choice still creates operational dependencies. A single relational core requires careful connection pooling, partition/index management and load testing as demand grows.

## Mandatory gates before production choice

- Legal/privacy counsel confirms whether proposed data flows and the selected region satisfy the laws and permits that apply to Travelar's role and data types.
- Provider contract, subprocessors, support terms, encryption/key options, incident notification, export/deletion and disaster recovery reviewed.
- Backup restoration and recovery objectives tested; independent offsite backups considered according to risk.
- Representative load/concurrency tests completed for inventory, payment and ledger operations.
- Cost model includes database compute, storage, egress, backups/PITR, observability, support, engineering/on-call labour and failure/recovery overhead.
- Migration/export test demonstrated from a representative dataset.
- If Supabase is selected for Auth, validate role lifecycle, MFA for privileged access, tenant enforcement, account recovery and export/migration approach.

## Revisit triggers

Reopen this ADR if: a legally suitable managed region becomes available or a region requirement changes; a Tanzania/Kenya provider offers stronger contractual evidence; workload measurements justify a dedicated database topology; sovereign-hosting rules are clarified; managed platform outage/limits breach defined SLOs; or operating costs show a verified advantage for self-management.

## Approval

This is a research recommendation, not proof of legal compliance, a hosting contract, a final commercial choice or authorization to deploy production systems. Record final approver/date and the selected vendor/region before production use.
