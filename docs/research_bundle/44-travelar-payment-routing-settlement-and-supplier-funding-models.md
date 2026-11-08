## Stage 21 — ClickPesa collection and payout details

Public docs now distinguish BillPay Order Control Numbers from reusable Customer Control Numbers and merchant TANQR/Lipa Namba. The preferred ticket-sale candidate is order-level BillPay with exact amount when supported, with USSD Push as another assisted payment route. TANQR/Lipa Namba collection lets the payer enter an amount in the generic flow; dynamic amount-specific QR requires vendor discussion. ClickPesa still has no sandbox and public docs do not prove marketplace split settlement. See Documents 56–58.

# 44 — Travelar Payment Routing, Split Settlement and Supplier Funding

**Research date:** 24 October 2026  
**Status:** Evidence-led architecture; provider functions in public documentation do not prove that a specific OuterBlocks merchant account, market, supplier or split-settlement structure will be approved.

## 1. Core decision: payment routing is a per-booking commercial policy

Travelar must not assume that every customer pays Travelar, that every operator can route payments through Travelar, or that the platform can automatically deduct its commission from another merchant's settlement. For each operator/supplier/product/market/contract version, select only a payment route documented as both technically supported and commercially/legal approved.

The route decision should be explicit, versioned, auditable and visible in the checkout summary and finance view. If no route is eligible, stop checkout or use a separately approved alternative; do not silently redirect to a default merchant account.

## 2. Standard payment routes

### Route A — Operator is merchant; customer pays the operator through the operator's PSP

**Flow:** Customer → operator-owned PSP merchant account → operator's configured settlement account. Travelar sends the customer to an approved hosted checkout or operator payment surface, binds the provider reference to the booking, receives a verified payment event/status and reconciles booking fulfillment. The operator's PSP agreement is responsible for the merchant account and direct collection.

This is the cleanest model when Travelar's aim is not to receive or hold the operator's money. It does **not**, by itself, pay Travelar a commission.

Possible commission arrangements:
1. The operator's PSP offers an approved marketplace/split-settlement product and supports a connected Travelar beneficiary/merchant account, so the agreed commission allocation is executed by the PSP as part of transaction processing/settlement.
2. No split support: the operator receives the funds, and Travelar invoices the contracted commission on an agreed cycle, or the operator separately remits it under contract. Travelar reconciles commission against the supplier's transaction/settlement reports. This is not an automatic pre-settlement deduction.
3. An operator/PSP supports another documented collection or transfer mandate; use it only after the PSP confirms it in writing and the arrangement is legally reviewed.

**Critical rule:** If the PSP cannot split a payment or otherwise direct the commission to Travelar, Travelar cannot guarantee that its commission is deducted before the operator receives settlement. Do not build a fictitious split flag into our database and treat it as a fund movement.

### Route B — PSP executes an approved split between operator and Travelar

**Flow:** Customer → approved PSP marketplace/connected-merchant structure → operator's share and Travelar's contracted share routed by the PSP under its terms; payout bank rails/timing depend on the provider's product.

Before enabling, verify in writing:
- whether the product is actually available for the country, currency, merchant category, travel use case and OuterBlocks legal entity;
- whether every operator must undergo KYB/KYC, maintain a separate provider account/subaccount and accept platform terms;
- whether the funds are allocated at authorization, capture, transaction processing or later settlement; the exact timing matters;
- whether Travelar's commission goes to Travelar's bank account/merchant account or remains as a provider balance before transfer;
- who bears PSP fees, refunds, reversals, reserves, chargebacks, negative balances and failed supplier performance;
- how partial refunds and cancellations reverse the original split; whether provider fees are refunded;
- whether a beneficiary can be changed and what dual-control/security steps apply;
- the webhook, payout statement and reconciliation references and what final status the bank/provider proves.

A PSP's general ability to collect and a separate ability to make payouts do not establish that it supports this marketplace split model. This capability must be proven for the actual account/product.

### Route C — Travelar collects and pays an operator/supplier

**Flow:** Customer → Travelar's approved merchant/PSP route → Travelar records customer payment, gross supplier obligation, fees and its earned revenue → Travelar initiates supplier payout through an authorized provider/bank route → confirmed settlement evidence reconciled.

