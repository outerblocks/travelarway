# 10 — PSP, Communications and USSD Provider Comparison

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Research date:** 23 October 2026  
**Scope of this installment:** Payment service providers (PSPs), communications-provider architecture, USSD integration boundaries, merchant funds flow, payment confirmation, refunds, payout capability and public pricing evidence. Payment, email, SMS and other communications are separate adapter domains. Detailed Beem/Africa's Talking/USSD prices and coverage remain a follow-on evidence task; this document does not claim that vendor comparison is complete.

## 1. Executive result

Travelar should integrate PSPs as separate adapters behind a stable internal payment interface. Selcom, ClickPesa, Pesapal and DPO Pay by Network are candidates to qualify in parallel, not providers already selected or contracted. Use provider- and market-specific configuration and contracts. Do not make booking logic depend on a PSP's callback format, signature scheme, payment method vocabulary, refund behavior, or settlement cycle.

The most important product controls are:

1. A customer redirect is not proof of payment.
2. A provider callback is an input to reconciliation, not necessarily sufficient on its own; verify with the provider's status API or documented authenticated mechanism where offered.
3. Every payment attempt needs a durable internal ID and idempotency strategy, linked to the booking/order and provider reference.
4. A provider may report a payment as successful before its funds become available for settlement; payment state and settlement state must remain separate.
5. Do not issue a bus/ferry ticket in a paid state unless the required payment and inventory/ticket-issuance states are reconciled.
6. Do not introduce balances, stored value, pooled operator funds, or onward remittance without a written funds-flow/legal assessment and confirmation of permitted merchant arrangements.

## 2. Provider capability matrix

Status labels: **Documented** = currently visible in official public documentation; **Partner-gated** = contract, merchant account, KYC or permission required; **Quote required** = commercial price/settlement not confirmed by public terms; **Unknown** = obtain written evidence.

| Provider | Publicly documented capabilities | Integration/security signals | Refund and payout observations | Pricing and commercial caveats | Travelar decision |
|---|---|---|---|---|---|
| **Selcom Paytech** | Selcom publicly describes APIs spanning e-commerce, bill payments and disbursements. The Selcom Business API portal documents bank/wallet/internal transfers, transaction status, HMAC-based signing and callbacks for API-initiated transfers. | The opened Business API documentation uses `api-key`, time-bounded `timestamp`, `digest` and `signed-fields`; it documents unique transaction IDs and status lookup. Its public Business API portal is not, by itself, full evidence for the separate customer checkout/collection product Travelar needs. | Payout/transfer capability is documented. Confirm collection checkout API, payment status inquiry, refund or reversal support, payout permissions and settlement files under the exact merchant product/contract. | Public commercial pricing for the exact Travelar collection and disbursement model was not verified. Obtain a formal tariff and merchant agreement. | Qualify as a likely Tanzania candidate; request separate collection and payout documentation and a reconciled sample settlement file. |
| **ClickPesa** | Official pages document collections through mobile money USSD-Push, card, bank, TANQR/Lipa Namba and bill-pay-style channels; it also documents payout APIs for mobile money and bank payments. | Current official docs state there is **no sandbox**: the API Explorer and API calls operate against production and move real funds. Its published pre-KYC limits include TZS 100,000 shared transaction volume and 100 API calls/day; the docs advise completing KYC and testing carefully with small live amounts. Webhooks/status tools are documented. | Payout APIs are documented. Exact refund support, reversal lifecycle, settlement schedule, chargeback terms and support SLA need contractual confirmation by payment method. | Its current public page lists specific fees by method, including customer-charged USSD-Push fees, merchant fees for several bill-pay/QR methods, a customer-charged 4.85% card fee, and payout fees. This public pricing is not a Travelar quote. **The customer card-fee statement raises a legal/contractual conflict to resolve** against BoT's card surcharge rules before anyone copies it into checkout. | Strong candidate for Tanzania payment channels, subject to KYC, live-testing risk, pricing clarification and legal review of fee allocation. Do not use production API Explorer casually. |
| **Pesapal** | Official Tanzania pages offer online payments, cards, mobile money and bank/payment options; developer documentation provides API 3.0 JSON, authentication, submit-order, IPN registration, transaction-status, refund and cancellation endpoints. API 2.0 is marked deprecated by Pesapal's developer portal. | The API 3.0 flow uses authentication tokens, a submitted order, callback/IPN notification and `GetTransactionStatus`. Official documentation explicitly says the IPN does not contain all payment details, so the backend should query status by provider order tracking ID. | Refund-request API is documented, but an accepted refund request is not necessarily a completed refund. Official docs state refund requests require merchant approval; payment-method limitations include full-only mobile-money refunds and no more than one refund request per payment in the described API flow. Verify current account-specific conditions. | Public Travelar-specific processing rates, reserve/holdbacks, settlement times, international card rates and chargeback pricing were not verified. Get an account-specific written quote. | Qualify as a strong candidate for Tanzanian online checkout; build to API 3.0, not deprecated API 2.0. Test the documented refund semantics explicitly. |
| **DPO Pay by Network** | Official docs describe hosted checkout; `createToken` -> customer redirect -> callback -> `verifyToken` flow; multi-currency and risk-screening features are described. Public documentation includes refund/void concepts and payment status lookup. | Hosted checkout keeps raw card data away from Travelar's application in the documented flow. DPO asks for HTTPS return/callback URLs and transaction-reference logging; status must be independently verified using `verifyToken` where applicable. | Its FAQ says funds may be held for fraud/compliance checks before settlement and early settlement may include a reserve. It states the merchant bears chargeback repayment responsibility; refund initiation may require support/merchant-of-record coordination. The exact production API and account-specific refund flow must be confirmed. | Public pricing was not verified; quote required. Contract determines merchant-of-record, payout/reserve, chargeback, refund and settlement obligations. | Qualify where DPO's country/method coverage and commercial terms fit; do not assume immediate settlement or automated refunds. |

