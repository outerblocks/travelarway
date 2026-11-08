# 22 — Domain Model and Logical Data Architecture

> **Stage 14 product-scope clarification (24 October 2026):** Train and Experiences are first-class Travelar modes, not future modes. Their requirements belong in the current product, architecture, integration and test baseline. Per-country activation may remain gated until authorized suppliers, contracts, ticket/voucher flows and support/refund handling are verified. See `40-train-and-experiences-first-class-mode-research.md`.
**Status:** Logical model for research and design; not a production SQL schema. **As of:** 23 October 2026.

## 1. Modelling principles

1. Model the business and provider evidence separately. A booking is not the same thing as a GDS PNR, PSP transaction, e-ticket or accounting journal.
2. Prefer relational integrity for commercial, booking, inventory and accounting relationships.
3. Every tenant-owned record needs an explicit organization/country/market scope where relevant; authorization must be enforced at service and data boundaries.
4. Money values must include currency and exact minor-unit representation/decimal precision policy; never use binary floating-point for financial amounts.
5. State changes are versioned and audited. Posted ledger entries are immutable; corrections use linked reversal/adjustment entries.
6. Store provider IDs, request/correlation IDs, idempotency keys, API version/capability, status evidence and timestamps. Minimize retention of raw payloads and redact secrets/personal fields.
7. The model is logical; regulatory data requirements and supplier API contracts may add or constrain fields.

## 2. Aggregate map

| Aggregate/domain | Core entities | Primary invariants |
|---|---|---|
| Market/configuration | Country, Market, Currency, Language, TaxRuleVersion, CountryModePolicy, FeatureFlag | Each policy has scope, source, effective period and approval/audit history. |
| Identity/tenancy | User, IdentityLink, Organization, Operator, Branch, PartnerApplication, Membership, Role, Permission, ScopeGrant | Access derives from active membership and scope; deactivation takes effect promptly; no cross-tenant default access. |
| Supplier/provider registry | Provider, ProviderProduct, AdapterDeployment, Capability, Contract, CredentialReference, HealthSnapshot, ProviderApproval | Production operations blocked without active authorization, credential binding and required capabilities. |
| Catalog | Location, Stop/Station/Port, Route, RouteVersion, RouteStop, Vehicle, SeatLayoutVersion, Vessel, VesselClass, Property, Activity, Amenity | Catalog revisions do not silently alter booked itinerary or seat layout interpretation. |
| Schedule/inventory | TripTemplate, TripInstance, OperatingCalendar, RouteLeg, Seat, SeatClaim, SailingInstance, CapacityBucket, InventoryHold | Allocation is atomic; hold has expiry and explicit transition; committed inventory is not cache-authoritative. |
| Offer/pricing | SearchRequest, SupplierOffer, PriceQuote, FareRuleSnapshot, TaxLine, FeeLine, CommissionRuleVersion, MarkupRuleVersion, FXQuote | Price includes currency, source and validity; checkout revalidates volatile prices and records user acceptance. |
| Booking/fulfilment | Booking, BookingItem, Passenger, PassengerAssignment, SupplierReservation, Ticket, Voucher, ManifestEntry, BoardingEvent, FulfilmentEvent | Booking item status and ticket/boarding status are distinct; external reference preserved; duplicate idempotent requests do not duplicate fulfilment. |
| Money movement | PaymentIntent, PaymentAttempt, PaymentTransaction, PSPEvent, Refund, Chargeback, Payout, SettlementBatch, ReconciliationMatch, SuspenseItem | Provider event is authenticated/correlated; state transitions monotonic where possible; ambiguous cases reconciled, not guessed. |
| Accounting | LegalEntity, Account, Journal, JournalLine, PostingBatch, SubledgerEntry, SupplierPayable, PSPClearing, TaxLiability, SettlementAllocation | Debits equal credits per journal/currency accounting rules; posted records immutable; every reversal has a reason and actor. |
| Sales channels | SalesChannel, AttributionEvidence, AgentCommissionRule, CashierShift, CashMovement, CashReconciliation | Channel classification comes from server-created evidence and is immutable except by approved adjustment. |
| Communications | Notification, TemplateVersion, RecipientEndpoint, ProviderAttempt, DeliveryEvent, Consent/Preference, SuppressionRecord | API acceptance is not delivery; ambiguous failure must not blindly resend critical messages; maintain opt-out/compliance controls. |
| Support/disruption | SupportCase, Complaint, Disruption, CaseEvent, RefundApproval, Escalation | Access is case/role limited; full card/ID data not copied unnecessarily into free text. |
| Security/governance | AuditEvent, ApprovalRequest, ConfigurationVersion, AccessReview, SecurityIncident, RetentionRule, DataTransferPermitReference | Logs/approvals are append-only or tamper-evident with restricted administration; legal evidence retained under policy. |

