# 69 — ClickPesa Collections, Payouts and Counter Operations

**Date:** 28 October 2026  
**Status:** Provider-specific integration requirements and evidence gates. Not a payment services contract or approval to process live funds.  
**Related docs:** `56`, `57`, `58`, `59`, `60`, `61`, `62`, `63`, `ADR-PAY-001`, `ADR-PAY-002`, `ADR-FIN-002`, `ADR-REG-002`.

## 1. Product selection by Travelar use case

| Use case | Candidate method | Decision rule |
|---|---|---|
| One booking at operator counter or Travelar desk | BillPay Order Control Number with `EXACT` | Preferred proof of concept only after account entitlement and amount/reference behavior are verified. Bind the provider ref to exactly one Travelar `PaymentAttempt`. |
| Assisted payment from a customer phone | USSD Push | Use only when the payment product and customer's mobile network are enabled. Verify through provider query/webhook; never treat the customer's screenshot, PIN confirmation or return page as final evidence. |
| Online card checkout | Hosted/embedded Card API path | Select after account/KYC, card brands, fee/chargeback/refund obligations and checkout security are contractually confirmed. Avoid handling PAN/CVV in Travelar. |
| In-person/open payment QR or Lipa Namba | Merchant TanQR/Lipa Namba collection | Use when its matching characteristics fit the business process. A payer-entered amount and shared static reference are not by themselves safe booking allocation keys. |
| Scheduled CRDB account collections | CRDB Direct Debit | Separate consent/mandate/subscription workflow, not the default immediate travel checkout. Confirm mandate and cancellation semantics. |
| Pay a recipient/operator to mobile money | Mobile Money Payout API | Requires beneficiary preview/validation, maker-checker controls, funds/balance check, rate-limit-aware queue and status confirmation. |
| Pay a recipient/operator to Lipa Namba/TanQR | Lipa Namba Payout API | Must be distinguished from accepting money to Travelar's own number. Preview destination/name/fee/balance first; handle asynchronous statuses. |
| Pay an operator bank account | Bank Payout API, if approved | Validate beneficiary/bank details, preview and schedule; settlement timing and rail availability must be confirmed. |

## 2. Canonical payment states

Maintain separate but linked state machines; never reduce finance to a single `paid: boolean`.

### 2.1 Collection/payment attempt

Suggested Travelar normalized states:

`CREATED` → `REQUESTED` → `PENDING_CUSTOMER` / `PROCESSING` → `RECEIVED_CONFIRMED` → optionally `MERCHANT_BALANCE_SETTLED` → terminal alternatives `FAILED`, `CANCELLED`, `EXPIRED`, `REVERSED`, `REFUNDED`, `PARTIAL_REVIEW`, `LATE_PAYMENT_REVIEW`, `UNKNOWN_REQUIRES_RECONCILIATION`.

The adapter must preserve the raw ClickPesa status and map only the statuses documented for the exact product. Current ClickPesa payment query API lists `SUCCESS`, `SETTLED`, `PROCESSING`, `PENDING`, `FAILED`. Do not interpret `SUCCESS` as proof the merchant payout to an operator completed.

### 2.2 Supplier booking and fulfillment

Booking state and payment state are related but independently authoritative:

- Payment received does not prove provider reservation exists.
- Provider reservation does not prove a ticket/voucher is issued.
- A successful payout to an operator does not prove a customer booking is ticketed.
- A provider ticket/confirmation does not prove Travelar's ledger is balanced; it must be reconciled.

### 2.3 Payout state

`DRAFT` → `VALIDATION_PENDING` → `PREVIEW_PASSED` → `AWAITING_APPROVAL` (if required) → `CREATE_REQUESTED` → `AUTHORIZED` / `PROCESSING` → `SUCCESS` or `REFUNDED` / `REVERSED` / `FAILED` / `UNKNOWN_REQUIRES_RECONCILIATION`.

For ClickPesa Lipa Namba payout docs, `AUTHORIZED` is an accepted/starting state, not settlement finality. Public generic payout statuses define `SUCCESS` as payout initiated successfully and distinguish return states. Per-rail mapping must be verified; use account statement/beneficiary confirmation or provider query where the contract supports it before marking supplier funds disbursed.

