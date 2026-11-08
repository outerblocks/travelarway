# Repository audit and implementation plan

**Date:** 28 October 2026
**Branch:** `main` · **Commit:** `f932cb3 feat(oims,hims): operations-driven operator and HQ consoles`
**Working tree:** **126 modified/untracked files** (uncommitted)
**Scope:** replace every mock with a real backend, prove workflows against PostgreSQL.

Status vocabulary is the governance one: `implemented`, `tested`, `not run`, `absent`,
`proposed`, `blocked`. Nothing here is `done`.

## 1. What the repository actually is

A **frontend only**. Server-side rendering exists (TanStack Start), but there is no
application server, no database, no migrations, no environment file and no CI.

Verified by inspection, not assumption:

| Claim | Evidence |
|---|---|
| No backend directory | `server/`, `apps/`, `api/` all absent |
| No database layer | no `drizzle/`, no `migrations/`, no `.env`, no `docker-compose.yml` |
| No CI | no `.github/` |
| Scripts | `dev`, `build`, `lint`, `start` (srvx), `preview`, `typecheck`, `test`, `test:e2e` — none touch a database |
| `@supabase/supabase-js` | **declared as a dependency, used by zero files.** Either a vestige of an abandoned plan or an unfinished intention; it must be resolved, not left ambiguous |

## 2. Mock inventory (the thing being replaced)

~2,650 lines are not mocks in the testing sense — they are a **parallel implementation**
of the product's data layer, executed in the browser.

| File | Lines | What it pretends to be | Fate |
|---|---|---|---|
| `src/data/operations.ts` | 930 | The database: operators, routes, stops, segment fares, seat maps, vehicles, vessels, schedules, bookings, OTC sales, approvals, pub/sub | **Replaced** by API + Postgres |
| `src/data/mockData.ts` | 710 | Six modes of searchable inventory (trips, sailings, flights, stays, experiences) | **Seeded** as reference data, served by API |
| `src/data/operatorData.ts` | 314 | Operator operational records | Seeded |
| `src/data/sgr.ts` | 192 | Real SGR Tanzania stations, trips, coach sets | Seeded (it is genuine reference data) |
| `src/data/tripHistory.ts` | 184 | Account booking history | Replaced by real bookings |
| `src/data/destinations.ts` | 160 | Destination editorial content | Seeded as content |
| `src/data/locations.ts` | 136 | Cities/stations for search | Seeded, plus code resolution |
| `src/data/parcels.ts` | 25 | Parcel tracking | Replaced (needs a real carrier feed or an explicit stub) |
| `src/context/AuthContext.tsx` | 102 | Identity: email/password functions, user cached in `localStorage` | **Replaced** by server sessions |

### Why `operations.ts` is the blocker

It is a single in-process object with `subscribeToOperations()` fan-out. Consequences, all
observable today:

- Two browser tabs are two different universes; an operator selling a seat does not remove
  it from a customer's list.
- Refresh discards every booking, route and OTC sale.
- Nothing can be authorised: the "operator" is whoever the URL says.
- No constraint can hold — capacity, double-sell and fare integrity are unchecked.

This is why "the console actions feel broken". They are not buggy; they have no authority.

## 3. Target architecture (proposed, from the ADRs already in the pack)

```
Browser → TanStack Start (SSR + server routes / server functions)
            ├── PostgreSQL 18 via node-postgres — source of truth
            ├── Outbox + worker — settlements, notifications
            └── Adapters — ClickPesa, Travelport, Sabre, SGR
```

Stack correction (owner, 28 Oct): **React + TanStack Start is the full stack.** There is no
separate NestJS service, so server routes and server functions are the API boundary, and the
browser still never reaches the database.

- PostgreSQL owns inventory, bookings, holds, payment state, ledger, tenant data and
  versioned configuration.
- The browser never reaches the database. All access is authorised server-side.
- Provider SDKs never leak past an adapter boundary; UI vocabulary stays Travelar's.
- Search, revalidation, reservation, ticket issuance, collection, settlement and payout
  remain **separate states** (governance requirement, and the only honest way to report
  money).

## 4. Gap matrix

