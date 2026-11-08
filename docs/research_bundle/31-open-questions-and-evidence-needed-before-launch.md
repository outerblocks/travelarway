# Open Questions and Evidence Needed Before Launch

> **Stage 14 product-scope clarification (24 October 2026):** Train and Experiences are first-class Travelar modes, not future modes. Their requirements belong in the current product, architecture, integration and test baseline. Per-country activation may remain gated until authorized suppliers, contracts, ticket/voucher flows and support/refund handling are verified. See `40-train-and-experiences-first-class-mode-research.md`.
**As of:** 22 October 2026  
**Purpose:** Turn unresolved legal, supplier and commercial issues into evidence requests. An unanswered question is not a green light.

## P0 — launch blockers

### A. LATRA / Safari Tiketi / CeTS

1. LATRA's 30 June 2026 notice lists amendments to private-hire, freight and passenger-vehicle licensing regulations, not the 2024 Online Ticketing Regulations. Have any separate later instruments, gazette notices or fee circulars amended online-ticketing requirements, approved-system eligibility, reporting duties, ticket requirements or certification? Obtain the current consolidated text.
2. What is the current official list of online ticket-system owners with unexpired approval certificates? Which providers are approved, merely connected, in testing, suspended or approved only for a specific market/service?
3. What is the permitted route for a new applicant: own system-owner approval, distribution through a current approved system, appointed agent, or another status? Which requirements apply to Travelar's public marketplace, OIMS, Travelar agents, operator agents, call center, USSD and marshal app?
4. Does OuterBlocks Destinations Limited, as the intended online-ticketing system applicant/operator, satisfy the current legal-entity, local ownership, company registration, staffing, business-premise and business-object requirements? Verify the statutory test, including ownership/relationship with parent OuterBlocks Limited, against current LATRA rules and legal advice. The 2024 rules say the system must be Tanzania-owned/local and registered in Tanzania; clarify the exact test of “Tanzanian” ownership and whether the app owner and legal entity must be the same.
5. Obtain the authoritative EFDMS technical integration specification: authentication, fiscal receipt content, idempotency, numbering, response semantics, retry policy, cancellation/refund/reversal, reconciliation, certification environment, uptime and reporting.
6. Obtain the CeTS API or integration pack: data schemas, route and schedule identifiers, operator onboarding, vehicle identifiers, passenger record, ticket ID, validation/QR flow, manifest format, webhook/polling, security, rate limits, production access, test data and version changes.
7. What support and incident obligations from the 2024 regulation remain current? Confirm the exact interpretation of the 30-minute fault notice and three-hour resolution/reporting wording, continuous availability, and seven-day notice before suspending a provider.
8. How are LATRA fees calculated/collected/segregated for online and cash sales? Who deducts and remits them? What should happen on refund, void, partial trip, operator cancellation and failed fiscal submission?
9. What application, certification, renewal and recurring fees currently apply to the online-ticketing permit? The 2024 instrument lists TZS 50,000 application and TZS 5,000,000 certificate fee with two-year validity. The separate July 2026 notice reviewed does not list this instrument; confirm whether another later instrument or fee circular changed these amounts before final budgeting.
10. Which ticket fields, printed-ticket requirements, validation semantics, passenger manifests and data-retention rules are mandatory for bus services? Which differ for charter, child travel, international routes and offline boarding?
11. Is system certification country/market scoped, route scoped, operator scoped or platform-wide? What happens to current tickets and customer refunds if provider approval is suspended or revoked?
12. Is there a documented transition obligation/data-export standard, and can Travelar move customer/operator records to another authorized provider without losing ticket histories?

**Requested evidence:** current consolidated legal instruments; application pack; official fee schedule; current certificate list; API/integration guide; test/security checklist; EFDMS/CeTS certification document; example approved ticket and manifest; service-level and incident reporting template; written role determination for Travelar.

### B. OuterBlocks Group corporate structure and business activity

