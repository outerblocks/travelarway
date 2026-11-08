# ADR-REG-002 — Effective-Dated Electronic-Payment and Fiscal Capability Gates

**Status:** Proposed control; legal interpretation and provider evidence required  
**Date:** 24 October 2026

## Context

Government Notice No. 158C of 30 June 2026 lists payment categories that include bus/ferry/air/rail fares, hotel accommodation and tourism-related services, and provides an electronic-payment rule effective 1 July 2026 with a transitional provision for certain existing recipients. LATRA separately requires approved online ticketing arrangements and reports integration to Safari Tiketi; TRA describes its approved VFD/EFD fiscal systems. Exact applicability and integration path depend on the entity, transaction and operator/provider arrangement.

## Decision direction

Represent mandatory payment methods, regulator/fiscal obligations and adapter capabilities as effective-dated, evidence-backed policies. Code and database must reject an unauthorized transaction path even if a UI or configuration editor requests it. Each regulatory capability stays disabled until its interface, legal permission and production approval are evidenced.

## Consequences

- POS, call center, online checkout, agent and white-label routes use the same policy evaluator.
- Past cash transactions stay in history and remain reconcilable; current payment eligibility is checked separately.
- Ticket artifact, PSP payment, fiscal receipt and regulator submission are separate states.
- Missing/unknown regulator capability prevents production activation where the capability is mandatory; no silent fail-open.

## References

- GN 158C (2026): https://www.tra.go.tz/images/uploads/acts/GN158C-THE_ELECTRONIC_TRANSACTIONS_%28MANDATORY_ELECTRONIC_PAYMENTS_FOR_SPECIFIED_TRANSACTIONS%29_ORDER%2C_2026-TGPA.pdf
- LATRA current public statements cited in `52-tanzania-regulatory-adapter-and-electronic-payment-obligations.md`.
- TRA EFD/VFD: https://www.tra.go.tz/page/efd-vfd-suppliers