| Capability | Current evidence | Status | Remediation | Acceptance test |
|---|---|---|---|---|
| Application server | none | `absent` | TanStack server routes, config validation, health, correlation IDs | `/health` and `/ready` under test |
| Database schema | none | `absent` | Drizzle schema + versioned migrations + seed | fresh-DB migrate from zero |
| Inventory | `operations.ts` arrays | `absent` | tables + constraints + transactional hold | concurrency test: two buyers, one seat |
| Search | reads `mockData.ts` in the component | `absent` | `GET /search/*` from DB, typed response | same query, two clients, same results |
| Quotes | `domain/pricing.ts` in the browser | `partial` | server-side authoritative quote, client may display only | tampered client price is rejected |
| Booking | `recordBookingFromCheckout` | `absent` | `POST /bookings` idempotent, holds consume capacity | replay produces one booking |
| Payment | simulated timers | `absent` | ClickPesa adapter behind an interface, webhook + reconciliation | mock gateway: success, fail, timeout, duplicate |
| Ticketing | renders from `demoTicket` | `partial` | document state machine `held→issued→void/refunded` | no document without `issued` |
| Identity | `localStorage` user | `absent` | server sessions; decision required (Keycloak vs local) | unauthorised request returns 401/403 |
| Authorisation | none | `absent` | permission catalogue, org scoping, tested tampering | cross-tenant access denied |
| HIMS/OIMS actions | mutate in-memory store | `absent` | API + approval + audit | every mutation writes an audit event |
| Ledger/settlement | none | `absent` | double-entry rows, automated settlement intents | reconciliation invariant holds |
| Notifications | none | `absent` | email/SMS adapter behind interface, outbox | queued once, retried once |
| GDS/flight/stays/rail | seeded fixtures only | `absent` | provider-neutral adapter + capability gating | contract tests against recorded fixtures |

## 5. Plan

**P0 — Foundation (blocks everything).** Branch off `main`, commit the 126 dirty files as
reviewable work first. Then: API bootstrap, typed config, Postgres schema v1, migrations,
seed pipeline from the existing fixtures, `GET /health`. No feature work.

**P1 — One vertical slice, end to end (Bus).** Operator → route → stops → segment fares →
schedule → search → seat map → hold → booking → payment intent (mock gateway) → ticket →
manifest → ledger entry. Every step server-authorised, every state persisted, every
mutation audited. **This is the proof; do not start a second mode until it holds.**

**P2 — Money.** ClickPesa collections (USSD push, control number) with webhooks and
idempotency; settlement intents; payouts behind explicit approval. Live money never in
automated tests.

**P3 — Consoles.** HIMS/OIMS on the API: roles, invitations, approvals, audit, finance per
mode. The screens exist; their actions must move from store calls to authorised endpoints.

**P4 — Second and third modes.** Ferry, then Train (SGR is the best-documented externally,
but it is also the one with the least settled commercial arrangement).

**P5 — Provider integrations.** Travelport/Sabre behind the adapter interface with
capability gating; no live GDS calls without entitlement evidence.

**P6 — Notifications, content, reporting.**

## 6. Seed strategy

Fixtures become **reference data** with provenance, not truth:

- Seeded rows carry `source` (`reference | operator_contract | fixture`) and a version.
- Genuine external data (SGR stations, trips, coach sets) seeds as reference with its
  source recorded.
- Invented demo rows (some trips, some operators) seed as `fixture` and are labelled as
  such in the API response and the UI where they are displayed.
- Search results must never present fixture data as live availability.

## 7. Decisions I need from the owner

1. **Identity:** Keycloak (as ADR-AUTH-001 leans) or local identity first? This gates P1
   because bookings need a subject.
2. **`@supabase/supabase-js`:** remove it, or is Supabase still intended as the platform?
   Two data stories in one repo will produce two truths.
3. **Dirty tree:** authorise committing the current 126 files before the backend work
   starts, so the audit trail distinguishes frontend work from backend work.

## 8. What I have not verified

- No database was contacted; no target environment was classified. Nothing here is
  `verified in sandbox`.
- I did not read the ADR corpus in full (110 research files); this plan reconciles with the
  governance charter and the two directives, not every ADR.
- Test runs cited elsewhere in this session were frontend-only (`vitest`, `tsc`, `eslint`,
  `vite build`). They say nothing about backend correctness.
