# 11 — Maintainability & Technical Debt

**Audit date:** 2026-11-01  
**Perspective:** Technical Debt and Maintainability Specialist

---

## 1. Overall Assessment

The codebase demonstrates **unusually high readability and intentional design**. Comments explain *why* decisions were made, naming is descriptive, and module boundaries are clear. The primary technical debts are the I18n monolith, the stub authentication system, and the fixture data for non-bus/train modes.

**Grade: B+** — Well-maintainable code with known structural debts that are documented in the codebase itself.

---

## 2. Code Quality Metrics

| Metric | Value | Assessment |
|---|---|---|
| TypeScript errors | 0 | ✅ Excellent |
| ESLint errors | 0 | ✅ Excellent |
| ESLint warnings | 17 | ✅ All minor (react-refresh, exhaustive-deps) |
| Test pass rate | 182/182 (100%) | ✅ Excellent |
| Largest file | `I18nContext.tsx` (1383 lines) | ⚠️ H-005 |
| Average server module | ~200 lines | ✅ Good |
| Comment quality | Explanatory (why, not what) | ✅ Excellent |

---

## 3. Readability

### Strengths

1. **Comments explain business decisions:** Nearly every server module has block comments explaining why a particular approach was chosen. Example from `sgr/inventory.ts` line 7-17:

   > "The tempting alternative — read the segments, decide in JavaScript, then write — is wrong under concurrency... Nothing in this file does a check-then-insert."

2. **Variable naming is descriptive:** `holdSeatsInInventory` (aliased import to avoid confusion with method name), `placeNameFromLabel` (what it does, not how), `InventoryLostError` (what happened).

3. **Functions are single-purpose:** Most functions do one thing. The payment engine (`payments.ts`) is the longest at 1065 lines, but it covers the full lifecycle with each phase in a clearly named function.

4. **Error messages are machine-readable:** `'seats_unavailable'`, `'hold_not_found'`, `'fare_unavailable'` — not human prose in error objects.

### Concerns

1. **`payments.ts` at 1065 lines** could benefit from splitting into `create.ts`, `confirm.ts`, `start.ts`, etc. — but the current structure is readable.

2. **`CheckoutPage.tsx` at 830 lines** has a 160-line `handlePay` function that could be split into `createBooking()` and `startPayment()`.

---

## 4. Naming Conventions

### Consistent Patterns

| Pattern | Example | Used Consistently |
|---|---|---|
| Server modules | `snake-case.ts` | ✅ |
| React components | `PascalCase.tsx` | ✅ |
| Database columns | `snake_case` | ✅ |
| TypeScript interfaces | `PascalCase` | ✅ |
| Constants | `UPPER_SNAKE_CASE` | ✅ |
| API routes | `api.resource.action.ts` | ✅ |

### Naming Issue

**H-004: `amountMinor` misnomer** — Used throughout the codebase to store major currency units. The name implies minor units (cents/senti), but the values are whole-unit amounts (e.g. 58000 TZS, not 5800000). This is the highest-impact naming issue in the codebase.

---

## 5. Code Organisation

### Module Structure (Clean)

```
src/
  server/           # Server-side business logic
    sgr/             # SGR-specific modules
    payments/        # Payment adapter and utilities
    travelport/      # Travelport config (not yet wired)
  domain/            # Shared domain logic (pricing, search, passengers)
  context/           # React contexts (app state, auth, i18n)
  pages/             # Page components by mode
    bus/
    train/
    ferry/
    flights/
    stays/
    experiences/
    shared/          # Cross-mode pages (checkout, confirmation)
  components/        # Reusable UI components
    search/
    train/
    shared/
  routes/            # TanStack Start route definitions + API routes
  hooks/             # Custom React hooks
  data/              # Static datasets and fixture data
  types/             # TypeScript type definitions
  utils/             # Formatting and utility functions
```

This structure is logical and easy to navigate. A new developer can find any module within seconds.

---

## 6. Technical Debt Inventory

### Structural Debts

| ID | Debt | Origin | Effort | Impact if Ignored |
|---|---|---|---|---|
| H-005 | I18n monolith (100KB inline) | Organic growth | Medium (2-3 days) | Merge conflicts, slow page loads, impossible translation handoff |
| C-001 | Stub authentication | Deferred design decision | Large (1-2 weeks) | No access control in production |
| M-001 | Fixture data for non-bus/train modes | Incremental product development | Medium per mode | Users may book mock services and pay real money |
| H-004 | `amountMinor` naming confusion | Early naming decision | Medium (1-2 days) | 100x overcharge if a developer trusts the name |

