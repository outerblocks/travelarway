# Engineering Audit — Executive Summary

**Repository:** TRAVELAR  
**Audit Date:** 2026-11-01  
**Join re-inspection:** 2026-11-08 — see [repository-audit.md](./repository-audit.md). Production identity is still absent; guest payment/inventory patterns remain the strongest slice. **Not bank-level.**  
**Auditor:** Independent Engineering Team  
**Scope:** Full codebase — architecture, backend, frontend, database, security, APIs, performance, testing, DevOps, maintainability

---

## Overall Engineering Health: **GOOD — with caveats**

This is a well-designed, deliberately-engineered travel booking platform. The codebase demonstrates mature architecture thinking: proper transaction boundaries, correct financial integrity patterns, timing-safe cryptographic comparisons, careful separation of server and client code, and thoughtful domain modeling. The payment pipeline is one of the strongest implementations I've audited — it handles edge cases (inventory lost after payment, double-charge prevention, webhook idempotency, payment reversals) that most production systems get wrong.

That said, several significant issues must be addressed before this system can safely handle production traffic at scale.

---

## Critical Findings (P0): 0

No exploitable data-loss or financial-integrity defects were identified. The system's "fail closed" design philosophy is consistently applied.

---

## High-Impact Findings (P1): 6

| ID | Finding | Severity | Confidence |
|----|---------|----------|------------|
| H-001 | `BOOKING_ACCESS_SECRET` not in `.env.example` | HIGH | CONFIRMED |
| H-002 | No authentication on `/api/holds` — anonymous hold spam can exhaust inventory | HIGH | CONFIRMED |
| H-003 | Search `limit` interpolated into SQL string in `search.ts:63` | HIGH | CONFIRMED |
| H-004 | `amountMinor` naming mismatch — columns store major units, code says minor | HIGH | CONFIRMED |
| H-005 | I18nContext.tsx is 1383 lines / 100KB — unsustainable monolith | HIGH | CONFIRMED |
| H-006 | No rate limiting on any API endpoint | HIGH | CONFIRMED |

---

## Medium Findings (P2): 12

| ID | Finding | Category |
|----|---------|----------|
| M-001 | No CORS configuration on API routes | Security |
| M-002 | Ferry, flights, stays, experiences use client-side fixture pricing | Business Logic |
| M-003 | `isUniqueViolation` helper duplicated in 3 files | Code Quality |
| M-004 | Operator status not checked during booking (only trip status) | Business Logic |
| M-005 | CSP header set to Report-Only mode | Security |
| M-006 | No database connection draining on graceful shutdown | Performance |
| M-007 | Missing index on `payment(order_reference)` — reconciliation scans | Performance |
| M-008 | Supabase dependency unused in server code | Technical Debt |
| M-009 | Auth system (Supabase/Keycloak) referenced but not implemented | Incomplete |
| M-010 | `booking_status` enum in migration 0001 lacks `pending_payment` | Schema |
| M-011 | Singleton ClickPesa provider never invalidates on credential change | Integration |
| M-012 | No pagination on bus results or trip search | Scalability |

---

## Low Findings (P3): 8

| ID | Finding |
|----|---------|
| L-001 | `TripNotFoundError` class duplicated in `holds.ts` and `bookings.ts` |
| L-002 | Dead code: `outbox_event` table created but never used |
| L-003 | `durationLabel` function not handling negative or zero minutes |
| L-004 | Frontend `PaymentStatus` type diverges from server payment status enum |
| L-005 | `BookingStatus` type includes `draft` but schema has no such state |
| L-006 | `.env` present in `.gitignore` but `.env` file exists on disk |
| L-007 | `location.kind` check constraint missing `port` and `town` values in migration 0001 |
| L-008 | E2E tests use Chromium only — no cross-browser coverage |

---

## Remediation Status (2026-11-01)

| Finding | Status | Notes |
|---------|--------|-------|
| H-001 | ✅ FIXED | Added to .env.example |
| H-002 | ⚠️ MITIGATED | Rate limiting + CSRF guard applied; full fix requires auth (C-001) |
| H-003 | ✅ FIXED | Parameterized query |
| H-006 | ✅ FIXED | Sliding-window rate limiter on all 17 endpoints |
| H-007 | ✅ FIXED | Cross-origin mutation guard (CSRF) |
| H-008 | ✅ FIXED | CSP enforced |
| M-001 | ✅ FIXED | Fixture modes gated from payment |
| M-002 | ✅ FIXED | Cancel coalescing + shared helper |
| M-003 | ✅ FIXED | Flight quote label clarified |
| M-004 | ✅ FIXED | Ferry total uses sumLines |
| M-005 | ✅ FIXED | Shared errors.ts module |
| M-008 | ✅ FIXED | Phone prefix from market config |
| M-010 | ✅ FIXED | Express total computed from layout |
| M-011 | ✅ FIXED | Duplicate React keys resolved |

**New tests added:** 20 (across 3 new test files)  
**Post-remediation:** 24 files, 202 tests — ALL PASSING  
**See:** [16-remediation-log.md](./16-remediation-log.md) for full details.

---
## Production Readiness Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Correctness** | ★★★★☆ | Payment pipeline is excellent. Non-bus modes use fixture pricing. |
| **Security** | ★★★☆☆ | Token handling is strong. Missing rate limiting and CORS. No auth on holds. |
| **Reliability** | ★★★★☆ | Transaction boundaries correct. Graceful degradation patterns present. |
| **Data Integrity** | ★★★★★ | DB-level constraints enforce business rules. Ledger is append-only. |
| **Performance** | ★★★☆☆ | No pagination. Correlated subqueries in result queries. No caching. |
| **Scalability** | ★★★☆☆ | Modular monolith is correct choice. Missing indexes will become bottlenecks. |
| **Maintainability** | ★★★★☆ | Well-documented code. Clear module boundaries. Some large files. |
| **Testing** | ★★★☆☆ | Unit tests exist for critical paths. No integration tests against DB. |
| **Observability** | ★★☆☆☆ | Console logging only. No metrics, tracing, or structured logs. |
| **Documentation** | ★★★★☆ | Extensive ADRs and research docs. Missing setup README. |

---

## Recommended Next Actions

1. ~~**Add BOOKING_ACCESS_SECRET to .env.example**~~ — ✅ FIXED
2. ~~**Add rate limiting to /api/holds**~~ — ✅ FIXED (H-006)
3. ~~**Fix the limit SQL interpolation**~~ — ✅ FIXED (H-003)
4. **Document the `amountMinor` naming convention** — the columns actually store major units
5. ~~**Activate the CSP header**~~ — ✅ FIXED (H-008)
6. **Add an index on `payment(order_reference)`** — reconciliation queries scan without it

