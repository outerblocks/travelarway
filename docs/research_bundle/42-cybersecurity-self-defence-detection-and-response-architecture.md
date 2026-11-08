# 42 — Cybersecurity, Self-Defence, Attack Detection and Incident Response Architecture

**Product:** Travelar  
**Operating company baseline:** OuterBlocks Limited  
**Research cut-off:** 24 October 2026  
**Status:** Proposed security architecture and pre-launch control standard; not evidence that any control is implemented, independently tested, or certified.

## 1. Executive decision

Travelar must be designed as a **secure-by-default, monitored, recoverable system**. “Self-defence” means that the platform can prevent common attacks, identify suspicious behaviour, execute narrow and reversible containment actions, preserve evidence, and restore trusted operations. It does **not** mean the system can guarantee that it will never be breached or replace a qualified security engineer, independent penetration test, privacy/legal review, or incident responder.

Adopt a layered program aligned to NIST Cybersecurity Framework 2.0's Govern, Identify, Protect, Detect, Respond and Recover functions; use OWASP Application Security Verification Standard (ASVS) 5.0.0 as a testable application-security baseline, OWASP Top 10:2025 for awareness, OWASP API Security Top 10 for API abuse, and OWASP Web Security Testing Guide for verification. These are engineering and assessment baselines, not certifications or proof of compliance.

### Decision summary

1. **Security is a release requirement, not a late-stage polish task.** Every feature/module must identify assets, trust boundaries, abuse cases, controls, tests, logging, alerts, runbooks and recovery implications.
2. **Client devices and requests are untrusted.** All pricing, permissions, tenant scope, booking state, payment state, seat/capacity and refund decisions are enforced server-side and persisted transactionally.
3. **Use layered detection.** Collect relevant security events from edge protection, application/API, Keycloak/identity, hosts, database, CI/CD, backups and payment/communications adapters into a separately protected log/alerting system.
4. **Automate narrowly.** Rate-limit abusive traffic, expire sessions, stop an unsafe release and halt ticket issuance when core payment/inventory invariants cannot be confirmed. High-impact financial, identity-wide, tenant-wide or destructive actions require an explicit policy, bounded scope, audit evidence and usually human approval.
5. **Keep security operations independent of the system being protected.** Alerts must reach an external/on-call channel; an attacker who compromises the app must not be able to silently erase the only evidence or disable every alert.
6. **No production GO based on AI review alone.** Require evidence from CI, negative tests, controlled exercises, an independent external security assessment and remediation/retest of serious findings.

## 2. What “self-defence” does and does not mean

| Capability | Expected automation | Human/security responsibility |
|---|---|---|
| Known bad request patterns | WAF rules, request validation, quotas and rate limits block or throttle safely | Tune rules, investigate false positives and monitor rule drift |
| Repeated login abuse | Rate-limit; step-up authentication; temporarily suspend the affected attempt path; alert | Investigate takeover risk and approve recovery of locked privileged accounts |
| Stolen staff session | Revoke session/token; require fresh MFA; alert on privileged session anomalies | Verify identity, scope impact, reset credentials and examine actions performed |
| API permission violations | Deny by default; log; flag correlated cross-tenant or privilege probing | Determine whether the event represents a defect, an attack or a legitimate misconfiguration |
| Payment ambiguity or inventory inconsistency | Stop ticket issuance and/or new charge attempts for the affected transaction; reconcile against authoritative provider and database state | Finance/operations resolve exceptions; no automatic false claim that money is paid or refunded |
| Compromised server/workload | Quarantine a specifically identified workload under a rehearsed policy while preserving forensic evidence | Determine scope, rotate secrets, rebuild from trusted artifacts and decide whether broader isolation is needed |
| Possible data exfiltration | Alert, rate-limit or pause the specific export path when confidence is sufficient | Privacy/legal lead determines notification obligations and customer/regulator communications |
| Ransomware or destructive admin action | Immutable backup alerts, isolate affected credentials/workloads when safe, protect backup plane | Incident commander validates clean recovery and service restoration |
| An AI agent says “secure” | No automatic trust | Human reviewer checks actual tests, artifacts, configuration and evidence; CI and release controls are authoritative |

