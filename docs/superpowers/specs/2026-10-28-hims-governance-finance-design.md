# HIMS: governance and finance design

Date: 2026-10-28
Status: proposed (awaiting review)

## Why

HIMS today is one read-only screen: filters, four KPIs, an operators table whose only
write is a bare `hqApproved` toggle, and a bookings list. There are no accounts, no
roles, no invitations, no audit trail, no commission, no settlements. OIMS inherits
that gap, so operator actions feel broken: the screens are views over seed data.

This spec defines the governance and money layer HIMS needs, and the OIMS changes that
depend on it.

## Revenue model (decided)

Two primitives, assigned per mode, never blended:

| Modes | Primitive | Travelar earns | Party receives | Basis |
|---|---|---|---|---|
| Bus, Ferry, Train | **Commission** | `gross × rate` | `gross − commission` | Contracted rate per operator, per mode, effective-dated |
| Flights, Stays, Experiences | **Markup on net** | `gross − supplierNet` | `supplierNet` | Net rate from the supplier, marked up for sale |

Evidence for the markup side: Travelport's Flights Pricing Guide lets a shop request
**net fares** — "consolidator fares, or any negotiated wholesale price that is further
marked up for sale to customers" — and its `Price` object returns base fare, taxes and
fees per passenger type separately. Airline-paid commission on flights is largely
historic, which is why flights are markup, not commission.

Two constraints the supplier glossary makes explicit. Net fares are unlocked **only by
sending an account or corporate code**, and **NDC carriers generally do not offer net
fares** — so on NDC content there is no spread to earn and revenue must come from the
declared service fee. And net-fare content returns **net ticket data**, which can itself
carry commission plus the base-ticket (`BT`) or inclusive-tour (`IT`) fare type. A flight
row therefore stores `fareBasisType` and may hold real markup *and* real commission at
the same time; assuming "commission *or* markup" per booking would silently drop revenue.

One qualification, surfaced by the Stays documentation: a hotel rate plan is defined by its
**payment terms**, refundability and inclusions, so a rate settled at the property is never
charged by us. Markup is unavailable on such a row because there is no guest payment to mark
up; the revenue is **commission owed by the property later**. The rule therefore holds per
**row**, not per mode: a prepaid stay row is markup, a pay-at-property stay row is
commission, and both must be reportable side by side. The business decision is whether we
sell non-prepaid rates at all.

Optional third stream, **client service fee**, is a per-mode switch, off by default. When on,
it is a disclosed line in the fare breakdown and counts as revenue, reported apart from
commission and markup.

### Fare decomposition is mandatory

Every ledger row stores `base`, `taxes`, `fees`, `ancillaries` and `gross`
(`gross = base + taxes + fees + ancillaries` up to supplier rounding). Supplier-paid
costs we incur — card/OB fees where the supplier returns them — are recorded as
`costs`, so "revenue" is never mistaken for "profit".

### Documents are the unit of money

For air, money is recognised on a **document**, not on a reservation. Travelport
addresses tickets by ticket number (`GET /air/ticket/tickets/{Identifier}`), issues
ancillaries as EMDs, returns receipts per document, and its void and refund APIs act on
those documents. One reservation can therefore produce several documents — one per
passenger, one per ancillary — so a ledger row carries `documentType` (`ticket` | `emd`
| `receipt` | `voucher`) and `documentNumber`, with the booking as its parent. Modes
that issue no supplier document (bus, ferry, train, stays, experiences) use our own
voucher number, so every ledger row has exactly one anchor.

### Revenue is earned at issuance, not at booking

Holding a reservation and issuing a document are separate steps, and a reservation can
sit committed and then lapse or be cancelled unticketed. Commitment and earning are
therefore separate states:

`held → issued (earned) → settled`, with `lapsed`, `voided` and `refunded` terminal.
Only `issued` rows carry revenue. A `held` row is a liability with zero revenue, and it
expires if the document is never issued. `settled` is reachable only from `issued`.

### Reversals, never edits

Refund, void and exchange produce **new** ledger rows with negative amounts and a
`reverses` link. A settled booking that is later refunded produces a receivable
adjustment in the next settlement, not a mutation of history.

### Void, cancel, refund, exchange: four different events

They are never conflated, because they move different amounts of money.

- **Void** is a same-day right, generally until midnight in the agency's local time. It
  reverses the document and its payment in full, so a voided row nets to zero and never
  reaches a settlement.
- **Cancel** is ending a ticket after the void window. Whether money comes back — all,
  some, or none — is decided by the fare rule, not by us.
- **Refund** is the money outcome of a cancel, and it is quoted before it is committed
  (`refundquote` / `documentrefundquote`). A cancellation penalty is recorded as a
  `cost`: it is the supplier's fee, not a discount on our revenue. Refund confirmation
  can be asynchronous, so a row becomes `refunded` only when the supplier confirms.