1. Obtain a current BRELA company extract, incorporation certificate, business objects, directors/shareholders, registered office and status.
2. Which business activity code and business licence class does the competent licensing authority require for Travelar as (i) software provider, (ii) online bus/ferry ticket distributor, (iii) agent, (iv) payment merchant, and later (v) travel agent/air-ticketing provider?
3. Does a Tourist Agency Licence apply to the proposed bus/ferry marketplace itself or only to later modes such as air ticketing, tours, stays, package travel and experiences? Which entity must hold it, and does Travelar's brand or website language matter?
4. What office/premise evidence, tax clearance, TIN and audited financial statement is required for each permit? How are requirements adapted for a startup without audited financial-year records?
5. Which taxes/returns apply to marketplace commission, principal resale/markup, service fee, operator payout, payment fee, discounts/promotions and foreign-currency bookings?

**Requested evidence:** company record; business-license determination; written tourism-license classification; tax advice from Tanzanian adviser; current forms and fees from the authorities.

### C. Ferry and maritime operations

1. Does Travelar as ticket marketplace/agent need a separate TASAC licence or approval, and does the answer change if it sells tickets, collects funds, issues vouchers, reschedules, or is named in customer terms as the seller?
2. What TASAC licence/safety certificate/route/operating evidence must each ferry operator supply to Travelar? What are valid source records and renewal monitoring requirements?
3. What current rules and operational protocols control passenger manifests, boarding validation, class capacity, age/residence fares, IDs, no-shows, passenger transfer, substitute vessel, weather/service disruption and refunds?
4. For Dar es Salaam–Zanzibar and other Zanzibar-connected journeys, which approvals and laws apply on the Mainland and Zanzibar sides, and which authority is the authoritative record for route/vessel/pax manifest?
5. Is any fare/tariff or marketplace surcharge approval needed? Which transaction fees may be added to fare, and how should refunds affect taxes/commission?
6. Does the operator expose an API/agent channel; what data can be cached and for how long; what are the inventory locking semantics and ticket ID/validation rules?

**Requested evidence:** TASAC written classification; current regulations and tariff rules; operator licences/safety evidence; written operator distribution contract; route-specific API/manifest/boarding specification; Zanzibar authority/legal advice for Zanzibar routes.

### D. Payments, funds, tax and accounting

1. For each payment provider candidate, which legal entity and licence covers the product in Tanzania Mainland? Confirm merchant acquisition, mobile-money collection, card acceptance, payouts, refunds, webhook delivery and settlement products available to OuterBlocks.
2. Can Travelar collect as a marketplace merchant and remit operator proceeds? Does this require any additional BoT licence/approval or a PSP-agent structure? What changes if funds pass through a Travelar-controlled account, are held pending departure, are split among multiple suppliers or support refunds/credits/wallet balances?
3. Who is legally the supplier and merchant of record in bus and ferry contracts? Which party owns the fare receivable, bears payment disputes and chargebacks, and owes the passenger refund?
4. Can customer payment fees/surcharges be imposed for each method? What do local law, BoT, PSP merchant agreement, card schemes and consumer disclosures allow? Is it better to absorb fees in commercial pricing rather than itemize a surcharge?
5. What fiscal receipt or tax invoice must be issued for the fare and for Travelar's commission/service fee? What is required when PSP collection, ticket issuance and settlement occur at different times?
6. What exact settlement records and timing are available from operators and PSPs? Can Travelar reconcile by transaction, not only daily batch totals?
7. How should FX, foreign cards, cross-border PSP settlement and supplier currency conversion be recorded? Who sets exchange rate, when is the rate locked, and who bears rate movements/refunds?

**Requested evidence:** BoT/counsel classification based on diagram; provider licences, contracts and prices; sample webhooks/reconciliation files; operator merchant/settlement terms; TRA/tax opinion; accounting policy signed off by finance adviser.

