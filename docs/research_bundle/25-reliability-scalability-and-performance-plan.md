# 25 — Reliability, Scalability and Performance Plan

**Status:** Planning model, not a capacity forecast or committed SLA. **As of:** 23 October 2026.

## 1. Define “100 million users” before sizing

The owner ambition is to support at least 100 million users long-term. This is not equivalent to 100 million concurrent users. Capacity must be described by registered accounts, monthly/daily active users, concurrent sessions, searches per second, price checks, booking attempts, confirmed bookings, provider requests, payment events, notification sends, inventory contention and geographic distribution.

The scenarios below are **illustrative engineering test envelopes only**, not Tanzania/Africa market forecasts. Replace the values with telemetry from pilot routes and validated growth assumptions.

| Scenario | Registered-user ambition (context only) | Monthly active users used for test model | Searches per active user/month | Monthly searches | Mean search rate (30-day month) | 10x peak test target |
|---|---:|---:|---:|---:|---:|---:|
| Pilot | 100k | 100k | 10 | 1 million | ~0.39 req/s | ~4 req/s |
| Growth | 10 million | 1 million | 20 | 20 million | ~7.7 req/s | ~77 req/s |
| Large | 100 million registered as long-term context | 10 million | 30 | 300 million | ~116 req/s | ~1,160 req/s |

Formula: monthly searches = monthly active users × searches per active user/month. Mean rate = monthly searches ÷ (30 × 24 × 60 × 60). Peak envelope = mean × assumed peak factor. Search requests may fan out to multiple providers; provider-call load can be several times incoming searches and is constrained by provider quotas/contract.

Checkout/booking attempts must be modelled separately. Test configurable funnel assumptions, not asserted conversion forecasts. If checkout begins for 3%, 5% and 8% of the pilot/growth/large scenario searches respectively, the monthly checkout starts would be 30,000; 1,000,000; and 24,000,000. These percentages are intentionally illustrative and must be replaced with observed funnel metrics. “Search rate” alone cannot size inventory writes, provider ticketing, PSP events or ledger throughput.

## 2. Workload classes

1. **Read-heavy discovery:** catalog, routes, stops, properties, content; candidate for caching after license/expiry review.
2. **Fresh-availability queries:** provider requests that may fan out; quota-aware, timed, partial-result aware and price/availability freshness labelled.
3. **Inventory writes:** bus seat/segment claims and ferry capacity; consistency over raw throughput. Requires concurrency tests by hot departure and segment overlaps.
4. **Booking orchestration:** price check, supplier reservation, payment, ticket issue and compensating/manual recovery.
5. **Financial events:** PSP webhooks, refunds, payouts and ledger posting; durable, idempotent and reconciled, not fire-and-forget.
6. **Outbound communications:** volume/country/sender-rate constrained; queued and delivery-tracked.
7. **Enterprise reporting:** heavy aggregation/export separated from transactional request paths with bounded jobs/replicas only if suitable for the legal data model.
8. **Background reconciliation:** compare internal/provider records, alert on unresolved gaps and persist resolution evidence.

## 3. Performance targets — proposed baselines to validate

Do not promise a user-facing SLA until hosting, supplier terms and operational staffing are established. Initial engineering acceptance targets to consider for the first pilot:

- Cached catalog/route API p95 under 300 ms at agreed load; uncached provider aggregate search p95 target set per mode/provider after pilot measurement.
- Internal inventory-claim transaction p95 under 250 ms at tested normal load, excluding customer/remote PSP latency; target is provisional and must be adjusted by hardware/region test.
- Public booking API p95 under 500 ms for internal steps excluding external supplier/payment completion, with long-running flows represented as pending states rather than unbounded requests.
- Zero duplicate confirmed seat/leg claims and zero ferry over-capacity in concurrency/failure test sets.
- No lost acknowledged financial event in application-level fault tests; replay/reconciliation detects duplicates or missing provider events.
- Defined timeout and result behaviour when one or more search suppliers fail; return eligible partial results with clearly handled availability freshness, or a visible unavailable state.

These are proposed test thresholds, not verified current performance. Measure at client locations in target countries and on realistic telecom links. Provider API latency and uptime cannot be controlled by Travelar.

## 4. Correctness before optimization

### Bus seats / segments

- Atomically claim each route leg between origin and destination using transactional constraints/locks.
- Test overlapping journeys, adjacent non-overlapping journeys, different seats, expired holds, two channels racing on the same seat, cancellations, reschedule and trip-change workflow.
- Never use stale cache or Redis lock alone to declare a seat available. A distributed lock may reduce contention but PostgreSQL constraints/transaction remain the correctness boundary for Travelar-owned inventory.
- Use short holds with explicit expiry and capped repeat-hold behavior. Protect against seat hoarding without punishing genuine payment retries.

### Ferry class capacity

