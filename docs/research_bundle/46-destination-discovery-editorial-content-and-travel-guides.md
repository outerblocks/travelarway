# 46 — Travelar Destination Discovery, Editorial Content and Practical Travel Guides

**Product:** Travelar · **Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Stage:** 18 · **Research cut-off:** 24 October 2026  
**Status:** Owner-aligned product requirement and proposed content architecture; visual design, source contracts and operational editorial capacity still require validation.

## 1. Product decision

Travelar's public homepage should be built around **what travellers can discover, book and learn before a journey**, not generic marketing about Travelar itself. The priority content surfaces are:

1. **Hot Deals & Offers** — genuine, current, properly qualified offers.
2. **Explore Destinations** — useful destination discovery, curated initially and supported by measured demand when available.
3. **Travel Guides & Tips** — practical information that helps someone plan, arrive, move around and understand the destination.
4. The six-mode search/booking entry point and useful help/manage-booking controls remain accessible, but generic promotional sections do not fill the homepage.

This is not a decision to remove booking from the homepage. Search remains a primary task; the change is that the other homepage real estate provides traveller utility and destination knowledge rather than “How it works,” “Why choose us,” generic feature lists, invented social proof or company-promotion blocks.

## 2. Non-goals and exclusions

Do not build these as default homepage sections:

- “How it works” marketing sequence.
- “Why choose Travelar” or generic benefits grid.
- Unsupported “lowest price,” “most trusted,” “safest,” “best” or “all operators” claims.
- Unverified testimonials, review stars, user counts or popularity rankings.
- Expired deals, fabricated discount percentages, invented old/reference prices, fake urgency or false scarcity.
- Empty destination-category tiles created to make a page look full.
- Automatically generated destination pages whose only difference is the city name.

About, partner onboarding and corporate information can exist on appropriate pages, but they should not displace the information users came to find on the consumer homepage.

## 3. Proposed homepage information hierarchy

### 3.1 Header and trip search

- Logo and clear top-level navigation.
- Six first-class travel modes: Bus, Ferry, Flights, Stays, Train and Experiences.
- Direct access to Deals, Destinations and Travel Guides.
- Help/Manage Booking, sign-in/account, language and currency controls.
- A compact, usable search experience that displays only mode/country/provider combinations that Travelar can actually support. Referral-only or information-only paths must be labelled honestly.
- Do not infer passport nationality or visa eligibility from IP location. Use explicit user choices when personalization requires nationality, country of residence, route or passport details.

### 3.2 Hot Deals & Offers

Offers may come from authorized suppliers, configured Travelar promotions or approved editorial collections. Each offer needs enough detail to make the offer understandable before the customer clicks:

- Offer title, destination/product/supplier and service mode.
- Starting price or actual price basis, currency and whether taxes/mandatory fees are included or excluded.
- Conditions: eligible dates, blackout dates, origin/market, passenger/room/activity constraints, minimum stay or other conditions where relevant.
- Valid-from/valid-until and whether availability has been checked or requires revalidation.
- Any reference/original price must be genuine, documented and lawful to display; a discount is not computed against a made-up anchor price.
- A direct, working next step to a live Travelar booking route or an explicitly labelled supplier redirect.
- Clear unavailable/expired behavior. Never keep an expired deal looking purchasable.

“Hot” can be a curated editorial label. If an offer is described as trending, bestselling or popular, the ranking method and period must be documented and based on real data. Otherwise choose a factual label such as “Offers for this month” or “Explore current offers.”

### 3.3 Explore Destinations

Use “Explore Destinations” as the default label while demand data is immature. “Popular Destinations” becomes appropriate only if Travelar has reliable, documented evidence (e.g., search or booking data over a defined period) or explicitly labels the section as editorially selected rather than statistically popular.

Owner-provided initial examples are Paris, Zanzibar, Greece, Bali and Dar es Salaam. These are content examples, not evidence of demand or a mandatory ranking. Model destinations as canonical records, including hierarchy and type: country, region/island, city/area, park/attraction or transport hub as applicable. Greece should be represented as a country destination and can link to city/island pages; Paris and Dar es Salaam are cities; Zanzibar's relationship to island/region and country must be represented consistently. Do not insert Zanzibar twice or create aliases that compete for the same destination.

Destination cards can include:

- Representative approved image, canonical destination title and short useful summary.
- Country/region and destination type; do not confuse a city with a country.
- A small number of grounded context facts such as travel season, primary arrival point or notable trip style, when researched and reviewed.
- Links to the destination hub, relevant practical guides, real matching offers and bookable modes.
- No unverified visitor numbers, rankings or availability.

