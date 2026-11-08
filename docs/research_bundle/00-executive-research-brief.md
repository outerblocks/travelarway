# Travelar — Cumulative Executive Research Brief (Stages 1–20)

**Research cut-off:** 24 October 2026  
## Stage 19 architecture update — data-driven platform and operational systems (24 October 2026)

Travelar's data-driven requirement applies to all public, HIMS, OIMS and operational workflows. Dynamic geography, markets, routes, stops/ports/stations/airports, boarding/drop-off eligibility, search profiles, result cards, passenger-field policies, prices/fees/contracts, provider routing, content and approval thresholds must be served from scoped, versioned configuration/master data. No hardcoded frontend production arrays may be authoritative. Configuration is typed, validated, audited and approved where required. Security, tenant isolation, payment verification, ledger balance and inventory-concurrency guarantees are code/database-enforced invariants, not toggles in a generic rule table.

HIMS is the OuterBlocks platform-control workspace. OIMS is scoped to each operator's daily service workflows. Both reuse shared backend domain engines with distinct permissions and queues. Documents `47`–`50` and ADRs `ADR-DATA-003` / `ADR-OPS-001` establish the proposed configuration governance, module catalogue, daily role workflows and implementation tests. Current app source, actual department delegation, approval thresholds and production behavior have not been inspected or verified in this research stage.

**Product:** Travelar  
**Parent company:** OuterBlocks Limited  
**Intended operating subsidiary / entity of record confirmed by product owner:** OuterBlocks Destinations Limited  
**Product scope:** Tanzania-first six-mode platform — Bus, Ferry, Flights, Stays/Hotels, Train and Experiences. Transactional country/provider activation remains gated by lawful supply, contract, authorization and operational readiness.  
**Status:** Cumulative research brief updated through Stage 21. This is not a legal opinion, regulator approval, supplier commitment, final architecture authorization, or authorization to begin production implementation. Train and Experiences are first-class product modes, not future modes; their integration/transactional readiness is addressed in Document 40.

## Executive conclusion

Travelar's Tanzania launch is **conditionally feasible, but not ready to build against unverified assumptions**. The product owner has confirmed the intended group structure: OuterBlocks Limited is the parent, and OuterBlocks Destinations Limited is the operating subsidiary/entity of record intended to sign operator SLAs, agent agreements, manage regulatory compliance and operate the marketplace. The registered existence, ownership relationship, business objects, tax registrations, licences, bank/PSP account ownership and authority to perform each activity still require documentary verification. The core regulatory question remains whether OuterBlocks Destinations Limited will operate its own approved online-ticketing system or distribute through currently approved providers, and how funds will be collected, routed, reconciled and remitted.

The 2024 LATRA Online Ticketing Regulations establish a formal approval framework for an online ticketing system. The text says that the system owner must apply, hold a valid business licence and tax documents, operate from a documented business premise, be registered in Tanzania, connect to the electronic revenue-management system and LATRA's Main Online Ticketing System, be capable of connection to LATRA and other relevant systems, meet relevant authority requirements, have qualified staff and cyber protection, and undergo interoperability and security testing. LATRA may require disaster-handling and service-continuity evidence. The permit certificate is stated as valid for two years. The published 2024 schedule lists a TZS 50,000 application fee and a TZS 5,000,000 permit-certificate fee. LATRA's 30 June 2026 notice of amendments effective 1 July 2026 names amendments to private-hire, freight and passenger-vehicle licensing regulations—not the 2024 Online Ticketing Regulations. The notice therefore does not evidence a change to those e-ticketing fees. Before budgeting, OuterBlocks Destinations Limited (as the intended applicant/system owner, if legally eligible) should ask LATRA to confirm whether any separate later instrument, circular or updated fee schedule affects the online-ticketing permit.

