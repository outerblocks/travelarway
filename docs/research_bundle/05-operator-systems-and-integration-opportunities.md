# 05 — Operator Systems and Integration Opportunities

**Product:** Travelar  
**Parent company:** OuterBlocks Limited
**Intended operating entity:** OuterBlocks Destinations Limited (formal verification required)  
**Version:** 0.2 — Stage 2 market research  
**Evidence cut-off:** 23 October 2026

## 1. Executive recommendation

Travelar should support **three operator adoption paths from the beginning of its domain design**, even if the first commercial pilot enables only one or two:

1. **Primary OIMS:** an operator uses Travelar to manage schedules, inventory, fares, bookings and counter sales.
2. **Integrated OIMS / existing system:** the operator keeps its current operating software while an authorized adapter exchanges defined data with Travelar.
3. **Distribution-only:** Travelar markets and sells eligible inventory while the operator retains its existing daily processes.

The default should be **not to force migration**. An operator's pre-existing system, a vendor-provided system, its contract, and its actual operational behavior must be discovered before deciding which system is authoritative for routes, seat/capacity inventory, fare, booking, ticket number, manifest, payment and refund records.

In Tanzania, all three paths remain subordinate to LATRA's applicable e-ticketing approval framework. A software adapter or marketplace agreement cannot lawfully bypass the approved ticketing route.

## 2. What existing public materials establish

