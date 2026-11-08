# Stage 9 — Sources and Evidence Register

**Research date:** 24 October 2026  
**Purpose:** Current primary-source register supporting the authentication and technology stack evaluation. Plan/feature pages are time-sensitive; re-check before contract or implementation lock.

| Source | Publisher | Claims supported | Classification | Access date |
|---|---|---|---|---|
| https://tanstack.com/start/latest/docs/framework/react/overview | TanStack | TanStack Start status, SSR, streaming, server routes/functions, Vite/Rsbuild and flexible deployment. | Primary framework documentation | 24 Oct 2026 |
| https://tanstack.com/start/latest/docs/framework/react/guide/authentication-overview | TanStack | Authentication vs authorization, session patterns and the requirement to authorize every server data boundary. | Primary framework/security guidance | 24 Oct 2026 |
| https://react.dev/learn/creating-a-react-app | React | React recommends using a framework for most new full applications. | Primary documentation | 24 Oct 2026 |
| https://docs.nestjs.com/techniques/performance | NestJS | FastifyAdapter integration, migration/compatibility considerations and HTTP adapter performance trade-off. | Primary framework documentation | 24 Oct 2026 |
| https://docs.nestjs.com/data/overview | NestJS | Supported data integration choices, including Drizzle, TypeORM, Prisma and other direct database integration. | Primary framework documentation | 24 Oct 2026 |
| https://docs.nestjs.com/techniques/queues | NestJS | BullMQ integration and persisted queue behavior with Redis; Bull is in maintenance mode per docs. | Primary framework documentation | 24 Oct 2026 |
| https://orm.drizzle.team/docs/get-started-postgresql | Drizzle | PostgreSQL drivers and setup patterns. | Primary library documentation | 24 Oct 2026 |
| https://orm.drizzle.team/docs/transactions | Drizzle | Transaction and isolation-level APIs. | Primary library documentation | 24 Oct 2026 |
| https://www.postgresql.org/support/versioning/ | PostgreSQL Global Development Group | Major-version support lifecycle; 18.6 current as listed on the research date and support dates. | Primary source | 24 Oct 2026 |
| https://www.postgresql.org/docs/18/release-18.html | PostgreSQL Global Development Group | PostgreSQL 18 release date and feature list. | Primary source | 24 Oct 2026 |
| https://www.postgresql.org/docs/release/ | PostgreSQL Global Development Group | PostgreSQL 19 RC 1 release notice on 15 October 2026; do not use RC for ordinary production baseline. | Primary source | 24 Oct 2026 |
| https://nodejs.org/en/about/previous-releases | OpenJS Foundation / Node.js | Node.js release/LTS status. | Primary source | 24 Oct 2026 |
| https://supabase.com/changelog/46080-self-hosted-supabase-upgrading-from-pg-15-to-17-breaking-change | Supabase | Published May 2026 notice says PostgreSQL 17 is the hosted platform default and announces the self-hosted image default change; existing projects can differ and must be checked. | Primary provider documentation | 24 Oct 2026 |
| https://supabase.com/docs/guides/database/postgres/which-version-of-postgres | Supabase | Projects can inspect actual server version; do not assume every project version is identical. | Primary provider documentation | 24 Oct 2026 |
| https://auth0.com/pricing | Auth0 | Published plan/MAU pricing model and feature differences; pricing may change and quote is required. | Primary commercial source | 24 Oct 2026 |
| https://support.auth0.com/center/s/article/Tenant-Creation-in-a-Specific-Sub-region | Auth0 Support | Public-cloud sub-region selection limitations; private cloud data region can be selected from its available list. | Primary vendor support article | 24 Oct 2026 |
| https://auth0.com/intro-to-iam/what-is-openid-connect-oidc | Auth0 | OIDC, Authorization Code + PKCE, ID/access token distinction and token validation concepts. | Primary technical source | 24 Oct 2026 |
| https://www.keycloak.org/securing-apps/overview | Keycloak | Keycloak supports OAuth 2.0, OIDC and SAML, subject to supported client ecosystem. | Primary project documentation | 24 Oct 2026 |
| https://www.keycloak.org/docs/latest/server_admin/index.html | Keycloak | WebAuthn/passkey support and configurable policies. | Primary project documentation | 24 Oct 2026 |
| https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html | OWASP | Authentication controls, account recovery and protection from common authentication risks. | Recognized security guidance | 24 Oct 2026 |
| https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html | OWASP | Cookie/session management and warnings against storing sensitive auth tokens in browser storage. | Recognized security guidance | 24 Oct 2026 |
| https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html | OWASP | Password hash algorithms and storage practices for any self-hosted/custom credential database. | Recognized security guidance | 24 Oct 2026 |
| https://pdpc.go.tz/services/registration/ | Tanzania Personal Data Protection Commission | Tanzania registration and cross-border personal data transfer permit process. | Primary regulator source | 24 Oct 2026 |

