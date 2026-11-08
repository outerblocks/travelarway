# 06 — Booking-Mode and Supplier Capability Matrix

> **Stage 14 product-scope clarification (24 October 2026):** Train and Experiences are first-class Travelar modes, not future modes. Their requirements belong in the current product, architecture, integration and test baseline. Per-country activation may remain gated until authorized suppliers, contracts, ticket/voucher flows and support/refund handling are verified. See `40-train-and-experiences-first-class-mode-research.md`.

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Research cut-off:** 24 October 2026  
**Scope:** Supplier access and documented production-booking capability across bus, ferry, flights, train, stays, and experiences.

## 1. Executive conclusion

Travelar should not treat the six booking modes as six equivalent integrations. The modes sit in materially different supply models:

- **Bus:** a regulated, operator-linked ticketing ecosystem in Tanzania. LATRA approval and Safari Tiketi/CeTS integration are material gates. No public, generally available third-party API for the national ticketing ecosystem was established in this review.
- **Ferry:** primarily operator-direct at launch. Azam Marine has a public booking path, but public evidence reviewed did not establish a reseller API, inventory feed, or third-party ticket-issuance authorization.
- **Flights:** commercial GDS APIs exist, but live shopping, reservation, ticket issuance, and after-sales servicing are separate capabilities. Access depends on provider onboarding, credentials, geography, contracted content, agency/settlement arrangements, and sometimes an accredited consolidator.
- **Train:** Tanzania Railways Corporation (TRC) and Kenya Railways each offer official consumer booking channels. Public booking pages do not establish permission for a third party to write reservations into their systems. Partner authorization is unresolved.
- **Stays:** Expedia Rapid, Travelport Stays, Hotelbeds and Booking.com’s Demand API are documented products, but partner eligibility and commercial approval are necessary. The similarly named Booking.com Connectivity APIs principally manage property data and should not be mistaken for a general hotel-inventory feed for an OTA.
- **Experiences:** Viator and GetYourGuide have differentiated affiliate/content and transactional partner programs; Airbnb’s public Experiences booking tool is being discontinued; public evidence reviewed does not establish a generally available transactional Experiences API for Travelar. Any private partnership requires direct confirmation.

**Recommended research posture:** pursue direct supply and authorized integrations in parallel, while designing one stable internal supplier interface. Do not commit public launch dates for a mode until its live source, rights to display/sell, booking-confirmation semantics, cancellation path, customer-funds model, and support responsibility are documented in a signed contract or authoritative authorization.

## 2. Evidence vocabulary

| Status | Meaning |
|---|---|
| **Verified in primary documentation** | Official regulator, supplier, or developer source explicitly supports the statement. |
| **Documented product, partner-gated** | Public product/API documentation exists, but commercial approval/credentials or production access is required. |
| **Operator-direct path observed** | A public official consumer booking channel exists; no third-party integration right is inferred. |
| **Not established in public evidence reviewed** | This research did not locate authoritative public documentation proving the capability. This is not proof that no private API or contract exists. |
| **Direct confirmation required** | Must be settled by supplier/regulator in writing before implementation or launch. |

## 3. Cross-mode capability matrix

