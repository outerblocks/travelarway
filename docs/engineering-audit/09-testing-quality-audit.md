# 09 — Testing & Quality Audit

**Audit date:** 2026-11-01  
**Perspective:** QA and Test Automation Engineer

---

## 1. Overall Assessment

The test suite is **targeted and well-designed** — it covers the highest-risk areas (payment wire format, pricing calculations, layout geometry) with pin-down tests that would catch real regressions. The main weakness is **scope**: there are no integration tests against a real database, and the server-side orchestration modules (`payments.ts`, `bookings.ts`, `expiry.ts`) have no test coverage.

**Grade: B-** — Good where it exists; gaps in coverage for the most critical flows.

---

## 2. Test Inventory

### Unit Tests (Vitest) — 21 files, 182 tests ✅

| Category | File | Tests | What It Covers |
|---|---|---|---|
| **Payments** | `clickpesa.test.ts` | 10 | Wire format, signing, status mapping, lifecycle |
| | `checksum.test.ts` | 8 | HMAC signing and verification |
| | `phone.test.ts` | 5 | MSISDN normalization |
| | `attempt-status.test.ts` | 4 | Provider → internal status mapping |
| **Domain** | `pricing.test.ts` | 19 | All quote functions, golden values |
| | `search.test.ts` | 18 | Location alias matching, regression for F3 |
| **Server** | `booking-access.test.ts` | 6 | Token generation and verification |
| | `locations-dataset.test.ts` | 8 | Seed data integrity |
| | `layouts.test.ts` | 9 | Coach geometry, seat count invariants |
| **Frontend** | `SearchForm.test.tsx` | 10 | Multi-modal form rendering |
| | `CoachSeatMap.test.tsx` | 6 | Seat rendering, selection |
| | `coach-geometry.test.ts` | 10 | Grid layout calculations |
| | `AppContext.test.tsx` | 6 | State management |
| | `AuthContext.test.tsx` | 8 | Stub auth lifecycle |
| | `BusResultsPage.test.tsx` | 4 | Error states, retry |
| | `TrainBookingPage.test.tsx` | 5 | Seat map interaction, hold flow |
| | `TrainResultsPage.test.tsx` | 3 | Service listing, return selection |
| | `ConfirmationPage.test.tsx` | 6 | Ticket rendering, QR code |
| **Utils** | `format.test.ts` | 20 | Currency, date, duration formatting |
| | `operations.test.ts` | 5 | OIMS operational store |

### E2E Tests (Playwright) — 6 spec files (not executed)

| File | Purpose |
|---|---|
| `bus-booking-flow.spec.ts` | Full bus booking lifecycle |
| `bus-results-page.spec.ts` | Search results rendering |
| `confirmation-page.spec.ts` | Ticket confirmation display |
| `homepage.spec.ts` | Landing page |
| `search-form.spec.ts` | Search form interactions |
| `train-booking-flow.spec.ts` | Full train booking lifecycle |

Visual regression snapshots exist in `e2e/screenshots/`.

---

## 3. Test Quality

### Strengths

1. **Golden-value pricing tests** (`pricing.test.ts`): Every quote function is tested with specific expected amounts. A fare rule change that alters the arithmetic will fail here. The tests pin the same calculation that three different UI surfaces read, preventing drift.

2. **Wire-format payment tests** (`clickpesa.test.ts`): Tests verify the exact request body, endpoint path, and checksum of ClickPesa API calls. A protocol change is caught immediately. The injectable `fetchImpl` means no network calls, no money movement.

3. **Layout invariants** (`layouts.test.ts`): Coach geometry is tested against operator-published seat counts (39, 90, 74, 56, 90, 74, 90, 70 for EMU). Tests verify contiguous numbering, no grid cell overlaps, and correct total counts.

4. **Regression tests** (`search.test.ts`): Explicitly labelled as "F3 regression" — they pin the fix for a bug where search returned zero results because Location IDs and display names did not match.

