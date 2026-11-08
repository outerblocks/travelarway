# 07 — GDS, Flight, Accommodation and Ticketing Research

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Evidence cut-off:** 23 October 2026

## 1. Decision summary

A GDS API is infrastructure for accessing and servicing travel content, not a blanket ticket-sales licence. Travelar must separately validate (a) API/agency eligibility, (b) the content and market rights attached to the credentials, (c) ticket-issuance authority, (d) who collects customer funds and pays the airline/supplier, and (e) who owns exchanges, refunds, schedule changes and customer support.

**Best initial posture:** qualify Travelport, Amadeus, and Sabre through their current official channels while simultaneously seeking a legitimate airline consolidator/host-agency arrangement. Do not select a provider on sandbox quality alone. For stays, run a separate selection exercise: flight GDS hotel content is one source, not a presumption that it offers the best rates, African property depth, or commercial model.

## 2. Provider comparison

| Provider | Verified public product capability | Access/ticketing position found in primary sources | Important limits / unknowns | Travelar implication |
|---|---|---|---|---|
| **Amadeus Self-Service** | Flight Offers Search, Flight Offers Price, Flight Create Orders and Flight Order Management are described in the official FAQ. It also provides travel content APIs, hotels and destination activities. | Production eligibility requires an approved market, local legal compliance, and an airline consolidator for ticket issuance. Production Flight Create Orders requires a signed consolidator contract. Customer collection is outside the API; settlement with consolidator is separately agreed. | The present official source reviewed did not conclusively establish Tanzania's eligibility for the relevant production feature. Issued-ticket changes and refunds may require offline contact with the consolidator; pre-issue cancellation differs from post-ticketing after-sales. | Obtain written market eligibility and a named, contracted consolidator before committing to native flight checkout. Model the consolidator as a separate dependency and adapter. |
| **Travelport TripServices** | Official developer portal describes end-to-end air shopping, pricing, booking, ticketing, cancellation and modification; access to 400+ airlines is a provider-published coverage claim. Stays APIs also cover hotel workflows. | Trial credentials are available by request. Production/pre-production credentials are provisioned. Production access is based on contracted APIs, with certification; Travelport states at least 15 days' notice before planned production transition. | Production content, ticketing, settlement, change/refund scope and fees depend on the negotiated contract, agency identifiers and selected APIs. Travelport's API documentation warns that refunds are not generally available via the GDS refund workflow in its TripsServices APIs; NDC refund/void paths differ. | Strong candidate for a contract-led API evaluation, but negotiate post-ticket servicing and settlement explicitly. Ask for Tanzania-based onboarding requirements and an itemized API/content quote. |
| **Sabre** | Official Developer Hub documents air search/shop and booking-related products, plus APIs for shop, book and post-booking workflows. | Sabre's official token guide says access is determined by credentials, environment and the subset of APIs enabled for the agency. PCC/iPCC identifies the agency; EPR controls employee access. Some APIs can be tried in a certification environment with a developer account, while some require a provisioned account. | Public sandbox access does not indicate access to all production content or transactional functions. The exact air content, ticket authority, financial requirements and regional commercial eligibility need account-team confirmation. | Qualify through Sabre with OuterBlocks's specific travel business model, desired market and agency/consolidator arrangement. Keep credentials isolated and scope-restricted. |
| **IATA accreditation** | IATA describes travel-agent accreditation as an airline-recognition and settlement framework. GoLite, GoStandard and GoGlobal have different intended scope/payment/financial arrangements. | IATA accreditation, an airline/GDS contract, API access, and ticketing authority are separate concepts. IATA notes accreditation can grant ticketing-related relationships and BSP access, subject to the chosen program and rules. | Do not assume that an accreditation label alone gives every airline/content channel or every market. Country-specific application requirements and financial criteria apply. The exact Tanzania requirements must be taken from IATA's current country checklist and contract. | Decide between own accreditation, host-agency/consolidator route, or supplier-specific arrangement after comparing cash/credit exposure, guarantees, control, service capability and scale. |

### Provider-specific primary sources

