## Stage 21 — ClickPesa OTC controls

ClickPesa research now identifies distinct USSD Push, BillPay order/customer control numbers, TANQR/Lipa Namba, card/hosted checkout, and mobile/bank/Lipa Namba payout products. See Documents 56–58. For single ticket sales, prefer order-level control numbers with exact payment mode where supported; generic Lipa Namba must not automatically fulfil a sale without reliable transaction-to-order matching. No sandbox exists, callbacks can include HMAC-SHA-256 checksums, status queries are available, and payout create APIs document a one-per-merchant-per-60-seconds limit. Confirm signed fees and split settlement; neither is assumed.

# 12 — Financial Accounting, Settlement and Reconciliation

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Status:** Logical accounting design for research; not a tax opinion, signed funds-flow model or final chart of accounts.  
**Date:** 23 October 2026

## 1. Purpose and accounting boundary

Travelar must record each monetary event as a traceable business event and, where accounting recognition applies, balanced double-entry journal. Booking status, payment status, ticket fulfilment, supplier settlement and accounting recognition are related but distinct. A confirmed payment does not prove service delivery; a supplier settlement does not prove a refund is complete; a booking's gross price is not automatically Travelar's revenue.

The correct accounting depends on executed contracts and the principal-versus-agent assessment for each mode. OuterBlocks must have a Tanzanian accountant/tax adviser validate the chart, taxes, fiscal receipts, revenue recognition, FX and any trust/client-money constraints before production.

## 2. Logical account families

The names below are conceptual; assign account codes with the accountant.

### Assets
- Operating bank accounts by currency and legal owner.
- PSP clearing/receivable accounts by provider, merchant account, currency and settlement batch.
- Supplier/operator receivables for overpayments, clawbacks, advances and refund recourse.
- Employee/agent cash advances and till floats.
- Refund recoverables / provider chargeback receivables where recoverable.
- FX revaluation assets where applicable.

### Liabilities
- Operator/supplier payable by operator, contract, booking and currency.
- Customer refund payable.
- Customer cash held / unapplied receipts / unidentified payments.
- Agent cash due / branch cash due.
- PSP settlement holds, reserves and withheld amounts.
- Taxes payable/withholding obligations as confirmed by tax advisers.
- Chargeback/dispute reserve and other accrued liabilities.
- Customer credits only if legally approved; avoid creating stored-value-like balances by default.

### Revenue and contra-revenue
- Marketplace commission by mode and country.
- Contracted software/service fees.
- Contractually permitted flight/hotel/experience markup or distribution revenue.
- Ancillary or disclosed service fees only where permitted.
- Commission reversals/contra-revenue for refunds, cancellations, and chargebacks under the contract/accounting policy.

### Expenses
- PSP processing and payout fees.
- GDS/supplier booking and segment fees.
- Refund and chargeback fees not recoverable.
- SMS/email/ticket-delivery costs.
- Fraud loss and unrecovered supplier amounts.
- Customer support, operations and channel commissions.
- FX loss and bank fees.
- Discounts/promotion costs by funding party.

## 3. Immutable business events, not mutable balances

Every financial event should carry:

- internal event ID and idempotency key;
- event type and lifecycle sequence number;
- business object (booking, payment, refund, payout, settlement, commission or shift);
- source provider/system, source reference and account/tenant/country;
- transaction currency, settlement currency and FX rate/source/time if conversion occurs;
- gross, fee, tax, net and rounding components as separate values;
- actor, creation time, approval and reason where human action applies;
- linked journal ID(s), reversal link and reconciliation status;
- original event payload/reference stored under controlled retention, with secrets/payment credentials removed.

Do not rewrite posted journals. Correct an error with a reversing/adjusting journal that references the original and requires authorization. Application updates should be append-only for posted finance events, protected by database privileges, independent audit exports and backups. A hash chain alone does not make records immutable: an administrator able to rewrite the whole chain can recalculate hashes. Independent storage, restricted access, signing/time-stamping, backups and reconciliation are all needed.

## 4. Core ledgers and subledgers

1. **General ledger:** balanced debit/credit entries and period-close controls.
2. **Booking/commission subledger:** each contract version, eligible fare, commission base, rate, deductions and earning event.
3. **PSP transaction subledger:** payment attempts, verified status, fee, reversal, dispute and provider IDs.
4. **Operator/supplier subledger:** gross due, commission deduction permitted by contract, adjustments, payout batch and remaining payable.
5. **Refund subledger:** request, approval, provider acceptance, provider completion, bank movement and remaining customer liability.
6. **Cashier/agent subledger:** opening float, sales by payment type, tickets/voids/refunds, paid-in/out, expected cash, counted cash, variance and supervisor resolution.
7. **Settlement subledger:** gross collections, fees, reserves, refunds, chargebacks, payout and bank-value dates.
8. **FX subledger:** original transaction amounts, settlement amounts, applied rate/source, realized and unrealized difference, and conversion fee.

