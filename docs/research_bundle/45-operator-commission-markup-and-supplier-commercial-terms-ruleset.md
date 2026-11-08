# 45 — Operator Commission, Markup and Supplier Commercial Ruleset

**Research date:** 24 October 2026  
**Status:** Business and data requirements; no percentage, markup, tax rate or railway commission is prescribed by this document.

## 1. Commercial model registry

Travelar needs a versioned commercial profile per legal supplier/operator relationship. It must not treat commission as a global system constant or assume that every supplier in a mode follows one policy.

### Required contract and rule fields

- `agreement_id`, `agreement_version`, contracting parties, evidence document, approval status, effective start/end, renewal and expiry date;
- `legal_entity_id`, `market_country`, `mode`, `operator_or_supplier_id`, provider inventory ID and product/route/property/activity scope;
- `sales_role`: `AGENT`, `PRINCIPAL_RESELLER`, `REFERRAL_AFFILIATE`, `SUPPLIER_COLLECT`, `PLATFORM_COLLECT`, `PSP_SPLIT`, `INVOICE_AND_REMIT`, or a reviewed mode-specific value;
- `merchant_of_record`, seller of service, customer receipt/invoice issuer, supplier fulfillment party and refund authority;
- `commission_type`, exact `commission_base_components`, percentage/fixed/tier parameters, eligible currency, tax treatment, rounding rule, minimum/maximum, caps/floors and exceptions;
- `markup_type`, supplier/net base definition, per-item or per-order calculation, caps/floors, price-discretion authority and checkout disclosure requirements;
- `discount_funder`, voucher/coupon behavior, loyalty/promotional funding, whether discounts reduce supplier base or Travelar revenue/commission;
- `earning_event`, payment due date, payout cycle, minimum payout, reserve/holdback, settlement currency, bank/PSP route and fee allocation;
- cancellation/refund/no-show/change/partial-use/chargeback commission reversals and who bears payment processing or payout costs;
- payment route capability evidence, supported provider/method/currency, provider account identifier, split proof (where applicable), statement/API evidence and account verification status;
- pricing approval, finance approval, legal/tax approval, last reviewed by/date, and production activation status.

Missing mandatory fields must result in `BLOCKED_UNCONFIGURED` or `REQUIRES_REVIEW`, never a silent default. Store customer-facing components and the calculation explanation, not just one final amount.

## 2. Separate formulas and ledgers

### Commission arrangement

Let `B` be the contract-defined commissionable base, and let `r` be an agreed percentage rate. An example simple rule is `commission = round(B × r, contract_rounding_rule)`. The actual base may exclude taxes/levies, optional ancillaries, discounts, refunds, service charges or other items if the signed agreement specifies so. For tiered or fixed fees, apply the versioned contract formula instead. Commission payable/earned timing is determined by the agreement and accounting policy.

If the customer pays the operator directly, the commission may become a Travelar commission receivable and be invoiced/collected later unless an approved PSP split or other collection mechanism transfers it. A commission rule is not proof a provider will deduct it before settlement.

### Net-rate/markup arrangement

Let `N` be the contractual supplier net amount. Travelar may display/charge `P = N + permitted markup + permitted service fees + applicable taxes/charges − discounts` only where that pricing and sale model is authorized. The supplier payable is then based on the contract, not on a generic commission calculation. The accountant decides gross-versus-net revenue presentation based on the principal/agent control assessment.

### Discounts

Every reduction needs a funding party and expense/revenue treatment. A coupon may be funded by OuterBlocks, the supplier, a PSP campaign or another contractually approved source. It must not silently reduce supplier payable while Travelar still reports the original commission base unless the agreement explicitly says to do so.

### PSP fees

Payment processing/payout fees are separate from supplier commission and customer markup. Record which party bears each fee and the actual fee reported by the provider. Never assume that a fee paid by Travelar can be pushed to the customer or deducted from supplier funds without contract/provider/legal approval.

## 3. Contract snapshots and version control

At quoted price, checkout, booking confirmation and each approved amendment, store:
- selected contract/rule version and source evidence;
- raw supplier price and currency, supplier taxes/fees and net payable base;
- customer price components, markup, commission basis and amount, discount source, tax treatment and rounding;
- payment route and provider account identity used;
- cancellation/refund policy and financial consequences applicable at sale;
- approval/audit metadata and a human-readable calculation trace.

When an agreement changes, future eligible bookings use the new version after its effective date. Previously confirmed bookings use their snapshot unless a contractually authorized amendment/repricing is recorded. Restatements are audited and journaled; no silent retroactive changes.

