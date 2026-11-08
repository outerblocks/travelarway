# ADR-FIN-002 — Mode-Isolated Subledgers and Contract-Driven Payment Routing

**Status:** Proposed; requires finance/legal/provider approval before implementation  
**Date:** 24 October 2026

## Context

Travelar has six first-class travel modes and separate HIMS/OIMS responsibilities. Operators and suppliers may use different collection channels, own PSP accounts, payment contracts, net rates, commission agreements, payout cycles and refund responsibilities. Public API access does not itself prove split-settlement availability or resale rights. A simple finance module and a single global commission rule would hide liabilities and overstate revenue.

## Decision

1. Build a shared finance domain/API and double-entry GL with separate, independently reconciled subledgers and financial reports for `BUS`, `FERRY`, `FLIGHT`, `STAY`, `TRAIN`, and `EXPERIENCE`.
2. Keep operator/tenant scope, mode, country, currency, contract version, PSP, booking/order, payment, refund, settlement and payout as durable dimensions. Enforce data access on the server and database boundaries.
3. Store commercial contracts and commission/markup rules as approved, effective-dated data with snapshots per booking. No universal fee percentage or presumed markup.
4. Make payment routing explicit and contract-driven per supplier/operator/product/market. Supported routes include direct supplier/operator collection, PSP split settlement, Travelar collection under an approved model, supplier/OTA collection/referral, supplier net-rate/merchant settlement and approved at-property/venue collection.
5. Only claim a PSP split is supported after evidence for the exact merchant account/product/market/contract, settlement behavior, beneficiary model, refund/chargeback handling and reconciliation fields is approved.
6. If direct operator PSP lacks a proven split mechanism, collect commission by invoicing/remittance or another approved contractual route. Never claim the app can deduct it automatically from an external merchant settlement.
7. Route marketplace/platform collection for operators without PSP only after legal, PSP/acquirer, tax, commercial, liquidity, refund and payout gates are passed. If no approved route exists, disable transactional checkout for that supplier/mode rather than improvise.
8. Do not enable train commission or markup until the railway/authorized reseller contract explicitly permits it.
9. Posted journals and financial events are append-only; use balanced double-entry journals, maker/checker for material financial actions, and reconciliations across booking/provider/bank/supplier records.
10. Accountant and tax/legal advisers must approve principal-versus-agent revenue recognition, tax/invoice treatment, fee disclosure, client-money/custody characterization, and any licensing/safeguarding requirements before production.

## Consequences

**Benefits:** accurate mode and supplier profitability; independently auditable balances; transparent collection-versus-settlement status; supports direct PSP and platform-collect models without falsely merging them; limits silent cross-subsidization; makes provider capability and regulatory unknowns explicit launch gates.

**Costs:** more explicit agreement data, ledger/reconciliation work, provider adapter testing and operations. Supplier onboarding cannot be reduced to registering a name and entering a percentage.

## Rejected alternatives

- One global commission rate: rejected because commercial arrangements differ by provider, operator, mode and contract.
- One mutable `paid` flag: rejected because booking, customer payment, supplier fulfillment, refund and payout have distinct states.
- Assume all PSPs can split commissions: rejected because collection/payout APIs do not prove split merchant capability.
- Force all operators through Travelar's merchant account: rejected as default because it changes payment/fund responsibility and creates legal, cash-flow and payout risk.
- Treat all GDS/OTA transactions as paid to Travelar: rejected because the supplier may be merchant of record, customer may pay directly, or Travelar may owe a supplier/consolidator.
- Apply train markup based on a desired margin: rejected until the specific railway agreement authorizes it.

## Evidence required to accept this ADR

- Signed-off chart of accounts and posting matrix; mode/tenant subledger reconciliation proof.
- Commercial contract schema and approved field/approval workflow.
- Written PSP confirmation for any direct split-settlement route and test settlement evidence.
- Legal and tax opinions for platform collection, agency/principal classification, customer receipts and consumer pricing.
- Per-provider flight/hotel/experience/train/bus/ferry funds-flow diagram and contract evidence.
- Tests for pending/late/failed collection, duplicate callbacks, supplier booking failure after collection, refund/chargeback after payout, FX, partial refunds and payout ambiguity.
