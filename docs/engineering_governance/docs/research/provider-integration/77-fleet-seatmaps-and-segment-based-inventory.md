# 77 — Fleet, Seat Maps, Segment Inventory and Availability Integrity

**Product:** Travelar · **Stage:** 25 · **Status:** Requirements and design proposal; implementation unverified.

## 1. Vehicle and equipment records

OIMS → Fleet supports a governed fleet registry. A vehicle record belongs to one operator/tenant and may be assigned to a branch/depot. Fields include internal fleet number, registration/plate, make, model, manufacture year if needed, vehicle class/type, capacity, accessible facilities, amenities, documents/verification, maintenance/offline periods, active status and source of truth. Unique constraints are scoped appropriately; e.g. current registration cannot be duplicated for two simultaneously active vehicles within the same jurisdiction/operator rules. Do not require or display data that is not needed or legally permitted.

Model amenities as structured, localized, versioned records with verification status and source. Free text may supplement but must not drive filtering as if it were verified truth. Maintain effective-dated equipment/layout changes and audit who verified them.

## 2. Seat-map designer

The operator selects a reusable seat-layout template or creates one within a safe structured designer. Seat maps are not background images alone; each passenger-assignable seat/berth is a data object.

Each layout version includes:

- Stable layout ID and version, bus class/type compatibility, dimensions/rows/columns or coordinate grid.
- Seat/berth ID and public label (e.g. A1, 01, Upper 3), x/y position, orientation and optional row/column.
- Seat kind: standard, premium, sleeper/berth, wheelchair space, crew, driver, unavailable/structural space, or a validated extension.
- Features: window/aisle, upper/lower deck, facing direction, accessible transfer, gender allocation only if legally/policy-approved and necessary, and other supported attributes.
- Sale eligibility, restrictions, assigned fare class/seat premium, display order and localization keys.
- Door, driver, stairs and aisle markers as non-seat layout objects.

Only registered seat/component types are allowed. Do not store arbitrary code. Validate unique seat IDs/labels per layout version, coordinates, vehicle capacity, aisle/exit/accessibility constraints where known, and layout compatibility. Layout publication requires impact preview if trips already use it.

### Assigning a layout to a vehicle or trip

A vehicle may use one current layout version, but a published trip must retain the exact layout/capacity version used for its customer inventory and confirmed bookings. If the vehicle changes, OIMS must compare old and new layouts and show booking impacts before accepting a replacement. For incompatible layouts, put affected reservations into a controlled reseating/re-accommodation queue; never silently remap passenger seats.

## 3. Seat availability is segment-based

A bus route has ordered stop positions. A passenger booking from stop index `i` to stop index `j` occupies the half-open sequence of route segments `[i, j)`. Two bookings for the same seat can coexist only when their occupied route segments do not overlap. Example: seat 4 can be sold A→B and B→D on route A→B→C→D if policy permits segment sharing at the exact boundary; it cannot be sold A→C and B→D.

Use the following allocation contract:

1. Validate trip and route version, eligible board/alight stops, sale cutoff and current price.
2. In one database transaction, claim the seat across every segment in `[start_stop_index, end_stop_index)`, using a concurrency-safe design.
3. Store the hold/booking association, hold expiry, idempotency key, actor/channel and quote/fare snapshot.
4. Commit only if every required segment is claimed. If any segment conflicts, release any transaction-local claims by rollback and return a fresh availability response.
5. Hold expiry, payment failure, cancellation and successful ticket issue each have explicit state transitions and cleanup/retention rules.

Acceptable implementation choices include an authoritative occupancy row per `(trip_id, seat_id, segment_index)` with unique constraints, or an exclusion-constraint design using appropriate PostgreSQL support. The IDE agent must compare complexity and concurrency evidence before finalizing; application-level “check then insert” without a transaction/constraint is not acceptable. See PostgreSQL constraints documentation: https://www.postgresql.org/docs/18/ddl-constraints.html.

Holds must be finite, policy-bounded and server-timed. A client clock never decides expiry. Background cleanup is useful but not the only invariant; an expired hold must not block availability forever, and a late payment cannot resurrect an expired seat without a new successful inventory check.

## 4. Seat-map API and UX

The search result can show an availability summary, but the seat map should be loaded for a selected trip and the passenger's chosen segment. API response contains layout version, coordinate/component objects, seat attributes allowed for display, availability for the requested segment, price premiums and availability timestamp. Client only displays state; the server authorizes and allocates.

Typical states: `AVAILABLE`, `HELD_BY_CURRENT_FLOW`, `HELD_UNAVAILABLE`, `BOOKED`, `BLOCKED`, `NOT_FOR_SALE`, `RELEASED`, `UNKNOWN`. Do not expose the identity or contact details of another passenger. A cache must be short-lived and never treated as a reservation.

If a bus ticket is for A→C, availability queries must calculate overlap with all occupied segments between A and C. A seat can appear available for A→B yet unavailable for A→C; explain this naturally rather than exposing internal segment data.

## 5. Ferries and non-seat inventory

Ferry inventory is modeled first as sailing instance × class/cabin category × capacity, not by assuming numbered bus seats. A supplier might additionally provide actual cabin/seat selection; only activate that UI when the authoritative supplier supports it. Capacity allocation must be atomic with booking and respect vehicle/vessel class capacity, passenger type, ticket rules and manifest needs.

Flights, stays, train and experiences use the provider's actual inventory semantics, e.g. offer/room/seat/time-slot or capacity, with `inventory_authority` recorded. Travelar must not invent its own seat-map authority for supplier-controlled inventory.

## 6. Fare quoting for seat and journey segments

Fare resolution uses operator, route/version, trip/date, boarding and alighting stop IDs, distance/segment pricing if applicable, class, seat attributes/premium, passenger category, channel, effective fare-policy version and applicable fees/levies. Browser-supplied seat price and total are never authoritative. Quote response includes itemized price, currency, policy version, expiry and a signed or opaque quote ID; at payment boundary, server revalidates according to policy.

## 7. Operations and audit

Events to audit include vehicle created/edited/deactivated, registration/doc verification, amenity changes, seat-map draft/published/version superseded, trip vehicle swap, manual seat block/release, inventory adjustment, hold override, seat reallocation, trip cancellation and passenger reseating. Record actor, tenant/operator, scope, before/after diff with PII redacted, reason, approval and correlation ID.

High-risk manual inventory edits should require a reason and, above configured thresholds or after a ticket is sold, maker-checker approval. Only authorized roles may block seats, and bulk blocks require preview and affected-booking analysis.

## 8. Acceptance criteria

- Create and version a bus layout with identifiable seats and non-seat layout objects.
- Assign a layout to a vehicle, then to trips; preserve the version against which bookings were sold.
- Concurrent overlapping seat claims cannot result in double-booking.
- Non-overlapping segment claims may coexist when policy permits.
- A route-stop change cannot reinterpret past tickets or silently invalidate already booked segments.
- Vehicle replacement detects missing/changed seats and creates a controlled reseating workflow.
- Ferry capacity cannot be exceeded under concurrent requests.
- Cached availability never authorizes booking without a fresh transactional claim.
- Seat-map edits, manual blocks and override actions are audited and authorization-tested.