LATRA's 8 October 2026 public statement says 14 online-ticketing providers had connected their systems to Safari Tiketi. This is a meaningful incumbent integration ecosystem, not evidence of an open public API. A separate LATRA notice dated 30 January 2026 stated that 10 ticketing systems had then met the legal criteria and been approved. The two statements are compatible as different time snapshots, but the current list of certificate holders, approval status, provider APIs, test environments, commercial restrictions and onboarding path remain matters for direct confirmation.

The data-protection risk is material from day one. PDPC states that a person must not collect or process personal data without registration as a data controller or data processor. PDPC also operates a permit-based process for transfers of personal data outside Tanzania. Travelar should not select a global cloud region, email vendor, analytics stack, GDS, PSP or outsourced support process until the relevant data flows and transfer-permit conditions are assessed. The evidence reviewed supports a permit requirement for cross-border transfers; it does **not** establish a blanket rule that every category of data must always be stored only inside Tanzania.

For ferries, TASAC's stated mandate includes maritime transport regulation, licensing, vessel inspection/safety, and ferry oversight in Mainland Tanzania. A marketplace's status as a ticket distributor is not automatically the same as the ferry operator's status. Obtain a written position on Travelar's role, the operator's licenses and permitted routes, passenger manifest submission, fare/tariff rules, and the separate requirements that may apply to Zanzibar maritime services.

## Launch recommendation

Use a **two-path regulatory/commercial decision gate** before building production ticket issuance:

1. **Path A — Travelar becomes an LATRA-approved system owner.** Verify eligibility and current requirements for OuterBlocks Destinations Limited; request the current application pack, fee schedule, EFDMS and CeTS interface specifications, certification stages, testing criteria, and ongoing service obligations. Use the 2024 e-ticketing fee schedule as the published rule text, while obtaining LATRA confirmation that no separate later instrument or fee notice has changed its application. Review the 1 July 2026 amendments separately for operator licensing due diligence.
2. **Path B — Travelar distributes through a current approved provider.** Obtain written confirmation from LATRA and the provider that Travelar's proposed marketplace, operator system, agent channels and customer checkout fit the provider/agent rules. Negotiate data rights, source-of-truth ownership, operator access, refunds, settlement, commissions, uptime, support, service continuity and portability. Ensure the provider agreement does not leave Travelar unable to retrieve its own customer/booking records or transition suppliers lawfully.

A hybrid is possible in principle, but it should not be assumed: Travelar may use approved distribution arrangements at launch while separately preparing an approved-system application if the economics and strategic control warrant the costs. Any build should remain behind a go/no-go gate until the regulatory and supplier model is confirmed.

## Highest-priority facts

| Finding | Classification | Confidence | Consequence |
|---|---|---|---|
| LATRA's 2024 regulations require authorization for online ticketing systems used for regulated land-transport services. | Verified through primary documentation | High for the cited 2024 text; July 2026 operator-licensing amendments reviewed separately; any later e-ticketing changes still need confirmation | No production bus-ticket issuance on an assumed unapproved system. |
| System owners must connect to the relevant electronic revenue-management system and LATRA's Main Online Ticketing System and undergo integration/security review. | Verified through primary documentation | High for the 2024 text | EFDMS/CeTS integration and certification are critical dependencies. |
| LATRA reported 14 provider integrations with Safari Tiketi in October 2026. | Verified through regulator statement | High for LATRA's statement; underlying certificate status needs confirmation | Contact LATRA and existing providers before estimating a new integration. |
| The market already has provider platforms with consumer booking and operator/counter software. | Verified in provider marketing plus regulator list | High that the products are marketed; depth and performance claims unverified | Travelar must find a differentiated partner or supplier gap, not assume a greenfield market. |
| PDPC says controllers/processors must register before processing personal data. | Verified through regulator publication and Act | High | Registration and privacy governance precede live passenger data. |
| PDPC runs a permit process for personal data transferred outside Tanzania. | Verified through regulator publication | High that a permit process exists; application to each specific data flow needs advice | Data-map and cross-border gate before cloud/vendor choices. |
| A Tourist Agency Licence may apply when Travelar acts as a travel agent/air-ticketing or tourism operator. | Official government licensing guide; application to OTA model unresolved | Medium | Obtain a written activity classification before enabling flights/stays/experiences. |
| Travelar's payment role could change its regulatory exposure. | Hypothesis requiring validation | High as a design risk, not a finding that a licence is already required | Use a licensed PSP and avoid unapproved stored value, custody or payment aggregation pending BoT/counsel analysis. |
| There is no verified public production API or open-access integration route for LATRA, TASAC or an operator. | Unknown from public evidence reviewed | High that evidence was not found; not proof no API exists | Obtain interface documents and partner authorizations directly. |

