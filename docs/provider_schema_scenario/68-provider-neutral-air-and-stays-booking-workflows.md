# 68 — Provider-Neutral Air and Stays Booking Workflows

**Date:** 28 October 2026  
**Status:** Canonical domain/workflow proposal derived from public Travelport/Sabre documents; account/market/airline/hotel-specific behavior remains conditional.  
**Audience:** Product, UX, backend, QA, integrations, customer care, finance and HIMS operations.

## 1. Design principle

Travelar owns the customer journey, policy decisions, canonical states, data contracts, operational queues, financial record and help experience. Travelport and Sabre are suppliers/integration providers behind server-side adapters. The public UI must not copy provider branding, internal object names, agency workflows or provider API sequences as if they were the Travelar product.

The canonical workflow is not a claim that all providers perform the same steps. The adapter must expose each route's supported capabilities and required actions. Travelar orchestrates the customer experience around that truth.

## 2. Canonical domain objects

| Object | Required responsibility / fields |
|---|---|
| `SearchSession` | `id`, mode, market/point-of-sale, search criteria, traveler/guest counts, locale/currency, started/expired timestamps, source versions, provider attempts and statuses. Avoid storing unnecessary PII in search logs. |
| `OfferSnapshot` | Travelar offer ID; supplier/provider; provider-specific offer reference stored privately; itinerary/property details; price components; currency; conditions; baggage/ancillary data where supplied; timestamps; source; capability and commercial-policy versions; price/terms expiry where returned. |
| `RevalidationAttempt` | Offer ID, provider, outcome, changed price/conditions, trace/correlation IDs, timestamps, error classification and raw-status reference. Do not overwrite prior snapshots. |
| `Booking` | Travelar booking number; owner/tenant/channel; customer; selected item(s); state; cancellation/fulfillment status; authoritative amounts; policy snapshots; supplier reference(s); timestamps; audit history. |
| `SupplierReservation` | Supplier locator/order/reference, reservation state, provider raw status, provider expiration/time limit and ticket/voucher IDs. One Travelar booking may have multiple supplier reservations. |
| `PaymentAttempt` | Unique attempt/idempotency key, currency, amount, provider, method, reference, collection status, merchant settlement status, callbacks/query evidence, fees and policy snapshot. |
| `FulfillmentItem` | Ticket, voucher or supplier confirmation per traveler/item; issue status; provider document/reference; issue and verification timestamps; recovery process if missing. |
| `AfterSalesCase` | Refund, void, exchange, cancellation, traveler change, hotel cancellation, schedule disruption or dispute; eligibility source; quote; approvals; payment/refund link; operator/agent actions; deadlines; customer communication. |
| `ProviderCapabilitySnapshot` | Provider/account/market/mode/content-source, action flag, known constraints, documentation version, verification status, effective dates, evidence reference, last checked date. |

Use IDs and snapshots, not public provider references, as primary Travelar identifiers. Provider locators may be unique only within a provider, environment or account; namespace them accordingly.

## 3. Air shopping and booking lifecycle

### 3.1 User-facing flow