## 4. Market and mode design constraints

- **Bus:** contract may scope commission by operator, route/segment, ticket fare base, eligible booking types, payment route and ticket lifecycle. A bus operator may have a different agreement from a second bus operator. Segment fares/overlap inventory logic must not be mistaken for commission basis; if commission is per segment, the agreement must explicitly say so.
- **Ferry:** keep class fares, residency category and operator's fare rules separate from commission rules. A fare difference between resident/non-resident or passenger class does not automatically imply a different commission rate.
- **Flights:** distinguish ticket base/fare/taxes/ancillary components, GDS/consolidator charges, ticketing authorization, service fee and markup. A flight API's ability to display/search or book is not enough to establish a legal right to mark up or ticket. Configure per provider/supplier agreement and point of sale.
- **Stays:** support commission-based OTA/hotel inventory, property-direct commission, net-rate/reseller inventory and guest-pays-property models. Payment schedule can depend on check-in/check-out, cancellation, no-show, deposit and property-collect policy. Supplier net price and commission must not be treated as the same thing.
- **Train:** default is `NO_COMMERCIAL_RULE` until an explicit written railway/seller agreement permits a commission or markup and defines the route/payment/ticketing authorization. Government ownership does not itself prove a commission is payable, nor prove markup is permitted. Do not activate resale without permission.
- **Experiences:** support affiliate commission, merchant/net-price, local supplier commission and direct venue collection as distinct sales models. For Viator, public docs describe an affiliate route and an approved merchant route with different payment and responsibility obligations. Local self-hosted activities need their own written supplier agreement, cancellation/redemption/payout terms, and tax/receipt policy.

## 5. Approval flow

1. Partnerships uploads the signed agreement and proposes structured terms.
2. Finance checks calculation base, payout, reconciliation and profitability.
3. Legal/compliance checks selling role, customer disclosures, payment custody/split, refund and regulated sector requirements.
4. Tax/accounting approves taxes, invoice/receipt, revenue recognition and earning date.
5. Engineering configures the versioned record; no source code change is needed for ordinary commercial term updates.
6. Another authorized approver verifies a test booking and calculation in a non-production or controlled environment.
7. Activate on/after agreed effective time, and log change reason, prior version and approver.

The commercial profile must prevent the same user from creating and approving high-impact rate changes where separation is required. Expiring agreements automatically stop new bookings or flag an approved exception; they must not alter previously booked amounts.

## 6. Public provider evidence and limitations

- Amadeus Self-Service API FAQ currently says the app owner decides how to collect from customers, while payment to a flight consolidator is separately agreed; it also says markups can be added through the app's own payment gateway. This is specific to that product flow, not a blanket permission for every flight supply relationship.
- Expedia Rapid has distinct Expedia-collect and property-collect models, including different payment and receipt responsibilities. Choose based on the returned/contracted booking model.
- Booking.com Demand API's partner-collect model requires that the partner be authorized to directly charge travellers and have the applicable online-payment agreement and VCC capability; it is not a default for every stay.
- Viator distinguishes referral affiliate and merchant API relationships; merchant status brings monetary transaction and customer support/cancellation responsibilities, while affiliate sales redirect and pay commission.
- The public TRC e-ticketing path shows the railway's booking/payment workflow, but public research did not find evidence of a Travelar reseller/commission/split settlement agreement. Kenya Railways' published Madaraka Express conditions restrict sales to listed channels and warn resale for profit can invalidate tickets. Therefore no railway fee/markup is preconfigured here.

## 7. QA acceptance cases

- Operator A's 5% commission and Operator B's fixed commission do not leak into each other's bookings.
- Bus and ferry reports remain separate even if both use a shared payment processor.
- Expired/missing/unsigned commercial profiles block checkout or use an explicitly approved referral-only route; they never default to 0%, 5%, 10% or a fabricated markup.
- An effective-dated rule change does not recalculate an old booking or posted journal.
- Percent, fixed, tiered, per passenger and permitted per-segment rules calculate deterministically with currency precision and rounding tests.
- Taxes/levies, discounts and ancillary services are included/excluded from commission base exactly as defined by contract.
- A partial refund reverses only the applicable commission/markup and supplier amounts under the contract.
- Direct operator collection with no split creates a commission receivable/invoice event; it does not pretend the commission arrived in Travelar's bank.
- Split settlement is marked available only after provider/merchant account proof and contract approval.
- Travelar collection creates a supplier payable and payout obligation and cannot report the full customer collection as operating revenue automatically.
- Train inventory cannot be priced with a commission or markup until a valid, approved commercial rule exists.
