# Travelar Engineering Execution Pack — Stage 23

Date: 28 October 2026

Stage 23 records the PostgreSQL decision and the owner's clarified execution approach: the visible app is an incomplete frontend, and the IDE engineering agent must audit and remediate the real repository before implementing the requirements pack across frontend, backend and database. A PostgreSQL IDE connection is available but its target, privileges and safe use must be verified.

## Contents

- `64-postgresql-baseline-and-architecture-decision.md` — accepted PostgreSQL baseline and architecture constraints.
- `65-ide-agent-repository-audit-and-implementation-directive.md` — repository-first full-stack execution workflow.
- `66-postgresql-connection-and-docker-guidance.md` — direct database connection, security, environment and Docker decision rules.

## How to apply

1. Copy these three documents into the Travelar repository's source-of-truth documentation folder, preserving file names or updating cross-references consistently.
2. Add the short implementation directive from Document 65 to the task prompt for Cursor or Antigravity and ensure the repository's existing `AGENTS.md` and applicable skills are loaded.
3. Do not overwrite the actual repository's `AGENTS.md` blindly. Merge compatible rules; resolve contradictions explicitly.
4. The agent's first task is repository and database environment audit, not wholesale regeneration or a production deployment.
5. Record the actual PostgreSQL server version and environment. Do not force an upgrade merely because PostgreSQL 18.6 is the current target baseline.

## Engineering caution

An IDE database connection can support investigation and development. It does not prove backend runtime connectivity, safe privileges, production readiness, or application deployment. Use isolated test data, least privilege, TLS, versioned migrations, backup/restore validation and explicit production change controls.
