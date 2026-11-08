# 61 — ClickPesa Detailed API Contract Review for Travelar

**Version:** Draft v0.2  
**Research date:** 26 October 2026  
**Owner:** Travelar CTO / payments research  
**Scope:** Public ClickPesa API documentation, public pricing, and implications for Travelar's provider-neutral collection/payout model. This is technical and commercial research, not legal advice and not confirmation that a Travelar merchant account or production feature is enabled.

## 1. Executive decision

**Decision: proceed with a provider-neutral adapter contract and mock-based implementation; do not treat ClickPesa as production-approved or finalize the funds-flow model yet.**

The current public docs establish usable API shapes for BillPay order references, USSD Push, card collection, webhooks/status queries and payout rails. They also expose material constraints:

1. BillPay order control numbers do not expire automatically. They remain active until paid or manually closed. The API supports setting a reference `INACTIVE`, but a deactivation race with an in-flight customer payment must be tested/confirmed.
2. BillPay `EXACT` is the appropriate documented mode for a one-time, full-value booking collection. An order control number accepts only one payment; when partial payment is enabled, even a partial payment closes/fulfils the order reference. Customer control numbers are designed for repeat/partial collections and are not the default for single ticket sales.
3. Collection `SUCCESS` and merchant-balance `SETTLED` are distinct states. Do not conflate customer payment receipt, availability of funds in the merchant balance, ticket issuance, fiscal receipt issuance or operator payout.
4. Webhooks use a documented checksum/HMAC mechanism, but event delivery retries and ordering guarantees are not specified in the public page reviewed. Add signature validation, durable inbox, idempotency, query recovery and scheduled reconciliation.
5. Public pricing has different collection fees by channel and identifies different parties as paying them. A ClickPesa marketing article describing BillPay API as 1% per successful transaction does not cleanly align with the more detailed method-specific pricing page. Obtain a dated written quote clarifying the total/stacked fees and effective dates.
6. Mobile-money, bank and Lipa Namba payout create APIs document one create request per merchant every 60 seconds. This is not a safe basis for a per-ticket real-time payout model. Payout finality also needs rail-specific confirmation.
7. ClickPesa says there is no sandbox; API Explorer and live APIs move real funds. Automated tests must use mocks and synthetic fixtures, with small live tests conducted only through a specifically approved procedure.

The strongest default for a single Travelar bus ticket is a server-created, exact-amount BillPay order reference, or a method-appropriate USSD Push / hosted card checkout. The system must not issue a ticket from a browser redirect alone.

## 2. Findings by capability

### 2.1 BillPay order control numbers

Official docs:
- BillPay overview: https://docs.clickpesa.com/bill-pay/bill-pay-overview
- Create Order Control Number: https://docs.clickpesa.com/api-reference/collection/billpay/create-order-control-number
- Update BillPay Reference: https://docs.clickpesa.com/api-reference/collection/billpay/update-billpay-reference
- Query BillPay Number Details: https://docs.clickpesa.com/api-reference/collection/billpay/querying-for-billpay-details
- BillPay FAQ: https://docs.clickpesa.com/bill-pay/billpay-faq

Observed request fields include `billDescription`, `billPaymentMode`, `billAmount`, optional `billMaxCollectionAmount`, and optional `billReference`. `billPaymentMode` documents `EXACT` and `ALLOW_PARTIAL_AND_OVER_PAYMENT`. The custom `billReference` is alphanumeric, maximum 20 characters and unique within the ClickPesa account. If used, it becomes the customer-facing number; otherwise ClickPesa generates a number.

The BillPay FAQ expressly says an unpaid order control number has **no automatic expiration**; it stays valid until paid or manually closed. The update endpoint allows `billStatus: ACTIVE | INACTIVE`. This means Travelar must own the reservation/payment deadline. Store `inventoryHoldExpiresAt` separately from the provider control-number status, call the documented deactivation operation on expiration, and verify the result. Ask ClickPesa whether in-flight or delayed mobile-money/bank payments may complete after deactivation and what race conditions can occur.

