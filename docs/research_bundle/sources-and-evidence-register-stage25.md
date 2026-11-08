# Stage 25 Sources and Evidence Register

**Checked:** 28 October 2026  
**Policy:** Official documentation supports product/API facts. Travelar requirements and proposed architecture are labeled as such; availability in a vendor's public docs does not prove contract entitlement or production access.

## Travelar-owned design requirements

Documents 76–82 are target-state product/engineering specifications derived from Travelar's existing requirements and the questions raised by the product owner. They are not claims that code exists. The IDE agent must reconcile them against the repository, preserve sound implementation, and record accepted decisions/unknowns before material changes.

## ClickPesa official documentation

| Source | Evidence to use | Important limitation |
|---|---|---|
| https://docs.clickpesa.com/bill-pay/bill-pay-overview | BillPay control-number concepts; available collection channels; dashboard/API and webhook/status lookup | Does not alone establish a specific Travelar tariff, expiry race behavior, marketplace split settlement or regulatory acceptability. |
| https://docs.clickpesa.com/tan-qr/tan-qr-overview | TanQR/Lipa Namba collection; customer enters amount; distinct from payout API | Amount-specific or automated QR flow is a support-confirmation question. |
| https://docs.clickpesa.com/crdb-direct-debit/crdb-direct-debit-overview | CRDB account mandate, scheduled recurring debit and mandate lifecycle | Do not assume it is a suitable one-off travel checkout method or that activation is enabled for Travelar. |
| https://docs.clickpesa.com/payout-api/mobile-money-payout-api/mobile-money-payout-api-overview | Preview, balance, create payout, status query; TZS recipient behavior and stated 60-second create cooldown | Confirms documented provider behavior, not that its payout rail meets LATRA's “real time” interpretation or Travelar's funds-flow/legal model. |
| https://docs.clickpesa.com/payout-api/lipa-namba-payout-api/lipa-namba-payout-api-overview | Pay another recipient's Lipa Namba/TanQR; preview validates destination/name/fee/balance; accepted and final status distinction; stated 60-second create cooldown | Does not equal collection to Travelar's own Lipa Namba. Beneficiary, fee, event and finality details must be contract-tested. |
| https://docs.clickpesa.com/payout-api/bank-payout-api/bank-payout-api-overview | Bank payout behavior and status/settlement details at implementation | Confirm current service levels, fees, throughput and beneficiary rules in writing. |

## Travelport official documentation

| Source | Evidence to use | Important limitation |
|---|---|---|
| https://developer.travelport.com/docs/flights/guides/flights-general-guide | Canonical search → optional price confirmation → reservation → ticket workflow concepts | Exact workflow depends on product, GDS/NDC content and agency entitlement. |
| https://developer.travelport.com/docs/flights/guides/flights-search-guide | Search model, offers, leg/journey workflows | Search result is not a confirmed booking. Cache limits are workflow/product-specific and may change. |
| https://developer.travelport.com/docs/flights/guides/booking-and-reservations/flights-booking-guide | Workbench/booking sequence, held reservation and timing constraints | Use the current official guide and account's supported product version before coding. |
| https://developer.travelport.com/docs/flights/guides/ticketing-guide | Ticketing workflow and payment/commit distinctions | Ticket issuance is distinct from initial reservation; provider semantics must remain visible in internal states. |
| https://developer.travelport.com/docs/flights/general/flights-api-endpoints | Current endpoint list for TripServices | Endpoint inventory isn't entitlement proof. |
| https://developer.travelport.com/docs/flights/ | Flights API guide index and change context | User-supplied URL inventory is stored in `travelport-user-supplied-urls.txt`; do not treat every link as current or required. |

## Sabre official documentation

- https://developer.sabre.com/ — live Developer Hub catalog and latest updates.
- Owner supplied versioned links are collected in `73-provider-reference-url-inventory.md` and related provider inventory files. Verify API product, protocol, version, lifecycle/deprecation, credentials, agency/PCC/contract entitlement and region before coding. A link in the inventory is not proof that it is current or authorized.

## Standards and security references

- OpenAPI Specification: https://spec.openapis.org/oas/ and https://spec.openapis.org/oas/v3.2.1.html. Select a revision compatible with the implemented generator/validator/client ecosystem; generated specs must validate.
- NestJS OpenAPI/Swagger generation: https://docs.nestjs.com/openapi/introduction. Can generate OpenAPI from code decorators and schemas; generated docs still need security and contract review.
- PostgreSQL 18 constraints: https://www.postgresql.org/docs/18/ddl-constraints.html. Use for database-enforced value, relationship and uniqueness rules; application logic alone is not a concurrency guarantee.
- PostgreSQL 18 row-level security: https://www.postgresql.org/docs/18/ddl-rowsecurity.html. RLS must be explicitly enabled/configured and tested; privileged owners/superusers and BYPASSRLS roles can bypass it.
- OWASP API Security: https://api-security.owasp.org/. Includes object-level authorization, authentication, property/function authorization, resource consumption and sensitive business-flow concerns.
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html. Logs need useful context, restricted access, redaction and integrity protection.
- OWASP Secrets Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html. Requires explicit create, rotation, revocation, expiry and leakage controls for API keys/tokens/credentials.

## Current facts verified from official source pages during this stage

- ClickPesa BillPay Overview distinguishes a merchant's static BillPay number from dynamic order control numbers and describes dashboard/API, status query and webhook support. See official page above.
- ClickPesa TanQR/Lipa Namba is a collection method for the merchant; sending funds to a recipient uses a separate Lipa Namba payout product. See official pages above.
- ClickPesa mobile-money payout overview states that preview validates details and the create operation allows one create request every 60 seconds per merchant. Verify again before production because provider limits can change.
- ClickPesa Lipa Namba payout overview states that the API pays other recipients, preview resolves name/fee/balance, creation is asynchronous, and an `AUTHORIZED` result is accepted but not final settlement; it also states a 60-second create cooldown per merchant.
- ClickPesa CRDB Direct Debit is mandate-based for scheduled debits from CRDB accounts and requires customer approval through the CRDB SIM-Banking app.
- Travelport official guides describe different stages for search, booking, ticketing and optional workflows; the booking guide notes that workflow timing/cache limits are product/content-specific.
- Sabre's developer hub is actively updated; verify the current API product/version status rather than coding from an older supplied URL alone.
- OpenAPI's official specification is machine-readable interface description; NestJS `@nestjs/swagger` can generate OpenAPI definitions and Swagger UI/JSON. Generation doesn't replace review/testing.
- PostgreSQL documents constraints and RLS as database facilities, but not as a substitute for correct domain transactions and server-side authorization.

## Confidence labels

- **V (primary-source verified):** directly established in current official documentation linked above.
- **R (Travelar requirement):** user requirement or approved product requirement; not an external factual claim.
- **P (proposed architecture):** a recommended implementation pattern requiring code review and acceptance.
- **U (unknown):** contract, legal interpretation, live entitlement, fee, provider support, local operational procedure or deployment fact not established by the available public documentation.