### E. Personal data and cross-border transfers

1. Should OuterBlocks register as controller, processor or both for marketplace passengers, operator staff, call-centre records, marketing, analytics and OIMS-hosted operator passenger records? Are separate registrations required for separate legal entities/purposes?
2. What documentation will PDPC accept where a private organization is new and has no audited year? What current fee tier applies and how long does processing take?
3. Which exact data exports to global email, SMS, analytics, crash reporting, customer support, PSP, GDS, authentication, cloud backups and offshore support are treated as cross-border transfers? Which permits and contracts are needed before transfer?
4. Does PDPC require local hosting/replication for any categories in this actual use case, or is a transfer permit with safeguards sufficient? Which data can be stored in a regional environment under which conditions?
5. What are current breach-notification timelines and recipient/customer communication obligations? The Act language surfaced in secondary legal analysis uses “without undue delay”; confirm precise interpretation against the Act/Regulations and PDPC guidance.
6. Which fields are necessary for bus tickets and manifests? Can gender, country of residence, ID number or ID images be avoided unless the relevant operator/regulator requires them? What additional rules apply to children and sensitive data?
7. What is the retention schedule for manifests, tickets, logs, payment records, call recordings and support attachments? How is erasure balanced with legal retention, disputes and audit obligations?
8. Is a DPIA required for Travelar's large-scale passenger processing, children, identity data, combining operator and payment sources, or automated fraud scoring? What form and prior review does PDPC expect?

**Requested evidence:** PDPC registration and cross-border-transfer guidance; written replies on startup documents and data-location cases; current legal text and official breach guidance; counsel-validated data map/DPIA; processor clauses and subprocessor list.

## P1 — commercial and operational validation

### Competitors and operator workflows

- Request current demo and sample customer/operator contract from Busbora, OTAPP and 3–5 other LATRA-listed providers.
- Verify whether a provider's listing is current approval, and what use cases are authorized.
- Test search, seat/segment inventory, cashier sales, cash payments, tickets, manifests, validation, refunds and exportability.
- Interview at least 8–12 operators across operator size, route types, regions and channel mix; include one or more ferry operators.
- Do not claim a competitor gap until the workflow has been observed and evidence recorded.

### Consumer and payment UX

- Validate guest booking retrieval, pre-checkout price disclosure, booking correction, ticket delivery and secure recovery against the Electronic Transactions Act and contract terms.
- Document local support channels and dispute escalation with the operator and PSP.
- Test low-connectivity/failure states, but don't launch USSD until TCRA numbering, gateway contract, payment and LATRA ticket path are clear.

### Operational resilience

- Get regulator/provider requirements for service monitoring, backup/recovery, emergency ticketing, schedule disruption, provider outage and approved-system transition.
- Establish a single source of truth for inventory and fares before concurrent live bookings.
- Define ticket-state reconciliation when payment succeeds late, inventory expires, fiscal submission fails or a cancellation reaches only one system.

## Questions to ask by stakeholder

### LATRA — first meeting agenda

1. Please identify the currently effective legal instruments for online ticketing and transport operator licensing. We have reviewed LATRA's 30 June 2026 notice, which lists amendments to private-hire, freight and passenger-vehicle licensing regulations; please identify any separate later amendments or fee notices for online ticketing.
2. What written category would LATRA apply to Travelar if OuterBlocks owns a consumer marketplace but uses an approved ticketing system; if it also hosts an OIMS; if it becomes an approved system owner?
3. Is there an agent route? What registration/tax requirements and agreement are required for an online marketplace, call centre, agent portal and USSD channel?
4. Please provide the up-to-date approved list, system certificate status, formal certification checklist, fee schedule and integration documents.
5. Please clarify EFDMS/CeTS API access, source-of-truth records, testing and data ownership.
6. What exactly must occur before a ticket can be displayed as confirmed? What if payment succeeds but EFDMS/CeTS submission fails?
7. What exact ticket/passenger-manifest fields, retention, incident, service availability and business-continuity requirements are enforced today?
8. How do ticket cancellations, refunds, fare changes, partial routes, cash sales and fare remittance work in the central system?

