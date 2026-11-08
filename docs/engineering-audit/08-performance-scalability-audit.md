# 08 — Performance & Scalability Audit

**Audit date:** 2026-11-01  
**Perspective:** Performance and Scalability Engineer

---

## 1. Overall Assessment

The system is **appropriately scaled for its current load** (a small number of operators and routes in Tanzania). There are no egregious performance bottlenecks, but several patterns will become problematic under 10-100× growth.

**Grade: B-** — Correct for launch, but missing caching, connection pool tuning, and query batching that would be needed at scale.

---

## 2. Database Query Performance

### Hot Path Queries (Per User Request)

| Operation | Queries | Indexed | Concern |
|---|---|---|---|
| SGR service search | 1 + N×2 (availability + fare per trip) | ✅ | N+1 pattern; 10 trips = 21 queries |
| Bus results search | 1-2 | ✅ | Acceptable |
| Seat map load | 2 (trip + state) | ✅ | Acceptable; parallelized with `Promise.all` |
| Class availability | 2 (availability + fares) | ✅ | Acceptable |
| Seat hold | 2-4 per seat in transaction | ✅ | Sequential within transaction; unavoidable for correctness |
| Booking commit | 5-8 in transaction | ✅ | Acceptable |
| Booking status poll | 1-2 | ✅ | Acceptable |

### N+1 Concern: SGR Service Search

**File:** `src/server/sgr/services.ts` lines 186-262

```typescript
const services = await Promise.all(
  trips.rows.map(async (trip) => {
    const availability = await getClassAvailability({ ... });
    const fares = await query<...>(`select ... from app.sgr_fares ...`, [...]);
    ...
  }),
);
```

For each trip found, two queries are issued. With `Promise.all`, they execute concurrently across trips, but each trip still issues 2 serial queries. For 10 trips: 21 total queries (1 search + 10 availability + 10 fare lookups).

**Recommendation:** Batch the availability and fare queries into single queries that return results for all trips at once, then join in JavaScript.

### Missing Index

`sgr_trip_stops.station_id` is used in two JOIN conditions in the service search query but has no dedicated index. The table has a composite PK `(trip_id, seq)` which does not help with station lookups.

---

## 3. Connection Pool

**File:** `src/server/db.ts`

```typescript
const pool = new Pool({ connectionString: config.databaseUrl });
```

No explicit configuration for:
- `max` (defaults to 10 connections)
- `connectionTimeoutMillis` (defaults to 0 = no timeout)
- `idleTimeoutMillis` (defaults to 10000ms)
- `statement_timeout` (no server-side limit)

**Risk at scale:** Under high concurrency:
- 10 connections may be insufficient for parallel requests
- No connection timeout means a request will queue indefinitely
- No statement timeout means a slow query blocks a connection forever

**Recommendation:**
```typescript
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  statement_timeout: 10000,
});
```

---

## 4. Caching

**Current state: No caching anywhere.**

### Opportunities

| Data | Cache TTL | Justification |
|---|---|---|
| Location search results | 1 hour | Location data changes rarely |
| Class availability | 30 seconds | Changes only on booking/hold |
| SGR fares | 5 minutes | Changes only via admin |
| Coach layouts | 1 hour | Changes only on publish |
| Service search results | 1 minute | New trips added rarely |

### Recommended Approach

For the current deployment (Vercel serverless), in-memory caching is ephemeral. Options:
1. **Vercel KV (Redis)** for shared cache across serverless instances
2. **HTTP Cache-Control headers** for CDN-cacheable read endpoints
3. **In-process LRU cache** for layout snapshots (read once per trip, immutable)

---

## 5. Network & API Performance

### Client-Server Round Trips

A full booking flow requires:

| Step | Requests | Critical Path |
|---|---|---|
| Search | 1 | `/api/sgr/search` or `/api/bus-results` |
| Seat map | 1 | `/api/sgr/trips/:id/seats` |
| Hold seats | 1 | `POST /api/holds` |
| Server quote | 1 | `/api/sgr/trips/:id/quote` |
| Create booking | 1 | `POST /api/bookings` |
| Start payment | 1 | `POST /api/payments/start` |
| Poll status | N | `GET /api/booking-status` (polling) |

