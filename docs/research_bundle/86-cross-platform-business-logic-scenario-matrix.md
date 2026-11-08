# 86 — Cross-Platform Business Logic Scenario Matrix

**Purpose:** Audit Travelar's most important user and operating scenarios from trigger through data, permission, state, money, audit, notification and recovery. This is a target test inventory, not a statement that functionality exists or tests have run.

### Status meanings

- **P0:** correctness/safety/commercial blocker; must be designed and tested before real customer transactions.
- **P1:** required for operationally credible launch of the corresponding capability.
- **P2:** add before the corresponding market/product/scale feature is activated.
- **Covered in design:** the pack describes the principle, but tests and implementation still must be proven.
- **Gap / needs explicit design:** Stage 25 contains only partial coverage or does not identify the scenario clearly enough.

## A. Air provider search and offer scenarios

| ID | Priority | Scenario | Required behavior/evidence |
|---|---|---|---|
| AIR-S01 | P0 | One-way flight | Valid provider-specific request, passenger mix, location codes, date and POS; persist source and search correlation. |
| AIR-S02 | P0 | Return trip with connection | Segment order, layover, terminal, connection feasibility and total itinerary semantics preserved. |
| AIR-S03 | P0 | Multi-city / open-jaw journey | Separate leg endpoints/dates; no forced origin=final destination symmetry. |
| AIR-S04 | P0 | Adult + child + infant | Child age/date-of-birth requirements, infant association with adult, passenger-specific fare/ancillary rules. |
| AIR-S05 | P1 | Group > provider limit | Enforce provider's current passenger limit or split workflow only when supported and approved; never split silently. |
| AIR-S06 | P0 | Provider results merge | Deduplicate exact duplicate content only; don't merge different branded fares, ticketability, baggage or payment rules. |
| AIR-S07 | P0 | One GDS times out, another returns offers | Return according to source-coverage policy; internal telemetry records failed source; no false claim of comprehensive availability. |
| AIR-S08 | P0 | Provider is authenticated but product entitlement absent | Do not call/enable it; log capability gate and show safe availability coverage. |
| AIR-S09 | P0 | Fare changes at price/revalidate step | Show prior vs new total, conditions and deadline; explicit customer consent before committing changed terms. |
| AIR-S10 | P0 | Search response contains references and normalized product list | Retain provider refs and reference-list identity required for subsequent price/booking calls. |
| AIR-S11 | P1 | Baggage varies by passenger/segment | Display correct per-passenger/segment allowance; don't reduce it to one global baggage badge if source differs. |
| AIR-S12 | P1 | Fare-rule response unstructured/unknown | Preserve source reference, label limits, route to review; do not declare refundable unless proved. |
| AIR-S13 | P1 | Booking class/brand and codeshare | Preserve marketing/operating carrier, RBD/fare basis when present, code-share details and agency-specific fare restrictions. |
| AIR-S14 | P1 | Search result becomes stale | Offer expires; checkout must revalidate and cannot use stale price or inventory. |
| AIR-S15 | P1 | Rate limit/token expiry | Token refresh, bounded retry and request throttling work without duplicating create operations. |

## B. Air booking, ticketing and after-sales

