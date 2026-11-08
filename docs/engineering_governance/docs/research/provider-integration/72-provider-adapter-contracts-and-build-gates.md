# 72 — Provider Adapter Contracts, Capability Registry and Build Gates

**Date:** 28 October 2026  
**Status:** Architecture proposal to be validated against current repo, provider API schemas, contracts and account entitlements.

## 1. Core requirement

Travelar must support multiple suppliers concurrently and remain provider-neutral at the domain/service layer. Implement adapters, not provider-specific branches scattered throughout public pages, booking services, HIMS, finance and OIMS. The public product has one Travelar vocabulary and one canonical booking/finance model, with provider-specific differences expressed through explicit capabilities and workflow policies.

Current baseline: frontend is incomplete; repository audit first. Architecture direction is a modular monolith initially, NestJS + TypeScript/Fastify backend, PostgreSQL, Drizzle + `node-postgres` provisional, outbox/workers for durable cross-system work. Preserve the chosen PostgreSQL baseline and don't introduce microservices, Kafka or orchestration products without an ADR and workload proof.

## 2. Capability registry

Maintain an effective-dated capability registry in PostgreSQL. It is not a free-form database script engine; it declares tested, code-supported operations and settings.

Required fields:

- `providerId`, `productId`, `account/agency/merchantId reference`, `travelMode`, `country/market`, currency, point-of-sale, supplier/carrier/property/content source filters as needed.
- `environment`: development/mock, provider sandbox/certification, production. Distinguish credentials/endpoint profiles and evidence.
- `capabilityKey`, `supported`/`unsupported`/`conditional`/`unknown`, operation/workflow identifier, prerequisites, required scopes/headers, known exclusions, rate-limit profile, retryability and idempotency support.
- documentation URL, product/API version, docs last-checked date, schema/hash/contract-test evidence, account confirmation and named owner.
- effective-from/effective-to, status (`draft`, `review`, `approved`, `enabled`, `paused`, `retired`), approval actor, publication history and rollback version.
- health/circuit-breaker state is operational runtime data, separate from the commercial authorization to use a capability.

### Example capability keys

Air: `air.search`, `air.revalidate`, `air.create_reservation`, `air.ticket_issue`, `air.retrieve`, `air.cancel_held`, `air.cancel_ticket`, `air.void`, `air.refund_quote`, `air.refund`, `air.exchange_search`, `air.exchange_commit`, `air.seat_availability`, `air.seat_book`, `air.ancillary_search`, `air.ancillary_book`.

Stays: `stay.search_property`, `stay.get_content`, `stay.get_rates`, `stay.price_check`, `stay.create_booking`, `stay.retrieve_booking`, `stay.modify`, `stay.cancel`, `stay.refund`.

Payments: `payment.collect.billpay_exact`, `payment.collect.billpay_partial`, `payment.collect.ussd_push`, `payment.collect.card`, `payment.collect.tanqr`, `payment.collect.crdb_direct_debit`, `payment.query`, `payment.webhook`, `payment.refund`.

Payouts: `payout.mobile_money`, `payout.bank`, `payout.lipa_namba`, `payout.preview`, `payout.query`, `payout.bulk`, `payout.split_settlement`.

A capability cannot be enabled only because it exists in a public API catalog. Production enabling also requires signed contract/account entitlement, test evidence and the appropriate legal/compliance/finance gate.

## 3. Recommended adapter service boundary

### Domain layer owns

- Travelar IDs, canonical states and transition rules.
- Offer/quote snapshots; customer consent for changed price/terms.
- Booking/fulfillment lifecycle; idempotency and duplicate protection.
- Inventory safety, payment verification policy, commercial policy snapshots, ledger journals and approval rules.
- Public error messages, incident queues, audit and telemetry.

### Provider adapter owns

- Authentication/token renewal and secrets reference.
- Request/response schema, headers, provider-specific ID/reference formatting, trace IDs and payload transformations.
- Provider-specific operation sequence and capability/entitlement checks.
- Raw status/error mapping, `Retry-After`/cooldown interpretation, response redaction and documentation/test provenance.
- Webhook authentication and payload normalization where applicable.

### Provider adapter must not own

- Customer-visible booking terms or pricing truth.
- Tenant authorization, platform commission decisions, accounting policy or permission approvals.
- Authoritative bus/ferry inventory locks or immutable financial ledger.
- Unreviewed dynamic code or hard-coded market-specific rules.

