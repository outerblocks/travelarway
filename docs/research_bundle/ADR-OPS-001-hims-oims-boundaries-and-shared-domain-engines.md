# ADR-OPS-001 — Distinct HIMS/OIMS Workspaces over Shared Domain Engines

**Date:** 24 October 2026 · **Status:** Proposed

## Context
Travelar needs distinct headquarters and operator workflows while avoiding duplicated pricing, payment, booking and inventory logic or cross-tenant data leakage.

## Decision

- Keep HIMS (OuterBlocks internal control plane) and OIMS (operator tenant workspace) as distinct products/experiences with separate capabilities, navigation, workflow queues and data projections.
- Initially implement them over a modular-monolith backend with explicit domain modules/shared services, PostgreSQL and background workers/outbox.
- Derive and verify tenant and actor scope server-side for every request. The UI, route path, operator-supplied organization ID or hidden field is not a security boundary.
- Reuse domain services for quotes/pricing, inventory, bookings, payments, ledger, notifications and workflow transitions. Channel-specific differences are explicit authorized policies, not duplicate calculations.
- HIMS is responsible for platform-level configuration, evidence/activation gates, providers, contracts, finance/control, compliance, support/security and audit. OIMS manages the operator's own people/branches/service catalog/trips/capacity/fares/manifest/shift and reports only within its agreement and permission scope.
- Agents, call centre and marshal tools are scoped specialized workspaces, not cloned HIMS/OIMS admins.
- Extract services only where evidence proves operational isolation, scale, compliance or team benefits.

## Consequences

No forced microservices/Kubernetes/workflow engine requirement in the first version. Modules require explicit interfaces and ownership to preserve extraction options. HIMS privileges do not imply permission to move money or view all passenger identity information. OIMS must not alter Travelar-wide configuration or see another operator's data.

## Acceptance
Required negative tests include HQ vs operator boundaries, operator A vs B, branch, trip, field-level sensitive data, read vs approve vs execute, and revoked/expired access. Documents 48–50 define module catalogue, workflow journeys and evidence requirements.
