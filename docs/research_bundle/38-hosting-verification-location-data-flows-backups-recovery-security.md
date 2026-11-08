# 38 — Hosting Verification: Local Hosting, Cross-Border Data Flows, Backups, Recovery and Security Operations

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Review date:** 24 October 2026  
**Scope:** Public-source verification and readiness controls for NIDC and Wingu Africa; Keycloak; PostgreSQL 18; the planned NestJS/Fastify backend.  
**Status:** Preliminary due diligence. Public claims have been checked; provider-specific service guarantees and OuterBlocks' actual processing arrangements remain **unverified until direct written evidence is obtained**.

## 1. Executive determination

The public evidence supports taking both NIDC and Wingu Africa forward for technical and commercial due diligence. It does **not** yet establish that either provider is ready to host Travelar production workloads with the required data-processing terms, backup location, tested restore service, recovery commitments and application-level security operations.

The decision status is therefore:

- **NIDC:** public evidence of a Dar es Salaam data centre operated by TTCL, described by NIDC as Tier III, plus published VM/colocation catalogues. The published VM and colocation bandwidth lines are a material clarification point. Public material reviewed does not prove an end-to-end backup/DR service, current certified scope, specific database recovery commitment, or application/security managed service.
- **Wingu Africa:** public evidence of a Dar es Salaam carrier-neutral data-centre facility and stated physical/connectivity/power/security features. Wingu publishes a “Tier 3 certified” and 99.982% facility SLA claim. Wingu announced a 2023 partnership with Flashnet that includes cloud servers, cloud backup, dedicated servers, disaster recovery as a service, colocation and managed services. Current service availability, contracting entity, backup/DR geography, and contracted scope must be reconfirmed.
- **Cross-border compliance:** local primary hosting would reduce some data-location uncertainty, but would not by itself prove compliance. Supplier APIs, email/SMS, telemetry, remote support, DNS/CDN/WAF, backups, logs, replicas, and disaster recovery can still create transfers or remote access outside Tanzania.
- **Backups/recovery:** no public reviewed page establishes a complete Travelar-specific backup policy, PostgreSQL 18 point-in-time recovery, restore-test schedule, RPO/RTO, immutable copies, or a separate failure-domain DR site under a binding contract.
- **Security operations:** publicly described physical security and facility monitoring are not the same as managed operating-system patching, Keycloak administration, PostgreSQL DBA support, application security monitoring, SOC/SIEM, incident response, DDoS/WAF management, or incident-notification commitments.

**Production gate:** do not mark any hosting provider “verified for production” until the evidence in Sections 7–11 is received, reviewed and tested. Do not send real passenger, employee, identity or financial data to the prospective environment before legal and privacy review.

## 2. Public-source verification results

### 2.1 NIDC

#### Verified public claims

