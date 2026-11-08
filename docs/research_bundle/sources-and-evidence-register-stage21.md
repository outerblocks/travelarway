# Stage 21 Sources and Evidence Register — ClickPesa OTC Payments and Entity Decision

**Research date:** 24 October 2026. Public sources checked on that date; pricing, API behavior and legal interpretations must be revalidated before production.

| ID | Source | Evidence found | Status and limitation |
|---|---|---|---|
| S21-01 | https://clickpesa.com/clickpesa-launches-new-payment-apis-in-tanzania/ | ClickPesa advertises collections, disbursements, reconciliation APIs and BillPay control numbers. | Provider-claimed public capability; not an OuterBlocks contract. |
| S21-02 | https://docs.clickpesa.com/bill-pay/bill-pay-overview | Merchant, order and customer control-number distinction; mobile money, SIM banking/CRDB channels; query and webhook. | Primary provider docs; exact account entitlement must be confirmed. |
| S21-03 | https://docs.clickpesa.com/bill-pay/billpay-api-overview | Create order/customer control numbers; bulk up to 50; query, webhook; status/details APIs. | Provider docs. |
| S21-04 | https://docs.clickpesa.com/api-reference/collection/billpay/create-order-control-number | `EXACT` or partial/overpayment; optional max total; custom bill reference (20-char alphanumeric) and unique-account reference constraint; no visible `expiresAt` field in reviewed schema. | Provider docs; expiration/closure semantics need written confirmation. |
| S21-05 | https://docs.clickpesa.com/api-reference/collection/billpay/create-customer-control-number | Customer-level recurring/reusable control number and optional metadata. | Provider docs; not presumed ideal for single ticket. |
| S21-06 | https://docs.clickpesa.com/payment-api/mobile-money-payment-api/mobile-money-payment-api-overview | Preview/initiate USSD push and query status flow; customer authorizes from phone. | Provider docs. |
| S21-07 | https://docs.clickpesa.com/tan-qr/tan-qr-overview | TANQR/Lipa Namba merchant collection through TIPS; generic payer-entered amount; amount-specific/automated QR requires provider discussion. | Provider docs; order-specific matching needs proof. |
| S21-08 | https://docs.clickpesa.com/api-reference/collection/querying-for-payments/querying-for-payments | Payment query states `SUCCESS`, `SETTLED`, `PROCESSING`, `PENDING`, `FAILED`; unique provider references. | Provider docs. |
| S21-09 | https://docs.clickpesa.com/home/webhooks | Application/merchant webhooks, payment/payout events; callbacks can include checksum; 2xx means received, not processed; application callback routing behavior. | Provider docs; checksum delivery and retry guarantees need confirmation. |
| S21-10 | https://docs.clickpesa.com/home/checksum | HMAC-SHA-256 checksum example with canonicalized payload. | Provider docs; confirm current required fields and whether checksums always accompany events. |
| S21-11 | https://docs.clickpesa.com/home/sandbox-and-testing-environment | No sandbox; API Explorer calls production; pre-KYC cap 100,000 TZS/100 calls daily; TanQR/card/CRDB direct debit disabled pre-KYC; guidance on preview/query, token reuse and IP whitelist. | Current provider docs; high-risk constraint for integration plan. |
| S21-12 | https://docs.clickpesa.com/payout-api/mobile-money-payout-api/mobile-money-payout-api-overview | Preview, create, query mobile-money payouts; recipients receive TZS; one create request/merchant/60s. | Provider docs; confirm commercial throughput and exact limit at account activation. |
| S21-13 | https://docs.clickpesa.com/payout-api/bank-payout-api/bank-payout-api-overview | Bank payout API and preview/query flow. | Provider docs. |
| S21-14 | https://docs.clickpesa.com/api-reference/disbursement/lipa-namba-payout/create-lipa-namba-payout | Lipa Namba/QR payout, statuses incl. AUTHORIZED, PROCESSING, SUCCESS, FAILED, REFUNDED, REVERSED; order reference uniqueness and 60-second creation limit. | Provider docs; `AUTHORIZED` is not final success. |
| S21-15 | https://clickpesa.com/payment-gateway/pricing/ | Published fee table including USSD Push, BillPay, TANQR/Lipa Namba, card and payout fee schedules. | Public pricing snapshot only; confirm date, taxes, which fees stack and who pays. |
| S21-16 | https://clickpesa.com/introducing-billpay-apis-for-invoices-and-customers/ | Blog describes a 1% BillPay API fee per successful transaction, including partial payments. | Provider blog; reconcile with provider's network-specific public pricing table in a signed quote. |
| S21-17 | https://www.latra.go.tz/news/safari-tiketi-enhances-travel-assurance | LATRA update of 8 Oct 2026 names 14 providers connected to Safari Tiketi and describes channels. | Authority source; does not authorize Travelar or prove a direct API contract. |
| S21-18 | https://www.latra.go.tz/news/prof-kahyarara-aitaka-latra-kuhakikisha-kampuni-za-tiketi-mtandao-zinaunganisha-mifumo-yazo-na-ya-serikali | LATRA public statement references 2024 online ticketing rule approval criteria, cyber safeguards and government integration. | Authority source; obtain current official application and technical pack. |
| S21-19 | https://velmalaw.co.tz/news/mandatory-electronic-payments-for-specified-transactions-tanzania-2026/ | Secondary legal summary of GN No. 158C effective 1 July 2026, covered transaction sectors and six-month transition. | Legal commentary, not substitute for official Gazette/counsel. |
| S21-20 | https://endoxagroup.co.tz/mandatory-electronic-payments-for-specified-transactions-in-tanzania-what-you-need-to-know/ | Secondary legal summary of electronic-means definition and scope. | Legal commentary, not legal advice. |
| S21-21 | https://www.gepg.go.tz/faq/ | GePG service provider joining steps, standard API, tests, accounts, revenue centers and payment types for government collections. | Authority portal; GePG is distinct from ClickPesa commercial collection and must not be conflated. |

## Provider-confirmation gaps

- Signed fee schedule/quote, account KYC and channel enablement for OuterBlocks Destinations Limited.
- Marketplace/split-settlement product and operator connected-merchant model or explicit statement that not available.
- Control-number expiry/closure and late-payment semantics.
- Refund-to-original-method support and chargeback responsibility by method.
- Webhook checksum requiredness, delivery retry/backoff/order/timeout and transition behavior.
- API throughput, payout batch API, one-create-per-60-second rate limit and settlement timetable.
- Data-processing terms, support access, uptime and incident response.
- Authoritative Gazette copy and legal opinion applying GN No. 158C and any related 2026 business licensing amendments to the actual group, operators and channels.
