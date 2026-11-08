# 76 — OIMS Route, Service Pattern, Recurring Schedule and Trip Publication

**Product:** Travelar · **Stage:** 25 · **Date:** 28 October 2026  
**Status:** Target requirements for implementation; not evidence that the module exists.

## 1. The concepts must remain separate

The operator must not create a new hardcoded “route card” for every departure. OIMS distinguishes:

1. **Location/stop:** a reusable master-data record such as a terminal, town stop, ferry port, station or airport, with localized names, timezone, coordinates where appropriate, aliases, status and provenance.
2. **Route definition:** a reusable ordered corridor, for example Dar es Salaam → Morogoro → Dodoma. It describes the path and direction, not one dated departure.
3. **Route version / service pattern:** an effective-dated, operator-owned definition of which stops are served, in what order, allowed boarding/alighting pairs, planned offsets/durations, operating weekdays and restrictions. A return direction is normally a separate route/pattern unless a reviewed model explicitly supports direction variants.
4. **Schedule rule:** the recurrence and calendar rule that says when departures should run, such as daily at 06:00 and 20:30, every Monday/Wednesday/Friday, or selected dates. It has a service timezone, effective start/end dates, exceptions, holiday overrides and a version.
5. **Trip/departure instance:** one actual departure on a specific service date and local departure time, with a route version, schedule version, assigned vehicle/vessel or supplier inventory reference, status, driver/crew assignments where appropriate, seat map/capacity snapshot, fare-policy reference and stop-time instances.
6. **Inventory and booking allocation:** seats or capacity for that trip, including the exact origin-to-destination segment booked. The schedule template does not itself reserve seats.

IDs are stable opaque IDs. Names and labels are not identifiers. Changes that materially affect already-published trips create a new version or governed trip amendment; do not silently rewrite history.

## 2. Operator workflow: create a route

OIMS navigation: **Operations → Routes → Create route**.

### Step A — identity and direction

Required data comes from authorized operator master data/API: route display name/code, mode, market/country, operating entity, direction, currency/policy references, draft owner and status. Route code uniqueness is scoped by operator and direction/market, with database enforcement.

### Step B — ordered stops

The operator searches the central location registry and chooses stops by ID. The UI lets them reorder stops and specify for each stop:

- Sequence number and location ID.
- Public boarding, alighting, or through-only role.
- Planned arrival/departure offsets or explicit scheduled local times, where supported.
- Minimum dwell/turnaround buffer.
- Whether the stop is available to customers, staff-only, or unavailable to bookings.
- Effective dates and notes visible only to authorized operations staff.

The system validates that the route has at least two distinct stops, sequence numbers are unique and contiguous, time progression is plausible, timezone is explicit, and at least one eligible boarding/alighting pair exists. It prevents invalid pairs such as boarding after alighting. Location additions or new locations may require operator verification or HIMS approval depending on policy.

### Step C — publish route version

Show a route preview with ordered stops, map where coordinates exist, route direction, permitted segment pairs, sample journey duration, warnings, source/provenance and impact. Save as Draft → Validate → Submit for approval where required → Publish with an effective period. Publication records actor, approver, reason, version, previous version, timestamp and a configuration diff. A rollback supersedes a version; it does not erase audit history.

## 3. Operator workflow: create trips through next month

OIMS navigation: **Schedules → Recurring services → Create schedule**. The user chooses a published route version and enters:

- Service timezone and local departure time(s).
- Recurrence: daily, selected weekdays, selected calendar dates, or a reviewed recurrence rule.
- Effective start and end dates, including a user-selectable “through” date such as the last day of next month.
- Exceptions/blackout dates, replacement departures and public holidays where configured.
- Planned stop time offsets or timetable pattern.
- Vehicle/vessel assignment policy, class/capacity or seat-layout policy.
- Applicable fare table, booking cutoff, inventory release and sales channels.
- Operational buffers, status and responsible depot/branch.

### Preview before generation

The server calculates the exact dated trip instances and returns a preview before any write: dates, local/UTC instants, route version, expected stop times, assigned/unassigned vehicle, capacity, fare policy, warnings and conflicts. It checks duplicate occurrences, overlapping vehicle/crew assignment, vehicle maintenance/availability, operator blackouts, route version effective dates, turnaround time, fare coverage, sale windows and any required regulatory readiness.

The user can accept, edit the source schedule, or cancel. A bulk generation command is idempotent: rerunning it must not create duplicate trip instances. Use a database uniqueness key based on the schedule-rule/version and canonical occurrence (with mode-specific key components) and an audit record of preview and commit. A change to recurrence must show the diff of dates to be added, amended or cancelled.

### Rolling horizon

Provide both:

- **Manual bulk generation:** generate trip instances for a selected date range, including through the end of next month.
- **Rolling-horizon worker:** configurable policy, for example keep 60 or 90 days of future departures generated, then add the next missing day on a scheduled job. The number of days is configuration, not a compile-time constant. Do not let the worker activate an unapproved route, unapproved fare, missing vehicle, or regulatory-ineligible service.

