# ADR-PAY-001 — Multi-PSP Adapter Architecture

- **Status:** Accepted architectural direction; provider-specific production activation unresolved.
- **Date:** 23 October 2026
- **Owner:** Travelar / OuterBlocks Limited
- **Related:** `ADR-GDS-001-multi-provider-adapters.md`, `10-psp-communications-and-ussd-provider-comparison.md`, `12-financial-accounting-settlement-and-reconciliation.md`.

## Context

Travelar expects to support multiple customer payment methods and multiple countries. Candidate providers include Selcom, ClickPesa, Pesapal and DPO Pay by Network, with future providers possible. Their API styles, callback security, merchant agreements, fees, payment-method availability, refund limitations, settlement, reserves and payout rights differ. For example, Pesapal API 3.0 requires a transaction-status lookup following callback/IPN; DPO describes hosted checkout plus callback and token verification; Selcom's public Business API documents HMAC-signed transfers and successful-transfer callbacks; ClickPesa's current developer docs say there is no sandbox and calls move real funds. These differences cannot be safely flattened away.

## Decision

Travelar will use a **provider-neutral internal payment domain with separate, versioned adapters for each contracted PSP product/account and country**. No single PSP is the global dependency. Payment-provider activation is a commercial, regulatory and operational decision separate from architecture readiness.

## Design consequences

1. A payment registry selects an adapter by legal entity, country, currency, payment method, merchant account, transaction type and current capability flags.
2. Capabilities are documented per provider product/account: collection, checkout type, method, status query, refund type, payout type, settlement report, supported currency, idempotency and test environment.
3. Normalized payment state is stored alongside raw provider state and provider reference. Provider-specific source data remain available for audit and reconciling.
4. Webhook ingestion is provider-specific: signature/authentication method is not guessed or generalized without contract documentation. Every event is durably stored, deduplicated and processed idempotently.
5. Payment success, fulfilment/ticket issuance, refund completion, payout initiation and settlement completion are separate states and events.
6. Finance records are posted through the ledger/reconciliation layer; an adapter must not directly mutate booking payable/revenue balances.
7. Routing and fallback rules are conservative. A failed/unknown attempt must first be queried/reconciled before retrying through another provider to avoid double-charge. Provider failover is not a blind replay of a payment request.
8. No card or payment-method surcharge is configured until the applicable country's legal rule and the PSP contract have been confirmed in writing.
9. Refund, payout and supplier-settlement actions require the same approval/audit controls regardless of the initiating UI/API channel.

## Alternatives considered

- **Single global PSP:** fewer integrations initially but creates vendor lock-in, country/method gaps and a single outage point. Rejected as the fixed architecture.
- **Direct bespoke PSP calls inside each booking module:** quicker for one demo but spreads payment-specific logic and increases inconsistent security/reconciliation. Rejected.
- **Normalize every provider to a simplistic `success/failure` callback:** ignores pending, reversed, unknown, delayed, refund and settlement states. Rejected.
- **Use a PSP orchestration platform instead of direct adapters:** can reduce effort, but would introduce a new dependency and possible limits on local methods, fee transparency, submerchant/payout rights and data. Keep as a future option to evaluate, not assume.

## Security, finance and regulatory consequences

- OuterBlocks must confirm it is permitted to collect and settle funds under the actual merchant/submerchant model. An adapter architecture is not a payment licence.
- No stored-value/customer wallet or pooled operator-money feature is implied by this decision.
- Provider secrets reside in a secure secret manager with separate prod/test credentials and least privilege.
- Events and ledger postings are auditable; reconciliation identifies missing or contradictory events.
- Production activation requires a current contract, tariff, merchant account, KYC approval, legal classification, live test plan and runbook.

## Acceptance criteria

- Contract-test suite for each adapter's success, pending, failed, reversed, timeout, malformed response and status inquiry.
- Duplicate, delayed, replayed and out-of-order notification tests.
- Same idempotency key/retry tests; ambiguous network timeout query-before-retry tests.
- Correct amount, currency, merchant reference and provider account validation.
- Full/partial refund cases where permitted, rejected/accepted-pending/settled refund states.
- Failed ticket issuance after successful payment and payment success after inventory expiry.
- Daily PSP transaction vs booking vs ledger vs bank-settlement reconciliation.
- Disable/failover procedure that does not duplicate payment and preserves access to existing provider records.
- Signed-off country legal/payment-flow note and finance approval.

## Open conditions

- Final provider order and commercial contracts.
- Whether each provider supports a true sandbox and which live testing risk is acceptable.
- Account-level payout, split settlement, refund and reserve features.
- Method-by-method pricing and whether fees may be allocated to customer or merchant.
- Merchant of record and principal/agent accounting treatment for each travel mode.