### TASAC and Zanzibar authority — first meeting agenda

1. Is ticket distribution by a software marketplace a licensed/approvable maritime activity? Which precise activities change the answer?
2. Which operator/vessel/route licences and safety records must Travelar verify and how often?
3. What passenger manifest and ticket-validation formats and deadlines are mandatory? Are there APIs or approved submission methods?
4. How do tariff/fee rules apply to passenger class fares, commissions and customer fees?
5. What separate approvals apply to routes that embark/disembark in Zanzibar?

### PDPC — first meeting agenda

1. Which registrations are required where OuterBlocks determines the purpose of marketplace and OIMS processing but operators supply the data and choose operational rules?
2. What supporting documents may a newly incorporated company submit if it has no audited financial-year report?
3. What current fees and service times apply to controller/processor registration and cross-border-transfer permit applications?
4. What is the correct procedure for cloud backups, API processing by offshore suppliers and remote support access?
5. What controls or forms are expected for a DPIA involving high-volume passenger records and children?
6. What breach reporting schedule and notices should be used where the Act says “without undue delay”?

### Bank of Tanzania / payments counsel — first meeting agenda

1. Does the proposed collection/split/payout/settlement model require an additional licence or approval for OuterBlocks?
2. Are marketplace agents, merchant facilitators, payment aggregators or sub-merchants treated differently in this scenario?
3. Which providers/product legal entities and licences cover the intended mobile-money, bank, card and payout flows?
4. What constraints apply to customer payment surcharges, refunds, stored balances and settlement delays?

### TRA — first meeting agenda

1. What EFDMS integration/testing requirements apply to a LATRA-authorized ticket system and to a Travelar agent/distributor?
2. Who issues fiscal receipts for bus fare vs Travelar commission/service fees under agency, principal-resale and marketplace models?
3. How should refunds, cancellations, discounts and split settlement be reflected fiscally?
4. Which tax registration and invoice requirements apply to the services that OuterBlocks will actually supply?

### Tourism licensing authority / business-licensing authority

1. Which business licence category and sector registration applies to Travelar's bus/ferry marketplace, OIMS software service and passenger app?
2. Does this exact marketplace fall under Tourist Agency Licence or travel-agent licensing? What additional requirements apply to flights, accommodation or experiences?
3. Which documents, financial thresholds, fees, expiry and renewals apply to a startup?

### Each operator or system vendor

1. Which system is authoritative for schedules, fares, capacity, ticket number and passenger manifest?
2. What exact permission permits Travelar to distribute and issue the ticket? Which LATRA/TASAC/Zanzibar approval covers the system and operator?
3. What does the API support in production versus sandbox, affiliate link or redirect?
4. What are rate limits, inventory holds, idempotency semantics, cancellation/refund calls, error codes and outage process?
5. Which party receives gross customer money, fees and payouts? When are operator funds available and who bears disputes?
6. What rights does the operator retain over its data and what export is available on termination?

## Acceptance rule for closing questions

A question can be marked “resolved” only when the answer is supported by one of:

- applicable current primary legislation/regulation;
- written regulator response or official circular;
- executed supplier/PSP/operator agreement;
- current official API/technical specification plus production authorization;
- a qualified local legal/tax opinion tied to Travelar's actual contract and funds/data flow;
- reproducible integration/test evidence.

A verbal meeting note is useful, but legal or production-critical answers should be confirmed in writing.


## Stage 4 — PSP, money flow and accounting questions (added 23 October 2026)

### P0 — must resolve before collecting production customer money

