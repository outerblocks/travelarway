# 84 — Scenario-Driven Coverage Audit: Provider Schemas and Travelar Business Logic

**Research date:** 28 October 2026  
**Status:** Architecture/specification audit of the Stage 25 document pack. This is not a source-code, database, credential or production audit.  
**Purpose:** Determine whether Travelar has enough evidence and scenario coverage to implement Travelport, Sabre, Amadeus and other providers safely.

## Executive conclusion

**Not yet.** Stage 25 has a useful provider-neutral workflow model, a capability-registry proposal, API examples, an initial provider URL inventory and a valuable general acceptance matrix. It does **not** yet constitute a complete provider-schema implementation pack for every listed Travelport, Sabre and Amadeus endpoint.

The distinction is important:

- **Covered conceptually:** canonical search/offer/quote/booking states, revalidation, booking/ticket separation, hotel offer lifecycle, adapter boundaries, raw provider identifiers, errors, retry/reconciliation concepts and some cross-provider acceptance scenarios.
- **Partially covered:** provider workflow families and selected constraints, but without a full per-operation field mapping, current request/response schema source, sample payload fixtures, exact status mapping, eligibility matrix and contract-test evidence for every provider/product/version.
- **Not proven:** any live integration, current credential entitlement, production market rights, ticketing authority, hotel booking/servicing rights, rate limits negotiated for Travelar, or successful execution against a provider account.

No honest pack-level review can conclude that the running repository implements a schema merely because a Markdown example describes it. The IDE agent must separately audit the source tree and database.

## Material update: Amadeus Self-Service

The current Amadeus for Developers portal states that the Self-Service portal was decommissioned on 17 July and redirects users to the Enterprise API portal. Amadeus's public Enterprise portal now promotes request-based access to its wider API catalogue and an Enterprise sandbox. A February 2026 report describes the Self-Service API keys being disabled on 17 July 2026. For a new Travelar integration, do not use Self-Service documentation or archived specifications as the assumed implementation path. Treat that catalogue as historical research only; obtain the exact Enterprise API product, sandbox credentials, current schemas, support and commercial terms from Amadeus.

Primary references:
- https://developers.amadeus.com/toolbox
- https://developers.amadeus.com/enterprise/category/hotel/api/search-and-shopping
- https://developers.amadeus.com/enterprise/category/booking-management/api/pnr-elements
- https://phocuswire.com/amadeus-shut-down-self-service-apis-portal-developers

## Evidence labels used in this audit

| Label | Meaning |
|---|---|
| **Covered (C)** | The requirement is explicitly described in an existing Stage 25 document. It does not mean implemented. |
| **Partial (P)** | A principle or some scenarios are present, but required schemas, cases, mappings or operational evidence remain absent. |
| **Missing / not evidenced (M)** | We did not find sufficient evidence in the Stage 25 pack. This does not prove the local code has no such feature. |
| **Blocked (B)** | Cannot be finalized until exact provider, legal, contract, market or credential information is supplied. |

## Coverage by area

| Area | Stage 25 evidence | Audit result | Missing evidence / required addition |
|---|---|---|---|
| Provider-neutral air/stays lifecycle | Docs 68, 72 | P | Operation-by-operation request/response schema catalogue for each exact provider API family/version. |
| Travelport current TripServices | Docs 67, 68, 73 | P | Current v11 API contracts per operation, source-to-canonical field maps, fixtures, error mapping and certification scenarios. |
| Sabre REST/legacy endpoints | Docs 67, 68, 73 | P / B | Distinguish current Sabre Mosaic workflows from legacy/versioned APIs; audit every submitted endpoint against current catalog and enabled products. |
| Amadeus | Docs 6, 7, 7A, 44, 45, 67 | **P / material stale-path risk** | Replace assumed Self-Service path with Enterprise product discovery, access request, sandbox schemas and contract gate. |
| Air passenger / ticket schemas | Docs 68, 83 | P | Infant/adult association, child age, APIS/document rules, ticket coupons/documents, multiple locators, order-vs-PNR, EMDs and provider status mappings. |
| Hotel search / book / service | Docs 68, 67 | P | Multiple rooms, child ages, rate/room IDs, occupancy, cancellation deadlines/time zones, payment collection model, property content provenance, no-show and partial cancellation/refund cases. |
| Train / ferry / experiences supplier contracts | Docs 8, 9, 40, 68 | P / B | Exact supplier-by-supplier schemas and service actions remain market/provider specific; cannot be inferred from flight GDS schemas. |
| Bus operator routes / inventory | Docs 76, 77, 79 | C at requirements level | Runtime implementation and concurrency proof are unknown until code/database audit. |
| HIMS/OIMS roles, approvals, finance | Docs 71, 78, 80 | C at requirements level | Complete role-action and segregation-of-duties tests plus executed audit evidence remain to be demonstrated. |
| Partner APIs / OpenAPI | Docs 81, 83 | P | Implemented code-to-OpenAPI parity, scopes, webhook contract, version compatibility, rate limiting, key rotation and partner onboarding proof. |
| Payment-then-booking compensation | Docs 44, 68, 69, 75 | P | Explicit distributed failure matrix for payment success + supplier failure; supplier reservation success + collection failure; ticket issue uncertainty; compensation rights and human queues. |
| Provider contract drift | Docs 67, 72, 73 | P | Automated or scheduled schema/catalog drift checks and release-blocking contract tests. |
| Operational recovery | Docs 26, 72, 75, 80 | P | Per-operation runbooks, retry budgets, DLQ ownership, replay approval, status query strategy and measured restore drills. |

## Highest-priority conclusions

1. **P0 — Correct the Amadeus integration assumption.** Self-Service is not the new Travelar path as of this research date; obtain Enterprise product and access confirmation. Any old Self-Service-specific field or ticketing rule must be tagged historical/product-specific unless Amadeus reconfirms it.
2. **P0 — Build the schema evidence register per operation.** Do not mark a provider adapter complete based on a URL list or a single search test. Each operation needs current contract source, version, account capability, request/response schema, field mappings, error behavior, fixtures and scenario tests.
3. **P0 — Model air booking as separate commercial/provider workflows.** Searching, pricing, reservation creation, ticket fulfillment, supplier payment/settlement, customer payment, void/refund and exchanges can be separate operations and ownership boundaries.
4. **P0 — Add distributed transaction scenarios.** Payment, inventory, supplier booking and ticket issuance are not one ACID transaction. Unknown outcomes must be reconciled before retry; compensation must follow supplier/legal rights and approvals.
5. **P1 — Add explicit lifecycle cases for hotels and non-air modes.** Flight schemas must not be reused as a fake universal schema for trains, ferries, rooms or activities.
6. **P1 — Test all critical workflows from browser through database and provider adapter.** Mock tests are necessary but not proof of production access or end-to-end correctness.

## What this pack review cannot decide

- Which API product(s) Travelport, Sabre or Amadeus will provision to OuterBlocks Destinations Limited.
- Whether a listed provider API is included in a particular contract, point of sale, market, PCC/office/account, content source or booking channel.
- Whether airline ticket issuance, hotel merchant collection, refund/exchange, payment handling or supplier settlement is permitted under Travelar's actual agreements.
- Whether a schema shown in documentation is still the version provisioned to Travelar.
- Whether the repository already implements some of the requirements; source code and test execution evidence were not supplied for this document audit.

## Required implementation gate

No provider operation may be `production-enabled` until the exact product/version, current schema, account entitlement, market, data-use rights, credentials, test evidence, error/retry model, support route and commercial/legal prerequisites are recorded in the capability registry and reviewed by its named owner.
