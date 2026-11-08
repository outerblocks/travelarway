# 21 — Country Data Residency and Hosting Strategy

**Product:** Travelar | **Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required) | **Status:** Preliminary legal/technical assessment; not legal advice | **As of:** 24 October 2026

## 1. Executive position

Do not assume that every Travelar record must remain exclusively in the country where the passenger books, and do not assume that a cloud region, URL path or country-specific subdomain proves compliance. Map data flows and establish controller/processor roles, purposes, transfers, subprocessors, retention, security and applicable regulator permissions for each market.

For Tanzania, the Personal Data Protection Commission states that an entity intending to transfer personal data outside Tanzania must submit a formal application for a cross-border transfer permit, including data type, purpose, destination/recipient, duration and method, and demonstrate compliance, safeguards and legally binding arrangements. PDPC also states that organizations may not collect/process personal data without controller/processor registration. See [PDPC registration](https://pdpc.go.tz/services/registration/) and [cross-border permit](https://pdpc.go.tz/services/cross-border-data-transfer-permit/). The exact application, exemptions, transfer scope, timelines and storage obligations need counsel/regulator confirmation for Travelar's data map.

For Kenya, the Office of the Data Protection Commissioner publishes controller/processor registration regulations and cross-border transfer guidance, including a 2026 guidance note. See [ODPC guidance library](https://www.odpc.go.ke/guidelines-2/), [registration regulations](https://www.odpc.go.ke/wp-content/uploads/2024/03/THE-DATA-PROTECTION-REGISTRATION-OF-DATA-CONTROLLERS-AND-DATA-PROCESSORS-REGULATIONS-2021.pdf), and [2026 cross-border guidance](https://www.odpc.go.ke/wp-content/uploads/2026/09/ODPC-%E2%80%93-Guidance-Notes-for-Cross-border-Data-Transfers.pdf). Legal review must establish when adequacy, safeguards, contractual measures or regulatory approval apply to the actual transfer.

## 1A. Identity provider choice: Keycloak-first is preferred, subject to controls

For Tanzania-first operation, the current architecture direction is to prefer **self-hosted Keycloak deployed in a verified Tanzanian hosting environment** over a public-cloud managed identity provider, if OuterBlocks can operate it to the required security and availability standard. This is a deployment-control decision, not a legal conclusion that the Act mandates every authentication record to stay inside Tanzania.

The Tanzania PDPA contains separate provisions for cross-border transfer (sections 31–32), while GN 449C of 2023 regulation 20 and current PDPC guidance describe a transfer-permit process. The exact application of these provisions must be reviewed for each proposed flow. Keycloak located in Tanzania helps control identity databases and logs, but does not automatically localize backups, remote support access, email/SMS notifications, metrics, traces or federated social-login data.

Use a dedicated Keycloak database and credentials separate from Travelar core application data. PostgreSQL 18.x appears on Keycloak's current official supported database list; re-check the exact pinned release before deployment. Keep the Admin Console/Admin REST API restricted to approved networks; public OIDC endpoints need to be reachable by clients. Follow Keycloak's production TLS, hostname, reverse proxy, load and health-check guidance.

Source references: [Tanzania PDPA](https://oagmis.oag.go.tz/portal/acts/237), [GN 449C](https://oagmis.oag.go.tz/portal/legislation/1350), [PDPC transfer permit](https://pdpc.go.tz/services/cross-border-data-transfer-permit/), [Keycloak supported configurations](https://www.keycloak.org/server/supported-configurations), [Keycloak production configuration](https://www.keycloak.org/server/configuration-production). See `35-keycloak-and-local-identity-hosting-assessment.md` for the full legal/technical analysis and due-diligence checklist.

## 2. Data-flow inventory

Every new integration must be added to a live data inventory. Capture source, destination, purpose, field set, controller, processor/subprocessor, legal basis, country, region, retention, deletion/return, support access, encryption, contractual terms and approval status.

| Data class | Examples | Risk | Default handling proposal | Residency/transfer question |
|---|---|---|---|---|
| Public catalog | Public route names, ports, station/property/activity descriptions | Low | CDN/cache permitted after license/terms review | Usually not personal data; content/source rights still matter. |
| Passenger identity/contact | Name, phone, email, age/category, ID fields if required | High | Minimize fields; encrypt in transit/at rest; tightly scope access; avoid analytics payloads | Which transfer permits/contract terms apply to GDS/operator/comms/support provider? |
| Passenger manifest | Passenger-to-trip mapping, seat/class, boarding details, ID where required | High | Restrict to operator-authorized staff and trip-scoped marshal access; short-lived device cache | Are sector rules specific to manifests/local storage/retention? Confirm by mode/country. |
| Children/sensitive fields | Child age, identity fields, any sensitive attribute | High | Collect only when necessary; segregate/limit; apply extra review | What consent/guardian/retention requirements apply? Avoid unnecessary fields such as gender. |
| Account/security data | Password hashes/provider identity IDs, MFA, sessions, recovery events | High | Store credentials with appropriate identity system; no secrets in logs; privileged MFA | Where are auth logs, recovery emails, telemetry and identity backups stored? |
| Payment references | PSP token/reference, amount, currency, status, reconciliation data | High | Avoid raw card data; use PSP-hosted/tokenized flows where contract supports; restrict finance permissions | PSP processing and reconciliation may cross borders; card obligations depend on actual flow. |
| Financial ledger | Journals, supplier payable, refunds, settlement, tax records | High | Immutable posted entries; encrypted backed-up store; finance role/approval controls | Confirm tax/accounting retention and any financial-sector location rules with counsel. |
| Supplier/contract data | Pricing, contracts, operational contacts, API IDs | Medium/high | Tenant/contract-scoped access; secret references separated from descriptive config | Contract restrictions and confidential information may constrain region/subprocessors. |
| Support/call records | Complaints, recordings if used, ticket photos, conversation attachments | High | Default no recording until justified/lawful; retention-limited attachments; redaction | Need country-specific recording notice/consent and transfer analysis. |
| Logs/telemetry | Trace IDs, IPs, user IDs, error payloads | Medium/high | No raw IDs/manifests/payment payloads; pseudonymize; restrict export | Log SaaS and backups can be a transfer; identify region and subprocessor. |
| Backups/DR replicas | Full DB, object files, WAL, exported ledger | High | Same classification as source; encrypted, restricted; restoration tested | A backup or failover site is still a data location and transfer consideration. |
| Configuration/secrets | API keys, certificates, encryption keys | Critical | Dedicated secrets/KMS/HSM where justified; rotation, audit, separation | Document key custody and access location. Never put secrets in general support tools. |

## 3. Tanzania: verified position and open legal questions

### Verified from official PDPC materials

- PDPC states that people/organizations must be registered in the applicable controller or processor role before collecting or processing personal data.
- PDPC's cross-border-transfer service describes a permit-based application and asks for data type, purpose, destination/recipient, duration and transfer method, plus compliance and safeguard evidence.
- The official site identifies the Personal Data Protection Act, 2022 and 2023 data-collection/processing regulations.

### Not yet established for this specific platform

- Whether each category of passenger, operator and financial data is required to be hosted inside Tanzania or may be transferred subject to the permit/required safeguards.
- How the requirement applies to remote administrator access, disaster recovery, support tickets, observability, backup locations and USSD/SMS/email delivery.
- Exact permit processing time, conditions, renewal/change notification and any data categories requiring different treatment.
- Any additional sector requirements for manifests, ticketing, tax records, maritime passenger records or regulated financial records.

**Action:** obtain counsel's data protection memorandum and submit the proposed data flow diagram to PDPC for specific guidance before sending real passenger records to non-Tanzanian providers.

## 4. Kenya: verified position and open legal questions

The ODPC publishes the Data Protection (Registration of Data Controllers and Data Processors) Regulations, 2021 and cross-border transfer guidance; an official 2026 cross-border guidance note is available. Registration duties and transfer safeguards need to be applied to the entity and processing activity, not just the application server location.

**Action:** before Kenya market activation, establish the controller/processor registration scope; identify the transfer mechanism and required notices/agreements; obtain legal advice on any explicit authorization or safeguards; and map recipients in airlines, GDS, lodging, PSPs, SMS/email and regional support.

## 5. Hosting alternatives investigated

| Candidate | Official/public evidence | What is not yet proved | Assessment |
|---|---|---|---|
| Supabase managed | Current documented AWS-hosted region choices; region selection controls primary project-data location. Reviewed public list does not show an African region. [Regions](https://supabase.com/docs/guides/platform/regions) | Contractual locations for every backup/log/subprocessor; transfer fit for Tanzania/Kenya; project tier/retention costs and legal approval | Not the default production data-plane choice until location/transfer review passes. Could still be eligible if counsel and PDPC/ODPC requirements allow the chosen location. |
| Auth0 managed identity | Public-cloud tenant sub-region cannot be manually selected; private-cloud data region can be selected only from Auth0's available locations. [Auth0 support](https://support.auth0.com/center/s/article/Tenant-Creation-in-a-Specific-Sub-region) | Exact identity/profile/log/backup/support data locations, subprocessors, transfer permits, retention and breach clauses; written region and DPA confirmation; MAU economics. | Candidate only after counsel/PDPC and commercial gates pass; otherwise assess self-hosted Keycloak in a verified location. |
| Supabase self-hosted | Supported self-hosting guide; can run on customer infrastructure. [Guide](https://supabase.com/docs/guides/self-hosting) | OuterBlocks staff capability, provider SLAs, exact deployment hardening, HA, supported upgrade path, backup/DR and ongoing cost | Potential if the operating team can own Postgres, updates, secrets, monitoring and recovery. Self-hosting alone is not compliance. |
| NIDC, Tanzania | NIDC official website advertises cloud-computing products; its official about page says facility connects to the National ICT Broadband Backbone. [NIDC](https://nidc.co.tz/) · [About](https://nidc.co.tz/about) | Actual current service offers, availability/SLA, hardware/virtualization, certifications, backup site, DR geography, security audit, data location, pricing, support and exit terms | Include in RFI; do not treat marketing description as proof of production readiness. |
| Wingu Africa, Tanzania | Official Wingu page describes Tanzania data-centre offering and carrier-neutral colocation/connectivity. [Tanzania](https://www.wingu.africa/markets/tanzania) | Exact product/contract for managed compute, PostgreSQL, backups, support, certifications and SLAs | Include in RFI; verify service scope and independent assurance evidence. |
| Raxio TZ1 Tanzania | Raxio's official page identifies TZ1 but, as reviewed 23 October 2026, labels it **under development**. [Raxio Tanzania](https://www.raxiogroup.com/data-centres/tanzania/) | Commissioning/acceptance date and services actually available | Do not depend on TZ1 as a live production site until current operational status and service contract are verified. |
| AWS Africa (Cape Town) | AWS lists Africa (Cape Town), `af-south-1`, as a region. [AWS regions](https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html) | Suitability under the country-specific transfer analysis; all service-level data location details, support access and contract controls | Technical regional option; not in-country Tanzania/Kenya storage. Use only after legal and service-specific review. |
| Other regional cloud/data-centre providers | May provide regional proximity and local contracts | Each location, redundancy, certifications, subprocessors, performance, prices and exit must be checked | No blanket recommendation without written due diligence. |

## 6. RFI checklist for hosting vendors

Request written answers and evidence for:

1. Primary compute, primary database, replicas, object storage, logs, backup, telemetry and DR site locations, including international support access.
2. Physical ownership/colocation versus cloud reselling; subprocessors and their locations.
3. Independent certifications/assurance reports and scope/date (do not accept vague “Tier III” or “bank-grade” descriptions without evidence).
4. Uptime measurement, service credits, maintenance notice, incident notification and escalation SLAs.
5. PostgreSQL versions/extensions, connection pooling, replication, PITR/WAL retention, backup encryption and restore time/fee.
6. Data access policy for provider personnel, break-glass access, auditability and deletion at termination.
7. Encryption/key controls, HSM/KMS options, network isolation, DDoS protection and vulnerability-management responsibilities.
8. Export in documented format, database/object migration, egress, exit assistance and backup destruction certificate.
9. Monthly all-in charges: compute, storage, IOPS, network egress, public IP, firewall, monitoring, backups, support, HA/DR and taxes.
10. Reference customers in regulated/mission-critical workloads where permission allows reference checks.

## 7. Proposed deployment patterns

### Pattern A — one legally cleared launch environment

Use one primary transactional database environment with explicit backup/DR locations, a custom domain backend, and separate provider-adapter workers. This is operationally simpler but only acceptable if one environment meets all applicable data rules and provider/network requirements.

### Pattern B — country-local data plane with shared global control plane

Deploy sensitive booking/passenger and country-specific financial data in country-local environments when required or commercially justified. A central control plane may hold nonsensitive provider metadata, country configuration and pseudonymous operations metrics only if lawful. Do not centralize full manifests/passenger profiles merely for admin convenience. Define inter-country service-to-service policy and data-minimization contracts.

### Pattern C — lawful regional environment with approved transfers

Where counsel confirms that transfer permits/safeguards permit a regional store, use a specific documented location and bind backups/logs/support access into the analysis. The “regional” choice must match the approved recipient and conditions; changing a provider or backup site requires review.

### Recommendation

Do not lock Pattern A/B/C as final until the data inventory, counsel memorandum, vendor RFI, recovery topology and cost model exist. For the Tanzania pilot, compare NIDC and Wingu with a regional cloud deployment; treat Raxio TZ1 as future/conditional until confirmed operational. Keep real records out of environments that have not passed the legal and security gate.

## 8. Residency-control implementation checklist

- Tag each data field/table/object by category, country, purpose, controller, retention and sensitivity.
- Add `country_id`/market scope as business metadata, but never assume this alone isolates data.
- Restrict cross-country reads and admin access at API and data layers; log approved exceptional access.
- Separate production data from developer/test environments; use synthetic or properly de-identified fixtures.
- Restrict logs/traces/support exports; redact passengers, authentication tokens, booking references where they can expose a record, and PSP payloads.
- Record processor/subprocessor contracts and transfer permits in HIMS with effective dates, scopes and renewal reminders.
- Automate checks to block enabling an unapproved region/provider for a country/data category.
- Treat replicas, backups, analytics exports, disaster recovery, and outsourced support as data flows too.
- Test deletion/retention workflow, data-subject requests and termination/export with each processor.

## 9. Sources

- PDPC Tanzania registration: https://pdpc.go.tz/services/registration/
- PDPC Tanzania cross-border permit: https://pdpc.go.tz/services/cross-border-data-transfer-permit/
- ODPC Kenya guidance: https://www.odpc.go.ke/guidelines-2/
- Kenya ODPC 2026 cross-border guidance: https://www.odpc.go.ke/wp-content/uploads/2026/09/ODPC-%E2%80%93-Guidance-Notes-for-Cross-border-Data-Transfers.pdf
- Supabase regions: https://supabase.com/docs/guides/platform/regions
- Supabase self-hosting: https://supabase.com/docs/guides/self-hosting
- NIDC: https://nidc.co.tz/ and https://nidc.co.tz/about
- Wingu Tanzania: https://www.wingu.africa/markets/tanzania
- Raxio Tanzania: https://www.raxiogroup.com/data-centres/tanzania/
- AWS region list: https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html


## Authentication provider location gate (24 October 2026)

Identity records, email/phone identifiers, authentication events, IP/risk signals, and support logs may be personal data. OuterBlocks must include the identity provider in the country data inventory and cannot assume the vendor's 'region' or a custom domain proves all associated data stays in that region. Auth0 states public-cloud tenant sub-regions cannot be manually chosen, while Private Cloud regions can be selected from its available list. The exact tenant, log, backup, subprocessors and support access need written confirmation and legal analysis. See `33-authentication-provider-and-identity-architecture.md`.

## 7. Provider-specific due diligence update (24 October 2026): NIDC and Wingu Africa

OuterBlocks has identified NIDC and Wingu Africa as preferred candidates for investigation. They are **shortlisted, not selected**.

- NIDC's published catalogue lists virtual-server packages and colocation pricing, but the listed VM packages state 1 Mbps bandwidth and the processor/core labels require clarification. NIDC's homepage and service catalogue are also inconsistent about whether its cloud service is already generally orderable. Request current technical and commercial terms before considering any tier for production. [VM catalogue](https://nidc.co.tz/virtual_server), [colocation](https://nidc.co.tz/colocation), [homepage](https://nidc.co.tz/).
- Wingu's Tanzania page documents colocation, carrier-neutral connectivity and facility features; the site claims Tier III/99.982% SLA. Ask for current site-specific third-party certification and the signed SLA. Wingu's October 2023 announcement describes a Flashnet partnership for cloud servers, backup, DRaaS and managed services hosted at Wingu; confirm current availability and who contracts for each service. [Wingu Tanzania](https://www.wingu.africa/markets/tanzania), [Wingu/Flashnet announcement](https://www.wingu.africa/latest-news/flashnet-expands-data-centre-and-cloud-services-with-wingu).

Send both vendors the same RFI and do not choose a production host until data locations, subcontractors, network throughput, support scope, backup/DR site, restoration evidence, exit terms and full three-year cost are verified. Both listed facilities are in Dar es Salaam; this may provide separate facility failure domains but does not prove geographic disaster independence. See `36-hosting-provider-evaluation-nidc-wingu.md` and `ADR-HOST-001-nidc-wingu-shortlist-no-selection.md`.

## Hosting-verification delta (24 October 2026)

The follow-up report [38 — Hosting Verification](38-hosting-verification-location-data-flows-backups-recovery-security.md) maps the likely travel-platform data flows beyond the database: Keycloak logs/email, GDS/airline suppliers, PSPs, SMS/email, CDN/WAF/DNS, telemetry, vendor support, backup/WAL archives and disaster recovery. These must be included in the cross-border register. A Tanzanian primary database alone does not settle the location of those flows.

NIDC and Wingu/Flashnet remain shortlisted but unapproved. Require precise location statements for primary compute, DB replicas, backup storage, WAL archives, logs, support/admin access and DR resources; then get legal advice/PDPC confirmation for transfers. Do not interpret “hosted in Tanzania” as evidence that all processing and access stays inside the country.
