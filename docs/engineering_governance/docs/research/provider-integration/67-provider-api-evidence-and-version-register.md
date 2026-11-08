# 67 — Provider API Evidence, Capability and Version Register

**Product:** Travelar  
**Research date:** 28 October 2026  
**Status:** Research/design baseline; not a provider contract, certification, production entitlement or legal opinion.  
**Owners:** Product/Engineering, Supplier Integrations, Payments/Finance, Security, Compliance

## 1. Purpose

This document turns the supplied ClickPesa, Sabre and Travelport documentation into a controlled evidence register for product design and implementation. It does not mean every listed endpoint has been individually implemented, entitlement-tested or approved for production. The repository agent must reopen the exact documentation before implementing each endpoint, record the current version, schemas, required headers, scopes, error codes and entitlement gates, and label the environment used for validation.

## 2. Evidence labels

| Label | Meaning | What it does not mean |
|---|---|---|
| **V — Verified in public primary documentation** | The named public vendor documentation currently states the capability or constraint. | It does not prove Travelar has an account, contract, production entitlement or legal permission. |
| **P — Preliminary / version-sensitive** | Product catalog, beta status, older URL, public example or secondary source gives a lead to investigate. | It must not drive a production interface until current documentation is rechecked. |
| **C — Contract/account confirmation required** | Capability, price, limit or behavior depends on commercial agreement, account, market, airline, hotel or PSP configuration. | Never assume the generic public documentation guarantees Travelar access. |
| **U — Unknown** | Current public material reviewed here does not settle the question. | Do not fill the gap with a plausible implementation. |
| **D — Deprecated / avoid for new implementation** | The source marks the endpoint or product deprecated, or the current catalog says Deprecated. | Do not use unless an approved migration/compatibility exception names it. |

## 3. ClickPesa — current documented collection capabilities