## 4. Adapter operation design rules

1. Inputs are typed canonical requests plus provider-specific opaque continuation/reference tokens; do not leak provider JSON across domain/public API except into a private redacted evidence object.
2. Outputs include `outcome`, `providerRawStatus`, normalized status, provider reference(s), response timestamp, trace/correlation, retry classification, capability/version evidence and structured warnings.
3. Preserve provider raw payload only in restricted redacted evidence storage with policy-controlled retention; don't include secrets or unnecessary PII in logs.
4. Every create/commit/payment/payout/refund/ticket-issue command requires a Travelar idempotency key and persisted operation record before network call. If no provider idempotency exists, use a durable reconciliation/retrieve-before-retry strategy.
5. On network timeout after mutation request, result is `UNKNOWN`, not `FAILED`, until queried/reconciled.
6. Retry only a documented retryable operation with capped backoff/jitter, bounded attempt/time policy and provider/account rate limits. Don't retry a business rejection or create operation blindly.
7. Use an outbox/inbox: enqueue outbound provider command transactionally with domain state; process inbox/webhook events durably; make consumer idempotent; dead-letter with re-drive permission and audit.
8. Keep provider environments distinct and never allow prod keys in test jobs. ClickPesa's no-sandbox policy means ClickPesa adapter contract tests must mock network calls.
9. Store monetary values as integer minor units or exact decimal values under a documented currency scale; never use binary floating-point for finance. Currency/FX and fee rounding are explicit rules.
10. Provider capability and fee configurations are effective-dated. Historical booking and payment records keep their accepted snapshots.

## 5. Cross-cutting Booking Orchestrator

Recommended service responsibilities:

- `SearchOrchestrator`: resolve eligible providers by mode/market/account/config, apply timeout and parallelism budgets, normalize results, preserve source coverage and freshness, and handle partial failures.
- `OfferService`: issue Travelar offer IDs, snapshot provider offer/price/terms, enforce TTL/expiry and accepted price/config version.
- `RevalidationService`: invoke required provider checks; compare total and material conditions; require customer consent on change.
- `BookingOrchestrator`: route to provider-specific workflow based on capability, commercial model and contract; own transitions and idempotency.
- `FulfillmentService`: issue/retrieve ticket or voucher; verify final artifact; handle missing/duplicate fulfillment.
- `AfterSalesService`: eligibility quotes, cancellation/exchange/refund, approvals, customer confirmation and supplier action.
- `ReconciliationService`: poll provider references, compare event/query/statement data and open cases.
- `ProviderOperations`: health, credentials, usage, latency/error rate, rate limits, schema/version and incidents.

## 6. API/webhook/event contract

Minimum normalized event metadata:

`eventId`, provider/providerAccount, eventType, receivedAt, providerOccurredAt if available, rawStatus, canonicalStatus, providerRef, Travelar aggregate ID if correlated, amount/currency where payment, trace/correlation ID, source signature/checksum validation result, payload schema version, retry count and processing outcome.

Webhook handlers should acknowledge only after durably recording a validated event or durable dead-letter decision, then process asynchronously. A 2xx response is not proof the downstream booking or ledger operation succeeded. Reconcile with provider query APIs on missed event, duplicate, out-of-order event, verification failure or internal processing error.

Do not expose provider raw webhook payload to the browser. Rate-limit endpoints and validate authenticity using each provider's current documented method (HMAC/checksum/signature/mTLS/IP allowlist as applicable). IP allowlisting is an additional network control, not a replacement for message authentication where supported.

## 7. Data and security implementation

- PostgreSQL remains the source of truth for Travelar orders, state, ledger, config and authorization evidence.
- Use transactions/constraints for idempotency, unique provider reference keys, journal balancing and data consistency. Redis, if introduced later, cannot be the only protection against double booking or duplicate financial effects.
- Multi-tenancy: backend authorization per request plus tenant/branch-scoped repository logic and review of PostgreSQL RLS. Test bypass attempts across operator tenant, branch, role and HIMS/OIMS boundary.
- Store credentials in the approved secret manager/connection environment. Database stores references/metadata, not plaintext secrets. Redact authorization headers, token responses, full card details and personal identifiers.
- Do not add provider credentials or live requests to `.env.example`, test fixtures, screenshots, IDE prompt files or CI logs. Example values must be synthetic.
- Implement kill switches per provider/account/mode/action to stop unsafe operations, with authority, audit and safe fallback. Do not show the provider as live in UI if the corresponding capability is paused.

