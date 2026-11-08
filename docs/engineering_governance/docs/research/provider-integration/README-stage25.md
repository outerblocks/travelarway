# Travelar Research Bundle — Stage 25

**Research cut-off:** 28 October 2026  
**Product:** Travelar  
**Parent:** OuterBlocks Limited  
**Intended operating entity:** OuterBlocks Destinations Limited; corporate relationship, registration, contracting authority and IP ownership require documentary verification.

## What's new

Stage 25 expands Stage 24's integration pack into a specific end-to-end operating-system specification for data-driven operator operations, trip scheduling, seat maps/inventory, staff and permissions, HIMS automation, and Travelar's own partner API product.

New documents:
- `76-operator-routes-recurring-schedules-and-trip-publication.md` — route, stop, route version, recurrence rule, dated trip generation, next-month scheduling, publication and search-card source data.
- `77-fleet-seatmaps-and-segment-based-inventory.md` — structured versioned seat maps, vehicle assignment, bus segment inventory, ferry capacity and concurrency correctness.
- `78-operator-organizations-staff-invitations-and-authorization.md` — organization/branch membership, invitations, role templates, scoped capabilities, MFA, approvals and tenant isolation.
- `79-data-driven-platform-runtime-search-result-cards-and-policy-rendering.md` — safe runtime configuration, forms, cards, booking data provenance, confirmations and terms snapshots.
- `80-hims-automation-payouts-audit-logs-and-security-operations.md` — payout eligibility and automation, ledger reconciliation, HIMS queues, security operations, audit and logging.
- `81-travelar-public-partner-api-product-and-developer-portal.md` — Travelar-owned APIs for operators/agents/partners, OpenAPI generation, developer portal, credentials, scopes, webhooks and commercialization.
- `82-platform-wide-data-driven-acceptance-matrix-and-build-order.md` — testable platform-wide acceptance criteria and dependency-ordered implementation sequence.
- `83-travelar-api-contract-examples-and-openapi-starter.md` — illustrative API contracts, request/response/error examples, OpenAPI generation workflow and sample resource catalog.
- `ADR-OIMS-002-route-schedule-trip-and-inventory-separation.md` — proposed architecture decision.
- `ADR-API-001-travelar-partner-api-and-openapi-product.md` — proposed API-product architecture decision.
- `sources-and-evidence-register-stage25.md` — official provider, platform and security sources reviewed in this stage.

## Decisions clarified

1. **Operator data entry is a real workflow.** Operators create and version routes, choose ordered stops, define recurrence, preview actual future occurrences, generate/publish trip instances and assign current fleet/assets. This supports explicit scheduling through the end of next month and a configurable rolling future horizon.
2. **A route is not a trip.** Route definition, route version, schedule rule, concrete trip occurrence and seat/capacity allocation are separate domain records.
3. **Search results are sourced.** Cards use the actual published trip, route/stop order, vehicle, amenities, fare resolution, segment availability and timestamps. Plate number is displayed only when the real assigned vehicle and policy permit it.
4. **Seat maps are structured inventory.** A layout has versioned seats/components; bus seat claims use ordered route segments; ferry capacity and supplier-controlled inventory remain distinct strategies.
5. **Every platform-facing dynamic value is backed by authorized data.** Typed, approved configuration can choose fields/labels/sections; it cannot execute arbitrary scripts or replace security invariants.
6. **Staff access is tenant- and resource-scoped.** Invitation, roles, branch/trip scope, MFA, grants/revocations and maker-checker approvals are real backend workflows with audit.
7. **Automated payout is governed.** Durable idempotent intents, eligibility checks, verified beneficiary, approvals, provider rate limits, status follow-up and reconciliation are required. An accepted payout is not necessarily settled.
8. **Audit, logs and ledger are distinct.** All are required, protected and correlated, but serve different purposes. Secrets and unnecessary personal data are redacted.
9. **Partner APIs are Travelar-owned.** The developer product uses stable Travelar resources and OpenAPI generated from actual implemented routes; it does not mirror raw GDS/PSP APIs. API monetization is proposal-only until approved in contracts and lawful pricing.
10. **No false completion.** Research documents are requirements and evidence; the IDE agent must inspect and test the actual repository. No provider authorization, production deployment, or live transaction is implied.

## Build direction

Start with source-of-truth audit, actual PostgreSQL schema/migrations, identities/tenant authorization and master data. Then routes/schedules/trips, fleet/seat inventory, fares/search, staff/roles, booking/payment/ledger, payout/reconciliation, HIMS, public partner APIs/docs and deployment/reliability gates. Change the order only after recording actual dependency evidence.

## Evidence and safety

See `sources-and-evidence-register-stage25.md`. Current supplier docs describe capabilities, but API access, contract rates, marketplace rights, production entitlements, payment/funds-flow compliance and regulatory approval still require independent confirmation. ClickPesa has provider-specific rate limits and asynchronous payout states; implementation must check the current official docs and account contract.

**Status: research/engineering requirements only.** The repository source code and connected PostgreSQL server were not modified by creating this research bundle. No supplier transaction, live payment or payout, or production deployment was executed.
