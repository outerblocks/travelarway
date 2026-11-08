# Stage 20 — Portal, Agent, OIMS Sub-Portal and White-Label Architecture

**Date:** 24 October 2026  
**Status:** Design extension of the existing shared-core, multi-tenant model.

## 1. Surfaces and responsibilities

Use one Travelar product brand with these distinct application surfaces (hostnames are proposals until domains, DNS, certificates and operations are verified):

- **Public marketplace:** `travelarway.com` — traveller discovery, search, booking and secure booking management.
- **Travelar HIMS:** `hims.travelarway.com` — approved OuterBlocks headquarters staff and internal operational work.
- **Travelar OIMS:** `oims.travelarway.com` — each contracted operator's authorized configuration and daily operations.
- **Travelar Agent Portal:** `agents.travelarway.com` — Travelar-managed selling agents and their permitted mode/provider assignments.
- **Operator branch/agent sub-portals:** restricted contexts within OIMS for the owning operator, branch, terminal and agent agreement.
- **Travelar White-Label/API Engine:** custom domain storefronts and partner APIs for an operator or approved distribution partner.

Distinct portals do not require separate copies of pricing, booking, payment, inventory or ledger logic. They call the same authenticated core domain services under different trust contexts. They must not share privileged sessions across all subdomains by default. Each token/client has expected issuer, audience, scopes and role/tenant attributes.

## 2. White-label tenant and custom domain model

Each white-label storefront should be a configured tenant/channel object, not a forked codebase. Recommended fields:

- `tenant_id`, `operator_id`, partner agreement/version and operational state;
- primary custom domain and verified aliases;
- DNS/domain proof status, TLS certificate status/expiry and domain ownership history;
- theme token set, logo assets and approved content blocks;
- enabled modes, products, routes/properties/experiences, supplier/provider eligibility and service areas;
- locale/time zone/currency presentation defaults and customer-support details;
- channel source ID and attribution version;
- legal disclosure / terms / privacy / cancellation versions;
- API client/key IDs, allowed scopes, rate policy and credential rotation metadata (never raw secrets);
- analytics/consent configuration as legally reviewed;
- deployment/publication state, audit evidence and rollback version.

Domain mapping must resolve to a verified tenant; arbitrary Host headers, unverified domains or query parameters must not select an operator tenant. Require domain challenge/verification before activation, automated TLS issuance/renewal monitoring, and a tested fallback if the domain is misconfigured. Avoid one tenant's theme/product configuration contaminating another tenant's cache.

Custom branding cannot remove mandatory disclosures or cause a false claim that the operator is the supplier/merchant when the actual contract says otherwise. Footer language, brand credit and the entity of record remain gated on verified legal details and signed white-label terms.

## 3. API and channel source security

Every API client has a persisted identity, owning organization, allowed markets/modes/suppliers, scopes, rate limits, rotation/expiry dates and production approval evidence. Use OAuth client credentials or another documented provider/partner scheme appropriate to the client; prefer scoped, revocable credentials and never rely on origin/referrer/CORS as authentication.

The server should derive booking channel from a trusted source, e.g. authenticated HIMS actor, agent membership, OIMS branch shift, verified white-label domain/client or partner API credential. The public browser cannot set commissionable attribution by sending `channel=TRAVELAR_AGENT` or `operator_origin=true`.

Rate-limit public search, login, booking/seat holds, ticket lookup, APIs and expensive provider searches separately. Edge rules can reduce traffic, but domain/tenant, user, token, booking, service and supplier quotas must also be checked in the core API because users can switch IPs/devices and requests can bypass an incorrectly configured edge layer.

## 4. Travelar vs operator call-center split

Two call-center paths are required:

- Travelar HIMS call center: staff create bookings using an authenticated Travelar sales channel. The configured source is attributable to Travelar; commission eligibility comes from the applicable signed supplier agreement and approved policy.
- Operator OIMS call center: operator staff act for their own operator under the operator's agreement and financial policy. It must not be marked as Travelar-originated simply because the shared Travelar backend hosts the screen.

