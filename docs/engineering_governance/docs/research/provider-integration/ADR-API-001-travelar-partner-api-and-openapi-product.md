# ADR-API-001 — Travelar-Owned Partner API and OpenAPI Contract

- **Status:** Proposed target decision for review/acceptance
- **Date:** 28 October 2026
- **Context:** Operators, agents, white-label storefronts and enterprise partners need APIs, documentation and credential management.

## Decision

Expose a versioned Travelar-owned HTTP API based on stable Travelar domain resources and capabilities. Keep supplier/GDS/PSP APIs behind internal adapters. Generate and validate an OpenAPI document from actual NestJS routes/DTOs (or the repository's verified equivalent), publish a scoped developer portal, and use partner/tenant-specific machine credentials, least-privilege scopes, usage metering and webhook contracts.

OpenAPI version should be selected based on verified compatibility with the chosen tooling and partner ecosystem; do not adopt the latest spec version without validating generators, validators and clients. HIMS/control-plane operations stay private and separate from partner APIs.

## Consequences

- Partner integration contracts remain stable while the backend may change provider adapters.
- Access, quotas, usage and commercial terms can be governed per partner, market, mode and product.
- API documentation and examples become version-controlled testable deliverables.
- Production exposure is approval-gated and based on actual implementation/contract evidence, not on a designed endpoint list.

## Required controls

Tenant/object authorization, OAuth2/client-credential or appropriately secured machine credentials, scopes, credential rotation/revocation, request validation, idempotency, rate limits, safe errors, signed webhooks, replay protection, version/deprecation policy, privacy review, contract tests and API usage reconciliation.
