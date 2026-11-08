# Stage 20 source document — Corporate Identity, Channel Attribution, White-Label and Agent Commerce

**Date:** 24 October 2026  
**Status:** Historical Stage 20 delta, corrected for the Stage 21 owner decision; current entity and evidence status are stated below. This document supplements the prior Travelar baseline.

## Stage 21 current entity correction

The product owner has confirmed **OuterBlocks Limited as the parent company** and **OuterBlocks Destinations Limited as the intended Travelar operating subsidiary/entity of record**. This supersedes the then-current operating-company assumption in this Stage 20 source document and the earlier draft name `Travelar Destinations Limited`. Use the intended structure in current product, finance, onboarding, contract-template and regulatory designs. Documentary verification of registered entities, ownership, signatory authority, corporate objects, TIN/licences, IP/intercompany agreements, merchant/payout accounts and regulated activity eligibility remains mandatory before execution.

## 1. What is new versus already established

Already established in the prior baseline: Travelar is the unified product brand; HIMS/OIMS/agent workspaces have separate authorization scopes; channels must be server-attributed; commission and supplier terms are versioned; all six booking modes are first-class; white-label/API capability has been a proposed distribution direction; tenant isolation, audit, ledger integrity and external authorization gates already apply.

New clarifications to model: (a) the explicit parent/operating-subsidiary structure above; (b) a more detailed channel taxonomy and channel-specific commission hypothesis; (c) explicit OIMS-powered white-label domains and operator branch/agent subportals; (d) pre-funded Travelar agent float as a possible selling model; (e) a more specific operator onboarding approval sequence and cross-department escalation matrix.

## 2. Corporate hierarchy and brand — owner decision confirmed; legal evidence still required

The accepted intended structure is:

- Parent company: `OuterBlocks Limited`.
- Intended Travelar operating subsidiary/entity of record: `OuterBlocks Destinations Limited`.
- Unified product/market brand: `Travelar`.

The earlier draft name `Travelar Destinations Limited` is superseded and should not be used. The owner's intended structure is a product decision; verify registry status, parent/subsidiary relationship, tax accounts, regulatory licences, payment accounts, IP assignment and authority to contract before representing these as legally completed facts.

### Required decision gate

The product-owner company decision is recorded, so a second name decision is not needed. Before execution:

1. Obtain current BRELA extracts/status, certificates, constitutional documents and ownership/director information for both OuterBlocks Limited and OuterBlocks Destinations Limited.
2. Confirm TIN/tax registrations, permitted business objects, bank/PSP merchant names, contract authority, employment, IP ownership, privacy-controller/processor roles and licences with legal/accounting advisers.
3. Make a signed entity-role matrix assigning the legal contracting party, merchant/collector, payout beneficiary, consumer-service provider, fiscal issuer, employer and data-controller/processor for each mode/channel.
4. Confirm that the operating entity is eligible for the relevant regulator approval and provider agreements.
5. Only then publish legal footer language. A public brand footer is a legal representation, not harmless placeholder copy.

BRELA's official Online Registration System states that company information extracts and status search services are available: https://ors.brela.go.tz/ . The service is available; the actual current registry status of the intended parent/subsidiary structure must be checked against company documents.

## 3. One brand, multiple product surfaces

Use Travelar as the unified customer-facing and B2B product brand, with descriptive product surfaces (Travelar HIMS, Travelar OIMS, Travelar Agent Portal, Travelar White-Label/API). Avoid launching separate consumer-facing sub-brands unless leadership later approves a documented reason.

This product-brand decision does not collapse legal identities or merchant roles into one. Each channel needs configuration for:

- product/brand display name and approved logo assets;
- domain and verified tenant/domain binding;
- legal operator/merchant/distributor disclosure text and its effective version;
- terms/privacy/refund/support links applicable to the sale;
- enabled modes, destinations, providers, locales and payment routes;
- app/channel identifier, source-attribution mapping, and allowed APIs;
- allowed theme and white-label customization limits.

Do not publish claims such as “LATRA compliant”, “official ticket”, “secure checkout”, “24/7 support” or “mobile app available” unless the relevant approval, capability, operating hours or published app store listing is evidenced and current.