### 3.4 Travel Guides & Tips

This is a core product surface, not an SEO article farm. Featured guides should answer real questions that travelers often need answered before and after arrival:

- Do I need a visa? Is the relevant route visa-free, eVisa, visa-on-arrival or subject to pre-approval/referral?
- What documents, passport validity, blank pages, return/onward ticket, accommodation/address, funds or other evidence may be required?
- What could happen after landing or arriving at a port/station/terminal, and in what order: health screening where applicable, immigration, document/visa checks, baggage, customs and onward transport?
- How do travellers get from the airport, port, railway station, bus terminal or land border to their accommodation?
- How should they prepare for currency exchange, cash, cards, ATMs, connectivity/SIM/eSIM, local transport, language and common payment practices?
- What health precautions, safety conditions, local laws, customs, accessibility issues, weather/season and emergency resources should they know?
- What should be planned in advance (e.g., permits, tickets, insurance, transport reservations) and what can be arranged on arrival?

A destination guide must separate official rules from general editorial advice and destination-specific reports. It must not claim that every arrival is identical: actual procedures depend on the entry point, nationality, travel purpose, airline/transport operator, time of arrival and current local arrangements.

## 4. Destination page content model

Suggested public routes (final URL hierarchy can change if the frontend repository dictates another clean convention):

- `/destinations/{canonicalSlug}` — destination hub.
- `/travel-guides/{canonicalSlug}` — practical guide.
- `/deals/{canonicalSlug}` — offer detail or curated offer page.
- A future personalized entry-requirement flow may collect explicit itinerary/passport inputs, but should not be described as an authoritative visa checker until an accurate licensed data source and operational model exist.

A destination hub should render only available, reviewed sections from this catalogue:

1. Overview and useful context.
2. Getting there, with bookable options only where supply and commercial permissions allow.
3. Entry requirements and official links, with clear applicability and review metadata.
4. Arrival guide by relevant airport, seaport, station, bus terminal or land border.
5. Local transport and transfers, with price/time claims only when supported and timestamped.
6. Currency, payments and connectivity.
7. Health, safety, laws, customs and emergency resources.
8. Best time/season and weather context, including the source and limitations of seasonal guidance.
9. Accommodation areas and local experiences, with bookable inventory or explicitly editorial links.
10. Accessibility, family travel and practical FAQs where reviewed content exists.
11. Relevant offers and bookable Travelar modes.

Do not expose empty modules. A destination page can launch with a smaller set of high-quality, verified information rather than dozens of thin sections.

## 5. High-risk travel information: visa, entry and arrival

Visa/entry information is materially different from ordinary travel inspiration. A simplified “destination = visa rule” table is not safe. Requirements can depend on passport nationality/type, residence status, purpose, duration, prior approvals, transit countries, transport mode, border point and the date of travel. Distinguish at minimum:

- Visa not required under specified conditions.
- eVisa application/approval required or recommended.
- Visa on arrival available only to specified traveller categories and at specified entry points.
- Visa/entry pre-approval or referral approval required.
- Transit visa/airside-transit conditions where relevant.
- Other prerequisites such as passport validity, return/onward journey, insurance, proof of funds/accommodation, permits, health documents or declarations when the authoritative source says they apply.

Never collapse “eligible to apply,” “application submitted,” “visa granted” and “admitted at border” into one status. A visa is not a guarantee of entry; border authorities decide admission under the applicable rules. Do not tell a customer that they can simply “get a visa on arrival” unless the source establishes the rule for the traveller's relevant circumstances and entry point.

### Required evidence shown on the page

- A plain-language summary and the conditions it applies to.
- Source authority/organization and a visible link to the exact official source.
- “Last checked” date/time, review date and next review due.
- A clear statement when a conclusion is incomplete, source data is ambiguous, or the user has not provided enough context.
- “Confirm with official authority/carrier before travel” where appropriate, especially for high-impact or rapidly changing requirements.
- An editorial disclaimer that Travelar provides travel information, not an immigration decision or guarantee of admission.

### Source hierarchy

1. Destination-country immigration, border, embassy/consular, health and customs authorities.
2. Official foreign-ministry travel advice for safety, law, health and entry guidance, with the scope/population identified.
3. Licensed and contractually accessible travel-document requirement data service (e.g., IATA Timatic) where approved for Travelar's commercial use.
4. Official airports, ports, railways, public transport operators and tourism agencies for their own facilities/operations.
5. Reviewed editorial reports and traveller observations only for context—not to overrule official entry or health requirements.

Different official authorities can publish conflicting or lagging information. A source conflict should trigger a review/escalation, not an invented resolution. If the rule cannot be verified, say so and link to the responsible authority instead of making a categorical claim.

