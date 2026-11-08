# 47 — Data-Driven Platform, Search and Business-Rule Configuration Governance

**Product:** Travelar · **Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Stage:** 19 · **Date:** 24 October 2026  
**Status:** Architectural requirement proposed for acceptance; production behavior and implementation still unverified.

## 1. Decision statement

Travelar shall be data-driven across the consumer website, all six modes (Bus, Ferry, Flights, Stays, Train and Experiences), HIMS, OIMS, agent/call-centre/marshal experiences, finance, integrations, analytics and operational workflows.

The runtime shall fetch operationally variable values from authoritative APIs backed by database records or authorized providers. It must not use hardcoded production catalogs, route lists, market policy, prices, field requirements, operator details, result-card values or contract rules as the source of truth.

This does **not** mean arbitrary executable scripts, SQL, templates or code can be entered into the database and run. Configuration is typed, schema-validated, permissioned, versioned, tested, approved when material, effective-dated and auditable. Correctness/security invariants remain enforced in reviewed application and database code.

## 2. What must not be hardcoded as production data

| Domain | Examples | Authoritative source |
|---|---|---|
| Geography | Countries, markets, regions, districts, cities/localities, languages, time zones, currencies, locale formats | Master-data registry; sourced/curated records with provenance |
| Transport locations | Bus stops, terminals, boarding/drop-off points, ports, airports, stations and location aliases | Location registry plus operator/supplier authority and effective dates |
| Routes and services | Ordered route stops, direction, eligible boarding/drop-off pairs, trips, sailing schedules, train products, provider service IDs | Mode/operator/supplier catalog; source ownership recorded per field |
| Search | Available modes, input fields, destination lists, filters, sorting choices, card fields/labels, page sections and eligibility | Search configuration plus current catalog and availability providers |
| Products/inventory | Bus fleet and seat layouts, ferry vessel/classes/capacity, room/activity/ticket products and permitted inventory methods | Operator/OIMS or supplier authority, not user-editable search code |
| Commercial rules | Fares, fee components, commissions, permitted markups, discounts, refund/cancellation terms and commissionable base | Signed contract/policy record with version and effective dates |
| Passenger data collection | Required/optional fields, validation, permitted ID types, age/categories, country/mode/supplier-specific questions | Purpose- and contract-backed policy, reviewed for privacy and legal need |
| Mode and provider availability | Country-mode enablement, supplier coverage, provider capabilities, channels, maintenance/sales windows | Evidence-backed market/mode/provider configuration |
| Content/discovery | Hot deals, featured destinations, guide links, images, page placement, localized content | Content-management records and publication workflow |
| Operations | Approval thresholds, queues, SLA timers, escalation routes, notifications, templates, shift rules | Governed workflow and policy configuration |
| Access | Role-to-capability grants, organization/branch/trip scopes, separation-of-duties rules | Authorization registry, constrained by code and identity provider |
| Integrations | Enabled adapters, supported operations, mappings, health status, priorities, timeouts within safe bounds | Provider registry and versioned adapter configuration; credentials in a secrets manager |

The platform's supported mode-specific behavior remains explicit in code. For example, a bus seat can be occupied across route segments and ferry inventory is generally capacity per sailing/class. A database row cannot turn one inventory model into another without the corresponding reviewed implementation.

## 3. Data-driven search and result rendering

### 3.1 Search configuration request

At page load, the client requests a public, cacheable configuration scoped by market, language, currency, device/channel if relevant, and active mode. The response describes enabled modes, search field metadata, safe filter definitions, labels, defaults, and the configuration version. It does not grant security permissions.

When a mode is selected, the browser requests current eligible locations/catalog data from the API. Inputs must use stable IDs rather than display labels. Search submissions send validated IDs and travel parameters to the backend, which applies business eligibility, inventory, pricing and provider routing; client-side filters are never authority for price, eligibility or availability.

The search API should return a normalized envelope with: search ID/correlation ID, mode, market, currency, configuration/policy version, data provenance/last-sync information when relevant, result IDs, supplier/operator identifiers, permitted display fields, price breakdown/currency, availability freshness, result actions and pagination metadata. Preserve provider-specific raw status/evidence separately; normalization must not fabricate capabilities a source does not provide.

### 3.2 Result cards are configured but safely rendered

Card field selection, order, localization keys, tags, badges, filter controls and supported actions can be configured. Each mode has one or more versioned, reviewed card schemas/templates. The renderer maps safe, registered field keys and component types to implemented frontend components. Do not store arbitrary HTML/JavaScript in configuration or allow untrusted suppliers to inject markup.

