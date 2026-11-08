# 23 — API and Adapter Standards

> **Stage 14 product-scope clarification (24 October 2026):** Train and Experiences are first-class Travelar modes, not future modes. Their requirements belong in the current product, architecture, integration and test baseline. Per-country activation may remain gated until authorized suppliers, contracts, ticket/voucher flows and support/refund handling are verified. See `40-train-and-experiences-first-class-mode-research.md`.
**Status:** Proposed standards for implementation planning; provider-specific contracts remain authoritative. **As of:** 24 October 2026.

## 1. Goal

Provide stable internal domain interfaces while preserving differences in supplier/PSP/communications behavior. An adapter normalizes common concepts; it must not pretend that every provider supports the same operations, status semantics or guarantees.

## 2. Adapter categories

- GDS/flight and lodging distribution: Travelport, Sabre, Amadeus, approved consolidators/bedbanks and direct suppliers.
- Local transport and operator systems: LATRA-authorized path, bus/ferry operator APIs or contractual adapters, rail systems.
- Activities: third-party transactional APIs and directly onboarded local suppliers.
- Payment service providers: Selcom, ClickPesa, Pesapal, DPO Pay by Network and future providers.
- Communications: email, SMS and messaging channels such as Resend, SES, Beem, Africa's Talking or other approved routes.
- Regulatory/fiscal: EFDMS/other country systems once formal specifications and authorization are verified.
- Identity, file/object storage, FX source and risk/fraud partners as separately governed adapters.

## 3. Provider registry and capability catalogue

Each provider product needs explicit capabilities at operation and market level. Minimum fields:

- `provider_id`, product family, adapter implementation/version, API version and documentation date.
- Country/market, mode, supported suppliers/content, point of sale, currency and language.
- Read/search, price-check, reserve, issue, change, cancel, refund, status-check, payout or delivery-event capabilities as applicable.
- Production eligibility, authorization/contract/certificate reference, effective/expiry date, approved sales channels and support contacts.
- Credentials/secret reference, network allowlist requirements, webhook verification method, limits/timeouts, retry rules and request idempotency support.
- Data processed, storage/processing regions, subprocessors and transfer approval evidence.
- Rate card/pricing model, commission/supplier terms, settlement model, service level, current health and operator-defined manual fallback.
- Conformance-test date/result, known restrictions and owner responsible for renewal/revalidation.

Production enablement must require an explicit approval state and all required fields. `healthy=true` alone must not enable a provider with expired agreement, missing licensing or absent ticket/refund capability.

## 4. Canonical adapter operation envelope

Common request metadata should include:

- `correlation_id` / trace ID;
- idempotency key scoped to tenant, operation and business intent;
- `country/market`, currency and locale;
- internal booking/booking-item reference where available;
- deadline/timeout budget and retry policy ID;
- user/tenant/agent context after authorization (not raw browser-supplied permissions);
- provider selection reason and capability version.

Common result envelope should include:

- `outcome`: succeeded, rejected, pending, unknown, unsupported, retryable failure, permanent failure, manual review;
- provider/product and provider request/reference IDs;
- normalized status plus original provider status code/reason;
- timestamps and evidence source (response, webhook, status query, settlement file, human review);
- financial amount/currency only when sourced from a verified provider/server calculation;
- retry/reconciliation guidance and whether the operation is safe to repeat;
- sanitized error detail and provider correlation reference.

Do not flatten all provider errors into HTTP 500 or all asynchronous provider states into a boolean. Keep the original evidence and normalized interpretation.

## 5. Important mode-specific behavior

### GDS / accommodation / activities / rail

Separate `shop/search`, `price-check/revalidate`, `create reservation`, `ticket/confirm`, `retrieve status`, `change`, `cancel`, `refund` and `reconcile` as distinct operations if the provider does. Preserve provider PNR/reservation/ticket identifiers, fare/terms snapshot and supplier-of-record. A timed-out create request is potentially successful until status query or provider confirmation says otherwise. Do not switch an existing booking to another GDS in order to service it unless provider rules authorize transfer.

### Bus/ferry inventory

Adapter capabilities must declare inventory authority and locking/hold semantics: inventory source, hold duration, whether provider locks during payment, when allocation becomes committed, and what offline/agent sales do. Never infer atomic inventory reservations from a search result. For Travelar-owned bus inventory, reserve database leg claims in a transaction; for ferry capacity use conditional capacity reservation. External provider contracts need their own contract tests.

### Payments

Normalize create/redirect, server status lookup, webhook/IPN, refund, payout, settlement file, chargeback and reconciliation operations. Verify signatures/tokens with each PSP's prescribed method; do not assume all use HMAC or IP allowlists. Deduplicate provider events using their defined event IDs or a safely constructed stable key. Browser redirect does not prove payment. On an unknown charge outcome, query the original PSP transaction before attempting a fresh charge on any provider.

### Communications

Separate notification intent from provider attempt and recipient delivery. Provider API acceptance means accepted for processing, not delivered. Model status events, out-of-order callbacks, provider-specific expiry/error semantics, sender IDs, recipient country coverage, rate limits, message segmentation, cost and opt-out/consent. Only fail over if retrying will not duplicate a sensitive/critical communication or if deduplication policy explicitly accepts that risk. For one-time codes, avoid sending the same active code through multiple providers concurrently; maintain a single code identifier and expiry.

