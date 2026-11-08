# 63 — ClickPesa Payment/Payout Adapter Acceptance Matrix

**Version:** v0.2 · **Date:** 26 October 2026  
**Purpose:** CI/mock acceptance tests and controlled-live-test plan for the Travelar adapter. Do not run live tests against ClickPesa without prior human authorization. ClickPesa documents no sandbox.

Legend: **M** = mock/CI test; **C** = contract test against captured/synthetic provider fixtures; **L** = live test requiring explicit approval and low-value controlled transaction. CI must never execute an L test.

## A. Reference creation and BillPay behavior

| ID | Test | Expected result | Type |
|---|---|---|---|
| CP-001 | Create exact BillPay order reference for a valid booking total | `EXACT` and server-computed amount sent; generated number stored against one internal payment attempt | M/C |
| CP-002 | BillPay request without explicit `billPaymentMode` | Adapter rejects it before provider call; no reliance on provider's partial/overpayment default | M |
| CP-003 | Generate duplicate `billReference` | Map documented duplicate/409 to known conflict; query known reference instead of blindly generating a replacement | M/C |
| CP-004 | Network timeout after create request | Mark outcome unknown; query reference before any repeat create; no duplicate charge/reference | M/C |
| CP-005 | Booking hold expires while BillPay reference remains unpaid | Invoke deactivation if capability is verified; record local closure state and provider response separately | M/C/L |
| CP-006 | Payment arrives concurrently with deactivation | No duplicate ticket; transaction goes through inventory/payment reconciliation and, if seat has expired/unavailable, `LATE_PAYMENT_REVIEW` | M/C/L |
| CP-007 | Provider says `INACTIVE`, customer still has an old instruction | UI tells customer payment request is closed; any later event is quarantined for reconciliation, not auto-fulfilled | M/C/L |
| CP-008 | Provider allows only one payment against order control number | One successful partial payment does not leave a usable outstanding balance; no instalment assumption | M/C |
| CP-009 | Amount different from expected with BillPay `EXACT` | Do not fulfill; move to exception/refund review based on actual provider result; obtain confirmed exact-mode behavior before enabling | M/C/L |
| CP-010 | BillPay reference maximum length and character rules | Adapter enforces confirmed provider limit and safe character set before sending | M/C |

## B. USSD Push/card/QR

| ID | Test | Expected result | Type |
|---|---|---|---|
| CP-011 | USSD Push preview fails due to invalid phone/unsupported channel | Do not initiate; return normalized actionable failure | M/C |
| CP-012 | USSD push initiated but no callback arrives | Keep pending/unknown; scheduled query retrieves state; never treat initiation as payment | M/C |
| CP-013 | Duplicate USSD order reference | Detect provider conflict; query existing attempt before any new reference is created | M/C |
| CP-014 | Customer returns to web success URL without provider success | Booking stays pending until trusted status confirmed | M |
| CP-015 | Card hosted session returns to return URL but provider says `PENDING` | No ticket; continue query/webhook state machine | M/C |
| CP-016 | Static TanQR payment has matching amount but no unique sale reference | Do not allocate automatically based on amount alone; move to reconciliation exception | M |
| CP-017 | Static TanQR method unavailable before KYC | Do not offer it; method list is driven by approved, effective provider capability configuration | M/C |

## C. Status mapping and webhook security

| ID | Test | Expected result | Type |
|---|---|---|---|
| CP-018 | `PAYMENT RECEIVED` payload with valid checksum | Event is durably recorded, verified and processed idempotently | M/C |
| CP-019 | Webhook checksum missing when checksum is required by contract | Reject/quarantine; no payment or payout state change | M/C |
| CP-020 | Incorrect HMAC checksum | Reject/quarantine and raise security telemetry; no ticket issuance | M/C |
| CP-021 | Same webhook sent twice | Ledger posts and ticket issuance occur at most once | M |
| CP-022 | `PENDING` arrives after a previously verified `SUCCESS` | Do not regress state; retain event for audit, query provider if contradictory | M |
| CP-023 | Validly signed event has wrong order reference | Do not map to expected booking; discrepancy queue | M/C |
| CP-024 | Correct reference but amount differs from quote | No ticket; mismatch exception and refund/recovery workflow | M/C |
| CP-025 | Correct amount but wrong currency | No ticket; mismatch exception | M/C |
| CP-026 | `SUCCESS` received but settlement is not yet complete | Set `payment_received_unsettled`; keep settlement/accounting state separate; apply documented fulfillment policy | M/C |
| CP-027 | `SETTLED` appears after `SUCCESS` | Record merchant balance settlement once; do not double-book gross receipts | M/C |
| CP-028 | `REFUNDED` after a failed/abandoned attempt | Record returned customer funds and original tender; no phantom revenue | M/C |
| CP-029 | `REVERSED` after funds had been received/settled | Append compensating ledger journal; launch authorized booking/customer-resolution workflow | M/C |
| CP-030 | Provider returns an unknown future status enum | Map to `unknown`, preserve raw state, alert and avoid fulfillment/payout automation | M/C |
| CP-031 | Webhook event is delayed or never delivered | Reconciliation query finds it and repairs status idempotently | M/C |
| CP-032 | Provider sends different events out of order | State machine is monotonic where appropriate; query authoritative provider status on ambiguity | M/C |