1. **Payments regulatory role:** Submit the exact customer-to-PSP-to-operator money flow to Tanzanian payments counsel/BoT. Does OuterBlocks' proposed collection, netting, splitting, payout and refund process require any additional approval or licensed arrangement? Does the answer differ for bus/ferry, flights, stays and experiences?
2. **Merchant of record and seller:** Identify the contracting seller, merchant account, receipt issuer and refund-liable party for every launch mode and contract.
3. **Card fee/surcharge:** BoT's 2024 fee guidelines prohibit consumer card merchant-payment surcharges in the stated scope, while ClickPesa's public pricing currently describes a customer-charged card fee. Get written clarification for online checkout and do not configure a card surcharge before approval.
4. **ClickPesa test safety:** Its official docs currently state there is no sandbox and all API calls move real funds. Obtain a provider-approved testing plan and use tight controls before making a production request.
5. **PSP production eligibility:** Obtain current KYC/merchant approval, contracting legal entity, method/currency matrix, production credentials, webhook/status docs and contact escalation.
6. **Operator settlement:** Confirm whether the PSP permits a marketplace/submerchant model, net settlements or payouts to multiple operators and under which contracts/licence scope.
7. **Refund capacity:** Confirm full/partial refund rules, acceptance vs completion states, fees, method constraints, escalation and how refunds work after operator payout.
8. **TRA/tax/fiscal:** Confirm who issues the fiscal receipt for ticket fare, Travelar commission, markup or customer service fee and how refunds/chargebacks are represented.
9. **Accounting policy:** Accountant must document principal-versus-agent and revenue-earning events by mode. GBV is not a substitute for revenue.
10. **Reconciliation:** Require a PSP settlement report sample and a daily three-way reconciliation test for booking/payment/ledger/bank.

### P1 — settle before scaling

11. Provider fee quotes and effective costs by method, currency, transaction value, refund, payout and chargeback.
12. Reserve/holdback, settlement cycle, bank holidays, negative balance, termination, and funds-access rules.
13. Customer acquisition, operator-specific contribution margin, payment mix and refund/fraud inputs measured from a pilot.
14. Kenya payment method, merchant onboarding, customer fee and settlement rules before country activation.
15. Complete direct research of Beem/Africa's Talking/other SMS and USSD providers for coverage, sender IDs, delivery receipts, price, session duration and production approvals.
16. For every communication category, define primary/fallback channel, ambiguous-timeout handling, duplicate risk, consent/opt-out checks, message expiry, sender-ID requirements and incident escalation. Validate fallback policies in a staged pilot; do not enable blind multi-provider resend by default.

### Evidence standard

Questions count as resolved only when supported by current primary legislation/regulator guidance, written regulator/provider response, executed contract, official product documentation plus production authorization, qualified local legal/accounting opinion, or reproducible test/reconciliation evidence.


## Communications adapter questions (added 23 October 2026)

### P0 — required before production notifications

1. Which email and SMS vendors are approved for each intended country, product and message category, and what entity/merchant account must contract with them?
2. Which sender IDs, short codes, numbers or branded domains require country-specific registration or prior approval? What evidence and lead times apply?
3. What event means accepted, sent and delivered for each provider/channel? Are delivery receipts carrier-provided, and is status lookup available when a webhook is missed?
4. How are webhook signatures verified, duplicate/out-of-order events deduplicated, and event retries handled? Does the provider support an idempotency key or query by Travelar client reference?
5. What are current per-country rates, segments/encoding rules, throughput quotas, account balance alerts, support SLA, maintenance notices and escalation paths?
6. What controller/processor terms, subprocessors, message-retention periods and cross-border transfers apply to phone numbers, email addresses, message content and delivery metadata?
7. Which categories can use failover, and when? Policy must distinguish proven non-acceptance/terminal failure from an ambiguous timeout. OTPs, ticket links, refund notices, marketing and urgent disruptions have different consequences.

### P1 — validate in pilot