## 4. Channel attribution registry — immutable source event, configurable commercial outcome

### 4.1 Candidate channel taxonomy

Use stable database-managed channel identifiers. The following are proposed seed records, not an exhaustive hardcoded enum:

- `TRAVELAR_B2C_WEB`
- `TRAVELAR_B2C_APP`
- `TRAVELAR_AGENT`
- `TRAVELAR_CALL_CENTER`
- `OPERATOR_OTC_POS`
- `OPERATOR_AGENT`
- `OPERATOR_CALL_CENTER`
- `OPERATOR_WHITE_LABEL`
- `PARTNER_API`
- `SUPPLIER_DIRECT_OR_HANDOFF`
- `CORPORATE_OR_GROUP_SALES` (only if a real workflow is approved)

Channel codes are configuration/reference data; source evidence and workflow state are immutable transaction facts. Do not let an external client submit a free-form `origin_source` and determine commercial outcomes.

### 4.2 Store facts separately from policies

At booking creation, the backend should persist an immutable origin-attribution event with as many applicable fields as exist:

- booking/order ID and event ID;
- channel ID and channel-policy version;
- authenticated actor/user and organization/tenant;
- operator ID and branch/terminal/shift, if relevant;
- agent/contract ID and authenticated partner credential ID, if relevant;
- verified white-label domain ID or approved application client ID;
- mode, market, supplier/provider, timestamp and correlation ID;
- attribution method and source evidence; no secrets or full payment credentials;
- applicable commercial agreement ID/version and calculation version captured into the quote/order snapshot.

If correction is necessary, add a supervised correction event referencing the original record, reason, initiator, approver and supporting evidence. Never erase the original source fact. Attribution correction must not rewrite an already posted ledger entry; issue authorized reversing/correcting accounting entries as necessary.

### 4.3 Do not make `origin_source` the only commission rule

The channel is one input into a versioned contract/rule decision. Commission must also consider the signed operator/supplier agreement, mode, product, route/market, seller/merchant role, booking date, eligible fare base, refunds, discounts, taxes, payment route and any documented exemption.

Keep distinct concepts for:

- commercial customer/account ownership;
- supplier/service provider;
- merchant/collector of record;
- contracting entity;
- personal-data controller/processor roles;
- commission beneficiary and commission payer;
- payment settlement recipient.

These concepts can be different parties and should not be collapsed into a single “who owns client” field.

### 4.4 Channel policy candidates from the proposal

The owner proposed that Travelar B2C, Travelar agents and Travelar call-center bookings be commissionable; operator walk-in POS, operator agents and operator call-center transactions have zero Travelar marketplace commission; and Travelar agents receive incentives out of Travelar's own agreed share. These are valid candidate commercial rules to put into configuration, but they are not yet globally approved contracts.

Before activating a zero-commission channel, confirm that this is not intended to waive separately contracted SaaS charges, payment costs, regulatory obligations, white-label/API fees, taxes or a mode-specific fee. A `0% marketplace commission` is not equivalent to “all Travelar services are free”. Each operator's agreement should state exactly which fee classes apply to each channel.

The proposal did not fully specify the commission treatment for white-label/API bookings; keep it `decision_required` per partner agreement. Do not silently derive it from B2C or operator-agent treatment.

### 4.5 Agent commissions and pre-funded float

The agent model needs separate concepts for (1) agent commission/incentive payable to the agent, (2) agent pre-funded float/credit used to authorize a sale, (3) Travelar commission earned from the supplier/operator, and (4) customer payment. These are not the same balance.

If a pre-funded agent float is legally and contractually approved:

- represent it through the existing double-entry, append-only accounting architecture; never store it as a freely editable numeric balance;
- confirm top-ups through an authoritative bank/PSP event and reconciliation before crediting the ledger;
- enforce scoped, configured limits, currencies and permitted transaction types;
- prevent unintended agent-to-agent/customer transfers and cash-out unless explicitly authorized;
- make sale reservation, debit, reversal, refund and payout idempotent and auditable;
- maintain distinct liabilities/receivables and maker-checker controls;
- reconcile statement, bank/PSP movement and the float ledger daily;
- do not activate stored-value/wallet behavior before Tanzanian counsel/PSP classification and any necessary BoT authorization are confirmed.