### Evidence sources for this matrix

- Selcom Business API: https://developer.selcom.business/; Selcom business: https://www.selcom.net/business; Selcom describes itself as regulated by the Bank of Tanzania: https://www.selcom.net/sip
- ClickPesa docs: https://docs.clickpesa.com/; sandbox/live testing notice: https://docs.clickpesa.com/home/sandbox-and-testing-environment; methods: https://clickpesa.com/payment-gateway/; public pricing: https://clickpesa.com/payment-gateway/pricing/
- Pesapal developer portal: https://developer.pesapal.com/; API 3.0 status: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/gettransactionstatus; refunds: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/refund-request; Tanzania offer: https://www.pesapal.com/tz/business/online
- DPO API docs: https://docs.dpopay.com/dpo-pay-by-network/docs/api-docs; quick start: https://docs.dpopay.com/dpo-pay-by-network/reference/quick-start-guide; callbacks: https://docs.dpopay.com/dpo-pay-by-network/reference/payment-result-callbacks; settlement/refund FAQ: https://docs.dpopay.com/dpo-pay-by-network/docs/frequently-asked-questions

These links substantiate documented product behavior, not Travelar's eligibility, active contract, specific fee schedule, production credentials or legal authority to perform payment services. All require direct onboarding confirmation.

## 3. Payment adapters: recommended stable interface

The domain should depend on normalized payment operations, not a particular provider implementation. Candidate conceptual operations:

- `createPaymentIntent`: create an internal payment attempt for a booking, amount, currency, customer and permitted method.
- `initiatePayment`: call provider checkout/push/payment API using an idempotency key where supported.
- `getPaymentStatus`: query status from the authoritative provider endpoint.
- `parseNotification`: verify and normalize provider-specific callbacks/webhooks; preserve the raw event securely.
- `requestRefund`: request a full or partial refund only if the provider, payment method and contract permit it.
- `getRefundStatus`: confirm refund state separately from the acceptance of the refund request.
- `createPayout` and `getPayoutStatus`: only for contractually enabled, legally permitted disbursements.
- `getSettlementReport` / `importSettlement`: use a provider report, API or finance-exported file.
- `health` and `capabilities`: state-specific capability discovery, not a generic promise that all methods exist for every PSP.

Each adapter must publish a capability object per merchant account, country, currency and payment method. Example flags include `hosted_checkout`, `mobile_money_push`, `card`, `bank_transfer`, `status_query`, `signed_webhook`, `refund_full`, `refund_partial`, `refund_async`, `payout_bank`, `payout_wallet`, `settlement_report`, `multi_currency`, `idempotency_support` and `sandbox_available`. Every flag must be evidence-backed and time-stamped; `unknown` must remain distinct from `false`.

