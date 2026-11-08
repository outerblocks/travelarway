# Travelport Flights Adapter — Design

**Date:** 2026-11-01 · **Status:** for review · **Supersedes:** nothing; this is the first GDS slice
**Governing decisions:** [ADR-GDS-001](../../research_bundle/ADR-GDS-001-multi-provider-adapters.md) (multi-provider adapters), [ADR-GDS-003](../../research_bundle/ADR-GDS-003-travelport-stays-searchcomplete-capability-gate.md) (stays version gate), [provider-integration.mdc](../../engineering_governance/.cursor/rules/provider-integration.mdc)

## Summary

Replace the `FLIGHT_RESULTS` fixture behind flight search with Travelport TripServices Flights v11, behind a provider-neutral adapter that records what it has actually proven. Search is verified working against pre-production. Booking is partially verified. **Ticketing is not verified and this design does not enable it.**

The organising principle is that a provider capability is either *demonstrated against the live endpoint* or it is *recorded as blocked evidence*. Nothing in between. Three of the discoveries below contradicted the documentation as I'd read it, which is why that line matters.

## Evidence base

Each row states how the fact was obtained. Nothing here is inferred from documentation summaries.

| Fact | Status | How known |
| --- | --- | --- |
| Token: `POST https://auth.pp.travelport.net/oauth/token`, `grant_type=password`, all four identity fields in the body, no Basic header | **Proven** | HTTP 200, `expires_in: 86400` |
| `client_credentials` also mints a token but that token is refused downstream | **Proven** | gateway `1012100` vs API JSON error |
| Search: `POST air/catalog/search/catalogproductofferings` | **Proven** | 12 offerings, 73 flights, 41 products, 12 terms |
| Branch header is `XAUTH_TRAVELPORT_ACCESSGROUP` (underscores) | **Proven** | error code changed 2501 → 2500 when spelling corrected |
| `TVP-PCC-CORE` is ignored by this endpoint | **Proven** | identical error to sending no header at all |
| **Application errors return HTTP 200** | **Proven** | price call: `HTTP 200` + `Result.Error` 3460 |
| Workbench create returns `Reservation.Identifier.value`; DELETE returns 204 | **Proven** | created and cleaned up `3bc00e95-…` |
| Price/validate request shape | **Not proven** | endpoint reached; my `SpecificFlightCriteria` rejected as missing flight segments |
| Add traveller / add offer / commit | **Read only** | from DevKit request bodies; never exercised |
| Ticket issuance, form of payment | **Not exercised** | deliberately withheld — see [Ticketing](#ticketing-is-not-enabled) |
| Offer expiry / validity window | **Not found** | no such field in the observed search response |

## Findings that change the design

### 1. HTTP status is not a success signal

Travelport returns `200` with a populated `Result.Error` for business failures. Any adapter that checks `response.ok` will treat a rejected price as a successful one and pass an empty or partial offer downstream.

Every response therefore goes through one function that treats `Result.Error` as authoritative regardless of status, and maps `SourceCode` to a Travelar error. `category: "TERMINAL"` is preserved per the DevKit's own tests, which assert on it.

### 2. An offering contains no journey data

`CatalogProductOffering` carries only references — `{"BrandRef":"b0"}`, `{"productRef":"p0"}`, `"flightRefs":["s2"]`, `termsAndConditionsRef: "T0"`. The flights, products, brands and terms live in `ReferenceList`, an **array of four sections** (`Flight`, `Product`, `Brand`, `TermsAndConditions`) keyed by short ids.

Normalisation is a four-way join. Two consequences: an offering cannot be rendered without its whole response, and the short reference ids (`s1`, `p0`, `b0`) are **only unique within one response** — they must never be persisted as if they were stable identifiers.

### 3. Quoted currency is not our currency

Pre-production quotes **GBP** with `{"decimalPlace":2,"value":"GBP"}`, `Base 66 / TotalTaxes 26.1 / TotalPrice 92.1`. Point of sale was not sent. Per the HIMS finance design, provider currency, display currency and charge currency are three different things and the markup decision belongs to HIMS, not to this adapter. The adapter records what Travelport said and converts nothing.

`decimalPlace` is provider-supplied and must be honoured rather than assuming two decimals — a provider that says `0` means the minor unit is the whole number.

### 4. Booking is a session, not a call

The chain threads a workbench identifier through every step: create session → add travellers → add offer → commit → PNR. The session is server-side state we are responsible for releasing. `DELETE air/book/session/reservationworkbench/{id}` returns 204; **its expiry is unknown**, which is an open question rather than an assumption.

## Architecture

```
routes/api.flights.search.ts        ← passenger-facing, provider-neutral
        │
server/air/search.ts                ← Travelar domain: offers, prices, provenance
        │
server/providers/flight-provider.ts ← the contract: capabilities + operations
        │
server/travelport/flights.ts        ← TripServices v11 adapter (this design)
        │
        ├── auth.ts       token acquisition, caching, single-flight refresh
        ├── client.ts     headers, request, 200-with-error normalisation
        ├── search.ts     request build + reference join
        └── errors.ts     SourceCode → Travelar error
```

**Transport stays behind the adapter.** `client.ts` is the only file that knows about `fetch`, `Accept-Version`, and the access-group header. A future Sabre adapter is a sibling, not a modification, per ADR-GDS-001 §13.

### Capabilities, declared not assumed

```ts
interface FlightProviderCapabilities {
  search: boolean;
  offerValidation: boolean;
  booking: boolean;
  ticketing: boolean;
  ancillarySeats: boolean;
  cancellation: boolean;
}
```

For the current Travelport pre-production client: `search: true`, everything else **`false`**. These values are derived from the capability registry, not hardcoded, and the registry row records the evidence and date for each.

`client.ts` refuses any operation whose capability is false, before making a call. The UI reads capabilities and renders accordingly — so a passenger is never offered a booking that would fail at the last step.

## Data model

Four tables, in `app` schema, following existing migration conventions. The first three belong
to this slice; `integration_operations` is created with the booking work but is specified here
so the search slice does not later have to retrofit provenance onto existing rows.

**`app.provider_capabilities`** — one row per provider/product/version/operation. Columns: `provider`, `product`, `api_version`, `operation`, `status` (`PROVEN` / `READ_ONLY` / `BLOCKED` / `DISABLED`), `evidence_note`, `evidence_date`, `environment`, `enabled`. This is the machine-readable form of the table at the top of this document, and it is what `client.ts` consults.

Note the distinction the evidence table draws: `offerValidation` is `READ_ONLY`, not `BLOCKED` — the endpoint was reached and answered with a business error, so the operation exists and only our request shape is unproven. Recording it as blocked would lose that, and recording it as proven would be false.

**`app.air_search_sessions`** — one row per search: `id`, `provider`, `transaction_id`, `point_of_sale`, `currency`, `request_summary`, `raw_response` (jsonb), `offered_at`, `expires_at` (nullable until the provider tells us a lifetime), `created_at`.

**`app.air_offers`** — one row per offering within a session: `id`, `session_id`, `provider_offer_ref`, `sequence`, `content_source`, `price_provider` (numeric), `currency_provider`, `price_breakdown` (jsonb), `product_refs` (jsonb), `terms_ref`, `brand_ref`. `provider_offer_ref` is stored **with** `session_id`, never alone, because `p0` in one response is a different product in another.

**`app.integration_operations`** — the intent log that makes ambiguous outcomes resolvable: `id`, `provider`, `operation`, `idempotency_key`, `status` (`INTENDED` / `SENT` / `CONFIRMED` / `FAILED` / `UNKNOWN`), `request_summary`, `provider_reference`, `error_code`, `error_message`, timestamps. Written **before** a mutating call, updated after. `UNKNOWN` is a terminal state that blocks automatic retry until retrieval resolves it, and a partial unique index on `idempotency_key` where status is not terminal prevents two concurrent attempts of the same operation.

Raw payloads are retained. When a price is disputed, the provider's own bytes are the evidence, and reconstructing them later is not possible.

## Search path

1. Resolve the request into a provider-neutral search (origin, destination, date, party, cabin).
2. Check the registry: `travelport / flights-v11 / search` must be `PROVEN` and `enabled`.
3. Acquire a cached token; refresh when within 10% of `expires_in`, with single-flight protection so concurrent requests do not each mint one.
4. `POST catalog/search/catalogproductofferings` with `XAUTH_TRAVELPORT_ACCESSGROUP`, `Accept-Version`, `Content-Version`, `Accept-Encoding`.
5. Normalise: join the four reference sections, produce offers, keep the raw response.
6. Persist session + offers, return Travelar-shaped results.

**Nothing is cached beyond our own session rows.** The brief's caching section is deferred deliberately: caching provider offers without knowing their expiry can only produce stale quotes, and we have not found the expiry.

## Booking path — designed, not enabled

Recorded so the shape is settled before it is exercised:

`createWorkbench` → `addTravellers` → `addOffer` (from the stored product references) → `commit` → PNR, with `DELETE workbench` on any abandoned path.

**Ambiguous outcomes.** The governance rule *"after timeout on a mutating operation, query/retrieve/reconcile before retry"* becomes concrete here: a retried commit can create a second PNR. Every mutating call is written to `app.integration_operations` first (intent), then updated with the provider response, and a timeout leaves the row `UNKNOWN` — which blocks retry until `GET air/book/reservation/reservations/{pnr}` or workbench retrieval resolves it. The operation log is the mechanism, not a nice-to-have.

**Revalidation before booking.** `price/offers/buildfromproducts` with `validateInventoryInd: true` sits between search and booking. A search result is a quote, not an entitlement to that price.

### Ticketing is not enabled

Ticket issuance requires a form of payment. We have not been given one, and `air/payment/reservationworkbench/{id}/formofpayment` has never been called. Per ADR-GDS-001 §7 and the governance rules, ticketing stays `BLOCKED` with that as the recorded evidence.

This is stated plainly because the requested vertical was "search → book → ticket". Search and booking are on the path; ticketing needs a provisioning input nobody has supplied, and inventing a payment instrument to make a demo complete is exactly what the rules forbid.

## Provider neutrality in the UI

Flight results must not render Travelport vocabulary. The adapter maps to Travelar's own offer shape; carrier, cabin, baggage and brand conditions pass through as data. Per the rules, `NDC` versus `GDS` content and its servicing differences are recorded per offer (`content_source`), never merged — two identical-looking offers with different content sources have different change and refund behaviour.

## Fixtures and the transition

`FLIGHT_RESULTS` currently backs results, booking and review. The switch is a capability check, not a flag: when `search` is `PROVEN` and enabled, the page reads the adapter; otherwise it shows an explicit "flights not available" state. **No fallback to fixtures** — a page that quietly reverts to invented fares is worse than one that says it cannot serve.

Fixture removal from the flight path is part of this slice, matching what was done for trains.

## Testing

| Layer | Coverage |
| --- | --- |
| Unit | reference join; `200 + Result.Error` → failure; `decimalPlace` handling; capability refusal; token refresh single-flight |
| Contract (recorded) | fixtures captured from live responses; schema assertions, no network |
| Bounded live probe | `scripts/probe-travelport.mjs` — auth + search, run by a human, never in CI |
| Registry | a test asserting no operation is `enabled` unless a `PROVEN` row with a date exists |

The last row is the one that keeps this honest: **capability is data, and the test makes it impossible to enable an operation by editing code alone.**

## Out of scope

Stays (separate design; the v11 and v12 SearchComplete DevKits are in the repo and v12 stays gated per ADR-GDS-003). Ancillaries and seat maps. Servicing, exchanges, refunds. Sabre. Payment and settlement — ClickPesa collects from the customer; supplier settlement is a separate provider relationship.

## Open questions for Travelport

1. **Offer validity.** No expiry field was observed. What is the `BestCombinablePrice` lifetime, and is it returned anywhere?
2. **Workbench session TTL.** How long before an abandoned `reservationworkbench` expires server-side?
3. **Currency and point of sale.** How is a TZ point of sale with TZS pricing requested — a header, or a request field?
4. **Form of payment.** What FAP is configured on this pre-production branch, and is sandbox ticketing virtual or real?
5. **Version headers.** `Accept-Version`/`Content-Version` were sent as `11` and worked; the DevKit is titled v26.11.1. Which is authoritative, and what happens when they diverge?

## Completion criteria for this slice

- Search returns live offers through the adapter, with the raw response persisted.
- Every capability other than search is `BLOCKED` or `READ_ONLY` in the registry, with evidence text.
- Flight results, booking and review read the adapter or show an explicit unavailable state — no fixtures.
- A failing price call is surfaced as a failure, proving the 200-with-error path works.
- The probe is documented and the workbench it creates is deleted.
