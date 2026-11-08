# 14 — Travelar Public Website Sitemap and Landing-Page Brief

> **Stage 14 product-scope clarification (24 October 2026):** Train and Experiences are first-class Travelar modes, not future modes. Their requirements belong in the current product, architecture, integration and test baseline. Per-country activation may remain gated until authorized suppliers, contracts, ticket/voucher flows and support/refund handling are verified. See `40-train-and-experiences-first-class-mode-research.md`.

**Product:** Travelar · **Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Date:** 23 October 2026 · **Status:** Product brief for validation; not a finalized visual design or development authorization.

## 1. Purpose and principles

The public website should make it easy to discover, compare and manage legitimate travel products, while being honest about which modes and markets are actually bookable. The visual reference instruction is to learn from Greyhound's clarity and conversion-focused organization—not copy its branding, distinctive layout, wording, assets or implementation.

Design principles:

- Lead with the travel task, not a generic hero illustration.
- Keep the six travel modes together in one primary mode selector: Bus, Ferry, Flights, Train, Stays, Experiences. Selecting a mode changes the active search form; do not duplicate the mode selector inside the form.
- Use high-contrast, readable form labels, accessible keyboard navigation, mobile-first layouts and clear validation.
- Show full payable total, currency, any included/excluded taxes or fees as relevant, cancellation/changes, provider/source limitations and the next step before payment.
- Do not display unsupported modes as available products. A mode can show “coming soon” or an informative partnership page without pretending inventory can be booked.
- Use real, licensed, supplier-approved destination imagery and human editorial selection. Avoid generic gradients, icon clutter, and “AI template” visual clichés.
- Account functions and Help/Manage Booking remain discoverable but do not compete with the six mode selector.
- Language, currency, country, timezone and market context are explicit; geolocation alone must not be the only market selector.

## 2. Proposed information architecture

### Primary travel navigation

- `/` — Home / marketplace search.
- `/bus` — Bus search landing page.
- `/ferry` — Ferry search landing page.
- `/flights` — Flight search landing page.
- `/trains` — Train search landing page.
- `/stays` — Accommodation search landing page.
- `/experiences` — Activities and experiences landing page.

The same search component may render on the home page and mode landing pages but must load the correct mode schema. Whether the URLs should contain country prefixes such as `/tanzania` and `/kenya` is a product/localization decision; **a route path does not establish data residency or jurisdictional compliance**.

### Booking and account

- `/search/{mode}` — Results state; a server-side search request creates a search context.
- `/trip/{public-opaque-id}` or mode-specific detail route — Offer/trip detail.
- `/checkout/{opaque-id}` — Passenger/guest, contact and payment selection.
- `/booking/confirmation/{opaque-id}` — Final state, ticket/voucher or pending actions.
- `/manage-booking` — Verified booking lookup and eligible booking management.
- `/account/sign-in`, `/account/register`, `/account/recover`, `/account/reset`.
- `/account/bookings`, `/account/profile`, `/account/passengers`, `/account/notifications`, `/account/privacy`.
- `/ticket/{opaque-id}` — Authenticated/short-lived token ticket access; never use a guessable URL as the only access control.

### Support and information

- `/help` — Help Center with journey/mode categories.
- `/help/booking`, `/help/payment`, `/help/tickets`, `/help/refunds`, `/help/changes`, `/help/disruptions`, `/help/identity-and-passengers`, `/help/accessibility`.
- `/contact` — Verified contact channels, support hours and complaint route.
- `/about` — Travelar and OuterBlocks Limited identity, contact/legal entity details after company records are confirmed.
- `/operator-partners` — Bus/ferry operator partnership and onboarding.
- `/travel-agents` — Travelar-agent programme, conditions and application.
- `/corporate-travel` — Candidate page only if a real service/business model exists.
- `/careers` — Only when there are actual openings or an active application process.

### Legal and trust

- `/terms`, `/privacy`, `/cookies`, `/accessibility`, `/refund-and-cancellation-policy`, `/supplier-disclosures`, `/payment-terms`, `/data-rights`.
- Country-specific policy pages or policy sections only after each market's legal review. Version and effective dates must be visible.
- A cookie-preference interface where applicable; do not use a deceptive acceptance-only banner.

### Operational/deep links (not in public primary nav)

- `oims.travelarway.com` — proposed OIMS host.
- `hims.travelarway.com` — proposed HIMS host.
- `agents.travelarway.com` — proposed Travelar agent host.

