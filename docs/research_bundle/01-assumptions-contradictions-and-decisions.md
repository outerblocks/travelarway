# Assumptions, Contradictions and Decisions Register

**Product:** Travelar  
**Parent company confirmed by product owner:** OuterBlocks Limited  
**Intended operating subsidiary/entity of record confirmed by product owner:** OuterBlocks Destinations Limited  
**As of:** 24 October 2026

## Purpose and labels

- **Verified fact:** Supported by current primary evidence cited here.
- **Explicit product requirement:** Stated by the product owner; not independently verified as a legal or market fact.
- **Proposal:** Candidate approach to evaluate.
- **Hypothesis:** Plausible but needs research/interviews/testing.
- **Decision required:** Product/company leadership must decide after evidence is obtained.
- **Unknown:** Requires direct confirmation or additional research.

## Register

| ID | Statement / question | Classification | Evidence / conflict | Decision or validation action | Priority |
|---|---|---|---|---|---|
| A-001 | Product is named Travelar. | Explicit product requirement | Product-owner instruction | Keep consistent across product, legal docs, code, contracts and customer terms. | P0 |
| A-002 | OuterBlocks Limited is Travelar's parent; OuterBlocks Destinations Limited is the intended operating entity. | Explicit product-owner decision; legal particulars and parent relationship still require documentary proof | Product-owner instruction, not a BRELA extract | Obtain current BRELA company extracts for both entities, evidence of ownership/relationship, TINs, business objects, tax status and applicable licenses. | P0 |
| A-003 | `travelarway.com` is the principal domain; OIMS/HIMS/agent subdomains are proposed. | Explicit requirement / technical proposal | Domain ownership, DNS and deployment not verified | Check registrant/DNS/certificate status before relying on any subdomain. | P2 |
| A-004 | Tanzania is the initial market. | Explicit product requirement | User's scope | Assess Mainland and Zanzibar distinctions, especially maritime and cross-border personal data. | P0 |
| A-005 | Travelar can launch its own bus-ticketing marketplace using its own ticketing engine without approval. | Unverified and contradicted by current evidence | LATRA 2024 regulations require approval for online ticketing systems and authorized-system usage. | Do not proceed on this premise. Choose approved-provider/agent path or obtain LATRA system-owner authorization. | P0 |
| A-006 | LATRA/Safari Tiketi has an open production API any platform can use. | Unknown; not evidenced | LATRA states provider systems connect to its Main Online Ticketing System, but no open production API documentation was identified. | Request technical docs, partner eligibility, application process, test environment, auth/security and production access terms from LATRA. | P0 |
| A-007 | Exactly 10 systems are approved. | Historical official statement, potentially superseded | LATRA's 30 Jan 2026 notice said 10 systems met criteria then; its 8 Oct 2026 statement says 14 providers had connected. | Request current dated list and distinguish connected from approved, certificate-in-force and production-enabled. | P0 |
| A-008 | The 2024 LATRA online-ticketing fee schedule remains applicable as of October 2026. | The 2024 fee schedule is verified in the online-ticketing instrument; ongoing current applicability is not directly confirmed. | The 2024 schedule lists TZS 50,000 application and TZS 5,000,000 permit certificate. LATRA's notice for amendments effective 1 Jul 2026 names separate private-hire, freight and passenger-vehicle licensing regulations, not the Online Ticketing Regulations. | Ask LATRA whether any separate later instrument or fee notice changes the online-ticketing charges, and verify the current operator licensing rules separately. | P0 |
| A-009 | Travelar should own an approved ticketing system rather than use a partner. | Decision required | Ownership offers control but introduces certification, uptime, data, support and operational costs; partner route may constrain data/contractual control. | Produce comparative total-cost/risk model only after LATRA confirms approval and partner requirements. | P0 |
| A-010 | A marketplace distribution partner is treated as a “system agent” under LATRA rules. | Unknown | 2024 rules allow provider-appointed agents under agreements, with duties. Actual Travelar roles/channels may differ. | Seek written LATRA classification for marketplace, OIMS, call-center, USSD, Travelar-agent and operator-originated flows. | P0 |
| A-011 | Operator-originated bookings can always be outside the regulated e-ticket system. | Not supported | LATRA rules require regulated providers to use authorized online ticketing system and define cash/ticket/fee processes. | Define “operator-originated” attribution commercially, but do not bypass mandatory ticketing/fiscal reporting. | P0 |
| A-012 | Bus/ferry marketplace operation requires no tourist-agent licence. | Unknown | Government Business Portal lists Tourist Agency Licence for travel agents/air ticketing; Tourism Act has licensing provisions. Whether bus/ferry-only OTA falls in definition is not resolved. | Obtain written classification from Ministry/Tourism License Board and counsel before choosing activity codes. | P0 |
| A-013 | Ferry ticket sales are governed exclusively by TASAC and require no Zanzibar-specific approval. | Unsupported / incomplete | TASAC regulates Mainland maritime transport, vessel safety, ferries and licensing; Zanzibar is a distinct non-union regulatory area in relevant matters. | For Dar–Zanzibar and any Zanzibar embarkation/service, map the authority/permission at each end with legal counsel and regulator. | P0 |
| A-014 | OuterBlocks may hold customer funds, take payment into a platform account and settle operators without additional authorization. | Unknown | BoT regulates payment systems and providers; exact role depends on the funds flow and service. | Submit detailed funds-flow diagrams to Tanzanian payments counsel/BoT. Use licensed PSP and avoid wallets/custody/transfer features until clarified. | P0 |
| A-015 | Every online payment provider in the planned list can support Travelar as one merchant and split/settle operator funds. | Unknown | Provider commercial terms, account capabilities and licenses not checked in this installment. | Validate entity, licence, API, merchant category, splitting, payouts, refund/chargeback terms and settlement by country. | P0 |
| A-016 | Customer payment fees may be added on top of ticket fare. | Hypothesis / legal-commercial issue | Must satisfy consumer disclosure, payment scheme and PSP contract rules and country-specific law. | No surcharge until method-by-method counsel/PSP confirmation and full-price display. | P0 |
| A-017 | All passenger data must be stored only in Tanzania. | Not verified | PDPC clearly describes a permit-based cross-border transfer process; no blanket rule covering all data types was established by evidence reviewed. | Determine requirements per data class, transfer recipient and purpose; apply for permits where required. Avoid asserting total localization. | P0 |
| A-018 | Using a global cloud region is lawful if encryption is enabled. | Unsupported | Cross-border transfer permits, recipient, safeguards and legal agreements matter; encryption alone is not a legal transfer authorization. | Data map, DPIA/risk assessment and PDPC confirmation before selection/production. | P0 |
| A-019 | PDPC registration can be completed by any unregistered startup with no audited financial-year report. | Unknown | PDPC registration page lists an audited financial-year report for private organizations. | Ask PDPC how new companies without an audited year are to apply and what substitutes are accepted. | P0 |
| A-020 | A legal operating entity already exists exactly as OuterBlocks Limited and has all relevant permits. | Unknown pending independent validation | Product-owner statement defines company but no registry/permit documents supplied. | Verify current records; treat all licences and permit status as absent until documentary evidence is obtained. | P0 |
| A-021 | OuterBlocks Destinations Limited will operate Travelar under OuterBlocks Limited. | Intended group structure confirmed by product owner; formal legal status and tax consequences not independently verified | Owner instruction; no company extracts or intercompany agreements supplied in research | Verify registration, ownership, IP license/assignment, contracting, employment, tax, data-controller/processor and payment-account responsibilities with advisers. Do not treat the intended group structure as a verified legal fact until documents are reviewed. | P0 |
| A-022 | Busbora and OTAPP have a fully proven superior/inferior customer experience or reliability. | Unknown | Public vendor claims establish marketed functions, not independent performance. | Conduct structured mystery shopping, operator interviews, user testing and outage/support reference checks. | P1 |
| A-023 | Operators commonly lack software, API access or ownership of their tools. | Hypothesis, not established | Busbora claims it hosts counter-ticketing for operator offices; software IP/data ownership vary by contract. | Interview a sample of small/large operators and request their current process maps, contracts, exportability and API rights. | P1 |
| A-024 | Online ticketing means most passengers pay digitally. | Contradicted by LATRA-reported figures | LATRA reported 95.3% cash and 4.7% online payments among 62.18m users over four years. | Design cashier/cash/agent/offline workflows and reconciliation from MVP, while verifying definitions of LATRA statistics. | P1 |
| A-025 | The six-mode super-app should launch together. | Proposal not validated | Each mode has different suppliers, legal rules, failure modes and settlement. | Launch only modes/routes with signed supply, legal authorization, testable fulfilment and contribution economics. | P0 |
| A-026 | Travelar needs IATA accreditation simply to access every flight-shopping API. | Not researched yet; known distinction to preserve | API access, ticketing authority, accreditation and provider contracts are different concepts. | Research current GDS/accreditation routes as Stage 3, before enabling flights. | P1 |
| A-027 | Public domain/subdomains prove production systems exist. | False inference | They are proposed hostnames and no live deployment verified. | Treat DNS, certificates, production access, security controls and ownership as separate verification items. | P2 |
| A-028 | The LATRA amendments effective 1 July 2026 changed the 2024 online-ticketing rules. | No evidence in the notice reviewed; it lists other instruments. | LATRA's 30 June 2026 notice identifies amendments to private-hire services (GN 1082/2024, amendment GN 6/2026), freight road transport (GN 1083/2024, amendment GN 7/2026), and passenger-vehicle transport licensing (GN 1084/2024, amendment GN 8/2026). It does not list the 2024 Online Ticketing Regulations. | Obtain current versions of the three operator-licensing instruments; separately ask LATRA whether any other instrument or notice has amended online-ticketing rules or fees since 2024. | P0 |
| A-029 | LATRA's PDPA commencement date is unambiguous across official sources. | Contradiction | PDPC page states Act in force from 1 May 2023; OAG MIS listing shows 13 June 2023 as publication/commencement. | Ask counsel to verify gazetted commencement instrument; compliance work proceeds regardless. | P1 |
| A-030 | A browser redirect or success screen proves a PSP payment succeeded. | Rejected design assumption | Payment integrity requirement; PSP state confirmation must be server-side, provider-specific and reconcilable. | Enforce webhook/signature and server verification; do not issue ticket until funds/booking/inventory state reconciles. | P0 |
| A-031 | Travelar must use a single global GDS provider for flights, stays and rail. | Rejected architecture assumption; user-confirmed multi-adapter direction | Product owner states Travelport, Sabre and Amadeus can be used as adapters, not necessarily one provider. Official docs show multiple product/API families, but product rights and market coverage vary. | Implement a provider-neutral capability/adapter layer that can support all three concurrently. Activate each provider/product only after contract, credentials, coverage, ticketing/servicing rights, financial-flow review and capability tests. See `07A-gds-provider-comparison-and-integration-strategy.md` and `ADR-GDS-001-multi-provider-adapters.md`. | P0 |

