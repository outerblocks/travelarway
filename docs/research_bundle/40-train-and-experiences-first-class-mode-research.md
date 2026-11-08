# 40 — Train and Experiences: First-Class Travelar Modes and Supplier-Access Research

**Product:** Travelar  
**Operating company baseline:** OuterBlocks Limited  
**Research date:** 24 October 2026  
**Status:** Product scope confirmed by owner; supplier access and market-specific transaction rights remain to be verified.  
**Decision:** Train and Experiences are first-class product modes now. They are not deferred/future modes. Transactional activation remains provider-, country-, contract- and operations-gated.

## 1. Executive decision

Travelar's product scope includes six first-class modes: **Bus, Ferry, Flights, Stays/Hotels, Train, and Experiences**. Train and Experiences must be represented in the live product's information architecture, mode-specific search forms, domain model, provider adapter contracts, booking lifecycle, testing, HIMS country/mode configuration and release roadmap.

This does not authorize Travelar to sell a railway ticket or activity before it has a valid supply path. The distinction is:

- **First-class product scope:** the mode has defined product requirements, UX, data concepts, supplier interface boundaries and acceptance tests now.
- **Transactional market activation:** a particular country/operator/provider may be enabled only after production access or a signed direct-supply arrangement, lawful commercial/operational classification, ticket/voucher fulfilment, cancellations/refunds, reconciliation and support procedures are verified.
- **Permitted referral/handoff:** where a provider only permits affiliate/referral distribution, Travelar may offer that clearly described path if the applicable agreement allows it. It must not simulate a Travelar-controlled transaction, claim it issued the ticket or create an unsupported booking state.

A mode with no current transactional supplier must remain a recognized mode and be represented honestly in that country's configured user experience. Do not silently classify the mode as future or manufacture inventory/API access.

## 2. Train mode — product requirements and supply strategy

### 2.1 First-class consumer workflow

The Train tab is part of the Travelar mode selector and landing-page information architecture. Its search model is distinct from bus and ferry:

- Origin station and destination station, selected from a provider/country-specific station registry.
- Departure date; return date only for operators that support return journeys in the integrated/authorized flow.
- Passenger count and types according to the particular railway's supported categories and age rules.
- Class/seat preference and time preference where supported.
- Market/currency and locale derived from the user's selected market and provider terms.
- Conditional passenger identification, railcard/discount eligibility, accessibility and passenger details only where the supplier/route requires them.

Search results should preserve railway/operator identity, train/service number, origin and destination stations, intermediate stops or segment information when supplied, local departure/arrival times, journey duration, transfers, class, total and currency, fare conditions, baggage/accessibility constraints if supplied, sale cut-offs, cancellation/rescheduling restrictions, ticket form and supplier source.

The customer flow should be modeled as:

`Search → eligible services → select service/class → supplier price/availability revalidation → required passenger information → booking/hold (if the provider supports it) → payment or supplier-defined payment path → supplier booking confirmation → ticket retrieval/issuance → customer delivery → manage/change/refund`

Not every railway has the same lifecycle. The adapter must expose whether the supplier creates a reservation, holds inventory, collects payment, issues the ticket immediately, or requires another authorized process. Never force a GDS-style universal ticketing flow on a railway whose contract differs.

### 2.2 Tanzania Railways Corporation (TRC) and SGR