- Amadeus Self-Service FAQ: https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/
- Amadeus developer portal: https://developers.amadeus.com/
- Travelport TripServices introduction: https://developer.travelport.com/
- Travelport getting started: https://developer.travelport.com/docs/getting-started
- Travelport certification and production: https://developer.travelport.com/docs/getting-started/ready-to-certify
- Travelport Flights API reference (booking/ticket functionality): https://support.travelport.com/webhelp/jsonapis/airv11/content/air11/APIReferences.htm
- Sabre developer portal: https://developer.sabre.com/
- Sabre credentials/PCC/EPR: https://developer.sabre.com/guide/get-token/get-token
- IATA Travel Agent Accreditation: https://www.iata.org/en/services/travel-agency-program/accreditation-travel/
- IATA Tanzania requirements page: https://www.iata.org/en/services/travel-agency-program/accreditation-travel/country-requirements/a52w0000000fxovaaa/pax/
- IATA Travel Agent Handbook resources: https://www.iata.org/en/services/travel-agency-program/travel-agent-resources/tah/

## 3. Flight booking lifecycle and requirements matrix

| Stage | Minimum consumer fields / system actions | Supplier action to verify | Acceptance and failure requirements |
|---|---|---|---|
| Search | Trip type (one-way, return, multi-city if supported), origin/destination airport or city, dates, passenger counts by type, cabin, market/point-of-sale, currency, language and direct/stop preferences. | Search shopping offers and return fare families, itinerary legs, baggage/ancillary summary, restrictions, supplier references and applicable currency. | Validate airport/city codes server-side; handle unsupported passenger combinations, empty results, stale markets and provider timeouts. |
| Price / revalidate | Selected supplier offer reference; passenger/cabin/itinerary details unchanged or explicitly revised. | Re-price/recheck itinerary before collection of funds or order creation; return the current all-in price and fare conditions. | If price or conditions changed, stop and obtain explicit customer acceptance. Never accept a client-submitted fare as authoritative. |
| Reserve / book | Traveller names as required by supplier/fare; contact details; passenger types and document data when required. | Create PNR/order/booking, with known expiry or ticketing deadline, and report success/failed/unknown outcome. | Use idempotency/correlation identifiers where supported; reconcile ambiguous timeouts before retrying to avoid duplicate PNRs. A booking reference is not necessarily an issued ticket. |
| Payment orchestration | Customer payment method, billing/contact information required by PSP and supplier; displayed fare and service fee breakdown. | Determine who charges the customer, who must pay the consolidator/airline, accepted form of payment, credit terms and timing of ticket issue. | Do not tell the customer “ticket confirmed” while only payment or a PNR is confirmed. Keep payment status separate from ticket-document status. |
| Ticket issuance | Confirmed booking/order, passenger data, validated form of payment or authorized credit, and supplier deadline. | Ticket issue or E-ticket Document Number generation by authorized agency/consolidator/GDS path. | Store supplier-issued document identifiers and ticketing status; independently verify issuance. Handle partial ticketing and multiple tickets per PNR. |
| Retrieval | Booking reference plus an authenticated owner/agent context. | Retrieve current booking, passenger, coupon/ticket and payment-related data within granted scope. | Avoid exposing PNRs and passenger data based only on a guessable record locator. Log every privileged retrieval. |
| Cancel / void / refund | Booking/ticket identifier, traveller intent, policy and cutoff checks; approval if financially high risk. | Provider-dependent cancellation/void/refund quote and confirmation. Issued-ticket exchanges/refunds can be offline or contract-dependent. | Distinguish reservation cancel, ticket void, refundable balance, supplier-approved refund and PSP refund. Reconcile ticket status and funds separately. |
| Exchange / disruption | Existing reservation/ticket, desired change, airline schedule change or customer request. | Eligibility check, new fare quote, change fees, reissue and supplier decision. | Build a service case when the API cannot complete the transaction. Preserve audit evidence and responsibility hand-off. |

### Important aviation rules

- **PNR/order is not the same as ticket.** A reservation can exist without an issued ticket. Customer confirmation must reflect the real state.
- **API access is not IATA accreditation.** IATA accreditation is not a substitute for an explicit supplier/agency content and ticketing arrangement.
- **NDC, GDS legacy content and consolidator workflows differ.** Use capability-based adapters rather than assuming one common exchange/refund method.
- **A “successful” API response must be interpreted by the transaction step.** A successful shopping response does not mean the fare remains available; a successful PNR creation does not prove the ticket was issued; a cancellation request is not a refund settlement.
- **Market eligibility is a contractual/commercial question.** Confirm Tanzania point-of-sale, currency, eligible entity, customer market and airline coverage in writing.

## 4. Flights: decision alternatives

