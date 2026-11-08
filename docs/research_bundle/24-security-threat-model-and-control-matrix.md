# 24 — Security Threat Model and Control Matrix

**Product:** Travelar | **Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required) | **Status:** Baseline threat register, to be validated in design review and penetration testing | **As of:** 24 October 2026

## 1. Security objectives

Protect passenger privacy, accurate inventory and ticket fulfilment, money movement and accounting, operator tenant separation, regulatory evidence, privileged administration and service availability. The security model assumes external suppliers, browsers, partner systems, provider webhooks and devices can fail or be compromised.

Use the current [OWASP Top 10:2025](https://owasp.org/projects/top-ten/) for web risk awareness, [OWASP API Security Top 10](https://owasp.org/www-project-api-security/) for API risks, and [OWASP ASVS 5.0](https://asvs.owasp.org/) as a testable security verification baseline. These are standards/guidance, not a substitute for threat modelling or applicable laws.

## 2. Trust boundaries and assets

**Assets:** passenger identity/contact and manifests; credentials/sessions; booking/ticket and seat/capacity claims; rates and promotions; payment/refund/settlement/ledger records; supplier API credentials; operator commercial contracts; audit and approval evidence; backups; device enrollment and cached marshal manifests.

**Trust boundaries:** unauthenticated public clients; authenticated passengers; operator/partner tenants; staff systems; privileged HIMS; worker/queue plane; external GDS/PSP/comms/regulatory APIs; mobile/offline devices; cloud/hardware administrators; backups and analytics/logging.

## 3. Threat/control matrix

| Threat / failure | Impact | Required controls | Detection / test evidence | Owner |
|---|---|---|---|---|
| Broken object-level authorization (booking/manifest from another tenant) | Privacy breach, fraud, regulatory exposure | Server-side policy checks on every object/action; tenant and organization scope; random non-authorizing public refs; deny by default; RLS where applicable as defense in depth | Cross-tenant negative tests for every endpoint; access anomaly alerts; penetration tests | Engineering + Security |
| Broken function/role authorization in HIMS/OIMS | Unauthorized refund, payout, configuration or data access | Permission matrix; scoped roles; MFA for privileged actions; maker-checker; no implicit role elevation; just-in-time access | Authorization tests, access reviews and approval audit reconciliation | Security + Finance/Operations |
| Credential stuffing/account takeover | Passenger/staff data and money risk | MFA for staff; adaptive/rate-limited login; breached-password controls where available; secure recovery; session rotation/revocation; device/session alerts | Auth anomaly metrics, brute-force tests and alert drills | Security |
| SQL/command injection, XSS, CSRF, SSRF | Data loss or execution/unauthorized internal access | Typed validation; parameterized queries; output encoding; CSP; CSRF protections where cookies used; outbound egress controls; URL allowlist for fetchers; no arbitrary metadata fetch | ASVS tests, SAST/DAST, SSRF and injection test suite | Engineering |
| Cross-tenant database leak / incorrect RLS | Large-scale data exposure | API authorization plus explicit DB grants/RLS if exposed; RLS test per table; service-role secrets server-only; narrow worker DB role; tenant-aware query tests | Automated RLS positive/negative tests; DB permission audit | Engineering + Security |
| Double booking or seat hoarding | Revenue loss, passenger displacement | DB constraint/transaction for every bus leg; explicit short holds; expiry worker and idempotency; ferry conditional capacity updates; rate limits/anti-hoarding policy | Concurrent load tests, invariant monitors, expired-hold queue | Inventory owner |
| Client-supplied price, commission, currency, role or payment state | Undercharge, fraud, data tampering | Recompute prices server-side; quote versions/expiry; trusted FX source/time; server derives channel attribution; never trust callback body without verification | Tampering tests; price variance alerts; reconcile offer and booking snapshots | Booking/Finance |
| Forged/replayed/delayed PSP webhook | False payment, duplicate charge/refund | Provider-specific signature/token validation; replay/event dedupe; raw event durable store; server-to-server transaction query; idempotent state transitions; unknown outcome reconciliation | Forged signature, replay, delay, duplicates, out-of-order tests | Payments |
| Double charge from cross-provider failover | Customer harm and reconciliation debt | Unknown payment state is not a failure state; query original provider; prevent new-provider charge until resolved or explicit customer-approved retry path | Simulate network timeout after provider acceptance; orphan transaction report | Payments/Finance |
| Refund/payout insider fraud | Direct financial loss | Separation of duties; limits; dual approval; payout eligibility/hold rules; transaction signing; callback verification; beneficiary change verification | Daily independent reconciliation and anomalous refund/payout alerts | Finance + Security |
| Provider API compromised/untrusted response | Wrong booking/price/status or SSRF | TLS, credential isolation, schema and semantic validation, response size/timeouts, allowlisted endpoints, strict outbound network policy, contracts/egress monitoring | Malformed and malicious response tests; provider credential rotation drill | Integration owner |
| Secrets leaked in client/logs/repo | Payment/supplier account compromise | Secret manager/env injection; secret scanning; short/scoped credentials; rotate/revoke; no secrets in browser/URLs/logs; break-glass audit | CI secret scanning; rotation/revocation drill; access review | Platform Security |
| CI/CD or dependency supply-chain compromise | Persistent access, data compromise | Protected branches, code review, signed/reproducible artifacts where feasible, dependency pinning/scanning, least-privilege CI identity, environment separation, SBOM | CI permission review, dependency alerts, release provenance checks | Engineering/Platform |
| Ransomware/cloud admin compromise/backups deleted | Service loss and data recovery failure | Separate backup credentials/account; immutable/offline copy where feasible; encrypted tested backups; restricted delete; restore drills; documented infrastructure rebuild | Scheduled restore tests and alert if backup job fails or retention drops | Platform/Operations |
| Marshal phone lost / offline manifest copied | Passenger data exposure or duplicate boarding | Device enrollment, local encryption, minimum manifest, TTL, PIN/biometric, remote revoke where possible, no ID image by default, offline signature/token design, signed event sync | Lost-device tabletop; stale-device rejection and sync-conflict tests | Operations + Mobile |
| Notification provider outage / message leakage | Missed ticket or PII exposure | Channel adapters, least-data template parameters, approved sender IDs, controlled failover, consent/opt-out, dedupe and delivery-status evidence | Simulated provider outage, wrong-recipient tests, duplicate message test | Customer Experience + Engineering |
| Excessive scraping / booking flow abuse | Inventory exhaustion, cost and provider sanctions | API quotas, rate limits by account/IP/device and business workflow, bot defense, supplier limits, inventory hold limit, anomaly scoring with review | Load/abuse tests; provider quota dashboards | Security + Inventory |
| DDoS, provider outage or cascading retries | Booking unavailable, cost spikes | CDN/WAF/DDoS service; bounded timeout/retry with jitter; circuit breakers; queue limits; graceful partial search; manual runbooks | Traffic-shift and dependency-failure exercises | SRE/Platform |
| PII exposed in logs, traces, analytics or support | Data leakage | Structured allowlist logging; redact/tokenize; sensitive-field denylist; retention/region controls; access reviews | Log scans with fake PII test vectors; access audits | Privacy + Engineering |
| Tampering with audit/journal history | Fraud investigation failure | Append-only application behavior; DB roles cannot delete posted rows; cryptographic signing/hash chaining as supplemental evidence; backups in separate security boundary | Attempted mutation tests; independent export reconciliation | Finance + Security |
| Unsafe automatic containment | Legitimate accounts/settlement blocked | Human review for high-impact payout freezes; thresholds, expiry, override approval and audit; no autonomous irreversible money action | False-positive simulations; reversal/appeal drill | Security + Finance |

## 4. Identity, authorization and privileged operations

- Authentication does not automatically grant authorization. Every request checks user status, role, tenant membership, country, branch, resource ownership and requested action.
- Use MFA for HIMS, finance, administrators and operator supervisors. Enforce stronger assurance for role changes, refunds, payout details, API keys, data exports and emergency access.
- Service accounts are separate from human users; one provider/worker credential must not be shared across unrelated adapters or environments.
- Use maker-checker for payout destination changes, exceptional refunds, manual ticket issuance, commission-rule updates, tax changes, high-risk configuration and production provider activation.
- Emergency/break-glass access expires, requires justification and is reviewed after the incident.
- Offboarding immediately disables sessions and provider access that are controlled by OuterBlocks; ensure operator tenant owners can revoke their own staff.

## 5. Data security

Encrypt data in transit and at rest using provider-appropriate controls. Classify fields and minimize collection. Avoid storing raw card data; use provider tokens/hosted checkout where allowed by actual contract. Encrypt or tokenize ID numbers where retained; never include complete IDs, OTPs, access tokens, manifest payloads or PSP request bodies in generic logs. Separate encryption/key-admin roles from application operators where feasible.

Backups, traces, support exports, test dumps and analytics datasets inherit the source data's sensitivity. Apply retention and deletion to derived copies. Never use live passenger records in local/dev/test environments without an explicitly approved anonymization process.

## 6. Application security delivery

Required controls in CI/CD: dependency and secret scanning; lint/static analysis; unit/integration tests; migration validation; authorization tests; provider-contract tests; IaC/image scan as appropriate; artifact provenance; protected release approvals. Use OWASP ASVS requirements to define security acceptance test IDs. Penetration testing should cover public web/API, HIMS/OIMS tenant boundaries, PSP callbacks, booking lookup, agent/cashier functions and offline marshal synchronization before production and after material changes.

## 7. Incident response

Use NIST SP 800-61 Rev. 3 (final April 2025), which aligns incident response with the NIST Cybersecurity Framework 2.0, as the current reference: https://csrc.nist.gov/pubs/sp/800/61/r3/final.

Incident runbooks must cover detection/triage, containment, evidence preservation, legal/privacy assessment, regulator/customer/provider notification as applicable, recovery, reconciliation, and post-incident review. Legal reporting deadlines must be stored as country/provider obligations after counsel confirmation rather than assumed generic timelines.

## 8. Residual-risk statement

A WAF, MFA, RLS, SIEM, cryptographic hash chain, signed webhooks or a reputable cloud vendor does not make Travelar “secure by default” by itself. Controls need ownership, tests, operational monitoring, access reviews and recovery exercises. Hash chaining is tamper-evident only if keys, checkpoints, logs and administration are separately protected; it does not by itself provide immutability or prevent deletion.

## 9. Sources

- OWASP Top 10 2025: https://owasp.org/projects/top-ten/
- OWASP API Security: https://owasp.org/www-project-api-security/
- OWASP ASVS 5.0: https://asvs.owasp.org/
- NIST SP 800-61r3 (2025): https://csrc.nist.gov/pubs/sp/800/61/r3/final
- Supabase RLS, when used: https://supabase.com/docs/guides/database/postgres/row-level-security
- HashiCorp Vault docs: https://developer.hashicorp.com/vault/docs


## Identity-provider and browser-session controls (added 24 October 2026)

- Do not build the entire authentication stack from scratch for launch. Prefer self-hosted Keycloak in a verified Tanzania environment after data-flow/legal, host contract, staffing and security gates; Auth0 remains a contingency subject to equivalent legal and operational review.
- Test OIDC state/nonce, Authorization Code + PKCE, exact redirect URIs, issuer/audience/signature/expiry/not-before validation, JWKS rotation, token confusion, callback replay, account-link abuse and logout/session revocation.
- Prefer BFF/server-side sessions for the browser; cookies must be `Secure`, `HttpOnly`, properly scoped and deliberately `SameSite`. Never put access/refresh/ID tokens in local/session storage. Apply CSRF protections to state-changing requests.
- Route-level protection is not the security boundary: every server function/API endpoint authorizes its own data access and mutation.
- Enforce privileged-worker separation, phishing-resistant MFA/passkeys where feasible, step-up for financial/role/payout changes, and recovery paths that do not weaken primary authentication.
- Identity profile, logs and risk signals are part of the data-flow inventory. A production IdP must pass the same country-location, subprocessors, retention, incident and cross-border review as any other vendor.

See `33-authentication-provider-and-identity-architecture.md`, `ADR-AUTH-001-keycloak-first-local-identity.md` and `ADR-STACK-001-tanstack-start-nestjs-fastify-postgres18.md`.

## Stage 16 security architecture link

Document `42-cybersecurity-self-defence-detection-and-response-architecture.md` expands this threat matrix into operating controls: layered frontend/API/host/database/build protections, centralized security telemetry, concrete alert conditions, bounded automatic containment, incident playbooks, operating measures and evidence-based pre-launch NO-GO conditions. `ADR-SEC-001-layered-cyber-defence-and-security-observability.md` records the architectural direction. These additions do not claim any control is implemented; each requires build/test/operational evidence.

## Stage 20 implementation review supplements

- Redis TTL locks are not the authoritative inventory correctness layer. PostgreSQL transactions/constraints must preserve segment-aware bus allocation and atomic ferry-class capacity even during Redis failover or timeout. Redis is optional coordination/cache subject to fault-injection tests.
- Use the actual documented verification protocol for each PSP webhook. Do not assume all providers use HMAC or stable IP ranges. Signature verification (where defined), replay/idempotency, durable event IDs, out-of-order status reconciliation and secret rotation are mandatory adapter requirements.
- PostgreSQL RLS is defense in depth, not a substitute for domain authorization: owner/superuser/BYPASSRLS roles can bypass it. Runtime roles and background jobs must be least-privileged and tenant-negative-tested.
- Hash-chaining ledger rows is not by itself proof of immutability against a privileged administrator. Preserve append-only double-entry journals and reversal entries; use independent protected signed checkpoints/logs if hash-tamper evidence is added.
- Cloudflare WAF/rate limiting is a vendor/plan candidate. The exact features vary by contract and plan; maintain edge plus application rate limits and assess device fingerprinting for privacy/necessity.

See Document `54` and Stage 20 source register. OWASP webhook guidance: https://cheatsheetseries.owasp.org/cheatsheets/Webhook_Security_Cheat_Sheet.html .