## Market signal

LATRA reported that, over four years of use of online ticketing systems, 62.18 million passengers used the systems. Of those, 59.27 million (95.3%) paid by cash and 2.91 million (4.7%) by online payment methods. These are regulator-reported figures, not an independently audited national market-size estimate. They nevertheless suggest that Travelar's low-connectivity and assisted sales strategy should not be an afterthought: cash, counter sales, agents, operator-originated bookings and reconciliation must be designed alongside digital checkout. The figures do not establish a market-wide cash share beyond the system population described by LATRA.

## What can be said about competitors

- **Safari Tiketi/CeTS** is LATRA's central e-ticketing system and oversight mechanism; it is not simply another commercial marketplace. It connects approved online-ticket providers and enables regulator monitoring of schedules, tickets and transactions.
- **Busbora** publicly markets both a consumer bus-ticket marketplace and operator management functions: operator-branded websites, counter ticketing, mobile-money/SMS integration, apps and a hosted counter system. Its terms say it does not own or operate buses.
- **OTAPP** publicly markets bus and event ticketing and other travel/entertainment categories, plus online/offline solutions. The public material reviewed does not independently verify its complete supplier contracts, live inventory coverage or every listed mode's production capabilities.
- **Azam Marine** operates a public booking interface. No production API or third-party distribution rights were established from the public booking page reviewed.
- LATRA's October 2026 list includes 14 connected providers: Busbora, Otapp Agency, Abood Bus Service, Duarani Innovate, Shabiby Transporters, Hashtech Tanzania, Iyishe, Voltic Tanzania, Web Corporation Tanzania, Mkombozi Infotech, Itule, Sepa Tech, Logix and Global Light. Inclusion in the integration list does not, by itself, verify each supplier's exact product, market share or API terms.

The evidence does **not** yet justify claims that incumbents are unreliable, that operators lack software ownership, or that Travelar will win through a generic “better interface.” The likely opportunity to test is a regulated, multi-channel commerce layer plus configurable operator workflows that can integrate with—not displace by force—approved ticketing and existing operator systems.

## Recommended launch scope

A viable first commercial scope is not “all six modes.” It is a narrowly defined set of operator/route combinations for which Travelar has: (a) the required LATRA-compliant ticketing path; (b) a signed operator/distribution agreement; (c) an approved payment and settlement design; (d) PDPC registration and lawful data flows; (e) verified refund, ticketing and support responsibilities; and (f) evidence that the trip inventory, fares and manifests remain correct under failure and concurrent sales.

For ferry bookings, choose routes and operators only after validating TASAC and, for services involving Zanzibar, the applicable Zanzibar maritime authority requirements. Do not treat ferry capacity as bus seat maps or assume one regulator authorizes a route across distinct jurisdictions.

## Definition of this installment

This installment covers the first Tanzania regulatory and market questions, a source-backed competitor baseline, immediate launch blockers, and the questions that must be answered directly. It does not complete the full 32-artifact research programme, Kenya legal research, all six supplier-mode research, provider commercial due diligence, the full financial model, or production architecture selection. Those areas remain open rather than being represented as completed.

## Primary sources

See [`sources-and-evidence-register.md`](sources-and-evidence-register.md), and the deeper matrices in:

- [`02-regulatory-requirements-by-country.md`](02-regulatory-requirements-by-country.md)
- [`04-competitor-and-marketplace-analysis.md`](04-competitor-and-marketplace-analysis.md)
- [`05-operator-systems-and-integration-opportunities.md`](05-operator-systems-and-integration-opportunities.md)
- [`01-assumptions-contradictions-and-decisions.md`](01-assumptions-contradictions-and-decisions.md)
- [`31-open-questions-and-evidence-needed-before-launch.md`](31-open-questions-and-evidence-needed-before-launch.md)

## Stage 2 update — market and operator systems (23 October 2026)

Subsequent review of LATRA's 8 October 2026 update identifies 14 provider/transport entities connected to CeTS/Safari Tiketi. The named list includes technology-company names and operator names, so it should not be interpreted as 14 independent consumer marketplaces or as proof of Travelar's integration rights. The updated competitor and operator-system analyses are in `04-competitor-and-marketplace-analysis.md` and `05-operator-systems-and-integration-opportunities.md`.

The National Bureau of Statistics' *Statistical Abstract 2025*, published in September 2026, cautions that reliable road-transport data remain scarce because the sector is fragmented and informal. This prevents a defensible top-down bus-market estimate from the public data reviewed. LATRA also reports high cash usage within the e-ticketing-system population; distinguish digital ticket issuance from online payment adoption.

The Stage 2 recommendation is to design for three operator models—Travelar as primary OIMS, an authorized adapter to an existing system, and distribution-only—without assuming every operator should migrate. Kenya is the next market to study in depth, but not yet a legally cleared launch market or proven higher-attractiveness market. Country prioritization remains preliminary until comparable regulatory, supplier and operator-level economic evidence is assembled.


## Stage 4 research update — PSP adapters and financial integrity (23 October 2026)

The product owner confirmed that payment systems will also be provider adapters. `ADR-PAY-001-multi-PSP-adapters.md` records the multi-PSP architecture: Selcom, ClickPesa, Pesapal, DPO Pay by Network and future providers can coexist where contracts, licences, methods, country coverage and unit economics support them. No single PSP is the global dependency. The product owner also confirmed that communications must use multi-provider adapters to tolerate failure and maintenance. `ADR-COMMS-001-multi-provider-communication-adapters.md` records provider-neutral email/SMS/other approved channel adapters, durable notification intents, raw plus normalized delivery events, and controlled failover. Failover must not blindly resend after ambiguous provider acceptance, bypass consent or sender-ID rules, or change booking/payment state.

Key findings from official provider documentation:

- Pesapal's API 3.0 documents IPN/callback followed by transaction-status lookup; its refund documentation distinguishes accepted refund requests from completed refunds and limits refund patterns by payment method.
- DPO documents hosted checkout, callback and token verification; its FAQ states funds can be held for fraud/compliance checks before settlement and chargeback responsibility can remain with the merchant.
- Selcom's Business API documents HMAC-based signing, status inquiry and callbacks for its documented transfer flows; OuterBlocks must get the specific collection/e-commerce contract and endpoint documentation required for checkout.
- ClickPesa's current documentation says it has no sandbox and API testing moves real funds. Its public pricing page includes a customer-charged card fee, which must be reconciled with the Bank of Tanzania's card merchant-payment surcharge guidance before Travelar implements any such charge.

The financial model uses illustrative inputs only. GBV is not automatically revenue; revenue depends on the executed contract and principal/agent accounting analysis. Production funds collection is a P0 blocker until OuterBlocks' payment-regulatory role, merchant-of-record arrangement, settlement/payout permission, refund liability, TRA receipt/tax treatment and reconciliation workflow are documented. See `10-psp-communications-and-ussd-provider-comparison.md`, `11-revenue-model-and-unit-economics.md`, `12-financial-accounting-settlement-and-reconciliation.md` and `sources-and-evidence-register-stage4.md`.

