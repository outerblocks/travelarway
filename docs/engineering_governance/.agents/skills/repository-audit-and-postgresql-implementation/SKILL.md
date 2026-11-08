# Repository Audit and PostgreSQL Implementation Skill

## Required reading
Before a substantial Travelar code change, read `AGENTS.md`, `docs/engineering/implementation-directive.md`, `docs/engineering/decisions/ADR-064-postgresql-baseline.md`, `docs/engineering/postgresql-connection-and-docker.md`, and the relevant Travelar requirements, ADRs, addenda, acceptance tests and unresolved questions. Resolve paths if the workspace layout differs.

## Procedure
1. Record branch, base commit, working tree, existing changes, package manager/scripts and actual runtime versions.
2. Map requirements to source files, tests, migrations, backend routes, database objects and deployment config. Distinguish present, partial, absent and unknown.
3. Read-only inspect the connected PostgreSQL target first. Record sanitized version/environment/role/connectivity evidence. Never print credentials or customer data.
4. If environment identity is unclear or the target cannot be positively verified as development or a purpose-built test database, do not write to it.
5. Produce a prioritized gap matrix and dependency-ordered plan. Preserve useful existing code; do not regenerate the application wholesale.
6. Implement one bounded change at a time, including required frontend/backend/database work. Keep schemas and migrations version-controlled.
7. Use least privilege, TLS for remote DB connections, separate runtime/migration/test credentials where feasible, and a disposable or isolated test database for destructive test operations.
8. Do not require Docker by default. Recommend it only when reproducibility, disposable state, pinned dependencies, CI or required services justify it. Use an equivalent isolated test database if Docker is unavailable.
9. Test actual code and database behavior. Report exact commands, exit status, environment, evidence paths and all skipped/failed tests.
10. Review authorization, tenant isolation, concurrency, idempotency, migration impact/rollback, recovery, observability and documentation before acceptance.
11. No production writes/migrations/deploys, live payments/refunds, provider activation, security/permission changes or destructive DB operations without explicit human approval.
12. Update requirement-to-evidence and unresolved-decision registers after each task.

## Completion standard
A UI or test that only mocks APIs is not evidence that backend/database behavior is implemented. A PostgreSQL IDE connection is not evidence that the deployed backend has valid runtime access. Do not label a task `tested`, `verified in sandbox` or `verified in production` without execution evidence from that environment.
