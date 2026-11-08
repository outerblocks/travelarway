# ADR-GDS-001 — Multi-provider GDS adapter architecture

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Status:** Architecture direction accepted by product owner; provider-specific production activation unresolved  
**Decision date:** 23 October 2026

## Context

Travelar intends to offer flights, stays and rail, while retaining flexibility to use relevant direct suppliers for bus, ferry, experiences and other content. Travelport, Sabre and Amadeus publish multiple API/product families across some of these modes, but no public documentation alone establishes OuterBlocks Limited's eligibility, production rights, supplier coverage, ticketing authority, settlement terms or after-sales responsibilities.

The product owner explicitly clarified: **Travelar can use all three as adapters; it does not need to select only one provider.** The architecture therefore must allow concurrent providers and provider-specific products instead of coupling the domain to a single GDS.

## Decision

1. Build a provider-neutral supplier integration layer that can support Travelport, Sabre and Amadeus concurrently, with the ability to add/retire supplier adapters without rewriting the core booking domain.
2. Treat the provider and the product/API family separately. For example, one vendor can expose REST flights, a distinct stays product and a rail interface with different protocols, credentials, contracts and lifecycle capabilities.
3. Maintain a capability registry for every provider/product/market combination. Record eligible countries and point of sale, currencies, content sources, modes, live/sandbox status, supported lifecycle operations, limits, contractual permissions and effective dates.
4. Allow search routing to query multiple eligible adapters when useful. Every offer must preserve provider/source provenance, exact offer references, fare/rate conditions, expiry, payment type and supported servicing operations.
5. Bind each accepted booking item to the provider/product that accepted it. Retries after an ambiguous result must use provider-supported idempotency, retrieval or reconciliation, not blindly submit a new booking through another provider.
6. Preserve provider-specific booking, ticket/document, payment, refund and settlement states. A generic `CONFIRMED` state must not hide distinctions such as reserved-but-not-ticketed, hotel property-collect, or supplier-confirmation-pending.
7. Activate each provider/product in production only after written eligibility/contract confirmation, credentials, relevant market coverage, booking and after-sales rights, legal/funds-flow review, security review, and proof-of-capability tests.
8. Roll out adapters in dependency order as a delivery and risk-management measure. Incremental rollout does not change the multi-adapter target architecture.

## Alternatives considered

- **Single global GDS hard-wired into core:** rejected; creates avoidable lock-in and assumes uniform mode/market coverage.
- **Three fully independent implementations with no shared contracts:** rejected; duplicates domain logic and makes booking/financial lifecycle behavior inconsistent.
- **Provider-neutral adapter layer with staged activation:** accepted.
- **Affiliate or referral flow where transactional API rights are unavailable:** permitted only as a distinct product path with clear disclosure and an explicit customer journey; it is not treated as native booking/ticket issuance.

## Required components

- Mode-specific capability interfaces (for example flight shopping/booking/ticketing, lodging search/booking, and rail search/booking/ticketing).
- Provider-specific product adapters and credentials held in a managed secrets system.
- Provider registry and routing policy, including country/point-of-sale, supplier coverage, commercial permissions, capability flags, operational health and rate limits.
- Offer provenance and offer-expiry enforcement.
- Stable Travelar booking IDs linked to provider locators, PNR/order IDs, ticket/document numbers and supplier confirmations.
- Per-provider idempotency, polling/webhook handling, timeout recovery and exception queues.
- Reconciliation by provider and supplier for bookings, documents, collections, refunds and settlements.
- Conformance, contract, integration and failure-injection tests for every activated adapter version.

## Guardrails

- Do not assume one vendor's APIs use the same protocol, schema, authentication, booking states or cancellation semantics across products.
- Do not merge offers solely because itinerary/property names match; preserve fare family, baggage, taxes, refundability, payment type and other material conditions.
- Do not blindly switch providers after a booking or ticket-issuance timeout. Resolve the original outcome first to avoid duplicate reservations or tickets.
- Do not assume multi-provider search means one atomic cross-provider checkout. Cross-provider cart, payment splitting, partial fulfillment, cancellation and refund behavior require a separate decision and tests.
- Do not assert coverage of Tanzania SGR, Madaraka Express, a particular airline, hotel, or any other supplier until the provider confirms it and testing demonstrates it.

## Consequences and trade-offs

**Benefits:** reduced vendor lock-in, ability to combine coverage, mode-specific optimization, future bargaining leverage and explicit capability boundaries.

**Costs:** extra contracting and compliance work, credential management, adapter maintenance, offer normalization/deduplication, test matrix growth, monitoring, customer-support training and per-provider reconciliation.

**Residual risks:** overlapping inventory may return inconsistent prices; provider APIs may be unavailable or have ambiguous outcomes; production content may differ from sandbox; supplier-level after-sales may remain manual; contract terms may constrain display, markup, caching, distribution, data retention or customer communication.

## Acceptance criteria for each provider/product activation

- Dated provider response and executed contract or other authoritative permission.
- Confirmed entity eligibility, point-of-sale countries, products and permitted use case.
- Production entitlements and documented API/version, credential and rate-limit rules.
- Supplier-level coverage evidence for target markets.
- Tests for search, repricing/revalidation, booking, ticket/document issue where relevant, retrieval, cancellation/refund/change support and unknown-outcome recovery.
- Documented payment, settlement, customer-service, after-sales and data-protection responsibilities.
- Security, privacy, logging, reconciliation and rollback procedures approved.

## Evidence

- Travelport TripServices: https://developer.travelport.com/ — current Flights, Stays and Pay product families.
- Travelport Universal API: https://support.travelport.com/webhelp/uapi/Content/Introduction.htm — air, hotel, car and rail via SOAP/XML; product/version support considerations.
- Sabre Content Services Rail v2: https://developer.sabre.com/rest-api/content-services-rail/v2/index.html — rail workflow and explicit permission/supplier-agreement requirement.
- Amadeus Enterprise Rail: https://admin.developers.amadeus.com/enterprise/category/rail — rail schedule/fare quote, segment sell and issue contract; access requested.
- Amadeus Enterprise Hotel: https://developers.amadeus.com/enterprise/category/hotel — hotel availability and booking product family; access requested.

Official public documentation establishes product/API existence and stated access conditions. It does not establish any Travelar or OuterBlocks production contract or capability.

## Review trigger

Review this ADR after written provider RFIs and capability tests, or when a provider changes API family, terms, market coverage or support lifecycle. Provider-specific activation can change without reversing the overall multi-adapter architecture decision.