This can serve operators without their own PSP integration, including direct-listed accommodation and experience suppliers, **only if** the commercial agreement, PSP merchant model, regulatory classification, customer disclosures, refunds and settlement operations are approved. Travelar may become the party responsible to the customer for taking payment, refunding the customer and/or paying the supplier. A booking platform's terms alone do not override payment-services law, PSP/acquirer rules or consumer rights.

For this route, payable amounts are liabilities, not free operating cash. The system must model supplier funds as obligations; maintain designated/segregated accounts or PSP connected accounts where required/available; pay only after approved fulfillment/settlement criteria; maintain liquidity for refunds and disputes; and reconcile every payout. Obtain a legal view on whether the arrangement triggers payment-system/payment-service, agent, safeguarding/client-money, tax or other obligations. The National Payment Systems Act, Cap. 437 R.E. 2023, s.5 says a person shall not operate a payment system without a Bank of Tanzania licence; whether a specific Travelar marketplace/collection model falls within that scope must be determined by Tanzanian counsel and, if needed, the regulator—not inferred by engineering.

### Route D — Supplier/OTA/platform collects; Travelar earns referral/commission

**Flow:** customer pays the supplier/OTA on its own approved channel → supplier records and fulfills the sale → Travelar records referral/booking evidence and commission receivable/revenue under the contract → supplier pays Travelar on the contracted cycle, or Travelar uses the supplier's approved affiliate reporting/payout channel.

Travelar generally must not add an unapproved checkout charge to the supplier's customer price in this model. This can be an effective launch route when a supplier partner agreement makes Travelar an affiliate rather than merchant of record.

### Route E — Supplier invoices Travelar under net-rate/merchant distribution model

**Flow:** customer pays Travelar under the merchant arrangement → Travelar completes the supplier booking using the supplier's authorized API → Travelar owes the supplier/wholesaler/consolidator a contractually defined net amount, paid by the agreed method (bank transfer, supplier payment link, approved virtual card, prefunded balance, credit line, BSP/other approved settlement) → Travelar's permitted markup/service revenue is accounted for under the contract and principal/agent review.

This means Travelar must fund the supplier even if customer funds are delayed or chargeback. It requires working capital, payment limits, supplier credit terms, ticketing controls and refund/liquidity reserves. It is not equivalent to automatically deducting a supplier commission from an operator PSP settlement.

### Route F — Customer pays the supplier directly at the venue/property/station

Examples include a property-collect accommodation reservation or a supplier-collect model. Travelar records booking/guarantee evidence and any commission receivable according to the agreement. It must not record customer funds as Travelar cash if the customer never paid Travelar. If Travelar is due commission, use the supplier's report/invoice/remittance process unless a documented split/fee mechanism exists.

## 3. Mode-specific implications

### Bus and ferry — OIMS operators

For operators with their own PSP, prefer Route A, or Route B only when the PSP has approved a split arrangement that routes the operator share and Travelar commission correctly. Operator-owned payment pages/redirects must return stable provider IDs and a server-verifiable final status. OIMS records its operator's transaction facts; it is not allowed to turn an external `pending` state into `successful` just because a return URL has loaded.

For operators without their own PSP, Route C is a possible commercial service, but not an automatic default. OuterBlocks must approve whether it is the merchant/agent or otherwise permitted collection party, the customer receipt/invoice, refund authority, settlement account, fee policy and payout terms. If approved, use the Travelar PSP/approved marketplace product and the centralized finance system; don't create ad hoc operator wallets or manually editable balances.

Bus and ferry revenue, payables, collections, ticket sales and settlement batches remain separate mode subledgers even if the same PSP provides the underlying collection service. A PSP transaction must include the correct `mode` and operator/contract reference.

### Flights — GDS/API/supplier or consolidator

A GDS or flight shopping API is not itself a guarantee that Travelar may collect or settle airline money. For Amadeus Self-Service APIs, current developer FAQ distinguishes (1) customer payment, which the app owner decides and implements through its own payment gateway, from (2) payment between the app owner and the consolidator, which is separately agreed. It also says markup can be added through the app owner's payment gateway. This demonstrates one integration model, not a universal rule for all Amadeus/Travelport/supplier agreements.

