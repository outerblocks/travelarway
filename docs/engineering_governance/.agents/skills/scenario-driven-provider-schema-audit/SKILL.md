# Scenario-Driven Provider Schema Audit Skill

## When to use
Use before implementing or certifying any external travel or payment provider, after an API catalog/version change, and when reviewing an integration as part of a repository audit.

## Mandatory sequence
1. Read Docs 84–88 and the current provider adapter standards.
2. Confirm exact provider product/API family/version, market/POS/account and environment. If unknown, record blocked/mock-only rather than inventing.
3. Extract official schemas/reference data under access/license terms; record URLs, checked dates and schema hash/version.
4. Create operation inventory and source-path-to-canonical-field mapping for each API operation.
5. Preserve provider identifiers, raw status and current deadlines; map to Travelar canonical state only through tested functions.
6. Include success, empty, warning, auth error, validation error, rate limit, schema drift, timeout-after-create, out-of-order callback, partial success and after-sales fixtures.
7. Map each scenario to a requirement/ADR, executable test, evidence record, owner and remaining risk.
8. Keep provider-specific APIs, credentials and payloads out of public frontend code and public API responses.
9. Do not call a production endpoint in automated tests if it can create a booking, issue a ticket, collect or move money, refund or pay out. Use mocks/authorized sandbox; require human approval for live actions.
10. Reconcile schema changes with the capability registry, OpenAPI docs, runbooks, metrics, security controls and commercial/legal gates.

## Completion gate
An adapter operation is complete only when the current schema, mapping, entitlement, state transitions, failure/recovery, security, tests and operational evidence are reviewed. A green mock test is necessary but does not establish production readiness.
