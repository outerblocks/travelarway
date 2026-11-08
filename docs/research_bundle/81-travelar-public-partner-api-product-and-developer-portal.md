# 81 — Travelar APIs as a Partner Product: Contracts, Documentation, Access, Metering and Support

**Product:** Travelar · **Stage:** 25 · **Status:** Product/architecture requirements; commercial and legal terms remain to be approved.

## 1. API product strategy

Travelar should expose its own stable domain API—not proxy supplier/GDS endpoints as the public contract. Operators, agent networks, corporate customers, white-label storefronts and approved technology partners integrate with Travelar's resources and permissions. Travelport, Sabre, ClickPesa and other vendors remain internal adapters behind canonical contracts.

Possible API products, activated only when each capability is implemented and authorized:

1. **Catalog & Search API:** eligible locations, operators/products, availability/search offers and selected mode metadata.
2. **Booking & Order API:** quote/revalidate, booking creation, status, passenger/traveler management, cancellation/change requests and ticket/voucher retrieval subject to contract.
3. **Operator Management API:** routes, stops, schedules, trips, vehicles, seat maps/capacity, fares, manifests and reports for operator-owned records within tenant scope.
4. **Agent & Distribution API:** attributed bookings, eligible sales channels, agent commissions/markup display, reservation/ticket status and customer servicing within the agent agreement.
5. **Corporate/Enterprise API:** approved travel policies, cost centers, authorizations, billing and travel reports under contract.
6. **Webhook/Event API:** signed event delivery for booking status, ticket issued, disruption, payment status visible to the consumer, refund result, inventory changes and payout/settlement status only where legally and contractually appropriate.

HIMS APIs are internal control-plane APIs and must not be exposed through partner credentials. OIMS and partner clients may share domain services but receive separate scopes, schema projections and tenant/organization filters.

## 2. Canonical HTTP resources (illustrative design, confirm against repository)

Use `/v1` path versioning for externally supported public/partner API. Stable Travelar IDs are primary identifiers. Supplier IDs and PNRs are separate fields.

### Catalog/search/booking

- `GET /v1/markets` — allowed markets/locales/currencies for this client.
- `GET /v1/modes` — modes and capabilities this client may use.
- `GET /v1/locations?mode=bus&market=...&q=...` — authorized location lookup with stable IDs.
- `GET /v1/operators` — public/partner-visible operator catalog.
- `POST /v1/searches` — validated search command; returns search ID, expiry/freshness and offers.
- `GET /v1/searches/{searchId}` — retrieve a still-available search result where applicable.
- `POST /v1/quotes` — create/revalidate quote from offer/product + passengers/occupancy.
- `POST /v1/bookings` — create booking/order with `Idempotency-Key` and validated quote reference.
- `GET /v1/bookings/{bookingId}` — scoped booking representation.
- `POST /v1/bookings/{bookingId}/cancel-requests` — create a cancellation request and return its state; don't pretend every supplier can cancel immediately.
- `GET /v1/bookings/{bookingId}/tickets` — available tickets/vouchers only under authorization.
- `POST /v1/bookings/{bookingId}/change-requests` — request a change/reprice flow when supported.
- `GET /v1/payments/{paymentId}` — payment state available to this client; secret/provider internals are not exposed.

Availability and quote operations must identify whether Travelar or external provider is inventory/price authority, freshness, quote expiration, provider capability and whether further confirmation is required. A search result is not a booking guarantee.

### Operator/OIMS management

