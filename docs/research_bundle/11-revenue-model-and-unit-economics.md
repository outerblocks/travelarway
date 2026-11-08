# 11 — Revenue Model and Unit Economics

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Status:** Decision-support model; all numeric scenarios below are illustrative inputs, not market averages, supplier quotes or approved forecasts.  
**Date:** 23 October 2026

## 1. Revenue recognition starts from the contract and principal/agent assessment

Gross booking value (GBV) is the total value of travel services booked, not automatically Travelar revenue. Before financial reporting, determine for each mode/contract whether OuterBlocks acts as principal/reseller, disclosed agent, marketplace/intermediary, appointed ticketing agent, merchant of record, or another agreed role. The answer affects whether accounting revenue is gross or net, which entity owes the supplier, taxes, refund obligations and who is the contracting consumer-facing seller.

A provider's statement that it can process money is not enough to establish a lawful marketplace settlement model. The business, payment and supplier contracts must align.

## 2. Revenue streams to evaluate

| Stream | Formula concept | Gate / evidence required |
|---|---|---|
| Bus/ferry marketplace commission | Eligible fulfilled fare base × contracted rate, adjusted for discounts/refunds/chargebacks according to contract | Signed operator agreement; LATRA/TASAC/Zanzibar compliance; channel-attribution rules; tax treatment |
| Contracted operator software/OIMS fee | Monthly/per-seat/per-branch/per-transaction SaaS or service price | Operator demand validation, SLA, support cost, data rights, tax invoice treatment |
| Flight commission or incentive | Contract-defined paid/fulfilled segment or ticket commission | Airline/GDS/consolidator agreement; ticketing authority; clawback and debit memo rules |
| Flight markup/net fare | Permitted retail price − supplier net price | Contract permits markup; consumer disclosure; fare conditions; actual net fare authority |
| Accommodation commission/markup | Contracted commission or permitted net-to-retail difference | Bedbank/GDS/direct hotel contract; cancellation/tax/payment guarantee duties |
| Experiences commission | Contracted commission on fulfilled activity value | Supplier agreement, cancellation liability, local licensing/insurance where applicable |
| Disclosed customer service fee | Clearly disclosed fee for a defined service | Country-specific consumer, payment-scheme and PSP rules; no prohibited payment surcharge |
| Supplier integration/onboarding | Contracted implementation or support fee | Transparent contract; do not charge for a service not provided |
| Advertising/placement | Paid placement under written commercial rules | Ranking transparency, competition and consumer protection review |

Avoid building a business model that relies on charging customer card surcharges. BoT's 2024 fee guidelines prohibit card merchant-payment fees/surcharges in the stated scope; obtain a written legal view for the exact online checkout before setting any payment method fee. See source register.

## 3. Configurable commission rules

Store a versioned commercial agreement rather than an editable global percentage. A rule may be scoped by:

- operator/supplier legal entity and supplier contract;
- country, route, service, mode or operator category where the contract permits;
- distribution channel and booking-origin rule;
- customer segment, promotion or campaign if contractually allowed;
- effective-from/effective-to date, currency, tax treatment and eligible fee base;
- commission percentage, fixed amount or tier formula;
- discount responsibility, refund treatment, chargeback treatment and rounding rules.

Each order captures the exact commission-rule version used at quote/booking time and the rule used when the contract says commission becomes earned. Later edits cannot retroactively rewrite existing bookings. Overrides require reason, maker-checker approval, effective dates and audit history.

### Channel attribution requirements

Travelar-generated channels (Travelar website/app, Travelar agents, Travelar call center and designated Travelar marketing integrations) may be commissionable only where the signed agreement says so. Operator-originated bookings should not incur marketplace commission unless a signed exception says otherwise. Attribution must be recorded at booking creation using server-side identity/channel credentials, not a user-editable browser field. Reclassification requires a supervised, audited correction; it must not erase original channel evidence.

## 4. Per-booking unit economics formulas

Let:

- `N` = bookings in the period;
- `A` = average booking value (ABV);
- `GBV = N × A`;
- `E` = percentage of GBV eligible for Travelar revenue (exclude non-commissionable operator-originated bookings and other contract-excluded value);
- `T` = effective contracted take rate/retained margin on eligible base;
- `R` = percent of earned commission reversed for cancellations/refunds/adjustments in the modeled period;
- `P` = effective payment processing cost as a percent of gross customer payment volume (placeholder until signed PSP quotes; include only channels where Travelar pays the fee);
- `F` = expected fraud/chargeback loss as percent of GBV (estimate from measured data after pilot; placeholders before then);
- `V` = support, notification, ticket delivery and variable operations per booking;
- `Q` = share of bookings attributable to paid acquisition;
- `CAC` = cost per acquired booking/customer under a defined acquisition cohort;
- `O` = period fixed operating costs attributable to this business line.

Then, for a simplified bus/ferry marketplace model:

- `Gross marketplace commission = GBV × E × T`
- `Retained revenue after commission reversals = GBV × E × T × (1 − R)`
- `PSP cost = GBV × P` (replace with method-weighted costs when data are available)
- `Fraud/chargeback loss = GBV × F`
- `Paid acquisition cost = N × Q × CAC`
- `Variable servicing cost = N × V`
- `Contribution before fixed costs = retained revenue − PSP cost − fraud loss − acquisition cost − variable servicing cost`
- `Operating contribution = contribution before fixed costs − O`
- `Break-even bookings = O ÷ contribution per booking`, only if contribution per booking is positive and materially stable. If contribution per booking is zero/negative, no finite volume alone solves the model under those assumptions.

This simplified model excludes taxes, FX, working capital cost, provider/GDS segment fees, chargeback overhead, refunds that are not recoverable from suppliers, tax on commissions/fees, and supplier-specific modes. Add those line items before investment decisions.

