# 07A — GDS Provider Comparison and Integration Strategy

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Evidence review date:** 23 October 2026  
**Status:** Research addendum; no provider selected; no production access assumed.

## 1. Purpose and correction to the research approach

Travelar should evaluate Travelport, Sabre and Amadeus as **cross-mode distribution platforms**, not just as three competing flight APIs. The focused assessment must compare their flight, rail, accommodation, vehicle and related travel-content products; then verify supplier-level coverage and transactional rights for the markets Travelar intends to serve.

The central distinction is that **all three providers document API or web-service products for air, accommodation and rail, but the products, interfaces, supported rail suppliers, access models and production permissions are not equivalent**. A global statement such as “the GDS has a rail API” does not establish that it provides Tanzania SGR or Kenya Madaraka Express inventory, ticketing rights, or after-sales support.

This addendum supersedes any interpretation of the prior matrix that treated GDS selection as predominantly a flight-provider comparison. It does not establish that OuterBlocks Limited has contracts, production credentials, an agency/PCC relationship, accreditation, ticketing authority or live supplier content with any provider.

## 2. Executive assessment

| Provider | Air | Stays / hotels | Rail | Cars / vehicles | Current API/product distinction | Access issue to resolve |
|---|---|---|---|---|---|---|
| **Travelport** | Documented end-to-end API workflows for search, price, booking, ticketing, cancellation and changes. | Current TripServices Stays APIs document search, availability, reservation, retrieval, modification and cancellation. | Rail shopping and booking are documented in Universal API / SOAP-XML and Travelport's rail content materials. The current TripServices top-level API list reviewed presents Flights, Stays and Pay, not a corresponding modern TripServices Rail API. | Vehicle content is documented through Universal API. | A split product landscape: modern REST/JSON TripServices for Flights, Stays and Pay; legacy/established SOAP/XML Universal API also documents rail and vehicles. Do not assume feature parity across them. | Which legal/agency arrangement, credentials, countries, rail content hubs and booking/servicing workflows can be enabled for OuterBlocks in production; whether the rail route uses Universal API and current support commitments. |
| **Sabre** | Documented air shopping, booking and post-booking product families. | Content Services for Lodging and hotel APIs, including hotel list, descriptive information, lead rate, price-check and availability products. | Dedicated **Content Services Rail API v2** documents search, prebook/order workflows and after-sales/ticket delivery. Sabre explicitly says special permission and supplier agreements are required. | Dedicated car APIs. | Multiple product families, API generations and access tiers. Agency credentials determine API/environment access. | Enabled API list for the specific agency relationship; rail vendor agreements and carrier availability; production entitlements; ticketing and after-sales responsibility; commercial onboarding. |
| **Amadeus** | Self-Service APIs for developer-led shopping/booking in eligible circumstances, and Enterprise APIs for broader, tailored distribution. | Self-Service hotel APIs and Enterprise hotel web services/Hotels Quick-Connect products are documented. | Enterprise Rail web services document Multi Destination Schedule Quote, Sell Segment and Issue Contract. Amadeus also markets rail GDS products, including Rail Display. | Cars and transfers are documented product areas. | Distinction between Self-Service developer APIs and Enterprise APIs with requested access, tailored contracts and support. Do not assume every content type is available through the same Self-Service API stack. | Whether OuterBlocks qualifies for each product/market; Tanzania point-of-sale and currency support; live supplier coverage; which API supports booking and issue for specific rail operators; enterprise pricing and support. |

**Evidence basis:** Travelport's current TripServices portal presents Flights, Stays and Pay as the primary API families; Universal API documentation separately lists air, hotel, vehicle and rail. Sabre publishes Content Services Rail and states that access requires special permission and supplier agreements. Amadeus documents an Enterprise Rail API category and hotel APIs that require access requests. See source register below.

## 3. What each provider's API claim actually means

### 3.1 Travelport

**Verified from official documentation:**

- The current TripServices developer portal describes air search, pricing, booking, ticketing, cancellation and modification, with a provider-published claim of air content from 400+ airlines, NDC and low-cost carriers.
- TripServices Stays covers hotel/accommodation search, availability, property information, reservation, modification and cancellation. Travelport's portal states access to hotel properties in 180 countries; that is a supplier claim and does not establish property count, rate competitiveness or Tanzania-specific coverage for Travelar.
- Travelport Universal API, also described in its documentation as SOAP/XML API, covers air, hotel, car and rail content, including documented rail shopping and booking workflows. Its documentation says the Universal API schema-retirement process was placed on hold in January 2025; confirm lifecycle/support policy during procurement.

