# 03 — Backend Audit

**Audit date:** 2026-11-01  
**Perspective:** Senior Backend Engineer

---

## 1. Overall Assessment

The server-side codebase is **well-engineered for correctness**. Transaction boundaries, concurrency handling, and the payment lifecycle are implemented with the rigour expected of a system that handles real money. Code comments explain *why* decisions were made, not just what the code does.

**Grade: B+** — Strong implementation with specific issues around naming, error handling consistency, and missing server-side validation.

---

## 2. Payment Pipeline

### `src/server/payments.ts` (1065 lines)

**Strengths:**
- Idempotent confirmation keyed on `(provider, order_reference)` — a second webhook for the same payment is safely ignored
- `InventoryLostError` preserves refund obligation when seats expire during payment
- `FOR UPDATE` locks prevent concurrent payment confirmations from double-issuing
- Booking status lifecycle is strict: `pending_payment` → `issued` or `expired`
- Ledger entries are written atomically with booking status changes

**Findings:**

| ID | Finding | Severity |
|---|---|---|
| H-004 | `amountMinor` naming stores major units throughout | HIGH |
| M-009 | No reconciliation cron for unresolved payments | MEDIUM |
| M-013 | No circuit breaker for ClickPesa outages | MEDIUM |

### `src/server/payments/clickpesa.ts` (482 lines)

**Strengths:**
- Injectable `fetchImpl` enables complete testing without network calls
- Singleton provider prevents token-mint storms (the 429 bug mentioned in tests)
- Phone number normalization strips `+` prefix per ClickPesa's API contract
- Card payments correctly refuse non-USD currencies

**Findings:**
- Amount is sent as a string (`'58000'`) per ClickPesa's API requirement — correct

### `src/server/payments/checksum.ts` (76 lines)

**Correct:** HMAC-SHA256 computed over sorted, filtered fields. `timingSafeEqual` used for verification.

---

## 3. Booking Lifecycle

### `src/server/bookings.ts` (308 lines)

**Strengths:**
- Server-side pricing: the client sends intent, the server computes the price
- Passenger count validation: declared party must match searched party
- `FOR UPDATE` on the hold prevents concurrent booking commits
- Access token generated atomically with booking creation

**Findings:**
- No server-side validation of passenger names (empty strings accepted)
- No email format validation on `customerEmail`
- `customerPhone` is accepted as-is without MSISDN normalization (though `phone.ts` exists)

### `src/server/holds.ts` (107 lines)

**Strengths:**
- Idempotent on `holdKey` — retries return the existing hold
- `FOR UPDATE SKIP LOCKED` on seat claims prevents blocking

**Findings:**
- H-002: No authentication on the holds endpoint

### `src/server/expiry.ts` (126 lines)

**Correct implementation:**
- Sweeps `pending_payment` bookings past their `payment_due_at` deadline
- Updates status to `expired` and releases associated SGR holds
- Uses partial index `ix_booking_overdue` for efficient scans

---

## 4. SGR Inventory System

### `src/server/sgr/inventory.ts` (374 lines)

**Strengths:**
- Segment-based inventory model correctly handles partial-journey sales
- Exclusion constraint `sgr_seat_segments_no_overlap` is the authoritative double-sell guard
- All-or-nothing hold semantics — a failed seat rolls back the entire transaction
- Available-row coalescing in `releaseHold` prevents table fragmentation
- Comment at line 7-17 explicitly warns against check-then-insert patterns

**Findings:**

| ID | Finding | Lines |
|---|---|---|
| M-002 | `cancelBookingSeats` does not coalesce AVAILABLE rows | 356-374 |

The release path carefully merges adjacent AVAILABLE segments, but the cancellation path just inserts new ones. This is a copy-paste omission.

### `src/server/sgr/services.ts` (332 lines)

**Strengths:**
- Time zone handling is explicit: `AFRICA_DAR_UTC_OFFSET_HOURS = 3` with a comment explaining why UTC midnight would be wrong
- Station name resolution strips qualifiers ("SGR Station", "Main Station") to match the location table
- Fares are keyed on the passenger's actual stop pair, not the train's endpoints — preventing overcharging