For immediate travel booking, explicitly set `billPaymentMode: EXACT` and `billAmount` to the authoritative backend amount. Do not rely on a provider default, because the documented create endpoint defaults to `ALLOW_PARTIAL_AND_OVER_PAYMENT`. Do not set `billMaxCollectionAmount` unless an approved product rule needs it; setting this value can force partial/overpayment mode. Confirm exact-mode behavior with ClickPesa before production use.

A BillPay Order Control Number closes after a single payment. In partial mode, it may close even if the collected amount is less than the intended booking total. Thus it cannot reliably serve as an instalment instrument for one booking. Use a new approved payment intent/reference for a new attempt, and never reuse an already-used provider reference. `409 Bill reference already used` is a documented creation response; after an uncertain network outcome, query the known reference before deciding to submit again.

### 2.2 USSD Push

Official docs:
- Overview: https://docs.clickpesa.com/payment-api/mobile-money-payment-api/mobile-money-payment-api-overview
- Preview request: https://docs.clickpesa.com/api-reference/collection/ussd-push-requests/preview-ussd-push-request
- Initiate request: https://docs.clickpesa.com/api-reference/collection/ussd-push-requests/initiate-ussd-push-request
- Payment status query: https://docs.clickpesa.com/api-reference/collection/querying-for-payments/querying-for-payments

Flow: preview/validate phone, amount, order reference and channel availability; initiate the push; then await a signed webhook and/or query status. The documentation limits the order reference to alphanumeric with a maximum length of 20 characters. The returned prompt is a request for the customer to authorize on their mobile wallet; initiating the prompt is not payment confirmation. Never resubmit a payment request just because the customer did not return to the website. Query the original reference first.

### 2.3 Card collection

Official docs: https://docs.clickpesa.com/payment-api/card-payment-api/card-payment-api-overview

The public Card API describes previewing/validating an amount and order reference, initiating payment, then returning a hosted card-checkout session link. ClickPesa states it does not collect or store the customer's card information in this documented flow. Travelar must still verify checkout activation, current supported networks, any authentication/3DS requirements, chargeback handling, fee allocation and whether the hosted session binds the amount/order securely. Status is determined by webhook/query, not the return URL.

### 2.4 TANQR / Lipa Namba collection

Official docs: https://docs.clickpesa.com/tan-qr/tan-qr-overview

The generic collection flow uses the merchant's QR/Lipa Namba and lets the payer enter an amount; payments can appear instantly in the merchant account and trigger webhooks. The docs say amount-specific/automated QR flows require contacting ClickPesa. For ticket sales, a general static merchant code is unsuitable unless exact amount + provider transaction/reference + order + time window produce deterministic matching. Prefer an order-specific BillPay reference or USSD Push for a single seat/ticket. Do not confuse collection to Travelar's own Lipa Namba with the separate API for paying a supplier's Lipa Namba.

### 2.5 Collection status and webhook integrity

Official docs:
- Payment statuses: https://docs.clickpesa.com/home/payment-status
- Webhooks: https://docs.clickpesa.com/home/webhooks
- Checksum: https://docs.clickpesa.com/home/checksum
- Whitelisting: https://docs.clickpesa.com/home/whitelisted-ip-address

Documented payment statuses:

| Provider status | Published meaning | Travelar mapping recommendation |
|---|---|---|
| `PENDING` | Awaiting further customer action | `pending_customer_action` |
| `PROCESSING` | Payment being processed | `processing` |
| `SUCCESS` | Payment received, not yet settled to the merchant account | `payment_received_unsettled` |
| `SETTLED` | Funds settled to the merchant account | `merchant_balance_settled` |
| `FAILED` | Payment not successful | `failed` (terminal only when confirmed) |
| `ON-HOLD` | Merchant action required | `on_hold` / operations queue |
| `REFUNDED` | Not settled to merchant; funds returned to customer | `refunded_pre_settlement` |
| `REVERSED` | Settled to merchant, then returned to customer | `reversed_post_settlement` |