**Decision implication:** treat Travelport as potentially multi-mode, but evaluate two integration options separately: (a) modern TripServices for flights and stays; (b) Universal API for rail/vehicle content if needed and contractually available. Ask Travelport whether a unified current product roadmap exists for those modes, and what separate certification, support, contract and maintenance costs would apply.

### 3.2 Sabre

**Verified from official documentation:**

- Sabre Developer Hub presents air shopping, booking and post-booking products, as well as lodging and car API families.
- Sabre's Content Services Rail v2 API describes an end-to-end rail workflow covering searching connections, prebooking/orders, ticket delivery and after-sales operations.
- Sabre expressly states that consuming the rail web service/content requires special permission and that agreements with rail vendors must be in place before requesting access.
- Sabre's token documentation explains that credentials determine accessible environments and API subsets; PCC/iPCC and EPR are agency/employee access identifiers, not general-purpose credentials that guarantee any API entitlement.

**Decision implication:** Sabre rail is a real API product, but Travelar must request the actual enabled rail suppliers and selling rights in writing. The existence of the API specification is not sufficient evidence that a Tanzanian travel seller can sell a given rail operator through it.

### 3.3 Amadeus

**Verified from official documentation:**

- Amadeus provides flight APIs in Self-Service and Enterprise categories. Its Self-Service FAQ explains market/content limitations and says that a consolidator is needed to issue flight tickets through the Self-Service model; Enterprise ticketing and accreditation requirements differ.
- Amadeus documents both Self-Service hotel APIs and Enterprise hotel APIs. The Enterprise Hotel pages describe availability and booking services and require requesting access.
- Amadeus Enterprise Rail documentation lists Multi Destination Schedule Quote for itinerary/fare availability, Sell Segment for reservation creation and Issue Contract to ticket trips/accommodation/supplements priced in a PNR.
- Amadeus also offers rail distribution products such as Rail Display. A selling interface/product, however, is not automatically equivalent to an API entitlement for Travelar's consumer platform.

**Decision implication:** distinguish Amadeus Self-Service from Enterprise in the RFI and commercial model. The rail implementation appears to be an Enterprise access question; its API documentation does not prove Tanzania SGR or Kenya Madaraka Express inventory. Obtain the exact rail vendor/content list, geographic scope and transaction permissions.

## 4. Mode coverage — global capability versus Travelar-relevant supply

| Travelar mode | Role of Travelport / Sabre / Amadeus | Required evidence before treating as launch supply | Preliminary approach |
|---|---|---|---|
| **Flights** | Core GDS use case across all three. Content may include legacy GDS, NDC, low-cost carriers and supplier-specific flows depending on provider/product/account. | Covered airlines at the Tanzania/Kenya point of sale; market and currency; shopping vs confirmed pricing; reservation; ticket issue authority; ticketing deadline; void/refund/exchange/schedule-change support; fees and settlement; SLA and support hours. | Shortlist all three; choose primary based on eligible production content and complete servicing model, not API demo alone. Consider a consolidator if own ticketing authority is not feasible. |
| **Stays** | All three document hotel/accommodation products. Content source, rate type, payment model, cancellation rules and integration interface differ. | Properties/countries available; gross/net rate options; taxes and mandatory fees; property-collect vs prepaid; revalidation; cancellation/modify API support; virtual card/credit terms if relevant; refund and no-show liabilities; supplier confirmation reliability. | Compare each GDS with direct hotel/bedbank alternatives on Tanzania, Kenya, regional African and outbound destinations. Do not assume the flight GDS produces the best accommodation coverage or margin. |
| **Train** | All three have documented rail offerings/API capabilities, but access models and supported rail vendors differ. Travelport rail appears in Universal API materials; Sabre has Content Services Rail; Amadeus lists Enterprise Rail APIs. | Named rail suppliers/countries; station and route coverage; live availability; fare conditions; reservation; ticket/document issue; QR/barcode format; cancellations/refunds/exchanges; ticketing authority; production certification; commercial minimums. | Request a supplier-by-supplier rail matrix. Treat TRC SGR and Kenya Railways/Madaraka Express as unconfirmed until explicitly named and contractually supported. Maintain direct operator integrations or authorized redirects as separate options. |
| **Ferry** | No reviewed source establishes current Travelport, Sabre or Amadeus transaction-ready inventory for Tanzania ferry routes. Cruise/“sea” product terminology must not be assumed to mean passenger ferry inventory. | A named ferry operator and route; capacity and fare content; booking/issuance rights; payment/settlement; manifests; disruption/refunds; route authorizations. | Plan direct operator or authorized regional-ferry supplier adapters unless a GDS gives specific written evidence of relevant inventory and rights. |
| **Bus** | No reviewed source establishes these GDSs as an approved source of Tanzania long-distance bus inventory through LATRA's ecosystem. | Actual operator inventory; lawful access path; LATRA ticketing/approved-provider model; ticket numbering, manifest, fiscal and refund flows. | Treat local bus and LATRA integration as a separate supply domain, not an assumed capability of a global GDS. |
| **Experiences** | Amadeus documents destination-experience APIs; the reviewed public materials do not establish a common, equivalent full transactional activities API across all three providers. | Activity suppliers and destination coverage; transactional booking vs search-only; real-time slots/capacity; voucher issuance; cancellation; commission/net rates; merchant-of-record and customer support terms. | Evaluate specialist experience networks and directly onboarded local providers separately. Use a GDS only where the specific product's transactional scope is confirmed. |
| **Cars / transfers** | Vehicle rental and/or transfers are documented across provider portfolios, but exact product availability, supplier coverage and purchase flow vary. | Supplier-by-supplier country coverage, rate rules, insurance, taxes, cancellation, payment and service obligations. | Keep as a separate capability group in the provider questionnaire; not a reason on its own to select a GDS. |

