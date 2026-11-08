# Travelar Research — Cumulative Travelar Research Bundle — Stages 1–21

**Current cumulative update: Stage 21 (24 October 2026).** Adds ClickPesa payment-product research, OTC counter collection workflows, payout/reconciliation limitations, confirmed intended legal-entity direction, and live-money test gates. Historical documents remain as numbered source artifacts; for current OTC/payment requirements, review documents `56`–`60` and `ADR-PAY-002`.


**Product:** Travelar  
**Parent company:** OuterBlocks Limited  
**Intended operating entity:** OuterBlocks Destinations Limited  
**Audit date:** 24 October 2026  
**Coverage:** Numbered research documents `00`–`60`, architecture decision records and stage source registers, including the local identity, hosting, AI-agent governance, cybersecurity, financial control and payment-flow research.

## What this bundle is

This is the cumulative research baseline for Travelar covering Tanzania-first regulatory feasibility, the local market, supplier access across six first-class booking modes (bus, ferry, flights, stays, train and experiences), multi-provider GDS/PSP/communications architecture, financial controls, product requirements, architecture/security, and implementation governance. Public research is not a substitute for a regulator's written classification, a signed supplier agreement, a production credential, or formal legal/accounting advice.

## Confirmed product/architecture directions

- Product name: **Travelar**; parent company: **OuterBlocks Limited**; intended operating entity: **OuterBlocks Destinations Limited**. Legal registration, parent relationship, operating authority and permissions remain document-verification items.
- The six intended booking modes are bus, ferry, flights, train, stays and experiences.
- Travelport, Sabre and Amadeus can coexist through adapters; no single GDS is presumed to be the only provider.
- PSPs are adapters; communications providers are adapters with controlled, delivery-aware failover.
- Bus inventory is segment-based; ferry inventory is capacity/class-based by default, not a conventional numbered-seat map.
- Current architecture recommendation: custom Travelar backend + PostgreSQL 18; managed or self-managed database hosting is selected by jurisdiction, contract, recovery and security gates. Supabase is not the chosen application platform.
- No public API, sandbox account, domain or interface alone establishes production authorization.
- Identity direction: self-hosted Keycloak is preferred over bundled self-hosted Supabase Auth for the current custom-backend/PG18 architecture, subject to legal, hosting and POC gates. PostgreSQL 17 is still supported; the version difference is not treated as an inherent security issue.

## Document index

The requested numbered set is present as `00`–`31`:

- `00` executive research brief
- `01` assumptions, contradictions and decisions
- `02` regulatory requirements by country
- `03` market entry and country prioritization
- `04` competitor and marketplace analysis
- `05` operator systems and integration opportunities
- `06` booking-mode and supplier capability matrix
- `07` GDS, flight, accommodation and ticketing research
- `07A` GDS provider comparison and adapter strategy
- `08` train, ferry and bus integration research
- `09` experiences and activity supplier research
- `10` PSP, communications and USSD comparison
- `11` revenue model and unit economics
- `12` financial accounting, settlement and reconciliation
- `13` product requirements and business rules
- `14` public website sitemap and landing-page brief
- `15` mode-specific search and booking field matrix
- `16` OIMS, HIMS, agents, call center and marshal requirements
- `17` role, permission and approval matrix
- `18` company structure and investment readiness
- `19` system context and integration architecture
- `20` architecture options and decision records
- `21` country data residency and hosting strategy
- `22` domain model and logical data architecture
- `23` API and adapter standards
- `24` security threat model and control matrix
- `25` reliability, scalability and performance plan
- `26` observability, incident response and disaster recovery
- `27` build sequence and dependency graph
- `28` phase-by-phase engineering roadmap
- `29` Definition of Done and testing strategy
- `30` IDE-agent operating charter
- `31` open questions and evidence needed before launch
- `32` research quality audit and launch-readiness gate (added at Stage 8)