## Stage 5 update — unified product requirements (23 October 2026)

Stage 5 consolidates the six booking modes and enterprise workflows into five cross-referenced product specification documents: `13-product-requirements-and-business-rules.md`, `14-public-website-sitemap-and-landing-page-brief.md`, `15-mode-specific-search-and-booking-field-matrix.md`, `16-oims-hims-agents-call-center-and-marshal-requirements.md`, and `17-role-permission-and-approval-matrix.md`.

The core product requirements formalize separate booking, inventory, payment, ticket, refund, settlement and notification lifecycles. They also record provider-neutral adapters for travel inventory/GDS, PSPs and communications; explicit per-market/mode activation gates; field minimization by supplier/legal requirements; operator-originated versus Travelar-originated attribution; segment-based bus inventory; ferry class capacity; and role-scoped access to passenger data and financial functions.

The new field matrix is a **logical requirement**, not a claim that every upstream provider accepts the same fields or that any supplier has authorized OuterBlocks Limited. For example, Expedia Rapid documents a Price Check before lodging booking, Booking.com documents preview/create steps in its supported booking flow, and Sabre rail separates search, prebook and ticketing operations. These product-specific differences must remain visible behind adapters and in each state machine. Official reference examples: https://developers.expediagroup.com/rapid/lodging/booking/about-booking-api, https://developers.booking.com/demand/docs/development-guide/application-flows/search-look-book, https://developer.sabre.com/rest-api/content-services-rail/v2/index.html.

**No production implementation is authorized by this stage.** Decisions still needed include actual launch modes/suppliers, provider contracts and operation permissions, market-specific required passenger fields, support/SLA commitments, manifest scope, offline marshal risk tolerance, role names/approval thresholds, retention schedules, localization and accessibility validation. See updated assumptions and open-question registers.


## Stage 6 update — architecture, data, security and resilience (23 October 2026)

Stage 6 adds system context/integration architecture (`19`), architecture option analysis and decision records (`20`), data residency and hosting strategy (`21`), logical domain model (`22`), API/adapter standards (`23`), security threat model (`24`), reliability/scalability planning (`25`) and observability/incident response/disaster recovery (`26`). See `sources-and-evidence-register-stage6.md` for the source-by-source evidence register.

Current proposed technical direction: start from a modular monolith with explicit domain modules and background workers, use PostgreSQL transactional integrity for Travelar-owned inventory/bookings/payments/ledger, and retain provider-neutral GDS, PSP and communications adapters. This is a recommendation for a small initial team, not a final stack mandate. Supabase is evaluated rather than assumed; its publicly listed managed regions checked on 23 October 2026 do not show an Africa region. Managed Supabase, self-hosting, custom PostgreSQL and local/regional hosting must be assessed against actual transfer permissions, backups, subprocessor/support locations, operations staffing, costs and exit rights.

The PDPC and ODPC sources support treating transfer assessment as an explicit workstream, but they do not prove a blanket rule that every data category must always stay within national borders. A final data-flow/legal memorandum and written hosting/vendor evidence remain launch gates. Raxio's Tanzania TZ1 page was marked “Under Development” when reviewed on 23 October 2026; verify current operation before relying on it. NIDC and Wingu are candidates for due diligence, not approved hosting decisions.

Scale scenarios in `25-reliability-scalability-and-performance-plan.md` are explicitly hypothetical engineering envelopes that translate assumed monthly active users/searches into request rates. They are not market forecasts or SLO commitments. Inventory correctness, reconciliation, legal data flows and restore evidence take priority over optimistic throughput assumptions.

**Remaining stage:** Stage 7 — dependency-ordered build sequence, phase-by-phase engineering roadmap, definition of done/testing strategy and IDE-agent operating charter. Provider and regulator confirmations, vendor quotes, data-flow approval, staff/on-call ownership, and supplier production permissions remain unresolved. Research completion does not authorize production development.


## Technology direction update — 24 October 2026

