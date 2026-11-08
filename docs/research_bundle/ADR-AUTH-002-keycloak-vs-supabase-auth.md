# ADR-AUTH-002 — Keycloak vs Self-Hosted Supabase Auth

- **Status:** Recommended direction; Keycloak preferred, conditional on POC and hosting/legal gates
- **Date:** 24 October 2026
- **Decision owner:** OuterBlocks Limited

## Decision

Continue with self-hosted Keycloak as the initial identity provider for Travelar. Use PostgreSQL 18.x for its dedicated database, subject to the supported configuration of the Keycloak version pinned at implementation time. Keep Supabase Auth/GoTrue as a documented alternative, not the baseline.

## Why

1. Keycloak's official production configuration list explicitly includes PostgreSQL 18.x.
2. Supabase's bundled self-hosted platform currently defaults to PostgreSQL 17. PostgreSQL 17 is still supported, so the version mismatch is not inherently a security issue; it adds a second major-version lifecycle and upgrade/compatibility decision to Travelar's own PG18 stack.
3. Supabase Auth can be run as a standalone API in principle, so use of Auth does not mathematically require deployment of all Supabase services. However, any standalone GoTrue + PostgreSQL 18 combination needs its own compatibility and operational validation; do not infer a supported recipe from the bundled PG17 deployment.
4. Travelar already plans a custom NestJS backend and does not currently need Supabase's generated data APIs/RLS product architecture. Keycloak provides a clean OIDC identity boundary across passenger, operator and workforce applications.
5. Both systems can be secure when competently configured and operated. Local hosting does not itself establish legal compliance or security.

## Consequences

- OuterBlocks must operate and patch Keycloak, its DB, TLS, backups, recovery and monitoring.
- Keycloak's database has a separate database name/role/credentials from Travelar core application data; consider a separate instance as risk/scale justify.
- Travelar remains authoritative for tenant/resource/business permissions.
- Legal/data-flow and local hosting conditions remain gates. NIDC and Wingu remain shortlisted but neither is selected.
- Do not implement custom password storage or authentication lifecycle from scratch.

## Conditions and revisit triggers

Proceed only after the Keycloak POC proves the required flows, database support, restore, failover, privileged MFA and authorization integration, and legal/hosting review accepts the actual data flows. Reconsider Supabase Auth only if it provides a concrete tested advantage and the chosen self-hosted deployment has a supported/validated PostgreSQL compatibility and update path.

## Evidence

- https://www.keycloak.org/server/supported-configurations
- https://www.keycloak.org/securing-apps/oidc-layers
- https://supabase.com/docs/guides/self-hosting/postgres-upgrade-17
- https://supabase.com/docs/reference/self-hosting-auth
- https://supabase.com/docs/guides/auth/architecture
- https://www.postgresql.org/support/versioning/
