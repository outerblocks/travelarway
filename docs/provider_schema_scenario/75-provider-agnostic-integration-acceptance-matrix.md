# 75 — Provider-Agnostic Integration Acceptance Matrix

**Purpose:** Executable test planning for the provider integration pack. Expand into test files after the repository audit. This matrix defines expected behaviors and safety requirements; it is not evidence that tests have been run.

| ID | Area | Scenario | Expected result / evidence |
|---|---|---|---|
| AIR-001 | Search | One provider responds, another times out | Eligible results returned under policy; missing source recorded in telemetry; no false claim of complete market coverage. |
| AIR-002 | Search | All providers return no offers | Clear empty state distinct from provider/API failure. |
| AIR-003 | Search | Unsupported market/provider capability | Provider is not called; reason and capability snapshot recorded. |
| AIR-004 | Offer | Offer response lacks key price/currency/terms | Invalid offer cannot be checked out as if complete; safe error and internal trace. |
| AIR-005 | Revalidation | Fare amount changes | Customer sees old vs new price and must consent before committing new quote. |
| AIR-006 | Revalidation | Fare/availability unchanged | Offer snapshot refresh stored; allowed workflow continues. |
| AIR-007 | Reservation | Timeout after create/commit | State becomes unknown pending reconciliation; retrieval/query runs before any repeated create. |
| AIR-008 | Reservation | Provider returns held/un-ticketed reservation | UI says reservation held/pending ticket; no “ticket issued” status. |
| AIR-009 | Fulfillment | Ticket issue accepted but response lost | Query/retrieve ticket status before retry; no duplicate ticket action. |
| AIR-010 | Fulfillment | Reservation exists but ticket is absent | Operations exception opened and customer receives truthful pending message. |
| AIR-011 | After-sales | Airline/market does not support requested exchange | UI does not offer action; clear reason and support route. |
| AIR-012 | After-sales | Refund quote expired | Quote is rechecked before submission; changed fees require confirmation. |
| AIR-013 | Provider version | Current docs mark endpoint deprecated | Build fails/ADR gate unless an approved compatibility exception exists. |
| AIR-014 | Provider versions | Sabre hotel API link is stale vs current catalog | Implementation record uses current version and verifies entitlement; old endpoint isn't adopted without reason. |
| AIR-015 | Travelport | GDS vs NDC cache/locator constraints differ | Tests apply route-specific freshness/identifier rules; no universal timeout is hardcoded. |
| STAY-001 | Search | Availability exists but booking operation is not enabled | Stay is shown as non-bookable/unsupported per approved UX; no fake booking CTA. |
| STAY-002 | Price check | Room rate, occupancy or cancellation deadline changed | Changed terms displayed and explicitly accepted; quote snapshot preserved. |
| STAY-003 | Reservation | Create call times out | Provider retrieval/reconciliation before retry; no duplicate reservation. |
| STAY-004 | Content | Image/data source lacks display rights evidence | Content not published or is replaced with approved fallback. |
| PAY-001 | BillPay | Exact mode receives expected amount | Provider result query/webhook maps to verified collection state; attempt amount/currency match checked. |
| PAY-002 | BillPay | Underpayment/overpayment | No ticket issuance by default; mapped to documented provider behavior and manual/partial workflow only if enabled. |
| PAY-003 | BillPay | Duplicate webhook | Exactly one state transition and one downstream fulfillment request. |
| PAY-004 | BillPay | Invalid checksum/signature | Callback rejected or quarantined; alert and evidence without secret leakage. |
| PAY-005 | BillPay | Payment remains PENDING/PROCESSING | Customer not asked to pay again; status recovery proceeds. |
| PAY-006 | BillPay | `SUCCESS` precedes merchant settlement state | Payment-received and merchant-settlement records remain separate. |
| PAY-007 | BillPay | Provider reference deactivation races with payment | Late/ambiguous payment becomes reconciliation case; no automatic oversell. |
| PAY-008 | TanQR | Same amount paid for two bookings | Transaction is not allocated by amount/time alone; queue for reliable reference or approved manual review. |
| PAY-009 | CRDB direct debit | Mandate cancelled/rejected | Scheduled collection is stopped; linked future attempts reflect mandate status. |
| PAY-010 | Payout | Beneficiary name cannot be verified | Payout create is blocked. |
| PAY-011 | Payout | Payout returns AUTHORIZED | Display as accepted/processing as appropriate; supplier payable not closed as final. |
| PAY-012 | Payout | Create call times out | Query provider before retry; no duplicate payout. |
| PAY-013 | Payout | One-create-per-60-second limit reached | Durable queue delays request; UI/ops sees deferred status. |
| PAY-014 | Payout | Provider returns REFUNDED or REVERSED | Corrective ledger entry and exception task created; no silent success. |
| PAY-015 | Pricing | Provider fee differs from stored tariff | Do not charge using stale assumption; reconcile and block/route based on policy. |
| PAY-016 | Live environment | Test runner attempts real ClickPesa endpoint | CI/test config blocks production network use by default. |
| HIMS-001 | Authorization | Operator user accesses another operator tenant | Backend denies and records audit event; no data in response. |
| HIMS-002 | Authorization | User requests forbidden action via direct API despite hidden UI button | Backend denies. |
| HIMS-003 | Approval | Initiator approves own payout where maker-checker required | Backend denies self-approval. |
| HIMS-004 | Approval | Beneficiary/amount changes after approval | Approval invalidated and new approval required. |
| HIMS-005 | Config | Publish config without required reviewer | Publication denied, draft retained. |
| HIMS-006 | Audit | Privileged update, denial and rollback | Events link actor, scope, diff/version, approval and correlation ID. |
| HIMS-007 | Finance | Ledger journal is unbalanced | Database/application rejects posting; no silent partial ledger state. |
| HIMS-008 | Finance | Provider statement disagrees with ledger | Reconciliation item created with owner/SLA; no historic journal edited. |
| UX-001 | Customer state | Payment pending | UI states pending; no duplicate payment prompt or ticket claim. |
| UX-002 | Customer state | Supplier booking confirmed but ticket pending | Distinct reservation/ticket message. |
| UX-003 | Customer state | Provider failed but Travelar can safely retry | Retry button calls backend idempotent operation and communicates current state. |
| UX-004 | Content | Destination guide has past review deadline | Revalidation queue item created; high-risk stale information hidden or flagged according to policy. |
| SEC-001 | Logging | Provider call includes secret/token/customer identity | Automated redaction scan finds no forbidden sensitive data. |
| SEC-002 | Webhook | Forged event with valid-looking reference but invalid auth | No state transition or payment fulfillment occurs. |
| OPS-001 | Observability | Provider error/rate limit spikes | Alert and integration queue include account/mode/operation, no PII. |
| OPS-002 | Recovery | Worker crashes after provider event accepted | Durable inbox/outbox resumes without duplicate side effect. |

## Required evidence per executed test

Record test ID, requirement/ADR, branch/commit, environment (mock/sandbox/production), test account entitlement, sanitized fixture or test resource, command, exit status, logs/evidence path, cleanup, observed result, reviewer and remaining risk. Do not mark a provider production-ready from mock tests alone.