## 3. Order-specific BillPay flow

### Step A — create quote and inventory hold

1. User selects an item; backend computes an authoritative price from current supplier/contract/promotion rules and records a versioned quote.
2. Create short-lived inventory hold inside the authoritative inventory transaction system.
3. Create `Booking` in a pending-payment state and a unique `PaymentAttempt` with idempotency key, amount, currency, allowed method and explicit expiry.
4. Build provider reference using a Travelar-generated opaque, unique, non-PII `billReference`. Follow the current character/length/uniqueness restrictions; don't put names, phone numbers, email, passenger IDs or a raw booking PII summary into the reference/description.
5. Call current BillPay Order Control Number create endpoint, explicitly set `billPaymentMode: EXACT` for single-booking checkout and send amount. Save the provider ref only after a durable response; timeout after POST requires query/reconciliation, not blind second create.

### Step B — customer instructions and pending state

Show the amount, currency, supported payment channels, the generated reference/control number and Travelar booking/payment reference. Clearly state that the booking is pending until Travelar verifies payment and inventory. Give a “Check payment status” action that invokes the backend, never a direct browser-to-provider call. Do not ask the user to pay again when the attempt is still unresolved.

### Step C — receive and verify

1. Receive application webhook or query provider status from the backend.
2. Authenticate callback as currently specified by ClickPesa; validate expected provider/application identity and schema.
3. Deduplicate on provider event/payment reference and transaction identifier. Store the raw-event digest plus redacted payload/evidence.
4. Validate amount, currency, expected reference, provider account, payment attempt and finality status.
5. If webhook and query disagree, status is incomplete, callback is late or reference cannot be correlated, enter reconciliation queue. Do not issue ticket based on untrusted browser state.
6. On verified collection, transition the payment attempt and use the product-specific booking policy to continue fulfillment. If the inventory hold has expired, recheck inventory and route the payment to a resolution path. Never oversell to compensate for a late payment.

### Step D — expiry and deactivation race

- Travelar owns the booking/inventory hold deadline. ClickPesa BillPay does not replace the authoritative Travelar expiry policy.
- Current provider docs expose a PATCH operation to update a BillPay reference, and the API catalogue shows a legacy status operation separately. Confirm the exact field/operation that deactivates a reference; do not guess that changing `billAmount` or `billMaxCollectionAmount` closes it.
- On hold expiry, request reference deactivation where supported, record request/response and set local reference state. Continue querying/listening for late payment because provider deactivation and payer transaction timing may race.
- Test: payment initiated before expiry but received after; payment arrives after provider reference deactivation; deactivation API times out; duplicate `PAYMENT RECEIVED` webhook; callback comes out of order; payment is short/over amount; the same reference appears twice; payment arrives after a seat has been allocated elsewhere.

## 4. TanQR/shared Lipa Namba counter flow

1. Counter agent opens the correct business location/register and starts a POS transaction against the Travelar booking or invoice.
2. UI displays method, expected amount, the merchant's own payment QR/number and clear customer instructions.
3. Until provider offers and enables a reliable order-level reference, don't automatically allocate by matching amount + clock time + customer phone. Multiple bookings may share the same amount.
4. Payment receipt is verified with provider transaction evidence; system routes exact match to the POS transaction if reference correlation is strong. Ambiguous items go to a finance reconciliation queue with maker-checker approval.
5. Agent must not mark cash/QR received manually without a separate authorized override reason, evidence, supervisor if policy requires and audit event.
6. Print/send a receipt only after authoritative state is reached; fiscal receipt requirements are a separate TRA/regulatory capability gate.

## 5. Payout and supplier remittance operations

