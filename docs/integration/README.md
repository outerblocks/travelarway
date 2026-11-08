# Travelar integration pack

A single source of truth for what Travelar is, how a booking becomes money, and how the
operations side (HIMS/OIMS) governs it. Written so an integrator, a designer, or a new
engineer can build without asking us questions.

Everything here describes **Travelar's** product and brand. Suppliers (Travelport, Sabre,
SGR/TRC, ClickPesa) appear only as plumbing and never in customer-facing copy.

## Contents

| Doc | What it answers |
|---|---|
| [01-booking-flows.md](01-booking-flows.md) | How a customer goes from search to a ticket, per mode, as a guest or with an account |
| [02-payments-clickpesa.md](02-payments-clickpesa.md) | How money comes in and goes out: auth, methods, statuses, webhooks, reconciliation |
| [03-checkout-and-ticket-design.md](03-checkout-and-ticket-design.md) | The new checkout and ticket/printing design, section by section |
| [04-hims-modules.md](04-hims-modules.md) | HIMS/OIMS modules, roles, actions, confirmations, approvals, audit, finance, workflows |
| [05-public-website.md](05-public-website.md) | Public site structure, section inventory, and content rules |
| [06-policies-terms.md](06-policies-terms.md) | Terms, cancellation/refund policy, privacy, cookies, partner terms |

## Actors

- **Customer** — books as a guest or with an account. Never forced to register.
- **Operator** — bus, ferry, train, or property/experience supplier. Uses **OIMS**, scoped
  to their own data only.
- **Travelar HQ** — uses **HIMS**. Onboards operators, controls roles and policy, sees
  money across every operator and every mode.
- **Supplier** — Travelport/Sabre (air, stays), SGR/TRC (rail), ClickPesa (money). Never
  customer-facing.

## Markets

Country is a first-class dimension, not a deployment. `travelarway.com/tz` is the launch
market; `ke`, `za` follow with the same code and different data. Each market declares
which modes exist (not every country has ferry or rail), its currency, its point of sale,
and its payment channels. Money rows carry `posCountry` because point of sale determines
taxes, fees and ticketing time limits.

## Decisions already made

- **Revenue is two primitives, never blended.** Commission on Bus/Ferry/Train; markup on
  net for Flights/Stays/Experiences; service fee optional and disclosed.
- **No holding of operator funds.** Settlements run automatically on a closing cycle
  (daily, configurable) through the payout API.
- **Roles and departments are configurable data**, not enums in code. Permissions are a
  catalogue; a role is a named set of them.
- **Guest booking is always available.** An account adds history and saved details, never
  access.
- **Brand:** Traveller blue `#0055DD` for action and structure, gold `#FDB812` as a
  flourish only (never a control), emerald/warning/error for state only. No gradients, no
  decorative shadows, no stock-AI look.

## Open questions

1. Card payments: hosted/embedded redirect (recommended — keeps PANs off our servers) vs
   inline card form.
2. Whether the service fee is enabled at launch, and at what value per mode.
3. Settlement cadence per market if `ke`/`za` banking hours differ from `tz`.
4. Stays and pay-at-property rates: sell **only prepaid rates** (markup collectable) or also
   sell non-prepaid rates (revenue becomes commission owed by the property, collected later).
   See `02` and `06`.

## Reading order for a new engineer

`01` to understand the product, `02` before touching checkout, `03` before touching UI,
`04` before touching any operations screen, `05`/`06` before writing user-facing words.