Before live flight sales, determine by provider, airline, point of sale and ticketing route:
- who is merchant of record/seller on the customer receipt;
- whether Travelar is authorized to issue tickets or must use a consolidator;
- when ticketing occurs versus when customer payment is authorized/captured;
- required prepaid balance, credit, collateral, BSP/IATA eligibility, agency appointment or ticketing authority;
- whether markup and/or service fees are allowed, how they must be disclosed, and tax/invoice responsibility;
- the party owed the ticket fare, settlement currency, payment due date, ADM/ACM, cancellation and refund liabilities;
- whether any PSP split is actually supported and who receives customer funds.

IATA BSP is a defined settlement framework for accredited agents/participating airlines, including cash sales and customer-card sales under different models; IATA accreditation and airline ticketing authority are separate commercial gates. A generic GDS API key is not proof of BSP membership, ticketing authority, or a production payment/settlement arrangement.

### Stays — wholesale APIs, OTA inventory and self-listed properties

Travelar must honor the payment model returned and contractually allowed for each inventory item, not choose the payment route solely by `mode = STAY`.

Expedia Rapid documents `expedia_collect` (Expedia collects the guest payment and pays the property), `property_collect` (property collects from the guest), and `updated_expedia_collect` (Expedia collects when booked; lodging partner receives payment after checkout). Booking/receipt requirements differ by model. Property-collect reservations can require a card for security and some related flows require PCI compliance; those card and merchant responsibilities are not interchangeable with ordinary checkout.

Booking.com Demand API documents a partner-collects model where a partner authorized to charge travellers collects using its own payment flow and pays Booking.com using a virtual credit card (VCC), subject to its Online Travel Service/payment agreement, PSP capability and supported API version. It also provides a separate Booking.com-collects path. These are contract-specific commercial models; do not assume all properties/rates allow all routes.

For local self-listed stays:
- direct property collection can use Route A/B (commission either split by an approved PSP or invoiced/remitted later);
- Travelar-collect can use Route C if approved, with property payable and settlement reconciliation;
- guest-pays-property can support booking confirmation and later commission invoice if the agreement permits it.

The property contract must specify who is the service seller, who is responsible for guest payment, deposit, no-show/late-cancellation charges, invoice/receipt, tax, refund, chargeback, guest support and commission/markup. If Travelar uses supplier net rates and owns retail pricing, counsel/accountant must assess principal-versus-agent and customer disclosure.

### Experiences — marketplace suppliers and third-party inventory

Viator documents two distinct models. Affiliate partners refer customers to Viator to complete the sale, with Viator as merchant of record and commission paid to the affiliate. Merchant partners execute the transaction through their own website/API and become merchant of record, responsible for monetary transactions, customer support, cancellations and refunds; merchant partners may mark up/discount prices and are invoiced periodically by Viator. Access to merchant/booking endpoints requires partner qualification and approval. Do not assume API access includes merchant rights.

For local self-listed experience providers, use direct operator collection with approved split or commission invoice where contractually supported, or approved Travelar collection with supplier payables/payouts. Establish supplier tax/receipt expectations, refund/no-show/weather cancellation, booking voucher validity, commission on tax/fee components, redemption evidence and payout timing.

### Train — government and railway inventory

Do not assume a government railway will accept commission, allow markup, permit ticket resale, or expose a reseller API. The official TRC e-ticketing flow publishes direct customer booking and payment steps, but the public material reviewed did not establish third-party reseller API rights, commission terms or a marketplace split-payment model. Obtain written confirmation from TRC for the specific system, product, channel, commercial structure, API, payment flow and customer-support/refund obligations.

For Kenya Railways' Madaraka Express, official conditions of carriage state tickets are sold by the railway via listed channels and that resale for profit/commercial gain may invalidate a ticket. This is a strong warning not to add a train markup or resell tickets without an explicit authorization that supersedes/permits the proposed activity. Public documentation reviewed does not establish a blanket authorized Travelar reseller right.

If railway integration is not authorized, Travelar may offer only an allowed referral/redirection arrangement, if the railway permits it, or defer transactional sales. Do not scrape a public booking site or reverse-engineer payment flows to sell tickets without permission.

## 4. Settlement and reconciliation rules

