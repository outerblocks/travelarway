# 03 · Checkout and ticket: new design

Two screens break the current design on purpose. Today's checkout is a demo shell — a step
badge, two payment cards, a phone field, and copy admitting it cannot take money. The
ticket is a page of gold-bordered rows rather than a document. Both are replaced.

Constraint that has not changed: brand blue for action, gold as flourish only, no
gradients, no decorative shadows, one loading idiom, headers centred.

## Checkout

**Idea: a receipt, not a form.** The customer has already decided. The page's only job is
to take one payment and show, honestly, exactly where it is. No marketing, no upsell, no
second summary card.

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│                    Checkout                                  │
│         Review  ────────  Pay  ────────  Ticket              │
├───────────────────────────────┬──────────────────────────────┤
│  [ payment status strip ]     │   AMOUNT DUE                 │
│                               │   TZS 80,500                 │
│  How would you like to pay?   │   ─────────────              │
│  ○ Mobile money               │   Train · SGR                │
│  ○ Card                       │   Dar es Salaam → Dodoma     │
│  ○ Pay with a control number  │   2 passengers · 14 Oct      │
│                               │   ─────────────              │
│  [ selected method pane ]     │   Seats held 09:41           │
│                               │                              │
│  Have a promo code?           │   [ Pay TZS 80,500 ]         │
└───────────────────────────────┴──────────────────────────────┘
```

- Desktop: `lg:grid-cols-12`, payment `col-span-7`, rail `col-span-5` and sticky.
- Mobile: single column; the rail collapses into a bar pinned above the button that reads
  `TZS 80,500` and expands for the trip lines.

**The rail is deliberately not a summary card.** It carries the amount as the single
largest element, three lines of context, the hold countdown, and the button. It exists
because a person about to pay must see what they are paying; it itemises nothing, because
the review step already did. If this reads as duplication, the fallback is to move the
button into the payment column and keep only the amount in the rail.

### Payment method: one selector, not competing cards

A `fieldset` of three radio rows, stacked, hairline separated, no shadows. Each row: method
name, one clarifying line, and the radio on the left. Selected = `border-ink` and
`bg-brand-50`; focus ring on the row `:focus-within`, not only the dot.

| Method | Clarifying line |
|---|---|
| Mobile money | "M-Pesa, Mixx By Yas, Airtel Money, Halopesa" |
| Card | "Visa, Mastercard, Amex, UnionPay" |
| Control number | "Pay by number at any mobile wallet or bank" |

The provider is a **secondary** choice inside the mobile money pane — compact chips, text
labels, no invented logos — never a dropdown that hides availability.

### The three panes

**Mobile money.** Provider chips → phone field with a fixed `+255` prefix and a helper:
"You'll get a prompt on this phone." Then the primary button. On submit the strip moves to
*Awaiting approval* with a 60-second countdown and a **Send again** action.

**Card (recommended: hosted).** A single button, "Continue to secure card page", and the
line "You'll come back here when the bank approves it." **We do not collect card numbers** —
that keeps PANs off our origin and removes PCI scope (`02`). If a business decision later
requires an inline form, it is this pane that changes and nothing else.

**Control number.** Creates a BillPay number, then shows it in large monospace with a copy
button, the amount, an expiry time, and three ways to pay. The pane stays alive and flips
to *Paid* when the webhook lands. This is the pay-later path and the agent-assisted path,
and it is the same mechanic SGR customers already know.

### Status strip (the only loading indicator on the page)

One horizontal strip directly under the header, `aria-live="polite"`, that walks:

```
Preparing payment → Sending request to your phone → Awaiting approval (counts) →
Confirming → Paid
```

No spinner on the page, no overlay, no disabled-button-as-progress. The button shows
in-flight text inline. On failure the strip becomes a bordered panel in `error-*` above the
button carrying the exact copy from `02` and a **Try again** that mints a **new**
`orderReference` — a retry is never a resubmission of the same reference.

### Details that make it feel finished

- Hold countdown appears once, in the rail, and never counts down twice in two places.
- Promo code is a single collapsed row that expands inline; a rejected code returns a
  specific reason.
- Amounts are tabular figures, `TZS` never abbreviated mid-sentence.
- One trust line under the button: a lock glyph, "Payments are processed securely", and
  the gateway attribution. Provider marks appear only here — nowhere in marketing.
- Focus order: method → pane fields → promo → pay. Visible focus everywhere, 44px targets.
- `fieldset`/`legend` for the method group; errors linked with `aria-describedby`.

## The ticket

**Idea: a document you could hand to a conductor.** Not a card with borders — a printed
artefact with one gold rule at the perforation and hairlines everywhere else.

### A4 layout

```
┌─────────────────────────────────────────────┬──────────────┐
│ TRAVELAR            Travel ticket           │  DAR → DOM   │
│                                             │              │
│ 06:00      ────────────────      13:40      │  TRV-A7F2K9  │
│ Dar es Salaam                     Dodoma    │              │
│ 14 Oct 2026              SGR 0011904        │  ┌─────────┐ │
│                                             │  │  QR     │ │
│ Passenger        Seat    Coach   Class      │  └─────────┘ │
│ A. Mwinyi        14      2       Business   │              │
│ Z. Hassan        15      2       Business   │  PAID        │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ gold 1px ─ ─ ─ ─ ─ ─ ─ │  TZS 80,500  │
│ Fare 80,500 · Taxes incl. · Conditions ↓    │              │
└─────────────────────────────────────────────┴──────────────┘
```

- Left column ~72%, right stub ~28%, separated by a **dashed perforation with 1px gold**.
- Journey block is the visual anchor: large times, place names at weight 600, date and trip
  number as meta. No airline/railway logos — Travelar wordmark top-left, operator name in
  the footer small print.
- Passenger rows are a table, not chips, so seats line up and print legibly.
- One QR code carrying the reference and verification URL. Its placeholder is empty until
  the API issues one; nothing is faked.
- Footer: cancellation policy link, review step, issued timestamp, and the operator's legal
  name — the only place a supplier name may appear.

### Print rules

- `@page { size: A4; margin: 12mm }`; thermal variant `@page { size: 80mm auto }` with a
  single column, monospace amounts, QR last.
- Isolate the ticket: hide app chrome, nav, and buttons via `print:hidden`; `page-break-inside:
  avoid` on each coupon.
- `-webkit-print-color-adjust: exact` so the ink rules print; no shadows, no background
  images, no gradient anywhere.
- Round trip prints **two coupons**, each with its own perforation and leg label.
- Multi-passenger prints one page per passenger when the operator requires it, otherwise one
  document with all rows.

### Ticket states

| State | Rendering |
|---|---|
| Issued | normal document, `PAID` label in `success-600` |
| Void | reference struck through, one rotated `VOID` label in `error-600`, "Cancelled — not valid for travel" |
| Refunded | `REFUNDED` label, refund amount and date, original fare retained |
| Held / lapsed | no ticket is issued at all — these never reach this screen |

### Actions

`Download PDF`, `Print`, `Email me a copy`, `Add to calendar (.ics)` for modes with a
departure time. On screen only; all four are hidden in print.

## What is removed

- The demo-mode disclaimer and the disabled-payment framing.
- Two shadowed payment "cards" competing for attention.
- Repeated gold-bordered rows as page decoration.
- Any gradient, decorative shadow, or second loading indicator.

## Files

```
src/pages/shared/CheckoutPage.tsx          rewrite
src/pages/shared/ConfirmationPage.tsx      ticket document
src/components/payment/MethodSelector.tsx  new
src/components/payment/MobileMoneyPane.tsx new
src/components/payment/CardPane.tsx        new
src/components/payment/ControlNumberPane.tsx new
src/components/payment/PaymentStatusStrip.tsx new
src/components/ticket/TicketDocument.tsx   new
src/index.css                              print rules, tabular figures
src/context/I18nContext.tsx                new keys, en/sw/fr
```

## Acceptance

1. A guest pays with mobile money and reaches a ticket without ever seeing a spinner.
2. Declining on the handset leaves the booking held with the countdown intact and a working
   retry that mints a fresh reference.
3. The ticket prints to A4 with the perforation intact and to 80mm without truncation.
4. A refunded booking still prints, marked, with its original fare visible.
5. Keyboard-only run through checkout reaches every control with visible focus.
6. No new colour outside the tokens; gold appears only once per screen as a rule.
