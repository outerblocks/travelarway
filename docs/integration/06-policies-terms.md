# 06 · Policies and terms

**Status: drafting scaffold, not legal advice.** It fixes the *structure*, the *statements
we must be able to defend*, and the *decision points* that belong to the business. Every
value marked "decision required" is a commercial choice, not an oversight, and the final
text needs review by a Tanzanian-qualified lawyer before it goes live.

## Terms of service

| § | Section | Must say |
|---|---|---|
| 1 | Definitions | Travelar, Customer, Operator, Ticket, Booking reference, Service fee |
| 2 | Who we are | Travelar is a booking and payment agent. We sell on behalf of operators; we do not operate the vehicle, vessel, train, property or experience |
| 3 | Accounts | Guest booking allowed; account optional; one person per account; accurate details |
| 4 | Formation | A booking is formed when payment is confirmed and a reference is issued. Held bookings expire and create no obligation |
| 5 | Prices | Currency, what the fare includes, taxes and fees shown separately, service fee disclosed when charged, price change before payment |
| 6 | Payment | Methods, gateway, authorisation vs settlement, failed payments, duplicate-payment handling |
| 7 | Ticket | What the ticket is, that it must be presented, that the name must match the travel document |
| 8 | Changes and cancellation | Pointer to the cancellation policy; that operator rules govern the fare |
| 9 | Operator obligations | Provide the service as sold, honour confirmed seats, keep inventory true |
| 10 | Liability | Scope, exclusions, and the fact that the operator remains responsible for carriage |
| 11 | Force majeure | Weather, strikes, breakdowns, government action, and what we will do |
| 12 | Complaints | How to raise, response expectations, escalation |
| 13 | Governing law | Tanzania; courts; language of the agreement |
| 14 | Changes to terms | Notice, version date, effect on existing bookings |

## Cancellation and refund policy

Each row is a commercial decision to be fixed, then enforced by the same rules engine the
console uses. Nothing here may promise an amount the supplier has not confirmed.

| Mode | Who decides | Refund basis | Decision required |
|---|---|---|---|
| Bus | operator | time-before-departure bands | band percentages and cut-off times |
| Ferry | operator | time-before-sailing bands | bands, and treatment of resident/non-resident fares |
| Train (SGR) | railway | railway's published rules | whether we pass through only, or add a fee |
| Flights | airline fare rule | fare rule + supplier penalty | whether we charge a change fee |
| Stays | the rate plan **snapshotted at booking** | refundable vs non-refundable | whether a service fee is retained |
| Experiences | operator | operator's policy | cut-off for free cancellation |

Universal rules, regardless of the table:

1. A **void** is same-day, reverses in full, and is the only case where money returns
   immediately.
2. A **cancel** after the void window follows the fare rule, and the amount is **quoted
   before** it is committed.
3. Supplier cancellation penalties are passed through as incurred; our own fee, if any, is
   shown as a separate line.
4. **Refund timing depends on the method.** Mobile money returns to the paying wallet; cards
   may take longer. We state the range we actually observe, not an aspiration.
5. A refund is complete when the gateway confirms it. Until then the status is "refund
   pending" and the copy says so.
6. Involuntary cancellations by the operator are handled outside the automated path: full
   assistance, human decision, no fee of ours.

## Payment terms

- Prices are in TZS unless the fare is denominated otherwise; the currency is shown before
  payment and on the ticket.
- A payment is **received** on gateway success and **settled** when funds reach Travelar's
  account. Customers are confirmed on received; operators are paid on settled.
- A booking is not confirmed by a pending authorisation, an USSD prompt left unanswered, or
  a control number that has not been paid.
- Duplicate payments are identified by reference, refunded to the payer, and never credited
  twice to a booking.
- Chargebacks and reversals are investigated against the ledger; a reversed payment voids
  the associated earning.

## Passenger obligations

Correct names as per the travel document; valid identification carried; arrival before
departure as specified by the operator; luggage within allowance; dangerous goods
prohibited; children and unaccompanied minors per operator policy; wheelchair and assistance
requests made in advance. Where we cannot verify a requirement in advance, we say so.

## Operator (partner) agreement

- **Commercial basis** — commission for Bus/Ferry/Train; markup on net for
  Flights/Stays/Experiences; rates effective-dated, never retroactive.
- **Settlement** — automated on the agreed cycle, to the nominated wallet or bank account,
  with a statement per mode; fees shown separately.
- **Inventory truth** — published capacity and schedules must be accurate; overselling is a
  breach, not an accident.
- **Manifest and check-in** — OIMS reflects confirmed bookings in real time.
- **Service standards** — punctuality, vehicle condition, and the operator's own complaint
  handling.
- **Money owed to us** — refunds we process on the operator's behalf are deducted from the
  next settlement, with the deduction itemised.
- **Suspension** — grounds, notice, and the treatment of already-sold tickets.
- **Data** — operators see only their own customers' data, for service delivery, nothing else.

## Privacy

- **What we collect**: name, contact details, travel document details for the passenger,
  booking history, payment references. **We never store card numbers** — the gateway holds
  them.
- **Why**: to sell and deliver the ticket, to take payment, to support the journey, to meet
  legal and accounting duties.
- **Who sees it**: the operator carrying the passenger, the payment gateway, and suppliers
  needed to issue the ticket. Not advertisers.
- **Retention**: booking and financial records for the period accounting law requires; audit
  events longer than logs; marketing consent withdrawable at any time.
- **Rights**: access, correction, deletion where lawful, objection, and a complaint route.
- **Transfers**: some suppliers process outside Tanzania; disclosed, with the safeguard
  relied on.
- **Legal frame**: Tanzania's Personal Data Protection Act, 2022 — **to be confirmed in
  review**, along with registration duties if we act as a data controller.

## Cookies

Three categories only: **essential** (session, security, payment continuity), **preferences**
(language, market), **analytics** (aggregate, first-party). No advertising or cross-site
tracking by default. A banner offers accept/reject with equal prominence, and preferences
are changeable later. Essential cookies are never gated behind consent.

## Accessibility

We aim for WCAG 2.2 AA on the public site and both consoles: semantic structure, keyboard
operation, visible focus, sufficient contrast, and no motion that cannot be reduced.
Accessibility problems go through the same support channel as any other defect.
