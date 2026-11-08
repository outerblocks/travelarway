# 33 — Authentication Provider and Identity Architecture

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Decision status:** Self-hosted Keycloak is the preferred direction for Tanzania-first identity hosting, conditional on legal, hosting, security and operations gates; Auth0 remains a contingency  
**Research date:** 24 October 2026  
**Scope:** Consumer passengers, operator users, Travelar agents, call-centre staff, marshals, and headquarters administration

## 1. Executive recommendation

**Use Keycloak rather than building a complete authentication system from scratch. For the Tanzania-first launch, prefer a Keycloak deployment in a verified Tanzanian hosting environment**, subject to facility procurement, legal interpretation, support access, backups/DR and OuterBlocks staffing. The reason is direct control over the physical and operational location of identity data—not a claim that self-hosting is inherently safer than a properly operated managed service.

The legal research supports this direction as a practical way to reduce international transfers of identity records, but it does not establish a universal rule that all personal data must always be stored only in Tanzania. The Personal Data Protection Act, 2022, sections 31–32 and GN 449C of 2023, regulation 20, govern cross-border data flows and provide a transfer-permit process. PDPC's published guidance describes an application process. Every planned outbound flow—including email/SMS, monitoring, external federation, remote support, logs and backups—must be mapped and reviewed. See [Tanzania Act](https://oagmis.oag.go.tz/portal/acts/237), [GN 449C of 2023](https://oagmis.oag.go.tz/portal/legislation/1350), [PDPC registration](https://pdpc.go.tz/services/registration/) and [PDPC transfer permit](https://pdpc.go.tz/services/cross-border-data-transfer-permit/).

