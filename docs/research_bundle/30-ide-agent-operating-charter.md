# 30 — IDE Agent Operating Charter

**Applies to:** Cursor, Claude Code, Antigravity, Qoder and other approved engineering agents  
**Product:** Travelar · **Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Status:** Mandatory proposed standard before coding authorization  
**Updated:** 23 October 2026

## 1. Purpose

IDE agents operate as accountable engineering assistants. They must preserve the approved source of truth, ask for decisions through the question register when material rules are missing, work within explicit task scope and provide verifiable evidence. They are not authorized to turn unresolved assumptions into product behavior.

**Completing research, creating this charter, writing UI, passing unit tests or producing a demo does not itself authorize production development.** The owner must record explicit implementation authorization and launch scope after applicable blockers are assessed.

## 2. Mandatory workflow

```text
SOURCE OF TRUTH
      ↓
REVIEW CURRENT STATE
      ↓
FIND GAPS / CONTRADICTIONS
      ↓
RESEARCH PRIMARY EVIDENCE
      ↓
UPDATE REQUIREMENT / ADR / QUESTION REGISTER
      ↓
DESIGN AND REVIEW BOUNDARIES
      ↓
IMPLEMENT THE APPROVED SLICE
      ↓
RUN TESTS AND RECORD ACTUAL OUTPUT
      ↓
SECURITY REVIEW
      ↓
CONCURRENCY / PERFORMANCE / FAILURE REVIEW
      ↓
DOCUMENT CODE, DATA AND OPERATIONS
      ↓
RECONCILE SOURCE OF TRUTH
      ↓
PROCEED TO NEXT DEPENDENCY ONLY WHEN ACCEPTED
```

## 3. Source-of-truth hierarchy

1. Applicable law/regulator instructions and signed provider/operator contracts, after legal/owner verification.
2. Owner-approved decisions and current ADRs.
3. Approved requirements and business rules.
4. Approved API contracts, schemas and configuration specifications.
5. Repository implementation and automated tests.
6. Vendor documentation and exploratory notes, labeled with evidence strength.
7. Agent-generated drafts and assumptions.

If implementation conflicts with an approved requirement or higher-authority evidence, stop and raise a contradiction. Do not silently choose a convenient interpretation.

## 4. Non-negotiable rules

- Do not invent business logic, legal requirements, API endpoints, provider capabilities, fee schedules, credentials or supplier access.
- Do not claim a provider integration is complete when only a mock, stub, sandbox or unverified request has been used. State the exact test environment.
- Do not claim tests passed unless they were run on the reported commit and output is available. State skipped, flaky and failed tests.
- Do not silently change database schemas, provider contracts, public API behavior, accounting rules, permissions or state machines. Propose a migration/ADR and obtain approval as required.
- Do not disable security controls or weaken tests to achieve a green build.
- Do not expose secrets, production passenger data, payment data or credentials in source, logs, prompts, screenshots or test fixtures.
- Do not directly mutate ledger history to “fix” discrepancies; use approved reversal/adjustment workflows.
- Do not use public-client writes as a shortcut around booking, pricing, inventory, refund or authorization rules.
- Do not delete unknown states, unhandled errors or exception queues because they complicate a demo.
- Do not call simulated inventory, payments, ticketing or notifications “production ready.”
- Do not deploy to production, run live financial transactions or activate supplier credentials without explicit authorization and change controls.

## 5. Task intake checklist

Before changing code, the agent records: task ID; applicable requirement IDs; current branch and commit; relevant ADRs; dependencies; data/API surfaces affected; country/mode/provider scope; security and privacy implications; explicit non-goals; unresolved questions; test commands; deployment/migration impact; rollback strategy; acceptance criteria and required reviewer.

If a blocking fact is missing, make safe progress on non-dependent analysis/tests/documentation but do not encode a guess into production behavior.

## 6. Change discipline

- Prefer narrow, reviewable changes and clear module ownership.
- Use the repository's established formatter, type-checker, tests and migration workflow.
- Keep secrets outside repositories; use approved secret stores and environment-specific credentials.
- Add contract tests for each adapter and version the normalized capability contract.
- Database migration changes need forward/backward compatibility analysis, data migration plan, lock/downtime assessment, backup conditions and recovery plan.
- Critical configuration changes (country activation, provider enablement, commission, markup, tax and permissions) must be validated, audited and approved by a separate authorized person.
- Preserve correlation IDs and redacted evidence for external requests; never log payment secrets or unnecessary passenger identification data.
- Add feature flags / activation guards for new providers and markets where appropriate, with a safe disable path.

## 7. Adapter implementation protocol

For each GDS, PSP, communication, authentication, fiscal, USSD or transport adapter:

1. Cite official docs and link signed access/contract evidence.
2. Declare supported operations and capability limitations.
3. Define timeouts, retryability, idempotency semantics and unknown-outcome recovery.
4. Verify signature/token/credential rules and store secrets through the approved secret mechanism.
5. Add contract fixtures and unit/integration tests; label mocks clearly.
6. Capture provider request IDs and safe diagnostics.
7. Test duplicate/out-of-order events, provider outage and credential revocation.
8. Define reconciliation and operational ownership.
9. Record sandbox-versus-production evidence separately.
10. Keep provider-specific behavior behind the adapter and workflow orchestrator.

