# 83 — Travelar API Contract Examples and OpenAPI Starter

**Status:** Illustrative contract design only. These examples are not evidence that the endpoint has been implemented, security-reviewed, or enabled for partners.

## 1. How an API is created in Travelar

An API endpoint is a versioned backend contract, not just a URL or Swagger page. For each endpoint, define: domain use case; who may call it; tenant/resource scope; request/response schemas; validation; business rules; state transitions; transaction/idempotency behavior; failure semantics; audit/log events; tests; OpenAPI docs; lifecycle/ownership.

For the selected NestJS + TypeScript/Fastify baseline, an implementation normally adds a controller/route, DTO or schema validator, domain application service, repository/query layer, authorization policy, migration if data changes, and unit/integration/contract/E2E tests. Nest's `@nestjs/swagger` can generate OpenAPI from decorators/schema metadata and expose UI/JSON. The generated document must be checked for missing routes, incorrect DTOs, absent error responses and security schemes: https://docs.nestjs.com/openapi/introduction.

**Do not build a hand-maintained OpenAPI contract that diverges from actual validation.** Treat the code/schema and generated specification as a CI-checked pair. If an API's schema is generated or validated using another framework already present in the repository, inspect that before adding packages.

## 2. Example public search request/response

### Request

```http
POST /v1/searches
Authorization: Bearer <partner-access-token>
Content-Type: application/json
Idempotency-Key: search-request-8e15d8...
```

```json
{
  "mode": "bus",
  "market": "TZ",
  "originLocationId": "loc_dar_es_salaam",
  "destinationLocationId": "loc_dodoma",
  "departureDate": "2026-11-15",
  "passengers": [{ "category": "adult", "count": 2 }],
  "locale": "en-TZ",
  "currency": "TZS"
}
```

### Illustrative response

```json
{
  "searchId": "srch_example",
  "mode": "bus",
  "market": "TZ",
  "currency": "TZS",
  "createdAt": "2026-10-28T08:00:00Z",
  "expiresAt": "2026-10-28T08:02:00Z",
  "freshness": { "status": "current", "asOf": "2026-10-28T08:00:00Z" },
  "offers": [
    {
      "offerId": "offer_example",
      "tripId": "trip_example",
      "operator": { "id": "op_example", "displayName": "Example Operator" },
      "origin": { "id": "loc_dar_es_salaam", "name": "Dar es Salaam" },
      "destination": { "id": "loc_dodoma", "name": "Dodoma" },
      "viaStops": [{ "id": "loc_morogoro", "name": "Morogoro" }],
      "departureAt": "2026-11-15T06:00:00+03:00",
      "arrivalAt": "2026-11-15T13:30:00+03:00",
      "vehicle": { "class": "executive", "make": null, "model": null, "registrationDisplay": null },
      "amenities": [],
      "availability": { "availableCount": 12, "asOf": "2026-10-28T08:00:00Z" },
      "price": {
        "currency": "TZS",
        "baseFare": "45000.00",
        "taxesAndLevies": "0.00",
        "serviceFees": "0.00",
        "discount": "0.00",
        "total": "45000.00",
        "quoteRequired": true
      },
      "actions": ["view_details", "select_seat"]
    }
  ],
  "nextCursor": null
}
```

All values above are fabricated examples for schema illustration, not an actual operator, route, fare or availability. Use decimal strings for money in external JSON to avoid floating-point representation errors. The actual API schema must clarify whether totals are per passenger, per offer or group; do not copy the example as a finalized contract.

## 3. Example create-quote and booking contract

A client should select a valid offer and supply passenger/occupancy information to a server-side quote operation. The server resolves the correct route segment, provider offer/room/activity, fare policy, commissions/markups, taxes/levies, discounts and currency. The quote includes an opaque ID, expiry and immutable pricing/policy snapshot references.

```http
POST /v1/quotes
Authorization: Bearer <partner-access-token>
Content-Type: application/json
```

```json
{
  "offerId": "offer_example",
  "journey": {
    "originStopId": "stop_dar",
    "destinationStopId": "stop_dodoma"
  },
  "passengers": [
    { "category": "adult", "count": 2 }
  ],
  "seatPreferences": ["window"]
}
```

