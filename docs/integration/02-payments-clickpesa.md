# 02 · Payments and payouts (ClickPesa)

Money in is collection; money out is disbursement. Both go through ClickPesa, which is a
Tanzanian gateway, so **TZS is the native currency** and mobile money is the default
channel, not an afterthought.

## Connection facts

| Item | Value |
|---|---|
| Base URL | `https://api.clickpesa.com/third-parties` |
| Token | `POST /generate-token` with headers `client-id` and `api-key` |
| Token response | `{ success, token }` where **`token` already includes the `Bearer ` prefix** |
| Token lifetime | 1 hour — cache it, do not mint per request |
| Sandbox | **None.** Every call is live and moves real money |
| Pre-KYC limits | TZS 100,000 total across collections/payouts/deposits/withdrawals, and 100 API calls/day **including token generation** |

There is no test environment, so integration is proven with small live amounts and a
strictly-derived pre-KYC budget. Two consequences that shape the code: cache the token for
its full hour, and never fire speculative requests — every preview call spends the daily
quota.

Credentials live server-side only. The browser never sees `client-id`, `api-key`, or a
token, and no endpoint that spends money may be callable from the client.

## Collections (money in)

| Product | Use for | Flow |
|---|---|---|
| **USSD-PUSH** (mobile money) | default for TZ | preview → initiate → customer authorises on handset → webhook/query |
| **Card** | Visa, Mastercard, Amex, UnionPay | preview → initiate → query |
| **BillPay control number** | pay-later, agent-assisted, bank/mobile money outside the app | create order control number → customer pays by number → webhook |
| **Hosted Checkout link** | fastest integration, lowest PCI exposure | generate link → redirect → return URL + webhook |

Endpoint names for reference: `preview-ussd-push-request`, `initiate-ussd-push-request`,
`preview-card-payment`, `initiate-card-payment`, `create-order-control-number`,
`generate-checkout-link`, and the matching `query payment status` by **orderReference**.

### Not every booking collects money

A hotel rate plan is defined by its **payment terms**, refundability and inclusions, so some
rates are settled at the property rather than at checkout. Checkout must therefore be able
to conclude a booking with **no collection at all**, and the ledger must not invent a payment
row for one. This is not a corner case to hand-wave: it changes the revenue type, because
markup requires a guest payment to mark up. A pay-at-property booking earns **commission
owed later**, and the two must be reportable side by side (`04`).

Mobile money providers in scope: M-Pesa, Mixx By Yas, Airtel Money, Halopesa. The provider
is a UI choice, not a hardcoded assumption — it is data supplied with the channel list.

### Card handling

**Recommendation: do not collect card numbers.** Use Hosted Checkout or the embedded
variant so the PAN never touches our origin — it removes PCI scope entirely and is the
only defensible choice for a small team. An inline card form is possible via the Card API
but then we inherit PCI obligations we cannot staff. This is an open question in the
README precisely because it is a business decision, not a technical one.

### Required request shape (mobile money)

```
amount        "10000"        string, no decimals for TZS
currency      "TZS"
orderReference "TRV-A7F2K9-01"  alphanumeric, max 20 characters
phoneNumber   "255712345678"    E.164, no plus
```

`orderReference` is the join key for everything: webhook, status query, reconciliation, and
support. It is **ours**, and it is unique per payment attempt — `PNR-attempt`, not per
booking, because a retry must not be mistaken for a duplicate charge.

## Payment statuses → Travelar

| ClickPesa | Meaning | Travelar |
|---|---|---|
| `PENDING` | awaiting customer action | `awaiting_customer` — show the USSD prompt state |
| `PROCESSING` | in flight | `processing` — poll/webhook, keep the button busy |
| `SUCCESS` | received, **not yet settled to us** | `paid` — confirm the booking, issue the document |
| `SETTLED` | funds in the merchant account | `settled_in` — required before any payout |
| `FAILED` | not successful | `failed` — offer retry with a new reference |
| `ON-HOLD` | needs merchant action | `held_funds` — queue for HQ review, never auto-confirm |
| `REFUNDED` | returned **before** settlement | `voided` — full reversal, no settlement impact |
| `REVERSED` | returned **after** settlement | `refunded` — reversal plus a settlement adjustment |

`REFUNDED` and `REVERSED` are not synonyms and must never be collapsed: one happened
before the money landed, the other after. That difference decides whether a settlement
needs adjusting.

