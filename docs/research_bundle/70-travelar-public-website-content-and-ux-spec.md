# 70 — Travelar Public Website: Content, Information Architecture and UX Specification

**Version:** Draft 0.1, research-backed, 28 October 2026  
**Brand:** Travelar — operated by the intended operating entity OuterBlocks Destinations Limited (subject to corporate document verification)  
**Principle:** Customer-facing experience is Travelar-branded, service-provider truthful and supplier-agnostic.

## 1. Product experience goals

Travelar is an Africa-first, globally connected marketplace and travel operating platform spanning six first-class travel modes: **Bus, Ferry, Flights, Stays, Train and Experiences**. Public integration pages and cards should present the customer's travel choices, not expose “Sabre”, “Travelport”, GDS identifiers, PSP identifiers, API names or technical integration terminology as marketing content. The actual airline, ferry operator, bus operator, property/host or experience provider must remain visible when material to the purchase or required by contract/law.

The homepage is utility-led. Do not fill it with generic “Why choose us?”, “How it works” or unsupported testimonial blocks to make the page appear complete. The homepage should help a user search, discover destinations, find relevant deals and answer practical trip questions.

## 2. Recommended information architecture

### Public / customer

- `/` — homepage: universal mode selector + contextual search, hot deals/offers, destination discovery, practical travel guides, timely service advisories.
- `/bus`, `/ferry`, `/flights`, `/stays`, `/train`, `/experiences` — each mode landing/search start, driven by available market and supplier capability configuration.
- `/search/{mode}` — results, filters, sorting, source coverage/availability cues.
- `/offer/{mode}/{publicId}` — details, price/terms snapshot and supported follow-on actions.
- `/checkout/{mode}/{bookingId}` — traveler/guest details, policy review, payment selection and pending state.
- `/booking/{travelarBookingRef}` — confirmation, tickets/vouchers and manage-booking entry; strict ownership/authentication rules for private data.
- `/manage-booking` — lookup/sign-in/verification; don't leak whether an arbitrary booking exists.
- `/deals` and `/deals/{slug}` — offers with effective dates, restrictions, terms and source evidence.
- `/destinations`, `/destinations/{slug}` — curated discovery and useful destination detail.
- `/guides`, `/guides/{slug}` — practical travel information with official sources and review dates.
- `/help`, `/help/contact`, `/help/refunds-cancellations`, `/help/payment-status`, `/help/booking-status`, `/help/travel-disruptions` — clear support paths.
- `/about`, `/terms`, `/privacy`, `/cookies`, `/accessibility`, `/payment-terms`, `/refund-policy`, `/supplier-disclosures` — only publish legally reviewed and jurisdiction-appropriate text.

### Authenticated customer area

- `/account/profile`, `/account/travelers` (only if the data retention/security design justifies saved travelers), `/account/bookings`, `/account/payments`, `/account/notifications`, `/account/privacy`.
- Sensitive details and booking documents must be protected by server-side authorization; no reliance on hidden controls or client router state.

### Partner/operator/agent portals

Use separate authenticated application surfaces and authorization boundaries for HIMS, OIMS, agent channels and white-label storefront administration. A public page must not expose a privileged internal route or API simply because it shares components.

## 3. Homepage layout

1. **Header:** Travelar logo, mode nav, destinations, deals, guides, manage booking, locale/currency, sign in. Mobile navigation must expose the same core capabilities.
2. **Primary search:** mode switcher; fields change by selected mode; submit validates on client for speed and on backend authoritatively. Preserve entered search safely if user switches mode. Do not make mode-specific fields a hardcoded UI-only list; source permitted modes and field config from versioned platform configuration.
3. **Hot Deals & Offers:** effective-dated cards. Only show an offer where price, inventory/content source, eligibility, end date and terms have current evidence; don't invent discount percentage or fake urgency.
4. **Explore Destinations:** curate from governed destination content, not hardcoded arrays. Use image rights metadata, canonical slug, applicable season and practical travel links. Avoid claims of popularity without analytics or credible source.
5. **Travel Guides & Tips:** visa/entry, arrival, local transport, money, connectivity, safety, accessibility, airport/port/station transfer, local customs and family/accessible travel as applicable. Clearly identify traveller nationality/visa assumptions where relevant.
6. **Service alerts / operational notices:** show only approved, market-specific notices with published/expiry date and source. Support temporary hide/dismiss where appropriate without hiding critical safety information.
7. **Footer:** contact/support, legal terms, privacy/cookies, business/entity details as verified, payment and supplier disclosures, language/region controls.