8. Compare real delivery latency, terminal failure, unknown status and cost by country/operator network; do not rank vendors solely on API uptime.
9. Determine when cross-channel fallback is allowed by consent/preferences and applicable law; it must never bypass opt-out or suppression.
10. Test a provider maintenance/outage simulation and confirm the notification queue drains without loss, duplicate OTPs or changes to booking/payment state.

## Stage 5 — Unified product requirements and workflows (added 23 October 2026)

| ID | Question / evidence needed | Owner to consult | Why it blocks or affects design | Priority |
|---|---|---|---|---|
| Q-051 | Which of the six modes are enabled at the initial Tanzania launch, and which exact operator/supplier/authorized route supplies each? | Product, Partnerships, Legal | Prevents presenting unavailable inventory as a transactional mode. | P0 |
| Q-052 | Which supplier/platform is source of truth for each field and operation for each launch operator: schedule, fare, availability, booking, ticket, refund, manifest, settlement? | Partnerships, Operator, Engineering | Required before defining consistency and adapter logic. | P0 |
| Q-053 | What are the approved field sets by country/mode/provider, including identity, child/infant and residence fields? | Legal/Compliance, supplier, operators/regulators | Data minimization and valid ticketing/manifest requirements. | P0 |
| Q-054 | Which booking products require hold/price-check/preview, how long are tokens valid, and what idempotency semantics exist? | GDS/hotel/rail/activity provider technical and account teams | Required for booking state-machine implementation and retry policy. | P0 |
| Q-055 | Which refund, exchange, cancellation and after-sales operations are actually enabled per supplier/market, and which require agent intervention? | Supplier account teams | UI/terms and call-center escalation depend on these rights. | P0 |
| Q-056 | What is the exact online-ticketing/manifest field submission requirement for each LATRA/approved-provider launch path and ferry route? | LATRA/TASAC/operator/legal | Cannot finalize passenger form or ticket issuer without it. | P0 |
| Q-057 | What evidence/verification is required for guest booking retrieval, changes and refunds per mode? | Legal, Fraud/Risk, Support | Booking reference must not be enough for sensitive data or high-risk actions. | P0 |
| Q-058 | Which languages, currencies, market selectors and public-country paths launch first? | Product/Marketing/Finance | Affects search fields, disclosures, translations, pricing and analytics. | P1 |
| Q-059 | What support hours, call recording (if any), escalation SLAs and disruption responsibilities can OuterBlocks staff/contractually guarantee? | Operations, Legal, vendor partners | Avoids unsupported customer promises and unlawful recording. | P1 |
| Q-060 | Which offline marshal devices, token format, cache validity window and duplicate/conflict procedure will operators accept? | Operators, Security, Operations | Offline acceptance cannot be designed safely without explicit residual-risk policy. | P0 for offline boarding |
| Q-061 | What exact HIMS/OIMS role set and delegated financial thresholds match the initial organization and contracts? | Executive, Finance, Compliance, HR | Prevents permissive or impractical approval workflows. | P0 for financial actions |
| Q-062 | What record-retention periods apply to passenger, manifest, booking, invoice, payment, audit, security and support data by country? | Counsel, PDPC/other authorities, accountant | Determines deletion, access, backups and lawful-hold implementation. | P0 |
| Q-063 | What accessible-design and translation standard is formally adopted, and who validates the customer-facing copy? | Product, Design, Accessibility/Localization reviewers | Required to convert the brief to approved experience. | P1 |
| Q-064 | Which customer-communication fallback pairs are actually contracted and authorized for each country/channel, including sender-ID and consent restrictions? | Communications providers, operations, legal | An adapter exists conceptually; safe fallback still requires coverage/contract/vendor status and test evidence. | P0 for transactional notifications |


## Stage 6 — architecture, hosting, security and resilience gates (23 October 2026)

### P0 — before real passenger/financial data or production bookings