Each subledger must tie to the general ledger by currency and reconciliation date; exceptions must not disappear into a manually edited balance.

## 5. Worked accounting examples

The entries are illustrative and use TZS. They assume a disclosed agency model in which Travelar earns a 7% commission on a TZS 100,000 eligible fare, the operator is owed the remaining TZS 93,000, the PSP charges Travelar an assumed 2% fee, and the PSP settles net of that fee. The assumed PSP percentage is not a verified tariff. Tax/VAT and EFD treatment are omitted and must be added after tax advice.

### Example A — customer pays TZS 100,000, PSP verifies collection

**At verified collection / earning event, if the contract/accounting policy permits commission recognition at this point:**

| Account | Debit (TZS) | Credit (TZS) |
|---|---:|---:|
| PSP clearing receivable | 100,000 | — |
| Operator payable | — | 93,000 |
| Marketplace commission revenue | — | 7,000 |
| **Total** | **100,000** | **100,000** |

If commission is not earned until departure/fulfilment, credit unearned commission/deferred revenue instead and recognize revenue at the contractually and accounting-policy-supported event.

**When PSP settles TZS 98,000 to bank and withholds TZS 2,000:**

| Account | Debit (TZS) | Credit (TZS) |
|---|---:|---:|
| Bank | 98,000 | — |
| PSP processing expense | 2,000 | — |
| PSP clearing receivable | — | 100,000 |
| **Total** | **100,000** | **100,000** |

**When TZS 93,000 is paid to the operator:**

| Account | Debit (TZS) | Credit (TZS) |
|---|---:|---:|
| Operator payable | 93,000 | — |
| Bank | — | 93,000 |
| **Total** | **93,000** | **93,000** |

The remaining cash contribution from this transaction is TZS 5,000 (commission TZS 7,000 less processing expense TZS 2,000), before other operating costs and applicable taxes. Revenue is TZS 7,000 under the example agency assumption, not TZS 100,000.

### Example B — full refund before operator payout

Assume the commission must be reversed under the operator agreement and the operator payable remains available to offset. On approved refund obligation:

| Account | Debit (TZS) | Credit (TZS) |
|---|---:|---:|
| Operator payable | 93,000 | — |
| Commission revenue reversal / contra-revenue | 7,000 | — |
| Customer refund payable | — | 100,000 |
| **Total** | **100,000** | **100,000** |

When the PSP/bank confirms the money has actually left:

| Account | Debit (TZS) | Credit (TZS) |
|---|---:|---:|
| Customer refund payable | 100,000 | — |
| Bank or PSP clearing | — | 100,000 |
| **Total** | **100,000** | **100,000** |

If the PSP fee is non-refundable, it remains as an expense. If the operator was already paid, replace the reduction of operator payable with an operator receivable/clawback or an approved reserve/contract mechanism. Do not pretend to reverse cash already paid.

### Example C — travel supplier net-rate sale

Assume a hotel supplier contract provides a net rate of TZS 400,000 and Travelar is contractually permitted to sell at TZS 430,000. Customer pays TZS 430,000, subject to the agreed earning/fulfilment policy.

| Account | Debit (TZS) | Credit (TZS) |
|---|---:|---:|
| PSP clearing | 430,000 | — |
| Hotel/supplier payable | — | 400,000 |
| Permitted markup/distribution revenue (subject to principal/agent/tax review) | — | 30,000 |
| **Total** | **430,000** | **430,000** |

If the contract requires the hotel or wholesaler to be the merchant/seller and Travelar is an agent, gross/net revenue presentation may differ. The journal is a model to analyze, not proof that this markup arrangement is available or lawful.

### Example D — payout initiated but provider status unknown

Do not debit operator payable a second time or mark it settled merely because a payout request returned an accepted response. Maintain `payout_pending` linked to the same operator payable, query the provider status, and post the bank/clearing movement only on verified result. If the provider times out after initiation, reconcile by the unique provider/payout reference before retrying.

### Example E — cash counter sale

For a TZS 100,000 ticket sold at an operator counter, whose cash and ticket are controlled directly by the operator, Travelar should not recognize a marketplace commission by default. The operator records the cash and sale according to its system/accounting obligations. If Travelar actually operates an authorized cashier or collects money under a signed contract, define the float/custody and settlement procedure first. Travelar's channel attribution must not override this commercial fact.

## 6. Bank/PSP/operator reconciliation

Run reconciliations daily at minimum during a live travel launch, with more frequent alerts for unresolved high-value transactions. Reconcile three independently sourced sets:

1. **Business events:** bookings, supplier reservations, payment attempts, refunds, payouts and ledger journals.
2. **PSP events and statements:** provider transaction status, amount/currency, fees, refunds, reserves, chargebacks, settlements and batch totals.
3. **Bank movements:** booked value date, amount/currency, reference and fees.

Match using a confidence hierarchy: exact PSP/provider ID; exact merchant reference; exact amount/currency/date/batch; supervised manual investigation. Never match only on customer name or amount when multiple transactions could qualify.