Official current documentation: [Integration overview](https://docs.clickpesa.com/home/integration-overview), [BillPay overview](https://docs.clickpesa.com/bill-pay/bill-pay-overview), [Create Order Control Number](https://docs.clickpesa.com/api-reference/collection/billpay/create-order-control-number), [TanQR/Lipa Namba](https://docs.clickpesa.com/tan-qr/tan-qr-overview), [CRDB Direct Debit](https://docs.clickpesa.com/crdb-direct-debit/crdb-direct-debit-overview), [Webhooks](https://docs.clickpesa.com/home/webhooks), [sandbox and testing guidance](https://docs.clickpesa.com/home/sandbox-and-testing-environment).

| Product | Publicly documented use | Travelar candidate use | Important boundary / evidence still needed |
|---|---|---|---|
| **BillPay Order Control Number** | Unique payment reference for a specific bill/order; customers pay through supported mobile-money/bank channels; query API and webhooks available. Supports `EXACT` or `ALLOW_PARTIAL_AND_OVER_PAYMENT`. | Primary OTC/counter POC for one booking where exact amount and provider-account entitlement are confirmed. | Query the exact supported amount/mode fields and reference constraints. No Travelar booking expiry is supplied automatically by our own booking timer; test provider-reference deactivation and late-payment races. Signed fee schedule, refunds and marketplace/split-settlement rights remain **C/U**. |
| **BillPay Customer Control Number** | Customer-level reference suited to customer-associated repeat/recurring payments. | Consider only for a separately designed account/deposit use case, not as the default one-ticket checkout. | Do not reuse a long-lived customer reference as an order-specific payment confirmation without a reliable allocation model. |
| **USSD Push** | Initiates a mobile wallet prompt and customer authorizes on their phone; status can be queried and events delivered. | Assisted checkout or digital checkout when the requested wallet, merchant account and country are enabled. | Provider collection status must be verified server-side. Customer completing a PIN prompt or browser return is not, by itself, proof that booking is fully paid/settled. |
| **Card / Hosted Checkout** | Hosted payment flow documented by ClickPesa. | Possible card payment route where enabled and commercially approved. | Verify allowed card brands, 3-D Secure/SCA behavior where applicable, refund/void API, fee bearer, fraud/chargeback responsibilities and PCI scope. Do not collect raw card data in Travelar unless a separately approved compliant design requires it. |
| **TanQR / merchant Lipa Namba collection** | A merchant QR/Lipa Namba allows collection; payer scans/enters the amount through supported channels. ClickPesa distinguishes collecting into the merchant's own number from paying out to another person's Lipa Namba. | Counter collection where each payment can be reliably matched; possibly not default for booking-specific checkout. | Amount and time matching alone are insufficient to allocate money to a booking. Ask whether a per-order QR or machine-readable reference can be issued for Travelar's account; otherwise use only with human-assisted reconciliation and an explicit control. |
| **CRDB Direct Debit** | Customer approves a mandate; scheduled collections can run after approval through CRDB banking flow. | Recurring payments/deposits if a business need exists and customer consent/terms are explicit. | Not a generic immediate checkout replacement. Validate mandate status, cancellations, retries, schedule and refund/cancellation rights. One account/mandate constraints must be read from the current API contract before implementation. |

### Current BillPay implementation observations

- The current create reference schema lists `billPaymentMode` values `EXACT` and `ALLOW_PARTIAL_AND_OVER_PAYMENT`; do not accept the provider default implicitly. Travelar must send the chosen mode explicitly.
- A reference may be updated through the current `PATCH /third-parties/billpay/{billPayNumber}` endpoint. The API reference lists a legacy `PUT Update BillPay Number Status` endpoint separately; current documentation must be rechecked and the deprecated legacy endpoint must not be chosen by habit.
- A provider reference and Travelar booking are separate records. Store `travelarBookingId`, `paymentAttemptId`, `providerReference`, amount, currency, provider account/config version, request/response correlation IDs, effective tariff and provider status transitions.
- Do not infer that `SUCCESS` and `SETTLED` are equivalent. The payment query documentation distinguishes provider payment states; preserve the raw status and map each only after the current schema’s definitions are confirmed.

### ClickPesa payouts — distinct operation from collections

Official pages: [Mobile Money Payout API](https://docs.clickpesa.com/payout-api/mobile-money-payout-api/mobile-money-payout-api-overview), [Lipa Namba Payout API](https://docs.clickpesa.com/payout-api/lipa-namba-payout-api/lipa-namba-payout-api-overview), [Bank Payout API](https://docs.clickpesa.com/payout-api/bank-payout-api/bank-payout-api-overview), [payout statuses](https://docs.clickpesa.com/home/payout-status).

| Documented point | Design consequence |
|---|---|
| Mobile payout: preview verifies phone, amount, fee and available balance before create. Funding can be TZS or USD, but wallet recipients receive TZS. | Preview before any payout creation. Record exchange details and recipient currency when applicable; never silently reinterpret currencies. |
| Lipa Namba payout: preview resolves destination and beneficiary name and checks fee/balance; only one destination form should be supplied as required by current schema. | Require a successful preview and beneficiary-name review before creating the payout. Mask beneficiary data in logs. |
| Payout creation is rate-limited to one create request per merchant every 60 seconds for documented mobile/Lipa Namba operations. | Queue and batch/schedule payouts; never make a payout create call for each ticket. Confirm production/account limits and whether a negotiated alternative exists. |
| Lipa Namba payouts are asynchronous; `AUTHORIZED` means accepted/starting, not completed settlement. Other normalized statuses include `PROCESSING`, `SUCCESS`, `REFUNDED` and `REVERSED` with provider-specific meanings. | Keep `PayoutAccepted` separate from `PayoutCompleted`. Do not clear a supplier payable or report beneficiary credit solely from `AUTHORIZED`. Verify the exact finality semantics for each rail. |
| Public docs do not establish a Travelar marketplace split-settlement contract. | **Split settlement is unknown until written, account-specific evidence exists.** Build direct supplier collection plus separate invoicing/reconciliation as an alternative, subject to legal and commercial approval. |

### Webhooks and tests

- ClickPesa documents application-level and merchant-level webhooks. For application transactions, configured application-level routing can take precedence over a merchant-level URL. Verify actual account configuration.
- Treat callbacks as at-least-once, out-of-order and possibly delayed unless contract evidence proves otherwise. Persist event metadata, authenticate using the currently documented checksum/signature process, deduplicate, acknowledge only after durable receipt, and process asynchronously. A successful HTTP 2xx callback response indicates receipt/acknowledgement; it does not prove that Travelar's business processing finished successfully.
- ClickPesa documentation states there is no sandbox and that API Explorer/live API operations can move real funds. Therefore integration tests use mocks/contract fixtures and recorded redacted examples. Real-money tests require named human authorization, approved low limits, a reconciliation plan and stop conditions.
- Current rate, fees/taxes, KYC restrictions, account thresholds, API call limits, live channel entitlements, refund behavior, support SLAs and data-processing terms must be rechecked with ClickPesa and recorded as **C** or **U** until confirmed.

## 4. Sabre — product/version evidence

Primary sources: [Sabre Developer Hub](https://developer.sabre.com/), [New to Sabre modern air workflow](https://developer.sabre.com/product-collection/new-to-sabre/v1/help-documentation/guides.html), [Sabre sandbox collection](https://developer.sabre.com/product-collection/sabre-sandbox).

As of the 28 October 2026 review, the public Developer Hub's latest-updates area lists **Booking Management API REST v1** (updated 23 October 2026), **Hotel Search API Beta v1** and **Hotels Rates API Beta v1** (22 October 2026), and **Get Hotel Avail SOAP 5.0.0** (21 October 2026). It also lists **Bargain Finder Max Premium Deprecated SOAP 7.2.0** (15 October 2026). These are catalog update dates, not a promise of Travelar entitlement or the only products/versions in the catalogue.

### Modern air flow documented by Sabre

The current New to Sabre guide describes this flow for applicable/entitled content:

1. **Flight Shop** (`POST /flightShop`) — shop for offers across supported ATPCO, NDC and LCC sources.
2. **Flight Check** (`POST /flightCheck`) — revalidate/price-check the selected offer before booking.
3. **Booking Management Create Booking** (`POST /createBooking`) — create the booking/order from the validated offer and passenger data.
4. **Booking Management Fulfill Flight Tickets** (`POST /fulfillFlightTickets`) — issue tickets within the airline/provider ticketing limit.
5. **Optional Flight Reshop** — search exchange offers for a supported existing ticket/order and then follow the correct revalidation/booking/fulfillment flow.

This is not universal across every carrier/content source. LCC flows, NDC entitlements, form-of-payment requirements, fulfilment deadlines and post-booking capabilities can vary. The current guide explicitly notes content entitlements and carrier-specific behavior. Treat production access, ticketing rights, agency identifiers, payment model and supported markets as **C**.

### Supplied Sabre URLs — migration caution

The supplied list contains older/versioned paths for `flightSearch`, `flightShop`, `flightShopLite`, `flightCheck`, `flightRefresh`, `revalidateItinerary`, `Bargain Finder Max`, Hotel APIs v4/v4.1 and other destination/content utilities. Those are discovery references, not proof that each exact endpoint is current. The current Developer Hub shows product/version movement during October 2026, including newer Booking Management, a v5.0 Hotel Availability SOAP API, and a deprecated Bargain Finder Max Premium entry. For each operation, agent must record the **current product ID, API style, version, status, latest update, test availability, production entitlement and replacement/deprecation notes** before coding.

Hotel availability/content/rates API presence does not alone prove hotel booking, cancellation, modification, commission or payment rights. Keep hotel search, rate revalidation, reservation creation, retrieval and after-sales as distinct capability flags.

## 5. Travelport — TripServices Flights API v11 evidence

Primary sources: [Flights API v11 overview](https://developer.travelport.com/docs/flights), [Search Guide](https://developer.travelport.com/docs/flights/guides/flights-search-guide), [Booking Guide](https://developer.travelport.com/docs/flights/guides/booking-and-reservations/flights-booking-guide), [Unified Checkout Guide](https://developer.travelport.com/docs/flights/guides/booking-and-reservations/flights-unified-checkout-guide), [Ticketing Guide](https://developer.travelport.com/docs/flights/guides/ticketing-guide), [Reservation Retrieve Guide](https://developer.travelport.com/docs/flights/guides/booking-and-reservations/reservation-retrieve-guide), [Seats Guide](https://developer.travelport.com/docs/flights/guides/seats-and-ancillaries/seats-guide), [Exchange/Refund/Void Guide](https://developer.travelport.com/docs/flights/guides/exchange-refund-and-void-guide).

### Documented workflow variants

- TripServices Flights v11 is a REST/JSON API family. Current documentation describes search, pricing/fare rules, seats/ancillaries, booking/workbench, ticketing, reservation retrieval, modifications and exchange/refund/void flows.
- The normal workbench route is multi-step: create workbench; add offer and traveler(s); optionally add seats/ancillaries/remarks; commit to create the provider reservation; later execute the separate ticketing/fulfilment workflow as applicable; retrieve and verify reservation/ticket.
- Unified Checkout can combine some booking steps into one request, but has content/workflow limitations. Provider docs note seats/ancillaries are not supported in the unified checkout workflow described there; check the current guide before offering those actions in this route.
- Travelport states that cached search payloads used for follow-up pricing/booking requests are retained for **12 minutes for GDS content and 34 minutes for NDC content**; workbench sessions are valid **30 minutes**. Held bookings generally have a ticketing time limit returned in provider response, often around 24 hours but variable. These are provider-specific examples/constraints, never hardcoded universal Travelar timers.
- Ticket void, refund and exchange rules vary by market, fare and airline. Void is often within the same day but the vendor guide explicitly allows variation. Use supplier response/fare terms and current operation availability to decide what Travelar can offer.
- The user-supplied list includes a `deprecated` route group. Do not build new functionality against those endpoints absent explicit approved compatibility rationale.
- Travelport's Flights docs also show Stays and Pay products in their portal, but the user's list is overwhelmingly Flights. It does not prove a Travelport rail product entitlement. Surface/auxiliary/tour/rail-like segments must not be presented as equivalent to a fully integrated train booking/ticketing product without capability evidence.

## 6. Cross-provider rules

1. **API catalog is not entitlement.** Capture account, product, market, provider contract, credential, test and production states separately.
2. **Search is not bookability.** Always revalidate/reprice when provider workflow calls for it before creating a reservation or collecting irreversible funds.
3. **Reservation is not necessarily ticketed.** Air booking and fulfillment/ticket issue are distinct unless the supplier/content flow explicitly documents an instant or ticketless exception.
4. **Provider status is not the UI status.** Normalize in Travelar, preserve the raw provider status and evidence, and never display an unsupported final claim.
5. **No supplier-branding leak.** Public UI is Travelar-branded. Carrier/hotel/travel operator names and necessary legally truthful terms remain visible where they identify the actual service provider; GDS/aggregator platform names are not user-facing marketing labels unless a required disclosure or contractual document requires them.
6. **Capabilities are conditional and effective-dated.** Provider adapter capability matrices must be scoped by mode, action, market, carrier/property, account/agency, content source, environment and effective interval.
7. **Fail safe.** Unknown supplier state, payment state, price change, time-limit expiry or fulfillment result goes to query/reconciliation/manual review, not duplicate create, duplicate charge or false confirmation.
8. **No live calls from routine CI.** Mock and contract testing are default. Live production operations are human-authorized, bounded and audited.

## 7. Source links used in this review

- ClickPesa overview: https://docs.clickpesa.com/home/integration-overview
- ClickPesa BillPay: https://docs.clickpesa.com/bill-pay/bill-pay-overview
- BillPay create reference: https://docs.clickpesa.com/api-reference/collection/billpay/create-order-control-number
- BillPay update reference: https://docs.clickpesa.com/api-reference/collection/billpay/update-billpay-reference
- ClickPesa TanQR: https://docs.clickpesa.com/tan-qr/tan-qr-overview
- ClickPesa CRDB Direct Debit: https://docs.clickpesa.com/crdb-direct-debit/crdb-direct-debit-overview
- ClickPesa mobile payout: https://docs.clickpesa.com/payout-api/mobile-money-payout-api/mobile-money-payout-api-overview
- ClickPesa Lipa Namba payout: https://docs.clickpesa.com/payout-api/lipa-namba-payout-api/lipa-namba-payout-api-overview
- ClickPesa webhooks: https://docs.clickpesa.com/home/webhooks
- ClickPesa payout status: https://docs.clickpesa.com/home/payout-status
- ClickPesa test environment: https://docs.clickpesa.com/home/sandbox-and-testing-environment
- Sabre Developer Hub: https://developer.sabre.com/
- Sabre modern workflow: https://developer.sabre.com/product-collection/new-to-sabre/v1/help-documentation/guides.html
- Sabre Sandbox: https://developer.sabre.com/product-collection/sabre-sandbox
- Travelport Flights v11: https://developer.travelport.com/docs/flights
- Travelport Search Guide: https://developer.travelport.com/docs/flights/guides/flights-search-guide
- Travelport Booking Guide: https://developer.travelport.com/docs/flights/guides/booking-and-reservations/flights-booking-guide
- Travelport Exchange/Refund/Void Guide: https://developer.travelport.com/docs/flights/guides/exchange-refund-and-void-guide

## 8. Required follow-up evidence

- Download or record the latest machine-readable/openapi schemas where provided, and store a source URL/version/hash in the development evidence log.
- Run a bounded comparison in each provider's approved test environment using the same representative workflow. Record only authorized, redacted test inputs.
- Request production entitlement and contract confirmation from Sabre, Travelport and ClickPesa. Public docs alone cannot answer these account-level questions.
- Recheck documentation during dependency upgrades and at least before a production release; record deprecations and breaking schema changes as ADR or integration change records.
