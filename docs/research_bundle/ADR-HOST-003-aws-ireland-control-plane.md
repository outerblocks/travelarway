# ADR-HOST-003 — AWS control plane is Europe (Ireland) `eu-west-1`

- **Status:** Accepted for implementation (9 Nov 2026)
- **Decision owner:** OuterBlocks Limited
- **Supersedes:** Informal use of Africa (Cape Town) `af-south-1` as the default AWS Region in hosting notes

## Decision

1. The AWS Region for Travelar control-plane resources is **Europe (Ireland) `eu-west-1`**.
2. **Do not use** Africa (Cape Town) `af-south-1`.
3. Passenger identity, bookings and Keycloak remain on a **local** data plane (`PII_DATA_PLANE=local`) until counsel records a transfer whose destination is Ireland (`IRELAND_PII_TRANSFER_RECORDED`).
4. Identity is **self-hosted Keycloak**, not Auth0 public cloud.
5. Runtime config refuses `AWS_CONTROL_PLANE_REGION=af-south-1`.

Ireland is an EU Member State. AWS GDPR DPA terms apply when GDPR applies. Ireland is still a cross-border transfer from Tanzania, Kenya, Uganda, Rwanda, Malawi and Ethiopia.

## Consequences

- More AWS services and a default-enabled Region versus Cape Town.
- Every PDPC/ODPC/NCSA/ECA transfer file that names AWS must say Ireland, not South Africa.
- Cloudflare Workers remain an edge, not the SoR.