The product owner has confirmed the direction to use a custom Travelar backend and a direct PostgreSQL database rather than Supabase as the platform. The current recommended baseline is React + TanStack Start for web; NestJS + TypeScript on Fastify for the core API; PostgreSQL 18.x; Node.js 24 LTS at the current research date; and Drizzle + node-postgres as a candidate database-access layer with explicit SQL for critical transactions.

Do not build all authentication from scratch. The preferred direction is self-hosted Keycloak in verified Tanzania hosting, conditional on counsel/PDPC review, physical/data-location evidence, funded identity operations and successful security/recovery tests. Auth0 remains a contingency if its exact data-processing arrangement is legally acceptable and operationally preferable. Travelar's roles, tenant/branch authorization, audit and business permissions remain in its own backend/database. See Documents 33–34 and ADR-AUTH-001 / ADR-STACK-001.

These are recommended technology decisions subject to a vertical proof of concept and staffing review; they do not close regulatory or supplier launch blockers and do not authorize production activity.


## Stage 10 identity decision update — 24 October 2026

The current preferred direction is self-hosted Keycloak in a verified Tanzanian hosting environment, conditional on legal, supplier, operations and proof-of-concept gates. Do not build authentication from scratch. The Tanzania PDPA regulates cross-border flows and the PDPC describes a transfer-permit process, but the reviewed sources do not establish a blanket rule requiring every category of personal data to remain only in Tanzania. Local Keycloak reduces/control identity-data transfers only if logs, backups, telemetry, support access, email/SMS and external federation are also mapped. The current Keycloak supported-configuration page lists PostgreSQL 18.x; verify again against the exact release pinned for production. See document `35-keycloak-and-local-identity-hosting-assessment.md`.

## Stage 13 — Current frontend requirements supplied (24 October 2026)

The owner clarified the current frontend direction in `39-frontend-current-requirements-and-product-owner-clarifications.md`. The presently described public scope contains bus, ferry where available, flights and hotels, with train and experiences retained as longer-term roadmap modes unless the owner changes that decision. Bus detail selection (seat, boarding/drop-off and passenger details) should be one screen before Booking Information Review; results must calculate fare, time and seat conflicts by requested route segment. Ferry uses sailing/class capacity, with resident/non-resident fares and mandatory IDs remaining subject to operator/legal verification. Payments and tickets remain governed by verified backend state, not animations or browser redirects.

**Current Stage 21 entity decision:** the product owner has confirmed OuterBlocks Limited as parent and OuterBlocks Destinations Limited as the intended Travelar operating subsidiary/entity of record. This supersedes the older assumption that OuterBlocks Limited itself is the Travelar operating entity and the draft name Travelar Destinations Limited. Documentary verification of registration, parent/subsidiary relationship, corporate authority, tax/licence status, IP/intercompany arrangements, merchant and payout account ownership, and regulatory eligibility remains mandatory. The existing frontend source has not been supplied for inspection.

## Stage 15 — AI engineering agent governance (24 October 2026)

Travelar's IDE-agent policy is explicitly tool-neutral. Cursor and Google Antigravity can support repository exploration, planning, code changes, tests, browser-assisted verification and review artifacts. Official product documentation confirms these functions, but the project must not treat their presence as evidence of correctness. Root `AGENTS.md`, portable Agent Skills, technical requirements, ADRs, test suites, protected branches, CI and human approval must define the engineering process. Document `41` compares the tools, identifies privacy/permission controls and defines a controlled pilot against the actual Travelar repository. No empirical winner is declared because the actual codebase has not yet been benchmarked.

## Stage 16 update — cybersecurity self-defence and security operations (24 October 2026)

Travelar's security approach is now explicitly defined as layered protection plus detection, bounded containment and recoverability—not a promise of perfect automatic defence. Document `42-cybersecurity-self-defence-detection-and-response-architecture.md` sets the baseline for frontend, APIs, identity, servers, PostgreSQL, provider/payment adapters, CI/CD/AI-agent environments, security logging and alert delivery. `ADR-SEC-001-layered-cyber-defence-and-security-observability.md` records the direction.

