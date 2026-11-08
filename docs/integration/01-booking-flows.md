# 01 · Booking flows

One flow, six modes. The differences are data (which fields a mode needs), not a different
journey. Every mode ends in the same place: a payment, a booking reference, and a ticket.

## The spine

```
search → results → [detail] → passengers & seats → review → checkout → confirmation → ticket
```

- **search** — mode-specific form. Validates on blur, never on first paint.
- **results** — server-rendered list, filterable, no artificial delay. Loading is a
  skeleton, never a spinner, never a flash.
- **detail** — stays and experiences only.
- **passengers & seats** — seat map left, forms right, price bar under the form. Bus, ferry
  and train share this layout.
- **review** — the single itemised summary in the whole journey. This is why no step
  before it carries a summary card.
- **checkout** — payment only (see `02`).
- **confirmation** — reference, state, and the next actions.

## Guest and account

Guest is the default and always available. An account only adds: saved passengers, booking
history, and faster checkout. No screen may require sign-in to continue a booking, and
sign-in must never be a redirect trap in the middle of a flow — if the customer signs in
mid-flow, they return to the exact step and the held selection is intact.

## Identity of a booking

- **PNR / booking reference** — `TRV-` plus six characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
  (no `0/O/1/I`). One reference per booking, global across modes and markets, used by
  manage-booking, support, and the ticket.
- Mode-native references are stored alongside it where they exist (operator PNR, vendor
  locator, SGR trip number) and shown on the ticket, but they are never what we ask the
  customer to quote.

## Per-mode fields

| Mode | Required beyond the passenger | Seat/space | Notes |
|---|---|---|---|
| Bus | boarding point, drop-off point, operator | seat + coach | round trip = two legs, two seat picks |
| Ferry | vessel class, sailing time | class, not seat | fare currency follows residency (TZS resident / USD non-resident) |
| Train (SGR) | trip/service, coach class | coach + seat | round trip = outbound and return seat picks; classes Economy, Business, Royal |
| Flight | segments, fare brand | seat optional, paid | ticketing time limit applies; content may be NDC (no net fare) |
| Stays | room type, rate plan, guests per room | rooms, not seats | check-in/out; one booking may hold several rooms with different guests |
| Experiences | date, participants | n/a | operator-confirmed or instant |

## Stays: rooms are not seats

Hotel inventory breaks two assumptions the transport modes make.

**Guests and rooms are different counts.** Search sends the *guests* in each room; the room
quantity is only stated at booking (`NumberOfRooms`). A two-room booking for four people is
one booking, one payment, and a product that reports `Quantity: 2, guests: 4`. The passenger
step therefore asks "who is travelling" and "how many rooms", and validates that every room
has at least one named guest — never that passenger count equals room count.

**A booking carries two locators.** The aggregator locator (the one the guest sees) and the
supplier's confirmation number, which is required to change or cancel. Both are stored.
Cancellation needs both (`canceloffer?supplierLocator=…`), and afterwards the supplier
locator becomes a **cancellation number** — so a cancelled stay keeps its original
confirmation on record rather than losing it.

**Cancellation terms are captured at booking, not looked up later.** The cancel response
returns the reservation as it stands; it does not hand us a penalty to compute. The rate
plan's cancellation policy is therefore snapshotted onto the booking when it is created, and
every later refund is judged against that snapshot. A policy change at the property can
never retroactively alter a booking we already sold.

**Payment terms belong to the rate plan**, not to the vertical — a rate plan is defined by
its payment terms, refundability and inclusions. Checkout cannot assume every stay is
prepaid; see `02`.

## Validation

Rules, in one place, applied by the same validators the tests use:

- Required fields validate on **blur** and on submit; the submit button is never disabled
  to hide an error — it stays enabled and explains what is missing.
- Phone numbers accept local form and store E.164 (`+2557…`).
- Email is validated syntactically only; deliverability is not a gate.
- Seat selection must match passenger count on **every** leg; a leg short of seats blocks
  continue with a message naming the leg.
- Passenger names must match the travel document exactly — the ticket prints what is
  typed, and operators may refuse amendments.
- Round trips validate both directions independently; the return leg cannot be earlier
  than the outbound arrival.

## States every step must handle

`idle → validating → submitting → success | recoverable error | fatal error`

- **Recoverable** (seat taken, fare changed, hold expired): keep the customer's input and
  offer the specific fix.
- **Fatal** (no inventory, supplier down): explain and offer a route back, never a dead end.
- Route-level navigation shows a pending shell and an error boundary — no blank frames.
- Buttons show in-flight state inline; the page never shows two different loading idioms.

## Hold and expiry

A booking is **held** from selection until payment confirms, and holds expire. The expiry
is visible as a countdown once checkout begins. On expiry the flow returns to review with
the reason stated. Nothing is charged for a lapsed hold, and a lapsed hold never produces
a money row (`02`).

## Round trips

Bus, ferry and train support round trips natively: two legs, one reference, one payment.
The review step shows both legs; the ticket prints one coupon per leg. A one-way price and
a round-trip price must come from the same quote function so a discount cannot drift.

## Cancellation and changes

Post-booking actions live in **manage-booking** (customer) and OIMS (operator). Both use
the same rules: who may act, what it costs, and whether it is a void, a cancel, or an
exchange. Refund wording never promises an amount before the supplier confirms it.

## Definition of done for a flow

A flow is done when a guest with no account can complete it on a phone in under three
minutes, every failure state has distinct copy, the operation appears in the ledger with
the right revenue type, and the ticket prints correctly to A4 and to 80mm.