- Never trigger payout creation directly from every ticket sale. A payout is a controlled financial operation, usually based on a reconciled settlement batch or payable obligation.
- Preview payout first. Check beneficiary identity/name when returned, amount, currency, fee, provider balance, daily limits, rate limits and approval threshold.
- Use maker-checker: initiator and approver must differ for configured high-risk payout types/amounts. The approval record snapshots beneficiary, account, amount, fee and purpose; any change invalidates the approval.
- Enforce provider cooldown (documented one payout create every 60 seconds per merchant for mobile/Lipa Namba products) through a durable queue/token bucket keyed to ClickPesa merchant/account. Retry only after the provider cooldown, using provider query to prevent duplicate transfer.
- Record provider reference, provider raw state, ledger transaction, settlement batch, approver, preview, fees, destination and final status. Use append-only journal entries; never edit historic posted ledger rows.
- Payout fail/reversal triggers a linked accounting reversal/reinstatement of payable as appropriate, plus an exception case and notification; no silent reissue until state is verified.
- The public API references don't prove automatic marketplace split settlement or real-time remittance compliance for every rail. The commercial and legal model must decide whether to use operator-direct collection, invoice Travelar's contracted commission, or an approved platform-collection/supplier-payout flow.

## 6. Ledger treatment (illustrative, not a final accounting policy)

Use a double-entry ledger and journal at legal-entity, currency, mode/subledger, operator/supplier and channel dimensions. Examples below are conceptual; accountant approves exact accounts, taxes, gross/net presentation and recognition timing.

- **Customer payment received to Travelar-controlled merchant balance:** debit PSP clearing/receivable, credit customer funds/payable or contractually appropriate liability until allocation/fulfillment conditions are met.
- **Travelar commission earned:** recognize under contractually approved event/time; never infer commission only because a booking came through a marketplace channel.
- **Operator payable:** calculate under contract version, mode, booking channel, refund rules, commission/markup terms and levy treatment. Store calculation snapshot.
- **Payout created:** do not post final cash-out on provider `AUTHORIZED` if rail semantics say it is only accepted. Use clearing/in-transit account until final outcome. Final payout debits operator payable and credits PSP balance/clearing according to finance policy.
- **Refund / reversal:** post a compensating journal linked to original transaction; don't edit or delete the original journal. Link refund payment provider reference to original collection and booking/case.
- **Fees and FX:** capture quoted provider fee, actual provider fee, tax basis, FX rate/source and converted amount. Difference/unknown charge triggers reconciliation; never silently accrue a guessed fee.

## 7. Required operations queues

- Pending collection beyond expected window.
- Webhook authentication failure / malformed callback.
- Callback accepted but internal processing failed.
- Amount, currency or reference mismatch.
- BillPay reference deactivate failure or late payment after hold expiry.
- Payment confirmed but provider booking/fulfillment not confirmed.
- Payment duplicated, partial, overpaid, reversed or refund unresolved.
- Payout preview failure, approval pending, payout cooldown, provider rate-limit rejection, timeout, `AUTHORIZED` stale too long, refund/reversal, recipient mismatch.
- Daily payment provider statement vs payment attempts vs ledger mismatches.
- Operator payable vs payout settlement mismatch.

Every queue item needs owner, severity, SLA/deadline, retry count, correlation IDs, actions available, last attempted step and audit history. Retrying an item must be idempotent and permission-controlled.

## 8. Test matrix additions

1. EXACT amount accepted vs too low/high amount rejected by provider and mapped safely.
2. `SUCCESS` before `SETTLED`, `PROCESSING`, `PENDING`, `FAILED`; query/webhook disagreement.
3. Duplicate and out-of-order callbacks; invalid checksum; valid callback with stale reference.
4. BillPay deactivation on expiry and race acceptance tests.
5. Shared TanQR payment with same amount for multiple bookings; ambiguous flow must not auto-allocate.
6. Payout preview beneficiary mismatch; insufficient balance; fee changes between preview/create; cooldown throttling; timeout after create; delayed final state; reversal/refund.
7. Maker-checker separation and approval invalidation on amount/beneficiary edits.
8. Duplicate idempotency key and safe create recovery.
9. PSP statement missing, late settlement and ledger reconciliation.
10. No automated test touches the real provider endpoint; live test requires human-authored change approval and protected secret access.

## 9. Provider commercial and compliance questions

Obtain written confirmation of exact product access, fee table/taxes, settlement timing, control-number state/deactivation/expiry, refund APIs by method, marketplace/split settlement, merchant-of-record responsibilities, payout finality, API rate limit/volume alternatives, webhook checksum/retry guarantees, KYC thresholds, data-processing and support/escalation terms. Legal and finance must separately determine LATRA/Bank of Tanzania/TRA consequences for each funds flow and customer/merchant arrangement.