### Do not over-normalize

Providers have different final-status vocabularies, refund timing, notification behavior, idempotency guarantees, currency/amount formats and payout services. Preserve:

- raw provider event payload (restricted access, redacted where possible);
- provider transaction/reference IDs;
- normalized state and source state;
- event received-at and provider event time if supplied;
- event verification result and verification method;
- API request correlation ID and attempt number;
- merchant account, country, currency and method;
- reconciliation status and ledger links.

Never store API secrets or full card data in event payloads or logs. Do not treat an unverified callback as a financial fact.

## 4. Payment and booking state model

Recommended independent state machines:

**Payment intent:** `created -> pending_provider -> succeeded | failed | cancelled | expired | unknown`; `unknown` is a reconcilable state, not a terminal failure. A later verified status can resolve it. Reversals/chargebacks are separately recorded and must not erase the original success event.

**Refund:** `requested -> submitted_to_provider -> pending -> succeeded | failed | needs_manual_review`. A provider returning HTTP 200 or “request accepted” is not proof the customer has received money.

**Booking:** `draft -> inventory_held -> awaiting_payment -> paid_or_payment_verified -> fulfilment_pending -> confirmed`; separate paths exist for `payment_exception`, `supplier_exception`, `cancelled`, `refund_pending`, `partially_refunded`, `refunded` and `manual_review`. Final state design must be mode-specific.

**Settlement:** `expected -> partially_settled | settled -> reconciled`, plus `short_paid`, `overpaid`, `held/reserved`, `missing` and `disputed` exception states.

Ticket issuance is its own event/state. A paid booking whose ticket API failed is not a confirmed fulfilment. Do not automatically issue duplicate tickets when retrying; query existing order/ticket status first.

### When payment succeeds after inventory expires

1. Persist the verified payment event immediately.
2. Check the booking's still-valid inventory/offer with the authoritative supplier or operator system.
3. If still bookable, atomically reacquire the allocation and continue fulfilment.
4. If no longer available, do not silently confirm a different fare or seat. Start a defined recovery path: supplier-approved substitute only with customer consent, or refund/exception workflow.
5. Keep the booking in a visible exception state until money and fulfilment are resolved.

### Webhook/event controls

- HTTPS endpoint; provider-specific authentication/signature/IP controls only where documented and maintained.
- Verify signatures over the exact canonical bytes/fields required by the provider; do not invent a common HMAC rule.
- Apply replay controls, timestamp windows where supported, provider-reference uniqueness and idempotent event processing.
- Treat duplicate, delayed and out-of-order callbacks as routine.
- Return the provider's required acknowledgment promptly after durable receipt; perform heavy reconciliation asynchronously.
- When callback verification fails or event payloads are incomplete, retrieve authoritative status server-to-server.
- Rate-limit by source and endpoint; avoid blocking good provider retries solely because their IP changed unless the provider documents stable IP ranges.
- Alert on provider amount/currency mismatch, merchant-reference mismatch and a verified payment for an expired/cancelled order.

## 5. Settlement model and role boundaries

Travelar must not assume every provider offers marketplace split payments or legally approved submerchant settlement. During onboarding, establish:

- Merchant named on the checkout and bank statement.
- Merchant of record / contracting seller for each service.
- Whether PSP agreement permits a marketplace, travel agency, ticketing intermediary, agent or submerchant arrangement.
- Which entity holds title to or owes customer funds at each stage.
- Whether funds are settled gross, net of MDR/fees, net of refunds, withheld in reserve or split by the PSP.
- Beneficiary KYC and permitted payout recipients.
- Settlement bank account(s), currency, cut-off, weekend/holiday rules, minimum payout and bank fee.
- Reserve, rolling holdback, delay, offset rights and termination payout procedure.
- Chargeback response owner and funds debit path.
- Whether payouts are provider-initiated under a supported contract or separate bank transfer instructions.

