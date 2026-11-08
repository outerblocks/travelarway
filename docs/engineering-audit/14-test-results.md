# 14 — Test Results

**Audit date:** 2026-11-01  
**Environment:** Windows, Node.js, PostgreSQL 18 (not connected for unit tests)  
**Last verified:** 2026-11-01T22:39Z (post-remediation)

---

## 1. TypeScript Type Check

```
$ npm run typecheck
(exit code 0 — no output)
```

**Result: ✅ PASS — 0 type errors**

---

## 2. ESLint

```
$ npx eslint .
✖ 17 problems (0 errors, 17 warnings)
```

**Result: ✅ PASS — 0 errors**

### Warning Breakdown

| Rule | Count | Files |
|---|---|---|
| `react-refresh/only-export-components` | 13 | PassengerForm, ReceiptPrinter (×7), AppContext, AuthContext, I18nContext, router (×2) |
| `react-hooks/exhaustive-deps` | 3 | BusBookingPage, BusReviewPage, FlightBookingPage |
| `react-refresh/only-export-components` (move) | 1 | ReceiptPrinter |

All warnings are minor:
- `react-refresh` warnings are cosmetic — co-exporting hooks alongside components does not affect production builds
- `exhaustive-deps` warnings are intentional omissions to prevent unnecessary effect re-runs (common React pattern), though they should be annotated with `// eslint-disable-next-line` and a comment explaining why

---

## 3. Unit Tests (Vitest)

### Pre-Remediation Baseline

```
Test Files  21 passed (21)
     Tests  182 passed (182)
  Duration  57.95s
```

### Post-Remediation (Final)

```
$ npx vitest run

 ✓ src/components/search/SearchForm.test.tsx (13 tests)
 ✓ src/pages/shared/CheckoutPage.test.tsx (9 tests)
 ✓ src/pages/shared/ConfirmationPage.test.tsx (6 tests)
 ✓ src/pages/train/TrainResultsPage.test.tsx (3 tests)
 ✓ src/pages/train/TrainBookingPage.test.tsx (5 tests)
 ✓ src/domain/search.test.ts (18 tests)
 ✓ src/server/request-guard.test.ts (8 tests)            ← NEW
 ✓ src/components/train/CoachSeatMap.test.tsx (6 tests)
 ✓ src/server/sgr/layouts.test.ts (9 tests)
 ✓ src/pages/bus/BusResultsPage.test.tsx (4 tests)
 ✓ src/utils/format.test.ts (20 tests)
 ✓ src/server/booking-access.test.ts (6 tests)
 ✓ src/context/AuthContext.test.tsx (8 tests)
 ✓ src/server/payments/clickpesa.test.ts (10 tests)
 ✓ src/server/payments/checksum.test.ts (8 tests)
 ✓ src/server/rate-limit.test.ts (7 tests)                ← NEW
 ✓ src/context/AppContext.test.tsx (6 tests)
 ✓ src/domain/pricing.test.ts (19 tests)
 ✓ src/server/sgr/inventory.test.ts (5 tests)             ← NEW
 ✓ src/server/locations-dataset.test.ts (8 tests)
 ✓ src/server/payments/phone.test.ts (5 tests)
 ✓ src/components/train/coach-geometry.test.ts (10 tests)
 ✓ src/data/operations.test.ts (5 tests)
 ✓ src/server/payments/attempt-status.test.ts (4 tests)

 Test Files  24 passed (24)
      Tests  202 passed (202)
   Start at  22:38:13
   Duration  64.17s
```

**Result: ✅ PASS — 202/202 tests passing across 24 files**

### Delta from Baseline

| Metric | Before | After | Change |
|---|---|---|---|
| Test files | 21 | 24 | +3 new files |
| Tests | 182 | 202 | +20 new tests |
| Failures | 0 | 0 | No regressions |

### New Test Files Added During Remediation

| File | Tests | Coverage Area | Finding |
|---|---|---|---|
| `src/server/rate-limit.test.ts` | 7 | Sliding-window rate limiter: basic limiting, window expiry, per-client isolation, custom limits, 429 response headers | H-006 |
| `src/server/request-guard.test.ts` | 8 | Cross-origin mutation guard: same-origin pass-through, cross-origin blocking, missing-origin blocking, allowlist matching, Referer fallback | H-007 |
| `src/server/sgr/inventory.test.ts` | 5 | Release/cancel seat coalescing: adjacent merge, gap preservation, status transitions, transaction wrapping | M-002 |