| Model | Benefits | Cost / trade-off | Main risk to resolve |
|---|---|---|---|
| Own GDS agency access + own accreditation/ticketing authority where viable | More control over customer lifecycle and distribution relationships. | Accreditation/admin overhead, financial criteria, credit management, settlement and post-booking staffing. | Cash/guarantee exposure, service capability, current market and airline-specific authority. |
| GDS API + consolidator/host agency | Can provide a faster path to issued tickets without building every upstream airline relationship. | Consolidator margin/fees, dependent ticketing SLA, policy and support boundaries; after-sales may remain manual. | Delayed issuance, unclear liability in failed payment/booking cases, limited post-ticket API functions. |
| Referral/affiliate / deep link | Lower transactional and settlement burden; useful while testing demand. | Reduced control of checkout/customer journey; terms may restrict price display or branding; lower/uncertain revenue. | Do not misrepresent a redirect as a Travelar-issued ticket or count click-through as confirmed bookings. |

## 5. Accommodation supplier assessment

| Supplier/product | Documented workflow | Access and commercial notes | Key decision for Travelar |
|---|---|---|---|
| **Expedia Group Rapid Lodging API** | Static property content and geography; shopping by dates/occupancy; room rates, fees and cancellation policy; price check; booking request; retrieve, cancel and change/manage itinerary as supported. Expedia states a partner relationship and launch review are required; a development key is not automatically enabled for production. | Partner applications reviewed case-by-case. API documentation explains tokenized follow-up links and multiple payment options, including property-collect paths. | Ask for current Tanzania/Kenya property coverage, supplier/payment model, partner criteria, fee/markup terms, cancellation flows, launch checklist and expected response/confirmation behavior. |
| **Travelport Stays** | Availability/search, recheck, booking, retrieval and cancellation/changes exist in API documentation. The docs expressly recommend rechecking availability and show the booking may pause if terms or rate change. | Access to TripServices is contractual/certification-gated; API scope and inventory depend on account setup. | Compare property coverage/terms with Rapid and Hotelbeds; ensure reprice/recheck and changed-rate acceptance are built into the flow. |
| **Hotelbeds / HBX Group Hotel Booking API** | Official docs describe hotel availability, CheckRates/revalidation when needed, booking confirmation, retrieval, modification and cancellation, along with a separate content API. Public developer registration provides evaluation/test credentials; production commercial authorization must be established separately. | Need current production contract, market coverage, rates/net commercial model, settlement/deposit/credit, currencies and cancellation fee exposure. | Strong source to qualify, especially if commercial terms and supply suit Africa-first use cases; do not assume developer keys are production rights. |
| **Booking.com Demand API** | Official Demand API documentation says affiliate partners can access travel inventory including accommodation, cars, flights and more through versioned REST/JSON API. Affiliate ID and token credentials are used. | Affiliate program eligibility, API scope, brand/content and contractual rules apply. | Determine whether permitted API scope allows Travelar's proposed UI, booking completion, payment model, customer support and specific market. |
| **Booking.com Connectivity API** | Official docs enable connectivity partners to manage the availability, pricing, reservations and property content for properties listed on Booking.com. | It is a property/channel-connectivity product, not automatically an OTA's global inventory API. The official portal currently says onboarding new connectivity providers is paused until further notice. | Do not select it as Travelar's primary consumer accommodation feed. It may be relevant later if Travelar becomes a qualifying property/channel manager, subject to portal reopening and approval. |
| **Direct hotels and channel managers** | Property-specific API, channel-manager connection, allocated allotments, or contracted direct inventory. | Fragmented onboarding, inconsistent APIs, manual fallback and property-by-property commercial terms. | Can differentiate local inventory and keep supplier relationships direct, but must invest in partner onboarding and prevent overbooking by agreeing an authoritative inventory owner. |
| **Affiliate/referral** | Supplier-hosted checkout via permitted links/widgets/deep link. | Lower integration burden but reduced control; commission tracking, cookie windows, attribution and allowed content need agreement. | A legitimate pilot or long-tail fallback, provided results clearly disclose who takes the booking and where the customer completes it. |

### Accommodation workflow requirements

1. Collect destination/property, check-in/out, adult/child count and ages, room count, market, currency and language.
2. Search cached/static content with supplier identifiers and freshness rules; dynamic rates require live shopping.
3. Revalidate the selected rate and availability before booking, especially when instructed by the supplier.
4. Preserve the exact cancellation policy, deadlines, local timezone, meal/board, occupancy, tax/fee breakdown and payment/guarantee conditions shown at checkout.
5. Submit guest details and supplier payment/guarantee information through the authorized payment path.
6. Verify the supplier confirmation/itinerary identifier and retrieve the completed booking record.
7. Manage modifications, cancellation quote, refund due, and PSP refund as distinct events.
8. Support property-collect, prepay, virtual card, deposit and invoice models only when enabled under the particular contract. Never infer a single payment model across suppliers.