Preferred launch principle: receive customer payment through a properly contracted PSP merchant arrangement and pay suppliers only through a legally reviewed, contracted settlement workflow. Do not invent a customer wallet or hold unearned operator money indefinitely. If regulator/counsel indicates collection and re-distribution would be regulated, use supplier-direct collection, PSP-supported marketplace/submerchant structure, or another approved arrangement.

## 6. Provider onboarding RFI: ask every PSP the same questions

1. Confirm legal contracting entity, current Bank of Tanzania or other country authorization, product licence/category, permitted use, and supported merchant countries.
2. Confirm Travelar/OuterBlocks eligibility, travel marketplace merchant category, operator/supplier submerchant model, and whether one company can collect for multiple unrelated suppliers.
3. Provide product/API documentation, sandbox/test plan, API limits, idempotency behavior, webhook security, final-status method and error list.
4. List supported payment methods and currencies by country, merchant channel and customer country, with minimum/maximum amounts.
5. Provide the entire fee schedule: setup, monthly, transaction MDR, mobile money/issuer fees, chargebacks, refunds, payout and FX; state who legally may be charged each fee.
6. Give T+N settlement timetable by method, statement samples, settlement API/file delivery and reconciliation keys.
7. Document partial/full refund, reversal, refund-status API, fees returned/not returned and manual-approval needs per payment method.
8. Describe chargeback liability, dispute-response SLA and what customer evidence Travelar must retain.
9. Describe reserves, rolling holdback, negative balances, payout delays, termination funds and emergency suspension rights.
10. Confirm whether payments may be captured before supplier confirmation, whether delayed capture/void is supported, and how failed fulfilment is refunded.
11. Identify outage SLA, support escalation, incident notification and transaction recovery process.
12. Provide data-processing terms, sub-processors, storage/processing locations, retention, cross-border transfers and breach notification timelines.
13. Explain KYC, beneficial-owner/administrator documents, bank-account proof, expected approval steps and annual refresh.
14. Provide current production references for travel or high-volume ticketing merchants if available.

## 7. Pricing findings and surcharge caution

ClickPesa currently publishes a granular price table. As checked on 23 October 2026, it states that particular mobile-money USSD-Push fees are charged to the customer, some collection methods are charged to the merchant, and its card-payment section lists a 4.85% customer charge. The same page lists payout fees such as TZS 2,360 for bank EFT/ACH transfers within its published amount range and TZS 11,800 for TISS TZS payouts within its listed range. These public figures are an evidence point, not Travelar's contracted tariff. They may change and may be method- and contract-specific.

The Bank of Tanzania's 2024 Guidelines on Fees and Charges for Banks and Financial Institutions, guideline 19, say banks/financial institutions and their merchants shall not impose fees/charges on consumers for card merchant payments; the Bank's December 2024 notice also warns against card surcharges at POS terminals. This creates a material issue to resolve before using any PSP's public “customer charged” card-fee presentation in Travelar. Do **not** add a card surcharge or copy a PSP fee display into checkout without Tanzanian counsel and written PSP/authority confirmation for the exact online travel transaction. The guideline's scope and the PSP page's description should be reconciled, not guessed. Mobile-money fees need their own review and transparent pre-transaction disclosure; no blanket permission is assumed.

For Selcom, Pesapal and DPO, published, contract-ready Travelar rates and net settlement costs were not verified. Use `QUOTE_REQUIRED`, not a fabricated fee percentage, in the financial model until written tariffs arrive.


## 8. Communications must also use multi-provider adapters

The product owner explicitly requires communications systems to be adapters so Travelar can continue operating when a provider fails or is under maintenance. Record this as `ADR-COMMS-001-multi-provider-communication-adapters.md`. It is a confirmed architecture direction, not a decision to select or contract any vendor. Resend is an email candidate; Beem and Africa's Talking are candidate regional messaging providers, alongside other providers that must be researched with current official documentation and quotes. Amazon SES and Twilio are useful examples of mature event/status documentation, not automatically preferred vendors.

### Required boundary

Business modules emit a semantic event such as `booking.confirmed`, `ticket.issued`, `payment.refund.completed`, or `trip.disrupted`. A Travelar notification service creates one durable notification intent, selects a template and language, checks consent/policy, then routes through a provider/channel adapter. It records provider-specific attempt and status events. Application modules must not call Resend, an SMS aggregator or a WhatsApp vendor directly.