A UI labelled “wallet” is not evidence that the legal product may be operated as stored value.

## 5. Operator onboarding and go-live control

The proposed onboarding flow is a useful workflow candidate. Configure it as a state machine with explicit task ownership and evidence, not as a free-text status field:

1. Lead/application created by operator or authorized Travelar operations user.
2. Legal/KYB reviews registration, TIN, authorized signatories, operator/business licences, route/vessel/property/activity authority and identity documents appropriate to the service.
3. Finance validates the settlement beneficiary/account through a controlled out-of-band process; payout activation stays locked until required Legal and Finance approvals are recorded.
4. Operator master account and tenant are provisioned in a disabled/pending state; invitations are single-use, expiring, and scoped.
5. Operator configures applicable routes/stops/vehicles/seat maps or classes/schedules/fare tables/branches/users/supplier data.
6. Operations tests data quality and workflows; Engineering/Integration verifies each actual provider/regulatory connection; Legal/Compliance verifies current authorization; Finance verifies fare/tax/receipt/payment/payout conditions.
7. Go-live approval records which modes, markets, providers, channels, routes and dates are enabled. Activation must not turn on unrelated modes automatically.
8. Periodic license expiry/reverification, account changes, serious incidents and contract termination trigger review/suspension workflows with evidence and escalation.

The precise role order and approval gates must be tailored to the actual agreement, regulator and provider; this proposed flow does not establish a regulatory certification process by itself.

## 6. Escalation matrix additions

Register as configurable case-routing rules with owners and urgent escalation paths:

| Case | Primary owner | Next escalation | Required evidence/controls |
|---|---|---|---|
| Booking/ticket dispute | Customer Experience | Operations for trip/service issue; Finance for money/refund issue; Engineering for integration defect | Booking/source snapshot, provider ticket/status, payment/ledger references, customer communications |
| Payout/settlement discrepancy | Finance/Reconciliation | Engineering if integration/ledger sync; Legal/Compliance if beneficiary/sanctions/fraud concern | Bank/PSP statement, payout ID, beneficiary history, ledger journals, contract and approvals |
| Suspected fraud/regulatory breach | Security/Operations triage | Legal/Compliance and designated executive; Finance controls relevant payout | Preserve evidence; apply scoped, authorized payment/payout suspension; never erase audit logs |
| Provider or regulatory adapter outage | Integration/Ops on-call | Legal/Compliance if mandatory control unavailable; Customer Experience for customer notice | Provider state, queued events, affected transactions, retry and reconciliation plan |

Use these routes as default workflow templates. The company must assign actual staff, authority, coverage and service levels. Do not invent 24/7 coverage until it is staffed/contracted.

## 7. Additional unresolved questions

- Which verified legal entity signs each type of contract, owns the domain/IP, employs Travelar staff and acts as controller/processor/merchant/collector?
- Are the operator channel fee rules consistent across six modes, country, white-label, APIs, POS and call-center?
- Is the Travelar agent float merely an agency credit ledger or could it meet a regulated wallet/stored-value/payment-service definition?
- Who owns customer relationship/support, and what does that mean in contracts and privacy notices? This is separate from the user's channel source.
- Which party is responsible for fiscal invoices and electronic payment collection under each transaction route?

## 8. Sources

- BRELA Online Registration System: https://ors.brela.go.tz/
- LATRA's 8 October 2026 public statement identifies 14 online-ticketing providers connected to Safari Tiketi: https://www.latra.go.tz/news/safari-tiketi-enhances-travel-assurance
- LATRA's 14 June 2025 statement says operators can own their ticketing systems or choose LATRA-authorized providers; it also discusses connections to Safari Tiketi and TRA EFDMS: https://www.latra.go.tz/news/watuo-huduma-za-tiketi-mtandao-wasiosajiliwa-marufuku-julai-01-2025
- Bank of Tanzania payment system regulation portal: https://bot.go.tz/PaymentSystem/regulations?lang=en

These sources establish the existence of official procedures and public statements, not the status of a specific Travelar entity or entitlement.
