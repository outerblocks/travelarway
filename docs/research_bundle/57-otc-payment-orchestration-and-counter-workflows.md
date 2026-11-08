# 57 — Travelar OTC Payment Orchestration and Counter Workflows

**Research date:** 24 October 2026  
**Purpose:** Define data-driven over-the-counter (OTC) payment journeys for OIMS branches, Travelar agents, operator agents, and HIMS/OIMS call centers.

## 1. OTC means assisted sale, not necessarily cash

An OTC sale is created by a cashier, branch clerk, agent or call-centre worker. Its payment method must be selected from the active configuration for the country, legal entity, mode, operator, branch, channel, merchant account, provider capabilities, amount range and applicable regulation. Never hard-code a single payment method into the POS.

For Tanzania, design for electronic methods including mobile-money USSD Push, BillPay order control numbers, TIPS TANQR/Lipa Namba, supported bank/CRDB channels and cards when eligible and configured. Do not treat the availability of a cash drawer as proof that cash is legally permitted for a covered transaction. Counsel must determine application of GN No. 158C, including transitional treatment, and encode an effective-dated rule after advice.

## 2. Recommended default method by user situation

| Counter/call-center situation | First method to offer when supported | Reason / caution |
|---|---|---|
| Passenger has phone/mobile wallet and wants assisted payment | USSD Push | Creates a payment attempt tied to the sale; passenger authorizes on own device. |
| Passenger wants to use USSD/banking menu at their convenience | BillPay Order Control Number | Unique sale reference and configured exact amount support reconciliation. Display/send the number and payment instructions. |
| Physical branch accepts QR/merchant-code payments | TANQR/Lipa Namba only where sale matching is proven | General merchant Lipa Namba permits payer-entered amount; for exact order QR ask provider about dynamic/amount-bound QR and transaction references. |
| Customer has a supported bank/card checkout path | Provider hosted checkout/card or approved bank collection | Ensure amount and order are bound; do not trust return URL alone. |
| Supplier/operator has own eligible PSP | Operator-owned PSP path | Travelar records the outcome and commission contract but cannot automatically deduct a commission without a split arrangement or separate collection/invoice method. |
| Payment method or provider unavailable | Offer another permitted, configured method or record a recoverable exception | Never mark paid manually to bypass payment integration. Any exceptional manual approval must use a documented, auditable, legally permissible process. |

## 3. Standard sale state machine

1. **Draft sale:** authenticated actor/portal/tenant/branch established server-side; source channel is assigned by the system, not trusted from a browser field.
2. **Quote:** fetch current route/sailing/product inventory and current pricing rules; create quote/price snapshot; record mode, product, operator, branch, source channel, commission policy version and permitted payment methods.
3. **Inventory hold or supplier reservation:** transactional hold with a configured TTL; inventory correctness remains in PostgreSQL/authoritative supplier inventory. Redis may assist but cannot be the sole source of truth.
4. **Order/booking pending payment:** issue internal sale/order ID; create a payment intent and a unique provider order reference. Do not create a ticket as though paid.
5. **Select method:** backend validates chosen method against the published capability policy; frontend shows only available methods returned by the API.
6. **Create provider payment:** use USSD Push, an exact BillPay order control number, hosted checkout, or a contract-approved Lipa Namba route. Create only once per payment attempt; use Travelar idempotency key and a stable provider order reference.
7. **Await outcome:** receive application webhook, validate its checksum if supplied/contractually required, persist the raw/sanitized event, acknowledge receipt, then process idempotently. Query the provider on uncertainty or delayed/missing webhooks.
8. **Verify:** compare provider account/application, order reference, payment reference, status, collected amount, currency, and the immutable expected amount/order. A successful payment for the wrong amount/order is an exception, not a successful booking.
9. **Complete sale:** when the customer funds are provider-confirmed and supplier/operator booking/inventory state is valid, write the correct ledger entries and issue ticket/receipt. Ticket printing failure can be recovered without charging again.
10. **Close shift:** reconcile POS orders, payment references, provider reports, receipts, refunds and cash only if a cash method is legally enabled for that transaction. Operator and Travelar channels remain separately reported.

## 4. Payment pending beyond the inventory hold

Payment rails can confirm asynchronously. A BillPay control number may remain payable after an internal hold expires unless a provider-specific close operation is supported and succeeds; the public API schema reviewed did not show an `expiresAt` field on the create-order call. Required behavior:

- Store `inventory_hold_expires_at` and provider control-number status separately.
- If the hold expires while the payment is pending, release/expire the hold according to the inventory engine, and make a best-effort provider control-number closure only through a documented endpoint and response.
- If a payment arrives later, do not issue a ticket using stale/expired inventory. Put the payment and booking in `LATE_PAYMENT_REVIEW`, re-query inventory, and resolve through an approved rebooking or refund process.
- If the customer paid but inventory is gone, do not silently move them to a different service/time/seat. Obtain the required customer approval or apply the contracted refund process.
- If payment is pending or status query times out, keep it pending/unknown and keep retrying queries with bounded backoff; never map uncertainty to `FAILED` or `PAID` by assumption.

## 5. Unique order control number vs merchant Lipa Namba

**Default for an individual bus/ferry ticket:** use an order-specific BillPay control number in exact-payment mode if ClickPesa account approval and current contracts confirm it. Store one internal payment intent per attempt. Keep references opaque, unique within the provider's account and no longer than the provider's documented limit. Never put names, passport numbers or phone numbers into a public control-number string.

**Customer control number:** use for recurring accounts or business relationships where multiple payments may accrue to a customer account. It is not the default for immediate seat-level sales because it can receive repeated payments. If it must be used, every payment event still needs to be allocated to the intended invoice/order under explicit rules; the reusable number alone is not ticket proof.

**Static TANQR/Lipa Namba:** use for general merchant collection only when POS-to-payment matching can be demonstrated. Since the payer enters the amount in ClickPesa's documented generic flow, the UI must not simply trust “a payment with the right approximate amount” as proof. Matching may require exact amount, transaction reference/provider transaction ID and controlled payment window. If the provider cannot supply sufficient reference metadata or dynamic amount-specific QR, prefer order control numbers or USSD Push for ticket sales.

## 6. Booking source and commission attribution

Capture separate immutable fields:

- `origin_channel`: e.g. `TRAVELAR_B2C_WEB`, `TRAVELAR_APP`, `TRAVELAR_AGENT`, `TRAVELAR_CALL_CENTER`, `OPERATOR_POS_OTC`, `OPERATOR_AGENT`, `OPERATOR_CALL_CENTER`, `OPERATOR_WHITE_LABEL`, `PARTNER_API`.
- `origin_actor_id` and role, `tenant/operator_id`, `branch_id`, `agent_agreement_id`, `white_label_client_id` and `campaign/referral` where applicable.
- `payment_collector_type`, `payment_provider`, `merchant_account_id` and the provider contract/capability version.
- `commission_policy_id/version`, `supplier contract version`, `currency`, immutable quote/price snapshot and `created_at`.

The portal/client credential and authenticated actor determine permitted source values. Never allow a public frontend to choose `TRAVELAR_CALL_CENTER` or claim a commissionable source by submitting a string. The system derives it from the authenticated HIMS call-center session and its permitted workflow. Use separate verified attribution fields for the true acting channel vs payment collection route.

The proposed policy that operator-originated OTC or operator-agent tickets may have zero Travelar commission is a configurable commercial rule, not a universal technical fact. Activate only where the operator's signed agreement states that treatment. The same route/service might have different policy for marketplace, white-label, agent and call-center distribution.

## 7. POS receipts and tickets are different records

A payment receipt evidences the payment attempt/outcome. A travel ticket evidences a confirmed booking/transport right. Maintain them separately even when they print together. A thermal receipt may show order ID, paid amount, payment method, provider reference, cashier/branch and paid time. Ticket issuance must be triggered by trusted backend state, not by printing, cashier UI animation, callback URL or screenshot. Reprinting is an audited read operation, not a new sale.

## 8. Refunds and voids

The reviewed ClickPesa public docs establish payout/reversal status APIs but do not clearly establish a universal refund-to-original-tender endpoint across all collection methods. Do not treat a payout to a mobile wallet as automatically equivalent to a payment refund. Refund workflow must record original tender/provider, reason, approver, obligation, destination, amount, status, fees and reconciliation. Query provider support and legal/accounting treatment before allowing refund-to-wallet or refund-to-bank when the original payment was through another route.

## Sources

- https://docs.clickpesa.com/payment-api/mobile-money-payment-api/mobile-money-payment-api-overview
- https://docs.clickpesa.com/bill-pay/bill-pay-overview
- https://docs.clickpesa.com/bill-pay/billpay-api-overview
- https://docs.clickpesa.com/tan-qr/tan-qr-overview
- https://docs.clickpesa.com/home/webhooks
- https://docs.clickpesa.com/api-reference/collection/querying-for-payments/querying-for-payments
- https://docs.clickpesa.com/home/sandbox-and-testing-environment
- https://www.latra.go.tz/news/safari-tiketi-enhances-travel-assurance
- https://www.velmalaw.co.tz/news/mandatory-electronic-payments-for-specified-transactions-tanzania-2026/