Architecture decision records (`ADR-*.md`) preserve the multi-GDS, multi-PSP, multi-communications, modular-monolith, backend/database and Keycloak-first directions. Stage source registers record public documentation used in each research stage.

## Additional documents added after the original 32-document set

- `32-research-quality-audit-and-launch-readiness-gate.md`
- `33-authentication-provider-and-identity-architecture.md`
- `34-technology-stack-evaluation-and-recommendation.md`
- `35-keycloak-and-local-identity-hosting-assessment.md`
- `36-hosting-provider-evaluation-nidc-wingu.md`
- `37-keycloak-vs-self-hosted-supabase-auth.md`
- `38-hosting-verification-location-data-flows-backups-recovery-security.md`
- `39-frontend-current-requirements-and-product-owner-clarifications.md`
- `40-train-and-experiences-first-class-mode-research.md`
- `41-ide-agent-capability-assessment-and-engineering-control-system.md`
- `42-cybersecurity-self-defence-detection-and-response-architecture.md`
- `43-travelar-financial-control-system-commercial-rules-and-mode-subledgers.md`
- `44-travelar-payment-routing-settlement-and-supplier-funding-models.md`
- `45-operator-commission-markup-and-supplier-commercial-terms-ruleset.md`
- `46-destination-discovery-editorial-content-and-travel-guides.md`
- `47-data-driven-platform-configuration-search-and-rules-governance.md`
- `48-hims-oims-operating-systems-modules-and-shared-engines.md`
- `49-role-based-daily-workflows-and-user-journeys.md`
- `50-data-driven-architecture-acceptance-and-build-sequence.md`
- `ADR-DATA-003-data-driven-configuration-with-code-enforced-invariants.md`
- `ADR-OPS-001-hims-oims-boundaries-and-shared-domain-engines.md`
- `sources-and-evidence-register-stage19.md`
- `ADR-CONTENT-001-utility-led-homepage-and-governed-destination-information.md`
- `sources-and-evidence-register-stage18.md`

## Stage 19 update — data-driven platform and operational systems

Platform-wide rule: production-varying catalogs and business policies must be database-backed, scoped, versioned and published through governed workflows. Search endpoints, route/stop eligibility, result-card profiles, markets, prices, customer fields and offers are fetched from authorized APIs. Security, state, inventory concurrency, payment verification, accounting and tenancy invariants remain enforced in reviewed code and database constraints; arbitrary executable rules in the database are not permitted. HIMS and OIMS are distinct workspaces on shared domain engines; module and day-in-the-life workflows are defined in documents `48` and `49`. The starting workflow architecture remains a modular monolith with explicit state machines, task records and workers; BPMN/DMN/durable workflow tooling requires a focused proof-of-concept rather than assumption.

No repository implementation or test execution was performed in this research stage. Current frontend hardcoding, role coverage and live workflows remain unverified until the actual source repository is reviewed.

## Stage 21 update — ClickPesa OTC payment capability, reconciliation and intended operating entity (24 October 2026)

The product owner has confirmed OuterBlocks Limited as parent and OuterBlocks Destinations Limited as the intended operating subsidiary/entity of record; this supersedes the older operating-company assumption and the draft name Travelar Destinations Limited. This owner decision is the intended product/company baseline, while actual corporate registration, relationship, licenses, signatory authority, accounts and tax/IP arrangements remain documentary checks.

Current ClickPesa public documentation describes USSD Push, BillPay order/customer numbers, TANQR/Lipa Namba collection, cards/hosted checkout, query/webhooks and mobile/bank/TanQR payouts. The preferred initial OTC proof of concept is order-level BillPay with exact payment behavior for a single ticket and USSD Push as an assisted option; activate generic Lipa Namba only where payment-to-order matching is proven. ClickPesa states it has no sandbox, that API calls move real funds, and that payout creation is rate-limited to one create request per merchant every 60 seconds. Therefore mock/contract tests must precede an approved small-value live test. Public docs do not establish marketplace split settlement, universal refunds, exact control-number expiry, or a final signed fee schedule. See Documents `56`–`60`, `ADR-PAY-002`, and `sources-and-evidence-register-stage21.md`.