These hostnames are proposed and must be verified in DNS/TLS/security design. Operator agents may have an OIMS-specific authenticated tenant area rather than a distinct agent URL; avoid needless application duplication until workflows demonstrate a need.

## 3. Homepage layout — discovery, offers and practical travel information

The homepage is **not a marketing brochure**. It should help visitors discover where to go, find legitimate offers, prepare for a trip, and then book where Travelar has an authorized transactional supply path. Do not add generic promotional sections such as “How it works,” “Why choose us,” “Our advantages,” generic feature grids, unsupported testimonials, or corporate mission copy to fill space.

1. **Compact header and travel controls:** Travelar identity, the six first-class modes (Bus, Ferry, Flights, Stays, Train, Experiences), destination/guide navigation, Deals & Offers, Help/Manage Booking, language and currency controls. Keep mode search easy to reach without duplicating the mode selector.
2. **Travel search:** a usable booking/search panel remains prominent, but should not consume the entire page or displace editorial discovery. The visible modes and search actions must reflect actual country, provider and mode configuration; do not imply a service can be booked when only a referral or information page is available.
3. **Hot Deals & Offers:** live, valid offers from an authorized supplier or an approved editorial promotion. Each card needs the applicable destination/product, valid dates and eligibility, fare/price basis, currency, important restrictions, availability/last-checked context where meaningful, and a direct next step. Never invent a discount, fake an original price, manufacture scarcity, or continue showing expired/unavailable offers.
4. **Explore Destinations:** destination cards for curated destinations and, when supported by reliable data, destinations genuinely popular with Travelar users. If popularity is not measured, label the section “Explore Destinations” rather than claiming a ranking. Example editorial destinations include Zanzibar, Dar es Salaam, Paris, Bali and Greece; model them as distinct destination records and appropriate city/region/country hierarchy, and never duplicate Zanzibar as separate records for visual filler.
5. **Travel Guides & Tips:** prominent practical guides, not generic promotional blog content. Prioritize entry/visa preparation, step-by-step arrival guidance, airport/port/station/terminal transfers, money and payments, connectivity, local transport, health/safety, local laws and customs, accessibility, weather/season, emergency contacts and common arrival problems. Surface date-reviewed guides and link to authoritative sources for high-impact claims.
6. **Useful browse paths:** allow visitors to browse destinations, travel guides, offers and modes by destination, trip type or topic. Add other groupings only where they help real discovery and there is adequate content; do not pad the homepage with empty categories.
7. **Help and footer:** help/manage booking, contact and complaint routes, accessibility, privacy, legal/policy links, source disclosures, and company/partner information. Keep corporate/partner recruitment pages out of the primary consumer homepage unless they serve an actual visitor task.

Homepage content is personalized only by transparent settings or relevant context such as selected country/language or current search; do not infer a traveller's citizenship, visa eligibility or legal status from their IP address. Do not use a generic “trust row” or unverified “best price / safest / most trusted / all operators” claims as a substitute for useful content.

## 4. Mode-specific landing-page content

### Bus

- Origin, destination, date, passenger count; optional return journey only if the supply integration actually supports round-trip booking across the selected operators.
- Show departure/arrival, terminal/boarding and drop-off point, duration if verified, operator, vehicle/class, seat layout/availability, baggage/policy and full price.
- Seat selection must reflect segment-level availability. A bus operating beyond the requested city pair is not automatically available for the segment unless schedule/fare/inventory allow it.

### Ferry

- Origin port, destination port, departure date, passenger categories, class and any operator-required traveller category/ID inputs.
- Show sailing, vessel/operator when verified, class capacity/availability, port instructions, baggage, ID and cancellation policies.
- Do not render bus seat maps; use class and availability quantities unless the supplier offers a distinct numbered seat/cabin product.

### Flights

- One-way / return / multi-city when supported; origin/destination airport/city; date(s); passenger types and ages as required; cabin; direct/connection preference where supported; currency/market.
- Result cards include itinerary, operating/marketing carriers, stops, local times, baggage/fare family when returned, total price, key restrictions and price timestamp/revalidation expectation.
- Separate reservation state from ticket issued. Do not advertise a fare as guaranteed after the applicable provider token/offer expires.

### Train

- Origin/destination station, date, passenger types/counts, class where supported, return where supported.
- The page must distinguish live in-platform ticketing from referral/redirect. If the network has no authorized integration, make the constraint clear and link only to the official booking route.

### Stays

