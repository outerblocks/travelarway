# 43 — Travelar Financial Control System, Mode Subledgers and Audit

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Research date:** 24 October 2026  
**Status:** Proposed architecture and business requirements; requires accountant, tax adviser, legal counsel and provider/partner confirmation before production. It is not a legal opinion, tax opinion, signed provider design or final chart of accounts.

## 1. Executive decision

Travelar should build a **financial control system** shared by the public booking platform, HIMS and OIMS, not a small finance screen bolted onto the product. The system must track each customer charge, payment attempt, commission, allowed markup, supplier obligation, refund, chargeback, PSP fee, FX conversion, settlement, payout and accounting journal from origin through final reconciliation.

Six travel modes are first-class and separately reportable: `BUS`, `FERRY`, `FLIGHT`, `STAY`, `TRAIN`, and `EXPERIENCE`. Each event, ledger line, report and authorization decision must retain the mode dimension. Bus and ferry operator systems remain distinct, even if some business rules are implemented by common libraries.

**Do not confuse mode-level accounting separation with six separate legal companies or six separate bank accounts.** Unless OuterBlocks establishes separate legal entities, use a single company General Ledger (GL) with independently reconciled subledgers, mode/country/operator cost and revenue dimensions, and mode-specific reports. Separate bank/PSP settlement accounts or segregated provider subaccounts should be used where contracts, legal advice, provider capabilities or sound control require them. The accountant and counsel must decide whether additional legal books or formally segregated funds are required.

## 2. Non-negotiable principles

1. **Every amount has an owner and a basis.** Record the legal entity, mode, operator/supplier, contract, booking, currency, payment route, PSP, customer/supplier role, and whether funds are actual cash, a receivable, or a liability. An app balance is not itself money held by a PSP or bank.
2. **A booking is not a payment, and a payment is not a payout.** Booking status, payment attempt status, supplier confirmation/ticketing status, refund status, and payout status are independent linked state machines.
3. **Posted journals are immutable.** Corrections use approved reversals and adjustments referencing the original. No direct edits or deletes of posted journal entries.
4. **Double-entry accounting.** Every posted journal balances per currency and book. Cross-currency conversions use explicit clearing accounts and approved rate source/time; do not sum unlike currencies without a documented translation policy.
5. **Subledgers tie to the GL.** Operator payable, commission, payment, refund, payout and settlement details reconcile to the GL by currency, date and mode. Exceptions must be visible and aged, never manually hidden by overwriting balances.
6. **A provider acceptance response is not proof of settlement.** Persist initiation, provider reference, final/queried status, settlement date, bank reference and reconciliation result separately.
7. **Commercial rules are contract-driven.** Per-operator commissions, supplier net prices, markups, discounts, payment responsibilities, refund treatment, and payout schedules are versioned and effective-dated. Do not hard-code a global percentage or assume a mode's contracts are identical.
8. **Historical calculations are snapshots.** Store the exact rule/contract version and calculation breakdown applied at sale time. Later price/commission edits must not silently rewrite existing bookings or journal lines.
9. **Separate money handling from accounting.** A split-settlement product or direct operator payment route is a payment-provider arrangement; Travelar's ledger records instructions and evidence but cannot make the PSP or bank route funds in a way its product/contract does not support.
10. **No unauthorized custody.** If Travelar collects money for unrelated operators or pays suppliers from its own merchant settlement, launch only after the legal, PSP/acquirer, contractual, tax, and operational model is approved in writing. The National Payment Systems Act states that operating a payment system requires a Bank of Tanzania licence; counsel must determine how the contemplated Travelar arrangement is classified and what approvals/structure apply. Do not infer that all marketplace collection is automatically prohibited or automatically exempt.

## 3. Finance services and ownership boundaries

Implement a finance domain with explicit application services and APIs. These may initially live in the proposed modular monolith; do not create microservices without an operational reason.