- Reserve available capacity with a conditional update or lock inside a database transaction.
- Test simultaneous purchases near full capacity, multi-passenger requests, cancellation/release, schedule change, vessel swap and reduced capacity.
- Keep class and fare entitlement tied to authoritative operator config and effective version.

### Payments and booking

- Idempotency for payment initiation, webhook processing, supplier reservation, ticket issue, refund and ledger posting.
- Unknown external result goes to reconciliation; do not create a second charge or ticket blindly.
- Outbox/event workers may deliver at least once; consumers must deduplicate. Avoid assuming exactly-once network delivery.

## 5. Scaling options in order

1. Profile before scaling: database slow queries, query plans, connection saturation, provider latency, queue lag, cache hit rate and page/API waterfall.
2. Add correct indexes, reduce N+1 queries, bound search result sets, paginate, compress and apply request/result schemas.
3. Use connection pooling and per-provider concurrency limits; protect Postgres from a search fan-out storm.
4. Cache static catalog and public content with supplier/license-specific TTL. Do not cache confirmed inventory or PSP status as the authoritative state.
5. Use async queue/outbox for notifications, reconciliation, and non-critical supplier follow-up; define backlog and dead-letter alerts.
6. Optimize SQL/row-lock granularity and remove long transactions; precompute read models for non-financial reporting when beneficial.
7. Add read replicas only for reads tolerant of lag and with explicit routing; do not read replica for a final inventory/booking decision.
8. Partition large append-only tables (event/audit/ledger where proper) only when size/query/maintenance benchmarks show need and uniqueness/foreign-key semantics remain correct.
9. Split a module/service only after clear ownership, scaling or risk isolation evidence; design new failure boundaries and distributed consistency intentionally.
10. Consider regional instances/country data planes only with a legal and operations case, not solely for URL localization.

Do not start with Kafka, sharding or Kubernetes simply because the ambition mentions 100M users. They introduce operational and correctness costs; adopt when measured demand or business continuity requires them.

## 6. External-provider resilience

- Maintain independent per-provider timeout, rate and circuit-breaker settings based on contract and observed behavior.
- Search routing can return partial provider results, but clearly indicate unavailable/unstable availability and never blend incompatible fare rules without disclosure.
- Preserve original supplier booking ownership for after-sales. Provider failover does not imply moving a PNR or hotel reservation.
- PSP failover is not the same as read-only search failover. For unknown charge status, query/resolve the original transaction before a fresh charge.
- Communication failover follows the comms ADR: not all timeouts are safe to retry; prevent duplicate OTP/ticket notifications where possible.
- Backpressure workers and cap retries to avoid cascading load. Circuit breaker opening needs monitoring and a manual override/runbook.

## 7. Load/failure test plan

| Test | Scenario | Required evidence |
|---|---|---|
| Baseline/load | Expected typical search, booking, webhooks and notification mix | p50/p95/p99, error rate, throughput, CPU/memory, DB pool and provider quota use. |
| Peak | 10x modelled mean or known timetable-sale spike | No correctness failures; bounded response; queue recovers. |
| Hot inventory | Many users claim seats on one full bus/leg and one ferry class | No duplicate claims/over-capacity; deterministic failures; acceptable lock wait. |
| Soak | Sustained load over several hours/day | No unbounded memory, DB connection leak, queue growth or log/storage explosion. |
| Dependency outage | GDS, PSP, SMS/email, fiscal/regulatory provider unavailable | Graceful state transition, circuit breaker, no duplicate financial/ticket effects. |
| Ambiguous timeout | Provider performs side-effect but response lost | Reconciliation finds original result; no duplicate charge/PNR/ticket. |
| DB failover/restore | Database unavailable or restore invoked | Measured RTO/RPO, reconciled acknowledged actions, documented user impact. |
| Region/network cut | Loss of connectivity to one dependency/region | Approved degraded mode, no unlawful cross-region failover, clear operator alert. |
| Abuse | Automated search/hold/booking scraping | Rate limits and alerts; legitimate traffic remains usable. |
| Deploy/migration | Release under normal traffic; rollback/forward fix | Backward compatibility and no unexpected transaction/queue interruption. |

## 8. Capacity and growth dashboards

Minimum signals: request volume/error/latency by route/mode; search fan-out and per-provider latency/quota; DB CPU/connections/locks/slow queries; inventory hold count/age/conflicts; booking and fulfilment status ages; PSP pending/unknown/orphan counts; notification acceptance/delivery/failure rate; queue lag/dead letters; ledger unbalanced-posting count (must be zero); settlement unmatched value/count; storage/backup age; restore-test result; auth/tenant-denial and abuse signals.

## 9. Sources

- PostgreSQL explicit locking: https://www.postgresql.org/docs/18/explicit-locking.html
- PostgreSQL transaction isolation: https://www.postgresql.org/docs/18/transaction-iso.html
- OpenTelemetry: https://opentelemetry.io/docs/
- Supabase backups/PITR considerations if selected: https://supabase.com/docs/guides/platform/backups
