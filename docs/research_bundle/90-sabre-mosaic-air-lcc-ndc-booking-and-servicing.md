# 90 — Sabre Air, LCC and NDC: Current Workflow, Schema and Entitlement Requirements

**Research cut-off:** 28 October 2026  
**Status:** Official-documentation review. Endpoint generations must be selected per contracted product and tested against the assigned Sabre EPR/PCC and environment.

## 1. Important distinction: modern Mosaic workflow vs legacy guide URLs

The owner-supplied Sabre links include older guide pages (`/guide/...`) plus product API references. The current Sabre “New to Sabre” documentation describes one modern Mosaic air workflow for ATPCO, NDC and Low-Cost Carrier content:

1. Flight Shop — shop offers.
2. Flight Check — revalidate/price the selected offer and turn the cached offer into a bookable offer.
3. Booking Management `POST /createBooking` — create the PNR/order/reservation from validated offer and passenger data.
4. Booking Management `POST /fulfillFlightTickets` — issue tickets/fulfil the booking.
5. Optional Flight Reshop — search applicable exchange offers, then feed the chosen offer back through validation and booking to complete the change.

Flight Shop can return content from ATPCO, NDC and LCC sources in a combined request, but sources and carrier content must be enabled for the account. The existence of these pages does not grant Travelar access to all content.

Do not silently combine legacy SOAP/REST or older Sabre workflows with Mosaic schemas. For each chosen operation, record product name, API style, version, auth type, environment URL, EPR/PCC/market entitlements, required fields, request/response fixture hashes and sunset/deprecation status.

## 2. Shared canonical air domain

The Travelar-owned model should separate:

- `AirSearchRequest`: origin/destination, date(s), passenger composition, cabin/fare preferences, market/POS/currency where applicable, and journey type.
- `AirOffer`: Travelar offer ID; source/provider/product/version; offer ID and item IDs where supplied; segments and operating/marketing carriers; fare brand/cabin/booking class; itinerary and connections; included and paid baggage; taxes/fees/currency; change/refund rules; expiry/guarantee window where supplied; source timestamp.
- `AirQuote`: provider validation/reprice result, price breakdown, material-change diff, deadline/guarantee, and explicit acceptance record if changed.
- `AirReservation`: Travelar booking ID; Sabre PNR/Order ID; Sabre confirmation ID; airline confirmation IDs; passenger and segment associations; booking/fulfillment state; payment/funding references; issue deadline; ticket document numbers; EMD references; provider trace IDs.
- `AirServiceRequest`: ancillary, seat, SSR/OSI, document or passenger change with per-passenger/per-segment association and permitted stage.
- `AirChangeCase`: original itinerary/ticket, eligibility, reshop offers, reprice, add-collect/refund amount, acceptance, exchanged/reissued document, final reconciliation.

These are Travelar canonical concepts, not Sabre JSON schemas. Exact source-to-canonical maps must be generated from the current selected API references and approved sample payloads.

## 3. ATPCO air booking

Required logical behavior:

- Authenticate with an active Sabre token.
- Search by origin, destination, date(s), passenger count/composition and permitted content sources.
- Display normalized offers and preserve provider offer references needed for validation.
- Revalidate before committing the customer's purchase. Revalidation must handle changed fare, availability, restrictions, schedule and expiry.
- Present material price/itinerary changes for user acceptance rather than silently using a stale search price.
- Create booking from validated offer and all required passenger, contact, service-request and agency data.
- Store Sabre confirmation ID and airline confirmation IDs from the response.
- Fulfil by issuing the ticket within the airline's documented ticketing time limit; record actual ticket document numbers and status.
- Reconcile reservation, ticket records, payment/funding and Travelar ledger before marking the product fully fulfilled.

Do not mark an itinerary “ticketed” because a PNR was created or because collection succeeded. PNR creation, payment authorization/collection, ticket issuance, supplier settlement and customer confirmation are independent facts.

## 4. LCC content

The current guide identifies extra conditions that may be required for LCC content:

- The account must be provisioned for LCC sources and eligible airlines.
- LCC creation may require credit/debit card form-of-payment and billing address, passenger email and travel documents.
- Some carriers may require date of birth, gender or both; the guide mentions `3DOCS` as relevant to avoiding fulfillment errors.
- LCC is described as Instant Purchase, and the guide says to fulfil immediately after segments are sold.

Build this as carrier/content capabilities, not hardcoded universal rules. Collect only required passenger information, validate purpose/legal basis, protect sensitive data, and keep it out of logs. Confirm supplier FOP and funding constraints with Sabre before any real ticketing. A ClickPesa customer collection is not automatically the same thing as the GDS form of payment required by an airline or agency ticketing account.

## 5. NDC

The modern Mosaic guide describes NDC via Flight Shop, Flight Check (including use of offer-item references for price validation), Create Booking and ticket fulfillment. Sabre's NDC docs also describe offer/order management for airline-specific capabilities; some nuances vary by airline implementation and NDC technology partner.

Persist `offerId`, `offerItemId`, passenger/segment associations, order identifiers, airline confirmation identifiers and versioned raw provider payloads in a restricted/auditable store where contract allows. Offer/Order identifiers are not interchangeable with the Travelar booking ID.

NDC post-booking functions may differ from ATPCO and LCC. The provider adapter must declare each operation as supported/unsupported/conditional, including seat changes, ancillary purchases, fulfillment, reshop, exchange, cancellation and refund. Do not imply universal support because a generic API page exists.

## 6. Post-booking changes

Model separate cases for:

- change before ticket fulfillment (order modification/reprice where supported);
- change after fulfillment (ticket exchange/reshop and exchange document process);
- cancellation before ticketing;
- void within the provider/carrier's allowed window;
- refund of a fulfilled ticket;
- involuntary schedule change;
- name correction versus prohibited name change;
- unused ticket/document reconciliation.

Before modifying a booking, retrieve the current provider state and check eligibility. Present the fare difference, penalties, taxes and fee breakdown, collect any required customer authorization, then execute the provider workflow. Preserve original and replacement document numbers, payment/refund events, provider references and audit evidence. A provider API response that says “accepted” or “processed” must be mapped to the precise documented finality state.

The modern Mosaic `Flight Reshop` flow is not a universal substitute for every legacy exchange/void/refund endpoint. Use the path the account is contracted and certified for.

## 7. Current-version and deprecation gate

The Sabre Developer Hub displayed recent updates as of 28 October 2026, including Booking Management API updated 23 October, and current Hotel Search API Beta / Hotels Rates API Beta entries updated 22 October. It also marks Bargain Finder Max Premium SOAP as deprecated (listing updated 15 October). Therefore:

- Treat older supplied guide links as workflow references, not definitive production version declarations.
- Verify the chosen API's current version, beta/deprecated/sunset status, production environment and replacement guidance before coding.
- Prefer current Mosaic product contracts when Sabre has enabled them for Travelar, but do not migrate away from an already contracted/required stack without an approved ADR and certification plan.
- Keep legacy and Mosaic implementations separate if both are genuinely required; never share request builders based on superficial field similarity.

## 8. Acceptance tests

At minimum: ATPCO search/revalidate/book/fulfill; expired or changed offer; changed total requires explicit consent; PNR created but ticket issuance fails; issue deadline expires; LCC credential/content source disabled; LCC missing mandatory passenger document; NDC price revalidation; missing/stale offerItemID; supplier returns an airline-specific restriction; duplicate/ambiguous create booking; token expiry; trace propagation; duplicate ticketing request; exchange before vs after fulfillment; cancellation vs void vs refund distinctions; partial/multiple-ticket outcomes; and provider-version migration/contract failure.

## 9. Primary sources

- [Current Sabre Mosaic air booking guide](https://developer.sabre.com/product-collection/new-to-sabre/v1/help-documentation/guides.html)
- [Sabre NDC collection](https://developer.sabre.com/product-collection/new-distribution-capability-ndc/v1/index.html)
- [PNR Collection](https://developer.sabre.com/product-collection/passenger-name-record-pnr-collection/v1/index.html)
- [Sabre Developer Hub](https://developer.sabre.com/)
- Owner-supplied legacy workflow URLs listed in Doc 93.
