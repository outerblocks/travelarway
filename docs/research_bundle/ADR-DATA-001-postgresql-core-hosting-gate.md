# ADR-DATA-001 — PostgreSQL Transactional Core, Hosting Gate Remains Open

- **Status:** Domain choice recommended; platform/region unselected
- **Date:** 23 October 2026

## Decision
Use PostgreSQL relational constraints and transactions as the primary source of truth for Travelar-owned booking, inventory, payment state and accounting records. Confirm the final supported database version and hosting service after data-residency/legal review, load tests and supplier compatibility checks.

## Rationale
Travelar depends on relationships, constraints, atomic multi-leg inventory claims, monetary state transitions, uniqueness and balanced journals. PostgreSQL's transaction and explicit-locking mechanisms are a natural fit. The model can still use cache/search/object storage for appropriate separate workloads.

## Alternatives
- A document store as the sole core: not preferred because constraints/ledger/relationships would need more bespoke integrity controls.
- Separate database per travel mode at launch: not preferred before a business or regulatory boundary justifies the transaction/cost complexity.
- Managed Supabase as assumed primary store: not approved yet; the publicly listed managed regions reviewed 23 October 2026 do not show a country-local African region, and backup/support/subprocessor data flows must also be assessed.

## Consequences
- Seat/segment and ferry-capacity reservations rely on database-enforced uniqueness/conditional updates.
- Posted journals are immutable; corrections are linked reversals/adjustments.
- Connection pooling, migration locking, backup/PITR and restore practice need engineering ownership.
- Country deployment topology remains open; legal transfer requirements cannot be fixed by adding a `country_id` alone.

## Approval gates
1. Counsel-approved data-flow and controller/processor analysis for Tanzania and intended next market.
2. Hosting RFI covering primary, backups, logs, support access and DR locations.
3. Written vendor quote/terms and exit/export path.
4. Concurrent inventory tests, migration tests and restore rehearsal.


## Later refinement (23 October 2026)

The backend recommendation is refined by `ADR-DATA-002-custom-backend-managed-postgres-preferred.md`: own the Travelar business backend; prefer managed PostgreSQL if exact region/legal/vendor/recovery/cost conditions pass; evaluate Supabase selectively rather than adopting its client-facing Data API as the critical orchestration layer. ADR-DATA-001's original hosting gate remains open until vendor and legal evidence is accepted.