Use these mappings as recommendations, not as a claim that every collection method supports every status identically. Preserve original status, rail, raw event, provider reference and timestamps. A webhook `PAYMENT RECEIVED` example carries provider transaction ID, `paymentReference`, `orderReference`, `collectedAmount`, `collectedCurrency`, status, timestamps and channel. A supplied `paymentPhoneNumber` is the number that paid and is not necessarily the phone number stored under the customer object.

ClickPesa's checksum page documents recursive alphabetical key sorting, compact JSON serialization and HMAC-SHA256; `checksum` and `checksumMethod` are excluded from the calculation. Verify a supplied checksum in constant time using the provider's current instructions. Keep IP allowlisting as defence-in-depth, not as an alternative to checksum verification.

The public webhook page reviewed does not state retry schedules, event ordering, or an immutable unique event identifier for all event types. Travelar must therefore not assume exactly-once or ordered delivery. Persist the sanitized event in a durable inbox, use idempotent state transitions and database uniqueness constraints, acknowledge only after durable acceptance, query provider state when delivery is missing/ambiguous and reconcile against provider records at least daily.

### 2.6 Fees, fee bearer and pricing contradictions

Official sources:
- Public pricing: https://clickpesa.com/payment-gateway/pricing/
- BillPay API announcement: https://clickpesa.com/introducing-billpay-apis-for-invoices-and-customers/
- Payout overview: https://docs.clickpesa.com/payout-api/mobile-money-payout-api/mobile-money-payout-api-overview
- Bank payout overview: https://docs.clickpesa.com/payout-api/bank-payout-api/bank-payout-api-overview
- Lipa Namba payout overview: https://docs.clickpesa.com/payout-api/lipa-namba-payout-api/lipa-namba-payout-api-overview

The public pricing page lists the following as of the research date. These are **publicly displayed indicative/provider-published prices, not a negotiated quote**:

| Method | Published collection charge | Published charge bearer | Implementation note |
|---|---:|---|---|
| Mobile Money USSD Push | Amount-bracketed flat fee; page says this is in addition to MNO charges | Customer | Confirm which methods/amount bands apply to Travelar and whether checkout displays the full amount before consent. |
| BillPay — M-Pesa / Airtel | 1% (published range TZS 500–5,000,000) | Organization | Confirm whether the separate API fee is included or additional. |
| BillPay — HaloPesa | 2% (same published range) | Organization | Rate must be provider-configured, not code-hardcoded. |
| BillPay — Mixx by Yas | 2.5% (same published range) | Organization | Rate must be provider-configured, not code-hardcoded. |
| CRDB BillPay | 1% (published range TZS 1,000–100,000,000) | Organization | Confirm current contract rate and any minimums/taxes. |
| TanQR / Lipa Namba collection | 2% | Merchant | Do not assume the static collection code allocates a transaction to a ticket. |
| Card | 4.85% | Customer (as published) | Do not add a passenger surcharge without legal review and written confirmation. |
| CRDB Direct Debit | 2% shown on public page | Organization | Relevant only for approved mandate-based recurring use, not default seat checkout. |

The ClickPesa BillPay API announcement separately says the BillPay API costs 1% per successful transaction regardless of order/customer number and that the merchant pays by default. This does not cleanly explain the public page's method-specific rates (1%, 2%, 2.5%, plus CRDB). Do not infer whether the figures are additive, product-layer charges, or different account tariffs. Require a signed/dated written quote that explicitly maps fee to payment method, API use, control-number kind, collection amount, fee payer, taxes, minimum/maximum, reversals/refunds, settlement deductions and effective date.