### Test Warnings (non-fatal)

| Warning | File | Concern |
|---|---|---|
| `Not implemented: Window's scrollTo()` | Multiple component tests | jsdom limitation, not a code defect |
| Duplicate React key `1-3` | `CoachSeatMap.test.tsx` | **M-011: Fixed** — aisle cell keys now include `colIndex` |

### Test Coverage By Module

| Module | Test File | Tests | Coverage Area |
|---|---|---|---|
| Rate limiting | `rate-limit.test.ts` | 7 | Sliding-window, per-client, 429 response |
| Request guard | `request-guard.test.ts` | 8 | CSRF, origin checking, Referer fallback |
| SGR inventory | `inventory.test.ts` | 5 | Seat release/cancel coalescing |
| Payment wire format | `clickpesa.test.ts` | 10 | USSD push, card, preview, status, lifecycle |
| Payment checksum | `checksum.test.ts` | 8 | HMAC signing and verification |
| Phone normalization | `phone.test.ts` | 5 | MSISDN format, country code strip |
| Attempt status | `attempt-status.test.ts` | 4 | Provider status mapping |
| Booking access | `booking-access.test.ts` | 6 | Token generation and verification |
| SGR layouts | `layouts.test.ts` | 9 | Coach geometry invariants |
| Coach geometry | `coach-geometry.test.ts` | 10 | Grid rendering |
| Domain pricing | `pricing.test.ts` | 19 | Quote calculations, all modes |
| Domain search | `search.test.ts` | 18 | Location alias matching |
| Location dataset | `locations-dataset.test.ts` | 8 | Seed data integrity |
| Operations | `operations.test.ts` | 5 | OIMS operational store |
| Format utils | `format.test.ts` | 20 | Currency, date, duration formatting |
| SearchForm UI | `SearchForm.test.tsx` | 13 | Multi-modal form rendering |
| CheckoutPage UI | `CheckoutPage.test.tsx` | 9 | Payment flow, error states, "Coming Soon" gate |
| AppContext | `AppContext.test.tsx` | 6 | State management |
| AuthContext | `AuthContext.test.tsx` | 8 | Stub auth lifecycle |
| BusResultsPage | `BusResultsPage.test.tsx` | 4 | Error states, retry |
| TrainBookingPage | `TrainBookingPage.test.tsx` | 5 | Seat map interaction, hold flow |
| TrainResultsPage | `TrainResultsPage.test.tsx` | 3 | Service listing, return selection |
| ConfirmationPage | `ConfirmationPage.test.tsx` | 6 | Ticket rendering, QR code |
| CoachSeatMap | `CoachSeatMap.test.tsx` | 6 | Seat rendering, selection |

---

## 4. E2E Tests (Playwright)

Not executed — requires a running server and database connection. E2E specs exist:

```
e2e/
  bus-booking-flow.spec.ts
  bus-results-page.spec.ts
  confirmation-page.spec.ts
  homepage.spec.ts
  search-form.spec.ts
  train-booking-flow.spec.ts
```

Visual regression snapshots are stored in `e2e/screenshots/`.

---

## 5. Test Quality Assessment

### Strengths
- Payment wire format tests pin exact request/response shapes against ClickPesa's API contract
- Golden-value pricing tests prevent fare calculation drift across modes
- Layout invariant tests catch seat-numbering gaps and grid collisions
- Component tests verify real user flows (seat selection → hold → review)
- **NEW:** Rate limiting and CSRF guard have comprehensive unit tests
- **NEW:** Inventory coalescing logic is tested for correctness

### Gaps (see 09-testing-quality-audit.md)
- No integration tests against a real database
- No tests for `payments.ts` (the orchestrator) — only the adapter
- No tests for `bookings.ts`, `holds.ts`, `expiry.ts`, `ledger.ts`, `search.ts`
- No tests for any API route handler
- No tests for checkout flow error paths
- No load/stress tests
- No security-specific tests (injection, auth bypass)