**No repository code has been changed and no ClickPesa live transaction was performed by this research.**

## Current readiness position

**Production: NO-GO.** The bundle is a research baseline, not evidence of legal clearance or production readiness. OuterBlocks must obtain and review current corporate/business records, written regulator classification, current approved supplier status, signed contracts, live entitlement/certification, data-transfer/hosting clearance, a lawful funds-flow and accounting model, and passed technical/security/recovery tests. Refer to `32-research-quality-audit-and-launch-readiness-gate.md` for gates G0–G13 and the immediate work order.

## Evidence quality rules

Use the status vocabulary `Verified — primary source`, `Corroborated`, `Provider-claimed`, `Contracted`, `Production-enabled`, `Hypothesis`, `Unknown / direct confirmation required`, and `Expired / revalidation required`. Keep source date and claim scope visible. Do not interpret a provider's public API docs as proof that OuterBlocks has production access. Do not imply legal advice, final approved architecture or authorization to go live.

## Recommended immediate next step

Hold a founder-led scope/evidence review and assign named owners to G0–G13. In parallel, request the regulator/provider evidence packs listed in document `32`. Limit engineering experiments to synthetic data and authorized non-production environments until the required production gates pass.


## Stage 9 update — technology and authentication

The current direction is a custom Travelar backend and direct PostgreSQL 18.x database, not Supabase as the platform. Recommended web: React + TanStack Start. Recommended core backend: NestJS + TypeScript using the Fastify adapter. Drizzle + node-postgres is a provisional data-access candidate; critical transactions must use explicit reviewed SQL/constraints and concurrency tests. Node.js 24 LTS is the runtime candidate as of the research date.

Do not build all authentication from scratch. Current direction: **self-hosted Keycloak in a verified Tanzanian environment**, conditional on legal, hosting, operations and proof-of-concept gates. Auth0 remains a contingency if its exact processing arrangement is approved and operationally preferable. Tanzania PDPA sections 31–32 and GN 449C regulation 20 make cross-border flows a material assessment; they do not by themselves establish that every personal-data category must always remain in Tanzania. Local Keycloak also does not localize foreign email/SMS, telemetry, remote support or offsite backups. Internal authorization and business-role policy stay in Travelar.

See `33-authentication-provider-and-identity-architecture.md`, `34-technology-stack-evaluation-and-recommendation.md`, `35-keycloak-and-local-identity-hosting-assessment.md`, `ADR-AUTH-001-keycloak-first-local-identity.md` (updated: Keycloak-first conditional direction), `ADR-STACK-001-tanstack-start-nestjs-fastify-postgres18.md`, and source registers `sources-and-evidence-register-stage9.md` / `sources-and-evidence-register-stage10.md`.


### New in Stage 9
- `33-authentication-provider-and-identity-architecture.md`
- `34-technology-stack-evaluation-and-recommendation.md`
- `35-keycloak-and-local-identity-hosting-assessment.md`
- `ADR-AUTH-001-keycloak-first-local-identity.md` (updated: Keycloak-first conditional direction)
- `ADR-STACK-001-tanstack-start-nestjs-fastify-postgres18.md`
- `sources-and-evidence-register-stage9.md`


## Stage 10 update — Keycloak and local identity hosting

Current preference: self-hosted Keycloak deployed in a verified Tanzanian environment if OuterBlocks can meet production security, support and recovery standards. This is a way to increase control over identity-data location and reduce cross-border flows; it is not proof that every category of data must remain locally or that local hosting alone ensures compliance. Current Keycloak documentation lists PostgreSQL 18.x as supported and lists 26.8.1 as released on 13 October 2026; revalidate the version before production.

