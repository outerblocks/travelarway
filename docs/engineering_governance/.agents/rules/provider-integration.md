# Provider Integration Rule

For any supplier, GDS, payment, payout, webhook or external booking workflow, use `.agents/skills/provider-integration-research-and-implementation/SKILL.md` and `docs/research/provider-integration/`.

- Use current official provider docs and capture API version/status/last-checked evidence; do not assume a user-supplied URL is current.
- Provider documentation and public API catalog do not prove account access, production entitlement, commercial rights or regulatory approval.
- Keep Travelar domain/UI provider-neutral and provider state mapping behind adapters.
- Separate search, revalidation, booking, ticket issue, collection, settlement, fiscal receipt, payout and after-sales states.
- Never blindly retry create/commit/fulfill/refund/payout after timeout; query/retrieve/reconcile first.
- No live ClickPesa transaction in automated tests: public docs state no sandbox. Real-money operations require explicit human approval.
- Do not claim a provider, ticketing action, payout or payment is complete without the correct authoritative evidence.


For operator-side route and recurrence management, seat-map/inventory semantics, data-driven card/forms, staff roles, HIMS payout controls or partner API documentation, also read Documents 76–83 and the `data-driven-platform-operations` skill.