The official Keycloak Supported Configurations page now lists PostgreSQL 18.x. Keycloak 26.8.1 was released on 13 October 2026 and includes security fixes. Pin the supported production release after the proof of concept and re-check release/security notes before deployment: [supported configurations](https://www.keycloak.org/server/supported-configurations), [26.8.1 release notice](https://www.keycloak.org/2026/10/keycloak-2681-released).

Travelar must continue to own its internal users, issuer/subject identity mapping, authorization policies, organization/tenant memberships, data access rules, audit and business permissions. Keycloak authenticates; Travelar authorizes.

**Production gate:** do not activate Keycloak with real passenger or employee personal data until (a) counsel/PDPC review confirms the actual hosting and transfer plan, (b) the host confirms physical location, backups/DR, subprocessors, support access and incident terms, (c) the team has assigned identity operations ownership, and (d) the proof-of-concept security and recovery tests pass. Full details are in [35 — Keycloak and Local Identity Hosting Assessment](35-keycloak-and-local-identity-hosting-assessment.md).

## 2. Options compared

| Option | Security/operations profile | Data/location control | Cost profile | Decision |
|---|---|---|---|---|
| Build all authentication from scratch | OuterBlocks would own password/session security, recovery, MFA/passkeys, account enumeration, abuse protections, incident handling and constant maintenance. | Maximum implementation control, but no automatic legal compliance. | High ongoing engineering/security cost even without a vendor MAU fee. | **Reject for initial production release.** |
| Self-hosted Keycloak in a verified Tanzania environment | Mature OIDC/OAuth/SAML identity service with passkey/WebAuthn options; OuterBlocks owns patching, availability, backups, monitoring, abuse controls and incident response. | Strongest practical control among reviewed options over where identity data and logs are hosted, if all nodes, backups and support arrangements are local/approved. | Infrastructure and identity-operations costs; no hosted-IdP MAU dependency, but staffing and availability costs are real. | **Preferred direction**, conditional on legal, hosting, skills and POC gates. |
| Auth0 managed identity | Lower infrastructure burden and provider-managed identity operations; features/support vary by plan. | Public-cloud subregion cannot be manually chosen; private-cloud geography depends on available regions and contract. | Usage/MAU and plan/enterprise costs; written quote required. | **Contingency** if cross-border processing is confirmed lawful/approved and operational economics justify it. |
| TypeScript auth library/custom auth | Building blocks only; OuterBlocks owns credential lifecycle, secure configuration, abuse response and security operations. | High data-location control. | Higher internal maintenance burden. | Not the launch baseline; consider only with a compelling requirement and dedicated identity-security ownership. |

Auth0's current public pricing page includes an MAU-based model, features varying by plan, and enterprise/private-deployment options. Obtain written pricing; do not use a free-tier allowance as a long-term unit-economics assumption. [Auth0 pricing](https://auth0.com/pricing).

## 3. Authentication and authorization are separate

- **Authentication** answers who signed in and whether the authenticator was valid.
- **Authorization** decides what that identity can access or change, within which country, organization, operator, branch, booking, and workflow.
- **Travelar remains authoritative for business authorization.** Keycloak roles or token claims may carry coarse scopes, but they must not alone determine dynamic operator/branch ownership, financial approval limits, manifest visibility or maker-checker separation.

Travelar's PostgreSQL stores a stable internal `user_id`; an `external_identity` mapping links that user to `(issuer, subject)` from the selected IdP. Do not use an email address as the permanent identity key because email can change, be reused or be unverified. Account linking requires verified proof of control and an auditable process.

Suggested conceptual records (not a production schema):

- `users`: internal identity and status, minimal personal attributes.
- `external_identities`: issuer, subject, provider key, linked internal user and timestamps.
- `organizations`, `organization_memberships`, `operator_memberships`, `branch_memberships`.
- `roles`, `permissions`, scoped assignments and effective dates.
- `sessions` or application session references where server-side revocation is required.
- `auth_security_events`, `account_recovery_events`, `access_reviews` and privileged-action audit records.

Use immutable internal IDs. Store provider credentials/secrets in a dedicated secret manager, never in customer rows or source code. Do not synchronize all IdP profile claims into Travelar without purpose and retention justification.

## 4. Recommended login architecture

### 4.1 Public website using TanStack Start

Prefer a backend-for-frontend (BFF) session for browser traffic:

1. Redirect to the IdP using OIDC Authorization Code flow with PKCE, state and nonce.
2. Validate the callback and token response server-side; require exact registered redirect URIs and validate issuer, audience, signature, expiry and nonce where applicable.
3. Keep OAuth tokens server-side when practical; give the browser an opaque application session in a `Secure`, `HttpOnly`, appropriately `SameSite` cookie with narrow scope and deliberate lifetime.
4. Use CSRF protection for state-changing cookie-authenticated requests. SameSite is helpful but not a complete replacement for CSRF design.
5. Store only the internal user/session reference in application session state. Authorize each backend operation in NestJS independently.
6. Do not put access, ID or refresh tokens in `localStorage` or `sessionStorage`.

TanStack route guards protect navigation and UX but are not the security boundary. TanStack's documentation explicitly says every server function, route or API that reads or writes private data must independently authorize the request. [TanStack authentication overview](https://tanstack.com/start/latest/docs/framework/react/guide/authentication-overview).

### 4.2 Mobile and non-browser clients

Use OIDC Authorization Code + PKCE for public native clients. Store required native tokens in platform-protected storage; do not embed confidential client secrets in the app. The API must validate access tokens, not accept an ID token as a bearer token for API authorization. For USSD, the gateway establishes a limited session context but every booking/payment operation still goes through the normal backend authorization and state machines.

### 4.3 API token validation

The NestJS API must validate signature via trusted issuer keys/JWKS, `iss`, `aud`, `exp`, `nbf`, allowed algorithms and required scopes/claims. Reject unsigned tokens, algorithm confusion, wrong audience, expired tokens and tokens from unapproved issuers. Cache signing keys with bounded refresh behavior; do not skip validation because a token came from the web frontend.

### 4.4 Internal authorization

Use deny-by-default RBAC plus attribute/context checks for tenant, country, operator, branch, ownership, transaction value, environment, approval state and data sensitivity. Every endpoint loads the relevant internal subject and current permissions; sensitive writes re-check within the transaction where practical. Avoid long-lived authorization claims for permissions that must be revoked immediately.

## 5. Identity separation by risk

| User group | Initial control requirements |
|---|---|
| Passenger | Verified contact channels where needed, safe account recovery, rate limiting, anti-enumeration responses, step-up for sensitive account/booking changes and secure guest lookup. |
| Operator owners/managers | MFA/passkeys available; verified organization membership; invitation expiry; scoped permissions; sensitive exports logged. |
| Cashiers/agents/marshals | Individual accounts, no shared credentials, device/session controls appropriate to risk, restricted manifest access, action attribution and fast deactivation. |
| Travelar finance/HIMS/security administrators | Mandatory phishing-resistant MFA/passkeys where feasible, least privilege, separate privileged identities, short idle sessions, step-up for approvals/payouts/permission changes, dual approval and periodic access review. |
| Service-to-service identities | Client credentials or workload identity, narrow scopes/audience, secret/key rotation, no shared human credentials and full auditability. |

Do not put Travelar's privileged staff accounts in the same privilege environment as public customer accounts without an explicit risk assessment. Evaluate a separate workforce tenant/issuer or federation to the company's workforce identity provider. Production, staging and development identity configurations must be isolated. HIMS access must not imply automatic access to customer secrets, full passenger manifests or funds execution.

## 6. Security baseline

- Prefer WebAuthn/passkeys for staff and privileged workflows; provide carefully designed recovery, as a weak recovery channel can undo a strong primary factor.
- Enforce MFA according to risk and provider-plan capability; require step-up/re-authentication for money movement, role changes, payout destination changes, bulk exports, sensitive passenger-data exports and emergency access.
- Use rate limits and abuse signals by IP, account identifier, device/risk signals and operation; avoid IP-only throttling and avoid leaking whether an account exists.
- Use generic login/reset responses, bounded-lived one-time reset tokens, single use, revocation on credential reset and secure audit logging.
- Keep cookies `Secure`, `HttpOnly`, and suitable `SameSite`; rotate sessions after sign-in/privilege changes; revoke them on password reset, account disablement and suspected compromise.
- Protect against CSRF, XSS, credential stuffing, session fixation, phishing, account enumeration, OAuth redirect attacks, misissued JWTs, token replay and tenant crossing.
- Do not build or store Travelar-managed password credentials in the application database. Let Keycloak manage credential storage and hashing. OuterBlocks must still configure password policy, MFA/passkeys, account recovery and abuse controls correctly; follow current Keycloak security guidance and OWASP authentication guidance.
- Do not treat IdP logs as Travelar's complete audit trail. Export relevant events to the approved log store under retention and data-transfer rules; redact tokens and unnecessary personal data.
- Test recovery and outage behavior: IdP unavailable, invalid issuer/JWKS rotation, account disabled mid-session, lost phone/device, suspected compromise, provider outage, malicious redirect, stale permissions and replayed callback.

Security references: [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [Auth0 OIDC overview](https://auth0.com/intro-to-iam/what-is-openid-connect-oidc).

## 7. Keycloak proof-of-capability and local-hosting diligence checklist

Before selecting Keycloak for production, OuterBlocks must:

1. Obtain written location evidence from the hosting provider for Keycloak nodes, database, logs, backups, snapshots, telemetry, support and disaster-recovery copies.
2. Ask counsel/PDPC how the proposed data flows, foreign support access, SMTP/SMS relays, monitoring and backups fit Tanzania's Act and GN 449C transfer process.
3. Confirm provider contracts covering security controls, incident notification, support access, deletion/return, retention, subcontractors, audit evidence, backup recovery and maintenance windows.
4. Confirm that the team can maintain Keycloak/Java patching, database upgrades, TLS/certificate renewal, secrets/keys, backup restoration, brute-force protection, monitoring and incident response.
5. Test OIDC Authorization Code + PKCE, BFF sessions, API JWT validation, logout/revocation, key rotation, account linking, disabled-user behavior, lost-device recovery, privileged MFA, passkeys and tenant authorization.
6. Validate PostgreSQL 18 compatibility with the precise Keycloak release and driver; current supported-configuration documentation lists PostgreSQL 18.x, but re-check the exact pinned release.
7. Price and operate a viable production topology. Include identity-operations staffing and recovery capability, not only server cost.
8. Verify how Keycloak verification and reset email travels through the communication-adapter architecture. Built-in Keycloak SMTP does not automatically inherit Travelar's provider failover behavior; use a controlled relay or a reviewed extension and include its data flows in the privacy assessment.
9. Test a realm model for passengers, partners/operator workforce and OuterBlocks staff against a simpler two-realm alternative. Internal Travelar policy remains the authorization source of truth.
10. Document exit/migration options, internal identity mapping, account recovery and the response to a prolonged Keycloak outage.

Auth0 diligence remains necessary only if it is retained as an alternative: ask for exact locations/subprocessors, data processing terms, written pricing, security features by plan and the permitted deployment/region options. See [Auth0 region guidance](https://support.auth0.com/center/s/article/Tenant-Creation-in-a-Specific-Sub-region).

## 8. Keycloak versus Auth0 go/no-go rule

Proceed with **self-hosted Keycloak in a verified Tanzanian hosting environment** only if all of the following are true:

- counsel/PDPC review documents the applicable legal route for the exact identity, support, logging, backup and communications flows;
- hosting contracts identify physical data locations, foreign support access, backups/DR and incident obligations;
- OuterBlocks assigns a qualified identity operations owner and can meet documented patching, monitoring, restore and incident-response duties;
- the production network, database separation, TLS, administrative access restrictions, MFA/passkeys, abuse controls and audit configuration pass security review;
- PostgreSQL 18 compatibility, identity recovery, failover and restore tests pass in non-production;
- the operating cost and reliability profile fit the launch plan.

Choose **Auth0 instead** only if a written legal assessment and vendor/contract evidence establish that its exact processing arrangement is acceptable and the managed-service risk/cost is preferable. Do not infer that a region selector or vendor statement alone resolves Tanzania compliance.

If neither can be operated lawfully and safely, defer live account activation. Do not use rushed bespoke authentication as a workaround.

## 9. Open questions

- What exact location and transfer conditions apply to the identity database, replicas, backups, logs, monitoring, email/SMS verification and foreign support access under the actual Tanzania launch data map?
- What is the anticipated MAU trajectory for passengers, operators and staff separately, and what is the acceptable identity cost per active user?
- Does the launch need social login, passwordless email, password login, phone OTP, passkeys, or some combination? Do not collect phone OTP as a default if cost, SIM-swap or deliverability makes it weak.
- Should staff accounts be federated to another workforce IdP, or managed in a dedicated Keycloak realm? Assess the extra transfer/security dependency before enabling federation.
- What access-revocation latency is required for terminated employees, suspended operators, stolen devices and incident containment?
- Which named team owns Keycloak incidents, patching, database recovery, key rotation and out-of-hours support?

## 10. Source register

| Source | Claim supported | Access date |
|---|---|---|
| https://support.auth0.com/center/s/article/Tenant-Creation-in-a-Specific-Sub-region | Public-cloud sub-region selection limitations; private-cloud region options. | 24 Oct 2026 |
| https://auth0.com/pricing | Published Auth0 tiers, MAU/pricing structure and feature variability. | 24 Oct 2026 |
| https://tanstack.com/start/latest/docs/framework/react/guide/authentication-overview | TanStack auth patterns, server-side boundaries and cookie guidance. | 24 Oct 2026 |
| https://auth0.com/intro-to-iam/what-is-openid-connect-oidc | OIDC, Authorization Code + PKCE and token validation concepts. | 24 Oct 2026 |
| https://www.keycloak.org/securing-apps/overview | Keycloak OIDC/OAuth 2.0/SAML standards support. | 24 Oct 2026 |
| https://www.keycloak.org/docs/latest/server_admin/index.html | Keycloak WebAuthn/passkey capabilities. | 24 Oct 2026 |
| https://www.keycloak.org/server/supported-configurations | Current database/platform support including PostgreSQL 18.x. | 24 Oct 2026 |
| https://www.keycloak.org/2026/10/keycloak-2681-released | Keycloak 26.8.1 release notice and listed security fixes. | 24 Oct 2026 |
| https://www.keycloak.org/server/configuration-production | TLS, hostname, admin interface separation, proxy and HA hardening. | 24 Oct 2026 |
| https://oagmis.oag.go.tz/portal/acts/237 | Tanzania PDPA cross-border transfer provisions, among others. | 24 Oct 2026 |
| https://oagmis.oag.go.tz/portal/legislation/1350 | GN 449C of 2023, regulation 20 transfer permit procedure. | 24 Oct 2026 |
| https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html | Authentication, recovery, MFA and abuse-control practices. | 24 Oct 2026 |
| https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html | Session token, cookie and browser-storage practices. | 24 Oct 2026 |
| https://pdpc.go.tz/services/registration/ | Tanzania registration and cross-border transfer process requiring legal application. | 24 Oct 2026 |

---

**Status:** Keycloak-first direction recorded; a particular hosting provider/region and production readiness remain undecided pending the gates above. No implementation has been started by this document.