New in Stage 10: `35-keycloak-and-local-identity-hosting-assessment.md`, updated `33-authentication-provider-and-identity-architecture.md`, updated `21-country-data-residency-and-hosting-strategy.md`, and revised `ADR-AUTH-001-keycloak-first-local-identity.md`.

## Stage 10 update — NIDC and Wingu hosting shortlist (24 October 2026)

Added `36-hosting-provider-evaluation-nidc-wingu.md`, `ADR-HOST-001-nidc-wingu-shortlist-no-selection.md`, and `sources-and-evidence-register-stage10.md`. `21-country-data-residency-and-hosting-strategy.md` and `01-assumptions-contradictions-and-decisions.md` have been updated. NIDC and Wingu are shortlisted only; neither is selected as production or DR host. Production selection requires written RFI responses, technical testing, legal/data-flow review, SLA/backup/restore evidence and total cost comparison.


## Stage 11 addition

- `37-keycloak-vs-self-hosted-supabase-auth.md` compares the alternatives, PostgreSQL support, operational obligations and required proof-of-concept gates.
- `ADR-AUTH-002-keycloak-vs-supabase-auth.md` records the conditional Keycloak-first decision and revisit criteria.

## Stage 12 — Hosting verification before production

- `38-hosting-verification-location-data-flows-backups-recovery-security.md` — public-source verification and launch gate for NIDC, Wingu/Flashnet, cross-border flows, backups, RPO/RTO, security operations and non-production tests.
- `ADR-HOST-002-verification-before-production.md` — prevents premature provider selection based on public claims alone.
- `sources-and-evidence-register-stage12.md` — primary sources and evidence gaps.

The hosting decision remains open. Public provider statements are classified separately from contract evidence, legal clearance and witnessed test results.

## Stage 13 — Current frontend/product-owner clarification (24 October 2026)

Added `39-frontend-current-requirements-and-product-owner-clarifications.md` as the current detailed workflow delta from the product owner. It now records all six modes—bus, ferry, flights, stays, train and experiences—as first-class product scope. The country/mode activation gate controls transactional readiness without treating train or experiences as deferred product modes. It details segment-aware bus search/results, same-screen bus details, ferry class/capacity and illustrative residency-price limitations, authoritative payment confirmation, thermal ticket PDF/animations, localization/country configuration, Keycloak identity boundaries, OIMS/HIMS and the open corporate entity question.

Documents `13`, `15`, `16`, `01` and `31` have been updated to cross-reference this delta; `sources-and-evidence-register-stage13.md` records sources and unresolved validation. That Stage 13 entity-conflict analysis is historical and is superseded by the Stage 21 owner decision: OuterBlocks Limited is parent; OuterBlocks Destinations Limited is the intended operating entity; Travelar Destinations Limited must not be used. Registry/authority proof remains required. The existing frontend source was not attached for inspection, so no code-level review or implementation-status claim is made.

### Stage 13 critical open questions

- Verify the confirmed intended OuterBlocks Limited → OuterBlocks Destinations Limited structure against actual corporate records, authority and regulatory permissions.
- Keep all six modes in the product baseline; determine which specific country/provider combinations can be transactionally activated at initial launch, and use only authorized referral/handoff or explicit unavailable states where transactional access is not available.
- Define infant age bands, occupancy and fares; validate gender/ID field policies by service and market.
- Obtain actual operator fare tables and define ferry residence/non-residence eligibility and evidence; the example values are not production fares.
- Test the exception path where payment confirms after inventory/booking hold expiry.
- Inspect the actual frontend repository before prescribing changes to components or design system.

Current production status remains **NO-GO** until the required regulatory, supplier, payment, data-protection, hosting and operational gates in document `32` are met.


## Stage 14 — Train and Experiences explicitly in scope (24 October 2026)