1. **PDPC/ODPC data-flow determination:** For Tanzania and the next launch market, identify controller/processor registrations, which data flows need transfer permits or safeguards, and rules for manifests, children, identity fields, logs, backups, remote support and analytics. Obtain counsel/authority confirmation for the actual map.
2. **Hosting provider RFI:** Obtain current quotes and written locations for primary DB, object storage, replicas, backups/WAL, logs/traces, support access and DR; ask about certifications, uptime/SLA, restore, security, egress, exit and data deletion. Include NIDC and Wingu. Treat Raxio TZ1 as under development unless current status is confirmed.
3. **Supabase decision:** Verify exact available region, support/subprocessor data, back-up/PITR scope, role/RLS design, costs/limits and export/exit. Published managed regions reviewed 23 October 2026 do not list an African region. Does counsel accept a selected regional location under applicable transfer rules, or is local hosting required for any relevant category?
4. **Platform ownership:** Who operates database, on-call, security monitoring, upgrades, backups, restore and incident response? If self-hosting is chosen, identify named capable staff/vendor and paid service commitments.
5. **Data retention:** Approve retention/erasure schedule for manifests, passenger identity, tickets, accounting records, call recordings (if used), logs, provider payloads and backups for each jurisdiction/mode.
6. **Threat model and verification:** Approve the high-risk threat matrix, privileged-access/MFA requirements, cross-tenant negative tests, secure webhook controls, refund/payout approvals and independent penetration test scope.
7. **Recovery objectives:** Approve RPO/RTO by booking, inventory, financial ledger, HIMS/audit and communications. Rehearse restore and reconciliation. The goals in document 26 are proposals, not SLAs.

### P1 — before sustained growth and additional countries

8. Obtain provider-specific capability/limit matrices and real-world latency/failure measurements for every GDS/PSP/comms/transport adapter.
9. Replace illustrative load scenarios with real search, checkout, inventory contention, payment and notification telemetry. Confirm 100M ambition in terms of registered, active, concurrent and transactional workload.
10. Decide when a module should be extracted from the modular monolith, based on team/scale/risk evidence.
11. Finalize telemetry backend and regions after reviewing personal-data leakage, retention, support and subprocessor processing.
12. Establish named incident commander, data protection owner, finance reconciliation owner, vendor escalation contacts and on-call coverage.

### Requests to hosting providers

Ask NIDC, Wingu and any cloud provider: exact primary/backup/DR locations; managed Postgres support; HA/failover; WAL/PITR; restoration and testing fees; audit/certification evidence; access logging and privileged support; security operations; uptime and incident-notification commitments; maintenance windows; bandwidth/egress; capacity limits; backup deletion; data export/exit assistance; all-in monthly price; and references for comparable critical workloads.


## Stage 9: authentication and stack decision gates (24 October 2026)

1. Get Auth0 written region/data processing, subprocessors, backups/logs/support location, deletion/retention, DPA and contract details; obtain pricing at 10k/100k/1m+ MAU bands and required features.
2. Obtain Tanzania counsel/PDPC assessment for the actual Auth0 processing/transfer flow; identify whether a permit or other safeguard is required for the proposed recipients/locations.
3. If Auth0 fails, price and staff a self-hosted Keycloak deployment with HA, backups, monitoring, patching and incident response; do not default to bespoke authentication.
4. Confirm expected engineering team skill and compare NestJS/Fastify stack to team's strongest viable alternative before stack lock.
5. Run TanStack Start + IdP/BFF + NestJS + PostgreSQL 18 + Drizzle vertical PoC; test security, migrations, segment-level concurrency, payment idempotency, ledger balance and recovery.
6. Confirm target hosting provider supports the required PostgreSQL 18 minor, backup/PITR, replication, connection pooling, secure operations and recovery objectives.
7. Define browser, mobile, USSD and workforce identity boundaries; set separate MFA/session/recovery policies for HIMS/finance/security users.

## Hosting verification additions (24 October 2026)

