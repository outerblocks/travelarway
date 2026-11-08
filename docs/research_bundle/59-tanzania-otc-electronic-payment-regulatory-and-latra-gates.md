# 59 — Tanzania OTC Electronic-Payment, LATRA and Fiscalization Gates

**Research date:** 24 October 2026  
**Classification:** Regulatory research and implementation requirements; legal counsel/authority confirmation remains required.

## 1. Company structure now recorded as a product decision

The product owner confirmed: **OuterBlocks Limited is the parent company; OuterBlocks Destinations Limited is Travelar's intended operating subsidiary/entity of record.** Use that structure in design artefacts and draft workflows; the earlier name `Travelar Destinations Limited` is superseded. Before signature or production, validate both company extracts, ownership relationship, corporate objects, TINs, business licenses, signatories, tax/accounting treatment, IP/intercompany agreements, data-controller/processor roles, merchant accounts and specific licensing/permit eligibility.

The operating company should sign operator SLAs and agent contracts if counsel confirms that role; it should apply for permits and hold PSP/settlement arrangements only in the correct legal name with authorized account ownership. Parent company branding and ownership do not replace the operating entity's licenses or contracts.

## 2. GN No. 158C of 2026 — electronic payments in specified sectors

Sources reviewed from Tanzanian legal practitioners state that the Electronic Transactions (Mandatory Electronic Payments for Specified Transactions) Order, 2026, Government Notice No. 158C, was published 30 June 2026 and came into force 1 July 2026. It applies electronic payment means to specified listed categories, including transportation fares/charges for long-distance buses, ferries, rail, air and certain other transport, hotel/accommodation and tourism-related transactions. The described electronic means include mobile money, bank transfer, EFT, cards, electronic wallets, POS, internet/mobile banking and Government electronic payment systems. The legal summaries report a six-month transition for people who were already receiving payments for listed transactions before commencement.

This is not a general ban on cash for every transaction. But Travelar's target modes overlap directly with listed categories. The responsible Tanzanian lawyer must review the official Gazette instrument and determine:

- how the order applies to each operator and each collection route (operator's own merchant, Travelar collection, marketplace/agent, white-label and call center);
- whether OuterBlocks Destinations Limited is a new recipient after commencement or meets any transition condition; which existing operators/agents qualify and what evidence proves it;
- what the transition's exact final date and operational requirements are;
- whether the phrase "electronic means" covers a particular approved POS and settlement flow; and
- how refunds, cash deposits, accidental cash receipt, offline terminal failure, consumer accessibility and exceptions should be handled.

Until confirmed, design the POS with a `payment_policy` registry scoped by jurisdiction, transaction class, legal entity, operator, channel, method, effective period and evidence/approval. Do not hard-code cash as an always-valid method for ticketing or tourism services. Provide several supported electronic methods and a documented failure fallback that does not falsely mark a transaction paid.

Evidence references:
- Endoxa Law (11 Aug 2026): https://endoxagroup.co.tz/mandatory-electronic-payments-for-specified-transactions-in-tanzania-what-you-need-to-know/
- VELMA Law: https://velmalaw.co.tz/news/mandatory-electronic-payments-for-specified-transactions-tanzania-2026/
- Official legal portal search entry for GN No. 158C: https://ardhiacademy.or.tz/legal-documents/13 (access controlled in the reviewed interface; obtain authoritative Gazette copy from counsel/government source before legal reliance).


## 2A. Do not confuse a ClickPesa BillPay Control Number with a Government control number

Travelar's product terminology must distinguish at least two concepts: (1) a ClickPesa BillPay Order Control Number created for a merchant order/invoice through ClickPesa's BillPay API; and (2) a Government Electronic Payment Gateway (GePG) control number or other official government billing reference issued through a government-authorized billing flow. They are not interchangeable merely because both are called “control numbers.” A ClickPesa BillPay reference is not, by itself, evidence that a fare or tax has been submitted to GePG, LATRA, or TRA. GePG is a separate government collection system; use it only when the transaction is genuinely a government collection or an authority-directed workflow and the responsible authority/provider has approved the integration.

For the OTC UI, name payment instructions by provider/product (for example, “ClickPesa BillPay Control Number,” “Lipa Namba,” or the exact government billing service name). Store issuer/provider, reference namespace, order mapping, amount/currency, expiry/closure rules, and official acknowledgement separately. Obtain written confirmation of cross-network acceptance, supported bank/wallet channels, and reconciliation identifiers before stating that a number works across all payment providers.

## 3. LATRA/Safari Tiketi

LATRA's 8 October 2026 public update says 14 online-ticketing providers were connected to its integrated Safari Tiketi system and describes tickets purchased online or through agents/operator offices. A separate LATRA publication warned that online-ticketing systems require approval under the 2024 online-ticketing rules and described cybersecurity and government-system interoperability among the approval criteria.

Implementation gates:

1. Decide with LATRA whether OuterBlocks Destinations Limited is applying as a system owner/provider, integrating through an already approved provider, or using another authorized distribution model. Do not presume direct public production API access.
2. Obtain current application/permit checklist, official Gazette regulations/amendments, fee schedule, approved testing/interoperability requirements, API schemas, certificate/mTLS/auth requirements, allowed endpoints, data fields, manifest upload and correction semantics, ticket QR requirements, rate limits, incident/DR obligations and change-notification process.
3. If Travelar OIMS issues tickets directly, ensure the relevant system and company approvals are completed before enabling production sales. A provider's status or relationship with LATRA is not inherited by Travelar merely because Travelar integrates with a provider.
4. Build a `RegulatoryAdapter` interface with capabilities and evidence metadata (authority, jurisdiction, version, valid dates, test/prod, approval record, field mappings, outcomes and retry semantics). Do not hardcode one country's assumptions into the core booking model.
5. Treat a government API acknowledgement as a distinct regulatory-submission state, not synonymous with customer payment, booking confirmation or ticket issuance. Store the submission reference, response, retry history, reconciliation state and any correction/cancellation events.

LATRA source: https://www.latra.go.tz/news/safari-tiketi-enhances-travel-assurance (8 Oct 2026); online ticketing rules/official requirements must be obtained from LATRA's current rules and application pack.

## 4. TRA fiscalization/VFD

Do not treat Travelar's own ticket/receipt PDF as a TRA fiscal receipt unless the relevant approved fiscal integration explicitly establishes that. Determine with TRA/tax adviser and LATRA whether a particular sale requires a VFD/EFD/VFDMS receipt, which entity is the seller/issuer, when a fiscal receipt is generated, required tax identifiers/lines and what correction/cancellation process applies. Obtain official current interface documentation and production approval before implementing direct integration.

Store separately:
- booking/ticket record and state;
- PSP/payment receipt and provider transaction reference;
- fiscal receipt reference/authority, issuance status and correction/cancellation state; and
- regulatory manifest/ticket submission acknowledgement.

A failure in a fiscal or regulatory submission must enter an exception/retry process; do not erase a successful payment or invent an approval code. The appropriate response to an unsent/unacknowledged e-ticket must be defined with the authority before launch.

Useful starting points:
- LATRA public online-ticketing portal: https://www.latra.go.tz/
- TRA official portal: https://www.tra.go.tz/
- Government Electronic Payment Gateway is a separate government-collection system and should not be assumed to be Travelar's ticket-fare PSP: https://www.gepg.go.tz/faq/

## 5. Current public-usage evidence does not override legal rules

LATRA's 8 October 2026 release reports historical use of online ticketing/payment channels and mentions cash usage in the aggregate over a multi-year period. This should be treated as usage context, not an exemption from GN No. 158C. A new product's legal payment configuration must be based on the rule and counsel's written interpretation, not legacy behavior.

## 6. Launch blockers

- Corporate documents confirm OuterBlocks Destinations Limited is registered, under OuterBlocks Limited, and authorized for the intended contracting and marketplace roles.
- Counsel signs off the effect of GN No. 158C for operators, agents, call center, white-label and each Travelar payment model.
- Each approved payment method is tested and reconciled; fees and customer disclosures are compliant.
- LATRA permits/current integration acceptance and any required operator approvals are complete before covered ticketing goes live.
- TRA/VFD fiscalization responsibilities and technical method are documented; production credentials/approval are verified if applicable.
- Refund/cancellation, payment failure, regulatory submission failure, late payment and offline recovery procedures are tested and assigned.

This research is not legal advice and does not itself prove regulatory compliance.
