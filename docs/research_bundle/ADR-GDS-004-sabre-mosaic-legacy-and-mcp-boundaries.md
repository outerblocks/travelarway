# ADR-GDS-004 — Sabre Mosaic, legacy APIs and MCP integration boundaries

**Status:** Proposed.  
**Date:** 28 October 2026.

## Context

The owner-supplied source set includes older Sabre air-booking, ticketing, exchange, seat and NDC guides, while the current Sabre Developer Hub documents a modern Mosaic air flow: Flight Shop, Flight Check, Booking Management create/fulfill and optional Flight Reshop. The Developer Hub also exposes multiple generations and recent product/version updates. Sabre MCP is a separate tool interface with environment and entitlement restrictions.

## Decision

1. Choose an integration generation per contracted provider product and market; never merge superficially similar request schemas across Mosaic, NDC Order Management, legacy REST and SOAP.
2. Use a provider capability registry to express access to ATPCO, NDC, LCC, seat maps, ancillaries/EMDs, ticket issue, exchange, void/refund and rail operations.
3. Record exact endpoint, API version, auth requirements, environments, EPR/PCC rights, airline/source entitlements, schema snapshot, sample fixtures and deprecation status.
4. For current Mosaic flow, model Flight Shop -> Flight Check -> Create Booking -> Fulfill Flight Tickets, with Flight Reshop only where supported. LCC-specific mandatory passenger/FOP requirements and immediate fulfillment are capability rules, not UI guesses.
5. Keep rail as a separate order state machine with prebook/confirm/read/document generation and distinct cancel, void, refund and exchange flows.
6. Keep Sabre MCP as a distinct integration surface for supervised agent workflows. It must call Travelar-authorized business operations or act within separately approved provider tool permissions; it does not bypass Travelar policy, human approval, authorization, funding or audit controls.
7. Do not enable production ticketing before the supplier form-of-payment, agency ticketing authority, funding/reconciliation model and provider entitlement are explicitly verified.

## Consequences

- A single normalized Travelar business interface is supported by multiple provider-specific implementations.
- Legacy operations may remain behind a separate adapter if an existing contract requires them, but only with version-specific fixtures and tests.
- Current official docs and product entitlements must be rechecked during release, not frozen at research time.
