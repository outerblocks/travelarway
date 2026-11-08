# 93 — Provider Source Inventory: Travelport Stays and Sabre Workflows

**Submitted/reviewed:** 28 October 2026. The URLs below were supplied by the product owner and are retained as research sources. A URL in this list does not prove current version status, API entitlement, market coverage, production approval, or successful payload validation.

## Travelport Stays (21 supplied URLs)
1. [https://developer.travelport.com/docs/stays](https://developer.travelport.com/docs/stays)
2. [https://developer.travelport.com/docs/stays/general/stays-api-release-notes](https://developer.travelport.com/docs/stays/general/stays-api-release-notes)
3. [https://developer.travelport.com/docs/stays/general/common-stays-api-headers](https://developer.travelport.com/docs/stays/general/common-stays-api-headers)
4. [https://developer.travelport.com/docs/stays/general/stays-api-endpoints](https://developer.travelport.com/docs/stays/general/stays-api-endpoints)
5. [https://developer.travelport.com/docs/stays/general/trace-and-transaction-ids](https://developer.travelport.com/docs/stays/general/trace-and-transaction-ids)
6. [https://developer.travelport.com/docs/stays/general/stays-api-error-messaging](https://developer.travelport.com/docs/stays/general/stays-api-error-messaging)
7. [https://developer.travelport.com/docs/stays/guides/stays-general-guide](https://developer.travelport.com/docs/stays/guides/stays-general-guide)
8. [https://developer.travelport.com/docs/stays/guides/stays-search-guide](https://developer.travelport.com/docs/stays/guides/stays-search-guide)
9. [https://developer.travelport.com/docs/stays/guides/passive-segments-guide](https://developer.travelport.com/docs/stays/guides/passive-segments-guide)
10. [https://developer.travelport.com/docs/stays/guides/migration/stays-search-v11-to-search-complete](https://developer.travelport.com/docs/stays/guides/migration/stays-search-v11-to-search-complete)
11. [https://developer.travelport.com/docs/stays/guides/migration/uapi-to-stripservices-stays-api](https://developer.travelport.com/docs/stays/guides/migration/uapi-to-stripservices-stays-api)
12. [https://developer.travelport.com/docs/stays/guides/migration/galileo-web-services-to-stays-json-api](https://developer.travelport.com/docs/stays/guides/migration/galileo-web-services-to-stays-json-api)
13. [https://developer.travelport.com/docs/stays/use-cases/searching-for-stays/search-by-airport](https://developer.travelport.com/docs/stays/use-cases/searching-for-stays/search-by-airport)
14. [https://developer.travelport.com/docs/stays/use-cases/searching-for-stays/return-additional-search-results](https://developer.travelport.com/docs/stays/use-cases/searching-for-stays/return-additional-search-results)
15. [https://developer.travelport.com/docs/stays/use-cases/booking-stays/book-single-or-multiple-rooms](https://developer.travelport.com/docs/stays/use-cases/booking-stays/book-single-or-multiple-rooms)
16. [https://developer.travelport.com/docs/stays/use-cases/booking-stays/retrieve-reservation-details](https://developer.travelport.com/docs/stays/use-cases/booking-stays/retrieve-reservation-details)
17. [https://developer.travelport.com/docs/stays/use-cases/modifying-reservations/cancel-a-reservation](https://developer.travelport.com/docs/stays/use-cases/modifying-reservations/cancel-a-reservation)
18. [https://developer.travelport.com/docs/stays/tutorials/search-complete-api-object-model](https://developer.travelport.com/docs/stays/tutorials/search-complete-api-object-model)
19. [https://developer.travelport.com/docs/stays/workflows](https://developer.travelport.com/docs/stays/workflows)
20. [https://developer.travelport.com/docs/stays/faq](https://developer.travelport.com/docs/stays/faq)
21. [https://developer.travelport.com/docs/stays/stays-glossary](https://developer.travelport.com/docs/stays/stays-glossary)

### Travelport findings and source handling
- Main overview currently identifies Stays API v11; the general guide documents the SearchComplete v12 search path alongside v11 booking operations.
- Pages differ in rollout phrasing for SearchComplete; confirm release notes and access-group availability before selecting it for production.
- Current general guide documents OAuth, access group, trace/correlation IDs, search/availability pagination, Create Reservation, multiple room booking, retrieval and cancellation.
- Some pages returned HTML documentation; others were served as Markdown content unsupported by the browsing renderer. This is a rendering limitation, not evidence that the page is invalid. The IDE agent should fetch the actual content through an approved method and record the current schema artifact.

## Sabre workflows supplied by owner (20 URLs)
1. [https://developer.sabre.com/guide/air-booking/air-booking.html](https://developer.sabre.com/guide/air-booking/air-booking.html)
2. [https://developer.sabre.com/guide/lcc-booking/lcc-booking.html](https://developer.sabre.com/guide/lcc-booking/lcc-booking.html)
3. [https://developer.sabre.com/guide/api-specific-samples/api-specific-samples.html](https://developer.sabre.com/guide/api-specific-samples/api-specific-samples.html)
4. [https://developer.sabre.com/guide/air-extras-search-and-book/air-extras-search-and-book.html](https://developer.sabre.com/guide/air-extras-search-and-book/air-extras-search-and-book.html)
5. [https://developer.sabre.com/guide/auto-price-air-exchange/auto-price-air-exchange.html](https://developer.sabre.com/guide/auto-price-air-exchange/auto-price-air-exchange.html)
6. [https://developer.sabre.com/guide/end-to-end-exchanges-workflows/end-to-end-exchanges-workflows.html](https://developer.sabre.com/guide/end-to-end-exchanges-workflows/end-to-end-exchanges-workflows.html)
7. [https://developer.sabre.com/guide/issue-air-ticket/issue-air-ticket.html](https://developer.sabre.com/guide/issue-air-ticket/issue-air-ticket.html)
8. [https://developer.sabre.com/guide/issue-electronic-miscellaneous-documents-for-air-extras-and-paid-seats/issue-electronic-miscellaneous-documents-for-air-extras-and-paid-seats.html](https://developer.sabre.com/guide/issue-electronic-miscellaneous-documents-for-air-extras-and-paid-seats/issue-electronic-miscellaneous-documents-for-air-extras-and-paid-seats.html)
9. [https://developer.sabre.com/guide/get-ancillaries/get-ancillaries.html](https://developer.sabre.com/guide/get-ancillaries/get-ancillaries.html)
10. [https://developer.sabre.com/guide/modify-passenger-name-record/modify-passenger-name-record.html](https://developer.sabre.com/guide/modify-passenger-name-record/modify-passenger-name-record.html)
11. [https://developer.sabre.com/guide/post-booking-transaction/post-booking-transaction.html](https://developer.sabre.com/guide/post-booking-transaction/post-booking-transaction.html)
12. [https://developer.sabre.com/guide/reserve-air-seats/reserve-air-seats.html](https://developer.sabre.com/guide/reserve-air-seats/reserve-air-seats.html)
13. [https://developer.sabre.com/guide/sabremosaic-distribution-partnerships/sabremosaic-distribution-partnerships.html](https://developer.sabre.com/guide/sabremosaic-distribution-partnerships/sabremosaic-distribution-partnerships.html)
14. [https://developer.sabre.com/guide/sessionless-and-session-tokens/sessionless-and-session-tokens.html](https://developer.sabre.com/guide/sessionless-and-session-tokens/sessionless-and-session-tokens.html)
15. [https://developer.sabre.com/guide/new-distribution-capability-ndc/new-distribution-capability-ndc.html](https://developer.sabre.com/guide/new-distribution-capability-ndc/new-distribution-capability-ndc.html)
16. [https://developer.sabre.com/guide/seat-map/seat-map.html](https://developer.sabre.com/guide/seat-map/seat-map.html)
17. [https://developer.sabre.com/guide/rail-reservation/rail-reservation.html](https://developer.sabre.com/guide/rail-reservation/rail-reservation.html)
18. [https://developer.sabre.com/guide/data-services/data-services.html](https://developer.sabre.com/guide/data-services/data-services.html)
19. [https://developer.sabre.com/guide/api-first/api-first.html](https://developer.sabre.com/guide/api-first/api-first.html)
20. [https://developer.sabre.com/product-collection/mcp-server/1.0/index.html](https://developer.sabre.com/product-collection/mcp-server/1.0/index.html)

## Additional current official references checked during Stage 27
- [Sabre New to Sabre / modern Mosaic air workflows](https://developer.sabre.com/product-collection/new-to-sabre/v1/help-documentation/guides.html)
- [Sabre NDC collection](https://developer.sabre.com/product-collection/new-distribution-capability-ndc/v1/index.html)
- [Sabre PNR Collection](https://developer.sabre.com/product-collection/passenger-name-record-pnr-collection/v1/index.html)
- [Sabre Stateless Seats API](https://developer.sabre.com/rest-api/stateless-seats-api/1.4)
- [Sabre Content Services Rail API v2](https://developer.sabre.com/rest-api/content-services-rail/v2/index.html)
- [Sabre MCP Server setup and configuration](https://developer.sabre.com/product-collection/mcp-server/1.0/help-documentation/setup.html)
- [Sabre Developer Hub recent API updates](https://developer.sabre.com/)

## Official evidence anchors reviewed
- Travelport Stays guide explains v11 search -> availability -> reservation, with optional details/rules, and says SearchComplete v12 combines search/details/availability. See https://developer.travelport.com/docs/stays/guides/stays-general-guide.
- Travelport current headers page documents OAuth 2.0, 24-hour access token validity, required access group and common headers. See https://developer.travelport.com/docs/stays/general/common-stays-api-headers.
- Travelport trace guidance distinguishes v11 `TraceId` from v12 `TVP-Trace-Id` and says `transactionId` is not consistently returned and is not for customer use. See https://developer.travelport.com/docs/stays/general/trace-and-transaction-ids.
- Sabre current Mosaic guide documents Flight Shop -> Flight Check -> Create Booking -> Fulfill Flight Tickets, with Flight Reshop for optional exchange offers; LCC has additional mandatory data and immediate-fulfillment expectations. See https://developer.sabre.com/product-collection/new-to-sabre/v1/help-documentation/guides.html.
- Sabre Rail guide documents Search -> terms -> prebook -> read/PNR sync -> book/confirm -> travel documents, with distinct cancel/void/refund/exchange processes. See https://developer.sabre.com/guide/rail-reservation/rail-reservation.html.
- Sabre MCP setup separates Try it Out (search only) from CERT full capabilities and ordered/provisioned PROD access; tokens expire after seven days per current setup guide. See https://developer.sabre.com/product-collection/mcp-server/1.0/help-documentation/setup.html.

## Interpretation rule
Only documented facts are labelled as provider behavior. Travelar canonical fields, UI decisions, state names, retry rules and acceptance tests are Travelar design requirements and may not be represented as supplier schema facts. Provider schemas must be imported/generated from an exact current API reference or approved OpenAPI/JSON Schema artifact and checked against provider-entitled fixtures.