Exceptions include:

- successful payment with no booking or booking with no payment;
- amount/currency mismatch;
- duplicate provider reference or duplicate webhooks;
- payout without approved settlement batch;
- settlement gross/net mismatch or unexplained fee;
- refund request accepted but not completed;
- refund in statement absent from internal refund record;
- chargeback that does not map to an order;
- ticket issued but payment reversed;
- operator payable paid twice or remains overdue;
- PSP reserve/holdback not separately accounted;
- cashier cash expected vs counted mismatch.

Each exception has owner, amount, age, evidence links, severity, next action, approval and close reason. Provide stale/aged queues and prohibit silent deletion.

## 7. Maker-checker and payout control

- Payout batches require system eligibility checks: service status, refund/dispute holds, operator agreement, due date, bank-account/KYC status and unreconciled exceptions.
- One user prepares and another authorizes material payouts; the same person cannot alter a supplier bank account, approve a payout to it and reconcile the payout.
- Bank-account changes require out-of-band verification against the contracted counterparty and a cooling/approval process.
- Refund policy/amount thresholds require maker-checker approval; an emergency override is logged and reviewed.
- Payment provider credentials, payout permission and support/admin access are separate privileges.
- Treasury can pause disbursement for a defined risk signal, but an automated hold must have a reason, escalation timer, review owner and release path to avoid wrongful non-payment.
- Payout reconciliation is separate from payout initiation. “Sent” and “settled” are different facts.

## 8. Currency and FX

Never assume booking currency, PSP charging currency, settlement currency and supplier currency are identical. Store all as ISO currency codes with minor-unit precision rules per currency. Capture displayed quote, quote expiry, rate source, applied FX rate, rounding and fee. Do not silently change the booked total when a provider refreshes FX; reprice and obtain consent if material. Reconcile cross-currency settlement with realized FX separately from processing/FX fee. Set which entity bears rate movement between booking and ticketing.

## 9. Fiscal receipts and taxes

Request TRA advice for the real contract structure: which party issues fiscal receipts for ticket fare, Travelar commission, service charges and refunds? Establish whether LATRA/EFDMS or provider integrations determine receipt fields or numbering and how cancellations, discounts and partial refunds are represented. Never build a generic “receipt issued” boolean that is disconnected from actual fiscal confirmation. The applicable VAT, withholding tax, income tax, destination-based obligations and e-invoice rules require Tanzanian tax advice and may differ by service/country.

## 10. Revenue assurance and records

- Contract and commission versioning ties each journal to terms applicable at the time.
- Segregate finance role grants: booking operator, refund approver, payout preparer, payout approver, ledger poster and auditor.
- Export immutable daily PSP and bank statements to a restricted independent store.
- Use database constraints and idempotent journal-posting keys to stop duplicate financial posting.
- Use signed/append-only audit events plus independently administered backups; a hash chain alone is not immutability.
- Month-end close locks periods to posting with documented adjustment procedures.
- Every adjustment identifies source record, reason, actor, approver, journal and reporting impact.
- Provide auditor export across booking, payment, supplier, commission, refund, payout, PSP clearing and bank movement.

## 11. Liquidity and working capital

Calculate a cash buffer using observed timing gaps, not an arbitrary percentage of GMV. The model should cover: PSP settlement days; weekends/public holidays; DPO reserves/holds; provider settlement fees; refunds required before supplier clawback; chargebacks after supplier has been paid; supplier prepayment rules; foreign currency balances; and peak-season spikes. Stress tests must include a payment success with ticket failure, a provider settlement delay, a surge in refunds and a payout hold. Do not distribute cash required for accrued refunds or disputed transactions.

## 12. Evidence needed before approval

- Executed PSP and operator/supplier agreements.
- Signed funds-flow diagram for each mode.
- Current provider tariff and settlement statement sample.
- Refund/cancellation/chargeback contracts and actual provider status semantics.
- Current OuterBlocks corporate, tax and bank account evidence.
- Legal opinion on payment-regulatory role and merchant/submerchant settlement.
- Accountant's principal/agent and revenue-recognition memo.
- TRA determination on EFD/fiscal-receipt responsibilities and taxes.
- Bank reconciliation test and mock settlement batch.
- Finance role matrix and month-end close procedure.


## Stage 17 extension — six-mode subledgers and payment route matrix

This chapter is extended by: `43-travelar-financial-control-system-commercial-rules-and-mode-subledgers.md` (finance domain, distinct mode subledgers and audit); `44-travelar-payment-routing-settlement-and-supplier-funding-models.md` (direct operator PSP, split, platform collection, GDS/OTA/supplier collection and supplier-funding routes); and `45-operator-commission-markup-and-supplier-commercial-terms-ruleset.md` (versioned per-contract commercial terms). Use those as the current design requirements. Existing worked journal entries in this chapter remain illustrative only; no commission rate, PSP fee or principal/agent conclusion is assumed by the new documents.