### Code Duplication

| Duplication | Files | Effort to Fix |
|---|---|---|
| `isUniqueViolation` helper | `holds.ts`, `bookings.ts` | 30 minutes |
| `TripNotFoundError` equivalent | `search.ts`, `sgr/inventory.ts`, `sgr/provider.ts` | 1 hour |
| `formatCurrency` usage patterns | Multiple pages | 30 minutes (already mostly consolidated in `domain/money.ts`) |

### Dead Code

| Item | Location | Status |
|---|---|---|
| Supabase dependency | `package.json` | Listed but never imported. Remove. |
| `delay()` function | `AuthContext.tsx:68-70` | Only used to fake a provider login delay. Remove when auth is real. |

### Deprecated Patterns

| Pattern | Where | Replacement |
|---|---|---|
| Legacy train pricing from fixtures | `domain/pricing.ts:217-238` | SGR flow uses server-side `quoteSgrClass` |
| `TRAIN_SERVICES` / `TRAIN_RETURN_SERVICES` fixtures | `data/mockData.ts` | Database-driven SGR services |

The code itself documents this: comment at `pricing.ts:218-221`:
> "Superseded for the SGR flow... This branch stays for callers that have not migrated and must not be used for a new booking path."

---

## 7. Abstraction Quality

### Good Abstractions

| Abstraction | Purpose | Quality |
|---|---|---|
| `SgrInventoryProvider` interface | Swap between allocated block / push sync / live verify | ✅ Well-designed, capability-based |
| `withTransaction` helper | Database transaction lifecycle | ✅ Clean, error-safe |
| `ClickPesaProvider` class | Payment adapter with injectable fetch | ✅ Testable, singleton |
| `quoteForBooking` | Unified pricing across modes | ✅ Single source of truth |
| `formatMoney` / `symbolFor` | Currency display | ✅ Centralised |

### Missing Abstractions

| Gap | Current State | Impact |
|---|---|---|
| No central error handler | Each route has its own try/catch | Inconsistent error responses |
| No middleware layer | Auth, rate limiting, logging per-route | Code duplication for cross-cutting concerns |
| No data access layer | Raw `query()` calls in server modules | Harder to add caching, logging, or connection routing |

---

## 8. Documentation

### In-Code Documentation (Excellent)

- Every migration has a multi-line narrative comment explaining the business reason
- Server modules have block comments at the top explaining design decisions
- Functions that make non-obvious choices have inline comments explaining why
- Known limitations are documented where they occur (e.g. the 583 vs 589 seat count discrepancy in `layouts.ts`)

### External Documentation

| Doc | Exists | Quality |
|---|---|---|
| `README.md` | ✅ | Not audited (root README) |
| `docs/` directory | ✅ | Extensive: engineering governance, research bundle, ADRs |
| ADRs | ✅ | Architecture Decision Records present |
| API documentation | ❌ | No OpenAPI/Swagger spec |
| Deployment guide | ❌ | No runbook |
| Local development setup | ❌ | No docker-compose or setup script |

---

## 9. Future Maintenance Cost

### Low-Cost Areas
- Adding a new bus operator (data-driven) ✅
- Adding a new SGR corridor (data-driven) ✅
- Adding a new payment provider (adapter pattern) ✅
- Adding a new seat class (lookup table) ✅

### High-Cost Areas
- Adding a new language (requires editing 100KB I18n file) ❌
- Adding operator authentication (no foundation exists) ❌
- Adding a new transport mode with live inventory (requires server modules, DB schema, API routes) ⚠️
- Renaming `amountMinor` (requires migration + find-and-replace across entire codebase) ⚠️

---

## 10. Recommendations

1. **Extract I18n to JSON files** (H-005) — highest ROI for maintainability
2. **Consolidate duplicate error classes** (M-005) — `src/server/errors.ts`
3. **Add a middleware layer** — for auth, rate limiting, logging
4. **Rename `amountMinor` to `amount`** (H-004) — with a database migration
5. **Remove unused Supabase dependency** — clean up `package.json`
6. **Add OpenAPI specification** — enables automated documentation and client generation
7. **Split `payments.ts`** into create/confirm/start modules when next modified
8. **Gate fixture-backed modes** behind a feature flag or "Coming Soon" label