## Decisions to record as formal ADRs later

1. **Tanzania bus-ticketing role:** approved system owner vs partner-provider/agent; include technical, legal, financial and portability implications.
2. **Money-flow / merchant model by mode:** collection, supplier remittance, tax, refunds, chargebacks and customer disclosures.
3. **Passenger-data location and cross-border arrangement:** map data flows and permissions before selecting regions/vendors.
4. **Ferry market/jurisdiction scope:** Mainland-only launch vs Zanzibar-connected service after separate clearance.
5. **Travel-agent / tourism activity licensing:** activity-code and licence decision for bus/ferry-only then flights/stays/experiences.
6. **Corporate evidence:** intended structure is OuterBlocks Limited (parent) and OuterBlocks Destinations Limited (Travelar operator). The business decision is recorded; verify corporate records, intercompany/IP/tax arrangements, licensing and actual account ownership before activation.

## Change-control rule

Any later research or engineering agent that changes a status, recommendation, API contract, regulatory premise, legal entity, commercial model or domain must:

1. cite the new primary evidence;
2. identify the old entry and the specific conflict;
3. update this register and linked requirement/ADR;
4. state who approved the decision and when; and
5. avoid claiming production compliance until documentary evidence is attached.


## Stage 4 — Payment provider and accounting assumptions (added 23 October 2026)

