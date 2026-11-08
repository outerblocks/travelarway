# 28 — Phase-by-Phase Engineering Roadmap

> **Stage 14 product-scope clarification (24 October 2026):** Train and Experiences are first-class Travelar modes, not future modes. Their requirements belong in the current product, architecture, integration and test baseline. Per-country activation may remain gated until authorized suppliers, contracts, ticket/voucher flows and support/refund handling are verified. See `40-train-and-experiences-first-class-mode-research.md`.

**Product:** Travelar · **Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Status:** Research-based proposed sequence; estimates intentionally excluded until team and vendor constraints are known  
**Updated:** 23 October 2026

## How to use this roadmap

Each phase is gated by acceptance evidence. Dates and effort estimates must be added only after the responsible team, integration access, regulatory dependencies and delivery method are known. External approvals are not engineering tasks and cannot be “mocked complete.”

Architecture baseline: custom Travelar backend; PostgreSQL core; modular monolith first; provider-neutral adapters for travel suppliers/GDS, payments, communications, authentication and market-specific services. Managed PostgreSQL is preferred only if legal location, contractual protections, recovery features and performance are suitable. Supabase remains a candidate platform/service rather than an automatic decision.

## Phase 0 — Governance and source of truth

**Objective:** establish one authoritative requirements baseline.

- Work: link requirement IDs to evidence, decision records, open questions, acceptance tests and named owners; define statuses; classify launch blockers; agree environments and approval authority.
- Security/privacy: identify data classes and payment-card scope before selecting integrations.
- Tests: validate that every P0 launch requirement has an owner, evidence status and verification approach.
- Docs: requirements index, ADR index, questions register, vendor matrix, glossary.
- Acceptance: no contradictions silently resolved; no critical assumption represented as a fact.
- Rollback: revert document baselines by version, not by deleting decision history.

## Phase 1 — Repository, delivery pipeline and hosting proof

**Objective:** create repeatable engineering foundations without real passenger data.

- Backend: TypeScript/NestJS candidate; module boundaries; configuration; health endpoints; centralized error contract; API versioning approach.
- Data: PostgreSQL version selection, migrations and migration tests; connection pooling; environment isolation.
- Frontend: design tokens, route skeleton, six-mode navigation and accessibility foundations.
- DevOps: CI typecheck/lint/unit tests, immutable build artifacts, dependency scanning, secrets management and deploy/rollback rehearsal.
- Security: threat model review and least-privilege access to environments.
- Acceptance: reproducible build/deploy; migrations can be applied to clean and prior-version databases; a tested rollback plan exists.
- External gate: hosting provider/region shortlist and data-transfer assessment before production personal-data use.

## Phase 2 — Identity, organizations and authorization

- Implement user identity integration behind an adapter boundary where justified; roles, memberships, organizations, country scope, branch scope, operator tenant scope, invitations, deactivation, MFA policy for privileged users and recovery flows.
- Deny by default. Enforce authorization in the backend for every object and action; database RLS is defense in depth if used, not the only authorization mechanism for critical commands.
- Add append-only audit events for security-sensitive changes and maker-checker workflow primitives.
- Tests: cross-tenant object-ID manipulation, privilege escalation, stale sessions, deactivated users, branch scoping and audit completeness.
- Acceptance: all role matrix negative tests pass; emergency access is time-bound and reviewed.

## Phase 3 — Market configuration and operator onboarding

- Build markets/countries, currencies, languages, legal/consent configurations, operators, branches, terminals, ports, stations, vehicles, vessels, seat-layout templates, vessel classes, staff, suppliers and contracts.
- Use versioned configuration with effective dates and approval records for commissions, fares, passenger fields and provider eligibility.
- Build operator verification checklist, sandbox-to-production activation gates, credentials vault reference, test evidence and suspension/revocation workflows.
- Tests: tenant isolation, effective-date changes, incomplete onboarding and attempted activation with missing approvals.
- Acceptance: a provider/market cannot become production eligible without required evidence and maker-checker approval.

