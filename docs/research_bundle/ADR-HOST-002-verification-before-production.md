# ADR-HOST-002 — Verify Local Hosting, Data Flows, Recovery and Security Before Production

**Status:** Accepted as a gate; provider selection remains open  
**Date:** 24 October 2026  
**Decision owner:** OuterBlocks Limited (founder/technology and compliance owners to be assigned)  
**Scope:** NIDC and Wingu Africa/Flashnet evaluation for Travelar production hosting.

## Context

Travelar expects to operate Keycloak, a custom NestJS/Fastify backend, PostgreSQL 18, background workers and provider adapters. NIDC and Wingu Africa have been shortlisted, but public facility/service descriptions do not establish the end-to-end processing contract, locations of backups/support/telemetry, achievable recovery objectives, security-operation scope or tested recovery of Travelar's particular workload.

Tanzania's PDPC publishes a controller/processor registration requirement and a permit process for personal-data transfers outside Tanzania. Local primary hosting does not eliminate external flows through GDS, PSP, email/SMS, monitoring, remote support, backups, DNS/CDN/WAF and CI/CD.

## Decision

1. Keep NIDC and Wingu Africa on the shortlist; for Wingu, evaluate whether cloud/managed services are contracted through Flashnet or another partner.
2. Do not select either provider as production primary or DR provider based only on website claims, “Tier III” wording, local presence or a price list.
3. Require a signed response to the common hosting RFI and a technical/data-flow evidence pack from each candidate.
4. Obtain legal/privacy review of data categories, controller/processor roles, subprocessors, transfer destinations and any needed PDPC permits/safeguards before production data processing.
5. Require a witnessed non-production proof of capability for PostgreSQL 18, Keycloak, network, backup/PITR, restore, failure response, incident escalation and provider exit.
6. Treat RPO/RTO numbers in Document 38 as provisional procurement targets until business-impact analysis, quotes and drills approve them.
7. Record actual configuration, test evidence, exceptions, risk owner and expiry date for each accepted risk.

## Alternatives considered

- Choose NIDC based on published VM prices/local state-owned operator: rejected until bandwidth, service support and recovery terms are clarified.
- Choose Wingu based on carrier neutrality, physical facility claims and its announced Flashnet partnership: rejected until current service/contracting chain and DR geography are confirmed.
- Put production at one and use the other as DR immediately: deferred; two facilities in Dar es Salaam may not be independent enough, and the exact replication/data-flow legality has not been established.
- Use overseas managed cloud without a local transfer review: rejected for now because the actual processing arrangement and transfer requirements have not been assessed.

## Required evidence before provider-selection ADR

- Current technical and price proposal with committed network throughput, storage IOPS/latency, CPU/RAM terms and support scope.
- Site certificates and relevant independent security-audit evidence.
- Contractual SLA, maintenance, incident escalation and service credits.
- DPA/subprocessor annex, physical locations of every processing/backup/recovery component, country of administrative access, exit/deletion terms.
- Backup design, encryption/key control, retention, PITR, immutable copy and successful restore-test evidence.
- DR topology, separately identified failure domains, proposed RPO/RTO and recovery drill.
- Security responsibility matrix and evidence that monitoring, alerting, access logging, patching and incident response are staffed.
- OuterBlocks' data map and written counsel/PDPC position on any cross-border transfers.

## Consequences

The selection timeline may be longer, but this avoids mistaking local primary storage for complete sovereignty and availability. A low-cost VM may still be suitable for development or an isolated proof-of-concept. Production requires verified bandwidth, security, recovery and operating ownership.

## Revisit trigger

Revisit this decision when both provider responses are received, when a material new local hosting product appears, when launch markets/data categories change, or when a proposed cross-border backup/DR location is introduced.
