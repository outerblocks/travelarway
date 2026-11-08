# 04 · HIMS and OIMS: modules, flows, governance

The money model is specified in
[../superpowers/specs/2026-10-28-hims-governance-finance-design.md](../superpowers/specs/2026-10-28-hims-governance-finance-design.md).
This document covers what the two consoles *are*: their modules, the actions in each, how
confirmation and approval work, and what is logged.

`HIMS` = Travelar HQ. `OIMS` = one operator, scoped to their own data.

## Modules

| Console | Module | Purpose | Key actions | Permission |
|---|---|---|---|---|
| HIMS | Overview | Health of the marketplace | filter, drill into a mode | `hq.finance.view` |
| HIMS | Operators | Onboard and govern partners | create, edit, suspend, approve, set commission/markup | `hq.operators.*` |
| HIMS | Users & invites | Staff accounts | invite, resend, revoke, suspend | `hq.users.manage` |
| HIMS | Roles & departments | Configurable org model | create/clone/edit/delete role, edit department, assign | `hq.roles.manage` |
| HIMS | Approvals | Decisions waiting on a human | approve, reject, withdraw | `hq.approvals.decide` |
| HIMS | Finance | Revenue per operator **per mode** | view, export, drill to booking | `hq.finance.view` |
| HIMS | Settlements | Automated payouts | view, retry, repair | `hq.finance.settle` |
| HIMS | Audit log | Who did what, immutably | filter, export | `hq.audit.view` |
| HIMS | Settings | Cadence, currencies, policy | edit policy rules, cadence | `hq.settings.manage` |
| OIMS | Bookings & manifest | Today's departures | view, check in, print manifest | `oims.manifest.view` |
| OIMS | Routes & schedules | Inventory | create/edit/retire | `oims.routes.manage`, `oims.schedules.manage` |
| OIMS | Fleet & vessels | Capacity and classes | create/edit/retire | `oims.fleet.manage`, `oims.vessels.manage` |
| OIMS | OTC sales | Counter sales | sell, void same-day | `oims.otc.sell` |
| OIMS | Finance | What this operator earned | view statement, export | `oims.finance.view` |
| OIMS | Users | Staff by department | invite, edit, deactivate | `oims.users.manage` |

Navigation is **filtered by permission**, not merely guarded. A user who cannot settle
never sees the Settlements entry; a disabled-looking button is a bug.

## Roles at launch

| Role | Scope | Intent |
|---|---|---|
| HQ Admin | `hq` | Everything, decides approvals |
| HQ Finance | `hq` | Sees money, requests rate changes and refunds, cannot decide |
| HQ Support | `hq` | reads operators and bookings, invites nobody |
| Operator Admin | `operator` | Runs one operator: staff, inventory, sees finance |
| Operator Finance | `operator` | Statements and exports only |
| Operator Ops | `operator` | Schedules, fleet, manifest |
| Operator Sales | `operator` | OTC sales and manifest |

These are seeded permission sets, not code branches. Creating a new OIMS role is a
checkbox exercise in HQ.

## Primary flows

**1 · Onboard an operator.** HQ creates the operator (name, mode, country, currency,
commission or markup rate, settlement beneficiary) → submits for approval → HQ Admin
approves with a reason → operator becomes `active` → invite its first admin. Nothing about
an operator is live before approval.

**2 · Invite and accept.** HQ or an operator admin invites an email with a role and
department(s) → status `pending`, token with expiry → invitee opens the link, sets **their
own** password, accepts → account `active`, lands in the right console. An admin never sees
or sets another person's password; the only admin password action is **reset**, which
re-issues an invite.

**3 · Change a rate.** HQ Finance proposes a commission/markup change with an effective
date and a reason → approval item → HQ Admin decides → the new rate applies from that date
and every earlier booking keeps its original rate.

**4 · Refund.** An operator or HQ Finance requests a refund → the estimated amount comes
from a quote, never a guess → HQ Admin approves with a reason → the payment is reversed
through the gateway → ledger gets a reversal row, and the next settlement adjusts.

**5 · Settlement run.** Automatic. Collect `issued` and `earned` entries per party and
currency for the closed period → compute `payable` → preview the payout (fee, balance) →
create the payout → wait for `SUCCESS` → mark entries `settled`. `AUTHORIZED` is not paid.
A `REFUNDED`/`REVERSED` payout reopens the settlement as `returned`.

**6 · Operator invites staff.** Operator Admin invites by role and department; the invite
is scoped to their operator only. HQ sees the account, never its password.

## Actions and confirmations

Every mutating action declares its risk:

| Risk | Examples | Interaction |
|---|---|---|
| Low | edit a schedule time, rename a department | inline save, undo toast where reversible |
| Medium | suspend a user, retire a route, revoke an invite | `ConfirmDialog`, consequence sentence, primary verb = the action |
| High | approve an operator, change a rate, refund, settle now | `ConfirmDialog` + **mandatory reason** + approval where the matrix requires it |
| Destructive bulk | bulk cancel bookings, bulk payout | typed confirmation of the count, never a single click |

The dialog standard: title states the action; one sentence states what changes and what
cannot be undone; the confirm button repeats the verb ("Suspend", not "OK"); a cancel is
always available and focused second. Nothing irreversible happens on a toast.

## Approval matrix

| Action | Who requests | Who decides | Reason |
|---|---|---|---|
| Onboard / suspend operator | Support | HQ Admin | yes |
| Role or permission change | Admin | HQ Admin | yes |
| Rate change | Finance | HQ Admin | yes |
| Refund / void above threshold | Finance / Ops | HQ Admin | yes |
| Booking policy rule change | Finance | HQ Admin | yes |
| Invite staff | Admin (own scope) | none | no |
| Settlement run | system | none | n/a |

Manual maker-checker is deliberately **not** applied to settlement execution — it is
automatic and audited. It is applied to policy, identity, and refunds, which are the things
a person should not be able to do quietly.

## Audit and logging

**Audit events** are business history and are immutable: `id`, `at`, `actorId`, `actorRole`,
`action`, `targetType`, `targetId`, `before`, `after`, `reason?`, `correlationId`. Every
approval decision, permission change, operator state change, refund, settlement run and
policy edit writes one. The log is append-only, filterable by actor/target/date, and
exportable.

**Operational logs** are diagnostic, not history: structured, one line per request, with a
`correlationId` that appears in the UI on error so support can find the exact request.
Never logged: passwords, tokens, API keys, full card data, full phone numbers (mask all but
the last three), or full passenger identity numbers. Retention follows the privacy policy;
audit outlives logs.

## Finance surface

- Statement per operator **and per mode** — gross, commission or markup, supplier cost,
  fee, revenue, settled, outstanding. Never a single blended number.
- Every figure drills to the underlying bookings and documents.
- Exceptions queue: paid-but-unconfirmed, confirmed-but-unpaid, payout returned, refund
  pending, amount mismatch. Each has an owner and a resolution path, and none auto-resolves
  silently.
- Reconciliation check runs on load and shows a pass/fail, not a number nobody reads.
- CSV export mirrors the on-screen columns exactly.

## Console behaviour

Empty states explain what to do next, never a sad icon. Errors say what failed and what to
do. Loading is a skeleton. Tables keep filters in the URL so a support person can send a
link. Long lists paginate server-side. Any number that can be wrong shows when it was last
computed.