## Phase 4 — Inventory and pricing core

- Bus: represent ordered stops and segments; allocate seats across all overlapping segments; model holds and expiry; reconcile external authoritative inventory; define schedule/vehicle changes.
- Ferry: reserve class capacity by sailing and passenger category; no seat map unless a contracted supplier supports it.
- Other modes: use supplier-authoritative availability and revalidation; never infer availability solely from cache.
- Use database constraints/transactions and explicit concurrency strategy; retry serialization conflicts safely. PostgreSQL documentation describes MVCC and transaction isolation, but application-specific correctness still requires tests: https://www.postgresql.org/docs/current/mvcc.html
- Tests: high-concurrency overlapping journey searches and bookings, repeated expiry job execution, out-of-order cancel events, route modification, vessel substitution and stale offers.
- Acceptance: no oversell under the agreed test envelope; each allocation has an audit trail and reliable release/reconcile behavior.

## Phase 5 — Booking orchestration and supplier adapter harness

- Define a common envelope for quote/offer, capability metadata, supplier references, hold/prebook, confirm/book, retrieve, amend, cancel/refund, status inquiry, error classification and reconciliation.
- Keep provider state and Travelar business state separate. Store immutable correlation identifiers; version capability descriptors; never require every supplier to implement a fake common denominator.
- Build a deterministic simulator for development and contract testing, clearly marked non-production. Mock success must never satisfy production acceptance.
- Tests: timeout after successful remote booking, duplicate create request, unknown result, provider schema drift, rate change before checkout and supplier cancellation during payment.
- Acceptance: unknown outcomes enter reconciliation rather than being blindly replayed.

## Phase 6 — Payment adapter and booking/payment coordination

- Implement payment intents, provider attempts, normalized webhook envelope, signature/raw-body verification per PSP, server-to-server status verification where available, idempotency keys, replay defense, refund state and suspense exceptions.
- Use provider-specific capabilities: hosted checkout, direct API, mobile money, card, refund/payout and settlement report are distinct capabilities, not universal methods.
- Coordinate holds/expiry and late payment: if payment succeeds after inventory release, do not silently issue a ticket or charge again; execute a defined re-accommodation/refund/exception path with operator/provider checks.
- Tests: duplicated/out-of-order webhooks; valid payment after timeout; incorrect amount/currency; signature failure; PSP outage; refund accepted but not completed; manual settlement mismatch.
- Acceptance: every payment intent is reconciled to booking state; no client redirect can confirm payment; unbalanced financial events block finalization.
- External gate: live processing disabled until merchant underwriting, legal funds flow and PSP production access are verified.

## Phase 7 — Ledger, commission and supplier settlement

- Implement append-only journal entries with balanced debits/credits, currency, source event, idempotent posting key and reversals rather than destructive edits.
- Model customer receipts, PSP clearing, operator/supplier payable, commission, markup, customer fees where lawful, taxes, refunds, chargebacks, fees, FX, agent cash, promotions and suspense accounts.
- Commission comes from versioned contracts and verifiable booking-source attribution. Operator-originated transactions default to no marketplace commission unless an explicit contract says otherwise.
- Tests: duplicate post, partial refund, cancellation fee, payment reversal, payout rejection, daily three-way reconciliation, period close and audit export.
- Acceptance: each journal is balanced per currency; retained revenue follows approved accounting policy; outstanding liabilities are visible and exportable.

## Phase 8 — Public consumer journey

- Build the landing page and mode selector; mode-specific search form; results; offer detail; passenger inputs; review; checkout; status page; secure retrieval/resend; account and booking history.
- Implement guest booking while ensuring a reference code alone cannot expose passenger data.
- Design accessible empty/error/loading/unavailable/price-changed states. Revalidate fares/rates before committing according to supplier semantics.
- Tests: end-to-end cases for each enabled mode, provider outage, no inventory, price changes, payment pending, late confirmation, ticket issuance failure, refund and secure guest lookup.
- Acceptance: every enabled mode has a fully tested fulfillment route, not just a visible search form.