| ID | Statement / question | Classification | Evidence / conflict | Decision or validation action | Priority |
|---|---|---|---|---|---|
| A-031 | Travelar should support several PSPs through adapters, rather than one global PSP. | Explicit product-owner decision | Product-owner instruction, consistent with provider differences | Implement adapter-neutral contracts and activate providers per country/method/contract. | P0 architecture |
| A-032 | ClickPesa has a safe sandbox for normal integration testing. | Contradicted by current official docs | Current ClickPesa docs state there is no sandbox and API calls move real funds; small live tests only. | Get written test plan; never treat API Explorer as a mock. | P0 |
| A-033 | A PSP callback alone always proves payment. | Contradicted as general design rule | Pesapal docs require transaction-status query after IPN; DPO has token verification; provider semantics differ. | Verify with each provider's documented authoritative mechanism and persist idempotent events. | P0 |
| A-034 | PSP acceptance of a refund request means refund completed. | Contradicted | Pesapal states an accepted request is sent to finance for processing and does not itself mean money has been refunded; DPO refund flow also requires provider-specific validation. | Separate refund requested, pending and completed states. | P0 |
| A-035 | Customer payment fees, including card surcharges, can simply be added to Travelar checkout. | Contradicted/unknown by method and market | BoT 2024 fee guidelines prohibit card merchant-payment surcharges in their stated scope; ClickPesa's public pricing presents a customer card fee. The exact scope/application must be reconciled. | Do not apply card surcharge pending written legal/PSP confirmation; model cost as merchant expense by default. | P0 |
| A-036 | A public PSP price table is Travelar's contracted fee schedule. | Unsupported | ClickPesa public pricing is not OuterBlocks's executed tariff; Selcom, Pesapal and DPO Travelar quotes unverified. | Obtain written account-specific tariffs, fee allocation and settlement schedules. | P0 |
| A-037 | The provider that collects customer money can automatically pay unrelated operators from the same merchant balance. | Unknown / not assumed | Marketplace/submerchant payout, settlement, account structures and payment licence scope require PSP contract and legal review. | Get written approval for exact funds flow or adopt a legally reviewed alternative. | P0 |
| A-038 | Gross booking value (GBV) is Travelar's recognized revenue. | False as general principle | Principal/agent role and contracts determine revenue presentation; operator/supplier payable and refunds are liabilities in relevant models. | Accountant to sign off role/revenue memo by mode before forecasts/launch. | P0 |
| A-039 | Public API documentation establishes production eligibility. | False | APIs still require merchant KYC, contracts, credentials, country/method permissions and production testing. | Track eligibility and activation evidence separately from adapter code readiness. | P0 |
| A-040 | A multi-provider payment architecture implies OuterBlocks is a regulated PSP or can custody funds. | False | Architecture is not a licence or funds-flow opinion; Tanzania NPS framework regulates payment systems and PSPs. | Written legal assessment of OuterBlocks's exact merchant/agent/settlement role required. | P0 |
| A-041 | Financial scenarios can use market-average fees or acquisition costs without evidence. | Unsupported | No executed Travelar tariff or measured pilot inputs available in this research installment. | Use clearly labeled editable assumptions and replace them with quotes/pilot data. | P0 |
| A-042 | Email/SMS/other communications should use one provider and failover by blindly resending after errors. | Rejected design assumption; user-confirmed multi-adapter direction | Product-owner instruction (23 Oct 2026); Resend, Amazon SES and Twilio docs show provider-specific event semantics and asynchronous delivery reports; timeouts may leave acceptance uncertain. | Use provider-neutral channel adapters, a capability registry, durable notification outbox, provider-attempt/event log and policy-driven failover. Do not blindly fail over ambiguous submissions; enforce sender-ID, country, consent, data-transfer and message-category rules. See `ADR-COMMS-001-multi-provider-communication-adapters.md`. | P0 architecture |

