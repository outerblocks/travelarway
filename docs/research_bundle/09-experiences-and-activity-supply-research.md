# 09 — Experiences and Activity Supply Research

> **Stage 14 product-scope clarification (24 October 2026):** Train and Experiences are first-class Travelar modes, not future modes. Their requirements belong in the current product, architecture, integration and test baseline. Per-country activation may remain gated until authorized suppliers, contracts, ticket/voucher flows and support/refund handling are verified. See `40-train-and-experiences-first-class-mode-research.md`.

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Evidence cut-off:** 23 October 2026

## 1. Executive conclusion

Experiences cannot be treated as a simple list of tours with a price. A live product may have product variants, date/time slots, participant categories, meeting/pickup conditions, capacity limits, supplier-specific questions, voucher rules and strict cancellation cutoffs. A successful booking may be a confirmed reservation, a pending/confirmation request, or a referral to another checkout depending on the supplier model.

The strongest documented candidates for Travelar to qualify are **Viator Partner API**, **GetYourGuide API**, **Hotelbeds Activities API**, and direct local tour operators/destination-management companies (DMCs). Airbnb's API terms permit only approved partner-program uses and specific scopes; they do not create a general right to aggregate and resell Airbnb Experiences inside Travelar.

For an Africa-first launch, direct onboarding of vetted Tanzania-based activity providers should be part of the strategy even if one international aggregator is secured. Do not make a supplier API a prerequisite for every local activity where a lawful direct supply contract and operationally safe booking workflow is possible.

## 2. Supplier comparison

| Supplier/channel | Documented capability | Access and eligibility | Booking/merchant responsibility | Recommendation for Travelar |
|---|---|---|---|---|
| **Viator Partner API** | API documents content retrieval, product details, photos/reviews, pricing, availability, booking requests, ticket purchase, status and post-booking. | Two broad partner categories: merchant and affiliate. The official docs distinguish them. Transactional use and partner qualification must be confirmed with Viator. | Merchant partner is merchant of record and is responsible for monetary transactions, customer support, cancellations/refunds and supplier/customer liaison. Affiliate content/links do not permit native completion through affiliate-only transactional endpoints. | Request formal partner qualification. Choose affiliate/referral or merchant integration explicitly; never present one as the other. Confirm allowed destinations, fees/commission, content rights and service obligations. |
| **GetYourGuide Partner API** | Current official access tiers vary: Basic teaser content; Reading access for more details/options/availability; Masterbill can make bookings as merchant of record. | Its help center, updated 4 September 2026, states 100,000 monthly website visits or 50,000 app downloads for Basic; Reading requires 1 million monthly visits and at least 300 monthly bookings for partners already holding Basic access; transactional Masterbill is offered by partnership managers and requires a deposit and specialized contract. | Masterbill booking partners act as merchant of record and are billed monthly under the relevant agreement. Full onboarding support is not guaranteed; partner needs its own technical capability. | Treat transactional access as a medium-term milestone until Travelar meets the threshold/contract criteria. Ask whether a new Africa-first platform can be considered for a different launch path; get written exception/qualification if available. |
| **Hotelbeds / HBX Group Activities API** | Official docs describe real-time search/availability, details/check-rate, booking confirmation, booking details/listing and cancel/modify post-booking processes. | Developer portal describes registration for API keys and evaluation environment; production terms and commercial approval are separate and must be confirmed. | Depends on the negotiated API, rate plan, booking and settlement agreement. | Qualify alongside Viator; review actual East African activity coverage, net price, currencies, cancellation terms and production settlement conditions. |
| **Airbnb Experiences / Airbnb API** | Airbnb's official API terms cover partner programs and host-service functionality, including categories such as activity/tour booking management software; scopes are assigned according to specific program. | Requires an Airbnb API Program relationship, applicable terms, partner-specific terms where relevant, data-security review and allowed scopes. Access may be limited/changed; use of undocumented API is prohibited. | API terms explicitly limit data use to permitted uses, restrict making API/content available to third parties or deriving income except as specially authorized, and restrict use of API content to rebrand/repackage or support competing/similar services absent specific terms. | **Do not plan on a general Airbnb Experiences consumer-inventory API.** Seek direct written approval for the exact proposed business model; otherwise use permitted referral links only if an official commercial program authorizes them. |
| **Direct local operators / DMCs** | Can support supplier-specific products with native capacity/calendar, confirmation, manual or API workflows and direct vouchers. | Each supplier needs identity/business verification and documented permissions appropriate to the activity and jurisdiction; integration may start with a controlled supplier portal if operationally safe. | Contract decides who sells, receives funds, fulfills, provides guide/vehicle, handles safety, incidents, rescheduling and refunds. | Critical Africa-first supply strategy; use a repeatable onboarding pack, written service standards, insurance/licence checks where applicable, quality controls and clear refund/liability terms. |
| **Experiences referral/affiliate** | Content/deep link and tracked hand-off to supplier-hosted checkout, if program terms allow. | Subject to partner approval, attribution/link conditions, brand rules and destination availability. | Supplier completes checkout and usually owns direct booking/payment, but Travelar must disclose hand-off and manage customer expectations. | Suitable as an early coverage layer but should not be counted as Travelar-native confirmed inventory or native checkout conversion. |

