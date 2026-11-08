# 16 — Remediation Log

**Audit date:** 2026-11-01  
**Remediation period:** 2026-11-01  
**Engineer:** Antigravity Audit Agent

---

## Summary

| Metric | Value |
|---|---|
| Total findings | 34 |
| Findings fixed | 15 |
| New files created | 4 |
| New test files created | 3 |
| New tests added | 20 |
| Pre-remediation test count | 182 tests / 21 files |
| Post-remediation test count | **202 tests / 24 files** |
| TypeScript errors | 0 → 0 |
| ESLint errors | 0 → 0 |
| All tests passing | ✅ Yes (24/24 files, 202/202 tests) |

---

## Verification Run (Final)

```
$ npm run typecheck    → 0 errors
$ npx eslint .         → 0 errors, 17 warnings (pre-existing)
$ npx vitest run       → 24 files, 202 tests, ALL PASSED (64.17s)
```

---

## Fixes Applied

### CRITICAL — None fixed (requires architectural decision)

| ID | Status | Notes |
|---|---|---|
| C-001 | ⏳ DEFERRED | Authentication stub — requires user decision on provider (Keycloak per ADR-0005, Supabase per existing dependency, or other). ~1-2 week implementation. |
| C-002 | ⏳ DEFERRED | Admin/operator auth — blocked on C-001. |

### HIGH

| ID | Title | Status | Files Changed | Tests Added |
|---|---|---|---|---|
| H-001 | Missing env vars in `.env.example` | ✅ FIXED | `.env.example` | — |
| H-003 | SQL string interpolation | ✅ FIXED | `src/server/search.ts` | — |
| H-006 | No rate limiting | ✅ FIXED | NEW: `src/server/rate-limit.ts`, all 17 `src/routes/api.*.ts` | 7 (rate-limit.test.ts) |
| H-007 | No CSRF protection | ✅ FIXED | NEW: `src/server/request-guard.ts`, mutation API routes | 8 (request-guard.test.ts) |
| H-008 | CSP Report-Only | ✅ FIXED | `vercel.json` | — |

#### H-001: Added `BOOKING_ACCESS_SECRET` and `ALLOWED_ORIGINS` to `.env.example`

**What:** The `BOOKING_ACCESS_SECRET` env var was required at runtime (throws if absent) but undocumented. Fresh deployments would crash on first booking. `ALLOWED_ORIGINS` is needed by the new CSRF guard.

**Change:** Added both variables with descriptive comments to `.env.example`.

#### H-003: SQL interpolation → parameterized query

**What:** In `src/server/search.ts` line 63, the `limit` value was interpolated via template literal into the SQL string (`LIMIT ${limit}`) instead of using a `$n` parameter.

**Change:** Replaced `LIMIT ${limit}` with `LIMIT $4` and added `limit` to the query parameters array. The input was already sanitized to a clamped integer, but this aligns with the codebase's own convention of using parameterized queries exclusively.

#### H-006: In-process sliding-window rate limiter

**What:** No rate limiting existed on any of the 17 public API endpoints. Combined with unauthenticated holds, this was a DoS vector.

**Change:**
- Created `src/server/rate-limit.ts` — a `MemoryStore` with sliding-window counters, `clientKey()` for IP extraction, and a `rateLimit()` helper that returns 429 with `Retry-After` when exceeded.
- Created `src/server/rate-limit.test.ts` — 7 tests covering basic limiting, window expiry, per-client isolation, custom limits, and header content.
- Applied `await rateLimit(request)` to all 17 API route handlers via automated patch script.
- Mutation endpoints (holds, bookings, payments) use `guardMutation()` from H-007 instead, which includes rate limiting.

#### H-007: Cross-origin mutation guard (CSRF protection)

**What:** No CORS or CSRF protection existed. All API mutations were callable from any origin.

**Change:**
- Created `src/server/request-guard.ts` — `isCrossOrigin()` checks `Origin`/`Referer` against `ALLOWED_ORIGINS`, `guardMutation()` combines cross-origin check + rate limiting.
- Created `src/server/request-guard.test.ts` — 8 tests covering same-origin pass-through, cross-origin blocking, missing-origin blocking, allowlist matching, and Referer fallback.
- Applied `guardMutation()` to all mutation endpoints (holds POST, bookings POST, payments POST, payment webhook).

#### H-008: CSP enforced

**What:** The Content Security Policy header was `Content-Security-Policy-Report-Only`, meaning XSS payloads would execute despite having a policy defined.

**Change:** In `vercel.json`:
- Changed header key from `Content-Security-Policy-Report-Only` to `Content-Security-Policy`
- Removed `ws: wss:` from `connect-src` (WebSocket not needed in production)
- Added `upgrade-insecure-requests` directive

### MEDIUM

| ID | Title | Status | Files Changed | Tests Added |
|---|---|---|---|---|
| M-001 | Fixture modes appear real | ✅ FIXED | `src/pages/shared/CheckoutPage.tsx` | — |
| M-002 | `cancelBookingSeats` no coalesce | ✅ FIXED | `src/server/sgr/inventory.ts` | 5 (inventory.test.ts) |
| M-003 | `quoteFlight` label misleading | ✅ FIXED | `src/domain/pricing.ts` | — |
| M-004 | Ferry total outside `sumLines` | ✅ FIXED | `src/domain/pricing.ts` | — |
| M-005 | Duplicate error classes | ✅ FIXED | NEW: `src/server/errors.ts` + 3 patched files | — |
| M-008 | Phone prefix hardcoded +255 | ✅ FIXED | `src/data/locations.ts`, `src/pages/shared/CheckoutPage.tsx` | — |
| M-010 | Express total hardcoded 993 | ✅ FIXED | `src/server/sgr/layouts.ts` | — |
| M-011 | Duplicate React keys | ✅ FIXED | `src/components/train/CoachSeatMap.tsx` | — |