## Stage 5 — Unified product requirements (added 23 October 2026)

| ID | Statement / question | Classification | Evidence / conflict | Decision or validation action | Priority |
|---|---|---|---|---|---|
| A-042 | The six travel modes can be displayed and enabled identically in every country. | Rejected | Supply authorization, supplier contracts, ticketing rights and market regulations vary by mode and market. | Configure per-country/per-mode activation; do not present unavailable mode as transactional. | P0 |
| A-043 | One passenger/guest form can be used unchanged for bus, ferry, air, train, stays and experiences. | Rejected | Official supplier flows have different data needs; passenger fields depend on provider, itinerary, passenger category, operator and law. | Use versioned field rules by market/mode/supplier/service/passenger type; collect minimum necessary data. | P0 |
| A-044 | A supplier's search result can be booked later with the same price without revalidation. | Rejected | Expedia Rapid documents a Price Check step before booking; Booking.com uses preview/create for its supported in-platform flow. | Make reprice/preview/hold requirements adapter capability-specific and require user acceptance of material changes. | P0 |
| A-045 | A “booking confirmed” state can cover reservation, payment, ticket issuance and message delivery. | Rejected | The lifecycle operations are separate in supplier documentation and provider callbacks are asynchronous. | Maintain separate booking, payment, ticket/fulfilment, refund, settlement and notification state machines. | P0 |
| A-046 | API adapter readiness means a supplier mode is legally/commercially ready for production. | Rejected | Production eligibility and supplier agreements remain external dependencies. | Add documented activation gate with contract/permission, market coverage, financial/privacy review, tests and approval evidence. | P0 |
| A-047 | OIMS must always replace the operator's existing system. | Rejected | The product scope explicitly includes primary-system, integrated-existing-system and distribution-only operating models. | Choose a recorded source-of-truth map per operator and integration mode. | P1 |
| A-048 | A marshal can always detect duplicate ticket use while offline across multiple disconnected devices. | Rejected | Disconnected devices cannot share real-time scan state; conflicting offline scan events require reconciliation and operational procedure. | Use signed/time-bounded caches, duplicate detection where connected, explicit provisional/offline states and conflict workflow; disclose residual risk. | P0 |
| A-049 | Admin/seniority implies permission to read all passenger data or move money. | Rejected | Least-privilege, purpose-scoped access and separation of duties are required design controls. | Use RBAC+ABAC, separate privileged permissions, maker-checker and audited break-glass. | P0 |
| A-050 | A successful communication API response proves the email/SMS was delivered. | Rejected | Providers distinguish request acceptance and asynchronous delivery events; some status callbacks can be delayed/out of order. | Normalize queue/acceptance/delivery/failure/unknown separately; reconcile uncertain sends before fallback to avoid duplicate sensitive notices. | P1 |
| A-051 | Website country path determines where customer data is stored. | Rejected | PDPC describes cross-border transfer controls separately from URL routing. | Map storage, backups, logs, support, subprocessors, analytics, GDS/PSP and messaging data flows; determine permits/adequacy/safeguards. | P0 |
| A-052 | Public API documents establish Travelar's production access and transactional rights. | Rejected | Booking.com, Expedia, GetYourGuide and Sabre document partner/contract/capability limits; provider access varies. | Track public docs, sandbox success, production credentials, rights and supplier coverage as separate evidence states. | P0 |
| A-053 | Support personnel can execute every change/refund to resolve customer contacts quickly. | Rejected | Financial actions need authorization/limits and the provider may not confirm synchronously. | Separate support case handling, refund request, approval, provider execution and confirmed outcome. | P0 |
| A-054 | Every country/mode search field should be mandatory to maximize passenger data completeness. | Rejected | Data minimization and mode/provider-specific requirements; Tanzania PDPC requires controller/processor registration and operates transfer permit process. | Require only fields with documented supplier/regulatory/operational reason and control access/retention by purpose. | P0 |