- LATRA's October 2026 release names 14 provider/transport entities connected to CeTS/Safari Tiketi, including both technology-company names and bus-operator names. [LATRA](https://www.latra.go.tz/news/safari-tiketi-enhances-travel-assurance)
- Busbora describes operator-branded sites, counter ticketing, mobile-money and SMS integration, and says it hosts counter systems at operator offices. [Busbora about](https://busbora.com/about-us)
- Web Corporation describes a web-based bus/ticket management information system, reporting/analysis and mobile apps for operators, agents and customers, with payment and SMS/email notification capabilities. [Web e-Ticketing](https://webtechnologies.co.tz/NEW-WEB/bus-ticket/)
- OTAPP describes online and offline ticketing and several consumer entertainment/travel categories. [OTAPP about](https://www.otapp.co.tz/about-us)
- Shabiby's official help flow shows seat selection, optional boarding-point selection, passenger details and M-Pesa/Tigo Pesa payment. [Shabiby booking help](https://shabiby.co.tz/help/how-do-i-book-a-ticket)
- The public Msafiri booking page advertises seat maps, route/price comparison, mobile-money payment and WhatsApp-like assistance; the advertised 30+ operator count is a provider claim, not independent measurement. [Msafiri](https://sms.msafiri.co.tz/)

This evidence demonstrates that operator software and counter/agent workflows are already offered in the market. It does **not** demonstrate which operator uses which system internally, whether the operator owns the software or data, whether APIs exist, or whether a marketplace can contract to use an inventory feed.

## 3. Operator and system discovery matrix

| Operator/system example | What is publicly evidenced | Likely discovery focus | What is not established |
|---|---|---|---|
| Busbora | Operator management positioning, counter systems, branded sites, payments and SMS. | Data ownership, system hosting, APIs, simultaneous counter/marketplace holds, reports, refunds and exit/export. | Specific operator-level deployment or rights to redistribute each supplier's inventory. |
| Web e-Ticketing | Web ticket management and reporting; operator/agent/customer mobile use. | API and event interfaces, fleet/route/fare schemas, local offline mode, reconciliation exports and SLA. | Whether it is used by a named operator or whether its public capabilities match an individual configuration. |
| OTAPP | Consumer plus online/offline ticketing positioning and other categories. | System-of-record role, operator setup, channel attribution and mode-specific inventory rights. | Production inventory/booking API and operating contracts. |
| Msafiri public booking | Consumer intercity marketplace, exact-seat selection, mobile-money claims and operator comparisons. | Legal supplier entity, how inventory is sourced, ticket issuer, failure handling and refund ownership. | The exact technical relationship between its brand/domain and any LATRA-listed legal entity; production API/white-label rights. |
| Shabiby direct booking | Operator-owned booking/help flow with schedule, seat and boarding-point selections. | Availability/seat lock source, cross-channel counter behavior, ticket validation and payment confirmation. | Integration documentation or permission for Travelar to sell on its behalf. |
| Abood and other connected operator entities | LATRA identifies some operators within its provider/connected list. | Does the operator use an external vendor, owned system, white-label platform or a mixture? Which system is authoritative? | That an operator name in a central list signifies it sells a third-party software product. |
| Small/regional operators without clear public system information | Public evidence insufficient to determine actual daily systems. | Observe bookings, route sheets, counter procedures, cash controls, spreadsheets, messaging and boarding. | Do not classify these operators as “manual,” “unsophisticated” or “underserved” until interviewed. |

## 4. Recommended three-path integration model

### Path A — Travelar as the primary OIMS

**Suitable where:** an operator actively chooses to adopt Travelar as its operating/ticketing system, and all required authorization, certification and production approval requirements are met.

**Core capabilities:** tenant and branch setup; fleet; ordered routes/stops; schedules; bus seat maps; ferry class capacities; fare tables; segment inventory; counter/agent sales; bookings and ticket lifecycle; manifest; boarding validation; refunds/cancellations; shift/branch reconciliation; audit reports; and supplier/marketplace distribution settings.

**Risks:** migration failure, staff resistance, data import errors, temporary parallel operation, missed departures, incorrect fare/inventory setup and insufficient support. Plan a reversible pilot, controlled cutover and reconciliation against the prior system.

### Path B — Connect to an existing operator system

**Suitable where:** the existing vendor/operator permits integration and the system provides supported, contractually available interfaces.

**Design principles:**

- Discover and record the authoritative system for each data object. Do not silently create two competing “truths.”
- Treat the existing ticketing/booking platform as inventory authority where that is what the contract and interface specify.
- Use API or approved event/webhook interfaces where available; batch files can be a temporary bridge only if freshness, reconciliation and duplicate handling are acceptable and expressly agreed.
- Normalize to Travelar's internal domain via a provider adapter. Do not leak vendor-specific status codes and payloads throughout application code.
- Preserve supplier booking IDs, ticket numbers and trace/correlation IDs.
- Implement idempotency and replay detection, timeouts, retry policy, dead-letter/exception queues and daily reconciliation.
- Never infer a ticket is confirmed merely because Travelar's request timed out or the provider accepted an HTTP request.
- Agree who may change the booking, seat, passenger data, refund, fare and schedule, including after disruption.

**Critical gating condition:** a technically possible integration is not the same as a permitted production integration. Confirm LATRA approval scope, contract rights, security review and supplier authorization first.

### Path C — Distribution-only

**Suitable where:** an operator retains its internal processes but authorizes Travelar to sell defined inventory through an approved third-party channel or supply partner.

**Minimum agreed workflow:** schedule/inventory and fare discovery → availability validation/hold if supported → booking submission → authoritative ticket reference/issuance → payment state coordination → manifest/boarding status if shared → cancellation/refund and reconciliation.

If the supplier only permits a referral or external handoff, label it as such. Do not promise real-time seats, embedded checkout, instant ticketing or refund control without evidence that the partner interface and contract support them.

## 5. Object-level system-of-record matrix

This matrix is an initial design template, not a claim about current vendors. Complete it per operator during onboarding.

| Data object | Possible authority | Travelar rule until agreed | Minimum reconciliation |
|---|---|---|---|
| Legal operator, licence and route authority | Operator/regulator records | Store evidence and expiry/status; do not manufacture regulatory status. | Periodic document/status review. |
| Fleet and vehicle/vessel details | Operator's designated fleet system plus authoritative registration/licence evidence | Changes require authorized operator role; regulatory facts need evidence. | Compare active fleet and licence dates. |
| Route/stops and schedule | Operator system or Travelar OIMS in primary-OIMS model | One named authority per field/configuration version. | Daily/each update diff; alert on changes affecting bookings. |
| Fare and fare-effective period | Authorized operator fare source and applicable regulatory fare rules | Server-side quote must use effective-dated validated values. | Fare-change audit and price-to-ticket comparison. |
| Seat map / segment inventory | Ticketing system agreed to be authoritative | Never sell from stale cache alone; temporary holds and confirmations are system-of-record-specific. | Reconcile active seat/segment occupancy and external booking IDs. |
| Ferry class capacity | Vessel/operator's authoritative capacity configuration and the inventory system | No numbered-seat logic; enforce capacity per class and sailing. | Count sold/held/confirmed/refunded passengers by class. |
| Booking state | System that issues/controls the ticket under the contract | Maintain external booking ID and explicit transition mapping. | Compare pending/confirmed/cancelled tickets to provider. |
| Ticket number/QR/reference | Authoritative ticket issuer | Never generate a counterfeit-looking issuer number as a substitute for provider-issued ticket. Travelar internal IDs remain distinct. | Verify ticket state and issuer reference. |
| Passenger manifest | Official operator/ticketing record as required | Use minimal required passenger data; synchronized corrections must be auditable. | Pre-departure manifest comparison and change log. |
| Payment transaction | PSP/payment acquirer | PSP verification and reconciliation own evidence of payment; not a browser redirect. | PSP settlement file/API versus internal ledger. |
| Refund/cancellation | Contract-defined actor plus ticket issuer and PSP | One owner coordinates the state transitions; never mark refunded before PSP/provider proof. | Refund request, supplier action, PSP result, ledger entry. |
| Revenue, commission and settlement | Travelar finance ledger with contract calculation; PSP and supplier statements as external evidence | Immutable event history, versioned contract and double-entry ledger. | Booking–PSP–supplier–ledger three-way match. |
| Staff and permissions | Operator's identity/role administration within tenant; Travelar identity system for Travelar staff | Federated identity only by approved design; no inherited cross-tenant powers. | Recurring access and branch/tenant review. |

## 6. Integration capability checklist

For every prospective provider, mark `Verified`, `Contracted`, `Tested in sandbox`, `Tested in production`, `Unsupported`, or `Unknown`. Do not use one overall “API ready” label.

### Inventory and selling

- Operator, route, stop, departure and fare discovery.
- Seat maps, seat identifiers and availability semantics (bus); class capacity and limits (ferry).
- Segment/origin-destination pricing, if applicable.
- Inventory holds: duration, renewal, release, race semantics and cross-channel lock visibility.
- Booking create/retrieve/change/cancel.
- Ticket issuance, resend, verification and issuer reference.
- Passenger field rules and validation.
- Schedule changes, vehicle/vessel substitutions, delays and cancelled departures.

### Commercial and financial

- Contracted commission or net/gross price basis.
- Discount/promotional ownership and who funds discounts.
- Who is merchant of record or collection agent.
- PSP choices and supported payment states.
- Supplier settlement currency, timing, payout account and reconciliation format.
- Cancellation/refund rights, amount calculation, fees, SLA and decision owner.
- Chargeback evidence and dispute ownership.
- Cash/counter sales reporting, shift controls and fiscal evidence.

### Technical and operational

- Versioned API specification and sandbox credentials.
- Authentication, tenant-scoped credentials, key rotation and least privilege.
- Request IDs, idempotency keys, event signatures and replay behavior.
- Rate limits, availability/SLA, error codes and maintenance windows.
- Webhook retry schedule, event ordering and duplicate delivery.
- Status query and recovery after timeout/ambiguous response.
- API schema change process, backward compatibility, deprecation notice.
- Data fields, retention, deletion/export, subprocessor list and security incident reporting.
- Production support contacts, severity definitions and escalation path.
- Backup, manual fallback and reconciliation during outage.
- Contract termination, transition, ticket continuity and data export.

## 7. Bus segment inventory: operator validation cases

Travelar's required segment-aware design needs more than a seat map. Before production, pilot the following against each operator's actual policy and system:

1. A vehicle departs Dar es Salaam and calls at Morogoro, Dodoma and Iringa before Mbeya. Book Dar–Dodoma, Morogoro–Iringa and Dodoma–Mbeya at once where fares are permitted.
2. Attempt overlapping journeys that use the same seat on different parts of the route. The same seat may be reused on non-overlapping segments but not for overlapping passenger occupancy.
3. Attempt a second booking for an occupied/held overlapping segment under high concurrency; exactly one conflicting allocation must win.
4. Verify that fare depends on the booked origin/destination pair and effective fare table, not just the vehicle's original/final stops.
5. Exercise expiry, payment timeout, failed payment, late verified payment and cancellation with the source system's authoritative state.
6. Change an intermediate stop, route or vehicle after bookings exist. Require impact assessment, passenger notification, new allocation/manifest treatment and auditable approvals.
7. Generate a full trip manifest and a segment-specific boarding/drop-off list without exposing unrelated passengers' data to unauthorized staff.

## 8. Ferry capacity validation cases

For ferries, configure sailing, vessel, class and capacity; do not assume numbered passenger seats. Test concurrent requests against class capacity, temporary hold expiry, child/adult fare rules, residence fares only where lawful and supported, ID requirements, ticket manifest, class substitution and vessel substitution. Verify whether inventory is held at Travelar or the provider and reconcile after every ambiguous response.

## 9. Operator onboarding and migration playbook

1. **Qualification:** identify legal entity, license evidence, services/routes, operating countries, owner/contact and requested sales channels.
2. **System discovery:** observe actual counter and boarding workflows; inventory all spreadsheets, devices, messaging, vendor accounts and official systems.
3. **Commercial and authority checks:** confirm whether the operator is authorized for routes/vehicles and which ticketing provider it may use; establish sales, commission, settlement and data rights.
4. **Data mapping:** route/stop identifiers, time zones, local calendars, fares, seat layouts, passengers/manifest fields, ticket IDs and status enums.
5. **Security:** verify staff identities/roles, tenant separation, operator support rights, secret handling, data minimization, audit and device controls.
6. **Test configuration:** import routes/fleet and reconcile sample schedules/fares with signed-off operator information.
7. **Sandbox certification:** run booking, cancellation, payment failure, concurrency, manifest, reconciliation and outage tests.
8. **Shadow operation:** compare Travelar and the authoritative system without selling duplicate inventory; resolve all mismatches.
9. **Controlled pilot:** explicitly named routes, offices, users, dates and support owners; daily financial and ticket reconciliation.
10. **Production approval:** record external approvals, contract signed, test evidence, operational runbook and rollback decision.
11. **Scale or exit:** expand only on measured criteria; keep documented data export, contractual termination and ticket continuity plan.

## 10. Interview questions for operator research

- What software is actually used by each branch, counter, agent and boarding team? Which part is paper, spreadsheet, phone or messaging?
- Who owns the software, data, code and hosting? What happens on contract termination?
- Which platform creates the official ticket and manifest? How can a passenger verify the ticket?
- How are schedules and fare changes synchronized across channels? Who approves changes?
- Can the same vehicle seat be sold for different non-overlapping segments? What rules prevent overlapping bookings?
- What is the busiest period? How many bookings are searched/attempted/confirmed per minute at peak?
- How do cashiers close shifts, handle cash/mobile-money receipts, voids, refunds and reprints?
- What happens when payment is successful but the ticketing platform is unavailable?
- What are the actual reasons for customer complaints and staff escalations, and what evidence supports the frequency?
- What does the operator want Travelar to improve, and what would the operator refuse to change?
- Would the operator pay a software fee, a marketplace commission, or use a mixed contract? Under which measurable conditions?
- Which passenger data fields are required by law, the operator and the ticket issuer respectively?
- What API, export or bulk-report access does the current vendor contract allow?

Record answers with date, respondent role, evidence attached, contradictions and confidence rating. Do not attribute a single interview's experience to the whole market.

## 11. Product implications for OIMS architecture

- Implement tenant/organization boundaries as core domain rules, not merely UI filters.
- Separate **booking source** (Travelar website/app, Travelar agent, Travelar call center, operator counter, operator website, third-party channel) from **ticket issuer**, **system of record**, **payment collection channel** and **commission eligibility**.
- Version inventory/fare/configuration changes and preserve historical values referenced by issued tickets and accounting events.
- Keep internal booking IDs distinct from partner/provider IDs, ticket issuer numbers and PSP transaction IDs.
- Adapters declare capabilities at the per-operation level (e.g. supports-seat-hold, supports-segment-search, supports-refund, supports-webhook); do not assume every provider supports the same interface.
- Provide reconciliation and exception queues as primary operational features, not an afterthought.
- Avoid making OIMS's existence imply Travelar is authorized to issue tickets; production enablement must depend on explicit country, operator and ticketing-system approvals.

## 12. Sources and evidence limitations

- [LATRA, connected provider update, 8 Oct 2026](https://www.latra.go.tz/news/safari-tiketi-enhances-travel-assurance)
- [LATRA, approved-system notice, 2 Feb 2026](https://www.latra.go.tz/news/latra-gives-bus-operators-14-days-to-adopt-approved-e-ticketing-systems)
- [Busbora about](https://busbora.com/about-us), [Busbora terms](https://www.busbora.co.tz/terms)
- [Web e-Ticketing product page](https://webtechnologies.co.tz/NEW-WEB/bus-ticket/)
- [OTAPP about](https://www.otapp.co.tz/about-us)
- [Shabiby booking help](https://shabiby.co.tz/help/how-do-i-book-a-ticket)
- [Msafiri booking](https://sms.msafiri.co.tz/)

Public pages do not replace interviews, API documentation, contracts, security reviews, integration tests or regulator confirmation. The specific workflows outlined above are requirements and validation test cases, not assertions that every current provider lacks them.