Payout pricing also varies by channel. The public pricing page displays flat fee tables for mobile-money and TIPS Lipa Namba payouts, TZS 2,360 for bank ACH payouts in the displayed range up to TZS 20 million, TZS 11,800 for bank TISS (TZS) in its displayed range, and USD 7.50 for TISS (USD). The API overview says ClickPesa may select the best available bank rail, returns the applied `transferType`, and provides `estimatedArrival` values such as `Instant` or `1-3 Working Days`. Since labels/route logic and price tables may be updated independently, use per-payout preview/API response plus the current signed tariff as the operational source of truth; do not hardcode prices.

### 2.7 Payouts and the remittance constraint

Official docs:
- Mobile payout: https://docs.clickpesa.com/payout-api/mobile-money-payout-api/mobile-money-payout-api-overview
- Bank payout: https://docs.clickpesa.com/payout-api/bank-payout-api/bank-payout-api-overview
- Lipa Namba payout: https://docs.clickpesa.com/payout-api/lipa-namba-payout-api/lipa-namba-payout-api-overview
- Payout statuses: https://docs.clickpesa.com/home/payout-status

The three payout overview pages state a limit of one payout create request per merchant per 60 seconds. The Lipa Namba payout docs explicitly say it is asynchronous: `AUTHORIZED` is accepted, not settled, and a final notification is sent only on `SUCCESS` or `REFUNDED`. Bank payout preview returns fees, an estimate of arrival and sometimes a beneficiary account name; provider documentation says ClickPesa chooses the bank settlement route. General payout status docs define `AUTHORIZED` as the process about to begin and `SUCCESS` as payout initiated successfully, so do not assert that `SUCCESS` itself proves the beneficiary's bank/wallet has irrevocably credited the funds without written confirmation of the rail's finality semantics.

This rate limit makes a high-volume per-ticket push payout an unsuitable default. Public docs mention bulk payout through the merchant dashboard/upload but do not establish a bulk disbursement API with the needed latency, limits or per-operator segregation. Require ClickPesa to confirm: API rate limits and increase process; true bulk API availability; payout status finality; operator beneficiary account model; funds availability timing after collection `SUCCESS`; fee treatment; and whether any marketplace/split settlement or submerchant feature is contracted.

**LATRA implication:** if the approved system must remit operator fares in real time, do not assume ClickPesa payouts satisfy that requirement just because a payout endpoint exists. A direct operator merchant-collection architecture might avoid platform-held funds, but only use it if ClickPesa, the operator, LATRA, BoT and counsel confirm account structure and regulatory permissibility. Split settlement is not proved by the public docs reviewed.

### 2.8 Testing and operational access

Official docs: https://docs.clickpesa.com/home/sandbox-and-testing-environment

ClickPesa says it has no sandbox; API Explorer also runs against live production. Before KYC approval, the published shared cap is TZS 100,000 across collections, payouts, deposits and withdrawals, with 100 API calls per day; card, TanQR/Lipa Namba and CRDB Direct Debit cannot be enabled before KYC. The provider recommends preview/query-first and reusing the JWT for its one-hour lifetime instead of generating a token for every request.

Travelar testing policy:
- Unit tests and CI use a fake adapter and sanitized fixtures; never call live money-moving endpoints in CI.
- Contract tests use captured/synthetic fixtures and validate schema, status mapping, amount/currency checks, checksum verification and idempotency.
- Live smoke tests require explicit human authorization, approved account/KYC, capped amounts, an approved recipient, monitoring, and a written reconciliation/refund path. Do not use production API Explorer for casual discovery.
- No real passenger money collection until the contractual funds flow, provider activation, regulatory gates and operational runbooks are approved.

## 3. Recommended Travelar booking/payment policy

