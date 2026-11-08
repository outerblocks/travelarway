# Travelar join audit — repository reality

**Date:** 2026-11-08  
**Branch:** `main` (`f932cb3` plus a large uncommitted working tree: server, `db/`, UI redesign)  
**Status:** `blocked` for production money and staff operations. Guest bus/SGR booking code is `implemented` in-repo, `not run` against a verified database in this session.  
**Non-goals:** production deploy, live ClickPesa, schema writes, Keycloak install.

This is an inspection of the tree as it exists. The Nov 2026 engineering-audit pack remains directionally correct. This document is the join briefing for ongoing development.

---

## What this system is

Travelar is a Tanzania-first multimodal OTA (bus, ferry, flights, train/SGR, stays, experiences) plus operator (OIMS) and HQ (HIMS) consoles. Runtime is a **modular monolith**: React 19 + TanStack Start/Router + Vite 8 on Node 22, with `pg` against PostgreSQL (`app` schema, 19 versioned migrations). There is **no NestJS, no Drizzle, no Redis, no RLS, no identity provider**. `@supabase/supabase-js` is a unused dependency.

Two products share one origin:

| Surface | Authority today |
|---|---|
| Public search / bus + SGR hold-book-pay | Server + PostgreSQL when `DATABASE_URL` is set |
| Ferry / flights / stays / experiences quotes | Client fixtures (`src/data/mockData.ts`, `src/domain/pricing.ts`) |
| OIMS / HIMS | In-memory store (`src/data/operations.ts`) gated by **UI stub login** |

---

## Architecture (as coded)

```
Browser  →  TanStack Start routes
              ├─ pages/*          UI
              ├─ context/Auth*    localStorage stub (dev only after 2026-11-08)
              ├─ data/operations  in-memory OIMS/HIMS
              └─ /api/*           server handlers
                    ├─ search, holds, bookings, seat maps
                    ├─ payments (amount from booking row, never the body)
                    ├─ ClickPesa webhook (checksum; CLICKPESA_LIVE fail-closed)
                    ├─ internal/sweep (MAINTENANCE_SECRET)
                    └─ GET /api/auth/session  always unauthenticated
                         ↓
                    src/server/*  parameterized SQL, transactions, HMAC tokens
                         ↓
                    PostgreSQL  (no RLS policies in migrations)
```

Guest checkout is the strongest slice: HMAC booking-access tokens, payment amount from DB, webhook signature, expiry sweep that reconciles before releasing seats.

---

## Requirement-to-code gap (bank / OTA bar)

| Capability | Source | Code evidence | Status | Gap |
|---|---|---|---|---|
| Identity / sessions | ADR-AUTH-001, C-001 | `AuthContext.tsx` stub; `GET /api/auth/session` always `{authenticated:false}` | blocked | No IdP, no httpOnly session, no MFA |
| Staff RBAC / tenancy | Docs 76–83, C-002 | OIMS/HIMS UI-only; `operations.ts` in memory; `staff-authz.ts` refuses APIs | blocked | Anyone in **dev** can open consoles after stub login; no operator APIs exist yet |
| Guest booking authz | Product | `booking-access.ts` HMAC, fail-closed without 32-char secret | implemented | Token in client storage still a theft risk |
| Inventory bus/SGR | ADR inventory | `holds.ts`, `sgr/inventory.ts` + transactions | implemented | Needs concurrency tests on a **verified test DB** (`not run` here) |
| Payments | ClickPesa docs | Adapter + webhook; `CLICKPESA_LIVE` | implemented (code) | No sandbox; live money needs human approval |
| Ledger | Requirements | `ledger.ts` append-only | implemented | No RLS; app role privileges unverified |
| Other modes | Six-mode product | Fixtures; Travelport config disabled | blocked / labelled | Must not take payment as live |
| Partner OpenAPI | Doc 83 | Absent | absent | — |
| Audit vs logs vs journal | Stage 25 | `console.*` only | absent | No audit event store, no PII redaction pipeline |
| Observability | Directive | Health probe only | partial | No metrics/tracing |
| RLS / tenant isolation | Postgres rules | **Zero** `CREATE POLICY` in `db/migrations` | absent | Defense in depth missing |
| CI | DevOps | No workflow found in this pass | absent | — |

---

## Security posture (honest)

**Not bank-level.** Strong payment/inventory *patterns* exist; identity, tenancy, RLS, structured audit, and shared rate-limit store do not.

### Closed or mitigated this session

- CSRF: `X-Forwarded-Host` is no longer used to decide same-origin (`APP_PUBLIC_ORIGIN` + `ALLOWED_ORIGINS`). Finding **H-009**.
- Production UI stub login fail-closed (`stubAuthPolicy` / Vite `DEV` only). **C-001 mitigated in production builds, not fixed.**
- Staff API contract: `refuseStaffUntilIdentityConfigured()` — 503 until IdP.
- Health probe redacts DB errors in `APP_ENV=production`.
- CSP meta on HTML document (in addition to `vercel.json`).
- Documented `CLICKPESA_CHECKSUM_SECRET` and `APP_PUBLIC_ORIGIN`.

### Still open (do not start feature work that assumes these)

1. **C-001 / C-002** — Real IdP (Keycloak per ADR). Operator consoles must not mutate production data until then.
2. **H-002** — Unauthenticated holds (rate-limited + CSRF only).
3. **H-004** — `amountMinor` names major units.
4. **H-005** — `I18nContext.tsx` monolith.
5. In-process rate limiter (not global on serverless).
6. CSP still allows `'unsafe-inline'` scripts (hydration).
7. No RLS.
8. `.env` gitignored; never commit secrets. Do not point agents at production DBs.

---

## What to build next (ordered)

1. Identity (Keycloak or approved ADR change) + httpOnly sessions + staff roles scoped to operator.
2. Move OIMS/HIMS off `operations.ts` onto authorized APIs + Postgres; RLS as defense in depth.
3. Isolated test database + concurrency tests for holds/bookings/ledger.
4. Structured logs, audit events, payment reconciliation job evidence.
5. Then new product work (modes, partner API).

Human approval remains mandatory for: production deploy, live payments/refunds, destructive SQL, credential/permission changes, provider go-live.

---

## Evidence not collected this session

- `npm test` / typecheck: run after this change set (see task report).
- PostgreSQL version, TLS, role grants: **not run** (no verified target).
- E2E against production build (stub auth refused): **not run**.

---

## Database join (2026-11-08)

Inspected PostgreSQL `travelar` on localhost as `travelar_app` (PG 18.6, `APP_ENV=development`). The Cursor Supabase MCP target is a **different marketplace database** — do not run Travelar migrations there.

| Fact | Value |
|---|---|
| Locations | 73 (6 city, 46 searchable town, 12 station, 5 port, **0 airport**) |
| Bus | 4 operators, 3 routes (all Dar es Salaam → Arusha), 189 trips through 2026-11-30 |
| SGR | 70 trips; last departure **2026-11-07** (before today) |
| Ferry / flights / stays / experiences tables | absent |
| Runtime | `GET /api/health` → PostgreSQL 18.6 ok; `GET /api/locations?mode=bus` → 52 places; `GET /api/bus/results?from=DAR&to=ARK&date=2026-11-10` → 6 trips; SGR 2026-11-07 Dar→Dodoma → 5 services |

Search From/To is `GET /api/locations`. Bus/train results query Postgres by location **id**, code, or name. Ferry/flights/stays/experiences resolve places in the database and return an empty offer list (`GET /api/offers`) instead of `mockData`.