Before production, Travelar must demonstrate that important events from edge protection, application/API, identity, infrastructure, database, CI/CD, payments and backups reach a protected monitoring plane; alert delivery has been tested; responder ownership is explicit; containment actions are bounded and reversible; and a clean restore plus booking/payment/inventory reconciliation succeeds. An independent, scope-defined security assessment and retest of material findings is required. Scanner results or AI-generated review alone are insufficient.

The official OWASP ASVS site lists 5.0.0 as stable, OWASP Top 10:2025 explicitly includes security logging/alerting failures, NIST SP 800-61 Rev. 3 provides current incident-response guidance, and the Tanzanian PDPC's registration page states registration is required before personal-data processing. These sources establish baselines, not that Travelar is already compliant. Actual PDPC registration, transfer permit applicability, PCI validation scope, selected-host controls and incident-notification duties must be verified against real company/provider arrangements.

**Production status remains NO-GO until all existing regulatory, supplier, payment, privacy, hosting, operational and security gates are evidenced as closed or explicitly accepted by the authorized risk owner where acceptance is lawful.**


## Stage 17 — Finance, commission, payment routing and supplier settlement (24 October 2026)

Travelar needs a financial control system, not a small finance module. The system must capture payment attempts and states, revenue recognition, operator/supplier payables, commission and markup calculations, refunds, chargebacks, PSP fees, payout state, settlement evidence and reconciliation from booking through bank/supplier completion. All six first-class modes (bus, ferry, flights, stays, train and experiences) require independently reconcilable subledgers and reports. Design the ledger with an explicit legal-entity dimension and intended operating-entity assignment for OuterBlocks Destinations Limited, subject to accountant/legal verification of statutory books and parent-level consolidation. Independent mode reporting does not automatically mean six companies or six bank accounts.

Commercial terms are per operator/supplier and versioned: commission base/rate/type, permitted markup, discounts/funder, tax, payout schedule, earning event, refunds, payment flow and responsible merchant/seller. Store the exact terms and price calculation snapshot against each booking. Revenue reported must distinguish gross booking value from Travelar's recognized revenue; principal-versus-agent accounting depends on actual contractual control and service responsibility, not the mode label alone.

Payment route is a per-supplier/product/market decision. Customer payment may go to the operator's PSP, be split by an approved marketplace/connected-merchant product, go through Travelar under an approved collection and payout model, be collected by an OTA/supplier, be paid by Travelar to an air/hotel/experience supplier under a net-rate agreement, or be made at the property/venue where permitted. If the operator receives funds directly and its PSP cannot split commission, Travelar cannot automatically take commission before settlement; it must use an agreed invoicing/remittance or other supported mechanism. Do not promise split settlement until provider documentation, contract, account structure, refund/chargeback treatment and settlement evidence are verified.

Current public documentation found ClickPesa collection and payout APIs, Selcom checkout/collection and disbursement APIs, Pesapal e-commerce API/status/IPN/refund features, and DPO checkout integration. These sources do not prove a marketplace split product for the intended Travelar structure. ClickPesa's current public quickstart says it does not provide a sandbox and that API Explorer requests move real funds, so integration testing must not use production calls without an explicitly provider-approved and controlled test procedure. All PSPs need a written RFI response and account-level proof.

For flights, Amadeus Self-Service documentation distinguishes customer collection from the separate payment due to a consolidator. Hotel inventory may use Expedia/OTA collection, partner collection or property collection; each determines who receives money and who pays the property. Viator's affiliate and merchant API models differ in payment and responsibility, with merchant access subject to qualification/approval. TRC's public e-ticketing journey does not establish reseller API/commission rights; Kenya Railways' published Madaraka Express terms warn against commercial ticket resale. Do not assume trains can be marked up or resold without explicit railway authorization.