Store local service date, timezone, local departure, resolved UTC instant, and the timezone/calendar rule version as needed. Explicitly handle nonexistent/ambiguous local time when time zones observe daylight saving. In Tanzania, retain Africa/Dar_es_Salaam for applicable services, but do not assume every future market shares the same timezone.

### Statuses and changes

Suggested states: `DRAFT`, `VALIDATING`, `READY_FOR_APPROVAL`, `SCHEDULED`, `PUBLISHED`, `SALES_PAUSED`, `DISRUPTED`, `DEPARTED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`. Keep a transition graph in reviewed code; configuration may set safe thresholds but cannot arbitrarily skip mandatory transitions.

Trip changes after sales begin require an impact assessment: number of affected bookings, passenger notifications, vehicle/seat-map compatibility, fare/ticket snapshots, manifest/regulatory posting, refunds or re-accommodation. A cancelled trip cannot silently disappear from search; existing customers enter a disruption case workflow.

## 4. Search fields depend on trip instances and eligible offers

Public search filters candidate published trip/offer records by mode, origin ID, destination ID, service date, eligible boarding/alighting pair, passenger count/category, sale status, inventory state and fare policy. It only returns current, sellable offers.

The bus result card can draw from:

- Operator display identity/logo and verification status safe for public display.
- Origin, destination, ordered intermediate “via” stops or configured abbreviated via summary.
- Departure/arrival local time and timezone, expected duration and day-offset marker.
- Bus category/type and manufacturer/model where the operator has supplied and verified them.
- Vehicle registration/plate only when the trip is actually assigned and the market/privacy/product policy allows it to be displayed; it must never be invented from the fleet or copied from a previous trip.
- Amenities from verified vehicle/trip capability records, not free-text assumptions: AC, charging, Wi-Fi, toilet, recliner, entertainment, luggage allowance, accessibility, etc. Each amenity has source, last verification and confidence/status.
- Available seat count by the requested segment, fare from the selected boarding point to selected alighting point, included fees/taxes and currency, cancellation/change summary and inventory/fare freshness.
- Actions supported for that trip/channel: select seats, continue, view stops/details or request assistance.

The public card never exposes private staff data, internal vehicle documents, full crew roster, hidden stop security notes, supplier credentials or non-public contract rates. HIMS may configure which supported fields appear and in which order through a typed card profile; the UI only renders registered component/field keys. No database-stored executable HTML/JavaScript.

## 5. Fare and effective-date rules

Fares are versioned records or approved pricing policies, not frontend constants. A fare policy can target operator, route/version, from-stop/to-stop pair, trip/date range, passenger category, service class, channel, currency and campaign. It stores who is charged, components, taxes/levies if applicable, commission/markup policy reference, rounding rules, booking window and effective dates. The backend resolves the final quote and gives it an expiry and immutable fare/policy snapshot.

A fare update applies to trips/quotes according to explicit effective-date and existing-booking rules. Do not retroactively alter a paid booking. A schedule with no valid price for a candidate trip must be blocked or unsellable with an actionable explanation, not fall back to a hardcoded amount.

## 6. Minimum logical records

Illustrative logical entities, not final DDL: `travel_location`, `location_alias`, `operator`, `operator_branch`, `route`, `route_version`, `route_stop`, `schedule_rule`, `schedule_exception`, `trip_instance`, `trip_stop_time`, `trip_assignment`, `fare_policy`, `fare_policy_version`, `trip_sales_channel`, `publication_approval`, `configuration_change`, `job_run`, `job_exception`.

Each record must carry appropriate tenant/operator scope, status, timestamps, actor references, provenance/source, and effective period. Use foreign keys, checks, unique indexes and transaction boundaries where they enforce the rules. PostgreSQL constraints reject invalid persisted data even if the UI or API path is bypassed. See the official constraint guide: https://www.postgresql.org/docs/18/ddl-constraints.html.

## 7. Acceptance criteria

- An operator with correct scope can create a route from existing locations and publish it through the governed workflow.
- The operator can preview and create trip instances through any selected date range, including next month's final date.
- Rerunning the same generation job creates no duplicates; re-running a changed rule shows a difference set.
- A route with invalid/duplicate stops, impossible timetable or missing fare cannot publish.
- Search for A→C on a route A→B→C returns the fare and times for A→C and only permits eligible boarding/alighting pairs.
- Search excludes draft, cancelled, paused, expired or ineligible services and unavailable inventory.
- Public cards display only values actually stored or retrieved from an authorized source, with stale/unknown states handled explicitly.
- Vehicle replacement or trip cancellation preserves ticket/booking snapshots and creates the right disruption work queue.
- Concurrent schedule generation, booking and route amendment tests prove no duplicated trip occurrence or invalid sales state.