Self-defence actions must be reversible where possible, limited to the smallest safe scope, time-bounded, logged, tested for false positives, and protected against attackers triggering denial-of-service through false reports. Do not let the platform autonomously delete evidence, erase backups, make irreversible financial changes or modify its own security policy.

## 3. Security boundaries and architecture

### 3.1 Recommended logical traffic and monitoring pattern

```text
Customers / agents / operators / staff
              |
      Protected DNS + CDN + DDoS mitigation
              |
        Web Application Firewall
              |
     Rate-limited API ingress / gateway
              |
   +----------+------------------+
   |          |                  |
Public web  Core API       Staff/partner portals
   |          |                  |
   +----------+---------+--------+
                       |
         Private application network
           |        |          |
       Workers   Keycloak   Provider adapters
           |        |          |
           +---- Private data tier ----+
                     PostgreSQL

Security events: edge + web/API + identity + hosts + database + CI/CD
                 + backups + PSP/adapters
                              |
                 Separate protected log/alerting plane
                              |
                 On-call channel + incident runbooks

Backups: separate identity/credentials, separate failure boundary,
         immutable/offline copy where feasible, monitored restore tests.
```

This is a logical design, not a final hosting-provider selection. NIDC and Wingu remain shortlisted, not selected. Hosting, log storage, backups, cross-border transfers, incident response location and subprocessors must be assessed against actual contracts, technical capability and applicable law.

### 3.2 Trust boundaries that need explicit tests

- Public browser/mobile client versus server-side business rules.
- Passenger versus passenger; one customer versus another customer's booking.
- OIMS operator tenant, branch, counter, marshal and staff versus other tenants.
- HIMS headquarters departments and privileged functions.
- Operator support and Travelar internal staff versus supplier-owned systems.
- Core API versus background jobs, queues and provider adapters.
- App runtime versus PostgreSQL, Keycloak, server management plane and backups.
- Production versus staging/development and the AI-enabled engineering workstation.
- OuterBlocks-controlled systems versus GDS, rail/ferry/experience suppliers, PSPs, SMS/email providers and regulators.
- Online services versus offline/low-connectivity devices and any cached passenger manifest.

A request must not obtain authority merely because it includes a tenant ID, booking ID, user ID, role, fare, payment state or country code. The system derives identity and scope from validated server-side context and checks access to the specific object and action on every request.

## 4. Protect each layer

### 4.1 Web frontend and browser

- Never ship database credentials, PSP signing secrets, GDS credentials, privileged API keys or server-only feature flags in browser bundles, public source maps, HTML or URLs.
- Apply a restrictive Content Security Policy (CSP), secure transport, safe output encoding and appropriate clickjacking, MIME-type and referrer protections. Review third-party JavaScript and avoid unneeded scripts on checkout/admin pages.
- Set secure, HttpOnly and SameSite cookie attributes for cookie-based sessions; use CSRF protection where required by the authentication pattern. Keep access tokens out of persistent browser storage where practical; design the chosen auth flow around the actual threat model.
- Treat all client validation as user experience, not security. Server-side validation is mandatory for every submitted field and business rule.
- Do not expose passenger IDs, session tokens or sensitive manifest data in URLs, analytics events, client error reports or local storage without a documented requirement and protection.
- Configure CORS as a narrow allowlist; CORS is not authentication and does not replace authorization.
- Add browser security tests for stored/reflected/DOM XSS, unsafe redirects, CSRF, session handling, CSP violations and sensitive responses cached by browsers/proxies.

### 4.2 Backend APIs and business workflows