The National Payment Systems Act, Cap. 437 R.E. 2023 states that a person shall not operate a payment system without a Bank of Tanzania licence. This makes the proposed collection/split/payout model a legal classification gate; it is not an engineering-only question, and this research does not conclude that every marketplace model is licensed or unlicensed. Accountants, tax advisers and counsel must approve principal/agent accounting, tax/EFD/invoices, customer fee disclosure, custody/payment-services classification, and refunds. See documents `43`, `44`, `45`, `ADR-FIN-002`, and `sources-and-evidence-register-stage17.md`.

**Production status remains NO-GO until each mode/operator/payment route passes legal, commercial, provider, accounting, reconciliation, security and operational gates.**

## Stage 18 — utility-led destination discovery and practical guides (24 October 2026)

The public homepage is not a marketing brochure. Its key non-transactional priorities are Hot Deals & Offers, Explore Destinations, and Travel Guides & Tips that cover practical trip preparation and arrival. Keep the six-mode search and Help/Manage Booking accessible, but do not pad the homepage with generic “How it works,” “Why choose us,” unsupported testimonials or promotional benefits. Entry/visa/safety guidance must be source-backed, applicable to the traveller's circumstances, date-reviewed and governed through an editorial approval/stale-content process. Public access to a travel-document lookup page does not imply Travelar has API or republishing rights. See document `46-destination-discovery-editorial-content-and-travel-guides.md` and `ADR-CONTENT-001-utility-led-homepage-and-governed-destination-information.md`.

## Stage 20 — Corporate/channel delta, official electronic-payment order and regulatory adapter (24 October 2026)

Stage 20 supplements rather than silently replaces earlier decisions. The product owner has now confirmed the intended structure: `OuterBlocks Limited` is the parent and `OuterBlocks Destinations Limited` is the operating subsidiary/entity of record for Travelar. This supersedes earlier use of `OuterBlocks Limited` as the operating company and the conflicting draft name `Travelar Destinations Limited`. Verify the actual BRELA records, parent/subsidiary relationship, business objects, TIN, licenses, IP arrangements, settlement-account ownership and legal authority before executing contracts or production flows. See `ADR-CORP-001` and Document `51`.

A newly verified time-sensitive source is Tanzania Government Notice No. 158C (30 June 2026), effective 1 July 2026, on mandatory electronic means for listed transactions including ferry/long-distance bus/air/rail fares, hotels and tourism-related services. It includes a six-month transition for some existing payment recipients. Its application to new entities/channels and timing must receive prompt legal confirmation. See Document `52`, `ADR-REG-002` and source register stage20.

New commercial detail is captured as a candidate channel taxonomy and policy model: Travelar web/app, Travelar agents/call center, operator POS/agents/call center, operator white-label and partner API. An authenticated origin-attribution event is immutable; commission outcome comes from a versioned signed agreement plus mode/product/market and transaction facts, not a browser-submitted source field alone. A proposed 0% operator-originated marketplace commission is not automatically accepted for every agreement, nor does it exempt transaction from regulations or other contracted fees. See `ADR-CHAN-001` and Document `51`.

LATRA's October 2026 statement reports 14 providers connected to Safari Tiketi. Official LATRA statements and TRA's fiscal-system guidance support making regulator/fiscal integration first-class adapters, but they do not establish open production API access or authorization for Travelar. Keep exact capabilities, approvals and provider path evidence-gated. Document `53` adds portal/white-label isolation; Document `54` reviews unsafe literal adoption of Redis locks, all-provider HMAC assumptions, universal Cloudflare claims and ledger hash chains; Document `55` updates dependencies.

**No existing vendor, hosting or six-mode scope decisions are silently changed.** Cloudflare/Redis remain candidates; PostgreSQL 18 + custom backend and the current NIDC/Wingu hosting verification gate remain unchanged. All six modes remain first-class product scope; supplier/provider activation can still be staged by documented readiness.
