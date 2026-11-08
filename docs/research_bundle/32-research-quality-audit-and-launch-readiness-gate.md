# 32 — Research Quality Audit and Launch-Readiness Gate

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Research audit date:** 24 October 2026  
**Coverage:** Cumulative documents `00`–`31`, architecture decision records, source registers and owner-confirmed product directions.

## 1. Executive decision

### Current status: RED for production launch; AMBER for controlled non-production discovery/prototyping

The cumulative research set is sufficiently developed to guide a formal founder, legal, supplier and engineering review. It is **not evidence that Travelar is legally cleared, commercially enabled, technically certified, or production-ready**. No public source can establish that OuterBlocks Destinations Limited (the intended operating entity) or OuterBlocks Limited (the parent) has obtained every required permission, signed a provider agreement, been granted live credentials, passed regulator certification, or contracted live supplier inventory. Those require records or written responses from the relevant parties.

**Permitted next work:** close research gaps, request written confirmations and commercial proposals, define a limited launch scope, produce architecture proofs using synthetic data, and test adapters in authorized sandboxes or approved non-production environments.

**Not authorized by this research:** accepting live passenger orders, collecting live customer funds, issuing production tickets, processing regulated passenger data in a not-yet-approved hosting setup, or representing any supplier as integrated/available without evidence.

## 2. Documentation completeness audit

The current cumulative bundle contains all 32 requested numbered document slots, `00` through `31`, plus the GDS, payment, communications and architecture decision records. The existence of these files proves document coverage—not that all external research or due diligence is complete.

| Audit area | Result | Qualification / action |
|---|---|---|
| Numbered deliverables `00`–`31` | Present in the cumulative Stage 7 directory | Check filenames in `README.md`; this audit is added as document `32`. |
| Brand and operating entity | Owner decision now consistent in principal current documents | Travelar is the product; OuterBlocks Limited is the parent and OuterBlocks Destinations Limited the intended operating entity. Registry status, authority and permissions remain to be independently checked. |
| Six booking modes | Covered in requirement and supplier matrices | Coverage does not establish a viable production supplier for each mode or route. |
| GDS multi-provider direction | Recorded in `ADR-GDS-001` | Provider credentials, product entitlements, content coverage, ticketing authority, supplier contracts and servicing capability remain provider-specific gates. |
| Multi-PSP direction | Recorded in `ADR-PAY-001` | Merchant underwriting, funds flow, payout/refund rights, fees and live credentials remain unconfirmed. |
| Multi-provider communications | Recorded in `ADR-COMMS-001` | Contracted fallback pairs, sender IDs, consent, coverage, delivery semantics and live testing remain open. |
| Modular monolith and PostgreSQL | Recommended, with decision records | Custom backend + managed PostgreSQL is the current recommendation, not a signed hosting selection or evidence of legal compliance. |
| Corporate structure | Document `18` was added to the Stage 7 set | Verify OuterBlocks records, IP ownership and contracts; no unconfirmed subsidiary/holding-company relationships are assumed. |
| Research / README consistency | **Needs correction in prior Stage 7 README** | Previous README heading and first paragraph say coverage is through Stage 6, while later sections describe Stage 7. This Stage 8 copy corrects the index and adds this audit. |
| Source coverage | Source registers exist for Stages 1, 2, 3, 4, 5, 6 and 7 | Provider marketing is not independent service validation; direct supplier/regulator confirmations are still required. |

## 3. High-priority audit findings

### Finding F-001 — LATRA Government Notice number needs source-of-law reconciliation

LATRA's public sources do not use a consistent Government Notice number for the 2024 Online Ticketing Regulations. The 23 June 2025 LATRA notice refers to Government Gazette No. 20, while the 30 January 2026 approved-systems announcement and the legal source register refer to Government Notice No. 23. The official regulation PDF is linked in the source register, but the inconsistency should be resolved against the authenticated original Gazette and any corrigendum before formal legal advice or filings cite the instrument number.