### Primary sources for accommodation

- Expedia Rapid partner setup: https://developers.expediagroup.com/rapid/setup
- Expedia Rapid Lodging overview: https://developers.expediagroup.com/rapid/lodging
- Expedia Manage Booking API: https://developers.expediagroup.com/rapid/lodging/manage-booking/about-mg-booking-api
- Expedia Rapid API product hub: https://developers.expediagroup.com/docs/
- Travelport Stays general workflow: https://developer.travelport.com/docs/stays/guides/stays-general-guide
- Travelport Stays API endpoints: https://developer.travelport.com/docs/stays/general/stays-api-endpoints
- Travelport Stays FAQ: https://developer.travelport.com/docs/stays/faq
- Hotelbeds Hotel Booking API: https://developer.hotelbeds.com/documentation/hotels/booking-api/
- Hotelbeds getting started: https://developer.hotelbeds.com/documentation/getting-started/
- Booking.com Demand API v3.2: https://developers.booking.com/demand/docs/open-api/3.2/demand-api
- Booking.com Connectivity API docs: https://developers.booking.com/connectivity/docs
- Booking.com Connectivity Portal (current onboarding notice): https://connect.booking.com/?lang=en

## 6. Production provider due-diligence worksheet

Before choosing any provider, request an answer/document for each item:

- Eligible contracting entity: OuterBlocks Destinations Limited as the intended operating entity, subject to formal verification and the provider's approval; OuterBlocks Limited may be involved only under an explicit contract/group arrangement.
- Countries/points of sale supported and whether Tanzania-issued customer payments are permitted.
- Consumer travel content and supplier coverage for desired countries, cities, routes, airlines and property classes.
- Which endpoints/actions are enabled in test and production.
- Whether sandbox content/prices reflect production distribution rights or are synthetic.
- Booking hold expiry, price guarantee, ticketing deadlines and timeout recovery procedure.
- Supported payment modes and credit/financial security requirements; whether funds travel through a consolidator/supplier account.
- Commission, net rate, markup, service-fee and chargeback terms.
- Fee per search/booking/ticket/change/cancel, minimum commitment, onboarding/certification and support charges.
- Rate limits, support hours, production SLA, incident status channel and maintenance notices.
- Refund, void, cancel, exchange, name change, schedule change and no-show rights by content type.
- Data processing terms, subprocessors, hosting/cross-border transfers, retention and incident notice terms.
- Content license, caches, photo/review usage, supplier attribution and search-engine restrictions.
- Evidence of certification and a complete end-to-end test report, including fail/retry/duplicate tests.

## 7. ADR candidates (not final decisions)

### ADR-SUP-01 — Flight distribution model

**Question:** own agency/ticketing path versus GDS plus consolidator versus referral-first.  
**Evidence available:** provider documentation confirms technical capabilities but not Travelar's commercial eligibility.  
**Decision required:** after written offers, sample contract review, and an operating-cost/working-capital model.  
**Reject condition:** no contracted ticketing and post-ticket support path for the advertised journey.

### ADR-SUP-02 — Accommodation supply mix

**Question:** one partner API, GDS plus regional bedbank, direct local inventory, affiliate/referral, or hybrid.  
**Evidence available:** official docs for Expedia Rapid, Travelport Stays, Hotelbeds, Booking.com Demand, and Booking.com Connectivity demonstrate materially different product and onboarding scopes.  
**Decision required:** after coverage testing for East African destinations, commercial quotes, and simulated refund/relocation tests.  
**Reject condition:** displayed rates cannot be revalidated or the contract does not specify who fulfils the booking and refund.

## 8. Evidence status and remaining questions

**Verified through primary documentation:** documented API functions and general access/certification patterns described above.  
**Unresolved:** Travelar's approved markets/credentials, commercial fees, production access, airline and property coverage, consolidator terms, payment model, country-specific legal classification and supplier contract rights.

Questions for direct confirmation include: Is Tanzania an approved point of sale for the selected Amadeus Self-Service booking feature? Which Travelport/Sabre products and content are available under a contract held by OuterBlocks Destinations Limited, or another expressly approved group entity? Who handles ticket issuance and after-sales? What financial security, settlement and minimum-volume requirements apply? Which hotel products permit Travelar's desired customer checkout model and direct collection of funds? Does a current contract permit market-specific markups and fees?