1. **Search form:** origin/destination (airport/city), dates, one-way/return/multi-city if the current provider/content can support it, passenger mix and count, cabin, currency/market, optional preferences. Form configuration is data-driven, but backend validation enforces allowed criteria.
2. **Search results:** normalize offers from entitled providers, deduplicate where appropriate without merging distinct fares incorrectly, group/label itineraries clearly, display total price and required components, baggage/brand/fare conditions only when supported by source data. Filter/sort by relevant options and disclose when an item is non-refundable or provider data is incomplete.
3. **Offer details:** present itinerary, carrier/operator names, stops, transfer/connection information, baggage/ancillaries, conditions, price details, quote time and what is not included. Never hide a material fee until after booking intent.
4. **Continue / revalidate:** server-side checks the offer is still available, priceable and valid. If price, schedule or material terms change, stop and show a human-readable difference; request explicit customer consent before proceeding at the changed terms.
5. **Traveler details:** validate required names, dates of birth, contact, document details only where the provider/carrier/market requires them. Explain why a sensitive field is required. Do not collect a passenger ID just because it may be available in some supplier payload.
6. **Ancillaries:** show seat/baggage/meal/assistance only when the selected provider/content workflow supports them. Keep ancillary amounts separate and link them to the correct traveler and supplier item.
7. **Payment and booking orchestration:** apply the specific contracted channel policy and supplier workflow. Do not hardcode a universal order such as “always take Travelar payment before booking.” A supplier may require form of payment at reservation, ticketing or instant purchase; an agency may have a credit/settlement arrangement; a customer-paid flow may require confirmed funds before issuing the ticket. Model the chosen sequence as a documented, tested commercial route.
8. **Confirmation:** display only the strongest verified state. A request received, held reservation, booking created and ticket issued are different claims. Give a Travelar booking reference even if supplier references are also shown.
9. **Manage booking:** retrieve and reconcile the current supplier record before offering changes, cancellations, seat changes or refunds. Check fare/airline/content rules, supplier capability, ticket status and deadlines first.

### 3.2 Canonical booking states

These are Travelar states, not a copy of the status enum of any supplier:

`DRAFT` → `SEARCHED` → `OFFER_SELECTED` → `REVALIDATION_PENDING` → `OFFER_REVALIDATED` → `BOOKING_REQUESTED` → one of:

- `RESERVATION_HELD` — reservation exists, but ticket/fulfillment is still outstanding;
- `BOOKED_UNTICKETED` — booking accepted and ticketing required next;
- `BOOKED_TICKETED` — required ticket document(s) verified;
- `INSTANT_FULFILLMENT_PENDING` — provider requires immediate fulfillment after create;
- `TICKETLESS_CONFIRMED` — only if provider/carrier capability explicitly documents no separate ticket;
- `MANUAL_REVIEW_REQUIRED` — state uncertain or workflow blocked;
- `FAILED` / `CANCELLED` — only after a confirmed terminal outcome.

Do not force every journey through every state: an adapter may make a documented direct transition for a supported route. Preserve transition evidence and actor/correlation IDs. Unknown timeout after a create/commit/fulfillment call must query/retrieve before a repeated create to avoid duplicate bookings or tickets.

### 3.3 Search and time windows

Travelport publicly documents search payload caching of 12 minutes for GDS content and 34 minutes for NDC content, and a 30-minute workbench lifetime. These are supplier-specific; store provider-returned expiry when available and configure known constraints per API. Use an internal conservative deadline only as a guardrail, not as the external truth. The server must reject a stale offer and rerun/revalidate according to provider requirements.

### 3.4 Sabre route documented in the current guide

For applicable entitled content, the public Sabre guide describes `Flight Shop` → `Flight Check` → `Booking Management createBooking` → `fulfillFlightTickets`, with optional `Flight Reshop`. Each call maps to Travelar's canonical orchestration, not to user-facing terms. Carrier, NDC, LCC and ticketing prerequisites must be checked from current documentation/account entitlements before enabling the route.

### 3.5 Travelport routes

Travelport documents both a multi-request workbench flow and Unified Checkout. They have different constraints; the guide notes that seats/ancillaries are not supported in the Unified Checkout flow described in current docs. The route selected for an offer must have a capability snapshot and a tested workflow. Avoid trying to force all offers through whichever route requires fewer API calls.

## 4. Accommodation/stays lifecycle

1. Search destinations/property IDs or location with stay dates, room count, adult/child counts and required ages/occupancy details.
2. Search properties and availability using sources/versions the account can access. Separate generic property content from rates and room availability.
3. Display property photos/description/amenities only under the source's allowed usage; store content provenance, last update and image rights/policy.
4. Revalidate selected rate/room/occupancy, total price, taxes/fees, cancellation deadline, prepayment/deposit, meal plan and other material terms before checkout.
5. Collect guest details and any required property-specific information; do not assume guest name rules equal flight traveler-name rules.
6. Execute provider-authorized booking; store the supplier confirmation. Retrieve after creation and verify the reservation status and confirmation numbers.
7. For modify/cancel, fetch current booking and conditions, obtain a current quote/eligibility result where offered, display consequences, require explicit confirmation and record the supplier's final result.
8. Handle supplier-collected vs Travelar/PSP-collected payment as separate commercial models. The existence of availability/content APIs does not prove booking or payment rights.

