# 05 · Public website

Travelar's own brand end to end. Supplier names never appear in navigation, hero copy,
marketing sections, or metadata — only inside a booking's legal small print and the payment
trust line.

## Voice

Plain, warm, specific. Short sentences. Prices always with currency. No superlatives
("best", "world-class"), no exclamation marks, no "seamless/effortless/unlock". Swahili is
a first-class language, not a translation afterthought, and the English must not read like
it was written to be translated.

## Map

```
/                       home
/bus /ferry /train      mode landing → search → results
/flights /stays /experiences
/about /partners /contact /help
/manage-booking /parcels
/signin /register
/terms /privacy /cookies /cancellation-policy
/api-enquiries
```

Mode landings are real pages, not just a search bar: each explains what the mode is for,
where it goes, and what a ticket includes. They carry the same search form so a visitor can
act immediately.

## Section inventory

### Home

| # | Section | Purpose | Content rules |
|---|---|---|---|
| 1 | Hero + search | Start a booking | Solid brand blue. One headline, one supporting line, one mode switcher, one search form. **No background photograph.** |
| 2 | Modes | Explain the six products | Six entries with a one-line description each; only modes enabled for the visitor's market render |
| 3 | Destinations | Inspire | Real destinations with real imagery, no invented prices |
| 4 | How it works | Reduce anxiety | Three steps: search, pay, travel — each with what the customer receives |
| 5 | Why Travelar | Differentiate honestly | Guest booking, instant ticket, pay by mobile money, support that answers |
| 6 | Operators / partners | Recruit supply | One paragraph and one CTA to `/partners`; no fake logos |
| 7 | Help strip | Deflect support load | Track a parcel, manage a booking, contact, FAQ |
| 8 | Footer | Navigate and reassure | Modes, company, legal, payment marks, contact, language, market |

### About

Who Travelar is, which markets we serve, how ticketing works, and the companies we work
with described generically ("licensed operators", "payment partners"). No supplier logos.

### Partners

What an operator gets: distribution, settlement schedule, manifest tooling, and a console.
One form to enquire. Explicit statement that onboarding is reviewed, not instant.

### Help

Searchable topics grouped by mode plus payments and refunds. Every article answers one
question and links to the action it describes. Common top tasks are pinned above the fold.

### Contact

Real channels with response expectations, not a bare form. A form that files an enquiry and
confirms receipt.

### Manage booking

Reference + email or phone. Never reveals whether a reference exists to someone who cannot
produce the matching contact detail.

### Legal set

Terms, privacy, cookies, cancellation policy — see `06`. Linked in the footer of every page
and again at checkout.

## Rules that hold across the site

- **One primary action per screen.** Secondary actions are links, not competing buttons.
- **Prices** show currency and are never rounded differently on two pages for the same
  product.
- **Availability** is stated honestly: if a mode is not offered in a market, it is absent,
  not disabled with a tooltip.
- **Loading** is a skeleton; **errors** state what happened and what to do next.
- **Gold** appears as a rule, a badge, or one emphasised word — never as a button.
- **Images** are only real photographs of real places or operators. No illustration of a bus
  that does not exist, no stock "happy traveller".
- **Accessibility**: semantic headings, labelled forms, 4.5:1 contrast, visible focus,
  44px targets, no motion that cannot be reduced.

## Localisation and markets

Three languages (en, sw, fr), each complete — no half-translated screens. Market comes from
the URL (`/tz`, `/ke`, `/za`) and decides which modes, currencies and payment channels
render. Switching language keeps the current page; switching market warns if the current
selection is unavailable there.

## SEO and sharing

One `h1` per page, descriptive titles, canonical URLs per market, `hreflang` per language,
structured data for organisation and breadcrumbs. Share cards use the brand blue and the
page's own title — never a generic template.

## What the marketing section must not claim

Do not promise prices, seat availability, refund amounts, journey times, or coverage that
the data cannot back. Do not imply we operate the vehicles. Travelar sells and supports the
journey; the operator provides it, and the copy says so where it matters.