- Validate request schemas, types, sizes, pagination, content types, enums and state transitions at the server boundary; reject unexpected properties where appropriate.
- Enforce tenant- and object-level authorization on every endpoint, including nested resources and exports. Default to deny. Apply function/role checks separately from object ownership checks.
- Use parameterized database access; encode untrusted output; avoid unsafe dynamic queries and shell execution. Restrict outbound requests and network egress to reduce SSRF and provider-adapter compromise risk.
- Apply per-user, per-IP/device and per-business-flow quotas. Use separate limits for expensive search, authentication, booking holds, OTP sending, exports and admin operations.
- Make state transitions explicit and idempotent. Tickets are not issued until authoritative payment verification and booking/inventory reconciliation both succeed. Unknown PSP status remains unknown until resolved; retries must not double charge.
- Recalculate fare, fees, discount, tax, currency eligibility, booking channel, commission and totals on the server. Never accept the client's displayed price or a success-page redirect as authoritative.
- Protect privileged work with MFA, scoped permissions, maker-checker approvals, expiring sessions and recorded justifications. Require stronger verification for payouts, refund exceptions, privilege changes, bulk exports, production provider changes and manual ticket issuance.
- Make error responses useful but non-revealing. Keep detailed traces in restricted internal logs, with secrets and personal data redacted.

### 4.3 Identity and accounts

- Keep Keycloak and its database separated from the Travelar application database, with separately scoped credentials and backup/restore plans.
- Enforce MFA for all staff, HIMS administrators, finance, security, operator supervisors and access to production. Phishing-resistant MFA should be preferred for the most privileged accounts when supportable.
- Use unique named human accounts; prohibit shared administrator accounts. Use unique, narrowly scoped service identities per environment and integration.
- Protect account recovery, refresh tokens, session revocation, API key creation, role assignment and MFA reset as high-risk events.
- Review privileged access on a schedule and at every role change/offboarding. Emergency access must be time-bound and reviewed after use.
- Alert for new admin accounts, privilege escalation, MFA disable/reset, password recovery followed by sensitive changes, unusual new-device sessions and repeated failed sign-ins.

### 4.4 Servers, networks and runtime

- Expose only required internet-facing services. Keep PostgreSQL, worker control endpoints, Keycloak administration, internal metrics and management ports off the public internet unless a reviewed access path explicitly requires them.
- Use a supported, minimal operating-system/runtime image; remove default accounts and unused packages; harden SSH or use a controlled management gateway; require MFA and named accounts for administrative access.
- Apply security updates based on severity and exposure, with emergency patch paths and tested rollback. Inventory operating systems, runtime versions, packages, containers, certificates and externally reachable services.
- Use host/runtime protection appropriate to the selected environment: EDR or equivalent host detection where supported, process/file-integrity monitoring, system audit logs and alerting for unexpected privilege changes, persistence, new listening ports, unusual outbound traffic and unauthorized configuration changes.
- Enforce network segmentation and outbound egress restrictions. A compromise in a provider adapter or public API should not grant unrestricted access to the database, identity administration, backup service or the rest of the network.
- Use TLS for external and internal connections where supported and justified; automate certificate expiry checks and prevent invalid certificate acceptance.
- Keep staging isolated and synthetic-data-only. Production secrets/data must not be copied into IDE agents, demo environments, browser recordings or unapproved debugging tools.

### 4.5 Database and sensitive data

- Make PostgreSQL private-network-only. Use separate runtime, migration, reporting, backup and operational accounts; the application runtime should not have superuser or schema-owner privileges.
- Use least privilege and transaction/constraint-level invariants. Test authorization and data access controls rather than trusting the UI to hide other tenants' data.
- Encrypt data at rest and in transit where supported; manage keys independently with access logs and rotation procedures.
- Classify passenger contact details, government IDs, manifests, location and travel history, staff records, supplier credentials, payment data and financial ledgers. Collect only what the chosen service/regulation needs, limit retention, and restrict exports.
- Do not log raw identity documents, passwords, access/refresh tokens, full payment card data, CVV, signing secrets or full database connection strings. Redact, mask, hash or tokenize sensitive values as appropriate.
- Monitor new database users/roles, grants, schema changes, unusually large reads/exports, disabled audit settings, denied access spikes, backup deletion and restoration failures.
- Treat logs and audit trails as sensitive. Limit access, protect integrity, synchronize clocks, monitor if logging stops, and send a copy promptly to a separate security boundary. Logs must not be publicly accessible.

