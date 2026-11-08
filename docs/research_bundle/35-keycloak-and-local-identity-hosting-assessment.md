# 35 — Keycloak and Local Identity Hosting Assessment

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Research date:** 24 October 2026  
**Decision status:** Keycloak-first is the recommended direction for a Tanzania-first launch, conditional on hosting, staffing, legal review and proof-of-concept gates. This is not production approval or legal advice.

## 1. Executive conclusion

The regulatory concern is legitimate. For a Tanzania-first platform, a self-hosted identity provider gives OuterBlocks more direct control over where identity records, authentication logs, database replicas, backups and administrative access are located. After reviewing the official Tanzanian legislation and PDPC guidance alongside current Keycloak documentation, the recommended direction is:

1. **Use Keycloak rather than building authentication from scratch.** Keycloak already implements established identity protocols and has features for password policies, sessions, multifactor authentication and WebAuthn/passkeys.
2. **Prefer a Keycloak deployment in a verified Tanzanian hosting environment** for the first Tanzania launch, if OuterBlocks can contract for suitable security, availability, backups and incident support. The location is a deployment requirement to validate—not an assumption that any named data centre is already suitable or contracted.
3. **Use PostgreSQL 18 for Keycloak's own database if the pinned Keycloak release supports it.** The current official Supported Configurations page lists PostgreSQL 18.x as supported. The Keycloak documentation also describes PostgreSQL 18 as a tested version. Reconfirm against the exact Keycloak release selected for implementation.
4. **Keep Keycloak's database distinct from Travelar's application database.** At minimum, use a separate database and dedicated least-privilege credentials; assess a separate database instance for production isolation. Never let application code write directly into Keycloak tables.
5. **Keep all business permissions in Travelar.** Keycloak proves identity and issues protocol tokens; Travelar's backend controls operator, branch, tenant, booking, manifest, finance, refund and HIMS authorization.
6. **Do not treat local Keycloak as complete legal compliance.** Mail/SMS services, telemetry, remote support, external identity providers, replicated backups and other outbound flows can still transfer personal data internationally. Map and assess each flow.
7. **Retain Auth0 as a documented alternative, not the default.** Reconsider it only if a written legal assessment and vendor evidence show that its exact data processing and region configuration are acceptable and its operational/economic profile is better than running Keycloak.

The recommendation favors Keycloak for its deployment and data-location control, not because self-hosted identity is inherently more secure than a well-operated managed provider. Security outcome depends on configuration, patching, competent staff, recovery and integration.

## 2. What the Tanzania rules establish—and what they do not

### Verified legal and regulator facts