- **Exchange** issues a new document for a changed itinerary; it is not a fresh sale
  (see below).

Reversal is per **document** and may be **partial**: carriers do not all support
cancelling a booking that carries ancillaries or seats, and a divided booking produces
separate reservations. Involuntary refunds — the airline cancels — are not supported by
the API and so go through the manual repair path with approval and a reason.

### Exchanges are deltas

An exchange reshops, reprices, and returns a `ModifyPrice` itemising the difference
between the new fare and what was originally paid. Accounting follows that delta, never a
second full sale:

- the original document is reversed and the new document is issued with its own row;
- an **add collect** (new price higher) is extra passenger money, and is revenue only to
  the extent that it is our markup — the remainder is the supplier's fare;
- a **residual MCO** (new price lower) is credit owed to the passenger: a **liability,
  never revenue**;
- an exchange or change **penalty** belongs to the supplier, while a change fee we charge
  is ours and is recorded as `service_fee`.

The same workflow minus the refund quote modifies or cancels a **held** booking, which
moves no money at all, because a held row has no revenue yet.

## Identity and organisation

- **Account**: id, name, email (unique, normalised), password hash, status
  (`invited`, `active`, `suspended`), scope (`hq` | `operator`), `operatorId?`,
  `roleId`, `departmentIds[]`, `createdAt`, `lastSignInAt`.
- **Role**: id, name, scope (`hq` | `operator`), `permissions[]`. Roles are
  **configurable**: HQ admins create, rename, clone and delete roles, including new
  OIMS roles, from the permission catalogue.
- **Department**: id, name, `operatorId?` (HQ departments have none). Configurable.
- **Invitation**: id, email, scope, `operatorId?`, `roleId`, `departmentIds[]`,
  token, `expiresAt`, status (`pending` | `accepted` | `revoked`), `invitedBy`,
  `acceptedAt`. Accepting sets the invitee's own password; an admin never chooses it.

### Permission catalogue (namespaced, checked per action)

`hq.operators.view|manage|approve`, `hq.users.manage`, `hq.roles.manage`,
`hq.approvals.decide`, `hq.finance.view`, `hq.finance.settle`, `hq.audit.view`,
`hq.settings.manage`,
`oims.routes.manage`, `oims.schedules.manage`, `oims.fleet.manage`,
`oims.vessels.manage`, `oims.manifest.view`, `oims.otc.sell`, `oims.finance.view`,
`oims.users.manage`.

Seeded roles: HQ Admin, HQ Finance, HQ Support, Operator Admin, Operator Finance,
Operator Ops, Operator Sales. Each is just a permission set, so a new role is a
checkbox exercise, not a code change. Navigation and every mutating control check the
permission; unauthorised actions are hidden, not silently inert.

## Governance

Even with automated money movement, policy changes stay controlled:

| Action | Approval | Reason required |
|---|---|---|
| Operator onboarding / suspension | HQ Admin | yes |
| Role or permission change | HQ Admin | yes |
| Commission or markup rate change | HQ Admin (requested by HQ Finance) | yes |
| Refund / void | HQ Finance requests, HQ Admin decides | yes |
| Booking policy rule change | HQ Admin | yes |
| Invite staff | requester's own scope | no |
| Settlement run (automatic) | none | n/a |

`ApprovalRequest`: id, type, payload, `requestedBy`, `requestedAt`, status
(`pending` | `approved` | `rejected` | `withdrawn`), `decidedBy`, `decidedAt`,
`reason`. Every decision writes an `AuditEvent` (id, actorId, action, targetType,
targetId, before/after summary, at).

All destructive or financial actions open the shared `ConfirmDialog` with the
consequence spelled out and, where the matrix says so, a mandatory reason.

Booking-time policy is enforced, not assumed. Travelport exposes agency **custom
rules** — stored per PCC as named rule records, suspendable and reactivatable, bound to
a reservation workbench. We keep the same shape instead of burying limits in UI code:
an operator policy set (maximum fare, advance purchase, refundability, permitted modes)
that HIMS configures, OIMS applies before a booking is committed, and that refuses with
a stated reason. Creating, editing or suspending a rule is approved and audited like any
other governance action.

## Money: ledger, settlements, statements

**LedgerEntry** (one per document, plus one per reversal):

```
id, bookingId, documentType, documentNumber,
partyType ('operator' | 'supplier'), partyId, mode,
posCountry, fareBasisType? ('base_ticket' | 'inclusive_tour'),
departmentId?, agentAccountId?, accountCode?,
revenueType ('commission' | 'markup' | 'service_fee'),
currency, base, taxes, fees, ancillaries, gross,
supplierCost, costs, revenue,
addCollect?, creditInstrumentId?,
status ('held' -> 'issued' -> 'settled', else 'lapsed' | 'voided' | 'refunded'),
settlementId?, reverses?, heldAt, issuedAt, settledAt
```