**Booking confirmation is on `SUCCESS`.** Waiting for `SETTLED` would leave customers
staring at a spinner for a day. **Payout is only allowed on `SETTLED`.**

### The confirmation gate (31 October 2026)

Only `SUCCESS` and `SETTLED` issue a ticket — one constant,
`CONFIRMING_COLLECTION_STATUSES`, used by both the webhook and the reconciliation poll.
`PENDING`, `PROCESSING` and `ON-HOLD` never do, however promising they sound.

A collection *attempt* is only ever written as `pending` or `failed`. It used to be possible
for the initiate response to mark the attempt `paid` on the spot; the genuine webhook was
then treated as a replay and the customer never received a ticket. `paid` is now written by
`confirmPayment` alone.

Because a webhook can be lost, `POST /api/internal/sweep` **reconciles open attempts first**:
it asks the provider for each one and confirms only what the provider confirms, using the
reported `collectedAmount` so a shortfall is detected rather than assumed away. Reconcile
runs before expiry, so a booking that was paid is issued rather than swept away.

## Disbursements (money out)

| Product | Use for |
|---|---|
| **Mobile money payout** | operator settlements to a wallet |
| **Bank payout** | operator settlements to NMB / CRDB / GTBank and other listed banks |
| **Lipa Namba payout** | paying a business by its Lipa Namba/TanQR — asynchronous |
| **Payout link** | a link the operator redeems themselves |

Payout flow: **preview → create → webhook/query**. The preview returns the **fee** and the
current **balance**, and the bank preview additionally returns estimated arrival. Always
preview first: it is the only way to know the fee before committing, and it prevents a
guaranteed insufficiency failure.

### Payout statuses

| Status | Meaning |
|---|---|
| `AUTHORIZED` | accepted, **not settled** — never treat as paid |
| `PROCESSING` | in flight |
| `SUCCESS` | disbursed |
| `REFUNDED` | failed, funds returned due to gateway error |
| `REVERSED` | failed, funds returned due to provider error (`reversedWithFee` says whether the fee came back) |

`AUTHORIZED` is the trap. It looks like success and is not. A settlement becomes `paid`
only on `SUCCESS`, and becomes `returned` on `REFUNDED`/`REVERSED` — a distinct state from
`failed`, because money really did leave and come back, and the fee may not have.

## Webhooks

Two levels: **merchant** (all activity) and **application** (activity tied to an app). If
the application has a webhook for the event, it is sent there and the merchant webhook is
not used — so configure application webhooks deliberately, or events vanish.

Events: `PAYMENT RECEIVED`, `PAYMENT FAILED`, `PAYOUT INITIATED`, `PAYOUT REFUNDED`,
`PAYOUT REVERSED`, `DEPOSIT RECEIVED`.

Useful payload fields: `orderReference`, `status`, `collectedAmount`, `collectedCurrency`,
`channel`, `paymentPhoneNumber` (the number that actually paid — not the customer's
profile number), and on payouts `fee`, `beneficiary`, `reverse.reversedWithFee`.

Rules that keep this safe:

1. **Verify before trusting.** ClickPesa publishes a checksum for transactions and supports
   IP whitelisting. Reject unsigned/unknown-origin callbacks; a webhook is an unauthenticated
   POST until proven otherwise.
2. **Idempotent by `orderReference` + status.** Callbacks repeat and arrive out of order.
   Processing the same event twice must change nothing.
3. **Webhooks are an optimisation, not the source of truth.** A scheduled query on every
   open payment is the fallback, because a dropped callback must never strand a paid
   customer.
4. **Never trust the amount.** Reconcile `collectedAmount` against our own expected amount
   before confirming.

## What is implemented, and what the live API actually does

Verified on 30 October 2026 against the production API with the credentials in `.env`.

### Checksum (their algorithm, implemented in `src/server/payments/checksum.ts`)

1. Recursively sort every object key alphabetically, at every nesting level.
2. Serialise to compact JSON (no whitespace).
3. HMAC-SHA256 with the checksum secret.
4. Hex digest, 64 characters.

`checksum` and `checksumMethod` are **excluded** from the computation. Arrays keep their
order; only object keys are sorted. The same digest signs an outbound collection request
and verifies an inbound webhook, so there is one implementation, not two that can drift.

**Changing checksum settings on the account invalidates existing tokens** — their docs say
so explicitly. A token minted before the change will start returning 401.

### Two places their documentation and the live API disagree