| ID | Priority | Scenario | Required behavior/evidence |
|---|---|---|---|
| AIR-B01 | P0 | Reservation held but not ticketed | Canonical state remains held/unticketed; exact provider ticketing deadline stored with timezone/source. |
| AIR-B02 | P0 | NDC response includes carrier and intermediary locators | Store both as typed references; lookup and servicing use the correct locator/account. |
| AIR-B03 | P0 | Ticketless carrier | Transition to ticketless-confirmed only if exact carrier/product capability proves no separate ticket is required. |
| AIR-B04 | P0 | Provider create/commit times out after request was received | State `UNKNOWN_RECONCILIATION`; retrieve/query by locator/correlation before any repeat create. |
| AIR-B05 | P0 | Ticket issue request accepted but response lost | Query ticket/document status; don't retry blind and create duplicate ticket/document. |
| AIR-B06 | P0 | Booking succeeds but customer payment fails | Follow the contract's ticketing deadline, guarantee, cancellation/release and customer communication workflow; don't leave an untracked liability. |
| AIR-B07 | P0 | Customer payment succeeds but supplier reservation fails | Record collection; create compensation/rebooking case; refund only under verified, authorized rules; no false ticket confirmation. |
| AIR-B08 | P0 | Supplier booking succeeds and customer payment succeeds but ticketing fails | Separate booking/ticket/payment states; alert queue and deadline; authorized retry or refund/other resolution. |
| AIR-B09 | P0 | Provider requires ticketing FOP different from customer PSP | Model customer collection and provider/supplier payment separately; never expose raw card details or assume Travelar collection satisfies GDS FOP. |
| AIR-B10 | P1 | Multiple offers in one booking / split supplier reservations | Support multiple supplier references and partial-success states; expose exact itinerary and ticket status per supplier component. |
| AIR-B11 | P1 | Paid seat or baggage ancillary | Correct passenger/segment link, pricing, EMD/document state, refund/change conditions; ancillary payment distinct if provider requires. |
| AIR-B12 | P1 | Cancellation before ticket issuance | Call only eligible provider action; distinguish reservation cancel from ticket refund/void. |
| AIR-B13 | P0 | Void vs refund vs exchange | Separate commands, eligibility, deadlines, fees, ticket documents, financial ledger entries and user confirmations. |
| AIR-B14 | P0 | Partial itinerary/passenger cancellation | Preserve unaffected passengers/segments/tickets; calculate quote per eligible document/segment; require approval when policy says. |
| AIR-B15 | P1 | Ticket exchange/re-shop price difference | Revalidate offer, calculate additional collection or refund, confirm before commit, track old/new documents and supplier state. |
| AIR-B16 | P1 | Involuntary schedule change/cancellation | Disruption case, affected booking list, customer notification, reroute/rebook/refund options, response deadlines and audit. |
| AIR-B17 | P1 | Reservation/ticket retrieval disagrees with local DB | Provider's current response and Travelar ledger remain separately recorded; create reconciliation task rather than silent overwrite. |
| AIR-B18 | P1 | Provider ticketing cutoff passes during payment flow | Stop unsupported action; communicate state; no use of expired offer/deadline; operations alert. |

## C. Hotels/stays

| ID | Priority | Scenario | Required behavior/evidence |
|---|---|---|---|
| STAY-01 | P0 | Search 2 rooms, 2 adults and children of different ages | Occupancy schema preserves per-room guest distribution and child ages; rate availability matches occupancy. |
| STAY-02 | P0 | Content exists but supplier has no live availability | Display property discovery separately from bookable rate; no false booking CTA. |
| STAY-03 | P0 | Rate/room is repriced or sold out | Revalidate exact property, room, rate-plan and occupancy before create; request consent to new price/terms. |
| STAY-04 | P0 | Free cancellation deadline near midnight | Store local property timezone plus raw offset/deadline; display correctly and schedule with DST/time zone safe logic. |
| STAY-05 | P0 | Prepaid vs pay-at-property vs guarantee | Model who collects customer money, when, cancellation/no-show liability, virtual card/guarantee requirements and reconciliation separately. |
| STAY-06 | P0 | Hotel booking timed out | Query by provider reference/idempotency key where supported; don't create duplicate room booking. |
| STAY-07 | P1 | One of multiple rooms fails | Represent partial reservation truth, customer remedies and cancellation/compensation policy. |
| STAY-08 | P1 | Cancel 1 of 2 rooms | Revalidate supplier terms; affect only intended room(s), recompute penalties/refund and preserve the other room. |
| STAY-09 | P1 | Property no-show/disputed charge | Case timeline, evidence, supplier correspondence, contract terms, finance adjustment and customer communications. |
| STAY-10 | P1 | Hotel content image or description has no rights/provenance | Do not publish asset until license/source/display rights and refresh policy are recorded. |

## D. Operator route, schedule, fleet and ticket operations

