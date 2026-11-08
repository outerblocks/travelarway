# ADR-CORP-001 — Confirmed Intended Group Structure with Mandatory Legal Verification

**Status:** Accepted business decision; legal and regulatory validation still open  
**Date:** 24 October 2026

## Context

The product owner has expressly confirmed the intended structure: OuterBlocks Limited is the parent company and OuterBlocks Destinations Limited is the operating subsidiary/entity of record for Travelar. An earlier draft name, Travelar Destinations Limited, is superseded. Contracting, licenses, bank/PSP settlement, tax, employment, IP and privacy-controller responsibilities depend on the actual registered entities and agreements; these must not be inferred from the product decision alone.

## Decision

**Accepted as the intended business structure:** OuterBlocks Limited (parent) → OuterBlocks Destinations Limited (Travelar operating entity). New product documents should use this intended structure and should not use Travelar Destinations Limited. Formal legal verification remains a mandatory gate: review current company extracts, ownership relationship, corporate objects, tax and business licences, signatory authority, IP/intercompany agreements, payment-account ownership, regulatory eligibility and data-controller/processor responsibilities before contracts, funds flows or production licenses are activated.

## Consequences

- Keep legal entity configuration separate from product brand and tenant/channel identities.
- Make contract, payout beneficiary, merchant, ticket/fiscal issuer and data-controller roles explicit for each route.
- Do not publish final legal footer/terms, onboard merchant accounts or apply for regulator permissions in an unverified entity's name.
- Capture any later entity change in an approved decision, migrate legal/contract data carefully and preserve history.

## Verification

BRELA company extract/current status; incorporation and constitutional documents; ownership/parent relationship; TIN and tax/business registrations; board/authorized signatory decision; banking/PSP account name; contract/IP/employment/privacy/permit impact assessment.

## References

- BRELA ORS: https://ors.brela.go.tz/