## Evidence limits

- Vendor pages describe capabilities, not Travelar's commercial authorization, production approval or SLA entitlement.
- Auth0 features vary by contract tier and region; the actual plan's feature/security matrix, locations and pricing must be quoted and archived.
- Keycloak's ability to support a protocol does not mean OuterBlocks has the operational staff or hardening needed to run it securely.
- Framework documentation does not substitute for proof-of-concept load tests, security tests, recovery drills or code review.
- Stack recommendations assume TypeScript proficiency can be staffed; if actual engineering leadership is experienced primarily in another stack, re-evaluate.


## Stage 10 identity-locality research additions

| Source | Publisher | Claims supported | Classification | Access date |
|---|---|---|---|---|
| https://oagmis.oag.go.tz/portal/acts/237 | Tanzania Office of the Attorney General | PDPA 2022, including controller/processor registration and cross-border provisions in sections 31–32 | Primary legislation | 24 Oct 2026 |
| https://oagmis.oag.go.tz/portal/legislation/1350 | Tanzania Office of the Attorney General | GN 449C of 2023; regulation 20 transfer-permit process | Primary subsidiary legislation | 24 Oct 2026 |
| https://pdpc.go.tz/services/registration/ | Tanzania PDPC | Registration as controller/processor prior to processing per current regulator guidance | Primary regulator guidance | 24 Oct 2026 |
| https://pdpc.go.tz/services/cross-border-data-transfer-permit/ | Tanzania PDPC | Current publicly described process and evidence for transfer-permit applications | Primary regulator guidance | 24 Oct 2026 |
| https://www.odpc.go.ke/data-protection-laws-kenya/ | Kenya ODPC | Kenya Data Protection Act, 2019 and 2021 regulations | Primary regulator legal index | 24 Oct 2026 |
| https://www.odpc.go.ke/guidelines-2/ | Kenya ODPC | Cross-border and sectoral guidance | Primary regulator guidance | 24 Oct 2026 |
| https://www.keycloak.org/server/supported-configurations | Keycloak | Current support matrix includes PostgreSQL 18.x | Primary project documentation | 24 Oct 2026 |
| https://www.keycloak.org/2026/10/keycloak-2681-released | Keycloak | 26.8.1 released 13 October 2026 and includes security fixes listed by the project | Primary release documentation | 24 Oct 2026 |
| https://www.keycloak.org/server/configuration-production | Keycloak | TLS, hostname, admin endpoint isolation, proxy and production configuration guidance | Primary project documentation | 24 Oct 2026 |
| https://www.keycloak.org/server/reverseproxy | Keycloak | Reverse proxy exposure and network guidance | Primary project documentation | 24 Oct 2026 |

Evidence limitation: the sources establish the legal framework and Keycloak capabilities but do not establish that any named Tanzanian host is currently contracted, that a specific architecture has PDPC approval, or that OuterBlocks has an operations team able to meet the recommended security and recovery standard.
