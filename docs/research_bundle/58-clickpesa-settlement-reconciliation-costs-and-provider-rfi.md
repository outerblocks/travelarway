# 58 — ClickPesa Settlement, Reconciliation, Costs and Provider RFI

**Research date:** 24 October 2026

## 1. Distinguish collection, balance, settlement and payout

Travelar must not use the word `settled` for every successful customer payment.

- **Customer payment success:** provider confirms the payer's transaction succeeded; this can authorize a booking/ticket under the relevant supplier and payment rules.
- **ClickPesa balance/available funds:** funds recorded against the merchant balance, subject to provider timing/availability.
- **Settlement to OuterBlocks Destinations Limited's bank:** a transfer from provider/settlement account to the company's own bank, matched to a statement.
- **Supplier/agent payout:** separate disbursement to a vetted beneficiary; accepted/authorized is not completed.
- **Marketplace split:** allocation at source to several beneficiaries. Public docs reviewed did not confirm this capability for Travelar.

The API documentation for payouts lists statuses such as `AUTHORIZED`, `PROCESSING`, `SUCCESS`, `FAILED`, `REFUNDED` and `REVERSED`, depending on product. ClickPesa's Lipa Namba payout documentation explicitly says `AUTHORIZED` means accepted and instructs polling or webhook monitoring until a terminal outcome. A bank or mobile payout must not be shown as paid to the beneficiary until its provider-confirmed outcome is reconciled.

## 2. Payout cadence and throughput

Current public API docs state a payout-create request is limited to one per merchant every 60 seconds for mobile money, bank and Lipa Namba payout APIs. Confirm whether this is a fixed platform-level rate limit, whether batch API payout exists for the particular account, and whether parallel independent merchant/application accounts change the limit (do not assume they do).

**Design implication:** queue, approve and batch supplier/agent payouts by a payout cycle rather than create a payout for every ticket. The finance engine should calculate each beneficiary's due amount from the ledger and agreement. A payout batch can contain many lines; each line retains a unique idempotent internal reference and a provider status. A batch submission does not make every line successful. If only dashboard-based bulk upload is available, finance operations need controlled maker/checker upload, exported submission evidence and imported results until a supported API alternative is confirmed.

## 3. Current displayed ClickPesa price evidence and questions

Public page reviewed: https://clickpesa.com/payment-gateway/pricing/

Examples displayed on that page on 24 October 2026 include USSD Push fee bands described as charged to customers in addition to MNO charges; BillPay wallet collection fee bands of 1% for M-Pesa/Airtel, 2% for HaloPesa and 2.5% for Mixx by Yas; CRDB BillPay at 1%; TANQR/Lipa Namba collection at 2% merchant charge; cards at 4.85% customer charge; and payout fee tables for wallet/bank/TANQR methods. The ClickPesa BillPay API post https://clickpesa.com/introducing-billpay-apis-for-invoices-and-customers/ additionally claims a 1% fee per successful BillPay API payment regardless of control number type. Obtain a signed/current quote that explains whether those statements refer to separate charges, network-specific rates, price versions, VAT or any other layer. Do not hard-code any public table.

The platform should store a versioned PSP pricing schedule with provider, merchant account, payment method, currency, lower/upper amount, fixed/percentage fee, fee payer, tax treatment, valid-from/valid-until, source document/quote and approval. Actual provider statement fees are authoritative evidence for reconciliation; the configured forecast fee is not proof of the amount charged.

## 4. Finance posting model

Use the double-entry subledger and general ledger already established in Documents 12 and 43. Each payment attempt is operational data; accounting entries are posted idempotently from the verified financial event, not from an untrusted client redirect.

A conceptual sale flow, subject to accounting policy and principal/agent classification:

- when a valid sale and customer obligation is created, record only the appropriate receivable/sale/contract obligations as defined by the accountant;
- on confirmed PSP collection, post the matched cash/PSP-clearing debit and related customer/supplier/Travelar obligations/earned revenue/fees to the correct ledgers;
- when the PSP settles net proceeds, reconcile PSP clearing against bank net receipt and separately record fees/withholdings;
- when a supplier/agent payout succeeds, reduce the corresponding payable and cash/provider balance; when it fails or is reversed, restore the payable/available balance through an explicit correcting journal;
- refunds and chargebacks are explicit reversal/adjustment entries with a link to the original transaction, not edits/deletions.