## 5. Selection method for Travelar

### 5.1 Mandatory gates (pass/fail)

A provider cannot be selected for a mode until the following are evidenced:

1. **Eligible entity and market:** OuterBlocks Limited can contract and transact in the target market under the proposed model.
2. **Commercial authorization:** signed contract/addendum or written confirmation that the intended consumer marketplace/OTA and agency model is permitted.
3. **Production entitlement:** exact API product, environment, suppliers and operations enabled for Travelar.
4. **Complete booking semantics:** supported response states and recovery behavior are documented for the required lifecycle, including ticket issue and after-sales where relevant.
5. **Regulatory and financial fit:** ticket issuance, customer-money collection, supplier remittance, refunds, data processing and customer support roles have been reviewed.
6. **Verifiable supplier coverage:** the provider supplies a named, dated inventory/content matrix for target markets and operators.

A failed or unconfirmed mandatory gate means “not yet approved for launch,” even if test calls succeed.

### 5.2 Weighted comparison after gates pass

Use this as a proposed scoring framework, not as a finding about any provider. Score each dimension 1–5 against written evidence, and record confidence separately.

| Dimension | Weight | Evidence to score |
|---|---:|---|
| Eligible production access and fit to OuterBlocks's business model | 20% | Entity eligibility, product permissions, onboarding and certification. |
| Actual regional supplier coverage | 20% | Named airlines, hotels and rail providers relevant to launch/outbound markets. |
| Full lifecycle booking, ticketing and after-sales | 15% | Issue, retrieval, void/cancel, exchange/refund and schedule-change scope; API vs manual fallback. |
| Hotel breadth and commercial usability | 10% | Relevant inventory, net/gross model, total rates, confirmation reliability and cancellation terms. |
| Rail inventory and ticketing coverage | 10% | Named suppliers, market coverage, ticket issue, servicing and production rights. |
| Total commercial cost | 10% | Setup, recurring, per-call/booking/ticket fees, minimums, support fees, commissions, guarantees and settlement costs. |
| Reliability, support and service management | 5% | Published SLA, support coverage, incident notifications, escalation, outage handling. |
| Integration quality and lifecycle stability | 5% | Documentation, REST/SOAP interface, SDKs, versioning, sandbox parity, idempotency and migration roadmap. |
| Contract flexibility, data rights and compliance fit | 5% | Data usage, retention, privacy, subprocessors, portability, termination and transition. |
| **Total** | **100%** | Mandatory gates remain pass/fail and cannot be offset by a weighted score. |

### 5.3 Commercial comparison must be normalized

Do not compare a low API fee with a higher all-in provider cost. Request a written price model covering:

- Contract setup, implementation, onboarding, certification and test environments.
- Recurring platform or agency fees and any minimum monthly/yearly volumes.
- Per-search, per-segment, per-booking, per-ticket, per-cancellation or servicing charges, where applicable.
- Ticketing/consolidator fees and commissions, overrides or permitted markups.
- Deposits, financial guarantees, credit limits, settlement cycle and currency.
- Refund, void, exchange, chargeback, no-show and airline debit-memo exposure.
- 24/7/holiday support, premium support and integration-assistance charges.
- API quotas, rate limiting, overage charges, sandbox-to-production differences and required certification.

No provider fee should be entered as a confirmed number until supported by a current quote or contract. Record currencies, tax treatment, effective dates and whether each charge is mandatory or usage-dependent.

## 6. Recommended architecture direction (provisional; not an implementation authorization)

### 6.1 Provider-agnostic travel distribution layer

Travelar should define a stable internal boundary between its consumer/operator business domain and supplier APIs. Avoid spreading Travelport/Sabre/Amadeus field names or assumptions throughout booking, payment, ticket and accounting logic.

Proposed logical components:

- **Travel sourcing/orchestration:** chooses eligible suppliers by mode, market, route, customer context and configured business rules; handles timeouts and partial provider outages.
- **Provider adapters:** one adapter per provider product/interface, not just per brand. For example, Travelport TripServices Flights, TripServices Stays and Travelport Universal API Rail may have distinct capabilities and operational treatment.
- **Capability registry:** declares whether an adapter supports search, reprice, book, hold, ticket/issue, retrieve, void, cancel, exchange, refund quote, refund execution, schedule-change handling and asynchronous status retrieval. Unsupported actions must be explicit.
- **Canonical booking model:** retains Travelar booking identifiers separately from provider PNR/order locators, ticket/document numbers and supplier confirmation references.
- **Provider transaction journal:** stores request correlation IDs, provider response references, normalized status, amount/currency, timestamps and redacted diagnostic evidence.
- **Reconciliation and exception work queue:** resolves timeout/unknown outcomes, booked-but-not-ticketed cases, supplier confirmation mismatches, refund differences and manual after-sales.
- **Commercial rules and contract versions:** binds pricing, commission/markup, point-of-sale, currency and permitted channels to contract versions and effective dates.

### 6.2 Never normalize away meaningful differences

Adapters may normalize error categories and lifecycle concepts, but they must preserve provider-specific details when needed for recovery and audit. A GDS reservation, a ticket issued by a consolidator, a hotel prepaid booking and a property-collect reservation are not interchangeable states.

For example, a generic booking status such as `CONFIRMED` is too coarse to represent all of the following:

- Air reservation created but ticket not issued.
- Air ticket issued with multiple documents/coupons.
- Hotel reservation acknowledged by aggregator but supplier confirmation pending.
- Hotel property-collect reservation where Travelar does not collect the room amount.
- Rail segment reserved but ticket contract/issue step not completed.

Keep separate state models for booking, supplier confirmation, ticket/document issuance, customer payment, supplier settlement and refund. Define permissible transitions per adapter capability.

### 6.3 Multi-provider adapters: the confirmed architectural direction

**User-confirmed direction:** Travelar should be able to use Travelport, Sabre and Amadeus as separate provider/product adapters; it must not be designed around a mandatory single global GDS. Several provider adapters may be active for the same travel mode or market when their rights, coverage, commercial terms and operating capabilities support it. This is an explicit product/architecture requirement, not a claim that OuterBlocks Limited already has access to all products.

The architecture must separate two decisions:

1. **Architectural support:** Travelar's domain and integration contracts must permit all three provider families, provider-specific product variants, and future providers to coexist. This is the chosen direction.
2. **Production activation and rollout:** each adapter is enabled only after the relevant legal/business eligibility, contract, credentials, certification, live supplier coverage, ticketing/booking rights, financial flow and support path have been verified. Rollout can be incremental without constraining the target architecture to one provider.

The provider registry and routing policy should select one or more eligible adapters based on travel mode, origin/destination and point of sale, country, currency, channel, supplier/operator coverage, contractual permissions, offer/capability support, latency/error health, rate limits, customer price and commercial economics. When suitable, Travelar may query multiple adapters in parallel and compare eligible offers. The UI and internal booking record must retain the supplier/provider source and the exact offer and rule references.

