# 92 — Stage 27 Scenario Additions and Provider Release Gates

This document extends Docs 84–88. Scenarios below are additional acceptance requirements; they are not evidence that tests have been implemented or passed.

## 1. Travelport Stays scenarios

| ID | Scenario | Expected control/result |
|---|---|---|
| ST-001 | Search by city/location | Normalize property results; preserve provider/product/version provenance. |
| ST-002 | Search by airport | Use documented airport criteria; do not mislabel the airport as a hotel property. |
| ST-003 | Search returns more than one page | Fetch pages using the documented identifier/token; prevent duplicate properties. |
| ST-004 | Availability has additional rates | Paginate rate results and preserve room/rate identity. |
| ST-005 | SearchComplete available in pre-production but not production | Capability registry disables that path for production and uses the approved fallback; no silent version mixing. |
| ST-006 | SearchComplete status unclear due documentation mismatch | Block production decision until release notes and account access confirm status. |
| ST-007 | Price/terms change between availability and reservation | Show a material-change diff and require explicit customer acceptance. |
| ST-008 | Offer becomes unavailable at reservation | Do not mark booked; refresh search and explain alternatives. |
| ST-009 | Single-room reservation | Persist traveler, offer, price, policy, locator and confirmation. |
| ST-010 | Multiple rooms, multiple travelers, children | Validate occupancy/ages and store each room/guest mapping returned. |
| ST-011 | Reservation returns several locator codes | Preserve each locator type; identify aggregator PNR separately. |
| ST-012 | Create Reservation times out | Query/retrieve before retrying; deduplicate by Travelar operation ID where possible. |
| ST-013 | Cancellation attempted without aggregator locator | Retrieve reservation or create an assigned support case; never guess locator type. |
| ST-014 | Cancellation acknowledged but refund pending | Cancellation and refund states remain separate. |
| ST-015 | Passive segment created | Do not call customer booking confirmed without supplier confirmation evidence. |
| ST-016 | OAuth token expires | Refresh according to provider authentication; do not disclose credentials. |
| ST-017 | Access group invalid | Fail closed, alert integration health, redact header/secret from logs. |
| ST-018 | Supplier error is retryable vs validation error | Retry only when error category/operation semantics permit; preserve trace and safe raw error. |
| ST-019 | User selects a private rate without entitlement | Hide/deny rate and ensure rate code is never accepted from an untrusted client without policy. |
| ST-020 | Cancellation policy is changed upstream | Re-display latest policy before booking/acceptance; keep accepted snapshot. |

## 2. Sabre Air/Mosaic scenarios

| ID | Scenario | Expected control/result |
|---|---|---|
| SA-001 | ATPCO Flight Shop returns offer | Normalize segments, passenger applicability, fare/tax breakdown and offer reference. |
| SA-002 | Flight Check reprices offer | Update quote and request acceptance for material changes. |
| SA-003 | Offer cache expired or no longer available | Do not create booking from stale offer. |
| SA-004 | Create Booking succeeds, fulfillment fails | Reservation exists but ticket is not issued; open fulfillment exception. |
| SA-005 | Multiple passengers have partial ticket issuance | Reconcile per passenger/document; do not label all passengers ticketed. |
| SA-006 | LCC source not provisioned | Capability is disabled and error presented to operations; no assumed fallback access. |
| SA-007 | LCC booking missing mandatory travel document | Block submission or follow documented carrier rule; never hide validation errors. |
| SA-008 | LCC Instant Purchase fulfillment delay | Immediate fulfillment job plus expiry/compensation handling; no stale confirmation. |
| SA-009 | NDC offer requires OfferItemID | Preserve exact offer/item IDs and reject malformed/stale references. |
| SA-010 | Airline-specific NDC function unsupported | Display only actions declared supported by the adapter. |
| SA-011 | Duplicate Create Booking after network timeout | Retrieve/reconcile existing reservation before retry. |
| SA-012 | Duplicate fulfill/issue request | Idempotency/reconciliation prevents duplicate ticket issuance. |
| SA-013 | Ticketing time limit expires | Block new fulfillment attempts or route to approved recovery, and notify staff. |
| SA-014 | Flight Reshop returns exchange offer | Confirm eligibility, revalidate and display difference before committing. |
| SA-015 | Customer requests name correction | Use supported correction path only; preserve refusal reason where disallowed. |
| SA-016 | Void vs refund requested | Route to the correct distinct workflow, based on ticket status and permitted time window. |
| SA-017 | Agency funding/FOP is not verified | Disable live ticket fulfillment until a documented commercial/funding path is approved. |
| SA-018 | API product updated/deprecated | Build pipeline blocks unreviewed version drift; migration ADR and contract tests required. |