### 4.6 Payment, ticketing and provider adapters

- Prefer PSP-hosted payment pages/fields and provider tokens to reduce Travelar's card-data exposure; confirm actual PCI DSS scope with the acquirer/PSP and, where needed, a qualified assessor. PCI DSS applies to entities that store, process, transmit cardholder data or can impact the cardholder-data environment. Never store CVV/CVC after authorization.
- Verify webhooks with the documented provider signature/authentication mechanism; authenticate the source, store the event durably, enforce deduplication/idempotency, query transaction status server-to-server when supported, and reconcile booking/payment/ledger state.
- Alert on invalid signatures, replayed or out-of-order events, unexplained value/currency mismatch, stale pending payments, success without corresponding booking state, repeated payment failures and charge/refund anomalies.
- Rate-limit and schema-validate supplier responses; use timeouts, bounded retries with jitter, circuit breakers and per-provider credentials/quotas. Never let a provider response authorize an unreviewed arbitrary outbound URL or internal network request.
- Failover must not silently create a second charge or issue a second ticket. Preserve normalized and provider-native status for investigation.

### 4.7 Build pipeline and AI agents

Every change must pass relevant gates before merge/deploy:

- Static code analysis and security-focused linting.
- Dependency/package vulnerability scanning, lockfile review, software bill of materials (SBOM) or equivalent component inventory, and investigation of high-risk transitive dependencies.
- Secret detection for commits, build logs and artifacts; secret exposure triggers revocation/rotation, not merely deletion from the latest commit.
- Container/base-image and infrastructure-as-code scans where used.
- Authorization regression tests, abuse-case tests, schema/input tests and negative tests for cross-tenant data access.
- Dynamic application/API testing against an isolated staging environment; never run uncontrolled exploit tests against production or third-party suppliers.
- Build artifact provenance and deployment permissions restricted to reviewed branches/environments.
- Protected branches, required human review, separate deploy identity, change audit and rollback strategy.

Cursor, Antigravity or other AI agents may plan, implement, run permitted tests, inspect evidence and propose fixes. They are not the security boundary. Do not give them production credentials, production customer data, unrestricted host/root access or permission to change CI policy without review. AI-generated tests do not prove security unless they execute successfully and their assertions are reviewed. Agent reports must identify files changed, commands actually executed, results, skipped tests, risks and unresolved findings.

## 5. How Travelar knows an attack is happening

### 5.1 Security telemetry sources

Centralize, normalize and correlate logs from:

1. DNS/CDN/WAF/DDoS service and API ingress.
2. Frontend error/security-report channels (with sensitive data removed) and backend API/application.
3. Keycloak authentication, admin events, session and token failures.
4. Operating systems, runtime/containers, privileged access and host protection.
5. PostgreSQL authentication, grants/schema changes, security-relevant queries and backup systems where available.
6. CI/CD, source control, dependency/secret scanners, artifact registries and deployment approvals.
7. PSP/provider webhooks, payment status inquiries, refunds, chargebacks, inventory and ledger reconciliation.
8. Backup schedules, immutability/retention changes and restore tests.
9. OIMS/HIMS administration, operator onboarding, fares/rules, bulk export, agent activity and audit approvals.

Use structured logs with a consistent timestamp, environment, service, severity, event type, interaction/correlation ID and pseudonymous subject/tenant reference where useful. Synchronize clocks. Keep raw evidence needed for investigation, but redact unnecessary identifiers and secrets. Do not place sensitive passenger fields or credentials in the security log stream.

A central SIEM or equivalent log analysis/alerting platform is recommended, but the architecture must stay proportional to operating capacity. A small launch team can start with a well-managed central logging/alerting service and a documented on-call process; it cannot start with logs that nobody checks. Do not buy a high-cost SIEM without confirming who monitors alerts, how noisy rules are tuned and whether alerts reach responders.

### 5.2 Initial alert catalogue