The public IATA Travel Centre is a traveller-facing lookup. Its existence does not grant Travelar bulk/API, embedding, caching, republication or commercial reuse rights. Any Timatic/API integration requires its own access and terms assessment.

## 6. Practical arrival guide template

A guide for an airport, port, station, bus terminal or land border should use a structured sequence only after local evidence is gathered. A generic guide can describe the categories of process without claiming every step applies at every location.

- Before departure: documents, valid visa/authorization, permitted luggage, required declarations, proof of onward journey/insurance where applicable, official payments and offline copies of essential contact/booking information.
- On arrival: where to follow official signs; health checks/declarations if currently required; immigration/document check; visa process where eligible; baggage collection; customs declarations and prohibited/restricted items.
- Leaving the arrival facility: official transport options, station/port/airport exit point, ticketing or pickup process, accessibility, late-night considerations and verified contact details.
- First hours: local connectivity, cash/cards/ATMs, payments, how to contact accommodation, safe transportation practices, local norms and what to do if a driver/booking/phone connection fails.
- If something goes wrong: official authority contacts, transport operator/support contact, loss/theft reporting path, emergency number and verified consular route where relevant.

Do not give directions to an exact terminal, gate, visa desk, cash booth, SIM counter, emergency number, fare or transport schedule without a current source and relevant location context. Facility layouts, operating hours, service providers and official procedures change.

## 7. Content management and provenance

Travelar needs a managed editorial data model, not uncontrolled hard-coded article text. Each content item should have:

- Canonical id/slug, type, parent/related destination records, language and market scope.
- Title, summary, article body/structured sections, images/media license record and alt text.
- Publication state: draft, editorial review, fact/source review, approved, published, revalidation due, stale, withdrawn/archived.
- Author, reviewer, approver, publication and modification timestamps, revision history and correction reason.
- Source records: organization, title, canonical URL, source class, last accessed/checked, evidence notes, claim(s) supported, confidence/limitations and source-change monitoring where available.
- Applies-to dimensions for entry/travel rules: nationality/passport class, residence, purpose, duration, route/transit, entry point and date validity as applicable.
- Next review due, stale policy, correction/withdrawal reason and audit events.
- Related guide/destination/offer/bookable product relationships and localization status.

A CMS can be selected later; no vendor is prescribed here. Requirements include role-based publishing rights, review/approval workflow for high-risk material, safe media rights handling, redirects/canonical metadata, localization, revisions and accessible preview. Authors should not be able to self-approve high-impact entry claims where a second review is required by policy.

## 8. Freshness and editorial operating policy

Proposed policy to validate against the actual editorial team and source agreements:

- Entry/visa, travel health and safety content gets the strongest review policy, visible checked date and event-triggered recheck when an authoritative source changes or an incident is reported.
- Define maximum age and revalidation cadence per risk class. A reasonable starting proposal is a 30-day review ceiling for high-impact entry summaries plus immediate review on alerts; official data services may permit a tighter or source-synchronized process. This is an internal quality target, not a government rule.
- Static practical content (e.g., general destination background) can have a longer cadence, but prices, schedules, facility details and contact numbers need shorter checks.
- When high-risk content is overdue, do not silently treat it as current. Mark it for review, show a visible freshness warning or suppress a definitive statement until verified.
- Every correction to high-impact travel information has an audit record and a way to identify which pages, locales, offers or notifications it affected.
- If Travelar later offers change alerts for visa/advisory information, use an approved source/update mechanism, record delivery status and avoid promising instant warnings without tested monitoring coverage.

## 9. Deals and destination integrity

- Store promotional price and supplier base/rate as separate amounts with their own currency and source; only authorized, properly disclosed markup/discount logic can shape a customer price.
- Store offer eligibility, effective interval, inventory/availability source, verification timestamp and removal condition.
- A destination's popularity ranking needs a documented metric/time window and privacy-reviewed analytics. Small sample sizes should not be presented as a robust ranking.
- Editorially curated destinations are allowed and useful. Label the section honestly and do not fabricate user behavior.
- Deduplicate destinations with canonical IDs and aliases; translated names should resolve to the same destination rather than create separate cards.
- All imagery must be properly licensed, supplier-approved, or otherwise cleared for the intended use; include attribution where required.

## 10. Editorial safety, legal and privacy boundaries