- Destination/property, check-in, check-out, adult/child counts, child ages when required, room count, currency/market and optional filter preferences.
- Cards should disclose total stay price, taxes/fees display as required, room/bed description, cancellation deadline/terms, payment timing (pay now/pay later at property) where available, occupancy and supplier.
- Rate-check/preview immediately before the booking step where the supplier requires it. Price/availability can change until confirmed.

### Experiences

- Destination/activity keyword, date, adult/child/other participant counts, option/time slot and language/meeting-point preferences where supported.
- Show duration, participation restrictions, what's included/excluded, meeting point, confirmation style and cancellation policy. Clearly distinguish transactional availability from a content-only referral.

## 5. Search results and checkout behavior

- Search form values are validated server-side. Client validation improves usability but is not authority.
- Preserve search criteria on back-navigation, but refresh or revalidate volatile pricing/inventory before checkout.
- Display loading, provider partial-failure, no-results, unavailable, rate-changed, sold-out, provider maintenance and retry states distinctly.
- If multiple suppliers respond, disclose when results are mixed from direct/affiliate/redirect products if commercial terms or journey handoff could affect the customer.
- Never combine two unrelated suppliers into one “through-ticket” itinerary unless through-ticket rules and liability are verified.
- A checkout summary shows product, dates/segments, passenger counts, selected fare/room/activity, full total, taxes/fees, currency, payment terms and cancellation/change conditions.
- Obtain only necessary passenger data; distinguish booking-required terms, legally required consents, optional marketing consent, analytics/cookies choices and any supplier-specific data sharing.
- On payment delay, do not ask a customer to pay a second time without checking the original transaction status.
- Confirmation page is outcome-led: **confirmed + ticket/voucher**, **confirmed but delivery pending**, **payment/booking pending with next steps**, or **failed/refund process**. Never show a celebratory “booking complete” state before authoritative confirmation.

## 6. Account, guest and secure retrieval

Guest purchase is supported by requirement, subject to suppliers that require an account or specific identity. A guest receives a random/unguessable booking locator and authenticated contact receipt. To manage a booking, verify an email/SMS one-time challenge, existing authenticated account, or another risk-appropriate control. A booking reference alone must not reveal passenger identity fields, payment data or allow changes/refunds.

Account features: verify email/phone as appropriate, recover access safely, manage passenger profiles (with deletion/retention limits), view bookings and their provider statuses, re-send tickets, view invoices/receipts where available, manage communication preferences, and submit data-rights requests. Reusable passenger profiles are optional and must be protected more strongly than generic preferences.

## 7. Accessibility, localization and reliability

- Target WCAG 2.2 AA as a proposed product quality target, subject to accessibility review.
- All form fields have visible labels, programmatic name/description, clear inline errors and keyboard-operable controls.
- Support slow and interrupted networks: preserve safe user-entered search data, show progress and do not submit duplicate payments during retries.
- Translate static interface, transactional templates, supplier cancellation details and support scripts consistently. If a supplier returns only one language, disclose limitations rather than auto-translating legal fare terms as if authoritative.
- Use local timezone display for transport departures and stays while persisting UTC plus source timezone/offset as appropriate.
- Currency display and FX conversion are explicit; supplier amount/currency and the amount charged to the customer are stored separately.
- Search-engine content pages must not leak private booking URLs, passenger details or indexing of user account paths.

## 8. Measurement plan (proposed, privacy-reviewed)

Measure funnel events without placing passenger IDs or sensitive form contents into analytics:

- mode selected, search started/completed, results available/empty, offer viewed, reprice started/changed, checkout started, payment initiation, verified payment outcome, supplier confirmation, ticket/voucher issued, notification delivered if observable, support contact, cancellation/refund request and completed outcome.
- Break down by mode, country, provider and channel only where sample sizes and privacy controls allow.
- Track technical metrics: provider latency/error/unknown rate, price-change rate, booking conversion, failed confirmation after verified payment, ticket issuance delay, payment reconciliation exception age and duplicate booking/refund attempts.
- Do not optimize on raw conversion alone; add guardrail metrics for pricing complaints, involuntary cancellation, refund aging, fraud, support contacts and fulfilment failure.

## 9. Decision list before visual design approval

1. Which modes are genuinely available at Tanzania launch, with which authorized supply paths?
2. Is guest booking supported by the selected bus/ferry suppliers and what verification is needed for ticket retrieval?
3. Which locales and currencies launch first? Kiswahili and English are reasonable candidates but final launch configuration is a decision.
4. Which payment methods are confirmed for each country and supplier flow?
5. What customer-care channel, hours and disruption service level can OuterBlocks actually staff?
6. Which policies require legal review by mode and country?
7. Confirm domains/DNS/TLS and separation of public/tenant internal apps.