The response contract must identify each line item, currency, expiration, terms version, passenger fields required, inventory status and what the quote does not guarantee. A quote is not itself a reservation.

Booking creation should be idempotent and reference the quote; the backend must revalidate required inventory and price and run the correct mode/provider state machine. Do not expose an endpoint that allows a partner to set `paid`, `issued`, `settled`, `approved` or `confirmed` directly.

## 4. Example API error envelope

Use a consistent problem response, e.g. `application/problem+json`, adapted to Travelar's existing conventions if already present:

```json
{
  "type": "https://developers.travelarway.com/problems/availability-changed",
  "title": "Availability changed",
  "status": 409,
  "code": "AVAILABILITY_CHANGED",
  "detail": "The selected seat is no longer available. Refresh availability and choose another seat.",
  "requestId": "req_example",
  "retryable": false
}
```

Never return SQL traces, internal stack traces, secret provider messages or another tenant's record existence. Distinguish validation errors, unauthenticated, forbidden, not found (without leaking cross-tenant data), conflict/state transition, rate limit, provider pending/unknown, and server failure.

## 5. Illustrative API resource inventory

This table helps product/engineering scope work; actual routes must be reconciled with the repository and published only after implementation.

| Capability | Example route | Required controls |
|---|---|---|
| Public catalog | `GET /v1/locations` | market/mode/locale filter, pagination, cache scope, public field projection |
| Search | `POST /v1/searches` | scopes, input schemas, rate limits, provider freshness and abuse protection |
| Quote | `POST /v1/quotes` | server pricing, expiry, required fields, provider revalidation |
| Booking | `POST /v1/bookings` | idempotency, inventory transaction, provider uncertainty recovery, immutable snapshots |
| Status | `GET /v1/bookings/{id}` | object-level authorization, PII projection, partner ownership |
| Cancellation | `POST /v1/bookings/{id}/cancel-requests` | policy/provider check, approval, async result and audit |
| Operator route | `POST /v1/operator/routes` | operator/branch scope, schema/duplicate checks, draft status |
| Schedule preview | `POST /v1/operator/schedule-rules/{id}/preview-generation` | permission, date limits, conflicts, no mutation |
| Schedule generation | `POST /v1/operator/schedule-rules/{id}/generate-trips` | idempotency, review/approval, audit, conflict handling |
| Staff invitation | `POST /v1/operator/staff-invitations` | scope/role grants, single-use token, expiry, delivery audit |
| API credentials | private partner-console operation | authenticated partner admin, scope/expiry/revoke/rotation, never return secret again |
| Webhook endpoint | partner console configuration | URL verification/SSRF protections, secret handling, HTTPS, event-subscription scope |

## 6. API documentation lifecycle

1. Agree the consumer story and scope.
2. Define DTOs/schemas, error envelope and authorization requirements.
3. Implement domain logic and migrations before claiming persistence is real.
4. Add controller and generated OpenAPI decorators/metadata.
5. Generate the OpenAPI JSON/YAML during CI and validate it against the selected OAS version/tooling.
6. Add examples and contract tests from the same schema.
7. Security-test partner scopes, IDOR/object authorization, property access, rate limits, replay/idempotency and tenant isolation.
8. Publish only the approved version to a developer portal; separate partner-visible from internal admin APIs.
9. Track change log, support window, deprecation and migration guidance.
10. Measure usage and costs; reconcile actual partner usage to contracted fees before invoicing.

## 7. Suggested repository organization

Adapt to the actual monorepo; do not create duplicate structures if equivalent modules already exist.

```text
apps/
  public-web/
  oims-web/
  hims-web/
  partner-portal/
  api/
packages/
  api-contracts/
  ui-config-schema/
  domain-types/
docs/
  api/
    openapi/
    guides/
    webhooks/
    changelog/
```

Inside the existing NestJS API, organize by domain module (master data, operators, routes/schedules, fleet/inventory, search/quotes, bookings, payments/ledger, staff/access, integrations, audit, reporting). Module boundaries must follow the actual repository and selected modular-monolith ADR, not this sample directory tree blindly.
