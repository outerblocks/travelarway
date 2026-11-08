# 78 — Operator Organizations, Branches, Staff Invitations, Roles and Authorization

**Product:** Travelar · **Stage:** 25 · **Status:** Target requirements; identity-provider choice remains subject to the existing Keycloak proof-of-concept and hosting/security gates.

## 1. Organization structure

The authorization model must support separate organizations and legal entities (OuterBlocks/Travelar, operators, agents and approved partners), operating branches/depots, departments/teams, users, memberships, job functions and scoped assignments. Do not model every user as belonging to a single global role.

A user identity can belong to multiple organizations if explicitly authorized, but each active session/action resolves a current organization membership and scope. The backend derives tenant, operator, branch, and permitted trip/financial scope from verified identity plus stored membership; it never trusts a submitted `tenantId`, `operatorId`, `role`, or `isAdmin` value without checking it against database-backed access.

## 2. Staff onboarding in OIMS

Path: **Organization → Staff → Invite staff**.

1. Choose a permitted organizational/branch scope.
2. Enter name and contact method needed for invitation; optionally select an existing Travelar user by safe identity lookup.
3. Choose one or more approved role templates and resource scope (organization-wide, selected branch, selected routes/trips, selected module permissions).
4. Set employment/contract status, invite expiry, start date and optional end date.
5. Preview exact permissions and restricted capabilities. Prevent conflicts with separation-of-duties policies.
6. Submit invitation. Generate a cryptographically random, single-use invitation token; store only a hash; deliver the link/code through an approved notification provider. Never put the invitation secret in logs.
7. Invitee proves control of the contact channel, sets up authentication/MFA as policy requires, accepts terms/privacy notice and confirms profile data.
8. Activate the membership/role assignment only after identity and any required supervisor approval are complete. Expired or revoked invitation links must fail.
9. Notify the inviter and create a durable onboarding/audit event.

A user must not become an active employee merely because an administrator opened the invite screen. Invitations and memberships have explicit states: `DRAFT`, `PENDING_APPROVAL`, `SENT`, `ACCEPTED`, `ACTIVE`, `EXPIRED`, `REVOKED`, `SUSPENDED`, `ENDED`.

## 3. Role and permission designer

HIMS owns platform-wide role templates and global permissions. An operator administrator may create a tenant-specific role by combining an approved catalogue of capabilities only if policy enables that feature. Operators cannot grant themselves HIMS privileges, new privileged capabilities, access to another tenant, audit deletion, secret viewing, or payout approval outside allowed scope.

Use RBAC plus attributes/resource scopes (e.g. organization, branch, trip, payment, amount threshold, shift, country/mode) where needed. Each authorization check needs:

- Subject: actor/service identity, membership and authentication assurance.
- Action/capability: specific operation, not broad “admin” permission.
- Object: actual record and tenant/operator ownership.
- Scope/context: branch, trip, mode, channel, status, amount, approval state and separation-of-duties constraints.
- Decision and reason where security/audit logging is appropriate.

Example capabilities (names illustrative): `routes:read`, `routes:create`, `routes:publish`, `schedules:generate`, `trips:assign_vehicle`, `inventory:block`, `bookings:read_limited`, `manifests:export`, `cash_shifts:close`, `refunds:prepare`, `refunds:approve`, `payouts:prepare`, `payouts:approve`, `staff:invite`, `staff:role_assign`, `audit:read`, `provider_config:manage`. Do not use one permission for both preparing and approving a material financial action.

## 4. Example OIMS role templates

These are starting points, not hardcoded role grants. Every template must resolve to an explicit permission matrix approved by Travelar/product/security and be configurable within safe bounds.

- **Operator Owner:** organization overview, contracts/settlement read, assign tenant administrators, approve high-risk changes as allowed; not automatically allowed to alter Travelar-wide rules.
- **Operations Manager:** routes/schedules/trips, assignments, disruptions and operational reports; cannot pay out or edit own privileges.
- **Scheduler/Dispatcher:** draft schedules, generate and amend trips within scope; publish only if authorized.
- **Fleet Manager:** vehicle documents, maintenance, vehicle/layout assignments; no passenger financial refunds by default.
- **Ticket Office/Cashier:** counter bookings and permitted payment methods, own-shift sales and close, limited passenger lookup; cannot modify fare policies or reconcile own material variance alone.
- **Branch Supervisor:** branch staff/shift operations, approve permitted exceptions, branch-scoped reporting.
- **Finance Preparer:** settlement reports, payable calculations, payout drafts and reconciliation queues; cannot approve own payouts or edit beneficiary data unrestricted.
- **Finance Approver:** approve eligible transactions within thresholds, separately scoped; cannot override legal/provider blocks.
- **Customer Support:** minimum necessary booking lookup, case notes and permitted cancellation/refund request; refunds are workflowed, not direct database edits.
- **Manifest/Marshal:** assigned trip's authorized passenger list/boarding status, minimal data and expiry after need; no full operator analytics or financial access.

## 5. Authorization layers

Implement authorization consistently at:

1. Frontend route/action visibility for usability only.
2. API guard/policy checks on every request and every object identifier.
3. Domain service method checks before state transition or money/inventory side effect.
4. PostgreSQL grants, tenant-aware data access and Row-Level Security where appropriate.
5. Background jobs and webhooks using explicit service identities and scoped operations.

PostgreSQL Row-Level Security is useful defense in depth, but it is not enabled automatically; table policies must be created and tested, and database owners/superusers/BYPASSRLS roles can bypass them. Application checks remain required. Official reference: https://www.postgresql.org/docs/18/ddl-rowsecurity.html. OWASP emphasizes object-level and function-level authorization across API operations: https://api-security.owasp.org/.

## 6. Role and staff changes

Adding/removing roles, widening scope, inviting privileged accounts, changing MFA state, disabling a user, resetting a factor, changing a branch, bulk export, and granting finance/security capabilities are audited. Material grants require approval and may require step-up authentication. Use access-expiry, periodic access reviews, leaver offboarding and emergency access with mandatory retrospective review.

Revocation must take effect in backend authorization promptly even if an identity-provider token remains valid. Short-lived access tokens/session revocation controls should be considered for high-risk actions. Do not store authority solely in a long-lived JWT role claim.

## 7. Acceptance criteria

- Create an organization and branch, invite a staff member, accept the invitation and activate a scoped membership.
- Expired/replayed/revoked invitations fail, and tokens are not stored or logged in plaintext.
- A branch user cannot read or mutate another branch/tenant object by changing URL or JSON IDs.
- A cashier cannot edit fares, approve own refund or approve own payout unless a separately approved policy explicitly allows a low-risk exception; default design separates duties.
- Removing a role immediately blocks the relevant server action.
- Custom roles can only combine allow-listed capabilities and cannot elevate above the creator's grant authority.
- Access changes are recorded in audit events and visible to authorized audit personnel.