## 3. Seats, ancillaries and EMD scenarios

| ID | Scenario | Expected control/result |
|---|---|---|
| ANC-001 | Free seat available for passenger A, paid for passenger B | Keep passenger-specific price/entitlement. |
| ANC-002 | Seat chosen on one segment only | Tie seat assignment to passenger and segment. |
| ANC-003 | Seat offer expires before confirmation | Refresh and request re-selection/acceptance. |
| ANC-004 | Ancillary offer exists but purchase fails | Keep offer distinct from purchased ancillary. |
| ANC-005 | Paid seat purchased but EMD issuance fails | Reservation/seat/EMD states are separate and a reconciliation case opens. |
| ANC-006 | Unsupported ancillary or carrier | Expose no unsupported action in UI or partner API. |

## 4. Sabre rail scenarios

| ID | Scenario | Expected control/result |
|---|---|---|
| RAIL-001 | Search then prebook | Store hold state, provider expiry if returned, terms version and order ID. |
| RAIL-002 | Prebook expires before confirm | Release/mark expired; do not issue documents. |
| RAIL-003 | Terms link returned by vendor | Make terms available before required confirmation; cache only as allowed by source terms. |
| RAIL-004 | Read/PNR synchronization fails after confirm | Keep rail order state independently and queue synchronization retry. |
| RAIL-005 | Confirm/book times out | Read order before retry. |
| RAIL-006 | Cancel a prebooked order | Use cancellation flow, not confirmed-order void. |
| RAIL-007 | Void confirmed order | Verify eligibility and final status, separate from refund. |
| RAIL-008 | Refund estimate differs from final response | Reconcile, surface exceptions and do not assume estimated refund is final. |
| RAIL-009 | Exchange offer/estimate/confirm | Keep original and new journey/document references, add-collect/refund and final read. |
| RAIL-010 | Round-trip outbound succeeds but inbound selection fails | Preserve partial journey state and require coherent user recovery. |

## 5. MCP and observability scenarios

| ID | Scenario | Expected control/result |
|---|---|---|
| MCP-001 | Try-it-out credential calls booking tool | Provider capability denial is recognized; Travelar must not assume booking permission. |
| MCP-002 | CERT token expires | Refresh via approved secret handling; no token in logs. |
| MCP-003 | MCP proposes ticketing/cancellation | Human approval and Travelar workflow checks apply before high-impact execution. |
| OPS-001 | Provider request has timeout | Trace ID links all calls and operation; safe retrieval precedes retry. |
| OPS-002 | Response schema drifts | Contract check alerts and blocks unsafe fulfillment rather than silently discarding fields. |
| OPS-003 | Customer reports booking without ticket/confirmation | Search by Travelar/provider references; create an owned work queue case. |

## 6. Release gates

A provider integration is not eligible for production until all are evidenced:

1. Exact product/version/endpoint approved and not deprecated or silently replaced.
2. Contract/account entitlements for content, booking, ticketing, servicing and geographic market are documented.
3. Request and response examples from the actual contract are stored in a fixture set with secrets/PII removed.
4. Source-to-canonical field map and raw-status-to-Travelar-state map are reviewed.
5. Positive, negative, timeout, duplicate, expired token, rate-limit, partial-success and reconciliation scenarios have executable tests.
6. Commercial and payment/funding model supports the provider's real form-of-payment and fulfillment requirements.
7. Logs include correlation and safe diagnostics, but redact credentials, passenger documents, payment information and unnecessary personal data.
8. Certification/sandbox evidence is labelled distinctly from mocks and production evidence.
9. Rollback and disable/fail-closed behavior are documented.
10. Provider approval and production entitlement are confirmed before live transactions.