## D. Fee calculation and ledger

| ID | Test | Expected result | Type |
|---|---|---|---|
| CP-033 | Provider fee returned by preview differs from cached public tariff | Display/apply currently authorized response/contract rule, preserve tariff version; do not silently use hard-coded fee | M/C |
| CP-034 | Fee payer is customer versus merchant | Checkout total and ledger postings follow explicitly approved provider/market policy; no unapproved passenger surcharge | M/C |
| CP-035 | Public pricing page and BillPay API article differ | Mark tariff as unresolved, prevent production rate activation until signed quote is loaded | M |
| CP-036 | Payment collection success plus separate merchant balance settlement | Separate journals/clearing accounts record gross collection, fees and settlement movement once | M |
| CP-037 | Payout fee deducted from source balance | Record the fee separately from operator principal; reconcile to provider payout response/statement | M/C |
| CP-038 | Refund/reversal includes fee retained or returned differently | Reconcile provider fee behavior and append corresponding adjustment journal, do not assume fee refund | M/C |

## E. Payout lifecycle

| ID | Test | Expected result | Type |
|---|---|---|---|
| CP-039 | Payout preview returns fee, balance impact and estimated arrival | Require preview/approval according to configured control policy before create | M/C |
| CP-040 | Create payout returns `AUTHORIZED` | Treat as accepted/in-process, not completed or remitted to operator | M/C |
| CP-041 | Lipa Namba payout returns `AUTHORIZED`, later `SUCCESS` | Notify accepted separately from terminal provider-reported outcome; keep finality caveat until contract confirms credit evidence | M/C/L |
| CP-042 | Payout `REFUNDED` or `REVERSED` | Restore/adjust clearing and payable balances with compensating journal; open exception | M/C |
| CP-043 | Network timeout after payout create | Query stable order reference; do not submit a second payout blindly | M/C |
| CP-044 | Multiple payout requests are queued under one-per-60-second limit | Merchant-level rate limiter serializes requests and captures SLA/queue time; no duplicate creates | M |
| CP-045 | Payout API result says `SUCCESS` but not confirmed beneficiary-credit semantics | Store `provider_reported_success`; do not claim `recipient_credit_confirmed` without the provider-confirmed criterion | M/C |
| CP-046 | Beneficiary name lookup unavailable | Require local operator bank/wallet verification procedure and maker-checker approval; do not invent name match | M/C |
| CP-047 | Operator payable is more than available provider balance | Block payout create and escalate; never generate a negative or hidden balance to appear compliant | M |
| CP-048 | Operator-specific payout queue spans multiple tenants | Enforce tenant, operator, authorized beneficiary and maker-checker constraints server-side | M |

## F. Reconciliation, tenant isolation and operational controls

| ID | Test | Expected result | Type |
|---|---|---|---|
| CP-049 | Daily provider collection export/query versus Travelar ledger | Every transaction reconciles by provider/account/reference/amount/currency/fee/status or is in an exception queue | M/C |
| CP-050 | Provider payout report vs operator payable ledger | Every payout, fee, reversal and unmatched payable is reconciled; no silent deletion | M/C |
| CP-051 | Webhook arrives with valid signature for a different merchant/application | Reject tenant/account mapping mismatch; no cross-tenant state change | M/C |
| CP-052 | Token is near expiry | Reuse cached token until appropriate expiry window; refresh securely; no token generation per request | M/C |
| CP-053 | Provider API rate limit / 429 / temporary 5xx | Bounded backoff, jitter, query before create retry, alert on backlog; no duplicate money movement | M/C |
| CP-054 | Live transaction test | Only a human-approved, documented low-value test after KYC/activation; reconcile charge, fee, settlement, ticket and refund path | L |
| CP-055 | Production data in CI logs or fixtures | Block secrets and real PII; redact/mask phone numbers, card-related data and beneficiary details | M |
| CP-056 | Fiscal receipt and ticket issuance are both requested | Separate their state machines and references; neither silently substitutes for payment status or provider payout status | M |

## G. Definition of done for the ClickPesa adapter

The adapter cannot be called production-ready until all of the following are evidenced:

- [ ] Current API schemas and status mappings pinned to a dated provider specification/version.
- [ ] Provider contract signed; fees, fee payer, refunds/reversals, limits and settlement obligations understood.
- [ ] BillPay exact amount, no automatic expiry, deactivation and in-flight race behavior tested/confirmed.
- [ ] Signed webhook sample received and checksum verification passed, including invalid checksum and duplicate/out-of-order tests.
- [ ] Query fallback and daily reconciliation work when callbacks are delayed or absent.
- [ ] Payment collection vs merchant balance settlement vs ticket issuance vs fiscal receipt vs operator payout are distinct.
- [ ] Payout finality, per-merchant rate limit, beneficiary verification and batch path are confirmed.
- [ ] Mock/contract CI has zero live network dependency; live tests require an explicit controlled plan.
- [ ] Marketplace/direct operator collection/split-settlement model has provider evidence and legal/regulatory approval where required.
- [ ] Security review, tenant-isolation review, operational runbook and customer late-payment/refund process approved.