A bus card can be configured to show route origin/destination, boarding/dropping area when appropriate, operator logo/name, bus class, vehicle/model/registration if approved for public display, departure/arrival time, duration, amenities, available seats and priced segment. A ferry card may show vessel, sailing, class availability and fare categories; it must not assume bus-style numbered seats. Flights/stays/train/experiences render only fields supported by their authorized supplier feed and contract.

### 3.3 Dynamic location and endpoint rules

- `from` and `to` are location/product IDs, not literal text strings assumed by code.
- Region/city/location hierarchies are stored as parent-child master data; mapping rules handle aliases, spelling/transliteration, localized names and supplier identifiers.
- Boarding and drop-off are eligible ordered route-stop pairs for the specific trip/operator, not every stop in a country.
- Each stop relationship records whether boarding, alighting or both are permitted, effective dates, order, schedule offset, service restrictions and source owner.
- The API filters candidates by country, mode, operator, route, trip date, active status and permissions before returning them.
- The search index/cache is derived data. The authoritative database/provider state and configured freshness threshold decide whether an offer may be sold.
- Empty results, stale supplier data, unsupported region/mode and provider outage have explicit user-visible states; no fake/fallback inventory is displayed as bookable.

## 4. Configurable business policy versus immutable invariants

### 4.1 Configurable policies (within validated limits)

Fare tables and components; permitted commission/markup formulas; eligible routes/channels; coupon rules; passenger fields and validation metadata; country/mode activation; support categories; SLA timers; approval thresholds; notification templates; result sorting options; provider priority/eligibility; content placement; inventory-hold durations within safe bounds; cancellation policy references; shift rules; report definitions from approved fields; and which enabled capabilities are exposed to a tenant.

### 4.2 Code/database-enforced invariants

- Tenant and object authorization on every protected API operation.
- Money values use exact decimal/minor-unit rules, currency-aware arithmetic, balanced journals and immutable posted accounting entries.
- A browser never proves payment success. Only server-verified provider evidence and defined booking reconciliation may do so.
- Inventory allocation is atomic and concurrency-safe. Bus segment conflicts and ferry class capacity cannot be bypassed through config.
- Idempotency for commands, callbacks, booking/seat allocation, refunds and payouts where supported.
- State transitions must be valid; clients cannot directly set privileged statuses such as `PAID`, `ISSUED`, `SETTLED`, `APPROVED` or `ACTIVE`.
- Cross-tenant data access is denied by default; row ownership and branch/trip scope are enforced by server authorization and, where appropriate, database constraints/RLS.
- Secret storage, signed provider callbacks, safe parameterized queries, audit integrity and restricted production operations.
- Workflow approvals cannot be configured to defeat mandatory separation of duties or legal/provider gates.

The rule registry may configure a policy result (for example, a cancellation penalty), but code defines allowed inputs, output schema, units, bounds, and the mandatory control checks surrounding it.

## 5. Configuration registry model

Recommended logical entities (names illustrative, not final DDL):

- `configuration_domain`, `configuration_key`, `configuration_version`, `configuration_value` (typed JSON/schema or normalized typed tables for high-integrity entities), `configuration_scope`, `effective_period`, `publication_status`, `approval_record`, `change_request`, `validation_result`, `rollback_reference`.
- `country`, `market`, `region`, `locality`, `travel_location`, `location_alias`, `terminal`, `boarding_point`, `route`, `route_version`, `route_stop`, `trip_instance`, `service_class`, `inventory_policy`.
- `mode_capability`, `market_mode_status`, `provider_capability`, `supplier_authorization`, `contract_version`, `policy_version`.
- `search_profile`, `search_field_definition`, `search_filter_definition`, `result_card_schema`, `result_card_field`, `sort_profile`, `public_page_slot`.

Prefer normalized tables for high-integrity relationships (locations, stops, routes, contracts, fares, accounting, tenant membership). Typed JSON may be useful for safe presentation metadata and evolving form schemas, but not as a replacement for foreign keys, constraints, transaction boundaries or queryable financial facts.

Every configuration item carries a scope (global, country/market, mode, provider/supplier, operator/tenant, branch/service/product where necessary), version, state, creator, reason/source, reviewer when required, effective start/end and audit reference. Resolution uses a documented precedence order and rejects ambiguous/conflicting active records. Never silently choose an arbitrary matching configuration.

## 6. Authoritative source registry

For every significant field/action, record `system_of_record`, `field_owner`, synchronization direction, freshness expectation, correction authority, conflict-resolution policy and evidence. Examples:

- Travelar OIMS-primary: Travelar owns configured schedules/inventory as specified by contract/regulatory path.
- Integrated operator: the operator system owns agreed schedule/fare/availability fields; Travelar owns its own transaction and payment records.
- Distribution-only: supplier owns inventory and reservation state; Travelar tracks a correlated marketplace order and supplier status evidence.
- GDS/OTA: supplier-specific product/order/payment semantics remain explicit; a normalized adapter must not imply Travelar controls ticketing or fulfillment when it does not.