5. **Component interaction tests** (`TrainBookingPage.test.tsx`): Full user flows including seat selection → API call → hold → review navigation. Uses MSW-style mocking of fetch responses.

### Weaknesses

1. **No server module tests:** `payments.ts` (1065 lines, the most complex module) has zero test coverage. Neither do `bookings.ts`, `holds.ts`, `expiry.ts`, `ledger.ts`, `search.ts`, or `seat-map.ts`.

2. **No database integration tests:** All server tests mock the database layer. There are no tests that verify queries return correct results against a real PostgreSQL instance.

3. **No API route handler tests:** The thin route handlers (`src/routes/api.*.ts`) are not tested. Validation logic, HTTP status codes, and error responses are untested.

4. **No negative/edge case tests for:**
   - Concurrent hold attempts for the same seat
   - Payment webhook with invalid checksum
   - Expired holds during booking commit
   - Database constraint violations
   - Pool exhaustion / connection timeout

5. **No load/stress tests:** No k6, Artillery, or similar tool for simulating concurrent users.

6. **No security tests:** No tests for SQL injection, XSS, CSRF, or auth bypass.

---

## 4. Coverage Gaps by Business Risk

| Business Risk | Test Coverage | Gap |
|---|---|---|
| **Double-selling a seat** | ❌ No integration test | The exclusion constraint is the guard, but it's never tested under concurrency |
| **Overcharging a customer** | ✅ Pricing golden values | Server-side pricing is tested; ClickPesa amount format is tested |
| **Lost payment (webhook failure)** | ❌ No test | No test simulates a webhook arriving after the booking has expired |
| **Seat hold expiry** | ❌ No test | `expiry.ts` has no unit or integration tests |
| **Payment with wrong amount** | ❌ No test | No test verifies the server rejects a payment amount mismatch |
| **Concurrent booking** | ❌ No test | No test verifies two users cannot book the same seat |
| **Invalid passenger data** | ❌ No test | No test for empty names, malformed emails, or invalid phone numbers |

---

## 5. Test Infrastructure

### Vitest Configuration

```typescript
// vitest.config.ts
environment: 'jsdom',
setupFiles: ['./src/test/setup.ts'],
```

**Finding L-002:** Each test file creates a new jsdom environment (21 instances, 63% of total test time). Vitest recommends `pool: 'vmThreads'` to reduce this overhead.

### Playwright Configuration

- Browsers: Chromium, Firefox, WebKit
- Visual regression via screenshot comparison
- Requires a running server (`npm run dev` or `npm run build && npm start`)

---

## 6. Test Warning

### M-011: Duplicate React Key

```
stderr: Encountered two children with the same key, `1-3`.
```

This warning appears during `CoachSeatMap.test.tsx`. It indicates that two seat cells in coach 1 share the same React key, which can cause:
- Incorrect component reconciliation
- Seat state applied to the wrong cell
- Lost user selections

---

## 7. Recommended Test Additions

### P0 (Critical Path)

1. **Integration test: double-sell prevention** — two concurrent hold requests for the same seat, one must fail
2. **Integration test: payment lifecycle** — create booking → start payment → webhook → verify issued status
3. **Integration test: hold expiry** — create hold → wait for TTL → verify seats released

### P1 (High Priority)

4. **Unit test: `payments.ts` orchestrator** — mock the adapter, verify booking/payment/ledger state transitions
5. **Unit test: `bookings.ts` commit** — verify passenger validation, hold confirmation, access token generation
6. **API route tests** — verify status codes, error responses, and input validation for all 14 routes

### P2 (Medium Priority)

7. **Load test:** 50 concurrent users booking on the same train
8. **Security test:** Invalid HMAC on webhook, SQL injection attempts on search
9. **Edge case tests:** Zero passengers, negative amounts, past dates, duplicate booking commits

### P3 (Nice to Have)

10. **Visual regression for seat maps** — screenshot comparison for all layout kinds
11. **Contract tests for ClickPesa** — pin the API schema version
12. **Mutation testing** — verify test strength with Stryker or similar

