# 08 — Train, Ferry and Bus Integration Research

> **Stage 14 product-scope clarification (24 October 2026):** Train and Experiences are first-class Travelar modes, not future modes. Their requirements belong in the current product, architecture, integration and test baseline. Per-country activation may remain gated until authorized suppliers, contracts, ticket/voucher flows and support/refund handling are verified. See `40-train-and-experiences-first-class-mode-research.md`.

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Evidence cut-off:** 23 October 2026

## 1. Executive conclusion

The bus, ferry and rail modes should share Travelar's normalized booking lifecycle but must not be treated as a single inventory technology.

- **Bus** requires route-segment-aware seat inventory and Tanzania-specific alignment with LATRA-approved e-ticketing processes. A seat map alone does not solve overlapping trip segments; one original trip contains multiple independently sellable origin-destination segments.
- **Ferry** should allocate capacity by vessel class, cabin/seat type only if the operator contract requires it, and port-pair/sailing rather than by bus-style seat map by default. Capacity rules, passenger manifests, vessel changes and route jurisdiction must be confirmed with each operator.
- **Train** official consumer websites demonstrate that online bookings exist, but not that third parties may create or cancel orders through a production API. Redirect, affiliate/agency, inventory-API and authorized ticket-issuing access are distinct partnership levels.

## 2. Tanzania bus ticketing and LATRA/Safari Tiketi

### 2.1 What primary evidence establishes

LATRA's October 2026 public statement names 14 online-ticketing providers whose systems have connected with Safari Tiketi. The list includes Busbora, Otapp Agency Company, Abood Bus Service, Duarani Innovate, Shabiby Transporters, Hashtech Tanzania, Iyishe, Voltic Tanzania, Web Corporation Tanzania, Mkombozi Infotech, Itule Company, Sepa Tech, Logix and Global Light & Company. This list includes both technology-provider and transport-operator names; it should not be treated as a list of 14 independent, interchangeable consumer OTAs.

LATRA's 2024 Online Ticketing Regulations prescribe an authorization and technical-compliance framework, including integration with government systems and the electronic revenue-management system, interoperability/security requirements, and operational obligations. LATRA previously warned that an online ticketing system must be approved and operators must use approved systems; the October 2026 connection announcement does not, by itself, disclose each provider's current certificate validity, API access scope, commercial terms or permission to sublicense access to Travelar.

Primary sources:
- LATRA, October 2026 connected-provider report: https://www.latra.go.tz/news/safari-tiketi-enhances-travel-assurance
- LATRA, Online Ticketing Regulations 2024 PDF: https://www.latra.go.tz/uploads/documents/sw-1728393485-renamed%20kanuni%20za%20tiketi%20mtandao.pdf
- LATRA, warning on approved online-ticketing systems: https://www.latra.go.tz/news/prof-kahyarara-aitaka-latra-kuhakikisha-kampuni-za-tiketi-mtandao-zinaunganisha-mifumo-yao-na-ya-serikali


### 2.2 Bus integration routes to evaluate

| Route | Who remains system of record? | What Travelar needs | Key advantage | Principal risk |
|---|---|---|---|---|
| **A. Travelar/OIMS becomes the operator's primary operating/ticketing system** | Travelar/OIMS for agreed operating data; regulatory authority remains authoritative for regulatory records where applicable. | Relevant authorization, provider/operator approval, integration/certification, OIMS workflow, support, reporting, fiscal integration and contractual arrangements. | Deep control over fleet, routes, fares, seat inventory, counter sales and customer experience. | Largest compliance and operations burden; must not imply regulator approval until granted. |
| **B. Integrate to an operator's existing system** | Operator's legacy vendor/system for agreed records; Travelar maintains its customer-facing booking/order mirror and reconciliation references. | API agreement, capability discovery, mapping, inventory reservation/commit semantics, ticketing, cancellation, callbacks, test credentials and data rights. | Avoids forcing migration; fits mature operators. | Different vendor schemas and semantics; stale availability and duplicate booking risk if no authoritative commit protocol. |
| **C. Distribute through an approved provider** | Approved provider/operator system for regulated booking/ticket records; Travelar stores distribution order and cross-references. | Authorized distribution contract, access scope, commission/attribution terms, permitted branding/content, support split, refund/settlement and data-processing terms. | Potentially fastest path to market without being sole system owner. | Dependence on provider, margin and data limits, unclear channel attribution or service obligations. |
| **D. Redirect/referral only** | Provider's website/system. | Written affiliate/referral rights and tracking terms. | Lower integration burden. | Travelar does not control inventory hold, checkout, ticket issuance or complete journey; must disclose third-party checkout accurately. |