For every payment route, store these separate amounts/statuses:
- customer amount requested, authorized, captured/paid and refunded;
- supplier gross/net base and amount due;
- commission and markup calculated/earned/invoiced/collected;
- PSP merchant processing fee, bank/payout fee and FX conversion;
- taxes/levies shown or withheld as confirmed by the tax adviser/provider;
- amount actually allocated to the Travelar beneficiary, operator, supplier or OTA;
- provider settlement reference, expected settlement date, confirmed value date and bank statement reference;
- any refund/chargeback/reversal/reserve/holdback and the contractually liable party.

Where PSP can split, reconcile expected split instructions against actual provider allocations and settlement/bank evidence. Where the provider does not offer split, reconcile the supplier's actual receipt and commission receivable/invoice/payment. For Travelar collection, reconcile each supplier payable to each approved payout and bank/provider completion. Use four-way or five-way reconciliation as the data permits: booking, provider collection, settlement/bank, supplier confirmation/invoice, and payout/refund.

Never infer success from a browser redirect, screenshot, client state, SMS received by customer, or a provider API response whose documented meaning is only `accepted`/`pending`. Query the provider, verify callbacks, and reconcile the source of record.

## 5. Liquidity and treasury controls

The Treasury/Fund Position view must distinguish:
- unrestricted OuterBlocks operating cash;
- PSP/merchant balances available for withdrawal;
- funds contractually owed to operators/suppliers/customers;
- settlement in transit and expected value dates;
- provider reserves/holds and chargeback liabilities;
- committed supplier prepayments, consolidator credit and upcoming payment deadlines;
- refund/chargeback exposure and liquidity buffer;
- net amounts available after the obligations and legally/contractually restricted balances are removed.

Do not use operator/supplier funds to pay OuterBlocks operating expenses or to settle a different operator's payable. Any required account segregation or safeguarding structure must be confirmed by legal counsel and PSP/bank partners; management reports are not a substitute for actual legal segregation.

Flight GDS/consolidator and some hotel/experience models may require Travelar to pay a supplier regardless of when its PSP settles customer funds. Model this cash-flow gap and stop new high-value exposure when approved credit, float or limits are reached. Do not treat supplier credit availability as guaranteed until a signed contract grants it.

## 6. Provider evidence reviewed as of 24 October 2026

| Provider/source | Public capability evidence found | What is **not** established from the public material reviewed | Required next proof |
|---|---|---|---|
| ClickPesa | Current docs describe hosted/embedded collection, mobile-money and card API areas, mobile-money payouts, bank payouts and transaction/balance/notification/export tools. | A Travelar-eligible marketplace split settlement or connected-submerchant commission split was not found in the public documentation reviewed. The intended contracting/operating entity for the Travelar merchant account is now OuterBlocks Destinations Limited under OuterBlocks Limited; account holder, merchant of record, beneficiary and any operator connected-account arrangement must be confirmed in writing. Its current quickstart states there is no sandbox and API Explorer requests run against production and move real funds. | Written marketplace/split capability and legal product description; separate Travelar/operator onboarding; testing method that avoids unintended live money movement; fees, refunds/chargebacks and settlement examples. |
| Selcom | Public Selcom developer docs list checkout/order creation/status, card/wallet/USSD flows, C2B/collection, transaction status, and Qwiksend bank transfers; Selcom business materials describe APIs including e-commerce and disbursements. | These capabilities do not themselves prove an approved split between multiple independent merchant beneficiaries, automatic commission deduction, submerchant settlement or the exact contract for Travelar. | Product workshop, written product/contract and country/mode eligibility, flow diagram, settlement statement examples and refund/chargeback allocation. |
| Pesapal | Public API 3.0 docs expose order submission, transaction status, IPN registration/notifications, refunds and related ecommerce integration. | A split settlement/marketplace submerchant product and automatic Travelar commission allocation were not established by the public developer docs reviewed. | Written confirmation, account/market availability, any marketplace product API, settlement timing, connected-account requirements and liability terms. |
| DPO Pay by Network | Current docs provide a merchant API integration for checkout and payment flows, with risk screening and multi-currency features described. | Public pages reviewed did not establish Travelar marketplace split settlement or operator beneficiary subaccounts for the intended Tanzanian use case. | Signed quote, product capability confirmation for Tanzania travel marketplace use, payout/refund/dispute behavior and statement/API references. |

