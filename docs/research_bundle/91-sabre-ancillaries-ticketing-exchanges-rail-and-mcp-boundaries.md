# 91 — Sabre Ancillaries, Seat Maps, Ticketing, Exchanges, Rail and MCP Boundaries

**Research cut-off:** 28 October 2026. **Status:** Documentation-derived implementation requirements; exact access and product versions are contract gates.

## 1. Seats and ancillary services

The owner-supplied Sabre sources cover seat maps, reserving seats, getting ancillaries, air extras search/booking and issuing Electronic Miscellaneous Documents (EMDs) for paid extras/seats. Travelar must model the difference between:

- seat map retrieval (layout and currently selectable offers);
- seat selection/assignment per passenger and flight segment;
- free seat entitlement and paid seat offer;
- ancillary discovery vs ancillary purchase;
- ancillary booking in a reservation vs issued EMD/document;
- price/availability changes vs confirmed seat/ancillary status.

The Sabre Stateless Seats API documentation says seat shopping can return seat maps, seat prices and other data for one or more passengers and that free/paid seats and discounts depend on passenger data. Therefore, don't cache a single generic map and price for every passenger. Preserve flight segment, passenger association, offer/offer-item references, price currency, seat attributes, entitlement and provider response timestamp.

Paid seat/add-on success must not be inferred from a UI selection or ancillary offer alone. If the provider requires an EMD or other fulfillment document, track that issuance and its final status. Seat selection, EMD issuance, ticketing and customer payment are separate state transitions.

## 2. Form of payment is not the same as customer collection

A material funding decision remains open: GDS ticketing can rely on agency/provider form-of-payment rules, ticketing limits, airline agreements or a supplier-specific payment mechanism. Travelar's ClickPesa collection proves only the state ClickPesa reports for that collection; it does not prove Sabre/airline ticketing can be fulfilled using that same collected amount or that the agency is authorized to issue tickets.

Before production ticketing, document and test:

- the contracted GDS form of payment for each source/content type;
- credit/settlement arrangement, ticketing authority and available ticketing limits;
- how customer money and agency/supplier funding are reconciled;
- failure/compensation if customer collection succeeds but ticket issuance fails;
- the permitted void/refund/rebook path and who absorbs penalties or fare changes.

Never store raw card data unless explicitly in scope with the required compliance/security architecture. Prefer approved hosted/tokenized payment paths where they meet the provider's actual FOP requirements. Do not assume a PSP's payment token is usable as a GDS form of payment.

## 3. Exchange, void, refund and post-booking service

Travelar should create distinct case workflows rather than one generic “modify ticket” button:

1. Retrieve live booking, ticket and document state.
2. Determine whether the requested action is a correction, voluntary exchange, involuntary change, cancellation, void, refund or ancillary change.
3. Request eligibility, available exchange options and pricing/penalties from the correct provider workflow.
4. Show the customer an itemized difference and obtain required consent/approval.
5. Execute the allowed change, reissue or refund operation.
6. Retrieve the reservation/document state again and reconcile every old/new ticket number, EMD, fee, supplier balance, PSP transaction and ledger journal.
7. Notify the customer only after the relevant finality state is verified; if uncertain, open an operations case.

Name correction and name change are not interchangeable. Provider/airline restrictions can prohibit changes or permit only limited edits at specific stages. Preserve the requested change and exact provider decision.

## 4. Sabre rail workflow

The supplied Sabre Content Services Rail guide documents a lifecycle that is not identical to air ticketing:

**One-way example:** Search Single Trip → retrieve terms and conditions via Dictionaries → Prebook (creates a temporary order/hold) → Read order → synchronize the order to Sabre PNR → Book/confirm and issue tickets → Read updated order → synchronize PNR → generate travel documents.

Round-trip search has outbound and inbound search steps. The guide also documents rail seat maps during prebook, notifications, cancellation for pre-booked orders, void for confirmed orders, and separate refund/exchange flows. Refund example: Read → Refund Estimate → Refund Confirm → Read → PNR synchronization. Exchange example: Read → Exchange Offers → Exchange Estimate → Exchange Confirm → Read.

Do not collapse `PREBOOKED`, `CONFIRMED`, `TICKETED`, `CANCELLED`, `VOIDED`, `REFUND_PENDING`, `REFUNDED` and `EXCHANGED` into a single success state. Use canonical Travelar states plus a provider-native raw state and map permitted transitions per rail supplier/API version. Terms/conditions must be shown before an irreversible confirmation when the provider requires it.

## 5. Sabre MCP Server is an additional integration surface, not the canonical API

The owner-supplied `product-collection/mcp-server/1.0` link is relevant to agentic tooling. Current documentation distinguishes:

- Try it Out: developer-hub credentials and searching operations only; booking is unavailable in that mode.
- CERT: existing Sabre API EPR/credentials and full capabilities as documented.
- PROD: provisioned product access; the page says production is enabled after ordering and notes pilot-customer availability.
- bearer access tokens expire after seven days according to the setup page.

Travelar's deterministic booking engine should continue to use its own approved provider adapter contracts. MCP can be evaluated as a separate tool interface for supervised agent workflows, documentation discovery or search assistance, but it must not bypass Travelar authorization, customer consent, booking state machine, maker-checker, payment/funding gates or audit. Search-only credentials and production booking capabilities must be reflected in a capability registry.

The IDE agent must never paste a production token into source, logs, issue text or prompts. MCP tool calls that can book, ticket, cancel or move money are high-risk actions and require constrained tool permissions and explicit operational authorization.

## 6. Scenario requirements

Test free vs paid seat; seat price personalized per passenger; two passenger requests differ; stale seat offer; seat selection saved but payment fails; payment succeeds but seat/EMD issuance fails; ancillaries unsupported for an airline; ticket issue partially succeeds for multiple passengers; duplicate fulfill call; LCC immediate-fulfillment timeout; exchange difference payment fails; refund estimate changes before confirm; void window expired; rail prebook expires; rail confirm has ambiguous timeout; cancellation of prebook vs void of confirmed order; rail refund estimate/confirm failure; rail round trip leg failure; missing/changed terms; Sabre MCP Try it Out attempts booking; CERT or PROD entitlements missing; expired token; unapproved agent tool attempts a destructive action.

## 7. Sources

- [Sabre Stateless Seats API](https://developer.sabre.com/rest-api/stateless-seats-api/1.4)
- [Sabre NDC collection](https://developer.sabre.com/product-collection/new-distribution-capability-ndc/v1/index.html)
- [Sabre rail reservation guide](https://developer.sabre.com/guide/rail-reservation/rail-reservation.html)
- [Sabre Content Services Rail API](https://developer.sabre.com/rest-api/content-services-rail/v2/index.html)
- [Sabre MCP Server setup and configuration](https://developer.sabre.com/product-collection/mcp-server/1.0/help-documentation/setup.html)
- Other owner-supplied URLs in Doc 93.