## 10. Sources and constraints

- Booking.com Demand API documents multiple integration models: content-only, search/redirect, search/look/book, post-booking and reporting; supported flows depend on partner access. https://developers.booking.com/demand/docs/getting-started/overview
- Expedia Rapid documents accommodation shopping, price check, booking and manage-booking stages, including rate revalidation and result links. https://developers.expediagroup.com/rapid/lodging
- GetYourGuide states that available API access levels differ, from content teaser to transactional booking; partner eligibility and contract apply. https://partner.getyourguide.support/hc/en-us/articles/13981133907613-API-integration-and-requirements
- OWASP recommends least privilege and deny-by-default authorization. https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- PDPC Tanzania controller/processor registration and cross-border permit pages: https://pdpc.go.tz/services/registration/ and https://pdpc.go.tz/services/cross-border-data-transfer-permit/

These sources support workflow constraints, not the final Travelar visual design or a claim that a provider has authorized OuterBlocks Limited.

## 11. Destination pages, travel guides and content governance

- Create destination hubs and practical guide pages as first-class product content, not disposable marketing posts. Suggested routes: `/destinations/{destinationSlug}`, `/travel-guides/{guideSlug}`, `/deals/{offerSlug}`. Destination identity must be canonical, hierarchical and deduplicated (country, region/island, city/area, transport hub/point of arrival).
- A destination hub can include overview, getting there, arrival and onward transport, entry requirements, money/currency, connectivity, local transport, health/safety, laws/customs, accessibility, timing/season, neighbourhoods/areas, practical FAQs and bookable offers/services. Only render sections with useful, reviewed content.
- High-impact entry and travel-rule statements must be source-backed and date-stamped. Store source title, issuing authority, original URL, access/review date, reviewer, applicability (nationality/passport, residency where relevant, travel purpose, planned stay, entry point/mode, transit route and date range), source confidence, next review date and correction history.
- Prefer current destination-government immigration/border authorities, foreign ministries/official travel advisories, ministries of health, customs authorities, official railway/airport/port authorities and licensed travel-document information services. Use tourism-board sources for destination context. Editorial/community reports may supplement practical tips, but must be clearly labelled and cannot override official requirements.
- Visa-on-arrival, visa-free, eVisa, pre-approved/referral visa and transit requirements are distinct statuses. Do not generalize by destination alone: passport nationality, purpose, duration, residence, route/transit and the actual entry point may change the answer. A visa grant or document check never guarantees admission; border officials retain authority.
- If Travelar later integrates a data service such as IATA Timatic, confirm licensing, permitted display, caching, update SLAs, attribution and commercial API rights. A public traveller lookup page is not evidence of rights to republish its results or access an API.
- Content lifecycle: draft → editorial review → source/fact review → approved → published → revalidation due → stale/withdrawn. Critical inaccuracies require immediate correction, unpublishing or a clearly visible warning; retain immutable revision history and audit who changed rules.
- Search and SEO must not outrank safety or factuality. Do not create mass-generated destination pages without unique reviewed information. Avoid promising visa approval, guaranteed entry, guaranteed availability, or universal arrival experience.

## 12. Homepage content acceptance criteria

1. The primary homepage has the mode/search entry point, Hot Deals & Offers, Explore Destinations and Travel Guides & Tips as its substantive priorities.
2. No generic “How it works,” “Why choose us,” unsupported trust/testimonial or corporate promotional section is present in the homepage layout unless the owner explicitly approves a change.
3. An expired offer is not rendered as bookable; every published offer has a valid period/eligibility or a clearly disclosed editorial status and a working next step.
4. Destination cards use unique canonical records and slugs; a destination cannot appear twice because of duplicate imported records. “Popular” requires a documented metric/period or editorial label is used instead.
5. A visa/entry guide presents applicability and “last reviewed” metadata and links to official/current sources; stale high-impact content becomes flagged and cannot silently remain authoritative.
6. Guide content separates official entry/health/safety facts from editorial advice, shows uncertainty when a rule is not verified, and never states or implies guaranteed admission.
7. Every guide and destination can be maintained by authorized editors with version history, source links, reviewer identity, publication status and correction/withdrawal capability.
8. Homepage and guide templates work in the supported launch languages and mobile widths, meet the accessibility baseline and display a useful empty state when there are not yet enough reviewed destinations/guides/offers.