- `GET/POST /v1/operator/routes`, `GET/PATCH /v1/operator/routes/{routeId}`.
- `POST /v1/operator/routes/{routeId}/versions` and `POST /v1/operator/routes/{routeId}/publish` with approval requirements.
- `GET/POST /v1/operator/schedule-rules`.
- `POST /v1/operator/schedule-rules/{ruleId}/preview-generation` — non-mutating date-range preview.
- `POST /v1/operator/schedule-rules/{ruleId}/generate-trips` — idempotent reviewed command to create eligible occurrences.
- `GET /v1/operator/trips?from=...&to=...&routeId=...` and scoped trip operations.
- `GET/POST /v1/operator/vehicles`, `GET/POST /v1/operator/seat-layouts`, version/publish operations.
- `GET /v1/operator/trips/{tripId}/availability?fromStopId=...&toStopId=...`.
- `GET /v1/operator/staff`, `POST /v1/operator/staff-invitations`, role/scope assignment endpoints under staff-management permission.
- Finance/payout endpoints only when approved and tightly scoped; no arbitrary endpoint that lets an operator request payout to any beneficiary or mutate ledger entries.

Do not expose raw internal database tables. Endpoint sets are illustrative; the agent must inspect existing module names and avoid duplicating routes already present.

## 3. API documentation is an engineering artifact

Maintain version-controlled, generated OpenAPI contract for the actual API. The OpenAPI Specification describes an HTTP API in a machine-readable, language-agnostic format, allowing clients to learn operations without reading source code: https://spec.openapis.org/oas/v3.2.1.html. Use the highest version that the selected NestJS tooling, validators, generators and partner clients consistently support. Do not set a spec version only because it is newest.

For NestJS, `@nestjs/swagger` can generate an OpenAPI definition from controller and DTO/schema decorators and serve Swagger UI/JSON; official docs: https://docs.nestjs.com/openapi/introduction. It must reflect the real contracts and validators; generated descriptions and default examples still require review.

Every API operation documents:
- purpose, supported environments, auth/scopes, partner eligibility and tenant isolation;
- request parameters/body, requiredness, formats, examples and business validation;
- response schemas and examples, identifiers, status transitions and money/currency semantics;
- all expected success, validation, authorization, conflict, rate-limit, provider-pending and problem responses;
- pagination/filter/sort limits; idempotency requirement for side effects;
- freshness, expiry, asynchronous behavior, retry and recovery rules;
- privacy/data classification and retention; webhook/security implications;
- product/provider capability restrictions and source/version for any external-dependent claims;
- deprecation, compatibility and version-support policy.

Build documentation checks into CI: OpenAPI file generation is clean, schemas validate, operation IDs are stable, every exposed route is represented, examples validate, breaking diffs are reviewed, and auth scopes are present for protected operations. Do not publish HIMS internal endpoints, hidden schemas, server secrets or production test controls in the public developer portal.

## 4. Developer portal design

Proposed `developers.travelarway.com` is a candidate hostname only, subject to DNS/security setup. The portal should include Travelar API overview, getting started, products/capabilities, authentication, environment and base URLs, OpenAPI reference, code samples/SDKs, webhook guides, errors, pagination, idempotency, rate limits, versioning, changelog, status page, support/security contact and terms.

Partner console functions: organization profile/KYB, signed agreement, application/requested products, sandbox client registration, credentials issue/revoke/rotate, scopes, webhook endpoint registration, test-event delivery, quota/usage analytics, invoices, API incidents and support tickets. Credentials are shown only at creation where possible; store a hash for API keys when design permits verification by hash and/or store secrets in a vault for OAuth client-secret verification, never plaintext logs.

## 5. Authentication, authorization and tenant scope

- Prefer OAuth 2.0 client credentials for server-to-server machine clients when supported by the identity platform, or a cryptographically strong scoped client key where justified. Never embed a secret in browser/mobile public code.
- Each credential belongs to one partner application and organization, with scopes, allowed products/modes/markets, optional IP/network restrictions, quotas, expiry, owner, issuance/revocation/rotation history and last-use metadata.
- Authorize every object action against organization membership and record ownership, not only token scopes. Scope cannot override row-level tenant ownership or legal/contract restrictions.
- Separate `catalog:read`, `search:create`, `quotes:create`, `bookings:create`, `bookings:read`, `bookings:cancel-request`, `tickets:read`, `operator:routes:manage`, `operator:schedules:manage`, `operator:inventory:manage`, `operator:manifests:read`, `finance:read`, `payouts:prepare` and `payouts:approve` as independently granted capabilities as needed.
- Require rotation, revocation and incident response for leaked credentials. Never log secret values. References: OWASP API Security https://api-security.owasp.org/ and Secrets Management Cheat Sheet https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html.