## 8. Minimum response/report format

Every engineering task report must include:

- **Scope:** requirements and files/modules changed.
- **Decisions:** ADRs/rules applied or proposed.
- **Implementation:** behavior actually implemented.
- **Verification:** commands run, environment, commit, passed/failed/skipped results.
- **Security:** authorization/data/secret/threat implications and findings.
- **Concurrency/performance:** tests run or explicitly not applicable with reason.
- **Integrations:** sandbox/mock/production status, credentials/permissions not assumed.
- **Data:** schema migrations, backfill, compatibility and rollback notes.
- **Operations:** logs/metrics/alerts/runbooks and known failures.
- **Open items:** blockers, uncertainties, owner and next evidence required.
- **Source-of-truth changes:** requirement status, ADR and evidence links updated.

Use status words exactly: `implemented`, `tested`, `verified in sandbox`, `verified in production`, `not run`, `blocked`, `proposed`, `unresolved`. Avoid the ambiguous word “done” on its own.

## 9. Definition of Done enforcement

The applicable 18-point checklist in `29-definition-of-done-and-testing-strategy.md` must accompany module acceptance. A reviewer can reject a change that compiles if the acceptance evidence, security controls, recovery behavior or documentation are missing.

## 10. External evidence and tool use

Prefer official law, regulator, vendor API and contract sources. Record URL, title, date accessed, product/version, environment and the claim supported. Vendor marketing is not API capability proof; public API documentation is not production access proof; a successful API response is not fulfilment proof; a hash chain is not immutable evidence without protected access and backups.

Agents must not send live financial transactions or real customer messages just to test an API. Use sandbox, test tenant, simulators or explicitly approved low-value controlled tests with authorization and reconciliation.

## 11. Escalation

Escalate immediately for: suspected personal-data exposure; secrets or credential leakage; live payment/booking outcome unknown; duplicate ticket/charge risk; cross-tenant data access; unbalanced ledger; production supplier mismatch; destructive migration; regulatory status change; or a critical security finding. Stop the affected flow when necessary under the approved incident/runbook process, preserve evidence and notify the designated owner.

## 12. Research-to-implementation gate

Before coding begins, the owner must establish: approved launch scope; applicable legal and supplier evidence; selected backend/database/hosting path or an explicitly bounded non-production prototype scope; approved requirements/ADRs; repo and environment access rules; reviewers; test/deployment controls; and a list of features that must remain disabled. Until then, agents may produce research, draft documentation, design reviews and non-production proof-of-concept work only when explicitly scoped.


## Stage 9 approved direction (24 October 2026)

The current recommended baseline for the proof of concept is React + TanStack Start web, NestJS + TypeScript/Fastify core API, direct PostgreSQL 18.x, Node.js 24 LTS candidate, and Drizzle + node-postgres as a provisional data-access layer. Supabase is not selected as the platform. Self-hosted Keycloak in a verified Tanzanian environment is the preferred identity PoC direction, conditional on legal, hosting, operations and recovery gates. Auth0 is a contingency if its exact processing arrangement is legally acceptable and operationally preferable. Do not implement bespoke full authentication as a shortcut.

The stack is a recommended baseline rather than an excuse to skip the proof of concept. Agent implementation must preserve the stable internal user ID and Travelar authorization model independent of IdP roles. Every API/server function enforces access itself. PostgreSQL 18 constraints and transactions protect inventory and ledger invariants; ORM typing is not an integrity substitute.

References: `33-authentication-provider-and-identity-architecture.md`, `34-technology-stack-evaluation-and-recommendation.md`, `ADR-AUTH-001-keycloak-first-local-identity.md`, `ADR-STACK-001-tanstack-start-nestjs-fastify-postgres18.md`.

## Stage 15 — Cursor and Antigravity verified operating model (24 October 2026)

Document `41-ide-agent-capability-assessment-and-engineering-control-system.md` is the current detailed assessment of Cursor and Google Antigravity capabilities, limitations, security settings, portability and pilot plan. The principal governance rule is that tool capabilities do not establish correctness or readiness. Cursor project rules, Antigravity rules, prompts and skills are not the enforcement layer; source-controlled requirements, deterministic CI, protected branches, explicit approvals and evidence are.

Use root `AGENTS.md` and shared `.agents/skills/<name>/SKILL.md` procedures for cross-tool consistency, supplemented with `.cursor/rules/` for Cursor-only settings. Antigravity's legacy workflow cutoff (19 October 2026) has passed; new procedures must use Agent Skills. Keep both tools in restricted/review-oriented settings and never provide production secrets or live passenger/financial records. Run the controlled three-task tool pilot in Document 41 before making performance claims or standardizing team-wide.

This amendment does not itself authorize coding or production use. See Documents `32`, `38` and `41` for open evidence gates and operating controls.
