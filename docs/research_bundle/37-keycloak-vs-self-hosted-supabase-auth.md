# 37 — Keycloak vs Self-Hosted Supabase Auth for Travelar

- **Research date:** 24 October 2026
- **Product:** Travelar
- **Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)
- **Status:** Keycloak-first recommendation; conditional on hosting, legal, operations and proof-of-concept gates
- **Decision scope:** Authentication/identity service only, not core Travelar backend or business authorization

## Executive recommendation

Use **self-hosted Keycloak** as Travelar's initial identity provider, deployed with a separately permissioned PostgreSQL 18.x database on whichever of NIDC or Wingu passes technical, contractual and data-protection due diligence. Do not build password/credential handling, MFA, session management or account recovery from scratch.

Self-hosted Supabase Auth remains a technically plausible alternative, especially for teams already using the broader Supabase stack. It is not ruled out solely because the bundled self-hosted stack currently defaults to PostgreSQL 17. However, Keycloak better fits Travelar's intended architecture: a custom NestJS backend, its own PostgreSQL 18 transactional database, multiple independent application surfaces (passenger, operator, agent, marshal and headquarters), and a need to keep identity infrastructure cleanly separated from the booking platform.

This is an architecture recommendation, not a claim that Keycloak is intrinsically more secure or that local hosting automatically proves compliance.

## Verified primary-source findings

### PostgreSQL version support

Keycloak's official Supported Configurations page lists PostgreSQL 18.x, 17.x, 16.x, 15.x and 14.x as tested/supported database versions: https://www.keycloak.org/server/supported-configurations

Supabase's official self-hosting upgrade guide says the bundled self-hosted Supabase deployment ships with PostgreSQL 17 by default: https://supabase.com/docs/guides/self-hosting/postgres-upgrade-17

The PostgreSQL project's official versioning policy lists PostgreSQL 17 support through 8 November 2029 and PostgreSQL 18 support through 14 November 2030, and recommends using the latest minor release for each supported major version: https://www.postgresql.org/support/versioning/

**Interpretation:** PostgreSQL 17 remains supported and is not inherently insecure. PostgreSQL 18 reduces version divergence from Travelar's selected core database and has a later support horizon. Neither version choice alone establishes overall security; patched minor releases, configuration and operations remain essential.

### Supabase Auth deployment model

Supabase documents Auth as an API service formerly known as GoTrue; it issues and refreshes JWTs and stores its Auth records in PostgreSQL. The documented overall Supabase architecture shares a PostgreSQL instance across Auth and other services: https://supabase.com/docs/guides/auth/architecture

Supabase also exposes a self-hosting reference for the Auth server as a standalone API: https://supabase.com/docs/reference/self-hosting-auth

The main self-hosting guide says a self-hosted Supabase deployment places infrastructure provisioning, service configuration, OS/security patching, PostgreSQL maintenance, high availability/scalability, backups/DR and monitoring on the operator. Some managed-platform capabilities (including managed backups and PITR, analytics and the Management API) are unavailable in the self-hosted platform: https://supabase.com/docs/guides/self-hosting

**Interpretation:** the full Supabase stack is not required merely to use the Auth API in principle. However, a standalone GoTrue/Auth deployment pointed at PostgreSQL 18 must be validated against the current release, migrations, extensions and configuration; the documentation reviewed does not establish a turnkey supported recipe for every custom combination. Do not state that PG18 is impossible, nor assume the combination is production-supported without test evidence.

### Keycloak as a standard identity provider

Keycloak documents itself as a compliant OpenID Connect Provider and exposes standard discovery, authorization, token, userinfo, logout and certificate/JWKS endpoints: https://www.keycloak.org/securing-apps/oidc-layers

This lets TanStack Start, mobile clients and NestJS services integrate through standards rather than use vendor-specific database access for authentication. Travelar still owns its authorization decisions.

### Tanzania data protection

Tanzania's PDPC describes controller/processor registration and a permit process for personal-data transfers outside the country. The authority considers destination protection, safeguards and transfer details: https://pdpc.go.tz/services/registration/ and https://pdpc.go.tz/services/cross-border-data-transfer-permit/

**Interpretation:** hosting identity services in Tanzania may reduce cross-border flows, but does not by itself guarantee legal compliance. Database replicas, off-site backups, monitoring, email/SMS, support access, identity federation, IP/security logs and recovery sites must also be mapped and assessed. Obtain specific legal advice and PDPC/regulator clarification where required.

## Comparative assessment