### 2.3 Questions for LATRA and candidate providers

1. What is the current certificate/authorization status of each candidate and what activity does it authorize?
2. May an approved provider distribute inventory through an unrelated marketplace, and can it authorize a white-label/embedded checkout? Which sublicensing clauses apply?
3. Is there a public specification, partner API, or certification pack for route/fare searches, seat maps, origin-destination availability, bookings, tickets, manifests, cancellation and payment reconciliation?
4. Which party owns ticket numbering and the final ticket record? Is there an authoritative verify-ticket service and what response/status codes exist?
5. How must EFD/fiscal receipts and any regulatory fee/remittance be recorded? Which system emits the fiscal document?
6. If a payment is verified but the provider's booking/fiscal submission times out, what is the reconciliation endpoint or manual exception process?
7. How are schedule changes, replacement vehicles, departure closure, partial route closures, ticket reprints, refunds and duplicated tickets represented?
8. What data can Travelar store/cache/export? What passenger data must be submitted, how long retained, and who can see it?
9. What sandbox, conformance tests, security review, production cutover and annual renewal are needed?
10. What happens to future travel bookings and ticket lookup if Travelar/provider contracts end?

### 2.4 Segment-based bus inventory requirements

For trip route `Dar es Salaam → Morogoro → Dodoma → Iringa → Mbeya`, selling a passenger's journey from Morogoro to Iringa consumes the same physical seat over the route interval between those stops. Seat availability must therefore be checked against overlapping route intervals, not only whether the seat is sold for the entire origin-to-terminal trip.

Minimum logical requirements:

- Ordered, versioned stop sequence with stable stop IDs and effective time windows.
- Fare lookup for origin/destination pairs, including contract-defined passenger/fare classes.
- Seat availability for a requested segment.
- Atomic reservation of a seat for the segment set, with a hold expiry and idempotent commit path.
- Conflict protection for concurrent bookings whose intervals overlap on the same seat.
- Explicit rule for non-overlapping segments: the same seat may be sold for disjoint journey intervals only when the schedule/seat continuity is physically valid and the operator's policy permits it.
- Trip schedule, seat-layout or route-version changes must not silently remap confirmed ticket terms. Affected bookings need an exception workflow.
- Full-trip and boarding-segment manifests, with access restricted to authorized operational roles.
- Counter and agent bookings must use the same authoritative inventory transaction rather than a separate spreadsheet or offline counter balance.

**Validation design:** create a concurrent test in which two users try to book the same seat for overlapping intervals; exactly one commit should succeed. Also test two non-overlapping segments; the system may accept both only if the operator's rules allow it. Run the tests against the chosen supplier's actual hold/commit semantics, not just Travelar's mock implementation.

## 3. Ferry integration: Tanzania and cross-channel operation

### 3.1 What has been verified

Azam Marine's official public site advertises travel between Dar es Salaam, Zanzibar, Pemba and Tanga, and provides a booking route. That proves the consumer booking channel exists, not that Travelar has permission or a technical means to access the same inventory. The public evidence reviewed did not establish a third-party partner API or a transferable reseller/ticket-issuance right.

Source: https://azammarine.com/ (booking and route information; official site; accessed 23 October 2026).

### 3.2 Ferry-specific due diligence

Ask the operator to provide:

- Service routes, ports, schedules, sailing identifiers, direction, check-in/boarding cutoffs, and delay/cancellation procedures.
- Vessel registry/approval and any authority-specific permissions relevant to the marketed sailing; clarify which Mainland Tanzania and Zanzibar rules apply to the actual endpoint/route and Travelar's distribution role.
- Vessel class definitions, capacity per class, fare category rules, child/infant and residence conditions, taxes/fees, document requirements, and currency.
- Availability semantics: class quota, inventory allocation or confirmation-on-request; how temporary holds and payment deadlines operate.
- Confirmation and ticket documents, QR/barcode validation, manifest submission and ticket lookup/validation interfaces.
- Vessel substitution, sailing cancellation, port closure, missed boarding, passenger transfer, partial refunds, rescheduling and compensation policy.
- Settlement model, collection authority, agent commission, reconciliation file, chargebacks, cash/branch sales attribution, and payment failure handling.
- Permitted distribution channels, logos/content use, API rate limits, support contacts, service SLA and business continuity.

### 3.3 Capacity model to validate

For ferries, the default inventory aggregate should be **sailing × vessel version × passenger class × eligible quota**, with finer sub-inventory only when the operator sells cabins, numbered seats or reserved spaces. A class-capacity booking must decrement the same authoritative capacity as the operator's website, counters and agents. A bus seat-map implementation must not be reused simply because both products represent passengers.

Concurrency requirements:

- No class capacity can be overbooked by concurrent checkouts.
- Holds expire consistently and free their capacity safely.
- Confirmed payment after a hold expires enters an exception/reconciliation path; it must not silently create an over-capacity ticket.
- Vessel substitution carries forward booking entitlement only under agreed equivalence rules; class mapping and customer notice must be explicit.
- Offline boarding scans synchronize with duplicate detection. Offline state must not become permission to oversell capacity.

### 3.4 Ferry go-live gate

No Travelar ferry route should be marked “integrated” until the operator authorizes the distribution role, booking is confirmed against the operator's authoritative source, the issued ticket validates through the operator's accepted mechanism, and the test suite passes cancellation, disruption, duplicate event and refund reconciliation scenarios.

## 4. Rail: Tanzania SGR and Kenya Madaraka Express

### 4.1 Tanzania SGR

TRC's official SGR ticketing website presents online search fields for one-way/return, departure and destination stations, travel dates and passenger counts: https://sgrticket.trc.co.tz/. The official TRC-SGRTicket mobile-app listing describes ticket purchase, seat choice, route information and ticket history: https://play.google.com/store/apps/details?id=tz.co.trc.sgrticket.

**Verified:** TRC maintains official electronic consumer ticketing channels.  
**Not established:** the reviewed public information does not establish a general third-party OTA API, commercial reseller agreement, agent seat quota, or production ability for Travelar to issue ticket documents.

Request a written TRC distribution/API response covering station/route inventory, class/fare rules, passenger data, ticket issuance/QR validation, capacity locking, booking windows, payments, receipts, cancellations/refunds, group sales, service disruption, data rights and onboarding requirements.

### 4.2 Kenya Madaraka Express

Kenya Railways' official FAQ says passengers can book online through its ticketing platform, at a station counter, and through Safaricom USSD `*639#`. It also states passengers can book up to 60 days ahead, with group bookings of more than 20 passengers following a different lead time, and uses a QR code ticket at the station gates. See: https://krc.co.ke/madaraka-express-faq/.

**Verified:** official booking channels include web, counter and a specified USSD solution; ticket QR codes participate in the boarding process.  
**Not established:** a production partner API or any authorization for Travelar to make third-party bookings through the same system.

Questions for Kenya Railways: Are third-party reseller/agency agreements offered? Is there a published or partner-only API? Are partner bookings allocated inventory or drawn from common inventory? What is the payment, ticket validation, refund and customer data process? Can an agent operate legally under an appointed contract, and what consumer-facing disclosures are required?