| Mode | Potential primary supply path | Publicly documented capability | Production access and commercial status | Main launch blocker / evidence gap | Initial recommendation |
|---|---|---|---|---|---|
| Bus, Tanzania | LATRA-connected provider; operator-direct system; approved system owner | LATRA reports 14 providers connected to Safari Tiketi in October 2026. The 2024 Online Ticketing Regulations prescribe approval and integration requirements for online ticketing systems. | Not open by default. Provider status, authorization and interface/contract scope must be verified. | Written confirmation of Travelar's role, current approved provider/owner status, technical specifications, production certification and ticket/fiscal responsibilities. | Shortlist 2–3 approved providers for a commercial/technical diligence process; separately ask LATRA whether OuterBlocks can apply to operate its own system. |
| Bus, other markets | Operator systems, local regulated ticketing systems, bus marketplaces, aggregators | Highly country- and operator-specific. | Usually contract- and country-gated; no universal African bus-ticket API. | Per-country licensing, operator rights, route and fare inventory, ticket/manifest authority. | Use country adapters and operator contracts; do not generalize Tanzania's LATRA model to other states. |
| Ferry, Tanzania | Direct agreement with ferry operator; authorized booking intermediary | Azam Marine public website advertises bookings and routes. No public third-party API or reseller authorization was established. | Unknown until operator confirms. | Operator inventory channel, class capacities, fare rules, manifest requirements, cancellation/refund process, ticket validation and Mainland/Zanzibar jurisdiction split. | Seek direct pilot agreement; preserve referral/redirect as a distinct fallback only if written terms permit it. |
| Flights | Travelport, Amadeus, Sabre; consolidator/host agency; direct airline/NDC contracts | Each publishes flight APIs; documented functions span some combination of search, reprice, book, ticket, retrieve and modify/cancel. | Contract, production credentials and scope-specific access. Amadeus Self-Service requires a consolidator for production ticket issuance; Travelport production follows contracting and certification; Sabre credentials are mapped to agency/PCC access. | Current market eligibility, airline content, ticketing authority, consolidator contract, post-ticket service, credit/financial guarantees, support SLA, fees and settlement. | Run parallel commercial qualification with at least two providers and one legitimate consolidator/host-agency option; do not build on sandbox assumptions. |
| Train, Tanzania | Tanzania Railways Corporation official online sales platform; authorized agent/integration | TRC public SGR ticketing site provides station, date, one-way/return, and passenger search. Official app listing advertises booking, seat selection and ticket history. | No public third-party production API or reseller terms located in reviewed evidence. | Written reseller/agency policy, API/partner interface, production authority, fare/seat inventory ownership, refunds, quota and settlement. | Start with official referral/deep link only if permitted; seek an authorized booking/distribution agreement in parallel. |
| Train, Kenya | Kenya Railways / Madaraka Express booking platform; authorized agent | Kenya Railways documents online, counter and Safaricom USSD booking; passengers receive QR-code tickets. | No public third-party API right established. | Authorized third-party booking and ticket issuance rights, inventory limits, payment and refunds, production access. | Same rule: negotiated distribution first; never scrape or automate the consumer form as a substitute. |
| Stays | Expedia Rapid; Travelport Stays; Hotelbeds; Booking.com Demand API; direct hotels/channel managers | Official docs describe search/availability, rate checks, booking, retrieval, and cancellation/modification for relevant products. | Partner/affiliate credentials, contract, launch review/certification or production activation apply. Booking.com Connectivity Provider onboarding is currently paused according to its portal; this is distinct from Demand API access for affiliate partners. | Contract/markets, net or commission rates, payment model, property coverage in Africa, rate revalidation, cancellation/refund liability, taxation, property-confirmation reliability. | Prioritize one embedded API partner and one direct/local-property supply path; keep redirects distinct from native checkout. |
| Experiences | Viator; GetYourGuide; Hotelbeds Activities; local DMCs/operators; eligible Airbnb partner program | Viator publishes transactional and content endpoints; GetYourGuide offers access tiers; Hotelbeds documents real-time availability and booking/post-booking; Airbnb API scopes are partner-program-controlled. | Significant gates: GetYourGuide transactional Masterbill requires partnership-manager approval, deposit and specialist contract; Viator merchant status carries merchant-of-record and after-sales duties; Airbnb API program is not a general inventory redistribution license. | Eligibility, minimum traffic/booking thresholds, supplier territory and content, commission/net rate, merchant role, customer support/refunds, local supplier licences/insurance. | Pilot direct local experiences plus one qualified aggregator; keep affiliate/referral content from appearing as native inventory if checkout occurs elsewhere. |

## 4. How to classify an integration (mandatory)

For each supplier, record all of the following separately rather than use the single label “API available”:

1. **Documentation:** public, partner-only, private, or not provided.
2. **Sandbox:** self-service, approval-gated, or absent.
3. **Production access:** criteria, onboarding owner, region, credential issue/approval and certification.
4. **Content rights:** where descriptions, images, reviews, prices and provider names may be displayed; caching and attribution requirements.
5. **Search rights:** markets, point of sale, currency, passenger types, dates, coverage and content source.
6. **Reservation capability:** creates a supplier reservation, a held reservation, or only a referral/deep link.
7. **Ticket/voucher issuance:** who issues the legally/contractually valid document, when, and from which record.
8. **Payment role:** Travelar collection, supplier collection, consolidator credit, virtual card, invoice, or referral-only; exact contracting entity.
9. **After-sales rights:** retrieve, void, cancel, change, exchange, refund, no-show handling, schedule disruptions, and which actions remain offline.
10. **Reliability obligations:** rate limits, idempotency, support hours, status page, outage handling, reconciliation and SLA.
11. **Commercial terms:** commission/net rate/markup rights, fees, minimum volumes, reserves, credit/guarantees, currency, settlement timing and termination.
12. **Portability and exit:** booking-history access, support for pre-existing bookings, data deletion, customer communications, and transition period.

A public developer portal establishes none of items 3–12 by itself.

## 5. Readiness gates before a mode becomes “production-enabled”

