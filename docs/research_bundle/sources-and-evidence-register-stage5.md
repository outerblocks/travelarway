# Stage 5 — Sources and Evidence Register

**Product:** Travelar · **Operating company:** OuterBlocks Limited  
**Access date:** 23 October 2026  
**Scope:** Product requirements, booking/search behavior, accommodation/rail/experiences adapter constraints, privacy and access-control principles.

The following sources support specific design constraints. They do not prove that OuterBlocks Destinations Limited has a provider contract, production API access, ticketing authority or regulatory approval; OuterBlocks Limited is the parent entity. Product-owner instructions and architectural proposals are identified separately in the specification documents.

| ID | Source and publisher | Primary URL | Evidence used | Strength and limitation |
|---|---|---|---|---|
| S5-01 | Booking.com Demand API — About the Demand API | https://developers.booking.com/demand/docs/getting-started/overview | Accommodation, car and attraction content; integration modes include content only, search/redirect, search/look/book, post-booking and reporting; capability depends on partner access. | Official documentation; no proof OuterBlocks is eligible or contracted. |
| S5-02 | Booking.com Demand API — Search, look and book | https://developers.booking.com/demand/docs/development-guide/application-flows/search-look-book | Search/availability, order preview and order creation for supported accommodation flows. | Official product flow; applies only to supported service and partner access/version. |
| S5-03 | Expedia Group Rapid Lodging overview | https://developers.expediagroup.com/rapid/lodging | Property geography/content, shopping, rates, fees, cancellation policies, price-check/revalidation and booking links. | Official docs; production eligibility and contract terms unknown for OuterBlocks. |
| S5-04 | Expedia Group Rapid Booking API | https://developers.expediagroup.com/rapid/lodging/booking/about-booking-api | Booking uses a rate confirmed through Price Check; successful responses provide itinerary retrieval/cancel links; tokenized booking links may expire. | Official current reference; exact workflow must be adapted to enabled Rapid product/contract. |
| S5-05 | GetYourGuide Partner Resource Center — API integration and requirements (updated 4 September 2026) | https://partner.getyourguide.support/hc/en-us/articles/13981133907613-API-integration-and-requirements | API access level varies from teaser content to options/availability and transactional booking; published Basic/Read thresholds and Masterbill manager/contract access. | Official partner policy; thresholds can change and are not an assurance of eligibility or acceptance. |
| S5-06 | Sabre Content Services Rail API v2 | https://developer.sabre.com/rest-api/content-services-rail/v2/index.html | Rail API covers search, prebook, confirmation, modifications and void workflows; special permission and supplier agreements are required. | Official product docs; supplier inventory/country coverage and Travelar access need direct confirmation. |
| S5-07 | Sabre Rail Reservation workflow | https://developer.sabre.com/guide/rail-reservation/rail-reservation.html | Shows separate search, terms/dictionaries, prebook, read, book/ticket, travel-document steps. | Official workflow; implementation is provider/vendor-specific. |
| S5-08 | Amadeus Self-Service API tutorials | https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/resources/ | Flight offers search, pricing, order creation and order management are distinct operations. | Official API tutorials; Self-Service scope is not all enterprise content/ticketing rights. |
| S5-09 | Tanzania PDPC — Registration | https://pdpc.go.tz/services/registration/ | Commission states that collection/processing requires controller or processor registration. | Official regulator publication; exact role and current application details need legal review. |
| S5-10 | Tanzania PDPC — Cross-border data transfer permit | https://pdpc.go.tz/services/cross-border-data-transfer-permit/ | Permit process and application data covering personal-data type, purpose, destination/recipient, duration/method and safeguards. | Official regulator publication; application to specific transfer and any exemptions/conditions needs counsel/PDPC confirmation. |
| S5-11 | OWASP Authorization Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html | Least privilege, deny-by-default, per-resource/action trust boundary, permission tests and periodic access review. | Recognized security guidance; not a legal standard or substitute for threat modelling. |
| S5-12 | OWASP Session Management Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html | Session IDs should be unpredictable and non-sensitive; server-side timeouts/invalidation and renewal after privilege changes. | Recognized security guidance; apply according to chosen identity architecture and threat model. |
| S5-13 | OWASP API Security Top 10 | https://devguide.owasp.org/en/07-training-education/07-api-top-ten/ | API risks include broken object/function-level authorization, resource exhaustion, sensitive business flows, improper inventory management and unsafe API consumption. | Recognized security guidance; specific control plan and testing still needed. |
| S5-14 | LATRA official site / online ticketing material | https://www.latra.go.tz/ | Existing regulatory source of truth for bus ticketing and current regulatory notices. | Official entry point; current applicable instruments, approvals and interface documents require direct verification. |
| S5-15 | Expedia Group Rapid API Explorer | https://developers.expediagroup.com/rapid/api/explorer | API schema/error references and technical exploration for Rapid product. | Public reference; no indication of Travelar production access or contractual rights. |

## Product-owner instructions recorded as source-of-truth

- Product name Travelar; operating company OuterBlocks Limited.
- Six public modes: bus, ferry, flights, train, stays, experiences.
- Multi-provider adapters are preferred for GDS, PSP and communication providers; provider failure/maintenance should be handled through controlled routing/failover.
- Guest bookings and secure retrieval, OIMS, HIMS, Travelar agents, operator agents, call center, and marshal workflows are required product areas.
- Bus inventory is segment-aware; ferry inventory uses sailing/class capacity rather than default passenger seat maps.
- The product owner's requested revenue distinction states operator-originated bookings should not incur Travelar marketplace commission unless a contractual exception applies.

## Evidence still needed before implementation

- Signed provider agreements, current product permissions, production credentials, tariffs, quotas, supported countries/markets, refunds/after-sales terms and service/support commitments.
- Legal classification of Travelar/OuterBlocks Destinations Limited (intended operating entity) by country/mode and signed approval pathway; regulator-specific manifests and ticket rules.
- Final privacy notice, controller/processor assignments, field purposes, retention schedule, cross-border transfer analysis and permits as required.
- Operator interviews, verified live inventory and trial bookings across all intended bus/ferry networks.
- Legal and finance approval of merchant/agent role, funds flow, fee/commission/tax treatment and ledger accounting.


## Stage 21 corporate entity correction

This source register records research performed at Stage 5 and its company wording is historical. For current Travelar design, the owner has confirmed OuterBlocks Limited as parent and OuterBlocks Destinations Limited as intended operating entity. Any older source entry naming OuterBlocks Limited as the operator is superseded for current design; formal corporate registration, contracting authority and regulatory eligibility remain unverified gates.
