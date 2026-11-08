# Stage 20 — Security and Concurrency Review of Proposed Implementation Details

**Date:** 24 October 2026  
**Purpose:** Preserve the existing security baseline while preventing unsafe literal adoption of implementation suggestions.

## 1. Web application firewall and rate limiting

Cloudflare can be evaluated as an edge WAF/bot/rate-limiting provider, but it is not yet selected and its capabilities depend on plan/contract. Cloudflare's public rate-limiting documentation shows that match fields, counting dimensions, rule counts and bot-fingerprint capabilities differ by plan. Therefore:

- issue an RFI and compare controls, price, logging, support, data handling, regional routing and actual feature availability against the Travelar threat model;
- enforce rate limits in both the edge and application backend;
- define separate quotas for login, password reset, public search, expensive supplier search, booking hold, payment initiation, ticket lookup, API clients and bulk exports;
- use multiple risk signals, not IP-only limits. Mobile network NAT/shared IPs, VPNs and distributed botnets make any single characteristic incomplete;
- use device fingerprinting only where necessary, proportionate and legally/privately reviewed; don't assume invasive fingerprinting is required or available on every plan;
- monitor false positives and provide recovery paths so legitimate users are not silently locked out.

Official documentation: https://developers.cloudflare.com/waf/rate-limiting-rules/ and https://developers.cloudflare.com/waf/rate-limiting-rules/best-practices/ .

## 2. Input validation and database access

Parameterized database queries/prepared statements are mandatory on all database access paths. Request payloads need strict server-side schema validation, including rejection or removal of unknown properties, bounds for strings/numbers/arrays, enums and validation of relationships and state transitions. Validation must occur in the trusted backend even when the frontend has the same schema; an API gateway/edge rule is not a replacement for domain validation.

The current backend candidate is NestJS + Fastify. NestJS documents `ValidationPipe` options such as whitelist and rejecting non-whitelisted fields; Zod is another possible schema tool. Choose a consistent standard after reviewing the repo and tests. Do not duplicate DTO schemas in two unmaintained validators. Source: https://docs.nestjs.com/techniques/validation .

## 3. Tenant isolation and PostgreSQL RLS

Tenant scope must be enforced in application services on every read/write and can be reinforced with PostgreSQL Row-Level Security. PostgreSQL defaults to no RLS restrictions until policies are enabled; superusers, roles with `BYPASSRLS` and normally table owners can bypass RLS. Thus, RLS alone is not proof of tenant isolation.

Controls:
- use a non-owner, least-privileged application database role without `BYPASSRLS`;
- enable RLS deliberately and create explicit policies for all tenant-owned tables where it adds defence in depth;
- consider `FORCE ROW LEVEL SECURITY` for protected tables where appropriate, after confirming migration/admin procedures;
- restrict migrations and maintenance access separately from runtime credentials;
- background jobs and provider workers must establish and validate tenant context, rather than run as a privileged universal principal without policy;
- test select/insert/update/delete, joins, exports, search results, aggregates, object-store paths, websocket/subscription flows and background jobs across tenants;
- test using the same database role and claims/context that production requests actually use.

Sources: PostgreSQL 18 `CREATE POLICY` https://www.postgresql.org/docs/current/sql-createpolicy.html and PostgreSQL 17 RLS explanation https://www.postgresql.org/docs/17/ddl-rowsecurity.html .

## 4. Seat holds: Redis may assist, PostgreSQL remains authoritative

