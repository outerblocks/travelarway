---
name: implementation-with-evidence
description: Use after task scope and plan are approved to implement a bounded Travelar change and produce truthful verification evidence.
---
# Implement and verify

1. Work only within the approved scope on an isolated branch/worktree. Keep diffs narrow and avoid unrelated cleanup.
2. Implement business logic behind the approved domain boundary. Keep provider-specific behavior in adapters, not spread through the domain.
3. Add tests for acceptance criteria before or with implementation. Tests must assert business outcomes, not merely mock the behavior under test.
4. For database changes, include constraints, migration and compatibility review, data/lock/downtime assessment, backup/restore and rollback plan as applicable.
5. For inventory, test concurrent conflicting bookings, timeouts, holds, cancellation/release and unknown outcomes. For payments, test duplicate/out-of-order/replayed events, signature/verification failure, late success and reconciliation. For offline workflows, test conflicts and replay.
6. Run formatter, lint, typecheck, unit, integration, contract, E2E, security, build and performance tests applicable to the repo. First inspect package scripts and CI; never invent commands.
7. Capture actual command, exit status, commit hash, environment, provider mode (mock/sandbox/production) and output. Do not hide failures or imply a mock is a live integration.
8. Update docs, API contracts, ADR/requirements, runbooks, observability and unresolved questions. Provide a criterion-by-criterion reconciliation.