## 5. Illustrative low/base/high scenario

The figures below are a **spreadsheet-style seed model**, chosen to demonstrate formulas. They are not evidence about Tanzania's current booking volumes, average fares, conversion, payment pricing or customer-acquisition cost. Replace every input with validated pilot data or executed supplier quotes.

| Input / result | Low (editable assumption) | Base (editable assumption) | High (editable assumption) |
|---|---:|---:|---:|
| Bookings/month (`N`) | 1,000 | 5,000 | 20,000 |
| Average booking value (`A`, TZS) | 60,000 | 80,000 | 100,000 |
| Gross booking value (`N × A`) | TZS 60,000,000 | TZS 400,000,000 | TZS 2,000,000,000 |
| Eligible GBV share (`E`) | 70% | 75% | 80% |
| Effective take rate (`T`) | 5% | 7% | 10% |
| Commission reversal allowance (`R`) | 4% | 3% | 2% |
| Hypothetical processing cost (`P`) | 2.5% | 2.0% | 1.5% |
| Hypothetical fraud loss (`F`) | 0.30% | 0.20% | 0.10% |
| Support + messaging per booking (`V`, TZS) | 600 | 450 | 300 |
| Paid-acquisition share (`Q`) | 40% | 30% | 10% |
| Hypothetical CAC (`CAC`, TZS) | 2,500 | 1,800 | 1,000 |
| Fixed monthly costs (`O`, TZS) | 35,000,000 | 50,000,000 | 90,000,000 |
| Gross commission before reversals | 2,100,000 | 21,000,000 | 160,000,000 |
| Retained commission after reversals | 2,016,000 | 20,370,000 | 156,800,000 |
| Hypothetical PSP expense | (1,500,000) | (8,000,000) | (30,000,000) |
| Hypothetical fraud loss | (180,000) | (800,000) | (2,000,000) |
| Servicing cost | (600,000) | (2,250,000) | (6,000,000) |
| Paid acquisition cost | (1,000,000) | (2,700,000) | (2,000,000) |
| Contribution before fixed costs | **(1,264,000)** | **6,620,000** | **116,800,000** |
| Fixed costs | (35,000,000) | (50,000,000) | (90,000,000) |
| Illustrative operating contribution | **(36,264,000)** | **(43,380,000)** | **26,800,000** |

A negative low/base case is not a prediction that Travelar will lose these amounts; it shows how sensitive a commission-only model can be when processing costs apply to total GBV but only part of that GBV earns commission. The high case only becomes positive because the placeholder volume, take rate, eligible share, processing cost and fixed-cost inputs are more favorable. None should be treated as validated. Do not use this table for fundraising or budgeting until the model is replaced with measured inputs.

### Model refinements required before an investment case

- Split transport, flights, stays and experiences; their revenue mechanisms and supplier costs differ.
- Separate marketplace-eligible from non-eligible GBV by channel and contract.
- Model each payment method separately using written tariffs, including fixed charges, refunds and payouts.
- Separate card/mobile-money/bank payment volume, cash-counter volume and supplier-direct payments.
- Distinguish new vs repeat customers and customer acquisition cohorts; don't multiply CAC by every booking indefinitely.
- Include taxes, FX margin/cost, supplier booking/segment fees, refunds, chargebacks, discounts, messaging, ticketing, support, insurance and regulatory/compliance costs.
- Model timing: when customer money arrives, when supplier funds become payable, when settlement lands and when refunds must be funded.
- Track contribution by operator, route, channel, mode, country and provider.

## 6. Commission scenarios and testing

User-proposed candidate percentages are 5%, 7%, 10% and 15%. They are **negotiation/test scenarios, not verified market averages**. Test with each operator's actual unit economics:

- value created (distribution reach, seats sold, lower no-shows, reconciliation and support burden);
- operator's existing channels and contract costs;
- payment fee and settlement cost allocation;
- discounts/promotions and cancellation/refund ratios;
- whether commission is applied to fare only, taxes/fees, ancillary charges or a narrowly defined eligible base;
- VAT/withholding/tax treatment and invoice requirements;
- commission earned at booking, payment, departure, fulfilment or settlement;
- whether commission is clawed back after refund, passenger no-show, chargeback or service disruption.

Do not assume a universal take rate across all six modes. The price base and earned event must be defined by each signed contract.

## 7. Commercial decision gates

Before approving any revenue model, record:

1. Contractual seller/merchant and consumer-facing party per mode.
2. Allowed ticket price / markup / customer fee rules.
3. Revenue earned event and refund/chargeback clawback policy.
4. Who absorbs PSP, GDS, supplier, SMS and FX fees.
5. Operator settlement formula and due date.
6. Accounting/tax treatment approved by finance/tax counsel.
7. Proven contribution margin under test/pilot data.
8. Liquidity required for late failures, refunds, reserves and delayed settlement.

## 8. Primary sources

- BoT, Guidelines on Fees and Charges for Banks and Financial Institutions (2024), especially guideline 19 card merchant-payment fees: https://bot.go.tz/Publications/Acts%2C%20Regulations%2C%20Circulars%2C%20Guidelines/Guidelines/en/2024071716364191.pdf
- BoT notice on card payment surcharges (10 December 2024): https://www.bot.go.tz/Adverts/PressRelease/sw/2024121111254318.pdf
- ClickPesa public fees: https://clickpesa.com/payment-gateway/pricing/
- Official provider documentation in `10-psp-communications-and-ussd-provider-comparison.md` and `sources-and-evidence-register-stage4.md`.

**Research status:** Financial scenarios are editable illustrative assumptions. Supplier quote collection, actual operator volumes and country-specific tax/legal opinions remain outstanding.
