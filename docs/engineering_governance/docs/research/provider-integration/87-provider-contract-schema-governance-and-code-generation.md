# 87 — Provider Contract, Schema Governance and Code-Generation Standard

## 1. Purpose

Prevent provider schema assumptions from leaking into Travelar domain logic or public API contracts. Every provider integration must be reproducible, versioned, reviewed and tested against the actual selected API family.

## 2. Required repository artifacts

Adapt to the real repository after audit. Do not create duplicate folders if equivalents exist.

```text
integrations/
  providers/
    travelport-tripservices-v11/
      contract.md
      operation-inventory.yaml
      field-mapping.yaml
      status-mapping.yaml
      capability-profile.schema.json
      fixtures/                 # redacted, authorized sample responses only
      contract-tests/
    sabre-mosaic-air-v1/
      contract.md
      operation-inventory.yaml
      field-mapping.yaml
      status-mapping.yaml
      fixtures/
      contract-tests/
    sabre-legacy-<exact-product-version>/
      ...                      # only if current account/product requires it
    amadeus-enterprise-<exact-product-family>/
      contract.md
      operation-inventory.yaml
      field-mapping.yaml
      status-mapping.yaml
      fixtures/
      contract-tests/
  canonical/
    search.schema.ts
    offers.schema.ts
    quotes.schema.ts
    bookings.schema.ts
    supplier-reservations.schema.ts
    ticket-documents.schema.ts
    stays.schema.ts
    provider-evidence.schema.ts
  openapi/
    partner-api.json           # generated in CI, not manually edited only
```

The names are examples, not a requirement to restructure the existing repository. The code agent must inspect repo layout first.

## 3. For each operation, maintain a schema evidence record

- provider, product/collection, API family and exact version;
- environment and base URL identifier;
- official documentation/spec URL and last verified date;
- request schema source and version, response schema source and version;
- auth scopes and required headers/IDs;
- account/market/POS/content source entitlement evidence;
- request DTO and response parser/validator locations in the repo;
- source-path-to-canonical-field mappings, enum normalization and lossy mapping notes;
- success, warning, empty, business error, auth error, throttling and server-error fixtures;
- idempotency, retry, timeout, duplicate and reconciliation behavior;
- test names/commands/commit and certification/live verification status;
- named owner, reviewer and approval state.

## 4. Contract ingestion workflow

1. Confirm current product and API family with provider docs/account manager. If exact access is unavailable, stop at `research/mock-only` and record the unknown.
2. Download/read official OpenAPI, JSON schema, WSDL/XSD or the exact API reference as permitted by provider licensing and access terms. Do not scrape private pages or commit proprietary material unless licensed for that use.
3. Pin schema file version or cryptographic hash; record document date and URL.
4. Generate or adapt client/DTO types if useful, but do not assume generated types perform runtime validation.
5. Implement boundary validation for outgoing requests and incoming responses. Reject unknown critical statuses/fields that could affect money, booking identity or fulfillment; forward harmless additive fields only through controlled typed extension handling.
6. Transform provider response into canonical models and retain the raw provider status/reference separately. Mapping must document source path, units, timezone, currency and any information loss.
7. Add fixtures for successful and failed cases and run contract tests. Fixtures must be sanitized and must not contain tokens, card data, passport data or unnecessary personal data.
8. Execute sandbox/certification scenarios only under authorized credentials. Use mock fixtures for automated CI if there is no sandbox or the test endpoint can move real money.
9. Review diff when provider schema changes. A breaking change blocks activation until mapping, tests, support runbooks and API documentation are updated.
10. Reconcile capability registry, product documentation, monitoring dashboards and open questions after each change.

## 5. Required canonical object model boundaries

Keep these objects distinct:

- `SearchSession`: request inputs, user/channel, requested and eligible provider set, market/POS, started/expiry time, per-provider attempts and partial-failure metadata.
- `ProviderOfferSnapshot`: normalized display fields and private provider references, raw-provider status, prices/terms/freshness, mapping/schema version and source provenance.
- `Quote`: current price and terms for a defined selection; expiry; line items; pricing policy version; accepted by which actor and at what time.
- `TravelarBooking`: Travelar's durable booking identity and customer/channel ownership.
- `SupplierReservation`: one source-specific booking/order/PNR/confirmation with its own state, identifiers, deadline and retrieval evidence. One Travelar booking may own multiple supplier reservations.
- `TicketDocument`: actual travel document, issue state and supplier proof. Not equivalent to booking confirmation.
- `PaymentAttempt` / `Collection` / `Refund` / `Payout`: separate financial operations and status histories.
- `ProviderActionCase`: cancellation, void, exchange, modification, disruption or refund request with eligibility, quote, approval, external operation and final status.
- `CapabilitySnapshot`: exact allowed workflow and version for provider, market, source, product, account and time.

## 6. Data and privacy rules

- Store external IDs with their issuer/provider and reference type; never assume a locator, hotel ID or order ID is globally unique.
- Store money as integer minor units or decimal strings at API boundaries with explicit currency/rounding rules; never use binary floating-point for ledger arithmetic.
- Store UTC instants plus originating timezone/offset where required to reconstruct supplier deadlines and local schedule display.
- Persist the normalized business record and source/version references. Retain full raw payloads only where necessary, encrypted and access-controlled with a defined retention policy. Default to redacted payload fixtures and structured evidence for logs.
- Keep personal data field-specific, purpose-limited and access-controlled. Separate passenger identity documents from general application logs and supplier contract evidence.
- Secret values never belong in database configuration tables or schema snapshots. Store secret-manager references and access audit events.

## 7. Release blockers

A provider integration cannot go live if the exact product/version is unknown, schema evidence is stale/unreviewed, a critical field has ambiguous mapping, required passenger/room fields are not validated, create/fulfillment retry can duplicate an operation, error statuses advance booking/payment state incorrectly, account rights are unknown, or post-booking support path is missing.
