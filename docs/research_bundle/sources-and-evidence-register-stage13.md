# Stage 13 Evidence Register — Owner-Supplied Product Baseline

**Date:** 24 October 2026

This stage is principally a consolidation of product-owner requirements supplied in conversation, not an external market/legal research stage. No citation is needed for facts provided by the product owner. The register below classifies the source and remaining validation.

| Source | Type | Supports | Limitations / validation |
|---|---|---|---|
| Product-owner message dated 24 Oct 2026 | Explicit requirement | Four currently described public modes; bus/ferry workflows; segment inventory; passenger details; review and checkout; ticket animation; OIMS/HIMS model; localization; adapters | Does not prove the feature exists in current code or that supplier/regulatory requirements permit every field or fare rule. |
| Existing cumulative Travelar baseline, documents 13, 15, 16 and 31 | Previously consolidated research | Six-mode first-class product scope, adapter patterns, role/tenant controls, open evidence gates | Needs the Stage 13 delta reconciliation; no production access is implied. |
| OuterBlocks Limited operating-company direction in earlier product-owner specifications | Explicit previous direction | Established operating-company identity | New reference to Travelar Destinations Limited requires owner/legal-record reconciliation; don't infer a subsidiary or contract role. |
| Actual frontend source repository | Not supplied in this stage | Needed to map current routes/components and preserve design system | Implementation claims must remain unverified until supplied and inspected. |
| Bus operator tariffs and route/service configuration | Direct supplier/operator evidence required | Route order, full service/segment mapping, stop times, seat layouts, fares, passenger categories | Example routes/class labels are illustrative only. |
| Ferry operator contracts, tariff sheets and route/regulatory records | Direct operator/regulator evidence required | Resident status, ID requirements, class capacity, currency, taxes, refund rules | Example prices in user message are not authorized fare data. |
| PSP contracts and technical specifications | Direct provider evidence required | Webhook verification, transaction status, refund and ticket-issuance dependencies | Browser success is not payment evidence; provider differences remain. |
| Legal company, licence and tax records | Direct corporate/regulatory evidence required | Correct contracting, licensing, merchant and supplier entities | Not inferable from product labels or domain structure. |


## Stage 21 correction — corporate entity decision supersedes older records

The product owner explicitly confirmed OuterBlocks Limited as parent and OuterBlocks Destinations Limited as the intended Travelar operating entity. Older Stage 13 evidence entries that describe OuterBlocks Limited as the operating company or describe Travelar Destinations Limited as the proposed entity are historical records and are superseded for current design. Use OuterBlocks Destinations Limited as intended operator in current artefacts, while keeping registry status, relationship, business objects, licences, signatories, merchant accounts and regulatory authority as mandatory verification gates.
