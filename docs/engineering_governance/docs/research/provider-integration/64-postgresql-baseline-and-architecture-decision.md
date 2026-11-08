# Travelar ADR-064 — PostgreSQL as the Primary Database

**Status:** Accepted baseline; deployment-specific verification required  
**Decision date:** 28 October 2026  
**Scope:** Travelar public platform, backend services, OIMS, HIMS, agent channels and shared business engines

## Decision

Use community PostgreSQL as Travelar's primary transactional database. Target the PostgreSQL 18 major line; the official PostgreSQL versioning page listed 18.6 as the current minor release on 28 October 2026. At deployment time, re-check the current supported minor release and use an appropriate supported patch version. Do not upgrade an existing connected server automatically just to match this target.

Continue with the existing provisional application choices unless repository audit or an approved ADR proves a change is needed:

- React + TanStack Start frontend, preserving useful existing implementation.
- NestJS + TypeScript/Fastify backend.
- PostgreSQL as the authoritative relational store.
- Drizzle ORM with `node-postgres` provisionally, after checking the repository's actual dependencies and conventions.
- Modular monolith first, with an outbox and separately run workers where needed.
- Redis may be used for coordination, caching or rate limiting, but not as the authoritative source of inventory or financial truth.

This is a database-engine choice, not a decision to rebuild the frontend, install a new server, or deploy to production.

## Why

1. PostgreSQL provides transactions, constraints, unique indexes, locking and row-level security primitives that can support Travelar's booking, inventory, finance and tenant-isolation requirements when correctly designed and tested.
2. Community PostgreSQL avoids committing to an EDB-specific distribution before a concrete EDB feature or support requirement has been demonstrated.
3. A separately purchased support arrangement remains possible without making an EDB database distribution a prerequisite.
4. A PostgreSQL-based architecture preserves flexibility for Tanzania-first delivery and subsequent markets, as long as regulatory, provider, security and data-residency requirements are separately validated.

## Evidence and caveats

The PostgreSQL project states that each major version receives support for five years, recommends current minor releases, and explains that minor upgrades differ materially from major upgrades. Official version policy: https://www.postgresql.org/support/versioning/

PostgreSQL has native TLS support for client/server communications. Official documentation: https://www.postgresql.org/docs/18/ssl-tcp.html

PostgreSQL constraints and unique constraints can enforce data invariants at the database boundary. Official documentation: https://www.postgresql.org/docs/18/ddl-constraints.html

These facts do not establish that a particular connected server is PostgreSQL 18, configured securely, reachable from a deployment environment, backed up, or fit for production. The IDE agent must inspect and record the actual environment before making changes.

## Non-goals

- No EDB installation or migration unless a requirement and cost/benefit record support it.
- No forced major-version upgrade of the currently connected server.
- No claim that database selection alone guarantees correctness, security, performance, compliance or high availability.
- No direct database connection from a browser or public frontend.
- No production schema change or deployment by default.

## Required design constraints

- PostgreSQL is authoritative for booking, seat/capacity inventory, payment records, ledger entries, configuration versions and audit history.
- Enforce critical invariants in the database (constraints, foreign keys, unique keys, transactions and appropriate locks) as well as at the application layer.
- All six Travelar modes (Bus, Ferry, Flights, Stays, Train, Experiences) remain first-class in domain modelling. Initial activation and external integration may be staged without making the product model bus-only.
- Use data-driven, versioned and audited configuration for markets, modes, operators, routes, schedules, fares, fees, commission/markup, payment methods, booking rules, fields and workflows. Historical transactions must retain applicable snapshots.
- Financial entries are append-only; corrections use approved reversals/adjustments, not silent rewrites.
- Apply tenant, branch and role boundaries in the API and database where appropriate. Row-level security supplements but does not replace application authorization.
- Keep Keycloak's identity database separate from Travelar application data if Keycloak is selected after its proof of concept.
- Establish migrations, backup/restore evidence, observability, recovery objectives and rollback plans before production readiness.

## Acceptance criteria

- Actual server version, target environment, database name, extensions, connectivity method and privilege model are recorded without exposing secrets.
- The repository contains version-controlled, reviewable schema migrations using the ORM/migration conventions confirmed by audit.
- A fresh isolated database can be created from migrations and deterministic seed data.
- Integration tests prove key uniqueness, constraints, tenant boundaries, transaction rollback and concurrency invariants.
- Backup and restoration are tested before the database is classified production-ready.
- A deployment plan identifies exactly which connection string and role run migrations and which role the application uses.
- A rollback/recovery plan explains which migrations are reversible and which require forward-fix or restore.

## Revisit if

- The hosting or regulator requires a database capability not reasonably met with community PostgreSQL.
- A documented requirement for database-native TDE, Oracle compatibility or a specific enterprise replication/support feature is established.
- A measured workload benchmark or binding support contract demonstrates that another distribution materially satisfies requirements better.

Any revisit requires a comparative ADR and migration/cost/security assessment; marketing descriptions alone are insufficient.
