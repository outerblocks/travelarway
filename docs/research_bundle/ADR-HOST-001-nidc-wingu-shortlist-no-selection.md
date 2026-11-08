# ADR-HOST-001 — Shortlist NIDC and Wingu; No Production Host Selected

**Status:** Accepted for evaluation; final provider selection deferred  
**Date:** 24 October 2026  
**Owner:** OuterBlocks Limited / Travelar  

## Context

Travelar's proposed production platform includes a custom NestJS/Fastify backend, PostgreSQL 18, self-hosted Keycloak, and independent provider adapters. Tanzania is the proposed launch market. Hosting must support documented data-location obligations, secure privileged access, adequate network/compute performance, recoverable PostgreSQL, backups, monitoring, and a testable disaster-recovery arrangement.

## Decision

1. NIDC and Wingu Africa are the initial Tanzanian hosting candidates to assess in parallel.
2. Do not designate either as primary or secondary solely from public marketing pages.
3. NIDC must clarify its publicly listed VM specs and 1 Mbps bandwidth line, its present cloud/IaaS service scope, production SLA and backup/DR offering.
4. Wingu must clarify whether the offer is colocation only or managed compute via Wingu/Flashnet/another party, the contracting party, site-specific certification, application/compute SLA and recovery services.
5. Both must answer the same RFI and pass legal, network, security, backup restore and cost gates.
6. Production and DR failure domains must be analysed. Both known facilities are in Dar es Salaam; distinct buildings do not establish full regional disaster independence.

## Alternatives considered

- NIDC as primary and Wingu/Flashnet as DR.
- Wingu/Flashnet as primary and NIDC as DR.
- One provider for production with independent encrypted backups in a legally approved separate location.
- Self-managed colocated hardware.
- Other providers/regions, subject to the country-specific legal and operational assessment.

No alternative is selected until written commercial and technical evidence is available.

## Acceptance gates

- Confirmed data, backup, log, support and subprocessors locations; reviewed by counsel.
- Written SLA and 24/7 escalation terms appropriate to the service.
- Measured throughput, storage performance, latency and failure behavior meet Travelar workload thresholds.
- PostgreSQL backup and restoration test passes; RPO/RTO are documented.
- Keycloak restoration and access isolation test passes.
- Security and operations responsibility matrix is signed off.
- Full 3-year TCO and export/termination terms have been reviewed.

## Consequences

- Both candidates receive the same RFI and are evaluated with the same scorecard.
- No production passenger data should be used in trials until lawful processing and the vendor data terms are approved.
- Local hosting remains a technical choice that supports data-flow control; it is not, by itself, proof of regulatory compliance.

## Sources

- [NIDC](https://nidc.co.tz/about), [NIDC VM pricing](https://nidc.co.tz/virtual_server), [NIDC colocation](https://nidc.co.tz/colocation)
- [Wingu Tanzania](https://www.wingu.africa/markets/tanzania), [Wingu services](https://www.wingu.africa/services), [Wingu/Flashnet partnership notice](https://www.wingu.africa/latest-news/flashnet-expands-data-centre-and-cloud-services-with-wingu)
- [Tanzania PDPC registration](https://pdpc.go.tz/services/registration/), [PDPC cross-border transfer permit](https://pdpc.go.tz/services/cross-border-data-transfer-permit/)