### Stage 5 decisions captured in the product baseline

- Use `13-product-requirements-and-business-rules.md` as the consolidated provisional requirement register.
- Use `14-public-website-sitemap-and-landing-page-brief.md` as the public UX/IA research brief.
- Use `15-mode-specific-search-and-booking-field-matrix.md` as the candidate search field model; it is not a provider schema.
- Use `16-oims-hims-agents-call-center-and-marshal-requirements.md` for enterprise/operations workflows.
- Use `17-role-permission-and-approval-matrix.md` as the proposed default-deny permission baseline.
- All requirements remain reviewable; production architecture/schema is not finalized and no production implementation is authorized by these documents.


## Stage 6 additions — architecture, data and security (23 October 2026)

| ID | Type | Statement | Status / consequence |
|---|---|---|---|
| A-ARCH-01 | Recommendation | Start from a modular monolith with PostgreSQL transactional core; extract services only on demonstrated need. | Proposed ADR-ARCH-001; requires engineering-capacity review. |
| A-ARCH-02 | Owner direction | GDS, PSP and communications providers are multi-provider adapters. | Confirmed direction; exact provider instances, markets and production permissions remain unverified. |
| A-DATA-01 | Open decision | Managed Supabase versus self-hosted Supabase versus custom backend + PostgreSQL. | Do not finalize until region, backup/support transfer, staffing, pricing, recovery and exit conditions are verified. |
| A-DATA-02 | Verified official source | PDPC Tanzania says a person/entity intending to transfer personal data outside the country must apply under its permit process; PDPC also states controller/processor registration applies before processing. | Map exact data flow and obtain jurisdiction-specific advice; do not overstate this as a universal blanket localization rule. |
| A-HOST-01 | Verified public provider status | Raxio's Tanzania page labels TZ1 under development as checked on 23 October 2026. | Do not treat as a live production hosting facility until current operational status is confirmed. |
| A-SCALE-01 | Hypothesis/test input | 100 million is a long-term registered-user ambition, not a load forecast. | Build measurable active-user, request-rate, concurrency, booking and provider-call scenarios; test and replace illustrative assumptions with telemetry. |
| A-SEC-01 | Recommendation | OWASP Top 10:2025 and ASVS 5.0 are current security baselines; NIST SP 800-61 Rev.3 (April 2025) is incident-response reference. | Use as test/control sources; they do not replace legal requirements or a threat model. |


## Architecture decision added 23 October 2026 — backend/database approach

**Recommendation:** own Travelar's custom backend and PostgreSQL domain; prefer a managed PostgreSQL service where exact region, legal assessment, contract, recovery and cost requirements are met. Supabase remains a candidate for managed PostgreSQL/Auth/supporting capabilities, not the automatic owner of critical business workflows. Self-managed PostgreSQL is conditional on evidenced jurisdiction/control or economics and operational capability. See `ADR-DATA-002-custom-backend-managed-postgres-preferred.md`. This is not a final vendor/region selection or production authorization.


## Stage 9 — Confirmed technology direction (24 October 2026)

| ID | Classification | Entry | Consequence / gate |
|---|---|---|---|
| A-STACK-01 | Product-owner direction + proposed technical decision | Travelar will use its own custom backend and PostgreSQL database rather than rely on Supabase as the platform. | Build direct PostgreSQL 18.x environment and custom API; hosting provider/location must still pass legal, recovery, security and cost evaluation. Supabase is not selected. |
| A-STACK-02 | Recommended baseline | React + TanStack Start frontend; NestJS + TypeScript core API on Fastify adapter; Node.js 24 LTS candidate; PostgreSQL 18.x; Drizzle + node-postgres candidate with explicit SQL for high-integrity paths. | Final lock after technical proof of concept, team-skill confirmation, PostgreSQL 18 hosting support and representative concurrency tests. |
| A-AUTH-01 | Recommendation | Do not implement complete authentication from scratch for the initial production release. Prefer self-hosted Keycloak in verified Tanzania hosting using OIDC/OAuth, subject to legal, hosting, operations and proof-of-concept gates; retain Auth0 as a contingency. | Keycloak production requires counsel/PDPC review of exact data flows, written host/location/security evidence, funded identity operations and security/recovery PoC. Auth0 is only a contingency if its processing is legally acceptable and operationally preferable. |
| A-AUTH-02 | Architecture rule | Authentication is separate from Travelar authorization; internal user IDs, operator/branch memberships, tenant policies and financial approvals remain in Travelar. | External `(issuer, subject)` maps to stable `user_id`; do not rely solely on vendor roles or client claims. |
| A-DB-18 | Verified fact + direction | PostgreSQL 18.6 is the latest listed PostgreSQL 18 minor on the research date; PostgreSQL 18 supported through Nov 14, 2030. Supabase's May 2026 notice says PostgreSQL 17 is the platform default at that time; specific projects can differ. | Pin supported current PostgreSQL 18 minor and revalidate version/driver/migration compatibility at deployment. Do not claim every Supabase project is necessarily on PG17. |


