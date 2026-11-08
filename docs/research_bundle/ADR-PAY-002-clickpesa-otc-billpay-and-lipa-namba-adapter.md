# ADR-PAY-002 — ClickPesa OTC Collection and Payout Adapter (Evidence-Gated)

**Status:** Candidate adopted for a controlled proof of concept; not a production provider selection or legal approval.  
**Date:** 24 October 2026

## Context

Travelar requires configuration-driven electronic payment for OIMS counter sales, agents, call centers and online bookings in Tanzania. ClickPesa's current public documentation describes mobile USSD Push, BillPay order/customer control numbers, TANQR/Lipa Namba merchant collections, hosted checkout/card options, payment queries/webhooks and mobile/bank/Lipa Namba payouts. It documents no sandbox and live API calls move real funds. Public material reviewed does not confirm marketplace split settlement for OuterBlocks Destinations Limited and multiple operators.

## Decision

1. Keep ClickPesa behind a provider-neutral `PaymentProviderAdapter`; do not make it the only PSP or expose raw ClickPesa responses to every business module.
2. Add ClickPesa BillPay order-control-number support and USSD Push to the first candidate POC. Use unique order-level references and exact-payment behavior for ordinary instant ticket purchases unless a specific approved policy requires otherwise.
3. Model TANQR/Lipa Namba collection as a separate product/capability. Activate for a particular POS flow only when provider transaction references and matching semantics are sufficient to prove which order was paid. Do not equate a generic static merchant Lipa Namba with a unique BillPay order reference.
4. Support payout APIs as queued, approved financial actions with preview/validation, beneficiary verification, provider status queries, webhook processing and reconciliation. The payout result `AUTHORIZED` is not terminal success; current docs show a 60-second per-merchant create-request throttle, so settlement batching must be evaluated.
5. Use local mocks/contract tests first. No automated CI, IDE agent or exploratory test may call ClickPesa production APIs. Any live transaction occurs only after approved KYC and under a human-authorized, provider-agreed low-value test plan.
6. Keep split/marketplace settlement `UNKNOWN` until confirmed in the signed product schedule and exercised with the actual OuterBlocks Destinations Limited/merchant account. If unsupported, select a separate legal/commercial model: direct operator collection with separate commission invoicing, or a legally approved Travelar collection-and-payout model.
7. All provider-specific fees, method availability, transaction ceilings, settlement timings, webhook/checksum requirements and payout rate limits must be stored as effective-dated provider capability/contract data; do not hard-code pricing or assume public fee tables are contractual.

## Consequences

- Add BillPay Control Number entities, payment intents, provider attempt records, webhook inbox, query/reconciliation jobs, payout batch/line records and per-method capability configuration.
- Require late-payment-after-hold-expiry handling, exact amount/currency/reference validation, idempotent event processing and durable operational exceptions.
- Do not activate generic Lipa Namba sale completion if it cannot be linked to a specific order with high confidence.
- Production readiness remains blocked by KYC/account entitlement, legal payment model, current pricing/fee confirmation, no-sandbox test controls, split settlement determination, regulatory requirements and financial reconciliation tests.

## Evidence

- https://docs.clickpesa.com/home/sandbox-and-testing-environment
- https://docs.clickpesa.com/bill-pay/billpay-api-overview
- https://docs.clickpesa.com/tan-qr/tan-qr-overview
- https://docs.clickpesa.com/home/webhooks
- https://docs.clickpesa.com/api-reference/collection/querying-for-payments/querying-for-payments
- https://docs.clickpesa.com/payout-api/mobile-money-payout-api/mobile-money-payout-api-overview
