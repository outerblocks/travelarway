# Stage 12 — Hosting Verification Evidence Register

**Review date:** 24 October 2026. The status below distinguishes public vendor claims from independent evidence, contract terms and tests not yet provided.

| Source | Publisher | Claim supported | Evidence limit / next action |
|---|---|---|---|
| https://nidc.co.tz/about | NIDC | NIDC says it is operated by TTCL, is a Tier III facility, located in Mikocheni and connected to NICTBB | Request current certificate, scope/validity, facility-specific evidence and contractual SLA |
| https://nidc.co.tz/virtual_server | NIDC | Public VM prices/specs, 1 Mbps line, listed 24/7 support, installation fees | Confirm rate/port/cap, vCPU/Core semantics, storage, support SLA, tax/inclusions and whether it fits production load |
| https://nidc.co.tz/colocation | NIDC | Public rack prices and bandwidth labels | Clarify undefined full-rack bandwidth units, cross-connect fees, routing redundancy and network SLA |
| https://nidc.co.tz/storage_services | NIDC | A public storage catalogue exists | Does not establish database PITR, immutability, offsite location or restoration guarantee |
| https://nidc.co.tz/ | NIDC | Public catalogue and current service messaging | Home page says cloud computing is being prepared while other messaging suggests an IaaS offer; get direct current product status |
| https://www.wingu.africa/markets/tanzania | Wingu Africa | Tanzania facility and published connectivity, power, physical security, monitoring, “Tier 3 certified” and 99.982% SLA claims | Obtain site-specific current certificates, exact SLA terms and actual service scope; claims do not establish app/DB availability |
| https://www.wingu.africa/latest-news/flashnet-expands-data-centre-and-cloud-services-with-wingu | Wingu Africa, 18 Oct 2023 | Announced partnership with Flashnet for cloud servers, backup, dedicated servers, DRaaS, colocation and managed services | Dated announcement; confirm current availability, service operator, contract party, locations and support responsibilities |
| https://pdpc.go.tz/services/registration/ | PDPC Tanzania | Registration requirement/process for controllers/processors | OuterBlocks' status and roles need documentary/legal confirmation |
| https://pdpc.go.tz/services/cross-border-data-transfer-permit/ | PDPC Tanzania | Official transfer permit procedure and safeguard information | Apply the rule to actual transfers with counsel/PDPC; determine data, destination and recipient scope |
| https://www.pdpc.go.tz/media/media/THE_PERSONAL_DATA_PROTECTION_ACT.pdf | PDPC Tanzania | Personal Data Protection Act, 2022, Part V transborder flows | Exact applicability must be assessed for each role/data flow |
| https://www.pdpc.go.tz/media/media/GN_NO._449C_OF_2023_3_1_2.pdf | PDPC Tanzania | Personal Data Collection and Processing Regulations 2023, Regulation 20 transfer permit procedure | Ask counsel/PDPC about application and safeguards for each planned transfer |
| https://www.keycloak.org/server/supported-configurations | Keycloak project | PostgreSQL 18.x is listed as a supported database configuration | Pin supported patched Keycloak/Java/container versions at implementation time and test restore/upgrades |
| https://www.keycloak.org/server/configuration-production | Keycloak project | Production TLS, hostname, proxy, admin surface, readiness and clustering guidance | Must be implemented, independently reviewed and tested in actual deployment |
| https://www.keycloak.org/server/hostname | Keycloak project | Explicit hostname mitigates host-header/URL manipulation risks | Validate public hostname and forwarded-header controls in deployment |
| https://www.keycloak.org/server/reverseproxy | Keycloak project | Proxy port exposure guidance, including management port isolation | Review actual firewall/load balancer configuration |
| https://www.postgresql.org/docs/18/backup.html | PostgreSQL project | Backup methods and restore concepts | Provider must give evidence for actual implementation and restore tests |
| https://www.postgresql.org/docs/18/continuous-archiving.html | PostgreSQL project | WAL archiving and point-in-time recovery/warm standby principles | Configure and test; a written plan alone does not prove recoverability |

## Outstanding evidence requests

1. NIDC written response to bandwidth, VM resource, support, database/OS responsibilities, backup geography, PITR, DR and DPA questions.
2. Wingu and, if applicable, Flashnet written response identifying the contracting service provider, data locations, service scope, backups/DR, RPO/RTO and security operations.
3. Current independent facility certificate and scope for each proposed site.
4. Data processing agreement, subprocessor/remote-support-location list and contractual breach-notification terms.
5. Signed, legal-reviewed Travelar data-flow/transfer register and PDPC status for each transfer that requires a permit.
6. Actual non-production performance, security, backup and disaster-recovery test results.
