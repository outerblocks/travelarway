---
name: provider-integration-research-and-implementation
description: Audit official provider documentation, design provider-neutral Travelar adapters, and implement booking/payment workflows with evidence, idempotency, security and approval gates.
---

# Provider Integration Research and Implementation Skill

## Trigger
Use this skill whenever a task touches Sabre, Travelport, ClickPesa, another GDS/airline/hotel/supplier API, payment/payout API, webhook, public checkout flow, HIMS/OIMS operation, provider version change or settlement/reconciliation behavior.

## Required sequence

1. Read root `AGENTS.md`, Travelar source-of-truth requirements and ADRs, then the `docs/research/provider-integration/` pack.
2. Inspect actual repository state and existing modules/tests before changing code. Keep current user-provided facts separate from verified source evidence, proposals and unknowns.
3. Open the exact current official provider reference for each proposed operation. Record title/product/API version, status (current/Beta/deprecated), documentation date/access date, schema, prerequisites, account scope, rate limit, TTL/expiry, retry/idempotency and relevant limitations. Do not trust a supplied old URL solely because it works.
4. Verify contract/account entitlement and environment status. A public API catalog is not a Travelar permission, agency/ticketing right, payment product enablement or production credential.
5. Map provider operations to Travelar's canonical domains and states. Provider-specific status/ID/raw schema must remain inside the adapter or restricted evidence store; public APIs/UI use Travelar terms.
6. Write or update the requirement/ADR and capability/evidence register before material implementation. Mark unknown capabilities `unknown` and block related actions rather than infer.
7. Implement a bounded unit with mock-provider tests first. Add contract/sandbox tests where the provider supplies an authorized test environment. Label mock, sandbox, certification and production evidence separately.
8. Use persisted idempotency/operation records for create, commit, fulfillment, refund and payout operations. On a timeout after a mutation, query/retrieve/reconcile before retrying.
9. Separate search, offer revalidation, reservation, ticket/voucher fulfillment, customer payment, merchant settlement, fiscal receipt and supplier payout. Do not advance a user-facing final state without the appropriate evidence.
10. Implement operational recovery: webhook authentication, durable inbox/outbox, deduplication, out-of-order events, rate limits, reconciliation queues, audit, owner/SLA, alerts and a kill switch.
11. Ensure provider secret and customer data handling obey the security charter. No tokens, raw card data, passwords or unnecessary IDs in logs, URLs, test fixtures or agent context.
12. Finish with tests, failures/skips, security/concurrency review, changed docs/ADR, evidence paths and unresolved gates. Do not claim “production-ready” from mock tests or public docs.

## ClickPesa-specific rules

- Treat public documentation as production API documentation unless ClickPesa explicitly provides an authorized non-production environment. Current public docs say there is no sandbox and API calls can move real funds; automated tests must not call production APIs by default.
- Make BillPay `EXACT` or partial-payment choice explicit. For a single booking, default proposal is `EXACT` where approved.
- Store provider reference-to-Travelar payment attempt mapping, verify callback/query/amount/currency/account and keep collection receipt separate from merchant settlement, booking fulfillment and payout.
- TanQR/Lipa Namba collection into Travelar's own account is distinct from a Lipa Namba payout to another beneficiary. Do not allocate shared-number payments by amount/time alone.
- Respect documented payout create rate limits and preview beneficiary/amount/fee/balance before a payout. `AUTHORIZED` is not a final completed payout where the relevant docs say otherwise.
- No live payment/refund/payout without named human approval, bounded test plan, reconciliation and stop conditions.

## Sabre/Travelport-specific rules

- Recheck current version and endpoint status, including replacements and deprecation. The supplied inventories include old versioned links and a Travelport deprecated folder.
- Model `search → revalidate/price check → reservation/create booking → fulfill/ticket → retrieve/verify` where the provider's actual workflow requires these steps; allow documented exceptions only as capability-specific routes.
- GDS, NDC, LCC, air carrier, agency and market differences matter. Store expiry and time limits returned by provider; never hardcode a single universal time window.
- Do not expose GDS/aggregator names as Travelar website sections; show the actual transport operator/carrier/property as needed for truthful service identity and disclosures.
- Hotel content/availability/rates do not automatically prove booking/modify/cancel/commission rights. Each action is its own capability and entitlement gate.

## Acceptance evidence
Every provider implementation must show current source/version, entitlement, contract-test evidence, state mapping, duplicate/timeout behavior, rate limit, privacy/security, observability, reconciliation/runbook, and test output. If a critical dependency is unknown, mark the capability blocked or mock-only.