| Documented | Actual | Consequence |
|---|---|---|
| `GET /payments/{orderReference}` returns **404** when the reference is unknown | Returns **400** with `"Invalid or missing payment: <ref>"` | A status poll before the push lands would have thrown. The adapter maps 400 to `pending`, not to an error |
| `collectedAmount` is a **string** in the webhook, an **integer** in the status response | Confirmed: both shapes occur | Parse defensively; never assume a type across the two endpoints |

### Order reference

Alphanumeric only, maximum 20 characters, unique per **attempt** (a reused reference is
rejected with 409). `TRV-ABC123` becomes `TRVABC12301` on the first attempt and
`TRVABC12302` on a retry: `src/server/payments/order-reference.ts`. It is stored on
`app.payment.order_reference` because it is the join key for the request, the status query
and the webhook.

### Routes

| Direction | Route | Authentication |
|---|---|---|
| Outbound collection | `POST /api/payments/start` → `initiate-ussd-push-request` | Server-side only; `CLICKPESA_LIVE` must be `true` |
| Inbound webhook | `POST /api/payments/clickpesa` | Their `checksum` over the payload; no checksum → 401 |
| Status fallback | `getCollectionStatus()` | Bearer token, cached one hour |

Configure the application webhook URL in the ClickPesa dashboard as
`https://<your-host>/api/payments/clickpesa` for `PAYMENT RECEIVED` and `PAYMENT FAILED`.
Only `SUCCESS` and `SETTLED` issue a ticket; `SUCCESS` is enough because settlement gates
payouts, not boarding.

### The token cache must survive between requests

`getPaymentProvider()` originally built a new provider per request. Each instance holds its
own bearer token, so the hour-long cache was thrown away every time and a token was minted
on **every payment attempt**. ClickPesa throttles that with `429 Too many token requests.
Try again in 66 seconds`, which the app reported as a generic provider failure. The factory
is now a process-wide singleton; tests inject their own `fetch` and still get an isolated
instance.

Because token minting is rate-limited and pre-KYC accounts have 100 calls a day, avoid
restarting the server in a loop against live credentials: every restart mints one token.

### What the live account can actually collect

`node scripts/clickpesa-preview-probe.mjs` (two API calls, no money moved) confirmed on
31 October 2026 that the account validates collections and reports these active methods for
a TZS 1,000 request:

| Method | Status | Fee |
|---|---|---|
| TIGO-PESA | AVAILABLE | 102 |
| AIRTEL-MONEY | AVAILABLE | 92 |
| HALOPESA | AVAILABLE | 92 |
| M-PESA | **not returned** | — |

Two consequences. **M-PESA is not an active collection method on the application**, so an
M-Pesa number is likely to fail at initiate until it is enabled in the ClickPesa dashboard.
And the wallet buttons in checkout are presentational: ClickPesa routes a USSD push by the
phone number's network, not by a field we send. The fee is real (about 10% at this amount)
and is **not** in our quote — whether the customer or Travelar bears it is a commercial
decision that has not been made.

### Current state

The credentials are live and authenticated (token minted, checksum secret present), but
`CLICKPESA_LIVE` is **not** set, so the adapter still refuses to contact the provider. That
switch is the only difference between this code and collecting real money, and neither the
flag nor a live collection is set by tooling — flipping it starts sending USSD pushes to
customers' phones for real amounts.

### Preview, and why card is not a free choice

`POST /api/payments/preview` wraps `preview-ussd-push-request`: it validates the amount,
the reference and the phone number, and returns each active wallet with its fee. It opens
no payment attempt — a look must not consume the one open attempt per booking. It costs one
API call, so it is an explicit action, not something the page fires while the customer types
(100 calls/day pre-KYC, token generation included).

**Card payments are USD-only.** Both `preview-card-payment` and `initiate-card-payment`
declare `currency: enum [USD]` in their OpenAPI, and the initiate endpoint returns a
`cardPaymentLink` — a hosted page, so the PAN never reaches this origin. A TZS fare cannot
be charged through these endpoints. The adapter refuses a non-USD fare with
`card_requires_usd` *before* calling the provider, and the checkout tells the customer to use
mobile money. Charging TZS to a card needs either a USD fare (flights/stays) or a different
ClickPesa product (hosted checkout) — a commercial decision, not a code change.

### Failures the customer can act on

The confirmation page now prints the reason the collection did not start: provider not
enabled, provider not configured, card-but-not-USD, method unsupported, or phone rejected.
A generic "something went wrong" left the customer with no idea whether to retry, switch
method, or call support.