### Fiscal/regulatory adapters

Model required authority response, fiscal/receipt identifier, idempotency/reference, cancellation/reversal/reissue process, retries and reconciliation. If mandatory fiscal submission fails after money collection, enter a controlled pending/manual-review state and apply the regulator-approved recovery procedure; do not silently mark fulfilment complete.

## 6. Retry and timeout standard

- Use bounded timeouts by operation/provider; derive defaults from pilot observation and provider contract.
- Retries use exponential backoff with jitter and maximum attempts/deadline for transient failures, respecting `Retry-After` and provider rate limits when applicable.
- Retry writes only with provider idempotency or confirmed safe semantics. If a provider does not provide idempotency for an operation, persist operation intent, avoid blind retry, and reconcile before repeating.
- Circuit breaker prevents overload but must not turn a real booking into an automatic failover to a provider without same fare/supplier/terms.
- Dead-letter queues require owner, alert, age threshold and replay/runbook; replay must be idempotent and approval-gated where financial effects are possible.
- Preserve correlation ID across internal calls and webhooks; do not expose internal IDs or secrets to public API clients.

## 7. Webhook standards

For each provider, document authentication/signature, canonical raw-body requirements, timestamp/replay protection, IP allowlist only if provider publishes stable ranges and recommends it, TLS, event-ID uniqueness, retry schedule, acknowledgement response, out-of-order delivery, secret rotation and status-lookup fallback.

Webhook handler must do minimal bounded work: authenticate, validate schema, deduplicate, durably record event and enqueue follow-up. Return success only after durable receipt is achieved. Process effects idempotently outside the ingress request. Invalid/unrecognized event types should be quarantined/alerted without mutating money or inventory.

## 8. API versioning and partner standards

- Version public/partner APIs (`/v1`) and publish deprecation policy; do not mirror provider endpoints as Travelar's public contract.
- Use OAuth2/client credentials or appropriately strong signed credentials for server-to-server partners; use scoped credentials and rotation. Require tenant/partner context and authorization per resource/action.
- Validate inputs and schemas; apply request-size limits, pagination caps, rate limits, idempotency, and resource-abuse controls.
- Use standardized problem responses that avoid leaking provider secrets/stack traces.
- Avoid placing passenger PII in URLs. Public booking lookup requires secure factor/token.
- API consumers should receive their own scoped webhook credentials, signatures and replay-safe delivery IDs.
- Record a data-processing agreement, access scope, country/region and lifecycle for every partner.

## 9. Adapter test suite

Each provider adapter must pass:

1. Capability declaration and unsupported-operation behavior.
2. Contract/schema tests against current official API docs and sandbox or approved test setup.
3. Positive and negative authentication/signature tests.
4. Timeout after provider side-effect with outcome-unknown recovery.
5. Duplicate submit/event and out-of-order webhook tests.
6. Rate limit/429, 5xx, malformed response and provider outage tests.
7. Price/currency/tax/fare condition and supplier-reference mapping tests.
8. Refund/cancel/change lifecycle tests including eventual status and partial failures.
9. Secret rotation and credential revocation tests.
10. PII redaction, log/correlation and retention tests.
11. Sandbox-vs-production capability difference register.
12. Operational reconciliation and manual runbook test.

Mocks are useful for unit tests but do not count as completed provider integration. Production access and test evidence must be documented separately.

## 10. Sources

- OWASP API Security Top 10: https://owasp.org/www-project-api-security/
- OWASP ASVS 5.0.0: https://asvs.owasp.org/
- Supabase RLS guidance, if applicable: https://supabase.com/docs/guides/database/postgres/row-level-security
- Official provider developer docs are enumerated in Stages 3–4 source registers; check current docs at implementation time.


## Identity provider integration (added 24 October 2026)

Treat the IdP as an external standards-based identity boundary. Prefer OIDC/OAuth 2.0, issuer-based configuration and stable internal user mapping over provider-specific user IDs or vendor role semantics. Map identities using `(issuer, subject)` to a stable internal `user_id`. Validate API access tokens in the core backend (signature/JWKS, issuer, audience, time claims and allowed algorithms); do not send ID tokens to APIs as bearer access tokens. Keep tenant/operator/branch and financial permissions authoritative in Travelar's authorization service/database.

The preferred candidate is self-hosted Keycloak in verified Tanzania hosting subject to legal, host, operations and security gates; Auth0 is a contingency if its processing is legally acceptable and operationally preferable. Do not build bespoke authentication from scratch for launch. See `33-authentication-provider-and-identity-architecture.md` and `ADR-AUTH-001-keycloak-first-local-identity.md`.

## Stage 19 addendum — data-driven search/configuration API (24 October 2026)

Search and management APIs must expose typed schemas for scoped published configuration, location/route lookup, mode-specific filters/result profiles, configuration versions, source freshness/provenance, pagination and eligible actions. Search should use stable IDs; the backend validates from/to and boarding/drop-off eligibility for the specific service/date. Don't return all locations/routes for browser-side filtering. Cache keys must include market/mode/tenant and configuration scope where applicable; private results may not share unscoped cache entries. See Document `47` and `50`.