Provider adapters should expose capability information per account and destination: country coverage, channel, sender ID, supported templates/encoding, throughput/quota, delivery receipts, status query, idempotency support, retry behavior, pricing, provider health and data-processing terms. Provider-specific delivery states must be mapped without losing raw event details.

### Resilience rules

- Use a transactional outbox or equivalent durable queue so a committed booking event cannot be lost because the messaging API was down.
- Use a single `notification_intent_id` with individual provider-attempt IDs. Verify webhook authenticity, deduplicate repeated events and handle out-of-order events.
- Do not send via a secondary provider blindly after a timeout: the first provider may have accepted the message. Query status or reconcile using a stable reference where the provider supports it; mark unresolved outcomes `UNKNOWN`. Any duplicate-risk fallback must be policy-approved for the message category.
- Provider `accepted`/`queued` is not proof the recipient received the message. Normalize `accepted`, `sent`, `delivered-reported`, `failed`, `bounced`, `suppressed` and `unknown` only where the channel supports the distinction. Email delivery commonly means the recipient mail server accepted it, not that a human read it; SMS delivery reports depend on downstream carrier support.
- Cross-channel fallback (e.g. email to SMS) is not the default. It requires a documented category policy and consent/preference/legal-basis checks. Never fail over around an unsubscribe/suppression rule. OTPs need one active challenge, controlled resend and strict rate limits.
- Select only providers with approved sender IDs/short codes where required, valid country coverage, sufficient quotas and acceptable data transfer/retention conditions. Keep ticket content minimal; use secure links for sensitive details.
- Health-aware routing should use per-provider/account/channel circuit breakers, outage/maintenance status and alerts. Do not create uncontrolled routing oscillations. Disabling a provider must not break booking, payment, ticket validity or retrieval of historical status.

### Official reference documentation

- Resend describes granular email event webhooks and event visibility: https://resend.com/features/webhooks and https://resend.com/changelog/webhook-event-visibility
- Amazon SES documents delivery, bounce, complaint and delay event types: https://docs.aws.amazon.com/ses/latest/dg/monitor-sending-activity.html
- Twilio documents outbound status callbacks and warns callback requests may not arrive in the order sent: https://www.twilio.com/docs/messaging/guides/track-outbound-message-status and https://www.twilio.com/docs/messaging/guides/outbound-message-status-in-status-callbacks

These sources evidence vendor-specific event semantics, not Travelar's production eligibility or a complete Tanzania/Kenya vendor assessment.

## 9. USSD is an interactive channel adapter, not a privileged backend

A USSD gateway/aggregator adapter may transport a session, but it must call the same Travelar application/API layer used by the website and apps. It must not access the database directly or bypass authentication, pricing, inventory, payment status, passenger validation, authorization or audit controls. USSD charging/session timeouts and short-code approval need independent commercial and regulatory validation. A completed USSD session is not proof of a successful payment or confirmed ticket.

## 10. Communications and USSD provider commercial research still outstanding

Beem, Africa's Talking and additional messaging/USSD aggregators remain to be compared using current official docs and direct quotes. Obtain country-specific pricing, sender-ID/short-code approval, throughput, delivery-receipt semantics, alphanumeric sender restrictions, USSD session charges/timeouts, SLA, data location and reseller rights. Resend, SES and Twilio documentation provide examples of event semantics but do not establish they are appropriate or commercially available to OuterBlocks in each market.

## 11. Acceptance criteria before a PSP adapter is production-enabled

- Legal/contract/commercial evidence approved and recorded.
- Live merchant credentials are held in an approved secret store, never source control.
- Provider-specific webhook and status semantics documented in an adapter ADR and contract tests.
- Payment attempt ID, provider references and idempotency behavior tested.
- Duplicate, delayed, wrong amount, wrong currency, replayed notification and lost callback cases pass.
- Late payment after inventory expiry and supplier/ticket failure are exercised end to end.
- Refund accepted-but-not-completed and provider reserve/settlement delay are tested.
- Daily booking/payment/provider/settlement reconciliations produce zero unexplained differences or tracked exceptions.
- Monitoring and human support runbook cover provider outages and stuck transactions.
- A rollback/deactivation path exists without losing the ability to query existing provider orders and refunds.