| Signal | Potential meaning | Initial response |
|---|---|---|
| Repeated failed logins across many accounts or IPs; MFA fatigue patterns | Password spraying, credential stuffing or account takeover | Throttle/challenge attempts, protect privileged accounts, notify on-call and check successful sign-ins in the same window |
| Successful privileged login from an unexpected context, followed by role or security-setting changes | Stolen or misused privileged account | Revoke session where justified, alert immediately, preserve audit trail, review affected actions |
| Repeated forbidden requests or attempts to access different tenants' booking/manifest identifiers | Object-level authorization probing or a hidden authorization defect | Deny requests; correlate identifiers and source; escalate if repeat/confirmed cross-tenant pattern; run regression test if defect suspected |
| Large passenger/manifest exports, rapid sequential booking lookups or unusual object access volume | Data scraping/exfiltration or legitimate bulk operation | Apply quotas or pause that export path based on confidence; preserve query/export audit trail; involve privacy/security lead |
| Booking holds created much faster than completed/cancelled; unusual seat/segment contention or ferry capacity exhaustion | Inventory hoarding, bot abuse or a concurrency defect | Throttle affected flow, inspect inventory invariants and run transaction diagnostics; do not silently alter committed bookings |
| Invalid payment signatures, duplicate/replay patterns, mismatched currency/amount or paid provider transaction with non-paid internal booking | Forged/replayed webhook, integration bug, processing delay or fraud | Quarantine the event from authoritative state transition; query provider status; alert Payments/Finance and reconcile idempotently |
| Refund spikes, payout destination changes, manual tickets, commission/fare configuration changes or unusual ledger adjustments | Insider misuse or account compromise | Require/verify approvals; hold the affected high-risk action if policy permits; notify independent Finance/Security approver |
| New server admin account, SSH/root login, privilege escalation, disabled security agent, changed firewall, unexpected process/listener or outbound connection | Host compromise or unsafe operations change | Alert urgently; stop risky rollout or isolate confirmed affected workload under a rehearsed playbook; preserve evidence |
| Database role/grant/schema change outside approved deployment; unusual bulk query/export; audit/logging disabled | Privilege abuse or data exfiltration | Alert immediately; restrict affected identity if confirmed; compare with approved change records; preserve audit logs |
| Vulnerable critical dependency exposed in production, leaked secret, unapproved deployment or failed artifact signature/provenance check | Supply-chain or release risk | Block release; if already deployed, assess exploitability, remove/patch exposure and rotate compromised credentials |
| Backup job missing, retention shortened, immutability disabled or restore test fails | Recovery capability degraded or attacker targeting backups | Alert outside the primary platform; treat critical backup-policy changes as privileged security events and remediate before release |
| Log pipeline stops, event volume suddenly drops, clocks diverge or log access/retention is changed | Blind spot or attempted evidence destruction | Raise a monitoring-health alert; restore collection and investigate the gap rather than assuming “no alerts” means safe |

An alert is evidence of a signal—not proof that a crime occurred. Rules must be tuned to business peaks, counter operations, NAT/shared IPs, legitimate staff travel and known supplier activity. Use event correlation, severity and confidence to reduce alert fatigue.

### 5.3 Alert delivery and ownership

- Define a named primary and backup responder for each severity. For launch, one trained on-call owner can coordinate escalation, but the company must ensure meaningful coverage for the actual operating hours and risk.
- Deliver urgent alerts through an independent route such as a separate security console plus an approved external notification channel. Avoid a single notification route that depends entirely on the possibly compromised app, identity tenant or email domain.
- Provide alert context: event, timestamp, environment, affected service/tenant, reason for confidence, correlated signals, safe first actions and runbook link. Do not include secrets or full passenger IDs in alert text.
- Test the path from event creation to receipt and acknowledgement. Record alert detection time, acknowledgement time, containment time and recovery time.
- Monitor the monitor: heartbeat alerts for missing logs, failed event ingestion, disabled rules, exhausted retention, broken alert delivery and unmonitored critical services.

## 6. Automatic containment policy

### Level A — routine and reversible automation

