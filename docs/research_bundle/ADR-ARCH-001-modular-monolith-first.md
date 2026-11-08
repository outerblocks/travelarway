# ADR-ARCH-001 — Modular Monolith First

- **Status:** Proposed for approval after engineering-capacity review
- **Date:** 23 October 2026
- **Owner:** OuterBlocks Limited / Travelar product and engineering leadership

## Context
Travelar includes six booking modes, enterprise operator/headquarters systems, multiple provider adapters, inventory allocation, payment orchestration, accounting, regulatory connectors, mobile/offline channels and multi-country privacy obligations. Launch volume, team size, authorized supplier routes and hosting requirements are not fully verified. Starting with dozens of microservices would increase operational burden before independent scaling or team ownership is demonstrated.

## Decision
Start from a modular monolith with clear domain modules, a shared PostgreSQL transactional core where atomicity is required, and durable background workers for external calls and asynchronous work. Provider integrations use interfaces and adapter implementations. A module may later be extracted based on measured workload or risk isolation needs.

## Alternatives
1. Microservices from day one — rejected for launch absent evidence of independent teams/deployments/scaling need.
2. Client-side BaaS direct access to most tables — rejected for money, inventory, authorization, ticketing and accounting workflows.
3. Entirely serverless functions — not ruled out for suitable peripheral jobs, but not the default for transaction orchestration until failure/state management and workload fit are demonstrated.

## Consequences and guardrails
- Module-owned writes; no arbitrary cross-module table mutations.
- Outbox for external side effects; idempotent workers and provider-state reconciliation.
- Transaction boundaries documented for inventory, bookings, ledger and payment state.
- Dependency tests and code ownership must keep modules separable.
- Deployment remains one/few artifacts initially; this is not an instruction to create dozens of services.

## Reconsider when
A module needs independent scaling/deploy cadence, requires stricter isolation, has a separate responsible team, or a measured reliability/latency constraint cannot be met within the monolith. Any extraction requires an ADR for data ownership, network authorization, retry semantics and migration/rollback.

## Acceptance evidence
An architecture spike demonstrates module boundaries, inventory concurrency invariants, payment/provider adapter isolation, migration/rollback and observability. Final approval waits for the hosting/data-transfer gate and launch supplier route.