## 4. Mode-specific search inputs (minimum baseline)

| Mode | Search criteria | Result/detail UX considerations |
|---|---|---|
| Bus | Origin, destination, travel date, passenger count, optional boarding/drop-off location, one-way/return only if supported. | Operator, departure/arrival, duration if reliable, boarding/drop-off options, seat availability/selection, fare terms, baggage, passenger/segment fare, cancellation/change policy. Inventory must be segment-based; don't treat a through-vehicle seat as unavailable on all segments. |
| Ferry | Origin, destination, sailing date, passenger mix, vehicle/cargo field only if offered. | Vessel/class, crossing time, capacity/availability, passenger categories, vehicle/cargo capacity, departure point, safety notices and cancellation conditions. Capacity/class model by default, not conventional numbered seat maps unless operator supports it. |
| Flights | Origin/destination city/airport, dates, passenger counts/ages, cabin, one-way/round-trip/multi-city only when enabled, point of sale/currency. | Carrier, stops, times/time zones, connection details, fare family, baggage, ancillary data, price freshness, ticketing status. Do not conflate provider shopping results with tickets. |
| Stays | Destination/property, check-in/out, room count, guests/ages where required, currency/market. | Property content and source rights, room/rate/occupancy, total including applicable taxes/fees, pay-now/pay-at-property distinction, cancellation deadline, check-in constraints and amenities provenance. |
| Train | From/to station, date/time, passenger categories, class, route preferences where supported. | Station names/codes, transfers, departure/arrival, fare class, operator, ticket/QR rules, passenger eligibility; don't imply integration merely because a provider can create a passive rail-like segment. |
| Experiences | Destination/location, date/time, participant mix/ages, language/accessibility filters when supported. | Provider, duration, meeting location, inclusions/exclusions, weather/age rules, voucher/confirmation, cancellation and reschedule conditions. |

The mode list is a first-class product requirement. Production supplier coverage may be staged, but the product domain model and requirements pack must retain all six modes; a mode should display supported market, availability and launch status rather than vanish or fake a working search.

## 5. Result and detail card behavior

- Display verified price totals, currency, key time/place details, cancellation/change summary and supplier/provider identity where needed.
- Show “price subject to confirmation” only if the actual supplier flow requires it and explain revalidation before checkout; do not use ambiguous fake scarcity.
- Use clear loading, empty, partial results, source unavailable, price changed, hold expired and retry states.
- Sorting and filters must correspond to normalized data actually available, with missing data handled without silently treating unknown as best/worst.
- Provider icons/logos may be used only where licensing and brand guidelines permit; Travelar layout, spacing, color system, labels, buttons and confirmation tone remain Travelar's.
- Do not render raw provider message text, internal code, API endpoint, provider-specific error or stack trace to customers.

## 6. Checkout, confirmations and confirmation dialogues

### Pre-confirmation dialog patterns

- **Price or terms changed:** show changed amount/terms; require explicit accept or return to results.
- **Cancel booking:** state affected supplier items, possible fees/refund, irreversibility if relevant, and whether supplier revalidation/approval is complete.
- **Refund quote expires:** state valid-through time returned by source; require reconfirming if expired.
- **Bulk operator action:** preview affected bookings/trips and count; never apply a bulk cancellation or price change without a permissioned, audited confirmation.
- **Deactivate provider/method/market:** display scope, active bookings affected, fallback state and rollback plan; require approved operator/HIMS permission.
- **Payout create:** show beneficiary, verified name, amount, fee, currency, settlement warning and approval authority; require second-person approval when policy says so.
- **Manual payment allocation:** show source transaction, candidate booking, amount discrepancy and evidence; reason mandatory and maker-checker when defined.

Do not show a confirmation dialog to paper over missing authorization; reject on backend when the actor lacks permission.

### Customer payment/booking notices