**Total: 6 requests + N polls** — reasonable for the flow complexity.

### Response Size

- Seat map JSON (8-car EMU, 583 seats): ~15-20KB — acceptable
- Search results (5 services × 3 classes): ~5KB — acceptable
- I18n context: ~100KB inline — **too large for SSR** (H-005). This is loaded on every page, even if the user speaks English.

---

## 6. Horizontal Scalability

### Can the System Scale Horizontally?

| Component | Scalable? | Notes |
|---|---|---|
| Vercel serverless functions | ✅ Yes | Stateless, scales automatically |
| PostgreSQL | ⚠️ Partially | Single writer; read replicas possible but not configured |
| ClickPesa adapter | ✅ Yes | Stateless except token cache; singleton per instance is fine |
| In-memory state | ✅ N/A | No in-memory shared state; all state is in the database |

### Bottleneck: PostgreSQL Write Contention

The exclusion constraint on `sgr_seat_segments` serializes concurrent hold attempts for overlapping seats. This is **correct and unavoidable** — it's the mechanism that prevents double-selling. Under very high concurrency (e.g. hundreds of users trying to hold the same seat), the transaction retry rate will increase.

**Mitigation:** The current design is correct for the expected load (hundreds of bookings per day). For thousands of concurrent users, consider:
- Connection pooling via PgBouncer
- Read replicas for search and availability queries
- Queue-based hold processing (trade latency for throughput)

---

## 7. Memory and CPU

### Server-Side

- No large in-memory data structures
- Layout generators (`layouts.ts`) compute deterministically and are only called during seeding, not per request
- JSON parsing of `layout_snapshot` (up to ~50KB per trip) is done per seat map request — acceptable

### Client-Side

- I18n dictionary (~100KB) is loaded once and held in React context
- Seat map state: up to 583 seat objects in React state — acceptable
- No identified memory leaks (no event listeners without cleanup, no orphaned timers in `CheckoutPage` — timers are cleaned up via `clearTimers()`)

---

## 8. Background Processing

### Expiry Sweeper (`/api/internal/sweep`)

- Triggered externally (cron or Vercel cron job)
- Uses `FOR UPDATE SKIP LOCKED` to avoid blocking live traffic ✅
- Processes expired holds and bookings sequentially
- No concern for the current volume

### Missing Background Jobs

| Job | Need | Impact |
|---|---|---|
| Payment reconciliation | HIGH | Detect payments confirmed by ClickPesa but not recorded (lost webhooks) |
| Stale hold cleanup | LOW | The sweeper already handles this |
| Analytics aggregation | LOW | No analytics system exists yet |

---

## 9. Rate Limiting

**Finding H-006: No rate limiting on any endpoint.**

### Risk Assessment

| Endpoint | Abuse Vector | Impact |
|---|---|---|
| `POST /api/holds` | Inventory lockout | All seats blocked |
| `POST /api/bookings` | Booking spam | Database bloat |
| `POST /api/payments/start` | Payment attempt spam | ClickPesa rate limit hit |
| `GET /api/sgr/search` | Search flooding | Database load |

### Recommendation

Add per-IP rate limiting:
- `/api/holds`: 10 requests per minute per IP
- `/api/payments/start`: 5 requests per minute per IP
- Search endpoints: 30 requests per minute per IP

---

## 10. Recommendations (Priority Order)

1. **Add rate limiting** (H-006) — prevents DoS and inventory lockout
2. **Configure connection pool** (M-006) — `max`, `connectionTimeoutMillis`, `statement_timeout`
3. **Batch SGR search queries** — eliminate N+1 for availability and fares
4. **Add index on `sgr_trip_stops(station_id)`** — supports core search JOIN
5. **Add caching for read models** — fares, layouts, location search
6. **Add payment reconciliation cron** (M-009) — detect lost webhooks
7. **Extract I18n to lazy-loaded files** (H-005) — reduce initial page weight