| ID | Priority | Scenario | Required behavior/evidence |
|---|---|---|---|
| OPS-01 | P0 | Generate daily trips through next month | Recurrence has date range, local timezone, weekday pattern, exceptions and idempotent generation; preview before publish. |
| OPS-02 | P0 | Run generator twice | Same rule/version creates no duplicate trip instances; durable operation ID and audit record. |
| OPS-03 | P0 | Bus assigned to overlapping trips | Database/transaction prevents resource conflict, including concurrent user actions. |
| OPS-04 | P0 | Route stop order changes after tickets sold | Published route version is immutable for historical trip; prospective updates require safe migration/republication flow. |
| OPS-05 | P0 | Sale between intermediate stops | Seat/capacity inventory is locked per journey segment; overlapping allocations blocked transactionally. |
| OPS-06 | P0 | Vehicle replaced after seats sold | Compatibility check against sold seat labels/capacity; impacted passengers and reassignment must be managed explicitly. |
| OPS-07 | P0 | Trip delayed/cancelled | Operator records reason, actor, effective time, passenger impact, notifications and authorized refund/reschedule path. |
| OPS-08 | P1 | Route has return/through stops or duplicate city names | Stable location and stop IDs disambiguate terminals, branches and repeated stops. |
| OPS-09 | P1 | Fare/commission policy changes tomorrow | Effective dates and policy version snapshot; future quotes use new policy while existing bookings preserve prior snapshot. |
| OPS-10 | P1 | Driver/crew/vehicle documents expired | Assignment/publish blocked or escalated according to jurisdiction/configuration; no hardcoded false eligibility. |
| OPS-11 | P1 | Boarding scan duplicated/offline | Idempotent scan event, device/time/actor evidence, offline conflict resolution and manifest reconciliation. |
| OPS-12 | P1 | Last-minute passenger/seat change | Re-check authorization and inventory; preserve original audit evidence and regulatory manifest correction history. |

## E. Payment, payouts, commission and accounting

| ID | Priority | Scenario | Required behavior/evidence |
|---|---|---|---|
| FIN-01 | P0 | Duplicate payment callback | Durable inbox and idempotency prevent duplicate collection/fulfillment/ledger posting. |
| FIN-02 | P0 | Payment completed after booking hold expires | Late-payment case; recheck inventory and terms; never auto-issue unavailable inventory. |
| FIN-03 | P0 | Payment amount/currency/reference mismatches | Quarantine; do not mark booking paid; reconciliation task contains safe evidence. |
| FIN-04 | P0 | Collection success vs provider settlement | Separate states and ledgers; don't equate `received` with merchant funds available or supplier paid. |
| FIN-05 | P0 | Payout `AUTHORIZED`/`PROCESSING` then reversed | Keep payable open until verified final outcome; append corrective entries and alert finance. |
| FIN-06 | P0 | Provider create timeout | Query by provider reference before retry; prevent duplicate money movement. |
| FIN-07 | P0 | Commission differs by operator and channel | Snapshot operator contract, booking origin, sales channel, effective rate and calculation at booking time. |
| FIN-08 | P0 | Operator walk-in vs Travelar-originated sale | Immutable attribution; apply configured signed commercial rule, not inferred from staff or current URL. |
| FIN-09 | P0 | Refund is partial or provider fee non-refundable | Separate original collection, customer refund, supplier recoverable, provider fee, commission reversal and ledger journal. |
| FIN-10 | P0 | Journal unbalanced or cross-mode transfer | Reject posting; mode subledger and accounting-period controls; authorized, traceable inter-ledger movements only. |
| FIN-11 | P1 | Bank statement/provider settlement differs from ledger | Reconciliation exception with reason, owner, due date, aging and resolution approval. |
| FIN-12 | P1 | Repeated refund request | Idempotency and refund cumulative cap prevent over-refunding. |
| FIN-13 | P1 | Failed customer refund | Keep refund due, retry only when provider supports and result is known, notify customer truthfully. |
| FIN-14 | P1 | Fee or levy rate changes | Effective dated rate, approval, tax treatment, booking snapshot and historical calculation reconciliation. |
| FIN-15 | P1 | FX conversion | Preserve source/target amounts, rate, timestamp, provider/treasury, rounding and realized FX journal. |

## F. HIMS/OIMS security, staff and governance