- “Payment pending” means provider outcome is unresolved.
- “Payment received” is allowed only after verified server-side payment state.
- “Booking confirmed” requires supplier reservation or service-provider confirmation per product.
- “Ticket issued” requires ticket/fulfillment evidence.
- “Refund submitted” is different from “refund completed.”
- Never tell the user to pay again while an existing attempt is unresolved unless the system has verified it failed/closed and the user explicitly starts a new attempt.

## 7. Terms and policies that need drafting and legal review

The exact wording must be written for Travelar's actual merchant/agency and service models, reviewed by Tanzanian counsel and relevant counsel in launch jurisdictions, and aligned to actual provider/supplier contracts. This list is a drafting checklist, not pre-approved legal copy.

- Contracting entity and role by transaction: marketplace, agent/facilitator, system provider, merchant/collecting party or intermediary as applicable.
- Booking and contract formation: search results and quotes are not guarantees; when a reservation is created; when ticket/voucher is issued; what happens if supplier rejects.
- Pricing: currency, fare/rate included items, fees/taxes, baggage/ancillaries, FX, customer-paid payment fees only if lawful and clearly disclosed, discounts and promotional terms.
- Payment: accepted methods, pending/rejected/late payment, duplicate/short/overpayment, operator-direct vs platform-collected payment, fiscal receipt and customer receipt distinction.
- Cancellation/refund/change: supplier rules, applicable cutoffs/time zones, cancellation fees, refund route/timing estimates with evidence, no-show rules and third-party fees.
- Disruption/force majeure: timetable changes, cancellations, rebooking, refunds, notice channels and support.
- Passenger/property/provider obligations and accurate service-provider identification.
- Account terms, fraud, abuse, chargebacks, unauthorised booking handling and age/consent rules.
- Privacy: controller/processor roles, purposes, retention, payment/identity data, cross-border transfers, access/erasure rights and contacts.
- Accessibility, language, cookies/analytics and marketing consent.
- Travel guides disclaimer and date of review; official authority sources override old editorial material.
- Complaints and ADR/jurisdiction/local consumer rights.

Never use generic AI-generated policy copy as a substitute for counsel review. Terms need version IDs, locale, effective date, published date, approval identity, change history and a reference stored with each booking to the terms accepted at the time.

## 8. Destination/guide content governance

Each structured guide must include at minimum: canonical destination and country, language/locale, applicable traveller profile/nationality assumption if relevant, content owner, editor/reviewer, created/updated/reviewed dates, next review deadline, official source URL/title, source date where available, fact claim summary, confidence, market applicability, urgency/expiry, translation-review state, status (`draft`, `in review`, `approved`, `published`, `needs revalidation`, `withdrawn`) and audit history.

For visa/entry/health/safety/fiscal/regulatory guidance, cite official government, embassy, transport operator, airport/port or regulator sources, and show a visible “last reviewed” date. Use a scheduled revalidation work queue; a stale guide must be flagged or hidden according to risk class, not silently remain current.

## 9. Analytics and privacy

- Instrument consent-aware funnel events: search submitted, results shown, offer selected, price revalidated, checkout begun, payment attempt created, reservation confirmed, ticket issued, after-sales case opened. Include Travelar IDs and source/campaign where lawful, but no passport numbers, full card data, payment tokens, unnecessary phone/email or passenger names.
- Use role-limited admin analytics; aggregate customer behavior and minimize raw personal data.
- Distinguish provider search failure from zero inventory, and preserve coverage telemetry for operations without presenting provider implementation details to users.

## 10. UI acceptance criteria

- All six modes have coherent routes, schema-driven forms, empty/error states and planned capability messaging.
- Search, detail, checkout, payment and confirmation journeys are keyboard accessible and responsive.
- Every public action has server-authorized behavior and clear success/failure/pending result.
- Terms/policies are versioned and approval-gated; customer consent evidence is retained per booking.
- Travel guides/destination content is governed by official sources and next-review dates.
- No provider-specific API/GDS branding leaks into Travelar public navigation or marketing copy.
- Supplier/provider names are truthful where the actual service provider matters.
- No offer, review, price/discount, “popular” ranking, real-time availability or ticket is fabricated.
