# Stage 20 — Build Dependencies and New Decision Gates

This file adds only dependencies newly raised by the 24 October 2026 proposal. It supplements `27-build-sequence-and-dependency-graph.md`, `28-phase-by-phase-engineering-roadmap.md` and the existing launch gates; it does not replace them.

## 1. Immediate priority updates

| Priority | Work item | Dependency / evidence | Blocks |
|---|---|---|---|
| P0 | Resolve entity of record | BRELA extracts/current status, explicit company decision and legal/tax advice for any holding/subsidiary structure | Supplier and agent contracts, merchant accounts, regulatory applications, privacy notices and legal footers |
| P0 | Assess GN 158C mandatory electronic payments | Written legal interpretation of covered services, new-entrant/transition treatment, receipt/accounting roles and effective date for each channel | POS/OTC tender design and live bus/ferry/air/rail/hotel/tourism payment routes |
| P0 | Confirm LATRA and TRA connection path | Current LATRA system approval/connection docs, authorized provider options, EFDMS/VFD provider and production/test requirements | Production bus OIMS, ticketing, manifests, fiscal receipt flow |
| P0 | Baseline authenticated channel taxonomy | Product/finance agreement per channel, signed commercial contracts and attribution correction policy | Commission engine, agent earnings, zero-commission channel, white-label/API activation |
| P0 | Classify Travelar agent float | Counsel/BoT/PSP classification, permitted flow, funds safeguarding and bank/PSP terms | Agent float/wallet top-up, spend and payout features |
| P0 | Confirm fiscal invoice responsibility | TRA/tax adviser and approved EFD/VFD integration route for operator fare vs Travelar fees | Fiscal receipts/invoicing and accounting close |
| P1 | White-label domain proof of concept | Domain verification, tenant mapping, TLS, caching, legal disclosure and channel attribution tests | Custom-domain production storefronts |
| P1 | Concurrency proof of concept | PostgreSQL 18 transaction/locking test with overlapping segments and multi-channel load; Redis comparison if needed | Seat/segment hold implementation decision |
| P1 | Edge WAF/traffic provider evaluation | Current plan-level capabilities, cost, logging, privacy and routing details | Production edge security vendor selection |

## 2. Recommended build order for these deltas

1. Keep existing product requirements and existing ADRs as the source baseline; add these as proposed deltas and decision gates.
2. Resolve the corporate entity and contracting authority, and get legal analysis of the 2026 mandatory electronic-payment order. These are external decisions, not tasks an AI coding agent can infer.
3. Model `channel_registry`, authenticated source evidence, signed policy/version snapshots and correction-event workflows. Keep commission computations derived from channel + agreement + mode/market + transaction facts.
4. Add regulator/authority + fiscal provider capability registries and a reusable outbound adapter pattern. Build against verified specifications/test fixtures; keep production state disabled until approval.
5. Implement compliant payment-method eligibility and tender behavior per effective-dated legal policy; update POS/call center without losing prior-period cash reconciliation.
6. Build/verify OIMS onboarding workflow and locked beneficiary-account approval. Provision operator accounts only in pending state; activation must name each enabled mode/channel/market/route.
7. Prove tenant isolation, channel attribution, financial ledger and inventory consistency across B2C, HIMS call center, Travelar agent, OIMS POS/call center, white-label and partner API.
8. Evaluate WAF provider/plan and optional Redis/queue components using reproducible tests and current total-cost/hosting/legal evidence; do not let a tool preference drive the architecture.
9. Run end-to-end acceptance including regulatory/fiscal failure paths, unknown payment state, duplicate webhook, hold expiry, stale supplier data, tenant cross-access and contract policy changes.
10. Activate each market/mode/provider/channel only after its own evidence-based go/no-go gate; preserve all six modes as first-class product scope even if their transaction activation dates differ.

## 3. Definition of complete for the new channel/operating model

A vertical slice is not complete until:

- the same booking has consistent availability/price/payment/fulfilment across allowed sales channels;
- authenticated source and correct channel policy are recorded immutably;
- supplier/Travelar commission and agent incentive are separate audited amounts;
- operator-owned zero-commission channel behavior is proven only for an agreement that explicitly sets it;
- direct-operator and Travelar-collected PSP flows reconcile differently as intended;
- payment methods obey market/service/effective-date policy;
- fiscal/regulatory records are separated from payment confirmation and ticket PDF;
- role/branch/tenant permissions pass negative tests;
- onboarding and go-live state cannot bypass missing legal/provider approvals;
- a failed/unavailable authority or PSP leads to a clear safe state and recoverable queue, not a fake success;
- evidence, remaining unknowns and provider/regulator test outputs are documented.

## 4. Research limits

The new public sources establish specific legal text and regulator statements. They do not establish Travelar's company registration, legal entity structure, licence, LATRA system-owner approval, TRA API credentials, merchant agreement, split payment access, wallet authorization, domain ownership or production state. These must be evidenced independently.