Provider-neutral does not mean provider-blind. Each returned offer must retain the provider, supplier/content source, provider offer/booking token, fare/rate conditions, payment model, change/refund semantics and expiry. Where the provider returns meaningful proprietary details, preserve them for audit and servicing. The selected booking item must remain bound to the provider that accepted it.

Integration complexity remains real and must be budgeted rather than used as a reason to exclude providers by design:

- More adapters increase contracting, credentials, certification, regression-test, monitoring, and after-sales support costs.
- Concurrent shopping requires deduplication and fair ranking for equivalent itineraries/properties without conflating distinct fares or rate conditions.
- Booking and ticketing must not be blindly retried against a different provider after an ambiguous timeout; first resolve the original request through idempotency, retrieval, or reconciliation.
- A booking made through one provider must be serviced through that provider or its contractually authorized servicing path; do not move it silently to another provider.
- Combining items from multiple providers in one cart/checkout requires separately designed payment, partial-failure, cancellation, refund and customer-support rules. Do not assume a cross-provider basket is atomic.

**Operational recommendation:** qualify all three in parallel and implement adapter contracts so that all can coexist. Activate products and markets in dependency order based on actual access and business value. This is incremental delivery of a multi-adapter architecture—not a decision to pick one primary GDS for Travelar as a whole. A mode/country may still use one adapter initially if it is the only eligible source, while other modes or markets use different adapters concurrently.

## 7. Identical RFI for Travelport, Sabre and Amadeus

OuterBlocks should send a consistent request for information to the three providers and compare their written responses. Answers should be scoped to Travelar's actual business model: a consumer-facing multimodal marketplace operated by OuterBlocks Limited, starting in Tanzania and planning Kenya next.

### A. Eligibility and account model

1. Can OuterBlocks Limited, a Tanzania-registered operator of a consumer OTA/marketplace, contract for the required API products directly? If not, what approved reseller, host agency, consolidator or distribution model applies?
2. What company records, travel registrations/licences, TIN/tax records, agency identifiers, financial documents, guarantees and local presence are required?
3. Which products and API capabilities would be enabled, in which environments, for which point-of-sale countries and currencies?
4. What are the certification steps, lead times, launch approvals and ongoing partner obligations? Provide current checklists.

### B. Air

5. Provide current airline/content coverage for point of sale Tanzania and Kenya, distinguishing GDS, NDC and low-cost content.
6. Which APIs implement search, fare revalidation, booking/PNR creation, ticket issuance, retrieval, void, cancellation, exchange/reissue, refund and schedule changes?
7. Under which arrangement may tickets be issued: OuterBlocks's own authority, an authorized consolidator, host agency or provider arrangement? Who is responsible for ticketing deadlines, debit memos, exchanges and customer after-sales?
8. Which fare types, passenger types, ancillaries, baggage data, currencies, languages and point-of-sale constraints are supported?
9. Which steps may be automated by API and which require queue, portal, telephone or manual partner handling?

### C. Rail

10. Provide the currently supported rail-vendor list by country/market, including exact content suppliers and transaction capabilities.
11. Specifically confirm whether Tanzania SGR/TRC and Kenya Railways/Madaraka Express content is available through the proposed product, and whether search, live availability, fare quote, reservation, ticket issue and refunds/exchanges are supported.
12. Name the rail API/interface, version, environment, supplier contracts and certification required. For Travelport, distinguish Universal API from TripServices; for Sabre, specify Content Services Rail permissions; for Amadeus, specify Enterprise Rail entitlements.
13. Can rail booking and after-sales be performed through the API end-to-end, or are supplier portals/manual steps required? What ticket format and barcode/QR validation process does the supplier use?

### D. Stays, cars and other content

14. Provide property/content coverage by country, relevant African destinations, rate types, currency and source; distinguish static hotel data from live availability/pricing.
15. Explain price revalidation, taxes/fees, prepaid vs property-collect, virtual card or other supplier payment requirements, modifications, cancellation and refund responsibilities.
16. Provide car/transfer API coverage and clarify insurance, taxes, age/license requirements, supplier payment and customer support responsibilities.
17. Identify activities/experiences products, if any; specify whether access covers discovery only, availability, transactional booking, voucher issuance, cancellation and supplier settlement.

### E. Technical and operational terms