1. Create the authoritative quote and inventory hold in Travelar first. The server fixes amount/currency, expiry, channel attribution and commercial-rule version.
2. Create a separate immutable `PaymentAttempt` for each distinct attempt. Allocate a unique, opaque provider reference. Avoid passenger names, phone numbers or IDs in references.
3. Select BillPay with `EXACT` + fixed `billAmount` for order-specific OTC when enabled, USSD Push for assisted/direct mobile prompt, and hosted card checkout where approved. TANQR static collection should not be the default per-seat method.
4. A callback/return page is never sufficient evidence. Verify the checksum where present/required, reference, provider transaction, amount, currency, merchant/application, and normalized status. Reject mismatched events to an exception queue.
5. Keep `payment_received_unsettled` separate from `merchant_balance_settled`. Ticket issuance, operator reservation status, fiscal receipt and operator payout are separate objects/states. Make the ticket-issuance threshold a reviewed configuration tied to provider/contract semantics rather than silently equating every provider `SUCCESS` to cash availability.
6. When the inventory hold expires, deactivate the BillPay control number and query its provider status. A late success enters `LATE_PAYMENT_REVIEW`; recheck inventory and follow a controlled rebook/refund path. Never issue on stale inventory.
7. Reconcile every provider payment, reversal/refund, fee, payout and ledger movement daily; use immutable append-only double-entry journals and corrective reversals rather than editing posted entries.
8. Payout requests use a durable queue and merchant-level limiter. Never retry an ambiguous create blindly: query by the stable provider order reference first. Keep `AUTHORIZED`, `PROCESSING`, `SUCCESS`, `REFUNDED` and `REVERSED` distinct until rail semantics are contractually confirmed.

## 4. Provider-neutral adapter boundary — design requirements

Travelar should own business policy and normalized states; ClickPesa-specific statuses, payload structures, checksums, rate limits and reference lengths stay in its adapter. See companion document `62-provider-neutral-payment-and-payout-adapter-contract.ts`.

Required separation:
- `CollectionAdapter`: capabilities, create/preview collection, query status, deactivate/close when supported, verify/normalize webhook, retrieve/reconcile collection records.
- `PayoutAdapter`: capabilities, preview payout, create payout, query status, verify/normalize webhook, reconcile payout records.
- `PaymentOrchestrator`: quote, inventory hold, payment attempt, timeout policy, state transitions, fulfillment gate and exception queues.
- `Ledger/Reconciliation`: double-entry posting, provider fee recognition, merchant balance settlement, operator payable and payout completion.

Do not model a generic provider's capability as supported just because one method exists for ClickPesa. Every capability must be `supported`, `unsupported` or `unknown`, with evidence date and effective configuration. No common interface should promise native expiry, refund, split settlement, token idempotency, partial payment, bulk payouts or webhook retries unless proven per provider/method/account contract.

## 5. ClickPesa questions to close before production

P1 — blocks money-flow/production decision:
1. Does `SUCCESS` mean the funds are guaranteed/collected for fulfillment? What risks remain before `SETTLED`? Can a `SUCCESS` collection be reversed before merchant settlement, and under what triggers/time window?
2. For each payout rail, what exact provider status proves beneficiary credit/settlement, not merely that the payout was accepted or initiated? Can we obtain a bank/wallet confirmation or settlement report reference?
3. Can ClickPesa support a marketplace with operator merchants/sub-merchants, direct operator collections and Travelar fees, or split settlement? If no split feature exists, what supported account model is available? Provide product documents and contract wording.
4. Can the payout create limit (one per 60 seconds per merchant) be raised? Is there a documented bulk payout API (not just dashboard upload) with per-operator records, idempotency and status queries? What SLA and pricing apply?
5. Does BillPay `EXACT` reject underpayment and overpayment without accepting funds? When a control number is marked `INACTIVE`, how quickly does it stop accepting payments? Can a payment already started still settle? Provide an event/sequence explanation.
6. What are the webhook retry policy, timeout, ordering guarantees and duplicate semantics? Is checksum always present on every event, and can ClickPesa share a signed sample for PAYMENT RECEIVED, PAYMENT FAILED, PAYOUT INITIATED, PAYOUT REFUNDED and PAYOUT REVERSED?
7. Provide a dated signed tariff separating BillPay API fee, each underlying payment method fee, card/USSD fee, MNO charges, payout fees, taxes, refunds/reversals, and who legally/contractually bears each charge. Explain the 1% BillPay API announcement versus the method-specific public pricing table.
8. Is there a live-test account or approved low-value test process that does not endanger customer funds? Who authorizes test transactions and how are refunds/settlement evidence obtained?

