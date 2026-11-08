# Stage 14 — Sources and evidence register

**Research date:** 24 October 2026. **Purpose:** make Train and Experiences explicit first-class product modes and verify public supplier-access constraints.

| ID | Source | Publisher | Evidence supported | Evidence limitation | Status |
|---|---|---|---|---|---|
| S14-01 | [TRC SGR Ticketing Online Sales](https://sgrticket.trc.co.tz/) | Tanzania Railways Corporation | An official online booking surface exists for SGR. | Does not demonstrate a public third-party API or permission for OuterBlocks. | Primary official public surface verified; API access unknown |
| S14-02 | [TRC/eGA e-ticket system report/speech](https://www.trc.co.tz/uploads/publications/sw1586000927-HOT%20DG%20KWA%20UZINDUZI%20WA%20mfumo%20wa%20tiketi%20wa%20kielectroniki_updated.pdf) | Tanzania Railways Corporation | Historical TRC/eGA electronic ticketing system and official ticketing ecosystem. | Historical; not a current SGR interface specification or commercial offer. | Primary official historical evidence |
| S14-03 | [Madaraka Express FAQ](https://krc.co.ke/madaraka-express-faq/) | Kenya Railways | Public booking channels, advance booking limits, online/USSD person limits, ID, child fare and cancellation/rescheduling conditions on the FAQ. | Rules may change and are service-specific; no third-party API access established. | Primary official page; revalidate at integration |
| S14-04 | [Viator Partner API v2](https://docs.viator.com/partner-api/technical/) | Viator | API supports product content, availability/pricing, holds, booking, status, cancellation and voucher operations with partner-tier restrictions. | API docs do not mean OuterBlocks is accepted as merchant/affiliate or entitled to endpoints. | Primary provider documentation; access contract unknown |
| S14-05 | [GetYourGuide API requirements](https://partner.getyourguide.support/hc/en-us/articles/13981133907613-API-integration-and-requirements) | GetYourGuide | Published Basic/Reading/Masterbill features, thresholds and transactional access conditions; updated 4 September 2026. | Thresholds do not guarantee acceptance; current terms/onboarding must be confirmed. | Primary provider partner documentation |
| S14-06 | [Expedia Rapid Activities](https://developers.expediagroup.com/rapid/activities) | Expedia Group | Activity catalog, availability, price check, booking, retrieve/cancel/voucher workflow described; early access selected partners, GA stated for 2027. | Access, beta timing and regional inventory need direct confirmation. | Primary provider documentation; access unknown |
| S14-07 | [Airbnb Experience booking tool](https://www.airbnb.com/help/article/2589) | Airbnb | Public embedded Experiences booking tool is being discontinued. | Does not prove no private/closed partnership exists. | Primary provider help page; transactional API unknown |

## Classification

- **Verified public fact:** TRC SGR ticketing page exists; Kenya Railways lists its public purchase channels; supplier docs publish stated access restrictions and workflows.
- **Explicit product-owner requirement:** Train and Experiences are first-class modes, not future modes.
- **Decision required:** exact launch countries/routes, transaction vs permitted referral behavior for each contracted supplier, merchant/agency model and commercial arrangements.
- **Unknown / direct confirmation required:** third-party rail production APIs or reseller contracts for TRC/Kenya Railways; provider partner acceptance, credentials, commissions, settlement and inventory coverage; production credentials and legal rights for direct activity suppliers.


## Product decision evidence

All six modes being first-class is an explicit owner requirement. Public supplier sources prove only published channel/API descriptions and constraints. The following are still required as direct evidence before transactions are enabled: TRC/Kenya Railways partner agreements and credentials; Viator/GYG/Expedia partner approval and entitlement; direct local-experience supplier contracts, permissions, safety and support documentation.
