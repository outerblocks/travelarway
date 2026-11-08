# 56 — ClickPesa Payment Capabilities and Evidence Review

**Research date:** 24 October 2026  
**Scope:** Public product/API documentation; does not establish that OuterBlocks Destinations Limited has a merchant account, production credentials, specific products enabled, or marketplace/split-settlement rights.

## Executive findings

ClickPesa is a serious candidate for the Tanzania payment-adapter proof of concept because its current public documentation describes collection, payment queries, webhook notifications, BillPay control-number APIs, hosted checkout, mobile-money USSD push, card APIs and several payout products. Public docs do **not** establish marketplace split settlement/connected submerchant commission allocation for Travelar. Keep the multi-PSP design and mark split settlement `UNKNOWN / direct confirmation required` until ClickPesa confirms the exact account-level feature and contract in writing.

ClickPesa's documentation states that it has no sandbox: all API calls and API Explorer operations run against production and move real funds. Its published guidance says a pre-KYC account has a shared TZS 100,000 transaction cap and 100 API calls per day; Card, TanQR/Lipa Namba and CRDB Direct Debit cannot be enabled before KYC approval. Never let an AI agent or normal automated test call production payment endpoints for exploratory testing.

## Product map

| ClickPesa product | Publicly documented capability | Travelar fit | Important boundary |
|---|---|---|---|
| Mobile-money USSD Push | Validate/preview, initiate a push to a customer's mobile, query status; payer authorizes with wallet PIN | Assisted online, POS and call-centre payment | Push initiation is not payment confirmation. Keep payment pending until provider-confirmed success is verified. |
| BillPay Order Control Number | Create a number for a transaction/invoice; amount and mode configuration; optional max-collection amount; reference, description; query and webhooks | Strong fit for order-specific OTC payments | Use one number per booking/sale, normally `EXACT` full payment for ticket issuance. Confirm closure/expiry behavior for booking-hold expiry. |
| BillPay Customer Control Number | Reusable customer number that can receive multiple payments, depending on payment policy | Repeated customer billing or contract receivables | Do not use as the single ticket's only identifier if it can aggregate unrelated payments. Maintain individual payment/order references. |
| Merchant BillPay-Namba | Static short merchant-level number described as a base for generating offline order numbers/deposits | Merchant account funding/internal operations where appropriate | Documentation says it is not for sharing with customers. Do not confuse with an order control number. |
| TANQR / Lipa Namba collection | Merchant QR/code for customers to pay through supported TIPS-connected mobile-money/bank channels; payer enters amount in general flow | Branch counter acceptance and general merchant collection | Same static code can receive many amounts and is less naturally tied to a specific sale. ClickPesa says amount-specific/automated QR flows require contacting support. Use only after reliable transaction-to-sale matching is demonstrated. |
| Card API and Hosted Checkout | Card collection / hosted payment redirection, status by webhook or query | Public web, agent portal or counter with supported browser/payment terminal flow | Confirm current card channel activation, 3DS/PCI scope, surcharges and allowed checkout framing. |
| Checkout links/payment pages | Generate hosted pages or links for collection | Call-centre payment request; payment request to a customer | Ensure link binds the correct amount/order and does not grant unintended reuse or duplicate collection. |
| Mobile-money payout | Preview amount/phone/fee/balance, create payout, query outcome; recipients receive TZS to supported wallets | Agent commission, supplier payout or eligible refund route | Public docs state one create request per merchant per 60 seconds; verify limits and batch path for production volumes. |
| Bank payout | Preview/validate then create payout to bank account; query status | Scheduled operator/supplier settlements | Treat `AUTHORIZED` as accepted/in-process, not proof of arrival; reconcile provider and bank evidence. |
| Lipa Namba/TanQR payout | Send payout to a beneficiary merchant code or QR string; query status and receive payout webhooks | Eligible merchant/supplier payouts if supported and contracted | It is a disbursement route, distinct from customer collection; confirm beneficiary validation, settlement and reversal handling. |
| CRDB BillPay / Direct Debit | BillPay collection via CRDB banking channels; direct-debit mandate product documented | Additional collection methods when enabled and applicable | Direct Debit requires customer mandate approval; enable only on explicit product/contract support. |

## BillPay details found in API documentation

- Order and customer control numbers can be created programmatically. Documentation supports single and bulk creation of up to 50 control numbers per request, with per-item outcomes for bulk requests.
- `billReference` can be a caller-provided unique reference within the ClickPesa account; API docs describe a maximum 20-character alphanumeric reference. Avoid exposing passenger PII in a reference. Generate an internal opaque order/payment reference and map it to ClickPesa's limit safely.
- Order control numbers support `EXACT` and `ALLOW_PARTIAL_AND_OVER_PAYMENT`; with the latter, `billMaxCollectionAmount` can cap total accepted collections. Use `EXACT` for standard immediate ticket-sale payments unless a product-specific approved installment/reservation rule explicitly allows partial payment.
- The docs expose control-number detail/update operations, including bill status, amount, maximum amount, description and payment mode. The visible create-order schema does not clearly establish a `expiresAt` field. Ask ClickPesa to confirm exact expiry/close semantics, whether a number can be disabled when a reservation expires, and whether a payment already initiated can still settle after closure.
- The provider documents payment-query response statuses including `SUCCESS`, `SETTLED`, `PROCESSING`, `PENDING` and `FAILED`. Preserve the exact provider state and map it to Travelar's normalized state without collapsing unknown or pending into failure.

