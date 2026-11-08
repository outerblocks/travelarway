## Stage 21 clarification — OTC electronic channels and legal entity

The product owner has confirmed OuterBlocks Limited as parent and OuterBlocks Destinations Limited as the intended operating entity. ClickPesa public docs can inform an electronic-payment options catalog for OTC, but exact account ownership, channel enablement, fees and legal applicability remain evidence gates. Legal counsel must apply GN No. 158C to each covered transaction/channel and the actual recipient/merchant model. See Documents 56 and 59.

# Stage 20 — Tanzania Regulatory Adapter and Electronic-Payment Obligations

**Date:** 24 October 2026  
**Classification:** Primary-source findings plus unresolved regulator/provider dependencies. This is not legal advice.

## 1. Critical new legal evidence: mandatory electronic means for specified payments

The Tanzania Revenue Authority hosts Government Notice No. 158C, *The Electronic Transactions (Mandatory Electronic Payments for Specified Transactions) Order, 2026*, dated 30 June 2026, made under section 13(2) of the Electronic Transactions Act. The Order says it comes into operation on 1 July 2026 and provides that a person who makes or receives payment in respect of a scheduled transaction shall make or receive it through electronic means. Electronic means is defined to include mobile money, bank transfer/electronic funds transfer, payment card, electronic wallet, point-of-sale device, internet/mobile banking or Government electronic payment system.

The schedule expressly lists payments for:

- bus rapid transit, ferries, bridges, long-distance passenger bus, online taxis, air transport, railway transport and parking;
- accommodation, food and beverages in hotels, restaurants and cafés;
- tourism-related services;
- other listed sectors outside Travelar's immediate product scope.

The Order has a transitional provision for a person receiving payments in respect of a specified transaction immediately before commencement: that person shall put electronic payment means in place within six months. This does not itself resolve how the transition applies to new entrants, different legal entities or specific transaction/channel arrangements. As at 24 October 2026, this is a time-sensitive go-live gate. Counsel should confirm the transition's end date and applicability; do not assume that an OTC channel permits cash simply because the operator historically took cash.

### Required Travelar implementation

Create an effective-dated `payment_method_eligibility_policy` keyed by jurisdiction/market, service/mode, transaction type, merchant/collector, channel, effective dates and legal evidence reference. It must specify allowed collection methods and the policy state, with a controlled process to update it after legal review. A country configuration cannot override a mandatory legal rule. If a payment route is not compliant or its status is unknown, the transaction must not proceed through that route; offer a permitted alternative or clear unavailable state.

Operator POS and call-center can remain sales channels, but checkout/tender methods must obey applicable electronic-payment rules. Keep cash drawer/shift reconciliation features for lawful scenarios and past-period reconciliation, but do not default to cash acceptance for scheduled transactions without an affirmative legal basis. Do not delete historical cash records.

**Source:** official two-page order: https://www.tra.go.tz/images/uploads/acts/GN158C-THE_ELECTRONIC_TRANSACTIONS_%28MANDATORY_ELECTRONIC_PAYMENTS_FOR_SPECIFIED_TRANSACTIONS%29_ORDER%2C_2026-TGPA.pdf

## 2. LATRA Online Ticketing and Safari Tiketi

LATRA's 2024 Online Ticketing Regulations establish an approval framework for the online ticketing system. Its public 6 July 2025 statement says Regulation 5 includes system approval criteria, including cybersecurity protection and ability to connect with government systems; the statement also describes the legal direction to connect online-ticketing systems to Safari Tiketi. LATRA's 14 June 2025 statement says operators may own their own online ticketing system or use a LATRA-authorized provider, and states that online ticketing systems must connect to Safari Tiketi and TRA EFDMS to continue providing the service. On 8 October 2026, LATRA reported 14 online-ticketing service providers had connected to Safari Tiketi and named those providers.

These public notices do **not** provide enough evidence to conclude that:

- any new platform can obtain a public production API without approval;
- all 14 connected providers have identical current approval, certificate scope or production readiness;
- Travelar has a right to call LATRA CeTS directly;
- Travelar can independently validate all operator licences, set/override tariffs, submit manifests, or issue a regulatory-valid QR ticket without approval and technical documentation;
- connection to the regulator is the only requirement for the operator or ticketing system to be lawful.

### Regulatory adapter capability catalogue

Travelar should define an adapter boundary with explicit capability records, for example:

- `operator_licence_lookup`;
- `approved_tariff_lookup_or_validation`;
- `ticket_registration_or_verification`;
- `passenger_manifest_submission`;
- `ticket/booking_cancellation_or_refund_reporting`;
- `fiscal_receipt_or_sales_record_submission`;
- `route/vehicle/driver eligibility checks`;
- `provider health, status query and reconciliation`.

These are *requested capability slots*, not a claim that every regulator offers these APIs. Each capability is unavailable by default until the regulator/provider confirms the interface, rights, auth method, field schema, rate/retention limits, test environment, operational SLA and production approval. If a regulator defines only a subset, configure only the verified capabilities. Keep manual/portal fallback only if the regulator expressly permits it and design it as a documented case workflow, not a hidden bypass.

Each event and response should be persisted with an internal request/event ID, authority/provider reference, payload schema version, attempted/accepted/rejected/unknown state, timestamps, non-sensitive evidence, retry strategy, next action and reconciliation status. Use an outbox/worker pattern for asynchronous submission; retries must be idempotent or followed by a status query before re-submission. If a mandatory regulatory service is down, apply a regulator-approved continuity policy; do not silently fail open and issue a ticket as if submission succeeded.

### LATRA activation gate