The product owner clarified that Train and Experiences must not be treated as future modes. They are first-class Travelar modes alongside Bus, Ferry, Flights and Stays and must appear in product requirements, navigation, search matrix, data/domain design, adapter architecture, and acceptance tests. `40-train-and-experiences-first-class-mode-research.md` records current supplier evidence, integration options and access constraints: TRC's public SGR booking portal does not establish a public third-party API; Kenya Railways documents official online/counter/USSD booking but public materials reviewed do not establish partner API rights; Viator supports a transactional Partner API for qualifying merchant or Full-access + Booking partners; GetYourGuide restricts API access levels by partner criteria; Expedia Rapid Activities remains documented as selected-partner early access with general availability stated for 2027; Airbnb's public Experiences booking tool is being discontinued. Direct local activity supplier onboarding is therefore a core supply strategy, not an afterthought. Supplier access and country readiness gates remain mandatory.

New Stage 14 artifact: `40-train-and-experiences-first-class-mode-research.md`, updated `39`, `13`, `15`, `01`, `06`, `08`, `09`, `14`, `19`, `22`, `23`, `27`, `28`, `31`, source register and product scope index. Public-source evidence is distinguished from contracts/API credentials, none of which are assumed to exist.


## Stage 15 — IDE agent governance (24 October 2026)

- `41-ide-agent-capability-assessment-and-engineering-control-system.md` compares Cursor and Antigravity, defines the shared engineering cycle and deterministic controls, and specifies a controlled pilot.
- Updated `30-ide-agent-operating-charter.md`, `29-definition-of-done-and-testing-strategy.md`, `32-research-quality-audit-and-launch-readiness-gate.md`, `01-assumptions-contradictions-and-decisions.md`, and the executive brief.
- New artifact: `41-ide-agent-capability-assessment-and-engineering-control-system.md`.

## Stage 16 — Cybersecurity self-defence, detection and incident response (24 October 2026)

- `42-cybersecurity-self-defence-detection-and-response-architecture.md` defines the layered security architecture, frontend/API/server/database/identity/CI protections, event sources and alert catalogue, bounded automated containment, incident response/recovery, pre-launch security NO-GO conditions and evidence required.
- `ADR-SEC-001-layered-cyber-defence-and-security-observability.md` records the proposed mandatory direction and rejected alternatives.
- Updated the executive brief and cross-references in Documents `24`, `26` and `32`, plus `sources-and-evidence-register-stage16.md`.

The security program is an architecture and launch gate, not a claim of implementation or certification. Travelar must confirm its real PDPC status and data-flow obligations, run the actual controls in its selected hosting environment, demonstrate log/alert delivery and recovery, and obtain an independent security assessment with remediation/retest before the agreed production release gate. No particular security vendor, hosting provider or SIEM is selected in this stage.


## Stage 17 update — finance control system and payment routing (24 October 2026)

Stage 17 adds `43`–`45` and `ADR-FIN-002-mode-isolated-subledgers-and-contract-driven-payment-routing.md`. It defines a shared double-entry finance core with independently reconciled subledgers and reports for all six first-class modes; contract-versioned per-operator/supplier commission, markup and discount rules; explicit payment routes; payout/refund/settlement lifecycles; reconciliation, permissions and audit controls; and a provider RFI / evidence gates.

The central finding is that Travelar must not assume a single money flow across all modes. Direct operator collection does not automatically transfer commission to Travelar: a verified PSP split/connected-merchant arrangement is needed for automatic allocation; otherwise commission normally requires invoicing/remittance or another approved contractual route. Platform collection for operators without a PSP is possible only after the actual merchant/payment-service model, PSP contract, legal and tax responsibilities, supplier payout controls, refunds, liquidity and reconciliation are approved. Public documentation reviewed describes collection and payout capabilities for local PSPs, but does not by itself prove their marketplace split settlement for Travelar.

For flights, an API/GDS relationship does not itself establish ticketing authority or supplier settlement terms; Amadeus Self-Service documentation distinguishes customer collection from payment to the consolidator. Accommodation models vary between OTA-collected and property-collected payments. Viator distinguishes affiliate and merchant arrangements with different responsibility and payment models. TRC public ticketing materials do not establish Travelar reseller/commission rights; Kenya Railways' published Madaraka Express conditions warn that commercial resale may invalidate tickets. Therefore commission/markup is not preconfigured for train sales.