## Fees: store as provider evidence, not code constants

The public pricing page reviewed on 24 October 2026 displays, among other terms:

- USSD Push fees shown as charged to the customer in addition to MNO charges, with fee bands by amount.
- BillPay collection fees charged to the organization, listed as 1% for M-Pesa/Airtel, 2% for HaloPesa and 2.5% for Mixx by Yas, plus 1% for CRDB BillPay.
- TANQR/Lipa Namba collection shown at 2% charged to the merchant.
- Card fee shown at 4.85% charged to customer.
- Mobile-money, TANQR/Lipa Namba and bank payout fee schedules.

A ClickPesa BillPay product post separately states a 1% fee per successful BillPay API transaction, including both customer and order numbers, while the public pricing page lists different network-specific BillPay rates. This could represent product/API pricing layers or a wording/version discrepancy. Do not stack, pass through or model these rates until ClickPesa supplies a current quote and explains which fees are additive, the charging party, minimums, taxes, settlement deductions and effective dates. The published card fee also requires review against applicable Bank of Tanzania card surcharge requirements; do not add it to a passenger's checkout without written legal/provider clearance.

## Security and operational details

- ClickPesa's official checksum documentation describes HMAC-SHA-256 over a canonically serialized payload. The webhook documentation says payloads **can** include `checksum` and `checksumMethod`; ask whether this is guaranteed for every Travelar application event. Verify any supplied checksum according to the current provider guide using constant-time comparison.
- A webhook HTTP 2xx only acknowledges receipt, not successful business processing. Persist the event in a durable inbox and respond after safe acceptance; processing should be asynchronous and idempotent.
- Use application-level webhooks for each separately configured Travelar application/environment. Official docs indicate qualifying application events go to the application webhook instead of the merchant-level webhook when configured; offline dashboard BillPay references may use merchant-level webhooks or polling.
- Configure IP allowlisting only from current official provider instructions, as a supplement to authentication/checksum validation, never as a replacement. Keep credentials server-side in a secret manager and rotate them under a documented process.
- Public docs say API tokens are valid for one hour and recommend reusing the token until expiry instead of generating one on every call. Treat token acquisition as a credential service, not a frontend task.
- Public docs say all API calls including API Explorer are production/live and move funds. Develop with local mocks, contract tests and synthetic fixtures. Then perform a tightly controlled, human-approved small-value live pilot after KYB/KYC and provider-approved test planning. Test refunds/reversals/payout failure only using a written provider-approved procedure.

## What is not proved by public documentation

1. A split-payment/marketplace product that routes operator proceeds to each operator and Travelar's commission to OuterBlocks Destinations Limited from the same customer charge.
2. The exact account hierarchy, connected merchant or submerchant onboarding model, underwriting/KYB duties and whether one platform account may collect for unrelated operators.
3. Any automatic ticket-specific expiry/cancellation guarantee for BillPay control numbers after a seat hold expires.
4. Any generic API refund-to-original-payment method that fits all supported collection rails.
5. SLA, webhook delivery retry/backoff guarantees, maximum throughput, idempotency semantics for all endpoints, settlement calendar, reserves, chargeback liability, business continuity and formal data-processing terms.

## Sources

- ClickPesa API update: https://clickpesa.com/clickpesa-launches-new-payment-apis-in-tanzania/
- Collection: https://clickpesa.com/payment-gateway/collection/
- Disbursement: https://clickpesa.com/payment-gateway/disbursement/
- Current published pricing: https://clickpesa.com/payment-gateway/pricing/
- BillPay overview: https://docs.clickpesa.com/bill-pay/bill-pay-overview
- BillPay API overview: https://docs.clickpesa.com/bill-pay/billpay-api-overview
- Order control number API: https://docs.clickpesa.com/api-reference/collection/billpay/create-order-control-number
- Customer control number API: https://docs.clickpesa.com/api-reference/collection/billpay/create-customer-control-number
- USSD Push API: https://docs.clickpesa.com/payment-api/mobile-money-payment-api/mobile-money-payment-api-overview
- TanQR/Lipa Namba: https://docs.clickpesa.com/tan-qr/tan-qr-overview
- Payment query: https://docs.clickpesa.com/api-reference/collection/querying-for-payments/querying-for-payments
- Webhooks: https://docs.clickpesa.com/home/webhooks
- Checksum: https://docs.clickpesa.com/home/checksum
- No sandbox / live testing: https://docs.clickpesa.com/home/sandbox-and-testing-environment
- Mobile payouts: https://docs.clickpesa.com/payout-api/mobile-money-payout-api/mobile-money-payout-api-overview
- Bank payouts: https://docs.clickpesa.com/payout-api/bank-payout-api/bank-payout-api-overview
- Lipa Namba payout: https://docs.clickpesa.com/api-reference/disbursement/lipa-namba-payout/create-lipa-namba-payout

**Classification:** ClickPesa public documentation/provider claims. This is not a signed offer, proof of account-level entitlement, or a production integration test.
