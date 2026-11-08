# 60 — ClickPesa OTC Acceptance Tests and Build Order

**Research date:** 24 October 2026  
**Rule:** because ClickPesa documents no sandbox, all initial testing must use mocks/synthetic fixtures. A live-money pilot requires explicit human approval, approved merchant/KYC, a provider-agreed test plan and a strictly limited amount.

## 1. Build order

1. **Payment abstractions and persistence:** payment intent, attempt, provider event inbox, reconciliation row, payout batch/line and versioned merchant payment-policy records. No live endpoint calls.
2. **Local simulator/provider contract tests:** deterministic fake responses for all ClickPesa documented status and webhook variations; assert signatures/checksums, idempotency, amount/currency/order matching and reprocessing.
3. **BillPay adapter:** create order control number; save provider ref; verify exact/partial modes; query payment and control-number details; update/close status where provider supports it; exception on late payment.
4. **USSD Push adapter:** preview, initiate only on explicit cashier/customer action, status query and callbacks; do not reinitiate when a previous result is ambiguous.
5. **Lipa Namba/TanQR:** separate merchant collection configuration from order-control-number logic. Prove how each inbound transaction maps to a specific POS order before using it to release a ticket. Test amount mismatch, no note/reference, same amount repeated, late callback and payer number different from customer record.
6. **POS workflows:** booking/inventory hold; choose enabled method from API; display/print payment instructions; show pending state; verify on backend; issue receipt and ticket only after correct final conditions; reprint separately without issuing a duplicate ticket.
7. **Finance and reconciliation:** match query/API events to payments, PSP statements/exports, settlement statements, bank movements, operator commissions and payout lines; unresolved items land in owned queues.
8. **Scheduled supplier/agent payouts:** eligibility calculation, maker/checker approval, balance/fee preview, beneficiary confirmation, create payout, poll/webhook to terminal state, handle `AUTHORIZED`, `FAILED`, `REFUNDED`, `REVERSED`, unknown, rate limit and retries. No retry by creating another payout unless original status is resolved.
9. **Controlled live pilot:** after vendor/KYC/legal gates; small staff-approved transactions; no real passenger bookings or customer personal data; create, pay, receive webhook, query, statement reconciliation and any reversal exercise only as agreed with ClickPesa. Record evidence and disable test merchant/path afterward if necessary.

## 2. Required automated tests

### BillPay/USSD collection
- exact amount paid correctly -> one payment is recorded, one ledger posting, ticket issue once only when booking valid;
- underpayment, overpayment, partial payment and multi-payment control number behavior -> no ticket until required amount and policy satisfied;
- duplicate webhook delivered multiple times -> one payment transition and one journal posting;
- webhook absent but query reports success -> reconciliation closes the loop without duplicate issue;
- forged checksum, missing checksum where policy requires one, wrong order reference, wrong amount, wrong currency, wrong provider account -> no payment success;
- success event from a different provider account or old test merchant -> rejected;
- repeated API timeout after provider accepted request -> query the original reference before creating any new payment;
- payment first shows pending/processing then success -> legal state transition; never classify unknown as failed;
- BillPay duplicate `billReference` -> safe recover/query rather than creating a new unmatched bill;
- control number still collects after booking-hold expiry -> `LATE_PAYMENT_REVIEW`, no stale ticket, approved refund/rebooking process.

### TANQR/Lipa Namba
- customer enters exact quote amount and matching transaction has a reliable reference -> normal matching process;
- amount mismatch, same amount for two orders, no unambiguous provider reference, unmatched payment or manual merchant QR -> exception; no automatic ticket issuance;
- merchant collection and Lipa Namba payout are never confused;
- fees are recorded as actual provider fee, not assumed from a fixed percentage.

### Payouts
- `AUTHORIZED` means pending/accepted, not paid to beneficiary;
- status query shows `SUCCESS` -> close payout only after amount, beneficiary, currency and reference match; reconcile bank/beneficiary evidence at the applicable level;
- `FAILED`, `REFUNDED` or `REVERSED` -> restore payable/available balance through explicit ledger entry and exception if fees are retained;
- timeouts, repeated callbacks, duplicate references, low available balance and the documented 60-second create-request throttle -> no double payout, correct retry schedule;
- maker cannot approve their own payout/beneficiary change; limits and step-up authentication enforced server-side.

### Multi-tenant and channel isolation
- operator A cannot read or act on operator B's payment, control number, bookings, agent wallet, branch sales, receipts or manifests;
- operator POS sale source is derived from authenticated OIMS tenant+branch, and commission follows the signed effective-dated operator policy;
- HIMS call-center booking source is derived from HIMS session and role; a user cannot change it through a request payload;
- Travelar agent/ subagent source and incentives reconcile independently from the operator's own agent channel;
- white-label bookings preserve tenant/domain, actual merchant of record, supplier contract and commercial policy version.

### Finance completeness
- each journal balances; duplicate event cannot post twice; posted journal is not edited/deleted;
- PSP fees, bank fees, FX, partial payments, refunds and payouts all map to the correct mode subledger and general ledger;
- daily reconciliation detects missing webhooks, unmatched provider transactions, unmatched bank statement lines, incorrect net settlement and unresolved balances;
- payment is not treated as supplier settlement; a supplier payable is not treated as a payout; an issued ticket does not imply provider settlement reached the bank.

## 3. Go/no-go evidence checklist

No production ClickPesa activation until all are evidenced:
- ClickPesa account for OuterBlocks Destinations Limited passed KYC and each needed channel is enabled in writing;
- fees/pricing and surcharge/disclosure rules signed off by Finance/legal;
- payment and payout callbacks, checksum contract, provider status and settlement API expectations verified against current docs and small approved pilot;
- no sandbox risk is controlled through mock tests and a formal live-test plan;
- split settlement status is explicitly known; if unavailable, use separately contracted direct-operator collection/commission invoicing or an approved Travelar-collection route, not an assumed split;
- OTC payment methods comply with legal interpretation of GN No. 158C and are tested from counter to ledger/reconciliation;
- LATRA/TRA and ticket/receipt authorization gates have been satisfied for the applicable modes;
- incident owner, provider escalation contact, settlement schedule, reconciliation owner and payout approvers are operational.