## Stage 10 — Authentication and local identity hosting (24 October 2026)

- **Decision direction:** Prefer self-hosted Keycloak in a verified Tanzanian environment for the Tanzania-first phase; conditional on counsel/PDPC, hosting due diligence, operational ownership and proof of concept.
- **Verified fact:** Tanzania PDPA sections 31–32 address cross-border data flow; GN 449C of 2023 regulation 20 and PDPC public guidance describe a transfer-permit process. These sources do not establish an unqualified rule that every category must always be hosted only in Tanzania.
- **Verified fact:** Keycloak official supported configurations currently list PostgreSQL 18.x; 26.8.1 was released on 13 October 2026. Re-check release/security notices at implementation time.
- **Unresolved:** the exact Tanzania hosting facility, physical locations of replicas/backups/logs/telemetry, foreign support access, email/SMS flow, cross-border permits/safeguards, and staffing/SLA costs.
- **Rejected for launch:** custom authentication from scratch. Auth0 remains contingency, not primary direction.

## 2026-10-24 hosting-provider shortlist update

- **Explicit user preference:** NIDC and Wingu Africa are the initial local hosting candidates.
- **Decision recorded:** evaluate both through an identical RFI; do not designate primary/DR provider yet.
- **Verified public facts:** NIDC publishes VM and colocation catalogue pricing; Wingu publishes Tanzania colocation/facility information and a dated Flashnet managed-cloud/backup/DR partnership announcement.
- **Critical unresolved questions:** NIDC's actual current service/catalogue, 1 Mbps bandwidth meaning and CPU/core spec; Wingu vs Flashnet contract boundary; current SLA and site-specific certification; data-location and support-access terms; PostgreSQL 18/Keycloak deployment support; DR location, RPO/RTO and restoration evidence; complete TCO.
- **Reference:** `36-hosting-provider-evaluation-nidc-wingu.md`; `ADR-HOST-001-nidc-wingu-shortlist-no-selection.md`.


## Stage 11 — Keycloak versus self-hosted Supabase Auth (24 October 2026)

| ID | Statement / question | Classification | Evidence / conflict | Decision or validation action | Priority |
|---|---|---|---|---|---|
| A-055 | Self-hosted Supabase Auth cannot run except on PostgreSQL 17. | Unsupported as an absolute statement | Supabase's bundled self-hosted stack defaults to PG17; standalone GoTrue/Auth is documented, but the reviewed sources do not prove all custom PG18 combinations are officially supported. | Treat PG17 as the documented bundle baseline; require a tested and supported deployment specification before using a custom variant. | P1 |
| A-056 | PostgreSQL 17 is inherently insecure because Travelar plans PG18. | Rejected | PostgreSQL project lists PG17 as supported through 8 November 2029 and PG18 through 14 November 2030. | Keep each major version on a current patched minor; choose Keycloak mainly for architecture/IAM fit and explicit PG18 support, not fear of PG17. | P1 |
| A-057 | Keycloak automatically guarantees Tanzanian data-protection compliance when hosted locally. | Rejected | PDPC's transfer framework covers data flows; backups, logs, support, monitoring and communications may still cross borders. | Map each flow; obtain legal/PDPC guidance and verify hosting contract locations/access. | P0 |
| A-058 | Keycloak is intrinsically more secure than Supabase Auth. | Not established | Both are capable identity systems; security depends on design, patching, configuration, infrastructure and operational execution. | Use Keycloak as the preferred architectural fit; prove controls via POC and security review. | P0 |

## Stage 13 — frontend product-owner clarification (24 October 2026)