### Reconciliation

Three sources must agree daily: our ledger, our payment records, and the ClickPesa
statement (`get account statement`, `get account balance`). The invariant:

```
Σ confirmed payments − Σ refunds/reversals = Σ settlements paid + unsettled balance
```

Any payment `SUCCESS` with no confirmed booking is an exception queue item, not a silent
orphan. Any booking confirmed with no payment is worse — it is stopped at the gate by
confirming only on `SUCCESS`.

## Settlement, TIPS, and money that is "in the air"

**TIPS** (Tanzania Instant Payment System) is the Bank of Tanzania's national real-time
switch: 24/7/365, ~1.5 million transactions a day, 45 connected providers, and — the part
that matters here — **same-day settlement**, not instant settlement, with **transaction
reversal** as a first-class feature. TIPS settles between institutions; it does not settle
to a merchant.

That gives three separate facts, and conflating them is how systems lose money:

| Fact | Who knows it | What it means for us |
|---|---|---|
| The wallet was debited | The customer's phone, then the provider | Money exists and belongs to someone. Payment status `SUCCESS`. |
| The merchant account was credited | ClickPesa, same-day | `SETTLED`. Waiting for this delays tickets by a day, so we do not wait for it. |
| The money can still come back | TIPS reversal, provider dispute, failed credit to the merchant | A ticket we already issued can become void. |

So "isn't it settled?" — no. Instant *processing* is not instant *settlement*, and TIPS
reversal means even a completed payment is not final in the sense a ticket needs. The gate
stays where it is: **issue on `SUCCESS`** (the customer's money has left their wallet),
and treat reversal as a real event rather than an impossibility.

### The three limbo states, and what we do with each

**1. The customer approved, money left, and the provider has not decided.** The attempt sits
`pending` with a provider reference. We do not issue, and we do not expire it — calling it
expired would be a claim we cannot support while money may be in flight. The sweeper asks
the provider until it answers; `pending`/`processing`/`on-hold` never issue. If the booking's
hold lapses first, the booking is released and the attempt stays open: a later `SUCCESS`
finds no inventory, so the money becomes `unallocated` — a refund we owe, recorded, not lost.

**2. The money goes back to the customer after we issued.** This is the TIPS reversal path,
and it is now handled end to end by `reversePayment`. In one transaction: the payment row
moves to `reversed` (settled then taken back) or `refunded` (returned before settlement),
the booking becomes `refunded`, the passengers become `cancelled` so the seat returns to
inventory, and — never editing the original document — a **reversal ledger row** is
appended pointing at the entry it cancels. Idempotent: a repeated reversal status changes
nothing. A reversal that arrives *before* issue only fails the attempt; there is no ticket
to void.

**3. The money left but our record cannot prove it.** `unallocated` rows without a provider
reference. These are not refund obligations yet — paying them would be refunding money we
may never have received. `scripts/audit-sales.mjs` prints them separately from the real
queue, so nobody refunds an unprovable row.

### Checking the books

`node scripts/audit-sales.mjs` asserts five invariants and prints the two queues that
represent money owed to somebody:

- `issued_without_payment`, `paid_without_ledger`, `refunded_without_reversal`,
  `orphan_reversals`, `seat_state_wrong` — all must be `0` (exit code 1 otherwise).
- `owedToCustomer` — `unallocated` with a provider reference: real refunds to pay out.
- `unverifiedPayments` — `unallocated` without one: investigate before paying.
- `inFlight` — attempts the provider has acknowledged and never resolved.

## Fees are costs, never revenue

Collection and payout fees are recorded as `cost` on the money row, separately from
revenue. A settlement's `payable` and the operator's `netDisbursed` will therefore differ
by the payout fee — both are stored, and the difference is shown on the statement, so the
operator never has to ask where money went.

## Failure copy (customer-facing, Travelar voice)

| Case | What the customer sees |
|---|---|
| USSD not authorised in time | "We didn't get a confirmation from your phone. Send it again?" |
| Insufficient funds | "Your wallet declined the payment. Try another method." |
| Card declined | "That card was declined. Nothing has been charged." |
| Paid but booking unconfirmed | "Payment received — confirming your booking." Never "failed" |
| Gateway error | "We couldn't reach the payment service. Your booking is still held for N minutes." |

Quiet, specific, no blame, and always states whether money moved.