- The Personal Data Protection Act, 2022 (Act No. 11 of 2022; Chapter 44) contains section 14 on registration of data controllers and processors, section 27 on security, section 28 on retention/disposal, and sections 31–32 on cross-border data flows. Official text: [Office of the Attorney General — Act](https://oagmis.oag.go.tz/portal/acts/237) and [downloaded Act](https://oagmis.oag.go.tz/portal/acts/237/download).
- PDPC's official registration page states that a person may not collect or process personal data without registration as a data controller or processor: [PDPC registration](https://pdpc.go.tz/services/registration/).
- The Personal Data Protection (Personal Data Collection and Processing) Regulations, 2023, GN No. 449C of 2023, include regulation 20 on applications for permission to transfer personal data outside Tanzania. Official text: [OAG legislation page](https://oagmis.oag.go.tz/portal/legislation/1350) and [regulations PDF](https://oagmis.oag.go.tz/portal/legislation/1350/download).
- PDPC's current cross-border-transfer service page states that entities intending to transfer personal data outside the country must apply to the Commission and describes destination, recipient, purposes, data types, duration/method, legal arrangements and safeguards: [PDPC cross-border permit service](https://pdpc.go.tz/services/cross-border-data-transfer-permit/).

### Interpretation for Travelar

The Act's sections 31–32 regulate transfers outside the country and describe conditions and safeguards. The Regulations and PDPC's current public guidance describe a permit process. The reviewed sources do **not** establish a simple universal proposition that every category of data must always be stored only inside Tanzania in every situation. They do establish that international processing/transfer is a material compliance question and cannot be assumed lawful merely because a cloud vendor is well known or offers encryption.

For launch planning, treat any planned outbound flow of identity-related personal data as a **legal review and PDPC confirmation gate** until Tanzanian counsel and, where needed, the Commission confirm the applicable statutory route, permit requirements, exemptions and safeguards for that exact flow.

### Why Keycloak helps

A Keycloak instance whose database, application nodes, audit logs, backups and privileged administration are all in a verified Tanzania environment can reduce the number of identity-system transfers and make control, inspection and deletion more direct. It does not by itself settle:

- whether the hosting company, its support staff or subcontractors can access data from abroad;
- where offsite backups, disaster-recovery copies, metrics, traces and security alerts are stored;
- whether login emails, OTP messages or external identity federation transmit identifiers outside Tanzania;
- what countries receive IP addresses, device data, usernames or identifiers through a CDN, WAF, monitoring or customer-support service;
- any separate requirement applying to Travelar's booking, passenger-manifest, tax, payments or transport data.

A local server or local database is a control—not a compliance certificate.

## 3. Kenya must be assessed separately

Kenya's Data Protection Act, 2019 and the Data Protection (General) Regulations, 2021 govern personal-data processing and cross-border transfers under the Office of the Data Protection Commissioner (ODPC). The official laws portal lists these instruments: [ODPC regulatory framework](https://www.odpc.go.ke/data-protection-laws-kenya/). ODPC has also published cross-border transfer guidance and transport-sector guidance, including a 2026 transport-sector note: [ODPC guidelines](https://www.odpc.go.ke/guidelines-2/).

Do not assume that a Tanzanian Keycloak deployment automatically satisfies Kenya's transfer, registration, security or other requirements. Before expanding, determine whether Kenyan identity records should be stored in a Kenya environment, whether a shared regional identity service is lawful for the specific data flows, and what safeguards/approvals are required. This is a country-entry decision, not a conclusion that follows merely from using Keycloak.

## 4. Current Keycloak capability and version evidence

As of 24 October 2026, the official Keycloak release page lists **Keycloak 26.8.1**, released on 13 October 2026. Its release notice lists security fixes; implementation must check release notes and advisories immediately before pinning a production version: [26.8.1 release notice](https://www.keycloak.org/2026/10/keycloak-2681-released), [official downloads](https://www.keycloak.org/downloads), [release notes](https://www.keycloak.org/docs/latest/release_notes/).

Keycloak's official [Supported Configurations](https://www.keycloak.org/server/supported-configurations) currently lists PostgreSQL 18.x, 17.x, 16.x, 15.x and 14.x as supported. It supports deployment on bare metal/virtual machines and containers, among other environments. Verify the selected release's exact tested combination, Java runtime, extensions and database driver during the proof of concept.

Keycloak documentation describes WebAuthn for two-factor and passwordless authentication. The feature must be configured and tested rather than assumed enabled: [Keycloak Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/).

## 5. Proposed target architecture

### 5.1 Separate identity and product data

- Keycloak owns identity credentials, login sessions, authentication methods, identity-provider links and identity configuration.
- Travelar PostgreSQL owns internal users, external identity mappings, organizations, operator/branch memberships, roles/permissions, consent/retention records, bookings, inventory, payments, ledger and product audit records.
- The mapping from identity provider to Travelar is `(issuer, subject) -> internal_user_id`; never use mutable email as the permanent join key.
- Keycloak manages its tables. Travelar never modifies them directly.
- Use a separate PostgreSQL database and database role for Keycloak. Assess a separate instance/cluster in production based on availability, isolation, operating cost and local-hosting options. Do not reuse the Travelar application role or database schema.

### 5.2 Realms and trust boundaries

For the proof of concept, test a realm separation model with:

- `passengers`: external customer identities and customer-specific authentication/recovery policy;
- `partners`: operator owners, operator staff, operator agents and partner user lifecycle;
- `outerblocks-workforce`: OuterBlocks employees, HIMS, finance, customer service, Travelar agents and other staff.

This three-realm model is a proposal to test, not yet a final requirement. It improves policy and administrative separation but increases configuration and account-linking complexity. Compare it with a two-realm model before deciding. Regardless of realm count, Travelar's database—not a client-supplied role or an unchecked group claim—must determine current tenant, operator, branch, financial and data permissions.

Do not place every domain object or operator hierarchy into Keycloak groups. Keep authoritative organization and membership relationships in Travelar's application database and put only necessary, bounded claims in tokens.

### 5.3 Protocol use

- Browser: OpenID Connect Authorization Code flow with PKCE; use a server-side BFF/application session where appropriate, `Secure` and `HttpOnly` cookies, CSRF protections and deliberately bounded session lifetime.
- Native mobile: Authorization Code + PKCE using the system browser and platform-protected token storage; never embed a confidential client secret in an app.
- Backend APIs: validate JWT signature and trusted keys, issuer, audience, expiry/not-before, allowed algorithm, client/scope and relevant claims. An ID token is not an API access token.
- Service-to-service: use distinct confidential clients and the appropriate machine-to-machine flow, rotate secrets/keys and keep credentials in a secret manager.
- Logout/revocation: define front-channel/back-channel or session-revocation behavior, token lifetimes and what happens when an account is disabled.

### 5.4 Privileged authentication

- Require MFA for workforce identities, with passkeys/WebAuthn or a suitable authenticator app where the use case supports it.
- Require phishing-resistant authentication and step-up verification for HIMS administrators, finance, payouts/refunds, identity administration and security-sensitive changes where practicable.
- Avoid SMS as the sole second factor for privileged staff because of SIM-swap/number-reassignment risks. SMS may still be used for notifications or lower-risk customer verification if locally lawful and properly integrated.
- Configure brute-force protection, rate limits at the edge, secure account recovery, verified contact changes, session lifetime, suspicious sign-in monitoring and reauthentication for sensitive actions.
- Separate Keycloak super-admin access from ordinary application administration. Keep the admin console and Admin REST API off the public internet or tightly restricted at the network/reverse-proxy layer; the public OIDC endpoints are the intended public interface.

## 6. Production hardening and operating obligations

Self-hosting transfers responsibility to OuterBlocks. Before production, document and test all of the following:

1. **Location and contracts:** written facility location, data ownership, physical/security controls, subprocessors, support-access countries, backup/DR location, retention/deletion and incident notice terms.
2. **Network:** HTTPS/TLS, explicit hostname/proxy configuration, trusted proxy headers, private database access, closed unused ports, network segmentation and restricted admin endpoints.
3. **Database:** PostgreSQL 18 supported by the pinned Keycloak release, dedicated database and least-privilege role, TLS for DB connections, encrypted storage/backups, patch plan and tested restore procedure.
4. **Secrets and keys:** no committed credentials, managed secret storage, Keycloak signing-key/rotation plan, database credential rotation, admin recovery and emergency-access logging.
5. **High availability:** appropriate multiple Keycloak instances or a documented launch-stage availability design, health/readiness checks, load-shedding, resource limits and a recovery plan. Define RTO/RPO according to launch needs and test them; do not promise them without a successful drill.
6. **Upgrades:** pin the supported release; monitor official release/security notices; rehearse upgrades in staging; promptly triage security advisories and patch through a tested deployment process.
7. **Abuse protection:** rate limits, brute-force detection, credential-stuffing monitoring, bot/WAF controls, alert thresholds and tested account-lockout/appeal recovery. Avoid indefinite lockouts that create easy denial of service.
8. **Audit:** record admin changes, login/recovery security events and configuration changes with access control, retention limits, clocks and protected backups. Logs must not record passwords, tokens, recovery secrets or unnecessary personal data.
9. **Data minimization:** collect only identity profile attributes needed for the purpose; minimize token claims; avoid adding passenger documents or manifest fields to Keycloak without a clear requirement.
10. **Incident response:** assign an owner for identity compromise, admin-account compromise, credential-stuffing, leaked signing key, database compromise, failed upgrade and IdP outage. Maintain a tested restoration and user/session revocation procedure.
11. **Observability:** metrics and logs must be reviewed for cross-border transmission; do not send identifying payloads to a foreign observability platform before the transfer review.
12. **Identity email/notifications:** Keycloak's built-in email flows do not automatically inherit Travelar's communications-adapter failover. Route email through a controlled relay/adapter layer or a reviewed provider integration; that relay's queue, payloads, logs and locations must be included in the data map. For custom Keycloak extensions, account for the extra maintenance surface. Test delivery failure for verification and recovery flows.

Official production guidance: [Keycloak production configuration](https://www.keycloak.org/server/configuration-production), [supported configurations](https://www.keycloak.org/server/supported-configurations), and [reverse proxy configuration](https://www.keycloak.org/server/reverseproxy).

## 7. Availability and failure behavior

- If Keycloak is unavailable, new logins and refreshes may fail. Do not silently bypass authentication or grant elevated permissions.
- Existing sessions/tokens may remain valid until expiry depending on the design; set lifetimes and revocation requirements explicitly. For HIMS/finance sensitive actions, require recent authentication or an independent step-up check.
- Public search and any independently authorized guest flow may continue if designed to do so. Guest booking must not be used to bypass payment, inventory, passenger-data access or customer-account security rules.
- If identity login, email verification or account recovery is degraded, use a controlled recovery process; do not expose booking details based only on a booking reference.
- If external login via social identity providers is considered, it remains disabled until its data transfers, account-linking security, contract and recovery behavior are reviewed.

## 8. Deployment model and staged maturity

### Development/proof of concept

Use a segregated non-production Keycloak instance and synthetic identities. Validate OIDC/BFF behavior, separate realms, access-token verification, PostgreSQL 18 compatibility, MFA/passkeys, password recovery, admin network restrictions and failure handling. No production passenger or employee data.

### Tanzania pilot

Deploy in the verified approved environment. At minimum, isolate Keycloak's DB and credentials from Travelar application data, enforce TLS, restrict administration, configure backups and test restoration. If two-instance HA is not feasible on day one, record the single-instance risk explicitly and ensure the launch SLA/pilot scope accepts it; do not mislabel it highly available.

### Production scale

Introduce a redundant Keycloak deployment, database HA and local DR according to measured authentication demand and defined RTO/RPO. Cross-border replicas/backups must not be enabled until the corresponding transfer analysis and approvals are in place. Exercise a full identity-provider outage and restore scenario before material scale-up.

## 9. Required proof-of-concept test matrix

| Test | Pass condition |
|---|---|
| PostgreSQL 18 compatibility | Exact supported Keycloak release starts, migrates and passes smoke/concurrency tests on PostgreSQL 18.x. |
| OIDC login | State, nonce, PKCE, issuer, audience, signature and expiry checks pass; replay and wrong-client tests fail safely. |
| Tenant authorization | A partner from Operator A cannot access Operator B's users, manifests, bookings or documents by changing IDs or claims. |
| Realm/role separation | Passenger identity cannot access workforce apps; operator account cannot acquire HIMS/finance privileges. |
| MFA/step-up | Workforce MFA works; privileged actions reject insufficient authentication; recovery does not bypass step-up. |
| Key rotation/revocation | Rotated signing keys propagate safely; disabled users, revoked sessions and expired tokens behave as specified. |
| Brute-force/abuse | Repeated failures throttle/lock per policy and generate alerts without enabling trivial denial-of-service. |
| Admin exposure | Internet probes cannot reach Keycloak Admin Console/Admin REST API from unapproved networks. |
| Email failover | Email relay failure/retry does not disclose tokens, endlessly duplicate messages or leave account recovery falsely marked complete. |
| Backup/restore | Recovery of Keycloak DB/config/keys tested; keys and database remain mutually consistent. |
| Data location | Vendor contract and technical evidence confirm actual primary, log, backup, telemetry and support-access locations; all outbound flows are recorded. |
| Outage behavior | Login outage never bypasses authorization or financial/inventory checks; existing session and recovery behavior matches policy. |
| Migration/exit | Export/migration of users where supported, internal ID mapping and account-recovery plan demonstrated in non-production. |

## 10. RFI questions to put to PDPC and hosting providers

### PDPC / Tanzanian counsel

1. For the proposed Keycloak deployment in Tanzania, which processing locations, backups, telemetry, foreign support access and SMTP/SMS integrations constitute a cross-border transfer for purposes of the Act and GN 449C?
2. For each destination and data category, what permit, safeguards, contractual evidence or other lawful transfer basis is required? Are any exemptions or categories in force that apply?
3. What registration category and documents must OuterBlocks complete as controller and/or processor, and what DPO requirements apply to the actual operating model?
4. Are there sector-specific hosting, security, manifest, financial or records obligations that apply to the booking platform in addition to the general PDPA framework?
5. How should access from a foreign support engineer to an otherwise in-country identity system be assessed?

### Local hosting/data-centre provider

1. Where, physically, are Keycloak nodes, PostgreSQL, logs, object storage, snapshots and DR copies located?
2. Who can access each system, from which country, under what approval and audit process?
3. What certifications, independent audit reports, security controls, SLA and incident-notification terms are contractually provided?
4. Can the provider guarantee that no backup, monitoring export or support ticket containing personal data is replicated outside the approved jurisdiction without authorization?
5. What are network diversity, power redundancy, recovery testing, backup restoration, DDoS protection and key-management capabilities?
6. What versions and workloads are supported, and how are emergency patches, maintenance and major upgrades coordinated?

## 11. Decision table

| Issue | Proposed decision | Status |
|---|---|---|
| Authentication implementation | Use Keycloak; do not build password/session management from scratch | Recommended |
| Primary identity hosting | Prefer verified Tanzania deployment for Tanzania-first phase | Conditional on procurement/legal confirmation |
| Keycloak database | PostgreSQL 18.x supported by the pinned release; separate database/role from Travelar core | Supported platform direction; PoC required |
| App backend authorization | Travelar/NestJS owns internal permissions and data access | Architecture direction |
| Realm separation | Test passenger, partner and OuterBlocks workforce realms against two-realm alternative | Open design decision |
| Auth0 | Retain as alternative if transfers are lawful/approved and managed operations are more suitable | Contingency only |
| Custom auth | Do not implement from scratch for initial release | Rejected for launch baseline |
| Production approval | No-go until legal, hosting, security, recovery and test gates pass | Not approved |

## 12. Sources and verification record

All accessed 24 October 2026 unless otherwise noted.

| Source | Claims supported | Evidence class |
|---|---|---|
| [Tanzania Personal Data Protection Act, 2022 — OAG](https://oagmis.oag.go.tz/portal/acts/237) | Sections 14, 27–28, 31–32 and legal context for registration, security, retention and cross-border transfers | Primary legislation |
| [Tanzania Act PDF, Part V](https://oagmis.oag.go.tz/portal/acts/237/download) | Exact statutory text for cross-border data flow provisions | Primary legislation; PDF pages visually inspected |
| [Tanzania GN 449C of 2023 — OAG](https://oagmis.oag.go.tz/portal/legislation/1350) | Regulations and application process for transfers outside the country, especially regulation 20 | Primary subsidiary legislation |
| [GN 449C PDF](https://oagmis.oag.go.tz/portal/legislation/1350/download) | Transfer-permit application details, recipient/security information and conditions | Primary subsidiary legislation; PDF page visually inspected |
| [PDPC registration](https://pdpc.go.tz/services/registration/) | Controller/processor registration is required before processing under PDPC guidance | Primary regulator guidance |
| [PDPC transfer-permit page](https://pdpc.go.tz/services/cross-border-data-transfer-permit/) | Current PDPC process and compliance expectations for proposed international transfers | Primary regulator guidance |
| [Kenya ODPC laws](https://www.odpc.go.ke/data-protection-laws-kenya/) | Kenyan Data Protection Act, 2019 and 2021 regulations | Primary regulator legal index |
| [Kenya ODPC guidance](https://www.odpc.go.ke/guidelines-2/) | Cross-border and transport-sector guidance for the Kenya expansion assessment | Primary regulator guidance |
| [Keycloak supported configurations](https://www.keycloak.org/server/supported-configurations) | Current tested/supported PostgreSQL 18.x and deployment platforms | Primary project documentation |
| [Keycloak 26.8.1 release notice](https://www.keycloak.org/2026/10/keycloak-2681-released) | Release date and recorded security fixes; upgrade review required | Primary release documentation |
| [Keycloak production configuration](https://www.keycloak.org/server/configuration-production) | HTTPS/TLS, hostname, administration endpoint separation, proxy and production hardening | Primary project documentation |
| [Keycloak administration guide](https://www.keycloak.org/docs/latest/server_admin/) | WebAuthn/passkey and identity policy capabilities | Primary project documentation |
| [Keycloak reverse proxy guide](https://www.keycloak.org/server/reverseproxy) | Reverse proxy/network exposure considerations | Primary project documentation |
| [Auth0 sub-region guidance](https://support.auth0.com/center/s/article/Tenant-Creation-in-a-Specific-Sub-region) | Public-cloud tenant subregions cannot be manually selected; private-cloud regions depend on availability | Primary vendor documentation |

## 13. Explicit limitations

- This is an architecture and regulatory research assessment, not a legal opinion or regulator approval.
- The report does not establish that a particular Tanzanian hosting provider can meet Travelar's required technical, SLA, audit or cost terms; obtain vendor evidence and contract language.
- Keycloak's source code availability and feature set do not remove the need for timely upgrades, configuration review, incident response and specialist IAM operations.
- Legal requirements and product versions can change. Re-check official laws, regulator guidance, Keycloak releases and supported database combinations before production.
- No production realm, database, hosting contract or identity user population is assumed to exist.

## Follow-up hosting and operations verification (24 October 2026)

Use Keycloak's official production requirements as a deployment baseline, but require the hosting provider to identify whether support includes only facility/network/VM operation or also the guest OS, Keycloak, database, monitoring and security incidents. Verify Keycloak's identity DB, backups, realm/client configuration, sign-in logs, email/OTP routing and remote support locations. These may create separate data flows even when the main Keycloak VM is local.

See [38 — Hosting Verification](38-hosting-verification-location-data-flows-backups-recovery-security.md) and [ADR-HOST-002](ADR-HOST-002-verification-before-production.md) for the vendor RFI and non-production test plan.
