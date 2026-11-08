# Travelar PostgreSQL Connection, Test and Docker Guidance

**Status:** Engineering policy addendum  
**Date:** 28 October 2026

## An IDE connection is not an application deployment

A database explorer or IDE plugin can query PostgreSQL from the developer's workstation. The deployed NestJS backend has its own network route, credentials, TLS configuration, environment variables, connection pool and runtime role. An IDE connection by itself proves none of those are configured.

The IDE agent must separately verify:

1. IDE client → correct development database.
2. Backend process → correct development database using a restricted application credential.
3. Migration command → correct development database using a separate migration credential where practical.
4. Automated tests → isolated, disposable or explicitly dedicated test database.
5. Deployment process → selected target, health checks, migration sequencing and rollback/forward-fix.

Do not copy IDE administrator credentials into application `.env`, CI or frontend variables.

## Remote connection requirements

- Use the private network, VPN or hosting provider's recommended secure route where available; restrict inbound sources. Do not open PostgreSQL to arbitrary internet sources.
- Require TLS encryption for remote connections. Prefer certificate and hostname validation when supported (e.g. libpq `sslmode=verify-full`, with the correct CA/hostname settings); do not blindly set `sslmode=require` and assume server identity has been validated.
- Use separate credentials/roles for IDE read-only inspection, schema migrations, the application runtime and test teardown when feasible.
- The application role must not be a superuser and should not own the database. Restrict schema/table/sequence privileges and execute privileges to those needed.
- Keep credentials in an approved secret manager or untracked local environment variables. Verify ignore rules and secret scanning. Redact connection strings in logs and evidence.
- Never expose live customer or payment data in screenshots, prompts, test fixtures, logs or generated reports.
- Before write operations, positively identify the database/host, environment marker, role and scope. If unclear, stop writes.

Official PostgreSQL TLS documentation: https://www.postgresql.org/docs/18/ssl-tcp.html
Official PostgreSQL connection parameters: https://www.postgresql.org/docs/18/libpq-connect.html

## Direct connected server vs Docker

Docker is not mandatory simply because Travelar uses PostgreSQL. A safely provisioned development database can be accessed directly, and the application can connect to it without Docker. But the development database should not also be the target that automated test cleanup can destroy.

| Situation | Preferred approach |
|---|---|
| Read-only schema/version inspection | IDE connection with a restricted role; no Docker required |
| Manual development/integration testing | Dedicated development database, if its data is safe and separate from production |
| Migration verification from a blank state | Disposable database, local instance or container; never reset a shared database |
| CI reproducibility across machines | Pin PostgreSQL major/minor image or use a provisioned isolated test service; Docker is one practical option, not the only one |
| Concurrency tests that need cleanup/repetition | Dedicated disposable test database with controlled privileges |
| Production deployment | A managed/operated database and controlled deployment pipeline; a development IDE connection is not the deployment plan |
| Docker not available | Use a separately provisioned disposable test database or isolated schema/database with rigorously constrained permissions and cleanup |

## Minimum verification gates before migration

- Working tree and base commit recorded.
- Target database positively identified and confirmed non-production.
- Schema and migration history inventoried; no blind baseline migration over existing objects.
- Backup/snapshot and restore route verified where existing data matters.
- Migration reviewed for locks, table rewrites, index build behavior, data backfill duration, compatibility with current application code and failure recovery.
- Migration tested against a freshly created database and a representative copy or safe staging environment.
- Post-migration verification query and rollback/forward-fix plan written.
- No destructive operations executed on production without explicit human approval.

## Runtime, migration and test configuration

Use separate environment variables with placeholders, for example:

```dotenv
# Backend runtime. Must be restricted; never put in browser-exposed VITE_* variables.
DATABASE_URL=postgresql://travelar_app:REDACTED@db-host.example:5432/travelar_dev?sslmode=verify-full

# Schema migrations; credentials and privileges separated from runtime where practical.
MIGRATION_DATABASE_URL=postgresql://travelar_migrator:REDACTED@db-host.example:5432/travelar_dev?sslmode=verify-full

# Dedicated automated test database. Must never point to production.
TEST_DATABASE_URL=postgresql://travelar_test:REDACTED@db-test.example:5432/travelar_test?sslmode=verify-full
```

These are examples only. Confirm the host, certificate parameters, URL encoding, privilege setup and environment before use. Do not commit real `.env` files or populate secrets into these examples.

Do not permit a test runner with reset/drop privileges to run until it checks an explicit test environment marker and database name. The test runner should fail closed when the target is unknown or does not match the approved test target.

## Docker decision test

Adopt Docker/Compose only if it materially improves one or more measured requirements: consistent local/CI PostgreSQL version, disposable test state, reproducible dependencies, team onboarding, or integration testing with dependent services. If adopted, pin the PostgreSQL image tag, use health checks, persist only intended development data, keep secrets outside the image, avoid exposing ports beyond localhost without need, and never use the development compose profile as production deployment by default.

Do not add Kubernetes, Kafka or additional infrastructure solely because a common template includes them. Choose infrastructure from explicit requirements and operational capacity.