Do not infer “Travelar revenue” equals the customer amount. Commission-only, affiliate and principal/merchant-of-record journeys can have different accounting treatment. The accountant needs to map every route into a documented posting template.

## 5. ClickPesa provider RFI: written confirmations required

Ask ClickPesa to answer with product/version, contractual documents and account-level eligibility for `OuterBlocks Destinations Limited`:

1. Can it support marketplace/connected-submerchant/split settlement so an operator receives its share and OuterBlocks Destinations Limited receives commission in one transaction? If yes, name the product, licensing basis, merchant-of-record model, onboarding/KYB of every operator, refund/chargeback ownership, reserves, settlement accounts, statement fields and API operations.
2. If not, may the operator use its own ClickPesa merchant account with no split, while Travelar receives commission through a separately permitted invoice/collection route? What account, statement or integration data can the operator legally share?
3. For BillPay Order Control Numbers: what is the exact closure/expiry behavior; can Travelar disable them when a seat hold expires; what happens to a payment already in flight; is there a hard expiry API field; what webhook and query reference identifies partial/multiple payments? Clarify exact/partial/overpayment handling and whether a closed number can be reopened.
4. Are `PAYMENT RECEIVED` callbacks signed with an HMAC checksum in every environment/product? Which fields are hashed, what signature/checksum version is current, are callbacks retried, for how long, in which order, with what timeout and backoff? Provide an exact signed example.
5. What is the recommended source of truth when callback and query status conflict? Can payment status transition from FAILED/PENDING to SUCCESS? How are reversal/chargeback/late-success events delivered?
6. What is settlement timing by method, and what balance fields represent available, pending and reserved funds? Are reports and APIs available for settlement batches, fees, reversals, payer details and bank transfers?
7. Is there a true refund API for each collection method? Can refunds only be submitted via mobile-money payouts or manual/network-specific reversal? What evidence and reference ties the refund to the original charge?
8. The public docs say no sandbox. Can ClickPesa provide an isolated test merchant, test-only credentials, a controlled test window/account or provider-assisted test process that does not risk real passenger funds? If none, specify safeguards for controlled low-value live tests after KYC.
9. Confirm current fee schedules, whether the Blog's 1% BillPay API fee stacks with the published network-specific BillPay price table, card fee/surcharge rules, payout rate limits, daily transaction limits, KYC level requirements, KYC fees, settlement/reserve policies and all taxes.
10. Confirm data-processing terms, country hosting/processing, support access, breach notification, retention, audit support, uptime SLA, planned maintenance and business continuity contacts.

## 6. Reconciliation cadence

- **Real-time/near real-time:** persist and match all webhooks; update order/payment state only under idempotent transition rules.
- **Exception queue:** payment success amount/reference mismatch, unknown payer, late success, duplicate callback, checkout paid but supplier booking failed, provider status conflict and payout unknown.
- **Intraday polling:** query outstanding `PENDING`/`PROCESSING`/unknown payments/payouts with bounded retries and provider rate limits.
- **Daily:** compare provider payment query/export, settlement report, ClickPesa balance/statement, bank credits/debits, tickets, refunds, reversals, fees and internal ledger entries.
- **Period close:** age unresolved items, require ownership and explicit disposition, and stop silently carried exceptions from rolling into later periods.

## Sources

- https://docs.clickpesa.com/home/webhooks
- https://docs.clickpesa.com/api-reference/collection/querying-for-payments/querying-for-payments
- https://docs.clickpesa.com/payout-api/mobile-money-payout-api/mobile-money-payout-api-overview
- https://docs.clickpesa.com/payout-api/bank-payout-api/bank-payout-api-overview
- https://docs.clickpesa.com/api-reference/disbursement/lipa-namba-payout/create-lipa-namba-payout
- https://clickpesa.com/payment-gateway/pricing/
- https://clickpesa.com/introducing-billpay-apis-for-invoices-and-customers/
