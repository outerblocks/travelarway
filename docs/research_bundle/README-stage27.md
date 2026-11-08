# Travelar Research Bundle — Stage 27

**Date:** 28 October 2026  
**Focus:** Travelport Stays source set and Sabre current air/LCC/NDC, ancillary, ticketing, exchange, rail and MCP workflows.

## New artifacts

- `89-travelport-stays-source-review-and-versioned-workflows.md` — Travelport v11 vs SearchComplete v12, headers, trace IDs, pagination, multi-room, booking/cancel and error mapping.
- `90-sabre-mosaic-air-lcc-ndc-booking-and-servicing.md` — modern Mosaic workflow and distinctions between ATPCO, LCC, NDC and legacy product generations.
- `91-sabre-ancillaries-ticketing-exchanges-rail-and-mcp-boundaries.md` — seats, paid ancillaries/EMDs, funding/FOP, ticket servicing, rail order flow and MCP boundary.
- `92-stage27-stays-sabre-scenario-and-release-gates.md` — 60 incremental acceptance scenarios and production release gates.
- `93-provider-source-inventory-stage27.md` — all 41 URLs submitted in this research turn, plus current official references.
- `ADR-GDS-003-travelport-stays-searchcomplete-capability-gate.md` — version-specific stays adapter decision.
- `ADR-GDS-004-sabre-mosaic-legacy-and-mcp-boundaries.md` — product-generation and MCP separation decision.
- `sources-and-evidence-register-stage27.md` — evidence, caveats and unresolved entitlement/status questions.

## Key findings

1. **Travelport Stays:** the public docs describe a v11 workflow (search -> availability -> optional details/rules -> Create Reservation) and a SearchComplete v12 path that consolidates search/details/availability. Because rollout language is inconsistent across pages, v12 is a gated capability, not an assumed default.
2. **Sabre air:** current “New to Sabre” docs describe Flight Shop -> Flight Check -> Create Booking -> Fulfill Flight Tickets, with optional Flight Reshop. LCC, NDC and ATPCO content have distinct data and entitlement requirements even when the modern Mosaic flow is shared.
3. **Sabre servicing:** seat/ancillary selection, EMD issuance, ticket issuance, exchange, cancellation, void and refund are separate concepts and states.
4. **Sabre rail:** prebook/temporary hold, confirmation, ticket documents, PNR sync, cancellation, void, refund and exchange have separate operations and states.
5. **Sabre MCP:** a separate tool interface with different Try-it-out, CERT and PROD capabilities. It is not a replacement for Travelar's deterministic provider adapters and must not bypass approvals or financial controls.
6. **Ticketing funding gate:** customer collection via ClickPesa does not by itself prove the GDS/airline form-of-payment, agency ticketing authority or supplier funding is valid. This is a production release blocker until documented and tested.

## Build instruction

Read Docs 84–93 and ADR-GDS-001 through ADR-GDS-004 before changing provider integration code. For each operation, produce an exact schema artifact, canonical field map, native-to-Travelar status map, redacted fixture and executable positive/negative/timeout/retry test. Don't infer schemas or account entitlements from page titles. Distinguish mock, sandbox/certification and production evidence.

**Status:** Research/requirements addendum only. No repository or provider account was modified, and no live supplier call or transaction was performed as part of preparing this pack.