Rules: `revenue = commission ? gross × rate : gross − supplierCost`; commission entries
carry `supplierCost = gross − commission`; markup entries carry
`supplierCost = supplier net`.

Attribution is not optional. Every row records the party, the mode, the department and
the staff account that sold it. Travelport's accounting remarks exist to push exactly
this to the back office — remark names `TK` (ticket number), `AC` (agent, account or
branch) and `X*` (back-office accounting codes) — so these row fields mirror what is
sent to the supplier rather than being private bookkeeping invention. Corporate and
account codes (`addcorporatecode`, and the account identifiers used to fetch negotiated
fares) live in `accountCode`, because they determine which fare was sold and therefore
the cost basis. `posCountry` is recorded because the point of sale decides the taxes,
fees and ticketing time limit — the same itinerary sold in Dar es Salaam and Nairobi is
not the same money, which is also what makes the per-market rollout safe.

Four things must never produce a ledger row: a **held** booking (no document, no
revenue), a **shell** booking created when a commit fails before offers are added, an
**MCO** credit, and a cancelled held booking. They are real records in the operations
store, and none of them is money we earned.

**Settlement** (automated, no holding): party, currency, `periodStart`/`periodEnd`,
`entryIds`, `payable`, `payoutFee`, `netDisbursed`, status (`scheduled` | `submitted` |
`paid` | `returned` | `failed`), `paidAt`, `reference`, `failureReason`. A settlement
closes **daily per party per currency** (cadence configurable in HIMS settings) and moves
entries `issued -> settled`. Failures surface for retry; "settle now" exists only as an
admin repair action behind a confirmation and a reason.

Disbursement runs through the payment gateway's payout API, which constrains the states:
`submitted` is the gateway's acknowledgement and is **not** payment (`AUTHORIZED`), `paid`
requires `SUCCESS`, and `returned` covers a payout that failed after funds left and came
back. The preview call returns the fee before commitment, so `payable - payoutFee =
netDisbursed` is stored and shown rather than inferred. A settlement may only draw on
collections the gateway reports as **settled**, never on merely received funds.

**Statements**: per operator **and per mode**, with columns gross, commission or markup,
supplier cost, revenue, settled, outstanding. HIMS rolls operators up with modes shown
separately — never a single blended figure. Suppliers (flights/stays/experiences) get
the same statement under the markup columns.

**Reconciliation invariant** (asserted in tests and shown on the Finance screen):
`Σ ledger.revenue = Σ settlements.revenue + Σ unsettled revenue`, and for each party
`Σ settled entries = Σ settlements.payable`.

## Screens

HIMS (own shell, same layout primitives as OIMS, nav filtered by permission):
Overview · Operators · Users & invites · Roles & departments · Approvals · Finance
(statements, per mode) · Settlements · Audit log · Settings (cadence, currencies).

OIMS: Users (by department, invited by the operator admin), Finance (earnings,
commission or markup, settlements, per mode), and permission checks on every existing
section (Routes, Schedules, Fleet, Vessels, Manifest/OTC, Analytics).

## Delivery slices

**A - Identity and governance.** Accounts, roles, departments, invitations and the
accept/password pages, sign-in routed by scope, HIMS shell and its governance screens,
operator CRUD with confirmations, approvals queue, audit log.
*Acceptance:* an HQ admin can add an operator, invite its admin, and that invitee can
set a password and land in OIMS; every governance action appears in the audit log;
permission-gated controls are absent for roles without them.

**B - Money.** Commission and markup rules, ledger writes from bookings (including
fares decomposition), per-mode statements, daily automated settlements, failures and
retry, reconciliation check, CSV export.
*Acceptance:* a bus booking and a flight booking each produce a correct ledger row with
the right revenue type; a flight row earns only when its document is issued, and a void
before issuance leaves no revenue; an exchange adjusts revenue by the delta instead of
recording a second sale; statements tie to ledger; settlement turns `issued` into
`settled`; the reconciliation invariant holds.

**C - OIMS parity.** Operator users by department, operator finance view, permission
enforcement across existing sections.
*Acceptance:* an Operator Sales user sees Manifest/OTC but not Fleet or Finance; an
Operator Finance user sees statements but cannot sell.

## Non-goals and caveats

- No server. Accounts, hashes and sessions are client-side for this demo; passwords are
  hashed (never stored in clear) and the API will own credentials, rate limits and
  authorisation later. This is stated in code, not assumed.
- Supplier integration (Travelport/Sabre) is not in these slices. Supplier net, taxes,
  fees and OB costs arrive through the same ledger columns when the adapter lands.
- Money is stored as whole currency units (TZS has no practical minor unit; USD amounts
  are whole dollars) until the API defines minor units per currency.
- Cancellation policy, VAT and payout tax withholding are out of scope here.