**Production remains NO-GO** until accountant/tax/legal review and the actual provider/supplier contracts confirm each route. A public API, separate payout API, or marketing claim is not proof of split settlement, merchant-of-record status, resale permission, or production access. See `sources-and-evidence-register-stage17.md`.

## Stage 18 update — utility-led homepage and practical travel guides (24 October 2026)

The homepage direction is now explicit: prioritize Hot Deals & Offers, Explore Destinations and useful Travel Guides & Tips, while keeping six-mode search and Help/Manage Booking accessible. This is not a generic marketing landing page; avoid “How it works,” “Why choose us,” unsupported testimonials and generic promotional filler. Destination pages and guides need structured content, canonical destination identity, official source links, visible review dates, applicable traveller context and an auditable editorial review/revalidation/withdrawal process—especially for visa, entry, health and safety claims. Initial destination examples (Paris, Zanzibar, Greece, Bali, Dar es Salaam) are ideas, not a measured popularity ranking. See document `46` and ADR `ADR-CONTENT-001`.

## Stage 20 — New deltas (24 October 2026)

- `51-corporate-identity-channel-attribution-and-commercial-model-delta.md`
- `52-tanzania-regulatory-adapter-and-electronic-payment-obligations.md`
- `53-white-label-agent-and-operator-channel-architecture.md`
- `54-security-and-concurrency-implementation-review.md`
- `55-proposed-build-dependencies-and-new-decision-gates.md`
- `ADR-CORP-001-legal-entity-and-contracting-party-must-be-verified.md`
- `ADR-CHAN-001-immutable-channel-evidence-and-versioned-commercial-policy.md`
- `ADR-REG-002-effective-dated-electronic-payment-and-fiscal-capability-gates.md`
- `sources-and-evidence-register-stage20.md`

Stage 20 was a historical delta that recorded the then-existing OuterBlocks Limited operating-company assumption; Stage 21 supersedes that assumption with OuterBlocks Limited as parent and OuterBlocks Destinations Limited as intended operating entity. Stage 20 keeps all six modes in scope; adds new source-confirmed electronic-payment-order analysis; and clarifies the approval gates for LATRA/TRA adapters, channel attribution, agent float, white-label routing and Redis-based concurrency proposals. No app repository was supplied, so no live code or tests were changed/run.


## Stage 21 — ClickPesa and OTC payment adapter

Documents `56`–`60` add the current ClickPesa collection/payout capability map, OTC flow/state machine, fees and reconciliation/provider RFI, Tanzanian electronic-payment/LATRA gates, and provider-aware acceptance/build sequence. `ADR-PAY-002-clickpesa-otc-billpay-and-lipa-namba-adapter.md` adopts ClickPesa only as an evidence-gated POC candidate within the existing multi-PSP architecture. Public API docs are not merchant entitlement or a split-settlement contract. Stage 21 updates the intended legal entity in current-state records without representing the registry relationship as independently verified.


## Stage 21 — ClickPesa OTC payment controls (24 October 2026)

Documents `56`–`60` and `ADR-PAY-002` add a current ClickPesa capability review, OTC payment orchestration, provider cost/reconciliation checks, Tanzania electronic-payment and LATRA gates, and acceptance tests. The preferred OTC proof of concept uses an order-specific BillPay control number in exact-payment mode where the account/product is approved; USSD Push and hosted checkout/card are additional methods where enabled. General static Lipa Namba/TANQR is a separate collection route and must not be treated as order-matched unless reference/amount matching is proven. ClickPesa public docs say it has no sandbox and API calls move real funds, so development uses mocks/contract tests and any live pilot is human-authorized. Public docs do not prove marketplace split settlement; get written account-level confirmation.