### Primary sources

- Viator Partner API documentation: https://docs.viator.com/partner-api/
- Viator Partner API technical documentation and updates: https://docs.viator.com/partner-api/technical/
- Viator technical guide for API partners: https://partnerresources.viator.com/travel-commerce/technical-guide/
- GetYourGuide API integration and requirements (updated 4 September 2026): https://partner.getyourguide.support/hc/en-us/articles/13981133907613-API-integration-and-requirements
- GetYourGuide API portal: https://api.getyourguide.com/
- GetYourGuide supplier API integration docs: https://integrator.getyourguide.com/documentation/overview
- Hotelbeds Activities Booking API overview: https://developer.hotelbeds.com/documentation/activities/booking-api/overview/
- Hotelbeds API getting started: https://developer.hotelbeds.com/documentation/getting-started/
- Airbnb API Terms of Service, updated 15 October 2025: https://www.airbnb.com/help/article/3418

## 3. Product model: product, option, departure and booking are distinct

Travelar should model at least four levels:

1. **Experience product:** title, supplier, destination, activity category, content license, inclusions/exclusions, location, safety disclosures and base audience.
2. **Bookable option:** language, duration, meeting/pick-up type, package, private/shared, participant rules, transfer inclusion, accessibility constraints and option-specific policies.
3. **Departure/availability slot:** local date/time, timezone, capacity, cutoff, guide/resource assignment, price, currency, supplier status and remaining capacity.
4. **Booking / participant list / voucher:** selected option/slot, participant counts and names or ages where required, customer answers, supplier confirmation, ticket/voucher, redemption instructions, and cancellation/fulfillment state.

Do not flatten all options into one product price. A product can have several time slots and distinct price/policy combinations. Store the supplier's original identifiers and policy snapshots with every booking.

## 4. Consumer search and checkout requirements

### Search

- Destination, attraction, coordinates or radius; date or date range; participant categories/counts; optional time slot; language; activity category; duration; accessibility or other filter only if supplier data are trustworthy.
- Search results need content source, update timestamp, currency, available/sold-out state, starting price qualification and affiliate/deep-link status when applicable.
- Avoid suggesting “available” from cached text alone. Recheck a concrete option/slot before checkout if live availability is required.

### Option selection and price validation

- Resolve participant types and the exact product option/slot.
- Collect mandatory booking questions defined by supplier: participant age, lead traveller, pickup/meeting point, hotel, dietary/accessibility information, or other activity-specific answers.
- Show time zone, start time, duration, meeting point, inclusions/exclusions, cancellation deadline and any non-refundable term.
- Revalidate availability and final price. If the supplier changes the total or option, require explicit customer acceptance.