Both paths use the same safe booking/payment/ticketing services and carry an audit/case trail. The UI cannot force a source type to manipulate commission. Call-centre assisted booking also needs secure customer verification, disclosure of price/conditions, authorized consent capture where required and safe handling of payment tokens/links.

## 5. Operator sub-portals

An operator can invite branch managers, cashiers, service agents, call-centre users, finance users and marshals within its tenant. Provisioning must be pending/invite-only and require:

- an authorized inviter and organization/branch agreement scope;
- short-lived, single-use activation links;
- MFA for privileged and financial roles; other staff policy defined by risk and regulatory needs;
- explicit role/branch/trip scope and default-deny API access;
- expiry/termination, permission review and prompt revocation;
- audit event for invitations, role changes, disabling and recovery.

A branch cashier does not gain tenant-wide finance access; an operator owner does not gain another operator's records; a marshal sees only assigned-trip data needed to validate boarding.

## 6. Cross-channel shared inventory

The public marketplace, Travelar agents, Travelar call center, operator OIMS/POS, operator agent portal, white-label storefront and approved APIs may sell the same underlying service. They must use the same authoritative inventory transaction/constraints and a consistent channel attribution mechanism. Separate channel UIs do not imply separate inventory copies.

Any channel-specific capacity buffer or sales quota must be an explicit approved policy with reconciliation and release semantics, not a hidden duplication of inventory. If a supplier manages authoritative availability, Travelar must reserve/confirm through that provider and reflect unknown/stale status honestly.

## 7. OIMS scope by supply model and travel mode

OIMS must support operator/supplier administration where Travelar has contracted operational responsibility, but not invent control over third-party inventory:

- **Bus/Ferry:** direct operations modules for branches, vehicles/vessels, routes/sailings, seats/classes, capacity, fares, booking/tickets, shifts and manifests, subject to authority/provider model.
- **Stays:** self-listed properties need room/rate/inventory/calendar, occupancy, check-in/out, cancellation/no-show, property staff and payout modules. For OTA-fed inventory, OIMS should manage the integration/supplier configuration, content mapping, availability sync and exceptions only to the extent the contract permits; it must not claim control of Expedia/Booking.com inventory.
- **Experiences:** directly managed local suppliers need activities, time slots, capacities, age/group pricing, meeting points, guides, inclusions/exclusions, redemption and cancellation workflows. Third-party API inventory retains supplier authority for availability, booking and post-sale operations.
- **Flights:** OIMS can manage an approved travel agency/consolidator workflow, source/provider configuration, fare/ticketing permissions, queues, booking references, post-sale requests and reconciliation. It must not represent Travelar as the airline or allow arbitrary staff to publish airline schedules/fares without source/authority.
- **Train:** OIMS can support an authorized railway/agent integration, permitted inventory/configuration, service disruptions and ticket/settlement support. It must not publish ticketable rail inventory or alter official fares without written railway/data rights.

All six modes remain first-class platform scope; the implementation/configuration for each mode depends on the supplier model and authorization. `OIMS-supported` does not necessarily mean Travelar owns the supplier's system of record.

## 8. Acceptance tests

- Forged `Origin`/`Host`/query parameter cannot change tenant or commissionable channel.
- Unverified custom domain cannot access or render operator-specific booking data.
- Two white-label domains mapped to separate operators never share inventory, cache content, customer support contact or transaction reports incorrectly.
- Operator A's branch cashier cannot see Operator B, another branch, tenant-wide payouts or unassigned trips.
- Travelar call-center booking and operator call-center booking generate different authenticated source evidence and correct signed-contract policy, without letting the user edit attribution.
- White-label/API sale and marketplace sale compete for one authoritative seat/capacity reservation and cannot oversell.
- A third-party supplier with no operational data rights cannot be edited as though its inventory is a Travelar master record.
- Removing a staff member or rotating an API key revokes access within documented limits and leaves an audit record.
