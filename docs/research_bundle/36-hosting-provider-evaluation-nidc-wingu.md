# 36 — Tanzania Hosting Provider Evaluation: NIDC and Wingu Africa

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Research date:** 24 October 2026  
**Status:** Desktop due diligence; shortlisted candidates only; not a procurement decision or legal opinion.

## Executive conclusion

NIDC and Wingu Africa are both reasonable candidates to investigate for Travelar's Tanzania-first deployment. They should not yet be designated as production host or disaster-recovery provider: the available public information is useful but does not establish an end-to-end service commitment for Travelar's custom application, PostgreSQL 18, Keycloak, backups, monitoring, security operations, or recovery.

Their currently visible offerings are not directly equivalent:

- **NIDC** publishes virtual-server packages and colocation prices, and describes its data centre as Tier III and operated by Tanzania Telecommunications Corporation (TTCL). Its product pages provide more public price/specification detail for a direct virtual-server starting point. However, the listed packages all show 1 Mbps bandwidth, and the public website is inconsistent about whether cloud computing is already fully orderable. Confirm current service catalog and limits in writing.
- **Wingu Africa** publishes detailed information about its Dar es Salaam data-centre facility, carrier-neutral interconnection, colocation, power paths, security, monitoring and disaster-recovery-related services. It also announced a 2023 partnership with Flashnet for cloud servers, cloud backup, dedicated servers, disaster recovery as a service, colocation and managed services hosted at Wingu's data centre. This suggests a possible managed-compute path but must be reconfirmed; Wingu's facility service and Flashnet's managed-cloud service may involve different contracting and operating responsibilities.

**Recommended next action:** send both vendors the same technical and commercial RFI; ask Wingu separately whether the solution will be contracted directly with Wingu or through Flashnet/a managed-service partner. Run a small non-production proof of capability before selecting production infrastructure. Do not select a winner based on “local hosting” or Tier claims alone.

## 1. Product and workload under evaluation

The preferred architecture currently under consideration is:

- React + TanStack Start for web experiences.
- NestJS with Fastify as the custom application backend.
- PostgreSQL 18.x as the Travelar core transactional database.
- Keycloak as the preferred self-hosted identity provider, after legal and operational controls pass.
- Separate PostgreSQL database/credentials for Keycloak; not the same schema/database role as the Travelar core database.
- Provider adapters for GDS, payment services, communications and transport/accommodation/activity suppliers.
- Background workers, durable jobs/outbox, backups, centralized monitoring and a rehearsed disaster-recovery plan.

This is a custom application and database workload, not a request for simple website hosting. Travelar needs reliable sustained network throughput, secure private networking, predictable disk performance, recoverable PostgreSQL, controlled remote administration, independent backup storage, observability and a documented support/escalation contract.

## 2. NIDC — public evidence reviewed

### Verified from NIDC's own public website