Before Travelar becomes the system owner or issues tickets through its own bus OIMS, obtain current dated written confirmation of:

1. the legal entity and activities eligible to apply;
2. current application/certificate/renewal fees and scope;
3. system security, interoperability, continuity and certification requirements;
4. current integration/interface specification for CeTS/Safari Tiketi and TRA EFDMS;
5. test and production endpoints, credentials, signing/encryption, identity and key rotation;
6. permitted agent, marketplace, call-centre, POS, white-label and API roles;
7. how operator-owned systems and approved vendor-provider models differ;
8. tariff/fare and fiscal receipt responsibility;
9. outage/contingency procedure and evidence-retention obligations.

Source evidence:
- LATRA, 8 October 2026, provider connection statement: https://www.latra.go.tz/news/safari-tiketi-enhances-travel-assurance
- LATRA, 14 June 2025, system authorization and government integration statement: https://www.latra.go.tz/news/watuo-huduma-za-tiketi-mtandao-wasiosajiliwa-marufuku-julai-01-2025
- LATRA, 6 July 2025, Regulation 5 criteria and government-system integration: https://www.latra.go.tz/news/prof-kahyarara-aitaka-latra-kuhakikisha-kampani-za-tiketi-mtandao-zinaunganisha-mifumo-yao-na-ya-serikali

## 3. TRA EFDMS / EFD / VFD is a separate fiscal capability

TRA states that an EFD is an electronic receipt-issuing machine authorized by the Commissioner General and that a VFD is a cloud-based digital system approved by the Commissioner General to capture, transmit and keep sales records electronically. TRA also describes fiscal receipts/invoices as those issued using a fiscal device, Government electronic payment gateway or another electronic system approved by the Commissioner General. TRA identifies approved EFD/VFD suppliers.

A Travelar PDF ticket, thermal receipt, PSP payment receipt and a fiscal receipt are not automatically the same artifact. Do not implement `fiscal_receipt_issued = true` just because a ticket or receipt PDF was generated. Store separate states and external references for ticket issuance, PSP receipt/payment, fiscal submission, fiscal acceptance/rejection and correction/credit-note/refund handling as applicable to the approved integration.

### Fiscal adapter requirements

- Ask TRA/adviser who must issue the fiscal invoice: operator, Travelar contracting/merchant entity, approved platform/provider or a combination for separate service/commission charges.
- Request accepted VFD/EFDMS suppliers, API docs, certification and sandbox/test path, production access, receipt fields, numbering/QR/signature rules, offline requirements, refund/void/credit note treatment and retry/status APIs.
- Use an approved provider/adapter arrangement unless OuterBlocks has explicit authority and the technical/approval requirements to operate the fiscal system itself.
- Avoid double fiscalization (two parties issuing the same taxable sale) and avoid a gap where neither party issues the legally required invoice.
- Persist both source sale data and authority response references. Corrections should preserve the original record and link an approved corrective event.
- Store effective-dated tax rules and rates only after tax advisers confirm each country/service/jurisdiction. Do not hardcode a generic VAT rate across travel modes or Mainland/Zanzibar.

**Source:** Tanzania Revenue Authority, EFD/VFD suppliers and explanatory material: https://www.tra.go.tz/page/efd-vfd-suppliers

## 4. Regulatory profile, market scope and time zones

All applicable country and regulatory settings should be represented as versioned policies, not a broad `country = TZ` conditional sprinkled through code. The model should be able to distinguish country, jurisdiction (including Mainland Tanzania and Zanzibar where legally relevant), market, mode, operator, route/product, effective date and source evidence.

Recommended record categories:

- authority and obligation registry (law/regulation/circular/permit; status, jurisdiction, effective/expiry date, source URL/document, reviewer, reviewed-at);
- regulatory adapter/provider and verified capability registry;
- permitted transactional role(s) per legal entity/channel/provider/mode;
- ticket/fiscal/manifest requirements and state machine;
- payment-method eligibility by transaction, date and collection role;
- tariff sources/ceilings or fare constraints where verified;
- reporting/retention/residency policy per data classification;
- review/expiry reminders and evidence-driven go-live gates.

Time zones should be stored as IANA time-zone identifiers per station/port/property/market and rendered locally. Store timestamps as timezone-aware instants (e.g. UTC) plus the relevant local zone/date and service's scheduled local time where required. Don't assume a single country time zone for all future countries or all operations. Currency and exchange-rate snapshots must similarly remain separate from timezone and market configuration.

## 5. Required tests

1. Transaction in a scheduled category cannot choose a prohibited collection method on/after the applicable effective date.
2. A cash receipt history from an earlier period stays readable/reconcilable after current cash tender is disallowed for a route.
3. A new provider is not activated merely because adapter code compiles or the sandbox test succeeds.
4. An operator with no verified LATRA/fiscal route cannot create a live regulated ticket through a bypass channel.
5. Regulatory provider timeout produces `UNKNOWN/PENDING` plus reconciliation, not a false `SUCCESS`.
6. A duplicate regulatory/fiscal submission does not produce two issued tickets or silently lose a receipt response.
7. Corrected fare/tax/receipt configuration does not rewrite a past booking, fiscal artifact or posted accounting entry.
8. Main and Zanzibar-facing services use the correct reviewed jurisdiction/policy; no assumption that Mainland rules automatically settle Zanzibar obligations.

## 6. Decision status

The requirement to design regulatory/fiscal adapters is accepted as an architecture requirement. Direct API access, exact capabilities, approved provider, entity eligibility, ticket and receipt semantics and production certification remain **unknown / direct confirmation required**. Electronic-payment obligations are a newly verified legal gate requiring urgent written legal interpretation for the planned channel/entity setup.