- **Commercial Agreement Registry:** operator/supplier identity, agreement and version, allowed sales role, commission/markup terms, currencies, settlement model, refund terms, start/end dates and approval evidence.
- **Pricing and Earnings Engine:** computes customer payable, supplier amount, commission, markup, permitted fees, applicable taxes and discount funding; returns an itemized explainable calculation.
- **Payment Orchestrator:** selects the legally and contractually approved customer pay-in route for a booking, invokes a provider adapter, tracks payment attempts and verifies final status.
- **Provider Adapter Registry:** PSP and supplier-specific collection, payout, refund, transaction-query and settlement capabilities; provider-specific raw state must be preserved alongside normalized state.
- **Financial Event Ledger:** durable, append-only business events with idempotency and source references.
- **Double-entry Posting Engine:** converts approved financial events into balanced journals under the accountant-approved accounting policy.
- **Mode and Tenant Subledgers:** detailed balances for each mode, operator/supplier, PSP, contract and currency.
- **Supplier Payables and Settlement:** amounts due to each supplier, eligibility date, deductions authorized by contract, settlement batch, payout attempt and residual balance.
- **Refunds, Disputes and Chargebacks:** requested, approved, submitted, completed/failed, reversed, disputed, evidence and liability allocation.
- **Bank/PSP Reconciliation:** matches business events to provider transactions, provider settlement reports, bank statements and supplier statements.
- **Finance Reporting:** daily liquidity and outstanding obligations, revenue and margin by mode, PSP fees, supplier/commission position, refunds, pending items, payout status, ageing and closing packs.
- **Financial Audit & Controls:** role-specific access, maker/checker approval, period closing, exception logs and downloadable evidence packages.

OIMS, HIMS and customer checkout use controlled finance APIs rather than writing accounting records directly. Operator OIMS users must only see their own operator's financial events, commissions and payouts. A bus operator must not see a different bus operator's information; bus and ferry data are separated by mode and authorization policy. Travelar Finance sees the permitted consolidated view; Internal Audit is read-only and independently scoped. Supplier/partner portals expose only agreed information.

## 4. Mode-level reporting and the meaning of 'separate accounting'

All six modes must have separate subledgers, reconciliation queues, dashboards, revenue/expense dimensions and management reports, while posting into the approved legal-entity GL.

For each mode, report at least:

- gross booking value (GBV), clearly distinguished from recognized Travelar revenue;
- captured/confirmed payment value, payment attempts by `successful`, `failed`, `pending`, `unknown`, `reversed`, `partially refunded`, `refunded`, `disputed` and `charged back`;
- commission earned, accrued but not yet earned, collected, invoiced, overdue and reversed;
- gross customer price, supplier net amount, contractually permitted markup/service fee, discount, tax, PSP fee, payout fee, FX and contribution margin;
- operator/supplier payable, customer refund liability, PSP clearing/receivable, provider reserves/holds, payouts initiated/confirmed/failed and outstanding supplier balances;
- booking-to-ticket/fulfilment reconciliation, cancellations, no-shows, partial journeys, amendments and refunds;
- reconciliation differences by age and severity, with named owner and target resolution date;
- daily, weekly and period-close totals in transaction currency and settlement currency.

Financial grouping should allow these dimensions without combining balances incorrectly:
`legal_entity`, `country`, `mode`, `operator_or_supplier`, `branch`, `contract_version`, `route/product`, `booking_id`, `payment_attempt_id`, `psp`, `settlement_batch`, `payout_id`, `currency`, `accounting_period`, `channel`, `tax_code`, and `funding_party`.

Mode-specific reports may be separate, but consolidated statements must reconcile to the full GL. Do not call six dashboards six separate legal accounting entities.

## 5. Operator/supplier-specific fee and commission configuration

Each operator or supplier agreement must specify, at minimum:

- contracting legal entities and whether each party is principal, agent, supplier, marketplace, payment merchant or technical intermediary for the specific service;
- applicable mode, market/country, route/product/segment or property/activity scope;
- currency and eligible price base, including whether commission excludes taxes, levies, customer service fees, discounts, ancillaries, refunds or other components;
- commission rule type: percentage, fixed amount, tiered/volume-based, per passenger, per ticket, per segment or another approved method;
- permitted markup rule if applicable: percentage or fixed amount against a defined supplier/net base, caps/floors, rounding, taxes and required disclosure;
- whether Travelar may discount and who funds the discount; whether the operator/supplier must approve campaign changes;
- commission earning event (e.g. confirmed paid booking, ticket issuance, departure/fulfilment, or another contractually approved event);
- refunds, cancellations, no-shows, changes, chargebacks, partial usage, commission reversals and refund of PSP fees;
- payment route: direct operator PSP, PSP split settlement, supplier/OTA collects, Travelar collects under approved arrangement, offline/onsite payment, or approved invoice/remittance;
- merchant of record/customer invoice identity, supplier invoice/receipt evidence, payout schedule, reserve/holdback if contracted, minimum threshold, payout method/currency and beneficiary verification;
- data/evidence sources, effective dates, agreement document/version, approval chain and review/expiry date.

A rule is not production-eligible until its contract evidence and the applicable finance/legal approval are recorded. A default can propose a rate for an unconfigured supplier in the admin interface, but it must **not** silently charge or book commission. At sale time, snapshot the contract and calculated price components on the booking/order.

### Commission is not markup

**Commission:** a contracted share or fee earned from arranging a supplier's sale. Whether it is deducted from the operator's collected fare or invoiced separately depends on the agreement and payment route.

**Markup:** a permitted difference between a supplier/net price and the price charged to the customer, where the commercial agreement and law allow Travelar to price this way. A markup must not be assumed to be allowed just because the API returns a price or because Travelar has access to booking endpoints.

Do not label an unapproved customer fee as a 'markup' to avoid commission, tax, price-transparency, or payment-provider restrictions. Price rules require explicit customer-facing breakdowns where applicable and accountant/legal confirmation of accounting and tax treatment.

## 6. Revenue recognition: principal versus agent

The mode alone does not decide whether Travelar recognizes gross customer consideration or only its commission/net fee. Under IFRS 15, the analysis asks what specified service Travelar promises and whether it controls that service before transfer; indicators include primary responsibility for fulfilment, inventory risk and price discretion. These indicators support, but do not replace, the control analysis. The accounting adviser must assess the actual customer and supplier contracts separately, especially where Travelar sets retail pricing, guarantees service, holds cancellation/refund risk or sells on a net-rate model.

The dashboard must display GBV separately from recognized revenue to avoid treating the entire ticket or hotel price as OuterBlocks' earned revenue by default.

## 7. Payout and refund authority

Use maker/checker controls for first-time beneficiaries, high-value payouts, bank-account changes, bulk payouts, manual journals, commission overrides, refunds above thresholds and period reopenings. The person who creates a payout batch must not be its sole approver. Beneficiary changes require independent verification through a trusted channel, not just an email reply.