| Dimension | Self-hosted Keycloak | Self-hosted Supabase Auth / GoTrue | Travelar implication |
|---|---|---|---|
| Database compatibility | Explicit official support for PostgreSQL 18.x | Full bundled stack defaults to PostgreSQL 17; custom standalone combinations need validation | Keycloak aligns more directly with the selected PG18 baseline |
| Identity scope | Dedicated IAM/identity provider across multiple apps and clients; OIDC/SAML and identity-broker capabilities are documented | API-first user authentication with JWTs; works naturally with Supabase services and can be self-hosted | Keycloak aligns with distinct passenger, operator, partner and workforce applications |
| Core backend coupling | Cleanly separates identity from booking, payments and accounting services | Standalone Auth is possible, but its normal architecture shares PostgreSQL with the Supabase stack and app integrations often use Supabase conventions | Keycloak keeps Travelar's domain backend provider-neutral |
| Authorization | Keycloak can issue claims and manage authentication flows; Travelar must still enforce tenant and business permissions | Supabase Auth issues JWTs; RLS integration is a prominent part of the Supabase ecosystem | Neither removes the need for Travelar backend RBAC/ABAC and object-level checks |
| Self-hosting control | OuterBlocks operates Keycloak, database, TLS, backups, updates and HA | OuterBlocks operates GoTrue/Auth and the required database; full Supabase adds more services and operations | Self-hosted means control plus operational responsibility in either case |
| PostgreSQL major versions | Can use a dedicated PostgreSQL 18 database | Bundled supported default is PG17; PG18 custom configuration needs specific compatibility validation | Avoid version mismatch unless the Auth service has a clear product benefit |
| Ease of initial integration | More IAM concepts and operating responsibilities; standards-based integration | Potentially simpler for app-focused flows and Supabase SDKs | Supabase gets more attractive if Travelar adopts other Supabase APIs; current plan does not |
| Multi-app/workforce identity | Natural candidate for OIMS, HIMS, agents, operators and consumer clients | Feasible for many apps, but verify needed workforce SSO, realm/client administration and lifecycle features in POC | Keycloak is the better architectural fit, subject to tested configuration |
| Security conclusion | Can be secure if hardened, patched and operated correctly | Can be secure if hardened, patched and operated correctly | Do not pick on a generic claim that one product is always more secure |

## Recommended identity and database boundaries

1. Host Keycloak in the approved Tanzanian environment selected after NIDC/Wingu comparison.
2. Use PostgreSQL 18.x for Keycloak if supported by the exact Keycloak release pinned for production.
3. Give Keycloak its own database and non-superuser database role; never reuse Travelar's application credentials. A separate PostgreSQL instance may be warranted later for stronger failure/security isolation. A separate database on the same cluster is not the same as infrastructure isolation.
4. Travelar's core PostgreSQL 18 database remains the source of truth for its internal user ID, country/tenant/operator/branch membership, permissions, consent/retention metadata and audit records. Keycloak is the source of truth for authentication credentials and identity lifecycle.
5. Map external identities with `(issuer, subject)` to a stable Travelar internal user ID. Email and phone numbers are attributes, not durable primary identity keys.
6. Use OIDC Authorization Code + PKCE for browser/native public clients as applicable; use secure server-side sessions/BFF for browser applications where practical. Validate issuer, audience, signature, expiry and allowed algorithms in NestJS. Never treat an ID token as an API bearer token.
7. Keep application authorization in Travelar. Every protected action must validate tenant, organization, branch, resource ownership and action permissions on the server. Identity-provider roles alone must not authorize ticket refunds, manifest access, payouts or finance approvals.
8. Evaluate a realm split between passenger identities and workforce/partner identities. Do not over-fragment realms until lifecycle and access boundaries are demonstrated.
9. Put Keycloak verification/recovery email through a reviewed communications adapter or relay. Its callbacks, logs and outbound messages are part of the data-flow assessment.
10. Reassess provider choice if Keycloak cannot meet required recovery, supported-region, availability, accessibility, staffing or total-cost conditions.

## Proof-of-concept tests required before decision lock

- Run the chosen Keycloak release with a supported PostgreSQL 18 minor version on a non-production NIDC/Wingu environment.
- Demonstrate OIDC discovery, Authorization Code + PKCE, browser session protection, mobile/public-client flow if in scope, token signature/issuer/audience checks, logout and key rotation.
- Demonstrate passenger vs workforce sign-in policy and privileged MFA/passkey policy.
- Demonstrate invitations, staff/partner deactivation, recovery, email address changes, session revocation and compromised account containment.
- Show that Keycloak outage does not corrupt booking/payment state; define sign-in degradation and recovery behavior.
- Restore Keycloak database and configuration from backup and measure actual RPO/RTO.
- Verify that admin endpoints are restricted, secrets are not logged, TLS and proxy/hostname settings are hardened, brute-force protection is active, and patch/upgrade rollback is tested.
- Confirm that external logs, backup destinations, monitoring/support access and communications do not create unassessed data transfers.
- As a fair comparator, only run a Supabase Auth POC if the team has a written supported deployment plan for the chosen PostgreSQL major, clear update/backup ownership and a specific feature/economic advantage over Keycloak.

## Decision

**Recommended:** self-hosted Keycloak on NIDC or Wingu (provider not yet selected), with a dedicated PostgreSQL 18.x database, standards-based OIDC integration, and Travelar-owned authorization in NestJS/PostgreSQL.

**Not selected for the current baseline:** bundled self-hosted Supabase Auth/Platform. The PostgreSQL 17 default is a manageable technical difference, not a security failure; the stronger reasons for Keycloak are IAM fit, clean separation from the custom Travelar backend, and explicit PostgreSQL 18 support.

**Do not build authentication from scratch.** Revisit this recommendation only if the Keycloak proof of concept fails a required condition or Supabase Auth demonstrates a concrete, tested benefit within the desired architecture.

## References

- Keycloak supported configurations: https://www.keycloak.org/server/supported-configurations
- Keycloak OIDC endpoints: https://www.keycloak.org/securing-apps/oidc-layers
- Supabase self-hosting: https://supabase.com/docs/guides/self-hosting
- Supabase self-hosted PostgreSQL 17 default: https://supabase.com/docs/guides/self-hosting/postgres-upgrade-17
- Supabase Auth architecture: https://supabase.com/docs/guides/auth/architecture
- Supabase Auth standalone reference: https://supabase.com/docs/reference/self-hosting-auth
- PostgreSQL version support: https://www.postgresql.org/support/versioning/
- Tanzania PDPC registration: https://pdpc.go.tz/services/registration/
- Tanzania PDPC cross-border transfer permit: https://pdpc.go.tz/services/cross-border-data-transfer-permit/
