# ADR-SEC-001 — Layered Cyber Defence and Security Observability

- **Status:** Proposed baseline; accept as mandatory design direction, with implementation details subject to proof and review.
- **Date:** 24 October 2026
- **Owners:** OuterBlocks leadership, Engineering/Platform, Security, Privacy/Legal, Finance/Operations
- **Related:** Documents 24, 26, 29, 32, 38, 41 and 42.

## Context

Travelar handles passenger identity/contact details, booking and travel manifests, supplier credentials, operator-tenant data, inventory, payments, refunds, payouts and financial records. A compromised frontend, staff session, provider adapter, host or build pipeline could affect several of these assets. A single perimeter firewall or application scanner cannot address all such risks. The platform also needs to know when monitoring itself has failed.

## Decision

Adopt layered protection, centralized tamper-resistant security telemetry, defined alert ownership, narrowly bounded automatic containment and a tested incident/recovery process. Align security engineering to NIST CSF 2.0, use OWASP ASVS as the verification baseline, use current OWASP web/API risk guidance for threats, and require independent pre-launch assessment and retest for material findings.

No production launch based solely on AI-agent review, automated scanner output, a green dashboard or presumed configuration defaults. No irreversible or high-impact response action may rely on AI confidence alone.

## Consequences

- Additional time and operating cost is required for log collection, alert tuning, security updates, access reviews, external assessment and restore exercises.
- Engineering tasks must include security telemetry, abuse tests and failure behaviour at design time.
- Production infrastructure must be segregated from developer/AI environments, and backups/logs require separate access controls.
- The launch date depends on response ownership and evidence of tested recovery, not only feature completion.
- Exact providers/products are not chosen by this ADR. The chosen host, managed services, contractual data location and team capability determine implementation.

## Alternatives rejected

- **“Add security after MVP”:** rejected because early identity, tenancy, payments, logs and data-flow choices are expensive to retrofit.
- **Rely on WAF/antivirus only:** rejected because broken authorization and business logic remain application-level threats.
- **Rely on AI agents or scanners as security sign-off:** rejected because tools can miss issues, misinterpret tests and do not independently authorize risk acceptance.
- **Build a fully autonomous AI security agent with unrestricted production control:** rejected because it could trigger denial of service, delete evidence or make unsafe financial/identity decisions.

## Required follow-up

Use Document 42 as the implementation/acceptance checklist, update Documents 24 and 26 during detailed architecture, test telemetry end-to-end, select alerting/log retention tooling only after the hosting and data-flow gates, and record actual results in the release evidence log.