P2 — operations and reliability:
9. What volume, per-second limits, API availability and support response SLA apply to token, create, query and webhook operations?
10. What report/API provides transaction-level settlement, fees, deposits, reversals, merchant balance movement and payout recipient outcomes? How far back can records be queried and what are pagination/retention limits?
11. For merchant Lipa Namba/TanQR, can an order-specific amount and reference be enforced through API? What transaction identifiers are returned for deterministic OTC matching?
12. What precise restrictions apply to merchant balance withdrawals and choosing bank/mobile-money settlement destinations? Can an operator account be a beneficiary, and what KYB/business relationship is required?

## 6. Source register

Primary ClickPesa sources reviewed on 26 October 2026:
- Integration overview (products; no sandbox; checksum/webhook concepts): https://docs.clickpesa.com/home/integration-overview
- BillPay overview: https://docs.clickpesa.com/bill-pay/bill-pay-overview
- Create order control number: https://docs.clickpesa.com/api-reference/collection/billpay/create-order-control-number
- Update BillPay reference/status: https://docs.clickpesa.com/api-reference/collection/billpay/update-billpay-reference
- Query BillPay details: https://docs.clickpesa.com/api-reference/collection/billpay/querying-for-billpay-details
- BillPay FAQ: https://docs.clickpesa.com/bill-pay/billpay-faq
- USSD Push overview: https://docs.clickpesa.com/payment-api/mobile-money-payment-api/mobile-money-payment-api-overview
- USSD Push initiation: https://docs.clickpesa.com/api-reference/collection/ussd-push-requests/initiate-ussd-push-request
- Card overview: https://docs.clickpesa.com/payment-api/card-payment-api/card-payment-api-overview
- TanQR/Lipa Namba overview: https://docs.clickpesa.com/tan-qr/tan-qr-overview
- Payment statuses: https://docs.clickpesa.com/home/payment-status
- Payout statuses: https://docs.clickpesa.com/home/payout-status
- Webhooks: https://docs.clickpesa.com/home/webhooks
- Checksum: https://docs.clickpesa.com/home/checksum
- IP whitelist: https://docs.clickpesa.com/home/whitelisted-ip-address
- Sandbox/testing: https://docs.clickpesa.com/home/sandbox-and-testing-environment
- Public pricing: https://clickpesa.com/payment-gateway/pricing/
- BillPay API pricing announcement (21 August 2025): https://clickpesa.com/introducing-billpay-apis-for-invoices-and-customers/
- Mobile payout overview: https://docs.clickpesa.com/payout-api/mobile-money-payout-api/mobile-money-payout-api-overview
- Bank payout overview: https://docs.clickpesa.com/payout-api/bank-payout-api/bank-payout-api-overview
- Lipa Namba payout overview: https://docs.clickpesa.com/payout-api/lipa-namba-payout-api/lipa-namba-payout-api-overview

## 7. Evidence grades

- **V — public primary documentation:** fields, enum values, posted product descriptions, visible pricing and documented API limitations cited above.
- **P — preliminary commercial interpretation:** public price pages and marketing announcements are not a signed quote and may not determine a particular Travelar merchant contract.
- **U — unknown:** marketplace split settlement, connected-merchant model, finality of each payout rail, webhook retry/order guarantee, specific account limits/SLAs, deactivation race semantics, and regulatory acceptance of the proposed funds flow.
- **H — hypothesis:** direct-operator collection may be the best way to avoid platform-held operator funds if provider account structuring and applicable law permit it. Do not implement as an assumed fact.