| ID | Priority | Scenario | Required behavior/evidence |
|---|---|---|---|
| IAM-01 | P0 | Staff invitation expires or is replayed | Single-use token, short expiry, hashed token storage, revocation and audit. |
| IAM-02 | P0 | Branch staff changes branch or leaves operator | Scope update/deprovisioning revokes active sessions/tokens according to policy and records actor/time. |
| IAM-03 | P0 | Staff grants themselves finance approval | Backend rejects unauthorized privilege escalation; maker-checker segregation enforced. |
| IAM-04 | P0 | Request uses another tenant's resource ID | Object authorization and tenant/branch checks every request; no existence leakage. |
| IAM-05 | P0 | Admin role or payout beneficiary changed | Step-up authentication, reason, approval, notifications and audit according to risk policy. |
| IAM-06 | P1 | Emergency break-glass access | Limited duration, justification, alerts, post-event review and session expiry. |
| IAM-07 | P0 | Published config invalidates future fare or permission | Preview, validation, required reviewers, effective date, version, rollback and cache invalidation. |
| IAM-08 | P1 | Audit/logging store unavailable | Defined fail-safe behavior for sensitive operations; durable audit/outbox or controlled block; alert. |
| IAM-09 | P1 | Log has passenger documents, secrets or payment data | Automated redaction tests, access controls, retention and incident response. |
| IAM-10 | P1 | User requests data export/deletion/correction | Identity check, legal retention holds, export workflow, redaction/erase where permissible and immutable audit of action. |

## G. Public API / partner integration

| ID | Priority | Scenario | Required behavior/evidence |
|---|---|---|---|
| API-01 | P0 | API key/token belongs to wrong partner scope | Deny; scopes/tenant ownership checked on every route. |
| API-02 | P0 | Partner retries create booking | Idempotency key + request hash return original result or conflict on changed payload. |
| API-03 | P0 | Webhook replay/forgery | Signature, timestamp/replay defense, event ID dedupe, HTTPS and durable processing. |
| API-04 | P0 | Partner webhook endpoint points to internal network | URL verification and SSRF-safe outbound validation, DNS rebinding defenses and egress policy. |
| API-05 | P1 | Partner exceeds quota | Per-client, endpoint and account-aware throttling; rate-limit headers and documented response. |
| API-06 | P0 | OpenAPI spec drifts from runtime schema | CI validates generated OpenAPI, request/response validators, examples and contract tests. |
| API-07 | P1 | Breaking API change | Versioning, compatibility period, deprecation schedule, changelog, partner notification and migration guide. |
| API-08 | P1 | Partner credential compromised | Immediate revocation, rotation, evidence, impact search, abuse/transaction review and notifications. |
| API-09 | P1 | Usage is billed by API calls/bookings | Immutable usage events, idempotent metering, invoice reconciliation, test/production segregation. |
| API-10 | P1 | Provider incident impacts partner SLA | Status and degradation contract; partial results semantics, retries, incident communication and SLA evidence. |

## H. Platform-wide scenarios to add before release

- Regulatory system unavailable after paid booking; lawful issuance/manifest behavior must be confirmed per jurisdiction.
- Two providers return distinct offers for a similar itinerary; deduplication must preserve material differences and provenance.
- Currency, country, timezone, locale, address format, phone format and date boundary differ; no browser-local assumptions for authoritative operations.
- Message/SMS/email provider delayed or unavailable; message outbox retries without duplicating ticket/payment operations.
- Duplicate scheduled background-job execution, worker crash and dead-letter replay; no duplicate trip, payout, ticket or ledger posting.
- Backup restore / regional outage / key rotation; demonstrate recovery and reconcile in-flight external operations after restore.
- Supplier contract ends or credentials are revoked; stop new sales safely while preserving existing bookings and after-sales access.
- Privacy request or breach report across public site, HIMS, OIMS, partner API, logs, exports and backups.
- Capacity stress: popular departure, last seat, inventory lock contention, search provider limits, payment concurrency and checkout queue depth.
- Customer support resolves dispute; ensure customer narrative, supplier evidence, payment evidence and approved financial adjustment stay linked.

## Test execution standard

Every row becomes an executable test or a documented blocked scenario. Record test ID, requirement, commit, environment, data fixture, provider product/version, credentials/entitlement reference (never secret), command, exit status, sanitized evidence path, cleanup, reviewer and risk. Clearly distinguish unit, integration, contract, end-to-end, certification and live production verification. A mock does not certify a supplier integration.