## 5. Confirmation UI patterns

| Situation | Customer message and action |
|---|---|
| Search loading | “Finding available options…”; cancellation/back can be offered without claiming results are guaranteed. |
| Price/terms changed | Show old vs new total, key changed terms and why; buttons “Review new price” and “Choose another option”. Do not silently accept. |
| Reservation held, ticket pending | “Your reservation is held. Ticket issuance is still in progress.” Show deadline only if authoritative provider time limit is known. Offer safe contact/support. |
| Payment pending | “We’re checking your payment. Do not pay again yet.” Start server-side status recovery; provide support reference. |
| Payment confirmed, provider fulfillment unclear | “Payment is confirmed; supplier confirmation is being verified.” Queue incident/reconciliation and never display a ticket that does not exist. |
| Ticket issued | Show Travelar booking ID, actual carrier, passenger names, verified ticket number or protected download, itinerary, conditions and support. |
| Cancel/refund requested | “Request submitted” until provider status proves completion; show estimated or contractual timing only where evidenced. |
| Provider timeout after create | “We’re confirming the booking status. Please don’t submit again.” Retrieval/query is mandatory before retry. |

## 6. After-sales and disruptions

- The UI must not promise refund/exchange/void availability based only on a generic policy. Query supplier eligibility and fare rules when available and surface restrictions.
- Ticket void windows often vary by ticket issue date, market, airline and agency configuration. Travelport's guide explicitly documents such variation. Use returned terms and support route, not a universal cutoff.
- Model supplier communication state and customer notification state separately. An email sent is not the same as the supplier accepting the action.
- Every cancellation/refund/exchange records actor, reason, pre-state, quote/policy snapshot, customer confirmation, approver if required, supplier request/response, payment/ledger entries, final status and associated case.
- Involuntary schedule changes need a disruption case, customer impact list, carrier options, accepted/rebooked/refunded path and audit trail. Bulk action should require preview and explicit confirmation.

## 7. Errors, idempotency and recovery

| Error class | Required handling |
|---|---|
| Search transient failure | Retry bounded safe search with timeout/circuit-breaker; provider-specific trace ID stored. Results must identify missing source coverage internally. |
| Offer stale / price changed | Revalidate/research; compare terms; ask customer before changed commitment. |
| Provider 4xx business rejection | Normalize to a safe public explanation and internal actionable reason; don't blind-retry. |
| Provider 429/rate limit | Respect `Retry-After` or documented cooldown; queue and observe per-account rate caps. |
| Timeout on create/commit/fulfill | Mark outcome unknown, query/retrieve by idempotency/reference/locator, reconcile before retry. |
| Partial multi-provider failure | Return eligible results with clear coverage only if policy permits; expose missing providers in telemetry, not unverified claims. |
| Unknown/malformed provider response | Reject unsafe advancement; retain redacted trace and route to integration error queue. |
| Inconsistent supplier and Travelar state | Create reconciliation task; no silent overwrite; append corrective event and approved ledger reversal/adjustment where needed. |

## 8. Acceptance tests

- Search request schema and each mode-specific criterion validated at backend.
- Offer provenance, provider ref, quote currency and expiry are captured.
- Revalidation detects inventory/price/condition changes and requires consent.
- Retry of idempotent search is safe; create/fulfill retry after uncertain outcome cannot duplicate booking/ticket.
- Held reservation is never labelled ticketed.
- Ticket details displayed only after verified fulfillment/retrieval.
- Cancellation/refund eligibility is based on supplier response/terms, with approval rules and financial journal entries.
- Provider failure, throttling and outage produce actionable operational queues and useful customer states.
- PII is not leaked to logs, analytics, URLs or traces.
- Supplier names are truthful; provider/GDS trademarks are not used as Travelar section names or marketing claims.