### Reservation and voucher

- Use idempotency/correlation keys if supplied; reconcile timeouts with booking-retrieval endpoints before retrying.
- Persist supplier booking ID, confirmation state, ticket/voucher identifier, barcode/QR details only as allowed, redemption instructions and cancellation terms.
- Differentiate booked, pending confirmation, confirmed, voucher issued, redeemed, cancelled, refund pending, refunded, failed and unknown states where supported.
- Do not issue a Travelar-branded “confirmed voucher” merely because a redirect happened or payment succeeded. The supplier's rules determine when confirmation is real.

### Post-booking service

- Retrieve current booking state before cancellation or modification.
- Calculate/obtain supplier cancellation penalties and deadlines; distinguish cancellation request from supplier-confirmed cancellation and from customer refund settlement.
- Support weather events, attraction closure, guide no-show, customer late arrival, pickup failure, duplicate voucher and safety incidents.
- Record which party owns each task: Travelar, supplier, affiliate platform or payment provider. Customers should not be passed between parties without a case owner.

## 5. Direct local supplier onboarding and governance

Each local experience supplier's record should include:

- Legal/business identity and authorized contracting signatory.
- Registration/licences/permissions appropriate to the activity and locality, verified with the responsible authority or qualified local counsel; do not assume tourism approval covers every activity.
- Responsible supplier contact and out-of-hours emergency contact.
- Experience/product owner, operational staff, meeting points and pickup commitments.
- Insurance and safety documents appropriate to activity risk; emergency and incident reporting process.
- Dates/capacity/rates, availability update frequency, closeout rules, participant limits and supplier substitution policy.
- Consumer terms, cancellation/refund policy, weather/closure response, minimum participant rule, accessibility and child-protection arrangements where relevant.
- Contracted commercial model: commission, net rate, permitted markup, taxes, settlement frequency, invoice/receipt responsibilities and chargeback allocation.
- Data use/retention, photo/content rights, attribution, complaint evidence and deletion/termination process.
- Confirmation mode: real-time API, portal confirmation, manual approval or redirect. Product page must not promise instant confirmation if supplier response is manual.

### Supplier maturity tiers

- **Tier A — API-live:** authenticated availability and booking/cancellation, documented production SLA and reconciliation.
- **Tier B — portal-managed:** supplier staff confirm/revise availability and fulfil bookings in a controlled Travelar portal, with audit trail and explicit response-time commitment.
- **Tier C — manual / request-to-book:** customer is told booking is pending until confirmation; inventory is not shown as guaranteed; operations monitors overdue cases.
- **Tier D — referral only:** booking completes off-site; display is clearly labelled as an external transaction under approved terms.

Only Tier A or appropriately tested Tier B should be displayed as instant-confirmation Travelar-native inventory.

## 6. Commercial model decisions

Potential models (not presumed available):

- Commission from supplier for completed/fulfilled bookings.
- Net rate with contractually permitted markup.
- Affiliate referral commission after user completes booking on supplier's website.
- Service/support fee where lawful and properly disclosed.
- Direct local-provider commission/markup under a signed contract.

The model affects whether Travelar is merchant of record, how funds move, what refund reserve is needed, whether it must invoice or remit funds, and which party faces customer disputes. Viator's merchant partner role explicitly carries merchant-of-record and customer-service obligations; GetYourGuide's Masterbill booking tier also identifies merchant-of-record status. These are not incidental API details; they change operational and financial responsibility.

Before enabling a supplier, the commercial register must state: commission or net rate, basis (gross/net/excluding tax), currency, applicable service fees, refund commission treatment, settlement timing, reserves/deposits, chargeback allocation, taxes, payment provider, and what happens on cancellation, no-show, partial fulfillment or supplier failure.

## 7. Acceptance test suite

For each aggregator and direct supplier adapter, test:

1. Search with valid destination/date/party; no results; invalid date; supplier timeout; rate-limited response.
2. Option with mandatory question omitted; invalid participant age; capacity reaching zero mid-checkout.
3. Price/availability changes after search; customer acceptance required; price changes again before booking.
4. Duplicate booking request and retry after unknown timeout; supplier booking lookup resolves one real booking, not two.
5. Booking request accepted but confirmation delayed; customer communication does not promise confirmed status prematurely.
6. Confirmation received but voucher/document request fails; retry without duplicating the booking.
7. Partial cancellation, cancellation deadline, non-refundable option, supplier-approved refund, and PSP refund mismatch.
8. Supplier closure/weather disruption and customer escalation.
9. Invalid/duplicate voucher redemption and offline check-in synchronization if supported.
10. Content cache expiry, photo rights, language gaps, timezone daylight rules and currency display.
11. Supplier API credentials revoked, rate limits changed, or provider becomes unavailable; graceful mode shutdown and customer case creation.
12. Tenant and role isolation for local supplier portal and HIMS users.

## 8. Recommended initial approach

1. Request a formal transactional partner review with Viator and GetYourGuide; request a commercial and territory coverage proposal, not just API credentials.
2. Request Hotelbeds Activities API production partner terms and current destination coverage as an alternative aggregator.
3. Create a direct supplier onboarding pilot for a small, verified set of Tanzania activities, with clear operational confirmation procedures.
4. Treat Airbnb Experiences aggregation as **unavailable unless Airbnb explicitly approves the exact Travelar use case in writing**. Do not scrape or reuse private/undocumented APIs.
5. Do not promise inventory coverage, instant confirmation or a single refund policy across supply sources. Label provider and fulfillment terms accurately.

## 9. Unresolved evidence register

| ID | Question | Owner | Evidence required | Status |
|---|---|---|---|---|
| EXP-001 | Does Travelar qualify for Viator transactional merchant API access, in which territories and under what onboarding test? | Viator partner team | Written eligibility, contract, production scopes, price/commission and support obligations | Open |
| EXP-002 | Can Travelar qualify for GetYourGuide API access at launch before its published traffic/booking thresholds; if so, which access level? | GetYourGuide partner manager | Written decision, contract, deposit, merchant-of-record duties, rate limits | Open |
| EXP-003 | What Hotelbeds Activities production contract, destination coverage, and settlement model is available to OuterBlocks? | Hotelbeds/HBX Group | Current commercial proposal and production onboarding requirements | Open |
| EXP-004 | Does Airbnb authorize an embedded Travelar consumer checkout/listing distribution model for Experiences? | Airbnb API partnerships | Partner-specific program terms and scopes | Open; do not assume yes |
| EXP-005 | What exact licences/insurance and cancellation/liability provisions apply to Travelar's directly onboarded Tanzania experience types? | Relevant Tanzania authorities and qualified counsel | Per-activity regulatory checklist and reviewed supplier contract | Open |
| EXP-006 | Is each experience supplier actually able to confirm inventory in real time? | Supplier operations | Demo/test evidence, source-of-truth record and service-level commitments | Open |

**Research status:** primary product/API documentation reviewed; commercial eligibility, contracts and exact supplier coverage remain unconfirmed. No supplier API access or agreement is claimed for Travelar.


## Stage 14 current-status delta — 24 October 2026

Experiences is a first-class Travelar mode now. See `40-train-and-experiences-first-class-mode-research.md` for an updated access-status comparison: Viator documents end-to-end Partner API functions for qualifying partner tiers; GetYourGuide describes access-tier and eligibility thresholds; Expedia Rapid Activities is documented as selected-partner early access with general availability stated for 2027; and Airbnb's public embedded Experiences booking tool is being discontinued. Directly onboarded local suppliers are a core Africa-first supply model. No supplier API entitlement is assumed for OuterBlocks Limited until contracted.