## 3. Bus inventory and segment correctness

Represent each `RouteVersion` as an ordered list of stops and individual adjacent `RouteLeg` records. A `TripInstance` refers to a stable route version, vehicle/seat-layout version, operating date and schedule revision. A passenger journey is an origin stop index through a later destination stop index. Price and inventory eligibility are segment-specific.

For a seat reservation from stop index `i` to `j`, the system must claim the seat for every route leg between `i` and `j`, not only the exact origin-destination pair. Otherwise bookings for Dar–Dodoma and Morogoro–Mbeya could overlap in route space while the same seat has already been allocated on one segment.

### Recommended logical claim model

- `seat_claim`: `trip_instance_id`, `seat_id`, `route_leg_id`, `booking_item_id`, `claim_status`, `hold_id`, `created_at`, `released_at`.
- A unique constraint prevents two active claims for the same `trip_instance_id + seat_id + route_leg_id`.
- A seat journey allocates a set of leg claims in one short database transaction. Any uniqueness conflict rolls the entire attempt back.
- Holds expire through explicit state transitions and claim release. Do not build a partial unique index predicate that depends on `now()`; time-dependent predicates are not stable index conditions. Use a sweeper plus an in-transaction validity check, or a separate active-claim table whose rows are inserted/deleted transactionally.
- Confirmed claims must not be released by a generic timeout job. Only the correct booking lifecycle, authorized cancellation, or reconciled recovery transition releases them.
- All actions carry idempotency keys. Retries return the original allocation/result or a deterministic conflict.

Use PostgreSQL transactions, constraints and row-level locking where appropriate; PostgreSQL documents `FOR UPDATE` and other explicit locks for controlling conflicting concurrent writes: https://www.postgresql.org/docs/18/explicit-locking.html. The final algorithm must be validated with concurrency tests and query plans, not only unit tests.

## 4. Ferry class-capacity correctness

A `SailingInstance` has a vessel version, route, departure, status and schedule version. `CapacityBucket` represents a ticketable class/category (e.g., passenger class, adult/child category only if supplier rules require separate quotas) with `capacity_total`, `capacity_confirmed`, `capacity_held` or an equivalent ledger of reservations.

Reserve in one atomic conditional update or locked transaction that only succeeds if remaining capacity is sufficient. Do not hold capacity across an unbounded external payment call. Holds have expiry; confirmed reservations are durable. Vessel substitution and reduced capacity trigger a controlled reallocation/disruption workflow and must not silently over-allocate the new sailing.

## 5. State design: do not collapse distinct entities

### Booking status

Suggested high-level values: `draft`, `quoted`, `awaiting_payment`, `payment_pending`, `paid_pending_fulfilment`, `confirmed`, `partially_confirmed`, `failed`, `cancel_requested`, `cancelled`, `completed`, `manual_review`. Exact statuses depend on mode/provider and the rules approved for each flow.

### Payment status

`created`, `initiated`, `pending`, `succeeded_verified`, `failed_verified`, `reversed`, `refund_pending`, `partially_refunded`, `refunded`, `unknown_needs_reconciliation`. A provider-specific adapter maps evidence into canonical states without dropping original provider state.

### Ticket/fulfilment status

`not_requested`, `issue_pending`, `issued`, `issue_failed`, `void_pending`, `voided`, `reissue_pending`, `unknown_needs_reconciliation`. “Payment succeeded” is not the same as “ticket issued.”

### Supplier reservation status

`not_created`, `creating`, `created`, `rejected`, `pending_unknown`, `cancel_pending`, `cancelled`, `changed`, `unknown_needs_reconciliation`. Keep supplier/PNR/booking references.