**Required action:** obtain the official Gazette copy from LATRA or the Government Printer, confirm the correct GN/issue/date, and ask whether any later amendment, fee notice, interpretation or replacement rule applies. Until then, describe the instrument by title and year and note the citation issue, rather than silently treating all official references as consistent.

Sources: [LATRA 2025 public notice](https://www.latra.go.tz/announcements/mifumo-ya-tiketi-mtandao-isiyoidhinishwa-mwisho-juni-30-2025), [LATRA 2026 approved-system notice](https://www.latra.go.tz/announcements/mifumo-ya-tiketi-mtandao-iliyoidhinishwa-kutoa-huduma-kwa-mabasi-yaendayo-mikoani-na-nchi-jirani), [LATRA 2026 Safari Tiketi update](https://www.latra.go.tz/news/safari-tiketi-enhances-travel-assurance), [official 2024 regulation PDF](https://www.latra.go.tz/uploads/documents/sw-1728393485-renamed%20kanuni%20za%20tiketi%20mtandao.pdf).

### Finding F-002 — “Approved”, “connected”, “listed” and “production-enabled” must not be conflated

LATRA's 30 January 2026 notice said ten systems had met the requirements and were approved at that point. LATRA's 8 October 2026 report says fourteen providers had connected their systems to Safari Tiketi. These are time-specific statements using different descriptions. The latter is not, by itself, a current certificate register or proof that a named provider can grant Travelar third-party access.

**Required action:** request a dated status register indicating the provider's legal owner, authorization/certificate status, validity dates, eligible modes/operators, connected-system status, and whether third-party distribution is contractually permitted. Use the term **“LATRA-reported connected provider”** when that is all the source proves.

Source: [LATRA, Safari Tiketi update, 8 October 2026](https://www.latra.go.tz/news/safari-tiketi-enhances-travel-assurance).

### Finding F-003 — Tanzania privacy registration and data-transfer readiness are launch gates

PDPC's published registration instructions state that a person shall not collect or process personal data without registration as a controller or processor. Its published cross-border transfer process asks for data categories, purpose, destination/recipient, duration/method and appropriate legal, technical and organizational safeguards. These are evidence of formal requirements; they do not decide which role(s) OuterBlocks holds or whether each planned transfer is permitted.

**Required action:** complete a data-flow map and controller/processor role analysis; confirm PDPC registration and DPO steps; inventory cloud, GDS, PSP, SMS/email, support, analytics, backups and security vendors; obtain written legal advice on required transfer permits and other safeguards before real passenger data crosses borders.

Sources: [PDPC registration](https://pdpc.go.tz/services/registration/), [PDPC cross-border transfer permit](https://pdpc.go.tz/services/cross-border-data-transfer-permit/).

### Finding F-004 — Supabase region choice is an explicit hosting gate, not a legal conclusion

Supabase's current public regions page lists Americas, Europe and APAC general regions and its listed specific regions, including Singapore, but does not list a Tanzania or Kenya region in the reviewed documentation. Supabase itself warns that the project region controls primary-data location and that choosing a region is not proof of regulatory compliance.

**Required action:** obtain written confirmation of actual project region and locations for backups, logs, support access and subprocessors; compare them with each market's applicable law and permit conditions. Do not describe Supabase as automatically compliant or automatically prohibited. If no acceptable hosted region or contractual safeguard exists, evaluate local/regional managed PostgreSQL or qualified self-managed hosting.

Source: [Supabase available regions](https://supabase.com/docs/guides/platform/regions).

### Finding F-005 — The payment legal classification depends on the real funds flow

The Bank of Tanzania's payment-system page lists the National Payment Systems Act, 2015 and payment-system licensing/approval regulations. This establishes the regulatory framework, not a ruling that a particular Travelar payment flow is permitted. A PSP's licence does not automatically classify Travelar's activity or authorize Travelar to custody, store, pool or transmit funds outside its approved merchant arrangement.

**Required action:** prepare a diagram for every launch model (customer → PSP/merchant account → Travelar/operator/supplier → refund/chargeback) and obtain Tanzanian counsel/BoT or PSP-compliance confirmation on whether OuterBlocks acts as merchant, disclosed agent, intermediary, marketplace or provides any regulated payment service. Design the ledger and settlement process only after this role is clear.

Source: [Bank of Tanzania — Payment Systems laws and regulations](https://www.bot.go.tz/PaymentSystem/regulations?lang=en).

### Finding F-006 — Several advertised modes remain supply hypotheses until contracts are executed

Official provider APIs show capabilities, but do not show that OuterBlocks has access. For example, Sabre says rail API/content use requires special permission and supplier agreements; Amadeus describes its enterprise rail APIs as requiring contact to gain access; Travelport documents flights and stays APIs but account eligibility and contracts remain separate matters. The same distinction applies to local rail operators, ferry operators, activity suppliers, hotel inventory and authorized bus-ticketing partners.

**Required action:** require an evidence pack for each production supplier: signed agreement, eligible territories/content, account/credential entitlement, production approval, permitted booking channels, ticket/voucher authority, servicing/refund rights, settlement/funds flow, data terms, SLA/escalation and termination/portability. Do not mark a mode “live” based on docs or a sandbox alone.

Sources: [Sabre Content Services Rail](https://developer.sabre.com/rest-api/content-services-rail/v2/index.html), [Amadeus Enterprise Rail](https://admin.developers.amadeus.com/enterprise/category/rail), [Travelport TripServices](https://developer.travelport.com/).

### Finding F-007 — Communications failover requires a delivery-aware fallback matrix

Multi-provider communications is an owner-confirmed architecture direction, but a second API key is not enough. Sender IDs, consent, country coverage, throughput, content rules, delivery receipts, duplicate handling and operator/customer expectations differ by channel and country. A provider timeout may occur after a provider accepted a message.

**Required action:** obtain current terms and quotes from Beem, Africa's Talking and relevant alternatives; prove a primary/fallback pair for each launch country and channel. Record normalized statuses and deduplication behavior, and never treat “API accepted” as “recipient received.” Fail over only when policy allows a second delivery and ambiguous submissions have been reconciled or safely deduplicated.

### Finding F-008 — Launch mode and live route scope are not yet defined by evidence

The product specification covers six travel modes, but the commercial MVP must be restricted to modes/operators/routes with complete authorized supply and fulfilment paths. A destination/search UI or supplier capability statement is not proof of live inventory.

**Required action:** choose the first pilot scope only after legal and partnerships teams have an evidence-backed table for exact supplier, country/route, source of truth, booking and ticketing path, payment role, refunds, customer support and settlement. Modes without this evidence remain disabled or informational/referral-only where contractually and legally permitted.

## 4. Master launch gates

All gates below are production blockers unless explicitly marked otherwise. “Owner” means the role responsible for gathering the evidence; it does not imply the person/team has already been appointed.

| Gate | Required evidence | Accountable owner(s) | Pass condition | Status |
|---|---|---|---|---|
| G0 — Entity and activity | Current BRELA extract, TIN/tax records, business licence, registered business objects/premises and advice on applicable activity/sector licences | Executive, Finance, Legal | OuterBlocks particulars verified and required business/sector permissions documented | **Open — P0** |
| G1 — LATRA bus role | Correct Gazette reference; current approval process, forms, fees and written role classification; approved provider/certificate status | Legal/Regulatory, Partnerships | Approved-system owner path or signed lawful distribution/agent path documented; required tests and obligations known | **Open — P0** |
| G2 — Ferry route role | TASAC applicability, Mainland and Zanzibar route/operator requirements, operator/vessel documents and distribution rights | Legal/Regulatory, Partnerships | Each live route and Travelar's sales role explicitly covered | **Open — P0** |
| G3 — Tax and ticket fiscalization | TRA/EFDMS or operator/approved provider responsibility map; receipt, tax, invoice and refund treatment confirmed | Finance, Tax adviser, Partnerships | No ambiguity over who issues fiscal evidence, reports taxes or reconciles void/refund cases | **Open — P0** |
| G4 — Payment role and funds | Signed funds-flow model; PSP written approval, merchant terms, fees, settlement/payout/refund rights and legal role opinion | Finance/Treasury, Legal, PSP | Live customer collection and supplier payout path lawful, contractually authorized and reconciled | **Open — P0** |
| G5 — Personal data | Controller/processor roles; PDPC registration; privacy notices/consents; retention map; DPIA where required; transfer permit/safeguards where applicable | DPO/Privacy, Legal, Security | Every production data flow has a documented legal basis, destination, recipient and control set | **Open — P0** |
| G6 — Supplier rights by mode/route | Executed supplier/operator agreements, credentials, eligible countries/content, booking/ticket/after-sales rights, data and settlement terms | Partnerships, Legal, Engineering | Only evidenced supplier/mode combinations enabled for live traffic | **Open — P0** |
| G7 — Hosting decision | Vendor contract/region, subprocessor list, access/location map, encryption, backup, restore, incident terms, data export/deletion and recovery tests | CTO/Engineering, DPO/Legal | Hosting architecture approved for mapped data and recovery needs | **Open — P0** |
| G8 — Inventory and booking integrity | Database constraints/transactions; segment/capacity concurrency tests; hold expiry/recovery; duplicate request and provider timeout handling | Engineering, QA | Required invariants pass repeatable race, retry, failure and recovery tests | **Open — P0** |
| G9 — Payment and accounting | PSP verification tests, webhook authentication/replay tests, ledger balancing, refund/reversal tests, daily reconciliation and suspense resolution | Engineering, Finance, QA | Every test transaction matches booking, provider state, ledger and settlement evidence | **Open — P0** |
| G10 — Customer communication | Contracted primary/fallback by channel, sender-ID/short-code approval, consent, delivery-state handling, duplicate prevention and provider outage drills | Operations, Legal, Engineering | Message delivery/failure states work without unsafe duplicate or privacy leakage | **Open — P1, P0 for production notifications** |
| G11 — Security and access | Threat model, least-privilege roles, MFA for privileged roles, tenant tests, vulnerability tests, secret handling, incident playbooks | Security, Engineering, QA | No open critical/high findings without approved formal risk treatment; operational controls exercised | **Open — P0** |
| G12 — Operations and support | Supplier escalation contacts, call-center runbooks, refund/incident approvals, reconciliation owner, outage communications and training | Operations, Finance, Partnerships | Staff can operate and recover each enabled journey with audit evidence | **Open — P0** |
| G13 — Pilot and go/no-go | Pilot scope, monitored metrics, daily settlement review, restore/rollback proof, support rota, signed risk acceptance and executive go/no-go | Executive + named gate owners | Signed pilot authorization and all applicable P0 gates passed | **Open — P0** |

## 5. Priority external contact plan

### 5.1 LATRA

Request in writing:
1. The authenticated Gazette instrument, correct GN number, any corrigendum/amendments and current fee schedule for online-ticketing systems.
2. Current dated lists separating approved system owners, certificate validity, systems connected to CeTS/Safari Tiketi, and providers permitted to appoint agents or supply third-party marketplaces.
3. Classification of the proposed Travelar model: consumer marketplace; approved ticketing-system owner if applicable; appointed distributor/agent; OIMS vendor; Travelar agent/call center; operator-originated sales; USSD and white-label integrations.
4. Current EFDMS/CeTS interface/specification, sandbox/testing, security assessment, operational reporting, outage and recovery requirements.
5. Ticket/manifest field rules, fee deductions/remittance, void/refund cases, and the required response where payment is verified but regulatory/issuance submission fails.

### 5.2 TASAC and relevant Zanzibar authorities

Obtain route-by-route requirements for Travelar's commercial role, operator/vessel checks, ticket and manifest obligations, distribution contracts, incident/disruption handling, data sharing and passenger refunds. Confirm what is Mainland-only and what needs separate Zanzibar review.

### 5.3 PDPC Tanzania and legal counsel

Confirm controller/processor registration and fees/documents; applicable DPO requirements; records of processing and DPIA triggers; exact cross-border permit/safeguard treatment for each named cloud, GDS, PSP, communications, analytics, support and backup recipient; retention/deletion rules; and breach notification duties.

### 5.4 Bank of Tanzania, selected PSPs and counsel

Ask the PSP compliance team to confirm the precise merchant of record, payment collection, refunds, chargebacks, split/marketplace settlement and payout model they will contract with OuterBlocks. Ask counsel whether any proposed activity beyond ordinary merchant acceptance requires authorization. Obtain an all-in fee sheet by payment rail, country and currency, including settlement time, reserves/holds, refunds and disputes.

### 5.5 GDS and travel suppliers

Send the same RFI to Travelport, Sabre and Amadeus, then separate RFIs to TRC/SGR, Kenya Railways, ferry operators, accommodation providers and activity suppliers. Require current documents and written confirmation of production eligibility, countries/routes, inventory/content, booking lifecycle, ticket/voucher issue, post-booking rights, payment/settlement, service hours, outages and support escalation. Record sandbox and production rights separately.

### 5.6 Communications providers

Request country-specific coverage and current tariffs from Beem, Africa's Talking and other shortlisted providers for SMS/email/voice/USSD as applicable; sender-ID and short-code eligibility; message throughput; delivery-receipt and callback semantics; API rate limits; provider status channels; failover support; and terms governing duplicate delivery, consent and customer opt-out.

## 6. Recommended immediate work order

1. **Freeze production-scope claims.** In internal/product-facing material, label every mode as `research`, `sandbox`, `contracted`, `certified`, `production-enabled` or `disabled`; require documentary evidence to advance state.
2. **Close legal-identity and LATRA ambiguities.** Get OuterBlocks corporate records and written regulator interpretation. Resolve the GN-number discrepancy before relying on that citation in formal filings.
3. **Choose the launch journey by evidence.** Select exact operators/routes/modes with lawful, signed and supportable inventory; do not promise all six modes as transactional in launch one unless each passes gates.
4. **Complete the funds-flow and data-flow maps.** These inform the merchant model, accounting, PDPC and hosting decisions. Do not make provider/vendor selections before the flows are known.
5. **Request written offers from providers in parallel.** GDSs, PSPs, communication vendors, hosting and local operators should be compared using a standard capability, cost, legal and operational template.
6. **Run non-production proof tests.** Use synthetic data or approved sandboxes for segment inventory, ferry capacity, payment verification, idempotency, provider timeout recovery, comms deduplication, tenant isolation, ledger balancing and backup restoration.
7. **Approve ADRs with named owners and dates.** In particular, hosting/region, initial live supplier path, payment role, communications fallback pairs, and MVP mode list must be accepted or kept open explicitly.
8. **Hold a formal go/no-go review.** No live customer money, personal data or ticket issuance until all applicable P0 gates are evidenced, signed and approved.

## 7. Evidence status vocabulary to use throughout the project

- **Verified — primary source:** supported directly by an official law/regulator/provider document, within its stated scope/date.
- **Corroborated:** supported by multiple credible sources but may still be incomplete.
- **Provider-claimed:** public supplier documentation or marketing; independent performance and actual account rights are unverified.
- **Contracted:** signed agreement exists and is accessible to the project record.
- **Production-enabled:** provider/regulator has confirmed live entitlement and required certification/tests are complete.
- **Hypothesis:** not yet proven through operator/customer discovery or tests.
- **Unknown / direct confirmation required:** no reliable evidence yet.
- **Expired / revalidation required:** prior source, permit, quote, credential or status may no longer be current.

Never promote a capability to contracted or production-enabled based only on a public documentation URL, sandbox response, UI mock-up, verbal assurance, or a prior AI-generated statement.

## 8. Final audit conclusion

The bundle is now a strong **research and planning baseline**. It should be used to control discovery, external due diligence and later engineering governance. It is not a market- or regulator-validated business launch plan yet: crucial facts concerning legal role, provider permissions, current terms, launch scope, live supplier supply and data/funds flows remain unresolved.

The next decision should be a founder-led **launch-scope and evidence-review meeting** with named owners for each G0–G13 gate. Implementation can begin in non-production only after its synthetic-data/sandbox boundaries are recorded; production remains blocked until the relevant evidence is signed off.


## Stage 9 technology decision update (24 October 2026)

This audit is extended by `33-authentication-provider-and-identity-architecture.md` and `34-technology-stack-evaluation-and-recommendation.md`. Product direction now specifies a custom Travelar backend with direct PostgreSQL 18.x rather than Supabase as the platform. Current recommended baseline: React + TanStack Start, NestJS + TypeScript/Fastify, PostgreSQL 18.x, Node.js 24 LTS candidate, Drizzle + node-postgres candidate. Authentication must not be implemented from scratch for the first production release; prefer self-hosted Keycloak in a verified Tanzania environment subject to legal, hosting, operations and proof-of-concept gates, with Auth0 as a contingency if its exact processing is legally acceptable and operationally preferable. This does not close external regulatory, supplier or production readiness gates.

## Stage 15 — Engineering agent governance gate (24 October 2026)

Before AI tools are used on the actual repository, add the shared agent charter and skills, establish branch protection and CI gates, verify tool privacy/data-processing terms, configure no-production-secrets policy, and document review/approval responsibilities. Cursor and Antigravity are capable of planning and editing multi-file work and can assist with verification, but their features do not establish correctness by themselves. The specific limitations and recommended configuration are in Document `41`.

A controlled non-production POC may proceed under an explicit scope. Live integrations, production secrets, production deployment, real refunds/payments, or real passenger data must remain prohibited for agent tasks unless a separate human-controlled approval and environment process explicitly authorizes the action.

## Stage 16 — additional security release gate

Use Document `42-cybersecurity-self-defence-detection-and-response-architecture.md` and `ADR-SEC-001-layered-cyber-defence-and-security-observability.md` for the cybersecurity pre-launch decision. Security NO-GO conditions include absent or unmonitored critical logs, untested alert receipt/containment/restore, exposed privileged management surfaces, missing required privileged MFA, failed/absent tenant isolation/payment/inventory tests, leaked production secrets, unremediated material exploitable issues without valid risk acceptance, unverified payment-to-ticket state, or unresolved applicable privacy/data-transfer duties. Evidence must include a scoped independent assessment, remediation and retest; a scanner report or AI-generated security summary is insufficient.

## Stage 20 new go/no-go items (24 October 2026)

Add to applicable market/mode/channel launch review:

- **Legal entity:** BRELA-backed identity and authorized signatory confirmed; group/subsidiary relationship, contract entity, PSP/merchant, payout beneficiary, fiscal issuer and privacy roles are explicit. The intended name `OuterBlocks Destinations Limited` is owner-confirmed for product design, but registration/authority cannot be inferred from the name alone; `Travelar Destinations Limited` is superseded.
- **Electronic payment methods:** counsel confirms treatment of Government Notice No. 158C of 2026 for covered service, merchant, channel and transition. Checkout and OTC/call-centre tender policy matches effective rules.
- **LATRA/TRA:** system owner/provider path, approval, current interfaces, credentials, testing, continuity and fiscal receipt flow are documented and accepted; no production assumption from public pages alone.
- **Channel attribution/commission:** signed channel terms and effective-dated calculation are testable end-to-end; white-label/API and agent incentives have explicit contractual treatment; source corrections are append-only and ledger-safe.
- **Agent float:** any top-up/float/wallet feature has documented legal/payment-service classification, PSP contract, reconciliation and transaction limits.
- **Inventory/security:** concurrency remains safe with Redis unavailable; provider-specific webhook auth and replay/idempotency tested; RLS/tenant boundaries tested with actual production-like DB role.
- **Fiscal artifacts:** payment, booking/ticket and fiscal receipt states are distinct; approved receipt issuer/provider semantics are tested for cancellations/refunds.

Official reference: GN 158C https://www.tra.go.tz/images/uploads/acts/GN158C-THE_ELECTRONIC_TRANSACTIONS_%28MANDATORY_ELECTRONIC_PAYMENTS_FOR_SPECIFIED_TRANSACTIONS%29_ORDER%2C_2026-TGPA.pdf . This is a requirement to obtain correct legal implementation, not a legal opinion on every specific arrangement.