May be automatic after testing: reject malformed/unauthorized requests; rate-limit abusive endpoints; slow down credential attacks; expire/revoke a suspected single session under a defined rule; stop a release on failed mandatory security gates; open a circuit breaker for a failing provider; pause ticket issuance for a transaction with unresolved payment/inventory state; notify responders when backup or logging health degrades.

### Level B — targeted containment with high-confidence evidence

May be automated only after a documented rule, staged exercise, false-positive review and rollback path: revoke a specific compromised identity's sessions; disable a single compromised API key; quarantine an identified workload; pause a suspicious bulk export; temporarily freeze a particular payout/refund workflow pending independent review. Preserve evidence before isolating or rebuilding systems where feasible.

### Level C — human-approved or incident-commander controlled

Require explicit approval except where an established emergency playbook defines a narrowly bounded pre-authorized action: global staff lockout; tenant-wide suspension; broad IP/country blocking; global PSP/payment shutdown; mass refunds or cancellations; deletion/wiping/rebuilding of production hosts before evidence capture; destructive database actions; disabling backups or logging; changing trust policy or security rules; public breach notification. Record the authorizer, reason, scope, start/expiry, result and reversal.

**Never use AI confidence alone as authorization for an irreversible containment action.** AI may summarize events, cluster alerts or propose a runbook step, but deterministic policies and designated humans remain responsible for critical decisions.

## 7. Incident response and recovery

Use a written incident plan built around the current NIST SP 800-61 Rev. 3 guidance and the existing Travelar observability/incident/DR plan in Document 26.

1. **Prepare:** current asset/owner inventory, severity matrix, contact tree, escalation route, access recovery plan, external legal/privacy counsel, supplier/PSP/hosting contacts, pre-approved containment actions and tested backup restore instructions.
2. **Validate and triage:** confirm event source and evidence, determine affected environment/tenants, identify whether customer data, staff credentials, bookings, payments or availability may be involved. Assign an incident commander.
3. **Contain:** stop continued harm using the narrowest reliable action. Do not automatically delete evidence or make financial state appear resolved. Capture timestamps and important log snapshots.
4. **Eradicate:** close the exploited gap, patch/rebuild from trusted artifacts, rotate/revoke exposed credentials and keys, review persistence, and invalidate affected sessions/tokens.
5. **Recover:** restore only from verified clean systems/backups; reconcile bookings, inventory, provider payments, ticket issuance, refunds and ledgers; verify monitoring and key controls before reopening the affected path.
6. **Communicate:** use the incident plan and legal/privacy advice to determine regulator, customer, supplier, payment provider and law-enforcement communications and timing. Do not guess statutory deadlines.
7. **Learn:** complete a blameless review with timeline, root cause, extent, evidence, financial/privacy impact, missed signals, containment quality, corrective owners and retest date. Update threat model and runbooks.

Prepare tested playbooks for: compromised staff/admin account; passenger-data exposure; payment/webhook compromise; ransomware/server intrusion; database or backup failure; supplier credentials leak; provider outage causing inconsistent bookings; DDoS; malicious or vulnerable dependency; lost marshal/agent device; and suspected insider misuse.

### Recovery requirements

- Maintain encrypted backups with separate identities/credentials, access logging and delete protection; use immutable/offline copies where technically and commercially feasible.
- Define service-specific Recovery Time Objective (RTO) and Recovery Point Objective (RPO) based on business impact and hosting evidence; do not invent targets without ownership and cost acceptance.
- Test restoration of PostgreSQL, Keycloak, configuration, object/document storage and deployment infrastructure, including credentials/key recovery and rebuilding a clean environment.
- Reconcile all business truth after recovery: bus segment inventory, ferry capacity, bookings and ticket states, payments/refunds/chargebacks, supplier confirmations, double-entry financial records, notification intents and audit trails.
- A backup job’s green status does not prove recovery. Store the restore test result, data-integrity checks, duration, gaps and next action.

## 8. Continuous verification before and after launch

### Per pull request / change