| ID | Statement / question | Classification | Current treatment | Priority |
|---|---|---|---|---|
| A-059 | Train and Experiences might be only future roadmap modes because the latest detailed UI message described bus, ferry, flights and hotels. | Superseded by explicit owner clarification (24 Oct 2026) | All six modes—bus, ferry, flights, stays, train and experiences—are first-class product scope now. Include train and experiences in navigation, PRD, search matrix, adapters, data model and test plan; enable transactional supply by market only after authorization and end-to-end validation. | P0 |
| A-060 | Historical draft used “Travelar Destinations Limited” while the then-current baseline named OuterBlocks Limited as operator. | Superseded by explicit owner decision in Stage 21 | Use OuterBlocks Limited as parent and OuterBlocks Destinations Limited as intended Travelar operating entity. `Travelar Destinations Limited` is superseded and must not be used. Registry/authority verification remains mandatory before contracts/live operation. | P0 |
| A-061 | Bus departure/destination search is the same as the complete bus service origin/destination. | Rejected assumption | Results must show full service and requested passenger segment separately; price, time, duration and inventory are segment-specific. | P0 |
| A-062 | Infant counts can be handled by the Adult/Child passenger category field without a defined age policy. | Unknown / design gap | Define age bands, seat/occupancy, fares, ID and booking policies per mode/country/operator before implementation. | P0 |
| A-063 | Ferry resident/non-resident price examples are live authoritative tariffs. | Rejected assumption | Treat as illustrative until operator confirms rates, residency criterion, evidence, class, category, currency and taxes. | P0 |
| A-064 | PSP webhook success by itself is sufficient to issue a ticket. | Rejected design assumption | Verify webhook/authenticity, reconcile payment, ensure valid inventory/supplier confirmation and apply idempotent issuance state. | P0 |
| A-065 | User location should always cause automatic GPS redirect. | Rejected default behavior | Prefer coarse market suggestion with manual override; request precise geolocation only when needed/consented. Country selection does not set data residency. | P1 |
| A-066 | “Everything is configurable” means a console can disable any safety or financial invariant. | Rejected assumption | Business rules are validated/versioned/effective-dated; security, accounting balance, authorization and inventory invariants remain enforced by backend/database controls. | P0 |
| A-067 | Current frontend code has been reviewed by the research effort. | Unknown / unsupported | User describes existing frontend, but source repository/files were not supplied in this conversation. Inspect current source before recommending code-level changes. | P1 |


### Stage 14 clarification — six first-class modes (24 October 2026)

| ID | Statement / question | Classification | Current treatment | Priority |
|---|---|---|---|---|
| A-068 | Train and Experiences should be treated as future modes because the detailed frontend clarification gave four workflows. | Explicitly rejected by owner | All six modes are in current product scope and must be researched/designed/architected now. Per-country transactional readiness remains subject to verified authorized supply, contracts and testing; this is not a reason to classify them as future modes. | P0 |

### 24 October 2026 — IDE agent operating model

- **Confirmed product-owner requirement:** Cursor/Antigravity (or equivalent) must work as senior engineering assistants, not code generators, and must follow source-of-truth → review → gap/research → requirement/ADR → design → implement → test → security/performance → document → reconcile → next dependency.
- **Decision recorded:** common repo-level `AGENTS.md` and portable Agent Skills; Cursor-specific rules/hooks as supplements; Antigravity Skills rather than legacy workflows; deterministic CI and human review are the enforcement layer.
- **Verified capability:** official docs describe Cursor Agent/Plan/Rules/Skills/Hooks/Bugbot and Antigravity editor/terminal/browser agents, artifacts, rules/skills and permission controls.
- **Not yet verified:** relative quality, defect rate, cost, review effort or speed on Travelar's actual repository. Run the benchmark in Document `41` before broad adoption.
- **Security condition:** no live passenger/financial data or production secrets in agent contexts; review vendor data processing/subprocessor terms, limit MCP tools and remote agent permissions.
- **Current tooling note:** Antigravity documentation says legacy workflows stopped being indexed/executable after 19 October 2026; use `.agents/skills/<name>/SKILL.md` and verify supported product surface.


## Stage 17 finance decisions and unresolved facts (24 October 2026)

### Proposed architecture decisions
- Use one controlled double-entry GL and independently reconciled mode subledgers/reports for BUS, FERRY, FLIGHT, STAY, TRAIN and EXPERIENCE. Mode-level separation is required for management reporting and audit, but does not by itself create separate legal entities or require six bank accounts.
- Use explicit payment routes and supplier commercial agreements instead of a global “Travelar collects” assumption. Store operator-specific commission, markup, refund and payout terms with versions and booking snapshots.
- If direct operator PSP does not support a documented/approved split to Travelar, automatic commission deduction before operator settlement is not available through that route. Use agreed invoice/remittance or another approved mechanism, or do not enable that commercial arrangement.
- Treat platform collection and payouts for operators without their own PSP as a separate legal/provider/treasury design requiring written approval.
- Block train commission or markup until the specific railway/reseller agreement expressly permits the model.

### Unknown / evidence required
- ClickPesa, Selcom, Pesapal and DPO public docs reviewed do not establish the precise marketplace split-settlement capability for Travelar's intended account structure. Provider RFI and account-level proof required; do not infer capability from a collection and payout API.
- Payment-services legal classification, licensing/agent/custody requirements and funds segregation depend on exact contracts and money flows. National Payment Systems Act section 5 creates a regulatory gate but is not by itself a definitive classification of every marketplace route.
- Exact flight consolidator/IATA/BSP/ticketing authority, hotel/OTA merchant model, experience platform access, supplier net terms, train reseller permissions, commission base/rate, taxes, PSP tariffs and payout schedules remain unconfirmed.