## 8. Build sequence

1. Repository + engineering-pack audit; inventory existing routes/API/types/test fixtures and classify actual state.
2. ADR/requirements reconciliation and provider account/entitlement unknowns register.
3. Canonical domain model, migrations and idempotency primitives; audit/event/outbox infrastructure.
4. Fake-provider adapters and contract tests; implement booking state machine with no real external money.
5. Travelar public search/forms/results/detail/loading/error states using mocked but realistic canonical offers.
6. Provider POC in authorized test environment for Sabre/Travelport with entitlement and market restrictions; record each API operation and raw response schema.
7. One constrained end-to-end provider flow: search → revalidate → reservation → fulfillment → retrieve; after-sales path only for supported actions.
8. ClickPesa adapter using mocks; verify signature/query/late payment/timeout/rate limit and payout state transitions. No sandbox, so production APIs blocked in automated tests.
9. HIMS/OIMS operations queues, approvals, payout and ledger reconciliation flows, audit views and daily close.
10. Security, concurrency, failure/chaos, accessibility, performance, backup/restore, incident drills and documentation.
11. Contract/regulatory/legal/finance review and controlled live-test approval. No production launch until all relevant gates close.

## 9. Go/no-go gates per provider feature

- **G0 — Public docs captured:** current product/version/schema/source date logged.
- **G1 — Commercial/legal right:** contract, account, merchant/agency IDs, allowed use, markets, data/brand rights and processor terms confirmed.
- **G2 — Credentials/environment:** scoped test credentials and endpoint/environment documented; no production access used for ordinary test runs.
- **G3 — Contract tests:** required/optional fields, status mappings, auth, errors, rate limits and schema validation pass.
- **G4 — Workflow tests:** happy path, changed price, duplicate, timeout, provider outage, expiry, cancellation and after-sales variations pass in allowed environment.
- **G5 — Security/observability:** secret handling, redaction, signature verification, tenant isolation, alerts, incident owner and kill switch verified.
- **G6 — Finance/compliance:** merchant-of-record/payment/settlement/refund/tax/fiscal and regulatory model approved for that route.
- **G7 — User/ops readiness:** clear user states, support scripts, manual reconciliation, runbook, training, fees and terms approved.
- **G8 — Production authorisation:** named human change approval, rollback/stop condition and evidence signed off.

Any missing gate means feature state is `blocked`, `mock-only`, `test-enabled` or `proposed` as appropriate, not `production-ready`.

## 10. Provider-specific immediate gates

### Sabre

- Re-check every supplied legacy/versioned endpoint in current Developer Hub; exclude deprecated paths from new coding.
- Verify Flight Shop / Flight Check / Create Booking / Fulfill Flight Tickets versions and account access by source (ATPCO/NDC/LCC) and carrier.
- Verify agency identifiers, ticketing authority, form-of-payment model, ticket fulfillment deadlines and after-sales coverage.
- Hotels: check rate and booking/servicing capabilities independently; do not infer booking APIs from content/availability APIs; treat Beta as non-production unless approved by Sabre.

### Travelport

- Use current TripServices Flights v11 documentation for current endpoint contracts; inventory and avoid endpoints in the supplied deprecated section.
- Decide through capability evidence between workbench and Unified Checkout routes; preserve returned expiries and workflow limitations.
- Test GDS and NDC separately because cache, locator, ticketing, FOP and post-booking behavior can vary.
- Verify entitlement, agency PCC/ID, ticketing and supplier settlement arrangement.

### ClickPesa

- Verify account KYC, collection/payout products and fee contract. Public docs do not establish a marketplace split feature.
- No sandbox: network code tests are mock/contract tests only. Live test operations require human approval.
- Implement exact BillPay booking correlation, callback/query reconciliation, reference deactivation race handling and payout queue/rate-limit behavior before any counter/payment workflow is enabled.

## 11. Definition of complete for an adapter

An adapter is not complete because it has a class with `search()` or a green mock. Evidence must cover its current contract; all required operations; entitlement and capability gates; normalized and raw status mapping; timeout/duplicate behavior; retries/limits; auth/secrets; webhook; data mapping; logs/metrics/alerts; tests; security review; finance/legal gates; operator runbook; and requirement/ADR reconciliation.
