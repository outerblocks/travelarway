# Repository audit — status addendum (2026-10-30)

The audit above was written before any backend existed. Section 8 is now out of date:
a database is connected, eight migrations are applied, and several endpoints have been
proven over HTTP against PostgreSQL 18.6. This addendum records what changed and what
did not.

## Built since the audit

| Area | What exists now | Evidence |
|---|---|---|
| Configuration | `src/server/config.ts` — dotenv, URL userinfo re-encoding, CA-based TLS, production hard-fail | `node scripts/db-check.mjs` |
| Database | `src/server/db.ts` (lazy pool, `withTransaction`), migrations 0001–0008, idempotent seeds | `node scripts/migrate.mjs` |
| Roles | `travelar_migrator` (DDL), `travelar_app` (DML), `travelar_test` | `scripts/bootstrap/*` |
| Search | `/api/locations`, `/api/trips`, `/api/trip-detail` | HTTP |
| Inventory | `/api/seat-map`, `/api/holds` | concurrency test returns `23505` on the second writer |
| Booking | `/api/bookings` — quote computed server-side, holds bound, no price accepted from the client | tampered `totalMinor: 1` was ignored |
| Payment | `/api/payments/start`, `/api/payments/callback` (HMAC-signed), `/api/booking-status` | `scripts/verify-ticket-e2e.mjs` |
| Maintenance | `POST /api/internal/sweep` — closes unpaid bookings, releases seats | `scripts/verify-expiry.mjs` |
| ClickPesa | Checksum signing/verification, order references, `POST /api/payments/clickpesa` webhook | `scripts/verify-clickpesa-webhook.mjs`, `scripts/clickpesa-probe.mjs` |
| Tickets | `/api/verify-ticket` — HMAC token, timing-safe, fails closed | forged signature and bare PNR both `403` |

## Defects closed

**C1 — the client decided the price.** `segment_fare.child_ratio` moved into the
database and `src/server/quote.ts` became the only place a total is produced. A booking
request now carries a segment and a party, never an amount.

**C2 — a ticket was issued before the money arrived.** `app.booking` was written
`issued` with a ledger row the moment the checkout form was submitted, so an abandoned
checkout looked like revenue. Now:

- a booking starts `pending_payment`, with `payment_due_at` 15 minutes out;
- passengers are `pending` and the seats are held, not sold;
- the ledger row and the ticket token appear only when a signed provider callback
  confirms the money (`src/server/payments.ts`, `src/server/ledger.ts`);
- `booking.paid_at` must precede `booking.issued_at` — enforced by a check constraint,
  not by convention;
- money that arrives after the hold expired is recorded `unallocated` on the payment and
  cancels the booking: the customer is owed a refund, and that must be countable rather
  than hidden in a failure state.

`scripts/verify-ticket-e2e.mjs` proves both branches end to end, including that a
replayed callback writes no second ledger row.

## Still open

| ID | Defect | Why it is not fixed here |
|---|---|---|
| C3 | No authorisation on mutating endpoints | Blocked on identity — see below. Cannot be fixed by writing more booking code |
| C4 | `_minor` columns hold major units | A rename touches every table, the ledger and the API; it is a migration of its own |
| H1 | No rate limit on `/api/holds` | Needs a trusted-proxy decision: the client key is an IP, and an IP taken from a spoofable header is not a limit. Depends on deployment topology |
| H2 | A paid booking with no commission rate fails the callback | Fails loudly and the provider retries, but there is no alerting path yet. It must never invent a rate |
| H5 | Backend checks are scripts, not CI | The repository still has no `.github/` |
| — | `operations.ts`, `mockData.ts`, `AuthContext` | Ferry, train, flights, stays and experiences still read fixtures |

### H1 — expiry (closed)

A booking whose payment window had passed stayed `pending_payment` forever, so the
confirmation page told the customer their seats were held long after they were gone.
`src/server/expiry.ts` now closes those bookings and releases their holds. It runs in two
places: whenever a booking is read, and in bulk from `POST /api/internal/sweep`
(`scripts/sweep.mjs`, guarded by `MAINTENANCE_SECRET`). The bulk path uses
`for update skip locked` so a payment arriving at the same instant is skipped rather than
expired underneath the provider callback.