- NIDC says it is operated by Tanzania Telecommunications Corporation (TTCL), describes itself as a Tier III data centre and states it is connected to the National ICT Broadband Backbone (NICTBB). [NIDC About](https://nidc.co.tz/about)
- NIDC publicly lists virtual-server packages at the time of research. The page advertises monthly pricing, installation cost, “24/7 Unlimited Support” and 1 Mbps bandwidth for each shown tier. [NIDC virtual-server pricing](https://nidc.co.tz/virtual_server)
- The listed Starter VM is TZS 289,918.50/month, TZS 115,000 installation, 2 GB RAM and 100 GB storage. Higher packages list 4 GB/200 GB at TZS 460,643; 8 GB/500 GB at TZS 527,843; 16 GB/800 GB at TZS 671,843; 32 GB/1,000 GB at TZS 887,843; and 64 GB/2,000 GB at TZS 1,211,843. The page also shows a “1 Mbps” bandwidth line for the packages. The displayed processor/core labels are unusual (for example, “4 vCPU” plus a separate “Core 2” field) and must be clarified in the quote. Prices and inclusions are public catalogue figures, not a negotiated production proposal; tax treatment and other charges must be confirmed.
- NIDC publishes colocation catalogue pricing: 1U at TZS 409,837/month plus TZS 230,000 installation and 1 Mbps bandwidth; half rack at TZS 2,889,443/month plus TZS 320,000 installation and 2 Mbps; full rack at TZS 4,655,843/month plus TZS 370,000 installation, with the bandwidth label shown as “4 Bandwidth” without clear units. [NIDC colocation pricing](https://nidc.co.tz/colocation)
- Its public service pages are not wholly consistent: the homepage says NIDC is “preparing to offer” cloud computing, while a September 2026 news item describes NIDC Cloud Computing as available and mentions a local IaaS promotion. The separate Virtual Server page is publicly orderable. The exact product, service status and price schedule should be confirmed directly. [NIDC homepage](https://nidc.co.tz/)
- Its service application form states that the operating-system licence is the customer's responsibility. Confirm which operating systems/images, kernel options, root access, patching and support are actually supplied. [NIDC service application](https://nidc.co.tz/application)
- NIDC lists contact details on its site: commercial@nidc.co.tz; +255 738 044 414 and +255 222 926 402. Verify contacts before procurement. [NIDC contact/about](https://nidc.co.tz/about)

### NIDC assessment for Travelar

Potential fit:
- A direct, locally hosted VM/IaaS or colocation starting point, if package specs and performance are suitable.
- Local contracting and local data-plane hosting may simplify some operational and cross-border-transfer questions; this does not itself prove compliance.
- NICTBB connection may be useful for local connectivity, but public marketing is not a guarantee of end-to-end internet diversity for Travelar.

Concerns to resolve:
1. **Bandwidth:** the public VM packages show 1 Mbps. For consumer search, ticket delivery, API traffic, backups and supplier adapters, this must be defined precisely: guaranteed bandwidth, port speed, monthly transfer allowance, burstability, inbound/outbound treatment, overage, and upgrade options. Do not assume it is adequate.
2. **Compute specification:** clarify the separate vCPU/core fields, CPU oversubscription, memory reservation, storage type/IOPS/latency, disk redundancy and noisy-neighbour controls.
3. **SLA scope:** determine if the advertised 24/7 support relates to incident response only or includes a measured uptime SLA, service credits, maintenance windows and escalation times.
4. **Cloud maturity/service consistency:** get the current orderable service catalogue, architecture, console/API, provisioning times, image support, networking, snapshots, backups, monitoring, DDoS/WAF options and service-status notice.
5. **OS and maintenance ownership:** the customer OS-licence note means patch ownership and support boundary need explicit wording. Travelar should not mistake VM hosting for a fully managed PostgreSQL or Keycloak service.
6. **Backup/DR:** public pricing pages do not establish point-in-time recovery, cross-site copies, restore guarantees, immutable backups, or a separate DR site.

Public catalogue values are not sufficient to size a production architecture. The small published VM tiers might be suitable for a non-production experiment depending on actual resources and network terms, but they should not be approved as production sizing without workload testing.

## 3. Wingu Africa — public evidence reviewed

### Verified from Wingu's own public website and dated partnership announcement

- Wingu identifies its Tanzania data centre at Mbezi Industrial Area, Plot No. 57, Kinondoni Municipality, Dar es Salaam. [Wingu contact/locations](https://www.wingu.africa/contact)
- Wingu's Tanzania page describes carrier-neutral colocation, multiple network-provider choices, connections to TTCL/NICTBB, local connectivity/IXP arrangements and connectivity to international submarine cable systems. It describes locked 42U cabinets, access controls, 24/7 security monitoring, multiple cooling zones, A+B power paths, UPS, transfer switches and multiple generators. These are provider-published facility descriptions and should be validated during vendor due diligence. [Wingu Tanzania data centre](https://www.wingu.africa/markets/tanzania)
- Wingu lists colocation, private cabling, virtual points of presence, backhaul/interconnection, hardware management, cloud enablement, content delivery and disaster recovery-related services. It does not publish a full public price/performance specification for a Travelar-ready managed virtual machine on the reviewed service page. [Wingu services](https://www.wingu.africa/services)
- Wingu's Tanzania page states “Tier 3 certified” and “99.982% service level agreement guaranteed uptime.” A separate Wingu blog explains that customers should ask whether Tier status is independently certified by Uptime Institute or self-declared. Therefore, the precise certificate, site scope, validity and contractual meaning of the availability figure require evidence; do not treat the website phrase alone as third-party certification. [Wingu Tanzania facility](https://www.wingu.africa/markets/tanzania), [Wingu reliability discussion](https://www.wingu.africa/blogs/why-99-982-uptime-matters-tier-iii-data-centre-and-cloud-reliability-in-east-africa)
- Wingu announced a 18 October 2023 partnership with Flashnet, a Dar es Salaam managed-service provider, covering cloud servers, cloud backup, dedicated servers, disaster recovery as a service, colocation and managed services hosted at Wingu's data centre. This is dated evidence: confirm the partnership, service scope, availability, price and contracting entity are still current. [Wingu/Flashnet announcement](https://www.wingu.africa/latest-news/flashnet-expands-data-centre-and-cloud-services-with-wingu)
- Wingu lists info@wingu.africa for general contact. [Wingu contact](https://www.wingu.africa/contact)

### Wingu assessment for Travelar

Potential fit:
- Carrier-neutral facility and connectivity choices, useful when Travelar needs network diversity and direct interconnects.
- Colocation is an option if OuterBlocks later decides to purchase and operate dedicated servers, firewalls and storage.
- The public Wingu/Flashnet announcement suggests a route to managed virtual machines, backup and DR without having OuterBlocks manage every physical component. This path needs current confirmation.

Concerns to resolve:
1. **Contracting/provider boundary:** establish whether Travelar buys colo directly from Wingu, managed servers from Flashnet, or a combined managed service. Identify who is responsible for hardware, hypervisor, host patching, customer OS, database operations, monitoring, backups, incident management and service credits.
2. **Site-specific assurance:** request independent facility certification evidence for the Tanzania site, current validity and exact scope; do not infer certification from a general “Tier III” claim.
3. **Compute product:** obtain a specific managed compute quote with vCPU, RAM, storage class and performance, network port/bandwidth/transfer terms, dedicated or shared tenancy, public IPs, private VLANs, firewall/DDoS options and console/API.
4. **Managed PostgreSQL/Keycloak:** ask whether services are genuinely managed database/identity operations or simply VMs on which Travelar remains responsible for every layer.
5. **DR topology:** identify primary and secondary sites, geographic separation, telecom/power/fibre independence, replication method, backup immutability and realistic RPO/RTO. A second service in the same Dar es Salaam metro may reduce single-facility risk but is not full regional disaster recovery.
6. **Commercial and exit terms:** minimum term, setup fees, bandwidth charges, electricity/power charges where relevant, remote-hands rates, after-hours support, taxes, data-egress/termination charges and how Travelar exports its data and images at exit.

## 4. Comparative view (not a vendor ranking)

| Requirement | NIDC public evidence | Wingu public evidence | What decides it |
|---|---|---|---|
| In-country Dar es Salaam facility | Yes, NIDC/TTCL facility is listed in Mikocheni | Yes, Wingu lists Mbezi Industrial Area | Confirm physical hosting location for every service, backup and support access. |
| Direct VM compute pricing | Published VM tiers, but bandwidth/spec ambiguity requires clarification | No equivalent full VM price/performance sheet seen on the reviewed Wingu page | Request like-for-like offers from NIDC and Wingu/Flashnet. |
| Colocation | Published 1U, half-rack and full-rack prices | Colocation, managed client area and private cage advertised | Compare total hardware, bandwidth, power, remote-hands and operations cost. |
| Carrier choice/interconnection | NICTBB connectivity and configurable connectivity methods are mentioned | Carrier-neutral model, multiple carriers, IXP/cable connectivity described | Ask for route-diversity diagrams, carrier list and measured latency/packet-loss evidence. |
| Facility redundancy | Provider claims Tier III and concurrent availability | Provider claims Tier III design/certification and resilient power; exact independent certification needs proof | Request site-specific certification, maintenance history and SLA contract. |
| Backup/DR | Public service pages do not establish production RPO/RTO or secondary-site design | Services page lists DR-related offering; Flashnet announcement describes backup/DR services | Get architecture, geographic site, tested restoration evidence and RPO/RTO contract. |
| Managed operations | Public pages advertise 24/7 support; scope not established | Hardware management and partner-managed services listed; exact responsibilities not established | Agree responsibility matrix (RACI) and response/resolution SLAs. |
| Production fit | Possible, after network/specification/SLA clarification | Possible via colocation or verified managed compute/DR path | Technical trial, legal review, security evidence, total-cost and exit assessment. |

## 5. Hosting posture recommended now

Do not yet declare NIDC primary and Wingu secondary, or vice versa. Both facilities are in Dar es Salaam (NIDC lists Mikocheni; Wingu lists Mbezi). They appear to be distinct facilities, but the evidence reviewed does not prove independence of power grids, fibre routes, management planes, upstream network, or regional hazard exposure.

A practical evaluation model is:

- **NIDC track:** request a production-grade IaaS/VM proposal and a separate colocation proposal; clarify the advertised 1 Mbps bandwidth and the CPU/core field anomaly before comparing price.
- **Wingu track:** request both direct colocation pricing and a current managed-compute/DR proposal. Ask Wingu to identify the service-delivery/contracting party if Flashnet or another partner is involved.
- **Technical proof:** provision temporary synthetic-data VMs; test network throughput/latency, disk IO, patch workflow, remote access, firewall rules, monitoring/export, restore time and VM replacement. Do not use real passenger or payment data in early tests.
- **Production architecture:** separate internet-facing application workloads from PostgreSQL; restrict database and Keycloak database access; isolate Keycloak administration; encrypt backup copies; use versioned configuration and audited access. Keep core booking/ledger writes transactional.
- **Resilience:** define target SLO, RPO and RTO before paying for DR. At minimum, maintain encrypted backups with an independent failure domain and successfully restore in exercises. For true disaster recovery, evaluate a second site with demonstrably independent facility/network failure modes and a legally assessed data location.
- **No automatic active-active database:** do not attempt multi-primary PostgreSQL across the two providers by default. Use a tested primary/standby or backup/restore pattern chosen around latency, data-loss tolerance, network failure and PostgreSQL recovery semantics.

## 6. Shared vendor RFI — send identical questions to both

### A. Legal, service and data location
1. What exact legal entity will contract with OuterBlocks Destinations Limited as the intended operating entity, and which parent/group entity (if any) is a party to the hosting/data-processing arrangement?
2. Where are compute, storage, databases, monitoring logs, backups, snapshots, support systems and disaster-recovery copies physically located?
3. Can support engineers, subcontractors or vendor control planes access or export customer data from outside Tanzania? If yes, from which countries and under what contract/safeguards?
4. List subprocessors and processing countries. Supply the data processing agreement, confidentiality clauses, breach-notification commitments, deletion/return terms and audit rights.
5. Are any services operated by a third party (for example a managed service partner)? Who owns each obligation and incident escalation?

### B. Compute and network
6. Quote separate development, staging and production configurations suitable for the proposed stack: TanStack Start web tier, NestJS/Fastify API, Keycloak and PostgreSQL 18. Include vCPU/core definitions, CPU reservation/oversubscription, RAM, disk type/IOPS, disk redundancy, VM limit, OS options and admin access.
7. State committed bandwidth, interface speed, monthly transfer caps, bursting, overage rate, peering/IXP, available carriers, latency/packet-loss measurement and public/private IP offerings.
8. What network isolation, security groups/firewalls, DDoS controls, WAF options, private connectivity and secrets integration are available?
9. Are production and development systems logically or physically separated? Can we isolate the PostgreSQL and Keycloak databases from public networks?

### C. Availability, backup and disaster recovery
10. Provide the signed/standard SLA and exact uptime formula, exclusions, planned maintenance, service-credit remedy, incident response times and escalation path.
11. Provide current site-specific Tier/design certification evidence and validity period, or state clearly which claim is design-based rather than independently certified.
12. Where are backup/DR sites? Describe independent power, carrier, fibre route, DNS/control-plane dependencies and geographic risk.
13. Can you supply automated daily backups plus PostgreSQL PITR/WAL archives? Is the backup copy isolated/immutable? State retention, encryption/key ownership and restore testing frequency.
14. What RPO and RTO can you contractually offer for (a) full VM, (b) PostgreSQL database, (c) Keycloak, and (d) whole Travelar environment?
15. Provide a recent anonymised restore/DR exercise report and the process for customer-observed annual failover tests.

### D. Operations and security
16. Who patches the host, hypervisor, guest OS, PostgreSQL, Keycloak and application dependencies? Which duties remain entirely OuterBlocks' responsibility?
17. Describe access logging, privileged access, MFA, staff screening, break-glass controls, security event notification and evidence retention.
18. Supply independent audit/certification reports available under NDA (for example ISO 27001 scope/certificate, SOC reports if any, penetration-test summaries, and vulnerability-management processes). Do not treat an unavailable certification as automatically disqualifying; assess actual control evidence and contract risk.
19. Are security logs, monitoring and alert destinations configurable to remain in the approved location? What metadata are exported by default?
20. What happens if the customer isolates or disables a compromised VM? Who preserves evidence and assists incident response?

### E. Price, scaling and exit
21. List setup, monthly compute, storage, backup, bandwidth, public IP, firewall, WAF/DDoS, monitoring, support, remote-hands, taxes and all other recurring/one-time costs.
22. Define CPU/RAM/storage/network scaling and whether resize/reboot or downtime is required.
23. How are price changes, renewal, minimum terms, termination, data export, disk-image export and secure deletion handled?
24. Can Travelar export PostgreSQL logical and physical backups, application images, Keycloak realm configuration and infrastructure configuration without proprietary conversion or excessive egress charges?
25. Provide two relevant customer references (ideally an ecommerce, payments-adjacent, travel or SaaS system) that can discuss support, outage handling and restoration.

## 7. Procurement scorecard

Score each vendor only after receiving evidence. Use 0 = no evidence/does not meet, 1 = partially meets or material gap, 2 = meets with documentary evidence, 3 = exceeds need with independently verifiable evidence. “Unknown” is not a passing score.

| Category | Suggested weight | Evidence needed |
|---|---:|---|
| Legal/data-location fit and contract clarity | 20% | Data-processing agreement, locations, subprocessors, transfer review |
| Network capacity and connectivity | 15% | Bandwidth SLA, route/carrier diagram, measured network tests |
| Compute/database performance | 15% | Written specs, benchmark trial, storage IOPS/latency |
| Availability and incident support | 15% | SLA, response times, maintenance terms, incident references |
| Backup/DR and restoration evidence | 15% | Architecture, site location, RPO/RTO, restore exercise |
| Security controls and assurance | 10% | Certifications/scope, privileged access, logging, remediation |
| Three-year total cost and scaling | 5% | Complete quotes and upgrade/egress terms |
| Exit portability and vendor risk | 5% | Export/deletion clauses, image/data portability, exit support |

Critical gate rule: legal/data-location fit, network capacity, backup restoration and an acceptable SLA must each meet minimum acceptance criteria; strong performance in another category does not compensate for failure in a critical category.

## 8. Suggested staged decision

1. Obtain the two proposals and clarify public-page ambiguities.
2. Validate one or more non-production environments with synthetic data; test network, disk, access and restore.
3. Compare the full 3-year cost, including staff/managed operations and backup/DR—not only the VM price.
4. Obtain legal review of the hosting data flow, processor terms, support access and backup location.
5. Choose production and recovery facilities only after the failure-domain analysis and recovery drill pass.
6. Re-evaluate every year and after a material architecture or jurisdiction change.

## 9. Evidence register (checked 24 October 2026)

1. NIDC, “About Us”: https://nidc.co.tz/about — NIDC describes its operator, Tier III facility and NICTBB connectivity.
2. NIDC, “Virtual Server Prices”: https://nidc.co.tz/virtual_server — published VM pricing, listed resources, 1 Mbps bandwidth and 24/7 support label.
3. NIDC, “Colocation Prices”: https://nidc.co.tz/colocation — public 1U/half/full rack catalogue rates and bandwidth labels.
4. NIDC, “New Service Application”: https://nidc.co.tz/application — operating-system licence responsibility and service-request form.
5. NIDC homepage: https://nidc.co.tz/ — latest cloud service and promotion statements; reconcile with the service page before quoting.
6. Wingu, “Tanzania Data Centre”: https://www.wingu.africa/markets/tanzania — location, connectivity, power, security, environmental and Tier/SLA claims.
7. Wingu, “Services”: https://www.wingu.africa/services — colocation, hardware management, disaster recovery and cloud enablement service descriptions.
8. Wingu, “Flashnet expands data centre and cloud services with Wingu” (18 October 2023): https://www.wingu.africa/latest-news/flashnet-expands-data-centre-and-cloud-services-with-wingu — historical partnership description for managed cloud, backup and DR services hosted at Wingu.
9. Wingu, “Why 99.982% Uptime Matters”: https://www.wingu.africa/blogs/why-99-982-uptime-matters-tier-iii-data-centre-and-cloud-reliability-in-east-africa — provider commentary on Tier III and the need to examine certification/SLA evidence.
10. Wingu contact: https://www.wingu.africa/contact — official Tanzania facility location and general contact.

## Status summary

- **Verified from published provider materials:** both have a Tanzania presence; NIDC publishes VM and colocation prices; Wingu publishes colocation/connectivity and facility information; Wingu previously announced managed cloud/backup/DR services through Flashnet.
- **Provider claims, not independently validated here:** tier/availability assertions and descriptions of facility security/power.
- **Requires current vendor confirmation:** actual orderability, exact SLA, bandwidth, performance, managed service boundary, backup/DR design, pricing/terms, certifications, incident records and contract entity.
- **Requires legal review:** data processing/transfer arrangement including backup copies, admin/support access, logs, monitoring and subprocessors.
- **Decision:** NIDC and Wingu remain shortlisted. No production host has been selected.

## 4. Verification status update (24 October 2026)

A focused follow-up review now records which items are publicly corroborated and which remain unverified. See [Document 38 — Hosting Verification](38-hosting-verification-location-data-flows-backups-recovery-security.md), [ADR-HOST-002](ADR-HOST-002-verification-before-production.md), and [Stage 12 evidence register](sources-and-evidence-register-stage12.md).

Important refinements:

- The current Wingu Tanzania page publicly states “Tier 3 certified” and a 99.982% uptime SLA, but this must be validated against a current site-specific certificate and executed SLA. It is a facility claim, not an end-to-end Travelar application commitment.
- Wingu’s Flashnet partnership announcement dates to 18 October 2023. Reconfirm the currently available products and the actual contracting/service provider.
- NIDC's publicly listed virtual-server and colocation bandwidth values remain a production concern until port speed, guaranteed throughput, usage caps and upgrade choices are clear.
- Public website descriptions of physical security, power, and 24/7 monitoring do not establish managed OS/PostgreSQL/Keycloak security operations, backup restoration, or a contractual DR outcome.
- NIDC/Wingu being located in Dar es Salaam does not demonstrate geographical disaster independence when one is used as the other's recovery site.

**Status:** both remain shortlisted candidates, and neither has been verified for production solely from public evidence.