A payout state machine should include `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `SUBMITTED`, `PROVIDER_ACCEPTED`, `SETTLED_CONFIRMED`, `FAILED`, `UNKNOWN_NEEDS_RECONCILIATION`, `CANCELLED` and `REVERSED` where the provider supports the state. Provider-specific responses are kept intact. A network timeout after submission is `UNKNOWN_NEEDS_RECONCILIATION`, not automatic failure: query using the stable provider reference before retrying to prevent a duplicate payment.

Refunds should track `REQUESTED`, `ELIGIBILITY_CHECKED`, `PENDING_APPROVAL`, `SUBMITTED`, `PROVIDER_ACCEPTED`, `REFUNDED_CONFIRMED`, `FAILED`, `PARTIALLY_REFUNDED`, and `UNKNOWN_NEEDS_RECONCILIATION` as applicable. A provider's API accepting a refund request does not mean the customer has received the money. Preserve evidence of actual provider/bank completion and disclose the status accurately.

No operator can receive a payout above its reconciled payable less approved holds, valid refunds, chargebacks and contractually authorized deductions. Negative payables require documented recourse or an agreed recovery process, not silent cross-subsidization from another mode or operator.

## 8. Audit, segregation of duties and period close

Audit requirements:

- Every manual finance action records actor, effective identity, timestamp, before/after values, reason, approval, source page/API, linked event and journal.
- Separate roles for pricing/commission setup, payout preparation, payout approval, finance posting, reconciliation resolution, period closing, audit and production administration.
- No operator can alter global commission rules, edit posted finance records, approve their own beneficiary changes or see competitor/operator records.
- All posted journals carry source event, currency, mode and booking/provider references. Corrections are reversals and adjustments, not data erasure.
- Daily reconciliation evidence records source file/query timestamp, totals, matching algorithm/version, matched/unmatched items, signed-off reviewer and exception resolution.
- Period-close checklist includes GL/subledger tie-out, bank and PSP reconciliation, supplier payables, deferred/earned commission, refunds/chargebacks, FX, fees, tax, pending transactions and subsequent-event review.
- Access reviews, inactive accounts, bank beneficiary review, audit-log access, privileged changes and emergency access are reviewed periodically.

## 9. Payment status and reconciliation model

Store independent state machines for:
1. **Booking/order:** drafted, held, submitted, confirmed, ticketed/fulfilled, cancelled, expired, amended and other mode-specific states.
2. **Payment attempt:** created, action-required, pending, authorized, captured/paid, failed, cancelled, reversed, partially refunded, refunded, disputed/charged back and unknown.
3. **Supplier fulfillment:** requested, supplier pending, confirmed, ticket issued/voucher issued, failed, cancelled or compensated.
4. **Settlement/payout:** pending, initiated, accepted, confirmed paid, failed, reversed and unknown.
5. **Accounting:** unposted, posted, reversed, reconciled, exception, period-closed.

Do not collapse the above into a single `paid` Boolean. Use idempotency keys, signed webhook verification where supported, server-side status queries, duplicate-event protection, out-of-order event handling, late-payment handling, and stable reference matching. A ticket is issued only under a mode/provider-specific rule that proves all required payment, inventory and supplier fulfillment conditions have been satisfied.

Minimum end-to-end reconciliation is a controlled match across: (a) booking/order and price snapshot, (b) PSP transaction and fee, (c) PSP settlement report and bank statement, (d) supplier order/invoice/fulfillment record, and (e) payouts/refunds/disputes. Not all modes expose all five sources through APIs; missing sources become documented manual controls with owner and evidence requirements.

## 10. Minimum production dashboards and alerts

Finance must see and be alerted to:

- payment success rate and amount by PSP, country, mode and payment method; pending/unknown age;
- paid bookings without supplier confirmation/ticket, and issued tickets without the expected financial evidence;
- supplier payables due/overdue, payouts pending/failed/unknown, and repeated retry patterns;
- PSP-to-bank settlement variance, unsettled balances, reserves/withholdings and unexplained fee deltas;
- commission/markup exceptions, unapproved rule changes, stale/expired agreements and bookings with no applicable fee policy;
- refunds submitted but not completed, duplicate refund/payout risk and chargebacks;
- cash/agent-till differences where physical cash is supported;
- cross-mode or cross-tenant ledger postings, unusual manual journal entries and attempted unauthorized access;
- reconciliation exception ageing and unassigned finance incidents.

## 11. Acceptance criteria for the finance platform

- Each of the six modes has independently filterable balanced subledgers, statements, reconciliation queues and audit exports.
- HIMS and OIMS use the same approved financial APIs but enforce tenant/mode/role boundaries at the server and data layers.
- Operator/supplier commission and markup terms are versioned, effective-dated, contract-evidenced and snapshotted per booking.
- No unapproved default rate can charge a customer or post commission.
- Payment/payout/refund state transitions are provider-specific, idempotent and audited; unknown states are visible.
- All posted journals balance, and period-close checks reconcile each subledger to the GL.
- Multi-currency amounts retain transaction, payout and settlement values plus FX evidence.
- Duplicate webhooks and retries do not duplicate journals, ticket issuance, refunds or payouts.
- Concurrent operations, provider timeouts, late success, partial refunds, chargebacks, payout failures and unmatched statements have automated tests.
- RBAC and maker/checker controls prevent self-approval and prevent any OIMS tenant from viewing another's finances.
- Travelar cannot initiate split settlement or payouts unless the specific provider/merchant contract and actual API capabilities have been verified.
- Principal-versus-agent, tax, VAT/EFD, consumer pricing, client-money/custody, licensing and records-retention policies are signed off by the appropriate advisers before production.