## C3 needs an identity provider, not more code

ADR-AUTH-001 is explicit: **do not implement password hashing, credential handling,
MFA/passkeys, reset flows and session management from scratch for the first production
release.** It selects self-hosted Keycloak over OIDC.

So C3 cannot be closed by writing an `account` table and a scrypt hash — that would
contradict the ADR and produce exactly the bespoke credential code it forbids. What C3
needs is a running Keycloak realm and a relying party that validates tokens against it.
Until that exists, the honest state is: guest endpoints are unauthenticated by design
(guest checkout is a product requirement), and staff/operator endpoints do not exist yet,
so there is nothing to scope.

The remaining exposure is that `/api/booking-status?id=<uuid>` treats an unguessable id as
the credential. Closing that needs a resource-scoped token for guest bookings — a booking
access token, not a user account — which is worth doing on its own and does not depend on
Keycloak.

## ClickPesa (30 October 2026)

The adapter is wired end to end: `POST /api/payments/start` creates the collection, and
`POST /api/payments/clickpesa` receives their webhook. Three things had to be fixed before
that was true, and each was a real defect rather than a refinement:

- the status query used an invented path; the documented one is
  `GET /payments/{orderReference}` and returns an array;
- `orderReference` may not contain a hyphen, so `TRV-ABC123` would have been rejected — it
  is now alphanumeric with an attempt suffix, stored on `app.payment.order_reference`;
- a payment that succeeded kept its old `failure_code`, which made a paid row look failed.

Their live API also answers **400** (not the documented 404) for an unknown reference,
which would have broken the status fallback. The adapter treats it as `pending`.

Credentials were verified with two API calls and no money moved: a token was minted and an
unknown reference queried. `CLICKPESA_LIVE` remains unset, so the adapter still refuses to
contact the provider; setting it is the only step between this code and collecting real
money, and it is deliberately not something tooling does.

## UI and correctness fixes (31 October 2026)

Four user-reported defects, all fixed and verified in a browser or over HTTP:

**Checkout could not be paid.** It priced bus trips with `quoteForBooking`, which reads the
fixture module. A real trip is a database row with a UUID, so the lookup returned null, the
total was null, and the pay button disabled itself. Checkout now fetches
`/api/trip-detail` for the exact segment (by stop id, not route origin) and renders the
server's lines and total. A dedicated loading state distinguishes "price on the way" from
"no price exists".

**A client-only coupon changed the displayed total but not the charge.** `TRAVELAR10` cut
10% off the amount shown while the server charged the full fare. Removed until a discount
exists server-side; a promo code that changes nothing is worse than no promo code.

**Seats faced the back of the bus.** The seat glyph drew its backrest at the top, and the
driver sits in row 0 at the top, so every passenger faced away from the driver. The
furniture is now mirrored (backrest at the bottom, label upright). Verified in the browser:
driver at top, backrests at the bottom, digits upright.

**Zanzibar and Pemba appeared in the bus dropdown.** They are islands: ferry and air only.
`Location` now carries the modes that actually serve it, and the search form filters by mode.
Verified in the browser: 16 mainland cities in the bus list, islands present for stays.

**Date picker was one day early.** `new Date(y, m, d)` is local midnight; `.toISOString()`
converted it to UTC, which in Dar es Salaam (UTC+3) is the previous day. Choosing 4 November
stored 3 November — a wrong-day booking. Calendar dates now go through `toIsoDate` and
`parseIsoDate`, which never touch UTC. The same bug was in `todayISO` and `addDays`.

## Guest booking access tokens

`/api/booking-status` and `/api/payments/start` accepted a booking id as the credential.
The id is unguessable but not secret, and once ClickPesa is live that id makes a real phone
ring. Checkout now issues a signed token naming exactly one booking (`BOOKING_ACCESS_SECRET`,
fails closed if unset); both endpoints require it and refuse a token issued for a different
booking. This is not identity — it grants nothing beyond that one booking.

## What "verified" means here

Every claim in the tables above was produced by running the thing: migration output,
HTTP status and body, or SQL read back after the call. Nothing in this addendum is
inferred from reading code.
