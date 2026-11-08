# ADR-CHAN-001 — Immutable Channel Evidence and Versioned Commercial Policy

**Status:** Proposed, subject to product/finance/legal approval  
**Date:** 24 October 2026

## Context

Travelar intends to sell through its own web/app, Travelar-managed agents and call center, operator POS/agents/call centers, white-label domains and partner APIs. Different channels may have different commission and agent-incentive agreements, but a client-submitted source field is untrusted and the channel alone cannot decide all commercial obligations.

## Decision direction

Capture booking origin from server-authenticated context and persist it as append-only evidence. Evaluate commission and agent compensation through versioned commercial agreements that consider source plus mode, supplier/operator, product/route, market, agreement validity, pricing/payment route, discount/refund and other explicit contract inputs. Corrections append an audited correction event; they do not erase original facts or silently rewrite posted journals.

## Consequences

- Channel taxonomy is database reference/configuration data with stable IDs and effective versions.
- Travelar and operator call center/POS paths have distinct channel identities, even when both use Travelar Core API.
- `0% marketplace commission` is a contract rule, not an inferred default for all operator-originated activity and not an exemption from law/tax/PSP/supplier fees.
- Agent payout/incentive is distinct from supplier commission and customer money.
- White-label/API commission is unresolved until signed terms explicitly specify it.

## Validation

Replay channel identifiers through every portal; attempt client-supplied attribution forgery; compare operator agreements; verify commission base and agent subledger; verify corrections/reversal entries; test historical rule versions.