- [ ] Obtain current NIDC VM/colocation product specification and a quote that clarifies bandwidth, compute, storage, support scope, backup service, DR, DPA and service SLA.
- [ ] Obtain Wingu/Flashnet written identification of the contracting party, currently orderable managed compute/backup/DR services, data locations, subprocessors and operational responsibility split.
- [ ] Verify current facility certification scope/validity and exact uptime SLA contract for the actual service.
- [ ] Complete data-flow mapping for Keycloak, core PostgreSQL, GDS/airline, PSP, messaging, edge, monitoring, backup, support and CI/CD; ask counsel/PDPC about transfer permits/safeguards for each foreign flow.
- [ ] Specify database/keycloak backup design, WAL/PITR, encrypted/isolated copies, approved geography and restore-test evidence.
- [ ] Run a witnessed non-production network, PostgreSQL 18, Keycloak, backup/restore, failover, security and exit/portability proof of capability.
- [ ] Approve production hosting only after all gates in Document 38 pass or have explicitly accepted, non-blocking risk dispositions.

## Stage 13 additions — owner-specific product clarifications (24 October 2026)

See `39-frontend-current-requirements-and-product-owner-clarifications.md` for the detailed open questions. P0 additions: verify OuterBlocks Limited as parent and OuterBlocks Destinations Limited as intended operator against actual company records and required permits; approve actual launch mode scope; define infant age/fare/seat rules; verify ferry residency-based tariff eligibility; confirm ticket content/fiscal requirements; and test the exception path when a payment is verified after a bus seat or ferry-class hold expires. The live frontend cannot be assessed against this baseline until source code/repository access is supplied.


## Stage 17 — new finance and money-flow evidence requirements (24 October 2026)

The following must be answered per operator/supplier, country, mode and provider before enabling payments:

- Does the relevant contract appoint OuterBlocks/Travelar as agent, principal/reseller, affiliate, merchant of record, or another role? Who issues the receipt/invoice, handles customer payment, refunds and chargebacks?
- Can the operator's own PSP legally and technically split one transaction between that operator and Travelar? Obtain current written account-level proof; separate collection and payout APIs do not establish this.
- If no split exists, how does the operator remit commission and how is it reconciled? Establish invoice dates, due dates, statement/report inputs, remedies for underpayment, dispute rules and disablement thresholds.
- For operators without a PSP, has counsel and the PSP confirmed Travelar's collection, supplier payment, custody/payment services, merchant category, onboarding, safeguarding/segregation and refund responsibilities?
- For each flight provider and airline/consolidator, what authorization, ticketing authority, supplier due date, prefunding/credit, BSP/payment model, commission/markup terms and customer receipt identity apply?
- For each lodging supplier/API, is the transaction OTA collect, property collect, partner collect/VCC, supplier net-rate or direct property, and who pays whom and when?
- For each experience provider, is Travelar an affiliate, authorized merchant partner or local supplier marketplace; who takes customer payment and who pays the local supplier?
- For each railway (including TRC and any later country), is there written permission for API/resale, a named seller/agency appointment, commission or permitted markup, payment route, official receipt and refund handling? Public timetables/ticketing portals do not answer these questions.
- Are finance records separated by mode and tenant, double-entry and balanced, with maker/checker approval, closed-period protection and daily reconciliation? Are pending/unknown pay-ins, refunds and payouts visible and aged?
- Has the accountant/tax adviser approved the chart, principal-versus-agent accounting, VAT/EFD, customer fee presentation, taxes, FX and commission earning/refund policy?
- Has legal counsel assessed the National Payment Systems Act and applicable regulations for every collection/split/payout model, and confirmed any licensing, agent, client-money or other conditions with the appropriate authority as needed?
- Does each PSP provide suitable production/testing procedure, current tariff, settlement/report API, final status query, refund and chargeback proof, data-processing terms and live support/SLA?

No amount, default commission, markup or automatic split should go live while these items are unresolved.