**Verified public evidence:** TRC operates an official SGR online ticketing portal at [sgrticket.trc.co.tz](https://sgrticket.trc.co.tz/). TRC's official website has historical documentation describing an electronic ticketing system developed by TRC with the e-Government Authority (eGA); this establishes an existing official ticketing ecosystem, not a public third-party API.

**Not established by public evidence reviewed:** a publicly documented, generally available partner API; eligibility of an independent OTA to create or change SGR reservations; API specification; certification; production credentials; commission; payment collection; ticket issuance authority; refund/exchange interface; distribution rights; or a commercial agreement between TRC and OuterBlocks Limited.

**Required validation before transactional enablement:**

1. Write to TRC commercial/ticketing and relevant digital/eGA contacts requesting its official third-party sales/distribution/agency pathway.
2. Ask specifically whether production APIs or approved channel integrations exist for online travel agencies, and request official API/agency documents rather than reverse-engineering the public website.
3. Establish whether Travelar can sell under its own brand; who is merchant/agent; which party takes payment; who issues the authoritative ticket and tax receipt; and which party controls changes, cancellation/refunds, manifests and support.
4. Obtain station/route/service data, booking-window limits, class and fare rules, passenger/ID requirements, ticket format/QR semantics, cut-off times, disruption policy and any API rate/availability limits.
5. Confirm test/sandbox access, certification, security assessment, transaction reconciliation and production activation criteria.

**Current implementation status:** TRC public booking portal verified; Travelar's third-party transactional access unknown. The mode is first-class in the product; live SGR booking remains blocked until the authorized route is documented.

### 2.3 Kenya Railways — Madaraka Express

Kenya Railways' official FAQ lists three passenger booking channels: the official online platform, station counters and a Safaricom USSD service. It documents a 60-day advance booking window, an online/USSD limit of 10 people per transaction, identification expectations, and operator-specific children, cancellation and rescheduling rules. These are useful current operational inputs, but rules must be revalidated at the time of integration and not assumed to apply to Tanzania or every other Kenyan railway service. Source: [Kenya Railways Madaraka Express FAQ](https://krc.co.ke/madaraka-express-faq/).

The official public booking channel does not itself establish a third-party partner API or distribution licence. Travelar must ask Kenya Railways for its authorized OTA/agency/vendor path, current technical documentation, commercial terms and production access. Where no permitted API/agency route is offered, only a contractually permitted official handoff/referral should be presented; scraping must not be represented as integrated booking.

The station model and station data must be country/service-specific. Do not hard-code only Nairobi–Mombasa or assume every service shares the Madaraka Express purchase rules. Store ticket source, source reference, price timestamp, fare rules, passenger details required, and operator-confirmed ticket status.

### 2.4 Rail adapter capability contract

Each rail supplier adapter should declare capabilities such as:

- `searchSchedules`, `searchFares`, `availabilityRecheck`
- `reservationHold`, `createReservation`, `collectPayment`, `issueTicket`
- `retrieveBooking`, `retrieveTicket`, `cancel`, `refundQuote`, `refund`, `reschedule`, `exchange`
- `passengerFieldSchema`, `ticketFormat`, `qrValidationSemantics`
- `supportsReturn`, `supportsMultiSegment`, `supportsChildFare`, `supportsSeatSelection`
- `supportedMarkets`, `supportedCurrencies`, `supportedStations`, `salesCutoffRules`

Capabilities must be sourced from official docs/contracts and tested. Unsupported operations must return a typed capability error, not a fake success or a mocked production replacement. Provider-specific ticket status must be normalized without discarding the provider's raw state and reference.

## 3. Experiences mode — product requirements and supply strategy

### 3.1 First-class consumer workflow

Experiences is an independent mode for tours, attractions, excursions, guided activities, entry tickets, day trips and other approved bookable activities. The UI and data model must not assume every product behaves like a transport departure or hotel night.

Search/filters may include:

- Destination, map/location, category or free-text activity query.
- Date or date range; selected time slot/start time when applicable.
- Participant quantity and supplier-supported age bands; some activities also need age/date-of-birth inputs.
- Language, duration, private/shared option, pickup/transfer option, meetup point, accessibility and other supplier-defined options.
- Locale, market and currency according to contract.

Results and detail pages should show supplier/operator, activity name, product/option variant, meeting/pickup details, local time zone and duration, included/excluded items, participant eligibility, accessibility information when provided, current price and currency, availability, booking confirmation type (instant/manual/pending), cancellation/reschedule terms, voucher/check-in requirements and supplier contact process where permitted.

Expected flow:

`Discover/search → activity detail → select option/date/time/participants → recheck live availability and final price → collect supplier-defined booking questions → create booking under the contract model → payment/supplier settlement → confirmed or pending supplier state → voucher/ticket → post-booking retrieve/cancel/change/support`

Not all activity partners permit Travelar to take payment or confirm an instant booking. The UX must distinguish a confirmed reservation from a request pending supplier approval. Vouchers are only issued/labelled as confirmed when the authoritative supplier state supports it.

### 3.2 Viator

The official [Viator Partner API v2 documentation](https://docs.viator.com/partner-api/technical/) describes product content, pricing, real-time availability, booking questions, optional booking/price holds, booking confirmation, booking status, cancellation and voucher workflows. It distinguishes affiliate and merchant partner classes and limits endpoint access by the partner's authorization level.

- Basic-access affiliate: limited non-transactional content functions.
- Full-access affiliate: content endpoints, but not booking/hold/cancellation transactions.
- Full-access + Booking affiliate: transactional API endpoints in addition to content, subject to the applicable agreement.
- Merchant partner: full API access, with merchant-of-record and customer-service/financial responsibilities described in the documentation.

These distinctions make Viator a documented candidate for Travelar's Experiences adapter, but not a confirmed supplier. OuterBlocks must qualify, obtain API credentials and contract rights, verify whether the agreement permits its desired checkout and funds flow, and establish the currency, invoice/settlement, refunds, customer-support and cancellation terms. An affiliate/content-only agreement is not embedded transactional checkout.

### 3.3 GetYourGuide

GetYourGuide's [API integration requirements](https://partner.getyourguide.support/hc/en-us/articles/13981133907613-API-integration-and-requirements) updated on 4 September 2026 define access levels and eligibility criteria:

- Basic access can show teaser product content, images, ratings and base prices; the published threshold is at least 100,000 monthly website visits or 50,000 app downloads.
- Reading API access adds fuller product information, options and availability; the published criteria include one million monthly visits and, for partners already at Basic, 300 monthly bookings.
- Masterbill is partnership-manager approved, requires a specialized contract/deposit, supports bookings where the partner acts as merchant of record, and is not presented as automatic access for every applicant.

Therefore GYG is an in-scope candidate but full transactional API access cannot be assumed at Travelar's current stage. GYG deep links/widgets are alternative permitted distribution products if offered under its terms; they are not equivalent to a native Travelar transaction. Record the exact partner tier and terms in the provider registry.

### 3.4 Expedia Group Rapid Activities

Expedia's official [Rapid Activities API overview](https://developers.expediagroup.com/rapid/activities) describes region discovery, multilingual activity content, date/time availability and price searches, a pre-booking price check, booking creation, booking retrieval/cancellation and voucher retrieval. However, the page currently describes the API as an early-access preview for selected partners and says general availability is expected in 2027.

This is a candidate to qualify with Expedia, not a dependency for the first experiences release. Ask for current partner availability, eligibility, commercial terms, supported Tanzania/East Africa inventory, payment token model, payment settlement, booking/cancellation and support obligations. Do not put it into the production route until a partner account and supported entitlement are obtained.

### 3.5 Airbnb Experiences

Airbnb's public help article says its Experiences booking tool is being discontinued and will no longer appear embedded on third-party sites. Source: [Airbnb help article](https://www.airbnb.com/help/article/2589). The public material reviewed here does not establish a generally available third-party transactional Experiences API for Travelar.

Do not treat the former embed as a valid integration path and do not promise native Airbnb Experiences checkout. This does not rule out the possibility of a private commercial partnership; that would require direct confirmation. Local experience providers should be directly onboarded into Travelar's own supply model instead of relying on Airbnb as the core source.

### 3.6 Direct onboarding of local African suppliers

Local DMCs, tour operators, guides, attractions, parks, museums, water-sport operators and other experience providers are a core supply strategy, not a later add-on. This model can supply Tanzanian and East African inventory where global platforms have limited coverage, but requires a proper verification process.

For every directly onboarded supplier, Travelar should record and verify as applicable:

- Legal business/individual identity, licences/permits needed for the activity and market, insurance/liability evidence and bank/payment details.
- Service area, activity content, photos and intellectual-property rights, options, language, duration, capacity, date/time slots, pickup/meeting points, blackout/cut-off rules and participant restrictions.
- Pricing/tax basis, currency, Travelar commission/markup, who charges the customer, supplier payable, payout timing and currency/FX risk.
- Instant versus manual confirmation, voucher/QR/check-in procedure, contact/escalation details and outage/disruption response.
- Child-safety, accessibility, safety briefing, weather/cancellation, insurance, incident/complaints process and emergency procedures as appropriate to the activity.
- Customer-data sharing, consent/information notices where required, retention, subcontractors and cross-border transfers.

The Experience Supplier Management workflow should be included in HIMS/OIMS-like internal operations. A local supplier may use a lightweight hosted inventory/schedule interface, API, upload template or manual staff workflow during onboarding, but all inventory, prices, confirmation and capacity mutations must be auditable. Manual confirmation products must not be sold as instantly confirmed.

## 4. Shared booking, payment and confirmation rules

Experiences and Train use the same global integrity principles but may expose supplier-specific lifecycle capabilities.

- Search data may be cached when permitted; availability, price, fare/product option and cancellation policy must be revalidated within supplier rules before booking.
- Store a Travelar booking/order ID and the external supplier reference separately.
- Store a durable external-request record with idempotency key or equivalent, provider, operation, request correlation ID, result, retry status and last known supplier state. Do not blindly retry non-idempotent booking calls after timeouts; query supplier status first where supported.
- Keep the payment state separate from the supplier booking/ticket/voucher state. A payment being captured does not prove a train ticket or experience reservation is confirmed.
- On money collected but supplier confirmation failure, enter an exception/reconciliation workflow and apply the contractually approved recovery/refund policy. Never create a false ticket/voucher just to close the UI flow.
- Reuse the provider-neutral PSP and communications adapters; send confirmation and ticket/voucher only when authoritative states permit. Delivery acceptance from an email/SMS provider is not proof that the customer received the message.
- Preserve source-specific cancellation deadlines, penalty calculations, tax/fee lines, supplier questions and evidence. Do not generalize one provider's rules across the mode.
- Redact sensitive data from logs and minimize passenger/participant information sent to each supplier.

## 5. Acceptance criteria for Stage 14 scope

### Product/UX

1. The primary mode navigation and sitemap explicitly include Bus, Ferry, Flights, Stays, Train and Experiences.
2. Train and Experiences each have separate search forms, result/detail views, selection steps, booking-information steps, checkout/confirmation states and post-booking support entry points appropriate to their supply model.
3. HIMS configuration can set market-specific transaction status without redefining the global product scope. An unavailable market shows an honest explanation or contractually permitted handoff; it never displays fabricated live inventory.
4. Time zones, currencies, age bands, passenger/participant questions, refund rules and supplier-required fields are source-configured by provider/country/service rather than one global hard-coded form.

### Train

5. A test adapter can represent station pairs, scheduled services, stop sequences/segments where provided, class/fare, local time, sale cut-offs and operator terms.
6. Unauthorized TRC/Kenya Railways transactions cannot be created; when no authorized endpoint/agency workflow exists, the UI follows the configured legal fallback and does not scrape or misstate the source.
7. Ticket confirmation/issuance and changes use provider-authoritative response or documented official flow; failures enter a repair/support queue.

### Experiences

8. A test adapter supports option-specific availability, date/time slot, participant counts/age bands, booking questions, price revalidation, confirmation type and voucher/cancellation terms.
9. Partner access level is represented in provider configuration (content-only, redirect/affiliate, transaction-enabled); attempts to invoke unauthorized transactional capabilities fail closed.
10. Manual supplier confirmation remains pending and is clearly shown as such; only supplier-confirmed bookings produce confirmed voucher/itinerary states.
11. Direct local suppliers cannot go live until onboarding/compliance, capacity, prices, contract, refund, safety and payout workflow are approved and auditable.

### Operations and finance

12. HIMS reports inventory and supplier integration health, pending confirmations, failed order creation, orphaned payments, refunds, cancellations, expiry and supplier disputes for both modes.
13. External booking and cancellation commands are idempotent or protected by provider-specific recovery before retry. Concurrent capacity tests prove no overbooking where the supplier provides capacity/holds.
14. Financial reconciliation links customer PSP transaction, Travelar ledger journal, supplier booking/order reference and supplier payable/revenue calculation.

## 6. Open questions and evidence requests

### TRC

- Who authorizes third-party sales; is an OTA API/agency model available?
- Which SGR and other rail services are eligible; who issues authoritative tickets?
- What are production access, certification, pricing, ticket validation, changes/refunds, manifests, support and SLA requirements?

### Kenya Railways

- Does Kenya Railways have an authorized reseller/OTA or API program for Madaraka Express and/or other services?
- Are sandbox credentials, station/service/fare feeds, ticketing rights, agent contracts and commercial fees available?
- Which current rules govern advance booking, passenger identification, age fares, cut-offs, cancellations and refunds for the exact service being integrated?

### Experiences providers

- What Viator partner class will OuterBlocks qualify for, and what are the commission, billing, merchant-of-record and customer-support terms?
- Does GetYourGuide approve the desired partner tier now, and are its traffic/booking thresholds satisfied? Are deep links/widgets permitted as an alternative in a market?
- What is Expedia Rapid Activities' actual access state as of onboarding, and which countries/inventory/settlement path are covered?
- Does Airbnb offer any private API/partnership for Experiences beyond the discontinued public booking tool? No assumption until answered directly.
- Which Tanzanian and regional experience suppliers can be directly onboarded under contracts and permissions that meet local legal, tax, safety and refund obligations?

## 7. Primary sources and limits

1. TRC official SGR ticketing portal: https://sgrticket.trc.co.tz/ — confirms a public official booking surface, not partner API rights.
2. TRC official e-ticket system speech/report hosted on trc.co.tz: https://www.trc.co.tz/uploads/publications/sw1586000927-HOT%20DG%20KWA%20UZINDUZI%20WA%20mfumo%20wa%20tiketi%20wa%20kielectroniki_updated.pdf — historical description of TRC/eGA e-ticketing, not proof of current SGR API terms.
3. Kenya Railways Madaraka Express FAQ: https://krc.co.ke/madaraka-express-faq/ — official booking channels and passenger rules, not third-party API permission.
4. Viator Partner API v2 technical docs: https://docs.viator.com/partner-api/technical/ — documents API capabilities and partner-tier differences.
5. GetYourGuide API requirements updated 4 September 2026: https://partner.getyourguide.support/hc/en-us/articles/13981133907613-API-integration-and-requirements — documents tier feature/eligibility thresholds.
6. Expedia Rapid Activities API: https://developers.expediagroup.com/rapid/activities — early-access state and published 2027 general-availability expectation require direct revalidation.
7. Airbnb Experiences booking tool help: https://www.airbnb.com/help/article/2589 — says public embed booking tool is being discontinued; does not rule out an undisclosed private partnership.

**Evidence standard:** these sources verify public documentation and published constraints only. No API credentials, signed partner agreement, production access, market coverage, commission or ticketing permission is assumed to exist for OuterBlocks Limited.