## 6. Webhooks

Webhook events are versioned public schemas with event ID, event type, creation time, tenant/client reference, schema version and minimal business payload. Sign deliveries with a documented HMAC/signature contract over the exact raw body, include timestamp and delivery ID, use replay protection, and support secret rotation. Actual signature format and algorithms must be implemented and tested, not merely mentioned in docs.

Delivery is at-least-once unless a stronger guarantee is documented. Consumer must deduplicate using event ID. Retry with bounded backoff, preserve delivery attempts and response codes, and provide replay from a defined event/retention window. Do not include full passenger PII or secret supplier response by default. Never claim a webhook has been delivered just because it was queued; show attempted, accepted, retrying, failed and dead-letter states.

## 7. Partner onboarding and API commercialization

1. Partner application and business/legal identity verification.
2. Product/mode/country and use-case request, traffic forecast, data categories, customer role and jurisdictions.
3. Commercial agreement including attribution, commission/markup, taxes, cancellation, support, SLA, data processing, breach, liability and termination.
4. Review legal/provider permission and channel attribution; confirm the partner may perform requested actions.
5. Issue least-privilege test credentials and synthetic/mock or approved provider-sandbox environment. Never call ClickPesa live endpoints under a fictitious sandbox label.
6. Contract tests and partner conformance suite: schemas, scopes, tenant leakage, idempotency, rate limit, callback signature, retries, reconciliation and customer support flow.
7. Human approval for production access; issue production credential separately, set quotas/alerts and establish contacts/support coverage.
8. Monitor usage, error rates, cost, rate-limit behavior, booking conversion, refunds/chargebacks and incidents; suspend via governed, reversible process.

Potential commercial models to research/approve: included API quota in SaaS plan, monthly subscription by product/mode, usage-based search/quote/booking pricing, per-confirmed-booking fee, negotiated enterprise minimum, or contract-based distribution commission. Do not simultaneously charge API usage and marketplace commission unless transparently permitted by contract and law. Pricing is versioned/effective-dated with invoice evidence and usage reconciliation. No price is fixed by this document.

## 8. Versioning and compatibility

- Keep `/v1` stable for compatible additions; publish `/v2` for genuinely breaking contract changes according to policy.
- Document support/deprecation dates and migration guide. Do not deprecate based solely on provider endpoint changes; Travelar's public API may remain compatible by adapter changes.
- Use additive schema changes where safe, never reuse a field with a different meaning, keep enums extensible, and require consumers to tolerate unknown provider-derived values where the public schema allows them.
- Preserve booking event payload version so replay and audits remain interpretable.

## 9. Acceptance criteria

- OpenAPI document is generated from actual controllers/DTOs, validates in CI and matches served routes.
- Partner can register, receive scoped test credentials, call permitted endpoint and see clear rejection for unsupported scope.
- One partner cannot access another partner's booking by guessing IDs or changing query/body tenant IDs.
- Browser-bundled code contains no partner client secret/API secret.
- Mutation routes require idempotency where duplicate effects are dangerous; retries return the same safe result or a conflict.
- Rate-limit enforcement is tenant/client aware and emits monitored metrics.
- Webhook signature failures, duplicate deliveries, replay, out-of-order events and endpoint downtime are tested.
- Developer portal examples run against mock/test environment and never initiate real supplier/payment operations without explicit test authorization.
- Metered usage reconciles with billing policy, and partner agreement/product access can be paused without deleting booking history.
