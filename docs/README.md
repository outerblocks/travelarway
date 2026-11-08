# Travelar AI Engineering Governance Kit

This is a portable starter kit for applying the Travelar IDE-agent charter in a repository. It is not application code and does not replace legal approval, CI configuration, branch protection or human review.

## Included

- `AGENTS.md`: shared core charter supported by Cursor and Antigravity.
- `.cursor/rules/travelar-engineering.mdc`: concise Cursor-specific rule.
- `.agents/rules/travelar-engineering.md`: Antigravity workspace rule.
- `.agents/skills/*/SKILL.md`: shared procedures discoverable by both documented skill systems.
- `docs/engineering/templates/`: task intake, verification, and module acceptance templates.

## Install

Copy the files into the root of the actual Travelar repository. Merge rather than overwrite any existing `AGENTS.md`, ignore rules or tool configuration. Review the combined rules for contradiction. Inspect existing package scripts and CI before writing or changing verification scripts.

## Required adaptations before production

1. Map requirements/ADRs to real repository paths.
2. Agree task IDs, branch naming, reviewer and approval roles.
3. Add deterministic lint/type/test/build/security/migration and E2E jobs to CI using commands that actually exist.
4. Configure protected main/release branches and prohibit production deployment through IDE agent credentials.
5. Configure Cursor privacy/data controls or Antigravity data/permission policies according to OuterBlocks' actual plans and contracts.
6. Verify no live data/secrets appear in agent-accessible code and fixtures.
7. Test these rules on a bounded task and check that the agent actually discovers the files.

## Important

Rules and skills are instructions, not security boundaries. Enforce high-risk restrictions using access controls, CI, protected environments, secrets management and human approvals.

## Stage 23: PostgreSQL and full-stack execution

This version adds a repository-first implementation directive, the accepted PostgreSQL baseline ADR, remote-connection and Docker guidance, a discoverable shared agent skill and a Cursor-specific rule. The owner describes the current app as an incomplete frontend and expects the IDE agent to audit/remediate the existing repository and implement missing backend/database functionality from the requirements pack.

Start at `docs/engineering/implementation-directive.md`. Do not overwrite the actual app's existing governance files blindly; merge and reconcile them. Start with read-only database inspection and verify the target environment. Docker is optional, but an isolated test database is required for tests that can mutate/reset data.

## Stage 24: provider integration pack

This version adds official-source evidence review and provider-neutral requirements for ClickPesa, Sabre and Travelport, including booking/payment states, Travelar public UX/content, HIMS/OIMS workflows, approval/audit rules, adapter contracts and acceptance tests. Source documents are in `docs/research/provider-integration/` and the implementation workflow is `.agents/skills/provider-integration-research-and-implementation/SKILL.md`.

Install/merge this pack into the actual repository; do not overwrite existing governance or app source blindly. Reconcile with current requirements and run an audit first. Public API documentation does not prove contract, entitlement, booking/ticketing authority or legal approval. Live ClickPesa operations are blocked from routine CI because the public docs report no sandbox and real funds can move.


## Stage 25: data-driven operating system and partner API

This version adds the route/schedule/trip model, structured fleet/seat maps and segment inventory, scoped operator staff roles, data-driven runtime/search cards, HIMS payout/audit/security operations, Travelar-owned partner API/developer-portal requirements, API contract examples, two proposed ADRs, a portable skill and Cursor rule. Supporting research is under `docs/research/provider-integration/` (Documents 76–83).

For operator scheduling, inventory, staff/permissions, payout automation or API work, read `AGENTS.md`, then the data-driven platform operations skill and Documents 76–83. These are requirements, not evidence of implementation. Keep code/database invariants enforced in reviewed backend and PostgreSQL logic; do not make arbitrary database content executable. Use the repository's real OpenAPI generation path and confirm current provider entitlements.


## Stage 26 addition
Read `docs/research/provider-integration/84-scenario-driven-coverage-audit.md` through Doc 88 before provider API work. This addition requires exact per-operation schemas, field maps, fixtures and scenario evidence, and updates the Amadeus access-path assumption.


Stage 27: for Travelport Stays and Sabre workflow/schema work, follow Docs 89–93 and ADR-GDS-003/004 in the cumulative research pack. The provider workflow addendum should be merged into the repository documentation without blindly overwriting existing project files.
