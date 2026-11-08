# ADR-GDS-003 — Travelport Stays v11 baseline and SearchComplete v12 gate

**Status:** Proposed, requires provider/version verification before production.  
**Date:** 28 October 2026.

## Context

Travelport's Stays overview is titled v11. The general guide documents v11 search/details/availability/rules/reservation and a v12 SearchComplete model that combines search, property details and availability. The migration guide describes SearchComplete as a re-architecture with richer data and cache controls; the general guide also retains wording that SearchComplete is currently in development. Production availability can therefore not be inferred from the public page names alone.

## Decision

1. Keep separate v11 and v12 SearchComplete adapter paths and schemas.
2. The first provider adapter only enables an operation if product version, endpoint, pre-production/production availability and access-group entitlement are verified.
3. Do not mix ODM v11 and v12 payload types. Travelar canonical models isolate both.
4. For v11, follow search -> availability -> optional details/rules -> Create Reservation. For SearchComplete, search and availability can be returned together; the rest of the booking lifecycle must use documented compatible APIs.
5. For volatile inventory and price/policy changes, require a provider-confirmed offer and explicit customer acceptance of material changes.
6. Record current release-note URL/snapshot, observed date, account access evidence, schema artifact hash and contract-test output.

## Consequences

- Additional test fixtures and version-specific mapping are required.
- SearchComplete cannot be assumed as a production optimization until the gate closes.
- Future product upgrades require a migration ADR and compatibility tests rather than changing a base URL alone.