A configurable hold duration (the proposal's ten minutes is an example, not a universal constant) is a commercial/UX policy. It should consider provider flow, payment method, market, inventory type and authorized retry/recovery policy. Keep it effective-dated and measure abandoned holds.

Do **not** implement “Redis TTL lock” as the only correctness guarantee. A Redis key expiring, failover occurring, a network partition, a worker pausing, or a retry arriving late must not permit duplicate tickets. Redis's own distributed-lock guidance describes limitations in naive failover-based locking and discusses lock validity windows and fencing tokens.

Recommended approach for the existing Travelar inventory model:

- PostgreSQL transaction/authoritative rows coordinate holds and final allocations; use unique/constraint checks, row-level locking/serializable patterns where appropriate and explicit transaction boundaries.
- For bus, allocation must be segment-aware. A seat can be sold for non-overlapping portions of one trip, while overlapping segment allocations must conflict. Store ordered stop indices or an equivalent canonical segment representation, and test overlap under concurrent requests.
- For ferry, capacity by class must be allocated atomically in the same transaction as the reservation/hold state.
- Store hold ID, owner/context, inventory resource, expiry instant, policy version and state. A background cleanup/expiry job is a convenience; every booking attempt must independently treat expired holds as expired within its transaction.
- Ticket issuance must follow the existing authoritative payment and booking/provider reconciliation rules; a Redis lock is not payment confirmation.
- Redis may provide fast coordination, cache, request coalescing, rate counters or queueing if proved useful. If a distributed lease is added, design fencing/version checks and explicit failure behavior, then test failover/clock/pause scenarios.

Source: https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/ .

## 5. Payment webhooks: protocol-specific verification

Do not assume every PSP/mobile-money/card provider uses the same HMAC scheme or publishes stable IP ranges. For each provider adapter, document the provider's official verification protocol, payload/signature input, timestamp/event ID behavior, key management, retry and ordering guarantees. Use a provider SDK/verification library where available. If the provider specifies HMAC, validate exactly the raw bytes/protocol it documents with constant-time comparison; apply IP allowlisting only as an extra control where the provider documents stable ranges.

Persist verified event IDs and processing state; ensure duplicates/replays cannot credit wallets, mark a payment twice or issue two tickets. Provider responses may arrive out of order: query authoritative payment state when uncertain, and never infer `FAILED` from a timeout. Move side effects through idempotent transaction/outbox handlers. Protect signing secrets, implement rotation, redact payloads and alert on repeated invalid signatures.

Source: OWASP Webhook Security Cheat Sheet https://cheatsheetseries.owasp.org/cheatsheets/Webhook_Security_Cheat_Sheet.html .

## 6. Immutable ledger and cryptographic hashing

The existing decision is an append-only, double-entry financial ledger with balanced journal constraints, reversal/correction entries, unique event/idempotency records and tightly controlled privileges. This should remain the primary correctness control.

Adding a hash column or hash chain can help detect certain modifications, but it does not by itself prove immutability against an administrator who can rewrite the database and recompute all hashes. If tamper-evidence is required, consider signed checkpoints/hashes exported to an independent protected system, immutable/WORM storage or independently controlled audit evidence, plus normal database audit, restricted DBA access, backups and PSP/bank reconciliation. Treat cryptographic row hashing as a layered detection control rather than a substitute for access control or accounting evidence.

## 7. MFA, maker-checker and role profiles

Preserve the prior least-privilege/maker-checker model. Require MFA for privileged, finance, legal/compliance and identity administration; specify whether all operator users and Travelar agents require MFA based on risk, usability, device/offline profile and contractual/regulatory demands. Do not hardcode a universal `2FA=true` assumption for every possible future user type without defining recovery and support operations. Enrollment, factor reset, recovery, device loss, role elevation and offboarding must be audited; recovery must not be weaker than login.

Maker/checker should be applied to material actions such as payout/beneficiary changes, manual journal/agent-float adjustments, commission policy publication, fiscal/booking corrections and emergency tenant suspension. Initiator and approver must be distinct authorized identities. An emergency break-glass procedure needs bounded duration, reason, alerting and post-event review.

## 8. OWASP API risks to test

OWASP API Security Top 10 includes broken object/function-level authorization, unrestricted resource consumption, unrestricted sensitive business flows, SSRF, security misconfiguration, improper API inventory and unsafe consumption of APIs. Travelar-specific tests should include:

- seat-hold/booking spam and per-user/operator/route caps;
- login abuse and account recovery abuse;
- object- and field-level access by tenant/branch/role;
- malicious/compromised provider response fields and unsafe outbound URLs;
- inventory scraping and abandoned holds;
- IDOR across booking, ticket, manifest, payout, finance export and operator records;
- old/deprecated API endpoints left enabled;
- abusive retry and callback storms;
- rate-rule bypass through alternate channels/white-label/API.

Source: https://devguide.owasp.org/en/07-training-education/07-api-top-ten/ .

## 9. Do not change the current vendor/hosting decisions based on this proposal

- Cloudflare is a candidate edge provider, not chosen by this document.
- Redis and a Redis-backed queue are candidate tools, not a committed source of truth nor an adopted queue architecture.
- PostgreSQL 18 + custom backend remains the current data/backend direction.
- NIDC and Wingu remain a shortlist, not a selected production host. An AWS `RDS/Aurora + ECS/EKS + ElastiCache` recommendation or claim of lower cost requires fresh lawful-region, contract, operating-skill, support, DR and total-cost evidence. It does not override the current hosting verification gate.
- Do not bring Supabase back as a complete backend platform by implication. A managed Postgres database-host option is a separate evaluated question.

## 10. Acceptance gates

- Simultaneous overlapping bus segment holds produce at most one valid allocation; non-overlapping segments may share the seat when business rules allow.
- Simultaneous ferry bookings never exceed class capacity.
- Redis disabled/failover/timeout cannot lead to oversell; database transaction constraints still protect allocation.
- Duplicate/forged/stale PSP events do not change financial state twice; provider-specific verification is tested.
- RLS policies are tested against runtime database roles, including owner/BYPASSRLS bypass paths and background jobs.
- Edge rate limits and core API controls are independently tested; deployment documentation names the exact purchased features.
- An agent/source/channel cannot be changed by a caller-submitted property; correction requires audited approval.
- A ledger hash test includes a privileged rewriting scenario to demonstrate its limits and any independent tamper-evidence control.