**Important:** 'Not established in the public docs reviewed' does not mean a product is impossible. It means Travelar must not code or promise the feature until the provider supplies written current documentation, commercial confirmation and a tested account-level proof. Do not select a provider by marketing material alone.

## 7. Provider Request for Information (RFI) — required questions

Ask each PSP/bank/supplier the same detailed questions:

1. What exact legal entity contracts with OuterBlocks, and what licences/approvals cover collection, settlement, payout and any marketplace or payment-facilitation service in Tanzania and target countries?
2. Do you explicitly support platforms with multiple independent operators/suppliers? Is there an approved marketplace/connected-merchant or submerchant agreement? Provide the product terms.
3. Can one customer payment be split so the operator/supplier's share settles directly to its own verified bank/mobile-money account and Travelar's contractual commission settles to an OuterBlocks account? Is this supported in the intended market, currency, merchant category, rail and online checkout?
4. Is the split at authorization, capture, transaction processing, provider ledger allocation or bank settlement? Can Travelar choose a different eligible commission rule per operator/product/contract while keeping the same merchant route?
5. Can each operator use its own PSP merchant account and still direct a configured commission share to Travelar? If so, which legal owner/PSP relationship must be onboarded? Is it a split, fee, transfer mandate, collection-agent model or something else?
6. If split is unsupported, what permitted mechanism exists for operator-to-Travelar commissions? Do not present separate payouts or invoices as automatic deduction.
7. Who is responsible for KYC/KYB, beneficial ownership, fraud screening, customer disputes, chargebacks, negative balances and payout errors? Who receives/loses funds when a supplier share was paid but a refund is later due?
8. Can the customer be charged in one currency while recipients settle in another? What rates, conversion timestamps, spreads, minimums and rounding rules apply?
9. What are pay-in, merchant settlement, provider payout and refund timing by payment method, including weekends, holidays, reversals and failed/ambiguous statuses?
10. What settlement reports, webhook events, final status queries, bank references, reconciliation APIs/files, idempotency keys and historical queries are available?
11. How are partial refunds, full refunds, pre-booking failures, duplicate callbacks, late successes and disputes handled in a split transaction? Which recipient's balance/account is debited to fund a refund?
12. Are reserves, rolling holds, settlement delays, minimum balances, prefunding, credit lines or cross-collateralization used? May each supplier's obligations be kept isolated from other suppliers?
13. What are all costs: setup, monthly, MDR, mobile-money fees, card fees, customer-paid fees, merchant-paid fees, split fees, payout fees, refunds, FX, chargebacks, reserve costs and tax? Which customer-facing fees are lawful and permitted by the applicable provider/market rules?
14. Is a sandbox provided? If not, how will the integration team certify using provider-approved test accounts, low-value live transactions, reversals, test beneficiaries and production-safe test procedures? Are there API calls that always move live funds?
15. What supplier/airline/hotel/train agreement, license, accreditation, ticketing authority, payment mandate or partner qualification is separately required?
16. What is the production SLA, support escalation, incident notification, data-processing/storage location, retention, cross-border transfer contract and termination/payout of remaining balances?
17. Provide sample transaction logs, settlement files, API responses for pending/final/failed payments, sample split outcomes, a refund flow and a payout failure flow from a current production-equivalent product.

## 8. Decision gates

**Gate 1 — commercial/legal classification:** accountant and counsel agree on principal/agent, payment custody/collection, contractual seller, customer invoice, taxes, refunds and the exact legal role of OuterBlocks for each route.

**Gate 2 — provider capability:** written evidence and approved account terms establish the pay-in, split/payout, beneficiary, refund, dispute and settlement behavior.

**Gate 3 — design proof:** state diagrams, event mappings, idempotency, accounting journals, provider references, failure scenarios and reconciliations are reviewed and tested.

**Gate 4 — cash/risk proof:** supplier payable, flight consolidator funding, operator payouts, refunds and chargeback/liquidity exposure have approved limits and owners.

**Gate 5 — production proof:** test transactions through a provider-approved procedure; compare booking record, provider status, settlement report, bank movement, commission split, supplier payout and GL. Close all unexplained differences before scaling.

No mode/operator/provider route goes live before its applicable gates pass.