### Refund status

`requested`, `approval_pending`, `submitted`, `provider_pending`, `completed_verified`, `rejected`, `failed`, `unknown_needs_reconciliation`. Approved is not completed; provider acceptance is not refund completion.

### Ledger state

Draft/prepared journals can be edited before approval/posting under permissions; posted journals are immutable. Corrections create linked reversal/adjustment records. Every batch balances according to the selected accounting policy and retains currency, effective/transaction date, source event and rule version.

## 6. Logical relations and keys

Use opaque internal IDs (UUID/ULID format decision later) and separate public references that are nonsequential and non-authorizing. Public booking reference is lookup assistance, not a secret credential. Require a verification factor, signed link/token with expiry or secure account authorization before exposing or changing passenger information.

Expected cardinalities include:

- `Organization 1..N Branch`, `Organization N..N User` through membership.
- `Operator 1..N Route/Vehicle/Trip`, with ownership scope and `Provider` relationships where external systems remain authoritative.
- `RouteVersion 1..N RouteStop` and `RouteLeg`; `TripInstance -> RouteVersion` is immutable after bookings or change-managed through a controlled versioned process.
- `Booking 1..N BookingItem`, and a booking item can reference zero or more supplier attempts but exactly one accepted supplier reservation/fulfilment path at a time unless the product explicitly supports split fulfillment.
- `BookingItem N..N Passenger` through assignment for group/multi-room/multi-segment situations.
- `PaymentIntent 1..N PaymentAttempt`; each PSP event is stored idempotently; multiple charges require explicit authorization and user-facing disclosure.
- `Journal 1..N JournalLine`; posted batches balanced by the approved accounting policy and never deleted to hide a discrepancy.
- `Notification 1..N ProviderAttempt` and `1..N DeliveryEvent` with provider event dedupe.

## 7. Indexing and tenancy

Candidate indexes (test with real query distributions):

- Trip search: `(market_id, origin_id, destination_id, departure_date, status)` where origin/destination search design supports it; geospatial indexes for nearby ports/stops only if PostGIS is selected.
- Inventory claims: unique active claim key by trip/seat/leg; index by hold expiry/status for cleanup and by booking item for release.
- Bookings: `(organization_id, created_at)`, hashed/normalized public lookup reference, and provider reference lookup. Avoid indexing full passenger IDs unless necessary.
- PSP events: unique `(provider_id, provider_event_id)` where provider semantics permit, plus correlation/idempotency indexes.
- Ledger: `(legal_entity_id, account_id, accounting_date, currency)`, journal/source-event unique keys for idempotent posting.
- Outbox: status/created-at and aggregate sequence; dead-letter query indexes.
- Audit: `(tenant_id, event_time)`, actor, resource type/id. Protect against unbounded retention.

Use tenant filters in server authorization and consider row-level security as a defence-in-depth control. If Supabase Data API exposes a table, its current guidance says exposed tables need RLS and careful grants; privileged keys bypass RLS and must never appear in the browser: https://supabase.com/docs/guides/database/postgres/row-level-security. RLS policies themselves require automated positive and negative tests.

## 8. PII, retention and deletion

Separate core transactional tables from encrypted/restricted identity details where helpful; store only identification attributes required by applicable supplier/regulatory rules. Tokenize/hash for matching where possible. Define retention by purpose and country; retain financial or regulatory evidence as required, and delete or de-identify data that no longer has a lawful basis. Backups have their own expiry/erasure procedure. Legal holds and unresolved disputes must be represented explicitly.

## 9. Schema governance

- Keep versioned migrations in source control; require review, forward and backward compatibility assessment, and rollback/forward-fix plan.
- Expand-contract for disruptive schema changes.
- Never run nontrivial migrations without backup/restore rehearsal and lock/latency assessment.
- Maintain generated data dictionary and relation diagram from migrations.
- Use synthetic seed data; do not copy production passenger data into development.
- Change any schema field that affects provider/contract/legal requirements through a traceable ADR/requirement update.

## 10. Sources

- PostgreSQL 18 locking: https://www.postgresql.org/docs/18/explicit-locking.html
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- PostGIS docs: https://postgis.net/documentation/