- Threat/abuse case reviewed for high-risk business logic.
- Tests for authentication, authorization and cross-tenant access as applicable.
- SAST, dependency/secret checks and relevant infrastructure/image checks pass or have a documented exception with owner/expiry.
- Tests prove logs and alerts for critical security outcomes without leaking secrets/PII.
- Changes to payments, inventory, identity, export or role permissions include abuse tests, idempotency/transaction tests and audit-event verification.
- Deployment is reversible; rollback avoids schema/data loss or explicitly proves forward recovery.

### Scheduled operational tests

- Review exposed services and patch status; scan dependencies/images and external attack surface.
- Review privileged users, production credentials, API keys, provider quotas, firewall/network rules and unexpected config drift.
- Run restore drills and verify the alert delivery path.
- Test incident playbooks with synthetic accounts and staging data; perform controlled failover and load-abuse exercises.
- Recheck security controls after material architecture changes, new provider integrations, new country/mode activation, or major identity/payment changes.

### Independent external validation

Before general production launch, hire an independent qualified application/infrastructure security firm for scope-based assessment: authenticated web/API testing, authorization/tenant isolation, business-logic abuse, identity/configuration, cloud/host/network exposure, database access, CI/CD and exposed service review, and retest of material findings. Include safe staging access and rules of engagement. Production testing should be separately authorized and tightly bounded. Confirm whether payment processing triggers any PCI DSS validation and whether a PCI-qualified assessor is needed.

Do not claim “penetration tested” without a defined scope, dates, report, findings, remediation evidence and retest status. Do not claim “secure” or “compliant” solely because automated scanners show zero findings.

## 9. Launch gate: security NO-GO conditions

Production launch is NO-GO while any of these remain true:

- No named person/team owns security alerts and incident coordination.
- Security logs from critical layers are missing, can be edited/deleted by the same untrusted admin plane without detection, or are not actively monitored.
- The team has not tested alert delivery, containment, credential rotation and clean restore.
- Public admin/database/management ports are exposed without an approved and protected access path.
- Staff/admin accounts lack required MFA or use shared privileged identities.
- Critical authorization, tenant-isolation, payment-state or inventory-invariant tests fail or are absent.
- Production secrets are exposed in frontend bundles, source control, logs, AI-agent context or non-production environments.
- A critical/high-risk exploitable issue remains unremediated without a formally accepted, bounded exception and compensating control; externally reportable legal risk cannot be waived by engineering alone.
- Payment success/ticket issuance, refund and ledger reconciliation can be triggered by untrusted client input or an unverified provider callback.
- Backups cannot be restored, or required provider/hosting/operator contacts and incident-response responsibilities are unknown.
- Independent security assessment and any required retesting have not been completed before the agreed production risk threshold.
- Applicable PDPC registration, DPO, personal-data handling, cross-border transfer and incident-notification questions are unresolved with the responsible privacy/legal adviser. PDPC's published registration page states registration is required before collection/processing; verify the actual company status and current requirements directly.

## 10. Operating measures and evidence

Track at minimum:

- Percentage of production assets/services sending expected security logs; last successful event time; gaps detected.
- Critical alert delivery and acknowledgement test success.
- Mean time to detect (MTTD), acknowledge, contain and recover, separated by severity.
- Number/age of critical/high vulnerabilities and time to remediation; exceptions with owner/expiry.
- MFA coverage for staff/privileged identities; stale privileged accounts and overdue access reviews.
- Cross-tenant authorization regression-test coverage and failures.
- Payment reconciliation exceptions, duplicate provider events, unexplained booking/payment mismatches and manual override counts.
- Backup job success, immutable-copy coverage where supported, last successful restore drill, tested RPO/RTO evidence.
- Security incidents, near misses, false positives, containment reversals and completed post-incident actions.
- Independent assessment findings and retest closure.

Metrics must have defined denominators, owners and review cadence. “Zero incidents reported” is not evidence of safety if logging, alerting or reporting is incomplete.

## 11. Tanzania and payment compliance gates