## Phase 9 — OIMS, HIMS, agent and call-center operations

- OIMS: operator setup, routes/schedules, inventory/fleet/vessels, counter sales, cashier shift, manifests, boarding support, refunds and reporting.
- HIMS: country/mode/provider activation, contract approvals, provider credentials references, RBAC review, risk queues, support escalation and configuration approvals.
- Agents/call center: booking source, assigned organization, permissions, cash controls, assistance notes, customer privacy, maker-checker on refunds/payout-affecting actions.
- Tests: channel reclassification fraud, cashier float variance, staff offboarding, unauthorized refund, supervisor override and branch cross-access.
- Acceptance: every financial or attribution adjustment has actor, reason, evidence, approval and before/after state.

## Phase 10 — Communication adapters and customer support

- Central notification intent/template service; provider-specific email/SMS adapters; sender identity and destination capability checks; event correlation; delivery/failed/bounced/unknown states; controlled retries and alternate-provider routing.
- Do not treat HTTP acceptance as recipient delivery. Reconcile asynchronous callbacks and uncertain submissions before failover to reduce duplicates.
- Tests: provider outage/maintenance, delayed and out-of-order delivery events, sender-ID rejection, invalid destination, rate limiting and duplicate send prevention.
- Acceptance: alternate route works only where consent, country, sender identity and message type permit it; audit reveals provider and retry decision.

## Phase 11 — Marshal app and offline behavior

- Secure device enrolment, manifest minimization, signed/short-lived validation material if selected, duplicate-ticket detection, offline scan queue and synchronization conflict policy.
- Define offline authority per operator/route and expiry limits. An offline “valid locally” result is not equivalent to an online global consumed-ticket guarantee.
- Tests: same QR scanned by two offline devices; revoked ticket while offline; lost device; app reinstall; clock skew; sync replay and conflicting boarding events.
- Acceptance: conflict resolution has explicit operator policy and full audit; no false claim of global duplicate prevention when devices were disconnected.

## Phase 12 — USSD and low-connectivity channels

- Introduce USSD only after the backend booking/payment controls are stable and gateway/operator contracts are approved.
- Support session expiry, step limits, interruptions, idempotent retries, automatic seat allocation for buses, capacity allocation for ferries and reference-based retrieval.
- Tests: session interrupted after payment initiation, session retry, delayed PSP response, concurrent capacity allocation and privacy leakage in menu content.
- Acceptance: the USSD interface never connects directly to the database or bypasses price, authorization, inventory or payment state checks.

## Phase 13 — Production hardening and pilot

- Complete provider-by-provider certification, regulatory evidence, security testing, API abuse testing, data-protection review, load/soak/concurrency/failure drills, restore drills and rollback rehearsal.
- Train operations, finance, support, security and supplier contacts; define incident severity and escalation; verify redundant alerts.
- Run a controlled pilot with a limited number of approved operators, routes and channels. Reconcile every transaction daily before widening exposure.
- Acceptance: signed go/no-go pack; no unresolved critical/high security findings without formally approved risk treatment; agreed performance and recovery thresholds met.

## Phase 14 — Expand and scale from evidence

- Add markets/providers only after country-specific legal, supplier, data-transfer and operational checklists pass.
- Introduce read replicas, partitioning, regional deployment, dedicated services or orchestration only after measured bottlenecks or isolation requirements warrant them.
- Re-test data consistency, finance reconciliation, provider failover and disaster recovery after each major topology change.
- Acceptance: expansion has positive unit-economics rationale, proven supplier rights, clear ownership and a rollback route.

## Release and rollback standard

Every production change requires: reviewed migration plan; backward-compatible deployment sequence where possible; pre/post deploy checks; feature flag or provider activation guard; backup/restore evidence appropriate to risk; rollback or forward-recovery decision; monitoring and alert owner; support notice if behavior changes; and post-release reconciliation. Database rollback must not destroy already valid booking or accounting history; for some changes, a forward fix is safer than restoring a database snapshot.