### 4.3 Rail integration alternatives

| Alternative | Customer experience | Travelar control | Rule before choosing |
|---|---|---|---|
| Authorized production API | Native search and checkout, subject to partner scope | High within contract/API | Written authorization, sandbox, ticketing agreement and complete after-sales access. |
| Officially appointed reseller/agency | Travelar-branded assisted or embedded experience may be possible | Medium | Contract specifies how booking is placed, ticket issued, funds collected, commission calculated and refunds handled. |
| Official link/deep link | User completes purchase on railway-owned channel | Low | Written permission/affiliate terms if required; clearly tell customer checkout is outside Travelar. |
| Scraping or scripted automation of consumer website | Looks native but bypasses partner controls | Unreliable/unauthorized | **Do not use as an integration strategy.** Only a documented, authorized interface should be used for production booking. |

## 5. Minimum shared adapter interface for bus, ferry and rail

A normalized Travelar domain API should express concepts, while adapters preserve supplier-specific semantics. Candidate operations (logical, not claimed external endpoints):

- `searchTrips(criteria)`
- `getOfferDetails(externalOfferRef)`
- `revalidateOffer(externalOfferRef)`
- `holdInventory(offer, passengers, idempotencyKey)` where supported
- `confirmReservation(holdOrOfferRef, paymentOrGuaranteeRef)`
- `retrieveReservation(externalReservationRef)`
- `getTicketDocuments(externalReservationRef)`
- `cancelOrChange(externalReservationRef, request)`
- `getCancellationQuote(externalReservationRef)` where supported
- `lookupTicketForValidation(ticketCredential)` under role-limited authorization
- `reconcileTransactions(rangeOrCursor)`

Each implementation must declare capabilities rather than fake endpoint parity, e.g. `supportsHold`, `supportsPartialCancellation`, `supportsTicketLookup`, `supportsOfflineValidation`, `supportsRefundQuote`, `supportsSegmentFares` and `supportsSettlementReport`. Use explicit error mapping for unavailable inventory, stale price, policy rejection, timeout/unknown state, provider outage, duplicate request and unauthorized operation.

## 6. Launch blockers and direct confirmations

| Priority | Question | Contact | Required evidence |
|---|---|---|---|
| P0 | Which LATRA-approved provider is permitted to distribute inventory through Travelar, and can it expose the needed APIs? | LATRA + provider | Current approval scope, technical/API documentation, signed contract, test/production credentials. |
| P0 | May OuterBlocks operate its own e-ticketing system, or must it integrate through an approved provider? | LATRA | Written classification and applicant/certification checklist. |
| P0 | Who owns official ticket issuance, fiscal reporting, payment remittance and ticket validity on an operator integration? | LATRA/provider/operator | End-to-end business process, conformance tests and contractual RACI. |
| P0 | Is there a licensed ferry reseller/API route and what authorities apply to specific routes including Zanzibar? | Operator + TASAC + relevant Zanzibar authority/counsel | Written activity/jurisdiction classification and operator permission. |
| P1 | Can Travelar obtain a third-party API or appointed reseller role with TRC? | TRC | Partner policy, commercial/technical pack, ticket/fare rules. |
| P1 | Can Travelar obtain a third-party API or appointed reseller role with Kenya Railways? | Kenya Railways | Partner policy, test access, commercial/technical pack. |
| P1 | Are direct operator systems mature enough for API integration, and what source of truth is authoritative? | Selected operators/vendors | System map, endpoint contract, sample traffic/data, operator-approved test. |

## 7. Research status

**Verified through primary sources:** existence of LATRA's connected-provider ecosystem and 2024 regulation; TRC online ticketing interface; Kenya Railways' official online/counter/USSD channels and QR-ticket guidance; Azam Marine public booking site.  
**Preliminary:** candidate adoption paths and logical inventory design.  
**Unknown / direct confirmation required:** all Travelar-specific provider access, authorization, commercial terms, production credentials and exact after-sales scope.
