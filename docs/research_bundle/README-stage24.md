# Travelar Research Bundle — Stage 24

**Research cut-off:** 28 October 2026  
**Product:** Travelar  
**Parent company:** OuterBlocks Limited  
**Intended operating entity:** OuterBlocks Destinations Limited (corporate records/relationship/authority still require documentary verification).

## What's new in Stage 24

Stage 24 adds a provider integration pack to the cumulative Stages 1–23 baseline. It expands the owner-supplied ClickPesa, Sabre and Travelport documentation into Travelar-branded product flows, provider-neutral booking/payment states, public website UX/content requirements, HIMS/OIMS operations, approvals/audit, adapter contracts and acceptance tests.

### New documents

- `67-provider-api-evidence-and-version-register.md` — source evidence, current-version caveats, ClickPesa capabilities, Sabre modern workflow and Travelport v11 constraints.
- `68-provider-neutral-air-and-stays-booking-workflows.md` — canonical air/stays search, revalidation, reservation, ticketing, post-booking and safe error handling.
- `69-clickpesa-collections-payouts-and-counter-operations.md` — BillPay exact payment, TanQR, USSD/card/CRDB, payout queues, ledger and reconciliation controls.
- `70-travelar-public-website-content-and-ux-spec.md` — Travelar-branded site map, homepage, six mode forms, cards, checkout/confirmation dialogue, policy drafting checklist and content governance.
- `71-hims-oims-operating-workflows-approvals-and-audit.md` — HIMS/OIMS modules, daily workflows, maker-checker, audit schema, exception queues and shift-close rules.
- `72-provider-adapter-contracts-and-build-gates.md` — capability registry, provider-neutral service boundaries, webhook/outbox handling, security, build order and release gates.
- `73-provider-reference-url-inventory.md` — normalized owner-supplied links and current official reference URLs.
- `74-provider-neutral-travel-and-payment-contracts.ts` — TypeScript design sketch for cross-provider interface shapes; not production code.
- `75-provider-agnostic-integration-acceptance-matrix.md` — test planning matrix for air, stays, ClickPesa, HIMS/OIMS, UX and operations.
- `travelport-user-supplied-urls.txt` — verbatim text file with the 134 owner-supplied Travelport URLs.
- `sources-and-evidence-register-stage24.md` — primary source/evidence registry for the new stage.

The Stage 22 payment addendum and Stage 23 PostgreSQL/IDE-agent directive have been copied into the cumulative root as docs `56`–`66`. The original Stage 21 readme is preserved as `README-stage21.md`.

## Integration decisions that are now explicit

1. **Provider neutrality:** Sabre and Travelport stay behind adapters; neither owns Travelar's product vocabulary or public branding.
2. **Air lifecycle:** shopping is not booking; booking/reservation is not necessarily ticket issuance; ticketing/fulfillment and supplier retrieval must be verified.
3. **Version drift:** the URL lists are research inventory only. The IDE agent must identify current product/version/status and account entitlement before implementing any individual endpoint. Do not use supplied deprecated endpoints for new functionality by default.
4. **ClickPesa separation:** collection, payment-received, merchant-balance settlement, booking fulfillment, fiscal receipt and operator payout are independent states. `AUTHORIZED` payout is not a final completed settlement state where provider docs say otherwise.
5. **No sandbox:** ClickPesa tests default to mocked/contract fixtures. A real-money operation requires an explicit human approval, bounded amount, test plan and reconciliation evidence.
6. **Six modes stay first-class:** Bus, Ferry, Flights, Stays, Train and Experiences remain in the product domain model. Supplier integration can be staged by evidence and market capability without faking unsupported inventory.
7. **Travelar branding:** customer pages are Travelar-branded. Show actual carriers/operators/properties where meaningful, but do not present GDS/PSP APIs as the customer-facing product.
8. **HIMS/OIMS:** operational screens must include tasks, actions, permissions, approvals, audit and exception queues—not just dashboards.
9. **Finance and security:** use the established Travelar finance and authorization requirements: immutable journal history, contract-based commercial rules, idempotency, least privilege, tenant isolation, and explicit reconciliation.
10. **No production claims:** no provider connection or feature is deemed production-ready because a public API exists or a mock test passes.

## Build order

1. Read `AGENTS.md` and the entire engineering pack; audit the actual repository.
2. Reconcile current code with Documents `13`–`17`, `22`–`30`, `39`–`55`, `56`–`66`, and `67`–`75`.
3. Write the requirement-to-code/test gap matrix; log unresolved provider product/version/entitlement/contract items.
4. Implement canonical domain states, PostgreSQL migrations, auth, idempotency, event/outbox and test doubles.
5. Build Travelar-branded UX against canonical mocks, including pending/error/recovery states.
6. Build current provider contracts one operation at a time in an authorized test setup and record evidence.
7. Add HIMS/OIMS operations queues, approvals, ledger/reconciliation and observability.
8. Complete security/failure/accessibility/performance/restore tests, commercial/legal gates and human approval before production activation.

## Current status

**Research and design artifacts only.** No source repository was modified. No Travelport/Sabre production API call, no ClickPesa live payment/payout, no supplier booking, and no production deployment was performed as part of Stage 24. Use `75` to track actual test execution and `32-research-quality-audit-and-launch-readiness-gate.md` for launch readiness.