18. Provide current API references, schemas/OpenAPI or WSDL, release/version policy, deprecation notice period, sample payloads, error model, idempotency guidance and rate limits.
19. Describe sandbox fidelity, test supplier coverage, production validation, concurrency limits, booking holds, polling/webhooks, retry safety and unknown-outcome recovery.
20. Provide availability/support SLAs, 24/7 incident channels, maintenance notification, escalation tiers, support languages/time zones and incident reporting.
21. Provide pricing and all minimums, setup/certification/support fees, usage charges, ticket/booking/servicing fees, settlement terms, required credit/deposits/guarantees and all refund/exchange costs.
22. Document personal-data processing roles, data hosting/subprocessors, cross-border transfers, retention/deletion, security testing and breach notification.
23. Explain termination, content/data portability, post-termination reservations and after-sales obligations, and migration assistance.

Request official product documentation and a dated written reply. Verbal sales assurances should be logged as preliminary until included in a contract or other authoritative written confirmation.

## 8. Proof-of-capability tests before selection

Do not begin production integration based solely on a slide deck. Require a provider-guided demonstration and, where access is granted, execute controlled tests using the supplier's authorized sandbox or test environment.

### Air test set

- Search a representative set of Dar es Salaam departures and relevant regional/international itineraries; document the airlines/content source returned, market/currency and coverage gaps.
- Revalidate a chosen offer; demonstrate stale/changed fare behavior.
- Create a reservation and separately prove ticket issue, including document number retrieval and ticket deadline.
- Simulate provider timeout after request submission and establish a safe lookup/reconciliation path before retry.
- Demonstrate cancellation/void/refund eligibility and who executes the actual customer refund.
- Demonstrate ticket exchange/reissue and schedule-change handling or document the supported manual process.

### Hotel test set

- Search a representative sample of Tanzania and Kenya destinations plus strategic outbound markets.
- Confirm dynamic inventory and total price including required fees and taxes.
- Revalidate a rate, force a price/terms change and demonstrate customer re-acceptance.
- Book a cancellable and non-refundable test property; retrieve confirmation and cancellation deadline.
- Demonstrate prepaid versus property-collect money flow and cancellation/refund settlement responsibilities.

### Rail test set

- Require the supplier to name exact target-market operators before testing.
- Search station pair/date/class; verify live availability and full fare conditions.
- Create a booking and issue/retrieve the ticket document.
- Test duplicate requests, timeout/unknown outcomes, cancellation or exchange, and ticket validation format.
- If Tanzania SGR or Madaraka Express are absent, record the gap; do not infer coverage from other countries' rail APIs.

### Evidence required from each test

Store date, environment, API version, supplier, request/response correlation IDs, redacted payloads, screenshots where useful, expected and observed states, failure/retry behavior, time to response and the provider representative responsible. Never place live credentials, full passenger data or payment secrets in the research repository.

## 9. Draft architecture decision record — ADR-GDS-001

**Title:** GDS/provider strategy for Travelar air, stays and rail  
**Status:** Proposed for decision after RFI; not approved.  
**Context:** Travelar needs cross-mode supply with correct booking, document issuance, post-booking servicing and financial reconciliation. Travelport, Sabre and Amadeus all have relevant public product families, but access rights, content and interface maturity vary.  
**Decision under consideration:** Keep a provider-agnostic internal contract; qualify all three providers; choose one primary provider per required mode/market for the first commercially viable launch; allow a second source only when its coverage/economics or resilience benefit is demonstrated.  
**Alternatives:** (1) integrate all three at launch; (2) choose a single global provider for all modes; (3) use mode-specific suppliers and direct local integrations without a primary global GDS; (4) use affiliate/referral flows temporarily for modes lacking transactional rights.  
**Provisional rationale:** reduces duplicate integration and servicing burden while preserving future switching; recognizes that no GDS is proven to carry every relevant African rail, bus, ferry or activities supplier.  
**Assumptions:** OuterBlocks can obtain lawful production access to at least one selected supplier; exact coverage and commercial terms are not yet known.  
**Consequences:** requires capability-based adapters, explicit provider booking/ticket states, per-provider reconciliation and a supplier coverage matrix. Does not remove the need for local bus/ferry agreements or regulatory approval.  
**Acceptance condition:** approved only after signed/authoritative provider responses, commercial comparison, a legal/funds-flow review and proof-of-capability testing.  
**Next review:** after all three RFIs have authoritative answers.

## 10. Open questions and launch blockers