#### M-001: Fixture-backed modes gated from payment

**What:** Flights, stays, experiences, and ferry modes use mock data but were presented as bookable with a working Pay button.

**Change:** Added `isPayableMode` flag (true only for bus/train). Non-payable modes show "Coming Soon — This mode is not yet available for booking" and the Pay button is disabled. Users can still browse fixture data but cannot reach payment.

#### M-002: Cancel booking now coalesces AVAILABLE rows

**What:** `cancelBookingSeats` inserted new AVAILABLE rows without merging adjacent ones, causing table fragmentation over time.

**Change:** Extracted a shared `returnToAvailable()` helper used by both `releaseHold` and `cancelBookingSeats`. Both functions are now wrapped in transactions. `releaseHold` accepts a `finalStatus` parameter to distinguish expired vs released holds. Added `src/server/sgr/inventory.test.ts` with 5 tests covering release coalescing, cancel coalescing, gap preservation, and status transitions.

#### M-003: Flight quote label clarified

**What:** The label said "Base fare (N pax)" which implied per-passenger pricing, but `totalPrice` is already the party total.

**Change:** Label changed to `Fare (N pax, all segments)` with a doc comment explaining the convention.

#### M-004: Ferry total uses `sumLines`

**What:** `quoteFerrySailing` computed total manually instead of using `sumLines(lines)`, risking divergence if new line items were added.

**Change:** Replaced manual computation with `sumLines(lines)`.

#### M-005: Consolidated duplicate error utilities

**What:** `TripNotFoundError` existed in `search.ts` and `isUniqueViolation` was duplicated between `holds.ts` and `bookings.ts`.

**Change:** Created `src/server/errors.ts` with both utilities. Original modules re-export from the shared location so no call-site changes were needed.

#### M-008: Phone prefix derived from market config

**What:** The mobile money phone input hardcoded `+255` (Tanzania). Multi-market expansion would break.

**Change:** Added `dialCodeForMarket(countryCode)` function to `src/data/locations.ts` that looks up the dial code from the `COUNTRIES` array, falling back to `+255`. `CheckoutPage.tsx` now calls this with `market.countryCode`.

#### M-010: Express trainset total computed from layout

**What:** `buildExpressTrainset` hardcoded `totalSeats: 993` instead of computing from the layout array.

**Change:** Total is now computed as `coaches.reduce((sum, c) => sum + c.seats, 0)`. An `EXPRESS_TOTAL_SEATS` constant is retained as a verification check (assertion).

#### M-011: Duplicate React keys fixed

**What:** CoachSeatMap used `${row}-a` as the key for aisle cells, producing duplicates when multiple aisles exist in a row.

**Change:** Key changed to `${row}-a-${colIndex}` to guarantee uniqueness.

### LOW

| ID | Title | Status | Notes |
|---|---|---|---|
| L-002 | `pool: 'vmThreads'` for faster tests | ❌ REVERTED | Caused `SyntaxError` in `locations-dataset.test.ts` due to `readFileSync` at module scope being incompatible with `vmThreads` pool. Reverted to default `forks` pool. |

---

## New Files Created

| File | Purpose | Lines |
|---|---|---|
| `src/server/rate-limit.ts` | In-process sliding-window rate limiter | ~80 |
| `src/server/rate-limit.test.ts` | 7 tests for rate limiter | ~90 |
| `src/server/request-guard.ts` | Cross-origin mutation guard (CSRF) | ~50 |
| `src/server/request-guard.test.ts` | 8 tests for mutation guard | ~110 |
| `src/server/errors.ts` | Shared `TripNotFoundError` + `isUniqueViolation` | ~25 |
| `src/server/sgr/inventory.test.ts` | 5 tests for release/cancel coalescing | ~100 |

---

## Remaining Items (Not Fixed)

### Requires User Decision

| ID | Severity | Title | Blocker |
|---|---|---|---|
| C-001 | CRITICAL | Authentication stub | Choose provider: Keycloak (per ADR-0005), Supabase (dependency exists), or other |
| C-002 | CRITICAL | No admin/operator auth | Blocked on C-001 |
| H-002 | HIGH | `/api/holds` unauthenticated | Partially mitigated by H-006 rate limiting + H-007 CSRF guard. Full fix requires auth (C-001). |

### Should Fix (P1)

| ID | Severity | Title | Effort |
|---|---|---|---|
| M-009 | MEDIUM | Payment reconciliation cron | 1-2 days |
| M-014 | MEDIUM | Structured logging | 2-3 days |

### Operational Readiness (P2)

| ID | Severity | Title |
|---|---|---|
| — | — | CI/CD pipeline (GitHub Actions) |
| — | — | Error tracking (Sentry) |
| — | — | Database backup strategy |
| M-006 | MEDIUM | Pool limits (partially done) |
| M-013 | MEDIUM | Circuit breaker for ClickPesa |

### Maintainability (P3)

| ID | Severity | Title |
|---|---|---|
| H-005 | HIGH | Extract I18n to JSON files |
| H-004 | HIGH | Rename `amountMinor` → `amount` |
| M-012 | MEDIUM | Fix useEffect dependency warnings |

### Nice to Have (P4)

| ID | Severity | Title |
|---|---|---|
| L-001 | LOW | Favicon and PWA manifest |
| L-005 | LOW | robots.txt and sitemap |
| L-006 | LOW | Remove unnecessary pgcrypto |
| L-004 | LOW | Split ReceiptPrinter exports |
| M-015 | MEDIUM | Down migration support |