- Do not collect passport numbers or other highly sensitive travel-document information just to personalize homepage content. Start with the minimum input needed (often nationality/passport type, destination, transit and date) and obtain privacy/legal review before building personalized eligibility tools.
- If a guide uses nationality, residence or itinerary input, explain why it is needed and avoid sending it to ad analytics.
- Protect accounts/booking references and personal travel details from indexing and public cache leakage. Public guides and destination pages must not include individual travellers' data.
- Distinguish legal/immigration/medical information from general editorial tips. Link to competent authorities; do not replace official visa application portals with lookalike forms, accept visa payments or represent Travelar as an authorized visa agent without a separate approved business model.
- Avoid fear-based copy, false guarantees and unsupported claims about scams, safety or local behavior. Identify the source and date for risk claims.

## 11. Acceptance criteria for implementation

A homepage/content task is not complete until relevant conditions below are tested:

1. Homepage priorities are working mode search, Hot Deals & Offers, Explore Destinations and Travel Guides & Tips; generic marketing sections are absent unless explicitly approved.
2. Offer content is linked to a live, authorized flow or marked as editorial/redirect, includes relevant conditions and automatically stops being bookable after expiry/unavailability.
3. No fabricated discount, anchor price, popularity ranking, stock/urgency claim or review count can be published through normal editor controls.
4. Destination IDs/slugs/aliases are canonicalized; duplicated names in imports do not generate duplicate destination cards or SEO pages.
5. Article templates support official source, reviewed date, applicability caveats, localization, status and correction history.
6. High-impact entry content cannot publish without its required sources/review; overdue or disputed content is flagged/withdrawn according to policy.
7. A guide distinguishes visa-free, eVisa, arrival visa, prior approval and transit situations where supported, and clearly states when the traveller's circumstances are insufficient to determine the applicable rule.
8. The interface never guarantees visa approval or entry. It preserves official links and displays the checked/reviewed date and relevant disclaimer.
9. Destination-arrival instructions (locations, contacts, hours, transport prices/routes) cannot be published as verified without a source and review metadata.
10. Search, deals, destination and guide sections have mobile, keyboard-accessible, screen-reader-friendly and reduced-motion behavior, and useful empty/loading/error states.
11. English/Swahili content has explicit localization status; untranslated or supplier-only language text is not silently represented as a fully reviewed translation.
12. Analytics capture aggregate content/search interaction without including passport/document numbers, booking locators or sensitive form contents.

## 12. Open evidence and decisions

- Which licensed CMS or custom editorial workflow best fits roles, localization, review/audit, hosting and data-residency constraints?
- Who owns destination research, source verification, translation, media rights, publication and urgent corrections, and what service level can that team sustain?
- Which countries/destinations and first guides can be verified at launch rather than populating the site with thin pages?
- Will Travelar purchase any licensed visa/entry information feed or initially publish carefully sourced official links and reviewed summaries? Access terms/cost/SLA and republishing rights must be assessed directly.
- Which popularity metrics are collected with privacy approval, and how are rankings thresholded or labelled as editorial?
- What is the real offer supply source for each mode, how are offer expirations synchronized, and who owns emergency removal?
- Which local emergency contacts, transport directions, safety notes and arrival-facility instructions can be verified and maintained for each destination?

## 13. Primary sources reviewed

1. **IATA Travel Centre — passport, visa and health requirements.** https://www.iata.org/en/travel-centre — traveller-facing requirement lookup; its existence does not grant Travelar API/republication rights.
2. **IATA Travel Centre traveller guidance.** https://www.iata.org/en/travelers/ — says requirements depend on traveller details and can change; document possession does not guarantee admission because immigration authorities decide entry.
3. **IATA Timatic Solutions.** https://www.iata.org/en/services/compliance/timatic — describes validation from government and airline sources and continuous update processes; commercial access must be separately contracted.
4. **Tanzania Immigration Services, official visa guidelines.** https://visa.immigration.go.tz/guidelines — describes Tanzania-specific visa application and arrival-visa conditions; must be rechecked before publishing any dated Tanzania guide.
5. **Tanzania Immigration Services, eVisa portal.** https://visa.immigration.go.tz/ — official application portal and source for current instructions.
6. **UK Foreign, Commonwealth & Development Office, foreign travel checklist.** https://www.gov.uk/guidance/foreign-travel-checklist — describes checking current entry, safety, health, document, insurance and local-law information; guidance is scoped to UK travellers.
7. **GOV.UK, Tanzania entry requirements (UK traveller guidance).** https://www.gov.uk/foreign-travel-advice/tanzania/entry-requirements — demonstrates destination-specific conditions and updates; should not be generalized to travellers of other nationalities.

This research establishes source-quality and content-governance needs. It does not establish the current entry requirements for all nationalities/destinations, guarantee real-time accuracy, or confirm licensed data-feed access for Travelar.