- Confirm OuterBlocks Limited's current Personal Data Protection Commission (PDPC) registration, Data Protection Officer designation, policy/process requirements and any applicable reporting duties before processing live passenger/staff personal data. The PDPC published registration guidance states that a person must not collect/process personal data without controller/processor registration. Obtain current regulator/legal advice on the application to OuterBlocks and each role it performs.
- Map data flows to hosting, logs, backups, email/SMS, analytics, identity, payment and supplier systems. The PDPC has a personal-data transfer permit process; determine permit/other legal requirements for each applicable transfer before enabling it. Do not misstate this as a blanket localization rule for all data.
- Review the Personal Data Protection Act 2022 and its current subsidiary instruments, the Cybercrimes Act as revised/currently in force, and applicable contractual/regulatory duties with Tanzanian counsel. This report is not legal advice.
- Minimize card exposure with PSP-hosted checkout/tokenization where available; document the actual PCI DSS responsibility matrix with PSP/acquirer, and obtain qualified validation where required.
- Maintain a privacy incident process that supports evidence preservation, impact assessment and regulator/customer notifications as required. Alerting alone does not decide whether notification is legally required.

## 12. Evidence and acceptance

Minimum proof for security readiness must include:

1. Approved threat model and trust-boundary/data-flow diagrams.
2. Written controls and owner mapping for critical assets.
3. CI results, dependency/secret scans, authorization/abuse tests and their commit/build identifiers.
4. A test record showing security events are emitted, forwarded, retained and trigger a received alert.
5. Demonstrated response playbooks for stolen privileged credentials, suspicious payment state, application compromise and unavailable provider/host.
6. A successful restore/recovery exercise plus application-level booking/payment/inventory reconciliation evidence.
7. Independent assessment report and documented remediation/retest results.
8. Confirmed incident contacts, contract escalation routes, applicable privacy/legal approvals and a sign-off by the authorized risk owner.

A screenshot of a security dashboard, AI-generated report, green scanner badge or a statement that “the firewall is on” is not sufficient by itself.

## 13. Primary sources checked (24 October 2026)

- NIST Cybersecurity Framework 2.0 — https://www.nist.gov/cyberframework (governance, identify, protect, detect, respond and recover model).
- NIST SP 800-61 Rev. 3 — https://csrc.nist.gov/pubs/sp/800/61/r3/final (current incident response guidance; final April 2025).
- OWASP Application Security Verification Standard — https://asvs.owasp.org/ (ASVS 5.0.0 stable release shown on official page).
- OWASP Top 10:2025 — https://owasp.org/www-project-top-ten/ (including broken access control, software supply-chain failures, and security logging/alerting failures).
- OWASP API Security Top 10 — https://owasp.org/www-project-api-security/ (API-specific risks including object/function-level authorization, resource consumption, SSRF and unsafe API consumption).
- OWASP Logging Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html (security event selection, sensitive-data exclusion, central monitoring and protection of logs).
- OWASP Web Security Testing Guide — https://owasp.org/www-project-web-security-testing-guide/ (web application and infrastructure testing methodology).
- Tanzania PDPC Registration — https://pdpc.go.tz/services/registration/ (registration guidance and current stated prerequisite to processing personal data).
- Tanzania Personal Data Protection Act — https://www.pdpc.go.tz/media/media/THE_PERSONAL_DATA_PROTECTION_ACT.pdf (Act 11 of 2022; legal interpretation requires counsel).
- Tanzania Cybercrimes Act — https://oagmis.oag.go.tz/portal/acts/89 (Office of Attorney General published act/revised materials).
- PCI Security Standards Council, PCI DSS — https://www.pcisecuritystandards.org/standards/pci-dss/ (applicability to entities storing, processing, transmitting or impacting security of payment account data).
- PCI SSC Document Library — https://www.pcisecuritystandards.org/document_library/?category=pcidss (PCI DSS 4.0.1 listed in official library).
- CISA Cross-Sector Cybersecurity Performance Goals — https://www.cisa.gov/cybersecurity-performance-goals (baseline security outcomes).

**Evidence limitation:** This is a source-backed proposed architecture, not a vendor evaluation, formal risk assessment, legal opinion, pentest, or evidence of implemented controls. Vendor/tool selection and actual effectiveness remain to be verified against Travelar's selected hosting, codebase, traffic, staff capability and contracts.
