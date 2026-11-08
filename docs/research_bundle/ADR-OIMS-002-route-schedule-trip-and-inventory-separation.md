# ADR-OIMS-002 — Separate Routes, Schedule Rules, Trip Instances and Inventory

- **Status:** Proposed target decision for review/acceptance
- **Date:** 28 October 2026
- **Context:** Operators need reusable routes, departures months ahead, accurate search cards and safe segment-based seat inventory.

## Decision

Model location/stop, route definition/version, recurrence schedule, concrete trip instance, assigned asset/layout and booking inventory as separate domain concepts. Use a schedule-preview/commit workflow to create occurrences over a selected date range and a configured rolling horizon. The route and schedule template are not a bookable trip and do not imply inventory availability.

Use a mode-specific inventory strategy: bus seats occupy ordered route segments, ferry inventory consumes sailing/class capacity, and flight/stay/train/experience inventory follows its actual supplier or Travelar-owned authority.

## Consequences

- The operator can generate upcoming trips through next month without manually creating each departure.
- Search and cards use the actual published trip instance, current vehicle assignment, route version, eligible segment, fare and freshness.
- Changes to published routes, seat maps or vehicles require an impact assessment and preserve historical booking snapshots.
- Database constraints/transactions and concurrency tests are required; cached availability cannot allocate seats.
- The implementation is more explicit than a single `routes` table but permits safe recurrence, route versioning and after-sales traceability.

## Rejected shortcuts

- One database row representing both a route corridor and every departure.
- Production JSON arrays hardcoded into the frontend as the route catalog.
- Seat map rendered only as SVG/PNG without machine-readable seat/occupancy records.
- One global inventory implementation for all six travel modes.