- Executed contract and named contracting entities, including OuterBlocks Destinations Limited as intended operating entity and OuterBlocks Limited as parent where relevant.
- A legal/regulatory classification for the target country and product activity.
- Written evidence of production credentials and permitted use case.
- Tested end-to-end booking through confirmation, retrieval, refund/cancellation and supplier reconciliation.
- Contracted source of truth for availability, price, confirmation number, ticket/voucher, passenger details and cancellation status.
- Payment and supplier-settlement runbook, including late/duplicate events and unmatched transactions.
- Approved customer disclosures, support/complaint route and disruption policy.
- Contract-safe content storage, privacy/retention and cross-border data mapping.
- Operations owner, supplier escalation route, alerting and service-availability expectations.
- Launch approval recorded in HIMS with evidence attached.

## 6. Key primary sources

Accessed 23 October 2026 unless an update date is stated.

- LATRA, *Safari Tiketi Enhances Travel Assurance* (14 connected providers reported): https://www.latra.go.tz/news/safari-tiketi-enhances-travel-assurance
- LATRA, *Online Ticketing Regulations 2024* PDF: https://www.latra.go.tz/uploads/documents/sw-1728393485-renamed%20kanuni%20za%20tiketi%20mtandao.pdf
- Amadeus, Self-Service API FAQ (production, consolidator and post-ticketing limits): https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/
- Travelport, TripServices getting started: https://developer.travelport.com/docs/getting-started
- Travelport, production certification: https://developer.travelport.com/docs/getting-started/ready-to-certify
- Sabre, credentials and token guide: https://developer.sabre.com/guide/get-token/get-token
- IATA, Travel Agent Accreditation: https://www.iata.org/en/services/travel-agency-program/accreditation-travel/
- TRC SGR Ticketing Online Sales: https://sgrticket.trc.co.tz/
- Kenya Railways, Madaraka Express FAQ: https://krc.co.ke/madaraka-express-faq/
- Expedia Rapid setup: https://developers.expediagroup.com/rapid/setup
- Expedia Rapid Lodging workflow: https://developers.expediagroup.com/rapid/lodging
- Booking.com Demand API: https://developers.booking.com/demand/docs/open-api/3.2/demand-api
- Booking.com Connectivity APIs: https://developers.booking.com/connectivity/docs
- Booking.com Connectivity Portal (new connectivity-provider onboarding status): https://connect.booking.com/?lang=en
- Hotelbeds Hotel Booking API: https://developer.hotelbeds.com/documentation/hotels/booking-api/
- Viator Partner API: https://docs.viator.com/partner-api/
- GetYourGuide API integration requirements, updated 4 September 2026: https://partner.getyourguide.support/hc/en-us/articles/13981133907613-API-integration-and-requirements
- Airbnb API Terms, updated 15 October 2025: https://www.airbnb.com/help/article/3418

## 7. Unresolved evidence register

| ID | Question | Owner to contact | Evidence required | Blocking scope |
|---|---|---|---|---|
| SUP-001 | Which LATRA-approved provider will contract with Travelar and grant the exact intended distribution rights? | LATRA + shortlisted provider | Current status/approval evidence, API specification, signed commercial and technical terms | Tanzania bus |
| SUP-002 | Can OuterBlocks become a system owner or approved online ticket provider, and under what certification sequence? | LATRA | Written route/requirements and current fees | Tanzania bus |
| SUP-003 | Is any Azam Marine API or agent/reseller program available for the target route? | Azam Marine commercial/IT | Partner pack, sandbox, terms and validation/settlement workflow | Ferry |
| SUP-004 | Which GDS will contract with OuterBlocks and with which PCC/agency and markets? | Amadeus, Travelport, Sabre | Commercial quote, production eligibility, supported content, certification and service matrix | Flights/stays |
| SUP-005 | Which consolidator can ticket Travelar's chosen GDS bookings for customers in Tanzania? | GDS support + qualified consolidators | Contract, credit/guarantee, ticketing SLA, after-sales and service fees | Flights |
| SUP-006 | Will TRC or Kenya Railways authorize embedded reseller booking? | TRC / Kenya Railways | Written API, reseller or agency terms, test environment and production authorization | Train |
| SUP-007 | Which lodging supplier accepts an Africa-first start-up as partner and supports Tanzania/Kenya inventory? | Expedia, Hotelbeds, Booking.com affiliate/demand team, direct hotels | Eligibility and markets, rates, fees, production onboarding, payment terms | Stays |
| SUP-008 | Can Travelar qualify for transactional Viator/GetYourGuide access now, and with what service obligations? | Viator / GetYourGuide partner teams | Written partner-eligibility review, terms and technical/onboarding checklist | Experiences |
| SUP-009 | Does Airbnb approve a program whose permitted scope is selling experiences through a third-party consumer OTA? | Airbnb API partnerships | Specific written program terms and scopes | Experiences |

**Research status:** preliminary supplier capability review; commercial access and contractual rights remain unresolved. This document is not evidence that Travelar has any supplier agreement or production API credential.