1. NIDC identifies itself as operated by Tanzania Telecommunications Corporation (TTCL), describes the facility as Tier III, and says it is connected to the National ICT Broadband Backbone (NICTBB). The listed location is Mikocheni, Dar es Salaam. Source: [NIDC About](https://nidc.co.tz/about).
2. NIDC's [virtual-server catalogue](https://nidc.co.tz/virtual_server) publishes packages with monthly prices, installation fees, “24/7 Unlimited Support” and a 1 Mbps bandwidth line. Examples include Starter at TZS 289,918.50/month with 2 GB RAM and 100 GB storage; Bronze at TZS 460,643 with 4 GB RAM/200 GB; Silver at TZS 527,843 with 8 GB RAM/500 GB; Gold at TZS 671,843 with 16 GB RAM/800 GB; Platinum at TZS 887,843 with 32 GB RAM/1,000 GB; and Diamond at TZS 1,211,843 with 64 GB RAM/2,000 GB. These are catalogue prices, not offers for Travelar. The page shows “4 vCPU” plus separate “Core” fields that vary by tier; this nomenclature needs clarification.
3. NIDC's [colocation catalogue](https://nidc.co.tz/colocation) lists 1U, half-rack and full-rack options, with bandwidth labels of 1 Mbps, 2 Mbps and “4 Bandwidth” respectively. The last label lacks units in the displayed text and needs clarification.
4. NIDC's homepage says it is preparing to offer cloud computing, while other NIDC materials and announcements have described cloud/IaaS offerings. Current service status and precise service definition must therefore be verified directly. Source: [NIDC homepage](https://nidc.co.tz/).
5. NIDC publishes a separate [storage-service catalogue](https://nidc.co.tz/storage_services). Its precise performance, geography, encryption, retention, restore process and use as PostgreSQL backup storage are not established by the public catalogue alone.

#### What public sources do not establish

No reviewed public page provides a binding Travelar-specific SLA, a service-processing agreement, a complete list of subprocessors/admin-access countries, a backup-region map, guaranteed PostgreSQL 18 PITR, restore-test evidence, contractual RPO/RTO, immutable backup options, named security-operation coverage, or application incident-response commitments. This is a finding about the public materials reviewed, not proof that NIDC cannot provide these items under a negotiated contract.

#### Mandatory NIDC clarifications

- Is 1 Mbps a committed throughput, interface/port speed, monthly cap, or another commercial unit? What are burst limits, data-transfer limits, upgrade steps, overage fees and inbound/outbound policies?
- What exactly do the 4 vCPU and “Core” fields mean? Are CPU, RAM and IOPS guaranteed or oversubscribed? What storage type, latency/IOPS, redundancy and snapshot controls apply?
- Is the quoted product a VM/IaaS service, managed server or colocation? Who patches the OS, host, database and Keycloak? What access does the customer have?
- What does “24/7 Unlimited Support” cover, with what ticket priorities, first-response and restoration targets, escalation contacts and service credits?
- Which current site certification applies to which physical facility and services? Provide a current certificate and scope from its issuing body, including validity and surveillance status.
- Does NIDC offer PostgreSQL 18-compatible storage/networking support, backup storage, point-in-time recovery, managed DBA or DR? Where physically are each copy and recovery compute hosted?
- Are private networking/VLANs, security groups/firewalls, VPN, DDoS protection, static IPs, separate admin access, audit logs and customer key management available?

### 2.2 Wingu Africa and the Flashnet service path

#### Verified public claims

1. Wingu's [Tanzania data-centre page](https://www.wingu.africa/markets/tanzania) describes a Dar es Salaam facility in Mbezi, carrier-neutral connectivity, options among network operators, links to TTCL/NICTBB and international subsea connectivity.
2. Wingu describes locked cabinets/private cages, dual A+B power paths, UPS, transfer switches, multiple generators, 24/7 guarding and video/physical access controls, environmental monitoring and cooling. These are provider-published facility descriptions and should be validated by diligence records and site/contract evidence.
3. Wingu's page says “Tier 3 certified” and a 99.982% SLA uptime figure. Obtain the actual site-specific certificate, scope, validity, issuer, covered services and the contractual SLA. Facility availability is not the same as Travelar application availability.
4. On 18 October 2023, Wingu announced a [partnership with Flashnet](https://www.wingu.africa/latest-news/flashnet-expands-data-centre-and-cloud-services-with-wingu) under which Flashnet's portfolio included cloud servers, cloud backup, dedicated servers, disaster recovery as a service, colocation and managed services hosted at Wingu's data centre.

#### What public sources do not establish

The public facility page does not identify a Travelar-ready VM specification/pricelist, PostgreSQL 18 managed service, contractual backup retention, offsite backup geography, a separate DR-site topology, recovery test outcomes, actual contracted support coverage for the application/database, or the data-processing/subprocessor terms for a particular managed-service offer. The 2023 Flashnet announcement is evidence of a prior partnership announcement, not proof that every service is currently orderable under unchanged terms.

#### Mandatory Wingu/Flashnet clarifications

- Will OuterBlocks contract with Wingu, Flashnet, or both? Identify each data controller/processor/subprocessor role, support party, invoice issuer and liability boundary.
- Are compute, primary storage, backups, management-plane records and DR replicas physically located in Tanzania? Give the facility/city for each. Are they in the same Wingu facility, another local site, or another country?
- Is the 99.982% figure incorporated into the relevant contract? What components are measured, what exclusions apply, and what service credits/remedies exist?
- Supply the facility certificate and current scope, independent audit/certification evidence, and any relevant management-system or security certifications with validity dates.
- For a managed VM, specify CPU/RAM/storage performance, bandwidth committed rate/port speed, monthly transfer, network diversity, DDoS protection, firewall/VLAN options and customer control of encryption keys.
- For cloud backup/DRaaS, provide retention, frequency, PITR, immutable copy options, encryption, location, restore testing, RPO/RTO, support runbook, and a recent anonymized restore-test report.
- Define which party patches the host, guest OS, container runtime, PostgreSQL, Keycloak and application dependencies, and how security patches are prioritized.

## 3. Cross-border data flows: provisional Travelar map

The local host does not determine all data locations. Before launch, OuterBlocks should maintain a vendor-by-vendor processing and transfer register. The following map is a proposed assessment checklist; actual payloads and destinations must be confirmed from contracts and technical traces.

| Flow / service | Data likely involved | What must be checked | Required control before production |
|---|---|---|---|
| Keycloak primary service and database | User ID, usernames, email/phone, credential verifiers, MFA configuration, session/client metadata, security events | Primary/replica/backup locations; Keycloak operator/support access; logs and monitoring destinations | Local deployment diagram; DPA; access list; no secrets/credentials in logs; applicable PDPC classification |
| Travelar PostgreSQL | Passenger names/contact, bookings/itineraries, manifests, IDs where necessary, operator/staff records, payment references, journals/audit data | DB/replica/WAL/backup locations; admin and DBA access; disaster-recovery location | Data classification; DB access matrix; DPA; encryption and access evidence; legal approval for any transfer |
| GDS, airlines and travel suppliers | Name, date of birth, travel document fields where required, contact, itinerary and booking locator | Supplier contracting entity, API region, recipients, subprocessors, data retention, support access and mandatory field rules | Mode-specific supplier contract and transfer basis/permit assessment; minimize fields; document external record IDs |
| PSPs and payment providers | Amount/currency, customer contact, transaction IDs, payment status, limited billing data; avoid storing full card data unless formally assessed | Processing country, merchant-of-record/funds-flow roles, fraud systems, support access, logs and retention | DPA/merchant agreement; provider data-flow map; hosted checkout/tokenization where appropriate; no card PAN/CVV in Travelar logs/database |
| Email/SMS/voice/USSD providers | Email address, telephone, message content, delivery status, verification codes or booking reference | Provider region, routing countries, sender identity, message retention, support access, backups and analytics | Channel/provider register; minified message content; no manifest/ID details in SMS; transfer assessment; event authenticity |
| DNS/CDN/WAF/DDoS, certificates and edge logs | IP addresses, request metadata, cookies and potentially URL/query values | Logging locations, edge locations, support data access, request/response capture, retention | Avoid PII in URL/query; disable body capture for sensitive APIs; configure logs and retention; assess cross-border transfer |
| Error tracking, metrics, SIEM and support tickets | IP, user IDs, traces, exception text, potentially passenger fields if redaction fails | Vendor country, subprocessor list, export, support access, backups and retention | Scrub PII/secrets; local/on-prem collection where suitable; no payloads containing passenger IDs by default; approve transfer before enabling external SaaS |
| Backup/DR/object storage | Full or partial copies of the databases, WAL, exports, uploaded documents, realm/client configuration and secrets | Physical location of every copy, encryption-key control, immutable settings, replication destination, deletion lifecycle | Approved geography; separately controlled credentials/keys; encrypted backups; restore testing; permit/safeguards for any foreign transfer |
| Remote support and security operations | Admin account identifiers, logs, screenshots, config files, database extracts, system metadata | Where personnel are located and what they can view/export; subcontractors; remote access logs | Contractual least-privilege support; named/approved access; MFA; session logging; no production exports without approval |
| Software delivery and observability | Source code, build logs, crash reports, dependency/license checks, secrets accidentally captured | CI/CD regions, artifact storage, telemetry and code-scanning vendors; personal data in build artifacts | Synthetic data only in CI; secrets scanning; redact telemetry; map every vendor and its subprocessors |

### Cross-border rule

The PDPC's current [cross-border data transfer permit guidance](https://pdpc.go.tz/services/cross-border-data-transfer-permit/) says the Commission regulates and oversees personal-data transfers outside Tanzania and describes a permit application with the data type, purpose, destination, recipient, duration/method, safeguards and legally binding agreements. The Personal Data Collection and Processing Regulations, 2023 (GN 449C) regulation 20 sets out the application route; the Act's Part V includes sections 31 and 32 on transborder data flows. See the [official Act](https://www.pdpc.go.tz/media/media/THE_PERSONAL_DATA_PROTECTION_ACT.pdf) and [official regulations](https://www.pdpc.go.tz/media/media/GN_NO._449C_OF_2023_3_1_2.pdf).

PDPC also says an entity must be registered as a controller or processor before collecting/processing personal data. Its [registration page](https://pdpc.go.tz/services/registration/) gives the process and documentation for private organizations.

Do not assume any one of the following without confirming the legal treatment: (a) local primary DB means no transfer; (b) remote support access is always or never a transfer; (c) every field must remain only in Tanzania; or (d) a contract alone substitutes for a required permit. Ask Tanzanian counsel/PDPC to classify the actual arrangements and applications.

## 4. Recommended minimum topology for evaluation

This is a candidate topology, not an approved production design:

- Public edge: managed DDoS/WAF/reverse proxy with no sensitive query parameters; provider and logging location documented.
- Application network: public web edge separated from private NestJS service and background workers; no direct internet exposure for database ports.
- Identity: Keycloak service and its own PostgreSQL database/credentials, separate from Travelar's core database and roles; HTTPS; explicit hostname; admin interface/API restricted to controlled admin access.
- Core data: PostgreSQL 18 for Travelar, private networking, restricted roles, TLS in transit and encryption at rest (disk or storage encryption plus controlled key management as contracted).
- Integrations: outbound egress allowlist where viable; individual adapter credentials stored in a secrets manager or protected secret store; verified webhook signatures/replays/idempotency as appropriate.
- Management: VPN or equivalent protected admin path, MFA, separate privileged identities, logged break-glass access and periodic access review.
- Backups: independent backup target with separate credentials and encryption keys, not merely a snapshot on the same VM/storage array. Backup destination must have an approved location.
- Recovery: warm standby or documented rebuild path depending on cost/requirements; explicitly test DNS/IP changes, secrets/certificate recovery, database restoration, Keycloak recovery, queue/outbox recovery and supplier/PSP reconciliation after restart.

Keycloak's official [production guide](https://www.keycloak.org/server/configuration-production), [hostname guidance](https://www.keycloak.org/server/hostname), [reverse proxy guidance](https://www.keycloak.org/server/reverseproxy), and [supported configurations](https://www.keycloak.org/server/supported-configurations) are the technical baseline. Keycloak's published supported configurations list PostgreSQL 18.x. Its production guide requires TLS and recommends separating or restricting administration interfaces; do not proxy the management port publicly.

## 5. Backup, recovery and continuity requirements

### 5.1 PostgreSQL backup design

Use PostgreSQL's documented backup methods, choosing logical dumps for portability/selected recovery and a physical base-backup plus continuous WAL archiving design where point-in-time recovery is needed. PostgreSQL 18's official documentation explains that WAL archive replay supports recovery to a point in time and can support a warm standby; it also warns that WAL retention and a complete archive sequence are required and must be tested. Source: [PostgreSQL 18 backup and restore](https://www.postgresql.org/docs/18/backup.html) and [continuous archiving/PITR](https://www.postgresql.org/docs/18/continuous-archiving.html).

Required controls:

1. Encrypt backup data in transit and at rest; restrict decryption keys separately from backup storage administration.
2. Use a backup identity distinct from the runtime PostgreSQL role and from ordinary host administration.
3. Keep a base backup plus WAL continuously archived to the selected recovery point objective; alert on failed/missing WAL archive segments and backup job errors.
4. Keep at least one protected copy outside the primary server's failure domain. “Offsite” must specify actual building/site/city/country, not just another VM or volume.
5. Use immutability/object lock where available and tested; do not overstate a hash as proof that backup data cannot be altered.
6. Back up and recover Keycloak's database, required realm/client configuration, encryption/signing material and deployment secrets using controlled procedures. Never store private keys in a public repository or unencrypted backup bundle.
7. Retention/deletion must align to legal and business policy, including deletion propagation and backup expiry; retention duration remains a decision for legal/accounting review.
8. Run automated backup monitoring and regularly test recovery to an isolated environment. Record timings, missing items, integrity checks and corrective actions.
9. Reconcile restored Travelar records with PSP transactions, external provider bookings/ticket state and the accounting ledger before resuming customer transactions.

### 5.2 Proposed recovery objectives for vendor quotations

The following are **provisional procurement targets**, not existing provider promises and not yet approved SLOs. The team should refine them using threat/business-impact analysis and quote actual costs.

| Workload | Candidate RPO to request | Candidate RTO to request | Validation required |
|---|---|---|---|
| Travelar bookings, inventory, payment state and double-entry ledger | Target 5 minutes or better; require explanation of any non-zero loss window | Target 4 hours or better for initial launch, with a documented faster failover option priced separately | PITR drill; concurrency and ledger consistency checks; PSP reconciliation after restore |
| Keycloak identities and realm/client configuration | Target 15 minutes or better | Target 4 hours or better | Login/token/signature continuity; client and MFA settings; recovery of mail integration/secrets |
| Durable queues/outbox/notification status | Target 15 minutes or better where persisted | Target 4 hours or better | Idempotent replay; no duplicate financial side effects or uncontrolled duplicate messages |
| Non-critical analytics and derived reports | Based on regeneration cost; daily is an initial option | One business day is an initial option | Rebuild from authoritative records and validate totals |

Vendor must disclose whether the targets are achievable for the quoted architecture, how they are measured, exclusions, test frequency, dependencies and service credits. OuterBlocks must not publish these as customer-facing guarantees until end-to-end tests prove them.

### 5.3 DR geography

NIDC and Wingu both have Dar es Salaam locations. Using two providers within the same city may improve provider/facility diversity, but it does not automatically satisfy geographic disaster recovery. Request the exact facility/city for the DR copy. If independent recovery in another Tanzanian city is unavailable, assess whether a suitably safeguarded cross-border destination is necessary and obtain legal approval before replicating personal data abroad.

## 6. Security operations and responsibility model

A hosting contract must distinguish facility availability from responsibilities for the guest OS, application, database and identity service.

| Control area | Facility/host responsibility to contract | OuterBlocks responsibility unless explicitly contracted otherwise |
|---|---|---|
| Physical facility, power, cooling, building access | Facility security, environmental controls, controlled visitor access, incident records | Review audit/certification evidence and visitor requirements; protect data/cabinets/accounts owned by OuterBlocks |
| Network | Provider edge/carrier availability, committed throughput, DDoS/network options, routing and network incident escalation | Application exposure, firewall rules, network segmentation policy, endpoint hardening and egress controls (unless managed) |
| Host/hypervisor and VM | Host platform patching, isolation, snapshots if contracted, capacity and underlying hardware | Guest OS patching/hardening, runtime, containers, dependencies, configuration drift (unless managed) |
| PostgreSQL 18 | Managed DBA/PITR/patching only if named in contract; data-path and support boundaries documented | Roles, least privilege, TLS, schema/migrations, query access controls, monitoring and restore drills unless contracted |
| Keycloak | Compute/network availability if hosted | Supported patched release, TLS/hostname/proxy config, realm/client policies, MFA, admin isolation, brute-force protection, recovery and change control |
| Application & adapters | Hosting capacity, network and compute support | Code security, validation, idempotency, provider secrets, API scopes, dependency updates and business-logic authorization |
| Monitoring & logging | Facility/network alerts and provider ticketing | App/DB/Keycloak logs, audit correlation, secrets/PII redaction, detection rules, incident triage, response and evidence retention |
| Backup & DR | Only the specific contracted backup/recovery service | Select records/targets, retention policy, key handling, restore proof, data transfer legality and transaction reconciliation |
| Incident response | Defined provider escalation, evidence preservation and prompt notice | Incident commander, containment decisions, regulatory/customer communication, forensics, recovery and post-incident actions |

Minimum security requirements before go-live:

- A current site certificate and scope (Tier III or equivalent claim must be backed by a valid artifact and defined service scope); relevant ISO 27001 or other security certificates with scope/validity if claimed.
- Signed data-processing agreement, subprocessor list, remote-access locations, support access controls and confidentiality terms.
- Defined severity levels, first response/restoration targets, escalation contacts, maintenance notice and service-credit remedies.
- No direct public access to PostgreSQL or Keycloak administration; separate administration hostname/path, protected access, MFA and audit trails.
- TLS for public/auth/backend/db connections where supported; secure Keycloak public hostname; firewall allowlists/segmentation; secrets rotation; time synchronization.
- Central monitoring for host availability, CPU/memory/disk, disk latency/capacity, database connections/locks/replication lag, WAL archive failure, backup freshness, Keycloak availability/authentication errors, certificate expiry and security events.
- OS/database/Keycloak patch policy with risk-based deadlines, vulnerability scans, dependency inventory, change approvals and rollback.
- Contractually prompt notice of suspected security incident impacting Travelar data; propose notification within 12 hours of discovery as a negotiation target (not asserted as a statutory deadline), with support for OuterBlocks' own legal obligations.
- At least one witnessed recovery exercise and one incident tabletop before production, plus periodic drills after launch.

## 7. Verification matrix — current status

Status key: **Verified public claim** = in provider/regulator public documentation; **Partially verified** = public signal exists but scope/contract/test unknown; **Unverified** = requires written evidence or live test; **Launch gate** = must be closed before production.

| Area | NIDC | Wingu / Flashnet | Evidence required to close |
|---|---|---|---|
| Tanzania facility location | Verified public claim: Mikocheni, Dar es Salaam | Verified public claim: Wingu TZ facility in Mbezi, Dar es Salaam | Contract names the exact facility for each service component |
| Facility tier/certification | Partially verified: NIDC public site describes Tier III | Partially verified: Wingu says Tier 3 certified | Current certificate, issuing body, scope, validity; independent verification |
| Available compute | Partially verified: VM catalogue exists | Partially verified: Flashnet partnership describes cloud servers; current offer needs reconfirmation | Written production specification and firm quote |
| Bandwidth/network | Unverified for production need; public VM line 1 Mbps is a concern | Partially verified facility/carrier diversity, but no quoted Travelar committed rate | Committed throughput, caps, routing failover, DDoS, 2 ISP paths and performance test |
| Cross-border data & support | Unverified | Unverified; also determine the Wingu/Flashnet contracting chain | DPA, transfer map, subprocessors, support locations, back-up/telemetry locations |
| Backup/PITR | Unverified from reviewed public pages | Partially verified by 2023 Flashnet backup/DR offer; current terms unverified | Retention, PITR, encryption, immutability, exact site/country, successful restore evidence |
| RPO/RTO | Unverified | Unverified | Contractual target per workload + witnessed technical drill |
| Security operations/SOC | Public facility/24/7 support signals only; application controls unverified | Public 24/7 facility/environment monitoring; application/SOC scope unverified | Responsibility matrix, on-call commitments, incident notice, SIEM/EDR/WAF scope, audit reports |
| Legal processing terms | Unverified in reviewed public material | Unverified in reviewed public material | Signed DPA/subprocessor annex, confidentiality, breach cooperation and exit/deletion clauses |
| Total costs / exit | Partially visible catalogue prices only | Requires proposal | Three-year quote including network, backups, support, DR, VAT/taxes, egress, migration and exit |
| Production readiness | **Not approved** | **Not approved** | All P0 legal/technical gates closed; POC, tests and rollback demonstrated |

## 8. Required vendor response pack

Send the same request to each provider, with a separate section for Wingu/Flashnet if they are separate counterparties. Ask for documentary evidence, not only marketing links:

1. Company contracting name, location, service terms, governing law, data-processing agreement, subprocessor register and a named privacy/security contact.
2. Site address for production compute, primary data, database replicas, logs, object storage, backups, WAL archive and DR recovery compute; countries where support administrators may access data.
3. Exact VM/bare-metal/colocation/managed service specification: CPU allocation/oversubscription, RAM guarantees, disk type/IOPS/latency, NIC/port speed, committed throughput, data transfer caps, public IPs, VLAN/private network, VPN, firewall, DDoS and WAF options.
4. Facility certificate/tier artifacts; certification scope and expiry; summary of independent security audits or assurance reports under NDA.
5. SLA with availability definition, exclusions, maintenance windows, service credits, support hours, P1/P2 response and restoration times, escalation path and change notification.
6. Managed operations matrix: guest OS patches, PostgreSQL 18 installation/patching/backup, Keycloak deployment/patching, container/network management, monitoring, after-hours incident response and security updates.
7. Backup/DR service: full/incremental/base backups, PostgreSQL WAL/PITR support, encryption/keys, immutability, retention, physical locations, restore procedure, last restore-test report, and firm achievable RPO/RTO.
8. Incident handling: incident definitions, notification clock, evidence preservation, cooperation, regulator support and data-breach escalation. Propose a 12-hour initial notification target for provider-discovered incidents affecting Travelar data, subject to contract negotiation.
9. Exit and portability: full exports, DB dump/base backup and WAL access if available, Keycloak configuration export, object export, migration assistance, fees, return/deletion certification, and timing after contract termination.
10. Cost schedule for 12/36 months: setup, monthly compute, committed/burst bandwidth, storage, backup/retention, support, DR, security add-ons, public IPs, taxes, restore exercises, migration, overages and early termination.

## 9. Non-production verification test plan

Do not send real customer data to this environment. Use synthetic passenger identities, dummy payment references and test supplier credentials.

1. **Location proof:** obtain the written map; reconcile it against cloud/VM console settings, backup destinations and support contract. Where technically possible, export audit evidence for actual resource region and remote admin locations.
2. **Network proof:** test effective uplink speed from multiple local and external networks at different times, packet loss, latency, failover between contracted paths, DDoS response process and admin network isolation. Confirm with provider counters, not one speedtest only.
3. **Database proof:** install a supported PostgreSQL 18 minor release; configure TLS, private binding, least-privilege roles, connection limits, migrations and monitoring; load-test representative booking/inventory transactions.
4. **Keycloak proof:** configure explicit public hostname/TLS, separate administration path, restricted management port, test OIDC flows, MFA, recovery, rate-limiting/brute-force protection, token revocation and user/realm backup/restore.
5. **Backup proof:** create a base backup and continuous WAL archive to the agreed target; deliberately restore into an isolated clean environment at (a) latest recoverable point and (b) a selected prior point. Measure actual RPO/RTO and verify integrity.
6. **Failure proof:** simulate loss of application VM, database process, primary VM host if provider can safely support it, network path, Keycloak instance and backup target. Confirm alerting, escalation and manual recovery runbook.
7. **Consistency proof:** after recovery, reconcile booking/payment/ledger records against mock PSP events and provider booking records; prove duplicate payment and ticket issuance are prevented.
8. **Security operations proof:** test patch process, backup access isolation, secret rotation, audit logging, incident notification chain, restore from a protected backup and documented vulnerability closure.
9. **Exit proof:** export database, application configuration, Keycloak realm/client configuration and permitted object data; document time, cost and integrity checks required to move to the alternative provider.
10. **Evidence package:** store dated test logs, configs (with secrets removed), screenshots, response times, restore checksums, issue tickets, failures, corrective actions and approval signatures in a restricted Travelar evidence repository.

## 10. Production launch gate (must-pass)

A hosting provider can be selected only when all of the following pass:

- [ ] Written, current quote and product specification accepted by OuterBlocks.
- [ ] Legal/data team approves the data-flow register, DPA, subprocessors, processing locations and each cross-border transfer/permit requirement.
- [ ] Site certification/security claims verified for the actual facility/service contract.
- [ ] Bandwidth and performance measured against baseline load/peak test; no unexplained 1 Mbps limit for production.
- [ ] PostgreSQL 18 and Keycloak deployment supported and patch ownership assigned.
- [ ] Database and identity backups encrypted, independently credentialed and geographically/failure-domain documented.
- [ ] Restore and disaster-recovery drills meet approved RPO/RTO; results signed off by Engineering and Operations.
- [ ] Security responsibility matrix, support SLA, incident notification, escalation and breach cooperation signed.
- [ ] Monitoring/alert routing, emergency access, rollback, restore and provider-exit procedures tested.
- [ ] Operations runbooks, on-call owners, patch calendar and periodic recovery drills assigned.

**Current outcome as of 24 October 2026: neither NIDC nor Wingu/Flashnet has passed this full gate based on public evidence alone.** The next evidence required is the response pack, the signed service/DPA terms, and a witnessed non-production proof of capability.

## 11. Sources reviewed

All were accessed 24 October 2026.

1. NIDC, [About NIDC](https://nidc.co.tz/about) — operator, stated tier, location and NICTBB connection.
2. NIDC, [Virtual Server Prices](https://nidc.co.tz/virtual_server) — public VM specs, listed prices, installation and 1 Mbps line.
3. NIDC, [Colocation Prices](https://nidc.co.tz/colocation) — published 1U/half-rack/full-rack catalogue and bandwidth labels.
4. NIDC, [Storage Services](https://nidc.co.tz/storage_services) — public storage catalogue; not equivalent to validated DR.
5. NIDC, [Homepage](https://nidc.co.tz/) — current public product catalogue; cloud service status needs vendor confirmation.
6. Wingu Africa, [Tanzania Data Centre](https://www.wingu.africa/markets/tanzania) — public facility, connectivity, power, access, environment, tier/SLA claims.
7. Wingu Africa, [Flashnet partnership announcement, 18 October 2023](https://www.wingu.africa/latest-news/flashnet-expands-data-centre-and-cloud-services-with-wingu) — cloud server, backup, DRaaS and managed-service offering announced.
8. PDPC Tanzania, [Registration](https://pdpc.go.tz/services/registration/) — controller/processor registration process.
9. PDPC Tanzania, [Cross-Border Data Transfer Permit](https://pdpc.go.tz/services/cross-border-data-transfer-permit/) — authority and permit application guidance.
10. PDPC Tanzania, [Personal Data Protection Act, 2022](https://www.pdpc.go.tz/media/media/THE_PERSONAL_DATA_PROTECTION_ACT.pdf) — Part V, transborder data flows.
11. PDPC Tanzania, [Personal Data Collection and Processing Regulations, 2023 (GN 449C)](https://www.pdpc.go.tz/media/media/GN_NO._449C_OF_2023_3_1_2.pdf) — Regulation 20 transfer-permit procedure.
12. Keycloak, [Supported Configurations](https://www.keycloak.org/server/supported-configurations) — tested/supported database/runtime configurations; PostgreSQL 18.x is listed.
13. Keycloak, [Production Configuration](https://www.keycloak.org/server/configuration-production), [Hostname](https://www.keycloak.org/server/hostname), [Reverse Proxy](https://www.keycloak.org/server/reverseproxy) — TLS, hostname, admin-interface isolation and production concerns.
14. PostgreSQL 18, [Backup and Restore](https://www.postgresql.org/docs/18/backup.html) and [Continuous Archiving/PITR](https://www.postgresql.org/docs/18/continuous-archiving.html) — documented backup and point-in-time recovery mechanisms and caveats.

### Evidence quality labels

- **Primary source, public claim:** on the vendor/regulator's own site; requires contract/certificate/test validation when scope is material.
- **Legislation/regulator guidance:** official legal/regulatory text; interpretation and applicability should be confirmed with qualified counsel/regulator.
- **Direct confirmation required:** facts about OuterBlocks' eventual configuration, sub-processors, processing locations, contract terms, current account/product access or test results.