**Findings:**
- L-008: UTC+3 is hardcoded (correct for Tanzania, fragile for expansion)

### `src/server/sgr/provider.ts` (114 lines)

**Well-designed abstraction:**
- `SgrInventoryProvider` interface with `ProviderCapabilities`
- Unknown modes throw rather than falling back — correct defensive behavior
- `resolveProvider` queries the trip's `inventory_mode` dynamically

### `src/server/sgr/read-models.ts` (272 lines)

**Correct:**
- Availability is computed per stop interval, not per seat — matching the segment model
- Overlap test uses `from_seq < to AND to_seq > from` — same half-open rule as the constraint
- Layout comes from the trip's `layout_snapshot`, not the live coach table — tickets match what was sold

---

## 5. Search and Seat Maps

### `src/server/search.ts` (365 lines)

**Finding H-003:** `limit` is interpolated into SQL via template literal. The value is sanitized to a clamped integer, but this violates the pattern.

**Otherwise correct:** Location search uses `ILIKE` with parameterized values. Results are paginated.

### `src/server/seat-map.ts` (225 lines)

**Correct:** Reads from the database, does not generate layout data. Parameterized queries throughout.

### `src/server/bus-results.ts` (235 lines)

**Correct:** Queries bus trips with availability. Returns structured results with fare information.

---

## 6. API Routes

### Route Summary

| Route | Method | Auth | Rate Limited | Findings |
|---|---|---|---|---|
| `/api/holds` | POST | ❌ | ❌ | H-002: unauthenticated |
| `/api/bookings` | POST | ❌ | ❌ | Validated by hold ownership |
| `/api/payments/start` | POST | Token | ❌ | Requires booking access token |
| `/api/payments/clickpesa` | POST | HMAC | ❌ | Webhook, checksum-verified |
| `/api/payments/callback` | GET | HMAC | ❌ | Redirect, checksum-verified |
| `/api/booking-status` | GET | Token | ❌ | Requires booking access token |
| `/api/verify-ticket` | POST | Token | ❌ | Ticket verification token |
| `/api/health` | GET | ❌ | ❌ | Correct: public |
| `/api/internal/sweep` | POST | Secret | ❌ | Shared secret header |

### Positive Pattern
- API routes are thin: they validate input, call server modules, and format responses
- Error handling returns structured JSON with `error` and `reason` fields
- HTTP status codes are correct (400, 404, 409, 500)

---

## 7. Error Handling

### Strengths
- Custom error classes (`SeatUnavailableError`, `HoldNotFoundError`, `PaymentNotEnabledError`, `UnsupportedCurrencyError`) provide typed error handling
- Constraint violations (23P01, 23505) are caught and translated to user-facing errors
- The payment engine distinguishes between "collection not started" (stay on checkout) and "booking failed" (show error)

### Weaknesses
- M-005: Duplicate error classes (`isUniqueViolation` in both `holds.ts` and `bookings.ts`)
- No central error handling middleware — each route has its own try/catch
- `console.warn` instead of structured logging for server errors
- Generic `catch (error)` blocks in some routes without type narrowing

---

## 8. Transaction Boundaries

**Correct throughout:**
- `withTransaction` helper ensures rollback on error
- Booking creation + hold confirmation + item insertion = one transaction
- Payment confirmation + booking status update + ledger entry = one transaction
- SGR hold + segment claim = one transaction (all-or-nothing for multi-seat holds)

**No concern about transaction scope leaks** — the `withTransaction` helper releases the client back to the pool on both success and failure.

---

## 9. Concurrency Safety

**Well-handled:**
- `FOR UPDATE` locks on holds prevent concurrent booking commits
- `FOR UPDATE SKIP LOCKED` in the expiry sweeper prevents blocking live traffic
- The exclusion constraint is the final arbiter of seat conflicts
- Idempotent hold creation on `holdKey` prevents duplicate holds from retries
- Idempotent payment confirmation on `(provider, order_reference)` prevents double-issue

**No race conditions identified** in the booking or payment paths.

