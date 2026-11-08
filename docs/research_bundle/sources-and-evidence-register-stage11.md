# Sources and Evidence Register — Stage 11

**Research date:** 24 October 2026. These sources support the Keycloak vs self-hosted Supabase Auth comparison. Vendor documentation describes product capabilities; it does not establish OuterBlocks' contract terms or regulator approval.

| Source | Publisher | Claims supported | Limitations / follow-up |
|---|---|---|---|
| https://www.keycloak.org/server/supported-configurations | Keycloak project | Supported production database versions, including PostgreSQL 18.x | Verify the exact Keycloak release selected for production. |
| https://www.keycloak.org/securing-apps/oidc-layers | Keycloak project | Keycloak implements OIDC provider endpoints for client/service integration | Does not prove correct Travelar client configuration or authorization. |
| https://supabase.com/docs/guides/self-hosting/postgres-upgrade-17 | Supabase | Bundled self-hosted Supabase deployment defaults to PostgreSQL 17 | Does not prove PostgreSQL 18 is impossible in every custom GoTrue deployment. |
| https://supabase.com/docs/guides/self-hosting | Supabase | Self-hosting responsibilities and limitations vs managed platform | Actual operational quality depends on OuterBlocks' implementation. |
| https://supabase.com/docs/guides/auth/architecture | Supabase | Auth service, JWT behavior and PostgreSQL integration | Describes standard Supabase architecture; custom standalone deployments need validation. |
| https://supabase.com/docs/reference/self-hosting-auth | Supabase | Standalone self-hosted Auth/GoTrue API reference | Not a guarantee that any custom PG18 image/database configuration is a supported combination. |
| https://www.postgresql.org/support/versioning/ | PostgreSQL Global Development Group | Current major-version support schedule: PG17 until 8 Nov 2029; PG18 until 14 Nov 2030 | Check release schedule again at implementation and patch using current minor releases. |
| https://pdpc.go.tz/services/registration/ | Tanzania PDPC | Controller/processor registration service | OuterBlocks' actual role must be established. |
| https://pdpc.go.tz/services/cross-border-data-transfer-permit/ | Tanzania PDPC | Transfer permit process and safeguard considerations | Obtain advice for the exact data flow and jurisdiction. |
