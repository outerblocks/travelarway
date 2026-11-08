# Travelar data-driven operations rules

- Requirements in Documents 76–82 are target requirements; audit actual code and record gaps before implementing.
- Operators configure locations, ordered routes, route versions, recurring schedules and dated trip occurrences through validated APIs and workflows. Generate trip schedules over explicit date ranges and rolling horizons using preview, idempotency, conflict detection and audit.
- Search cards, forms, fares, amenities, seat maps and actions are driven by database-backed configuration and current authorized provider data. Never hardcode live business data or trust client-side prices/availability.
- Do not use database configuration to execute arbitrary code. Render only typed, allow-listed field/component profiles.
- Bus seat allocation is segment-based and transaction/concurrency-safe. Ferry capacity and external provider inventory have their own strategies.
- Organization, role and branch scopes are enforced on every backend action, not just in UI. Prove tenant isolation with negative tests.
- Automated payouts must be eligibility-driven, idempotent, rate-limited, maker-checker controlled where required and reconciled. `pending`/`authorized` is not synonymous with paid/settled.
- Separate audit, security/operational logs and financial ledger; redact secrets and sensitive passenger data.
- Partner APIs are Travelar-owned and documented in version-controlled OpenAPI, with OAuth/client credentials as appropriate, scopes, quotas, idempotency, signed webhooks, lifecycle and contract tests.
- Production actions and irreversible financial/security changes require explicit human approval.
