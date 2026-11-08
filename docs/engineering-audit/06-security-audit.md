# 06 — Security Audit

**Audit date:** 2026-11-01  
**Perspective:** Application Security Engineer

---

## 1. Executive Summary

The application has **no production authentication or authorisation system**. This is the single most critical security finding. The `AuthContext.tsx` is an explicit stub that accepts any credentials, and there is no server-side session management. All other security controls — and several are well-implemented — are undermined by this gap.

**Severity distribution:** 2 CRITICAL, 4 HIGH, 3 MEDIUM

---

## 2. Authentication

### C-001: Authentication is a Stub (CRITICAL, CONFIRMED)

**File:** [`src/context/AuthContext.tsx`](file:///g:/OUTERBLOCKS/TRAVELAR/src/context/AuthContext.tsx#L89-L103)

```typescript
// Line 89-91: Password is ignored
const signInWithEmail = useCallback(async (email: string, _password: string) => {
  persistUser({ email, name: email.split('@')[0], provider: 'email' });
  return { error: null };
}, [persistUser]);

// Line 99-103: Provider login returns hardcoded user
const signInWithProvider = useCallback(async (provider: 'google' | 'apple') => {
  await delay(1000);
  const fakeEmail = provider === 'google' ? 'user@gmail.com' : 'user@icloud.com';
  persistUser({ email: fakeEmail, name: 'Travelar User', provider });
  return { error: null };
}, [persistUser]);
```

**State:** User identity is stored in `localStorage` (line 62) with no server validation. The comment at line 23-28 correctly states this is "never an authorisation boundary", but nothing else provides one.

**Impact:** Any script on the origin can read or overwrite the user. There is no password hashing, no session token, no server-side session store.

### C-002: No Admin/Operator Authentication (CRITICAL, CONFIRMED)

OIMS (Operator Inventory Management System) and HIMS (Hub Inventory Management System) pages exist in the frontend but have **zero access control**. Any visitor who navigates to the OIMS URL can:
- Create, modify, and delete routes
- Change fares
- Modify seat layouts
- Cancel bookings
- View all booking and payment data

The only "protected" endpoint is the sweep cron (`/api/internal/sweep`), which checks a static `SWEEP_SECRET` header — a shared secret, not per-user auth.

---

## 3. Authorisation & Access Control

### Guest Booking Tokens (Well-Implemented)

**File:** [`src/server/booking-access.ts`](file:///g:/OUTERBLOCKS/TRAVELAR/src/server/booking-access.ts)

The guest booking flow uses HMAC-SHA256 tokens correctly:
- Tokens are scoped to a single booking ID (line 35-40)
- Verification uses `timingSafeEqual` to prevent timing attacks (line 55)
- The secret is a required environment variable (line 19-24)

**Finding H-001:** The `BOOKING_ACCESS_SECRET` environment variable is not listed in `.env.example`, so fresh deployments will crash.

### Ticket Verification Tokens (Well-Implemented)

**File:** [`src/server/ticket-token.ts`](file:///g:/OUTERBLOCKS/TRAVELAR/src/server/ticket-token.ts)

- HMAC-SHA256 signed tokens with booking ID + PNR + timestamp
- Timing-safe comparison for verification
- Explicit expiry check

---

## 4. Input Validation

### H-003: SQL String Interpolation (HIGH, CONFIRMED)

**File:** [`src/server/search.ts`](file:///g:/OUTERBLOCKS/TRAVELAR/src/server/search.ts#L63)

```typescript
// Line 63 (approximate): limit interpolated into SQL template string
`...LIMIT ${limit}`
```

The value is sanitized to a clamped integer beforehand, so this is not exploitable today. However, it violates the codebase's own pattern of using `$n` parameterized queries everywhere else.

### Positive: Parameterized Queries Throughout

Every other SQL query in the codebase uses `$n` parameters:
- `src/server/bookings.ts` — 7 queries, all parameterized
- `src/server/payments.ts` — 12+ queries, all parameterized
- `src/server/sgr/inventory.ts` — 15+ queries, all parameterized
- `src/server/sgr/services.ts` — 4 queries, all parameterized

### Positive: HMAC Checksum Verification on Webhooks

**File:** [`src/routes/api.payments.clickpesa.ts`](file:///g:/OUTERBLOCKS/TRAVELAR/src/routes/api.payments.clickpesa.ts)

The ClickPesa webhook verifies the HMAC checksum before processing, using `timingSafeEqual`. This prevents forged payment confirmations.

---

## 5. API Security

### H-002: Unauthenticated Holds Endpoint (HIGH, CONFIRMED)

**File:** [`src/routes/api.holds.ts`](file:///g:/OUTERBLOCKS/TRAVELAR/src/routes/api.holds.ts)

```
POST /api/holds — No auth check, no rate limit
```

An attacker can:
1. Hold all seats on all trips with no intent to purchase
2. Seats are locked for the full TTL (configurable, typically 10-15 minutes)
3. Legitimate customers cannot book

### H-006: No Rate Limiting (HIGH, CONFIRMED)

No API endpoint has rate limiting. This applies to:
- `/api/holds` — inventory lockout
- `/api/bookings` — booking spam
- `/api/payments/start` — payment attempt spam
- `/api/payments/clickpesa` — webhook replay (though HMAC-signed)

### H-007: No CORS Configuration (HIGH, CONFIRMED)

No CORS headers are explicitly set. In the Vercel same-origin deployment this is masked, but:
- Any future API consumer from a different origin will be blocked
- If CORS is added permissively (`*`), all APIs become cross-origin callable

---

## 6. Content Security Policy

### H-008: CSP is Report-Only (HIGH, CONFIRMED)

**File:** [`src/routes/__root.tsx`](file:///g:/OUTERBLOCKS/TRAVELAR/src/routes/__root.tsx)

The CSP header exists and is well-crafted, but is set as `Content-Security-Policy-Report-Only`. This means:
- Violations are logged but not blocked
- XSS payloads will execute
- The policy provides zero actual protection

---

## 7. Secret Management

### Positive Findings
- `.env` is in `.gitignore` — secrets are not committed
- `.env.example` exists with placeholder values (though H-001: missing `BOOKING_ACCESS_SECRET`)
- Travelport config validates secrets have minimum length (line 65: `MIN_SECRET_LENGTH = 8`)
- ClickPesa adapter never logs the API key or checksum secret

### Concern
- `SWEEP_SECRET` is a static shared secret, not a per-user credential
- `CLICKPESA_CHECKSUM_SECRET` has no rotation mechanism

---

## 8. Data Exposure

### Positive: Payment Details Are Not Logged
The `clickpesa.ts` adapter explicitly avoids logging secrets (comment at line 9-10 of `travelport/config.ts`: "Nothing secret is logged").

### Concern: Error Detail Exposure
`CheckoutPage.tsx` line 447-448 shows `collectionDetail` to the user. In development mode, this can include provider-internal error messages that should not be shown to end users.

---

## 9. Dependency Vulnerabilities

No `npm audit` was run during this audit (requires network access). The project uses:
- `vite@^8.0.0-beta.1` — **beta** version of a build tool; not security-reviewed for production
- No lockfile pinning strategy documented
- No automated dependency scanning (Dependabot, Snyk) configured

---

## 10. Recommendations (Priority Order)

1. **Implement real authentication** (C-001, C-002) — blocks all operator security
2. **Add rate limiting** (H-006) — blocks DoS via holds/payment spam
3. **Enforce CSP** (H-008) — blocks XSS
4. **Add CORS configuration** (H-007) — blocks cross-origin attacks
5. **Authenticate the holds endpoint** (H-002) — blocks inventory lockout
6. **Fix SQL interpolation** (H-003) — eliminates the precedent
7. **Add `.env.example` entry** (H-001) — prevents deployment failures