- Which provider is willing to contract with OuterBlocks Limited for the intended Tanzania OTA model?
- Which products can be enabled in Tanzania point of sale and which provider accounts/agency identifiers are required?
- Can each provider deliver the exact target flights and hotels Travelar cares about, not only a broad worldwide headline count?
- Which rail operators can each provider actually search, book and issue tickets for in the target markets?
- Does any GDS have direct, authorized ferry or Tanzania long-distance bus inventory useful to Travelar? No such coverage is established in this review.
- Which transactions must be handled by a consolidator, supplier portal or manual service desk after ticket issue?
- What are the all-in fees, volume thresholds, support obligations, guarantees, settlement timing and customer-money responsibilities?
- Which provider-specific personal-data transfers and subprocessors need to be disclosed/contracted for Tanzania and Kenya?
- What content terms restrict price display, markup, merchandising, caching, retention, onward distribution or customer data use?

Do not mark the GDS choice final until the hard gates in Section 5.1 have passed for the intended first-release modes.

## 11. Official primary sources

All sources below were checked on 23 October 2026 unless a page itself states another publication/update date.

### Travelport

- TripServices product portal (Flights, Stays, Pay): https://developer.travelport.com/ — supports the current API-family distinction and published product descriptions.
- Getting started: https://developer.travelport.com/docs/getting-started — current TripServices documentation entry point.
- Authentication and environments: https://developer.travelport.com/docs/getting-started/authentication — describes API base paths and authorization.
- Stays API endpoints: https://developer.travelport.com/docs/stays/general/stays-api-endpoints — documents search, availability, reservations, retrieve, modify and cancel endpoints.
- Universal API introduction: https://support.travelport.com/webhelp/uapi/Content/Introduction.htm — lists air, hotel, car and rail; identifies Universal API as SOAP/XML; discusses schema retirement.
- Universal API rail workflow: https://support.travelport.com/webhelp/uapi/Content/Rail/Rail_Shopping_and_Booking.htm — describes rail availability/low-fare search and booking flow.
- Universal API overview: https://support.travelport.com/webhelp/uapi/Content/Getting_Started/Easy_Overview/UAPI_Overview.htm — describes aggregated content across GDS, hotels, vehicles and rail.

### Sabre

- Sabre Developer Hub: https://developer.sabre.com/ — air, lodging and car product collections.
- Content Services Rail API v2: https://developer.sabre.com/rest-api/content-services-rail/v2/index.html — documents rail search/prebook and explicitly notes special permission and rail vendor agreements.
- Token/access prerequisites: https://developer.sabre.com/guide/get-token/get-token — explains account-manager/contract prerequisites, environments, API access subset and PCC/iPCC.
- Product catalog: https://developer.sabre.com/product-catalog — product/API collection discovery.

### Amadeus

- Amadeus Self-Service flight category: https://admin.developers.amadeus.com/self-service/category/flights — developer API category for flight data/workflows.
- Self-Service FAQ: https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/ — documents dataset limitations and consolidator requirement for ticket issuance in Self-Service.
- Enterprise Rail APIs: https://admin.developers.amadeus.com/enterprise/category/rail — lists Multi Destination Schedule Quote, Sell Segment and Issue Contract; access is requested.
- Enterprise Hotel APIs: https://developers.amadeus.com/enterprise/category/hotel — hotel availability/pricing/booking APIs; access requested.
- Amadeus hotel content: https://amadeus.com/en/travel-sellers/content/amadeus-hotels-content — describes GDS, Value Hotels, aggregator content and Hotels Quick-Connect.
- Amadeus Rail Display: https://amadeus.com/en/travel-sellers/products/amadeus-rail-display — commercial rail distribution product description.
- Amadeus Self-Service Hotel tutorial: https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/resources/hotels/ — describes Hotel List, Search and Booking API families.

## 12. Evidence classification

- **Verified through primary documentation:** public API/product families and the access caveats expressly described in the sources above.
- **Preliminary:** relative fit of each provider for Travelar, API-family maturity for each required mode, and proposed scoring weights.
- **Unknown / direct confirmation required:** OuterBlocks eligibility, negotiated prices, production entitlements, airline/property/rail content actually enabled, ticketing authority, exact Tanzania/Kenya rail coverage, support SLAs and settlement obligations.

This addendum is a research and procurement document, not a provider endorsement, a legal opinion or approval to begin production integration.