### Stage 20 decisions and new evidence (24 October 2026)

| ID | Statement / question | Classification | Current treatment / required action | Priority |
|---|---|---|---|---|
| A-069 | OuterBlocks Destinations Limited is Travelar’s operating subsidiary/entity of record. | Intended structure confirmed explicitly by product owner; legal status/parent relationship unverified | Treat OuterBlocks Limited as parent and OuterBlocks Destinations Limited as intended operating entity in product architecture. Obtain BRELA extracts, ownership evidence, corporate objects, TIN/licences, signatory authority, IP/intercompany agreements and payment-account/regulatory evidence before execution. Do not use `Travelar Destinations Limited`. | P0 |
| A-070 | `origin_source` alone decides commission and settlement. | Rejected as too simplistic | Preserve authenticated immutable source evidence; derive financial treatment from signed agreement, mode/product, market, seller/merchant role, fare base, discounts/refunds/payment model and effective versions. Corrections append evidence and approved accounting corrections. | P0 |
| A-071 | All operator-originated OTC/agent/call-center tickets should always carry 0% Travelar commission. | Commercial proposal, not globally verified | Store the proposed rule as an agreement-specific policy, subject to signed operator terms; do not infer white-label/API treatment; distinguish zero marketplace commission from other fees/taxes/obligations. | P0 |
| A-072 | Travelar can run agent pre-funded float wallets without additional legal classification. | Unknown | Separate agent incentives from float/credit and customer funds; do not activate stored-value/cash-out/transfer capability until counsel/BoT/PSP review and approved contracts. | P0 |
| A-073 | Direct LATRA/TRA production endpoints exist for all capabilities in the proposal. | Unknown; no entitlement established | Use configurable capability adapters and obtain interface docs, legal eligibility, security/test procedures and production approval. Public LATRA statements confirm system-connection requirements and provider ecosystem, not open access for Travelar. | P0 |
| A-074 | GN 158C is irrelevant because operator counters historically take cash. | Rejected assumption | Official 2026 Order lists long-distance bus/ferry/air/rail fares, hotel/accommodation and tourism-related services for electronic payments. Obtain urgent advice on scope, new entrants and transition; update payment-method eligibility by jurisdiction/channel/effective date. | P0 |
| A-075 | A Travelar ticket PDF or PSP receipt is equivalent to a fiscal receipt. | Rejected | Keep ticket, payment evidence, fiscal receipt/authority acceptance and booking states separate. Confirm responsible issuer and approved EFD/VFD integration route with TRA/tax adviser. | P0 |
| A-076 | A Redis TTL lock guarantees safe inventory on its own. | Rejected | Keep PostgreSQL transactions/constraints and segment/capacity rules authoritative; Redis can be optional coordination/cache after failure-mode proof. | P0 |
| A-077 | Every PSP callback can be verified with one hardcoded HMAC and IP allowlist. | Rejected | Implement each provider's documented signature/auth protocol; HMAC only when supported, IP allowlist as extra defense, plus idempotency, replay controls and authoritative status reconciliation. | P0 |
| A-078 | A hash chain alone makes the ledger immutable against privileged DB administrators. | Rejected | Append-only double entry/reversal controls remain primary; hash chaining is only layered evidence unless independently signed/exported and protected from the same administrator. | P1 |
| A-079 | Cloudflare WAF/bot controls and its granular rate limits are available at a fixed feature set/price. | Unknown/vendor-plan dependent | Evaluate current plan/contract, geography/data treatment, features, logs and TCO; application-layer quotas remain required. | P1 |
| A-080 | OIMS's inventory authority is identical across every mode and supplier. | Rejected | OIMS manages self-listed/directly operated bus/ferry/stay/experience inventory as permitted; for GDS/OTA/rail providers it manages only authorized supplier configuration, mappings, support and exceptions, while external provider remains authoritative where contracted. | P0 |
| A-081 | GN 158C's six-month transition definitively ends for every Travelar channel on one unambiguous date. | Unknown application to new entity/channels | Counsel must confirm transition interpretation and how the rule applies to new entrants/entity changes; do not infer treatment from dates alone. | P0 |

### Stage 20 architecture additions

- Added `ADR-CORP-001` (entity verification gate), `ADR-CHAN-001` (channel evidence and commercial policy), and `ADR-REG-002` (electronic-payment/fiscal gates).
- Added Documents `51`–`55` and `sources-and-evidence-register-stage20.md`.
- Existing PostgreSQL 18 + custom backend direction, Keycloak-first conditional IAM direction, and NIDC/Wingu shortlist/verification gate remain unchanged. Cloudflare and Redis are not selected by this stage.
