# ADR-CONTENT-001 — Utility-led homepage and governed destination information

**Status:** Accepted as product direction; CMS, data-feed and staffing decisions remain open.  
**Date:** 24 October 2026

## Context

The owner has clarified that Travelar's homepage should not be a marketing brochure. It should prioritize Hot Deals & Offers, Explore Destinations and practical Travel Guides & Tips, while retaining access to the six booking modes, search, Help and Manage Booking. Destination information may include visa/entry rules and real-world arrival procedures, so stale or unsupported information can cause direct traveler harm.

## Decision

1. Use a utility-led discovery homepage, not default “How it works,” “Why choose us,” generic benefits, or unverified social-proof sections.
2. Treat offers, canonical destinations and destination/travel guides as structured, managed content objects.
3. Use “Explore Destinations” unless popularity claims have a documented data basis or are clearly labelled as editorial selections.
4. Require provenance, review dates, applicable context, editorial approval and withdrawal/revalidation workflows for high-impact entry, health and safety material.
5. Prefer official authorities and licensed information sources; no API, republishing or commercial rights are assumed from public page access.
6. Do not claim that a guide guarantees visa eligibility or admission.

## Consequences

- Homepage UI is less brochure-like and more useful to planning travelers.
- Editorial quality, localization, source monitoring and correction responsibility become explicit product capabilities.
- High-risk information needs a content owner and reviewer rather than being generated ad hoc by AI or copied without traceability.
- Initial destination coverage should be small enough to maintain accurately; breadth is added as editorial capacity and source verification grow.

## Rejected alternatives

- A marketing-first homepage filled with generic benefits and corporate story blocks.
- A destination database with no source provenance or review lifecycle.
- Claims of “popular” based only on arbitrary visual selection.
- A custom “visa checker” built from static country-only rules without an approved, current data source and necessary traveller context.

## Open items

Select the CMS/workflow, assign editorial roles, agree freshness SLAs, decide whether to contract a licensed travel-document feed, and establish the initial destinations/guides that can be continuously maintained.
