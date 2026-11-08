# ADR-AUTH-001 — Prefer Self-Hosted Keycloak for Tanzania-First Identity, Do Not Build Auth From Scratch

- **Status:** Recommended direction; conditional on legal, hosting, operations and proof-of-concept gates
- **Date:** 24 October 2026
- **Decision owner:** OuterBlocks Limited
- **Scope:** Travelar passenger, partner/operator, agent, marshal, call-centre, finance and HIMS identities

## Context

Travelar needs authentication across several applications and trust levels, including account recovery, MFA/passkeys, session management and secure service/client integration. Tanzania's Personal Data Protection Act, 2022, sections 31–32, and GN 449C of 2023, regulation 20, establish obligations and a permit process for cross-border personal-data transfers. PDPC's current public guidance describes a transfer-permit process and controller/processor registration. These facts make the location of identity records, logs, backups, operational support and notification services important to the launch design.

The legal material reviewed does not prove a blanket rule that every record must always remain in Tanzania. It does establish that outbound processing/transfer must be assessed against the actual data flow and regulator requirements. A local Keycloak deployment can reduce transfers and improve control, but it does not by itself establish compliance.

Official references: [Tanzania PDPA](https://oagmis.oag.go.tz/portal/acts/237), [GN 449C of 2023](https://oagmis.oag.go.tz/portal/legislation/1350), [PDPC transfer permit](https://pdpc.go.tz/services/cross-border-data-transfer-permit/), [PDPC registration](https://pdpc.go.tz/services/registration/).

## Decision

1. **Do not implement password hashing, credential handling, MFA/passkeys, reset flows and session management from scratch for the first production release.**
2. Prefer self-hosted **Keycloak** for Tanzania-first identity, placed in a verified Tanzanian hosting environment if vendor/legal/operational due diligence passes.
3. Use OpenID Connect / OAuth 2.0 Authorization Code + PKCE for browser/native users as appropriate. Keep a stable Travelar `internal_user_id` and map external identity by `(issuer, subject)`; email is not a permanent identity key.
4. Keep business authorization in Travelar's NestJS backend and PostgreSQL: tenant, country, operator, branch, agent, manifest, finance, approval and HIMS permissions. Keycloak role claims must not replace live authorization checks.
5. Use a separate Keycloak database and database role from Travelar's core application data. PostgreSQL 18.x is supported by the current Keycloak Supported Configurations documentation; verify again against the release pinned for production.
6. Keep identity data, logs, backups, telemetry and privileged operations within the approved data-location arrangement. Any email/SMS, external federation, monitoring, support or DR transfer must be included in the data map and legal review.
7. Test a proposed passenger / partner / OuterBlocks-workforce realm separation against a simpler option before locking the realm design.
8. Retain Auth0 as a contingency if legal and vendor evidence support its exact processing arrangement and its operations/economics are preferable. Do not treat a private-cloud option as available in a desired geography until Auth0 confirms it in writing.
9. Select a supported and security-patched Keycloak release; as of the research date, the official downloads page lists 26.8.1. Re-check advisories before deployment. Official links: [release 26.8.1](https://www.keycloak.org/2026/10/keycloak-2681-released), [supported configurations](https://www.keycloak.org/server/supported-configurations).

## Consequences

### Benefits
- Stronger direct control over the identity system's physical deployment and operational data flows.
- Standards-based identity integration for TanStack Start, mobile apps, NestJS APIs and internal web applications.
- Avoids bespoke credential/security lifecycle code and reduces dependence on a single managed identity vendor.
- PostgreSQL 18 is a supported Keycloak database option according to current official documentation.

### Costs and risks
- OuterBlocks becomes responsible for Keycloak patches, configuration, availability, backups/DR, brute-force defense, admin security, audits and incident response.
- Local hosting capacity, connectivity redundancy, facilities, price, service-level terms and data-location evidence still have to be verified.
- Foreign support access, remote monitoring, external notifications and offsite DR may still create cross-border processing questions.
- Additional Java/Keycloak operations must be covered even though Travelar's application stack is TypeScript.

## Mandatory controls

- TLS everywhere, production hostname and reverse-proxy configuration, public OIDC endpoints only, and Keycloak Admin Console/Admin REST API restricted to approved networks.
- Secure admin access; separate super-admin/break-glass accounts; MFA/passkeys for workforce and step-up controls for sensitive finance/HIMS operations.
- Brute-force protection, rate limiting, password/credential policy, secure recovery, verified changes to email/phone, session revocation and alerting.
- Separate DB role/database, private DB network, secret manager, encryption and tested backup/restore.
- Validate access-token signature, issuer, audience, expiration, not-before and allowed algorithms. Never accept an ID token as a bearer token for API authorization.
- BFF session for browser use where appropriate; secure/HttpOnly cookies and CSRF controls. Native public clients use Authorization Code + PKCE and protected storage.
- Logs must not include passwords, bearer tokens or recovery secrets; review log/metric/trace location and retention.
- Travelar communication-provider failover must also cover Keycloak's verification/recovery email path via a controlled relay or reviewed integration; do not silently bypass recovery when the provider is down.

## Acceptance criteria

- Written hosting evidence specifies physical locations and access for primary data, replicas, backups, logs, telemetry and support.
- Counsel/PDPC review addresses the actual identity and communications data flows; required registration/permits/safeguards are documented.
- POC proves OIDC login, PKCE, token validation, realm separation, tenant authorization, privileged MFA, lost-account recovery, key rotation, outage handling and PostgreSQL 18 compatibility.
- Admin interface is unreachable from unauthorized public networks.
- Restore and identity-provider outage exercises pass against documented RTO/RPO targets.
- Provider exit, account migration and internal ID mapping are tested in non-production.

## Revisit triggers

- The local hosting option cannot deliver tested availability/security or a credible support model.
- PDPC/counsel identify an unresolvable restriction for the proposed topology.
- A managed identity vendor offers a specifically contracted, acceptable locality and risk profile at materially lower operational risk.

## Sources

- https://oagmis.oag.go.tz/portal/acts/237
- https://oagmis.oag.go.tz/portal/legislation/1350
- https://pdpc.go.tz/services/cross-border-data-transfer-permit/
- https://pdpc.go.tz/services/registration/
- https://www.keycloak.org/server/supported-configurations
- https://www.keycloak.org/2026/10/keycloak-2681-released
- https://www.keycloak.org/server/configuration-production
- https://www.keycloak.org/server/reverseproxy
- https://support.auth0.com/center/s/article/Tenant-Creation-in-a-Specific-Sub-region

**Status note:** The architecture direction favors Keycloak; hosting, legal clearance and production readiness are not yet approved.