If current authority is unknown or freshness breaches a sale-critical threshold, disable the affected action or move the booking to a defined exception state. Do not quietly fall back to stale values.

## 7. Configuration publication lifecycle

`DRAFT → VALIDATION_FAILED | VALIDATION_PASSED → REVIEW_PENDING (if required) → APPROVED → SCHEDULED/ACTIVE → SUPERSEDED/RETIRED`.

Every change should support:
1. Draft/edit in a scoped management UI.
2. Schema and semantic validation (referential integrity, overlapping effective dates, eligible stops, fare coverage, currency, contract dates, role/approver conflict, route consistency).
3. Impact preview (affected markets/operators/trips/bookings/caches/search filters/invoices, as applicable).
4. Simulation/tests against representative synthetic cases and current configuration version.
5. Review/approval using maker-checker rules for material or privileged changes.
6. Controlled publish with an immutable version and publication event.
7. Cache/search-index invalidation and propagation tracking.
8. Monitoring of failures and rollback/supersession path.

A rollback does not rewrite historical transactions. Existing bookings, quotes, tickets and ledger postings retain the configuration/contract snapshot that was applied when the transaction was created or confirmed. A corrective journal or amendment is recorded where required.

## 8. Version snapshots and explainability

For every quote/booking and material internal decision, capture enough evidence to explain why the outcome occurred:

- market/mode/operator/provider/route/product IDs;
- source IDs and source version/time;
- applied config, contract, fare, fee, commission, markup, passenger-field, eligibility and refund-policy versions;
- normalized request inputs and the required minimum audit fields (avoid collecting excessive personal data);
- pricing inputs/output and line-item breakdown;
- rule decision ID and explanation/reason code;
- actor, timestamp, correlation ID and subsequent changes.

If a customer challenges a fare or Finance challenges a commission, staff should be able to replay the decision with historical inputs and policy versions—not calculate it using today's settings.

## 9. API, caching and frontend contract

- The backend exposes typed DTO/API schemas and versioned public/private configuration endpoints. Frontend types are generated or checked from API contracts; there is one defined contract rather than duplicated hand-maintained lists.
- Public configuration may be cached with scoped keys and ETags/version identifiers; private/tenant configuration requires authorization-aware caching. Never cache cross-tenant results under a shared unscoped key.
- Cache invalidation follows published version events/outbox; stale sensitive configuration is not allowed to authorize payments or inventory.
- Search uses indexed server-side filtering, pagination and reasonable result limits; don't download every stop or route to filter in the browser.
- Configuration rollout must tolerate old/new frontend versions according to an explicit compatibility contract; unknown configuration types fail closed or degrade with a recorded diagnostic.
- Feature flags can limit rollout, but not act as authorization or bypass safety gates.

## 10. Configuration governance and security

- Only authorized roles may create/edit/publish specific configuration domains; operator users can edit their own permitted operational setup, not Travelar-wide rules or other tenants.
- Sensitive configuration uses MFA/step-up, maker-checker, immutable audit events and alerts.
- Free-form expression support, if added, must be restricted to a reviewed safe language and registered functions; no arbitrary SQL, shell, JavaScript or network requests from configuration.
- Configuration, contract versions and audit logs are backed up and restoration-tested. Logs record before/after diff or protected diff reference, actor, reason, approvals, effective dates and publication status.
- Provider credentials and secrets are references to a secrets-management service, never values in ordinary configuration JSON or frontend payloads.
- Permission checks happen server-side on every request. UI hiding is not a security boundary.

## 11. Build acceptance criteria

- No production fare, route, stop, operator, boarding/drop-off option, market activation or commission is sourced from a hardcoded frontend array.
- Creating an authorized location/route/fare through a permitted admin workflow makes it available in the correct market/mode after validation and publication, with no application rebuild.
- A config scoped to one market/operator cannot leak into another due to caching or resolution precedence.
- A published config version can be inspected, explained and superseded; booking/accounting history continues to refer to the correct old version.
- Invalid/ambiguous config cannot be published.
- Frontend cannot invent or change an allowed action, price or security permission by editing request data.
- Tests prove fail-closed behavior when required configuration/source data is missing or stale.
- Accessibility, loading/empty/error/offline states, performance and privacy are tested alongside successful paths.

## 12. Sources and constraints

- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Multi-Tenant Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html
- Keycloak Authorization Services: https://www.keycloak.org/docs/latest/authorization_services/index.html
- Camunda DMN overview: https://camunda.com/dmn/

DMN is a candidate standard for bounded, explainable decision tables (e.g. commission or eligibility matrices) if the pilot proves it useful. It is not a mandate to add a separate enterprise rule engine before need is demonstrated.
