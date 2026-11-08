# Sources and Evidence Register — Stage 17: Finance, Commission and Payment Routing

**Research cut-off:** 24 October 2026. Public webpages and documentation can change. These sources establish only the stated public behavior; they do not establish that OuterBlocks has production access, a signed contract, merchant approval, a particular tariff, or a right to resell inventory.

## A. Tanzania payments law and regulatory risk

1. **Office of the Attorney General (Tanzania), National Payment Systems Act, Cap. 437 R.E. 2023.** https://oagmis.oag.go.tz/portal/acts/revised/537/download — Section 5 states a person shall not operate a payment system without a Bank of Tanzania licence; sections also address licensing and retention of payment transaction records. Legal counsel must assess the precise Travelar model; this research does not conclude that each marketplace model is licensed/unlicensed.
2. **Bank of Tanzania, Payment System Laws and Regulations.** https://bot.go.tz/PaymentSystem/regulations?lang=en — official listing for the NPS Act, Electronic Money Regulations, and Payment Systems Licensing and Approval Regulations, among other documents.
3. **Bank of Tanzania, National Payment Systems Licensing and Approval Regulations (2015).** https://bot.go.tz/Publications/Acts%2C%20Regulations%2C%20Circulars%2C%20Guidelines/Regulations/en/2020030903280842.pdf — includes provider governance, risk management, AML/CFT, liquidity and failure-to-settle requirements relevant to any regulated provider; not a direct classification of Travelar.
4. **Office of the Attorney General, VAT Act 2014.** https://oagmis.oag.go.tz/portal/acts/76 — primary legislation reference. This document does not calculate Travelar's VAT/EFD duties; qualified Tanzanian tax advice remains required.

## B. Accounting treatment

5. **IFRS Foundation / IFRIC, IFRS 15 principal-versus-agent considerations.** https://www.ifrs.org/news-and-events/updates/ifric/2021/ifric-update-november-2021/ — the analysis considers the specified service promised and whether the entity controls the service before transfer; examples of indicators include primary responsibility, inventory risk and price discretion.
6. **IFRS Foundation, Post-implementation Review of IFRS 15 (principal-agent discussion).** https://www.ifrs.org/content/dam/ifrs/project/pir-ifrs-15/rfi-iasb-2023-4-pir-ifrs-15.pdf — describes principal gross-revenue versus agent fee/commission accounting, subject to the standard's control analysis and the facts.

## C. Local PSP capabilities reviewed

7. **ClickPesa API documentation, quickstart.** https://docs.clickpesa.com/home/introduction — describes hosted/embedded collection, a single API for pay-ins/payouts and states its public quickstart has no sandbox; requests including API Explorer requests run against production and move real funds. Follow provider-approved test safeguards.
8. **ClickPesa mobile-money payout API.** https://docs.clickpesa.com/payout-api/mobile-money-payout-api/mobile-money-payout-api-overview — documents mobile wallet payouts, preview and create operations, and currency handling. Does not, on its own, establish marketplace split settlement.
9. **ClickPesa bank payout API.** https://docs.clickpesa.com/payout-api/bank-payout-api/bank-payout-api-overview — documents bank payouts to Tanzanian accounts and preview of fees/settlement/arrival. Does not prove split settlement.
10. **ClickPesa merchant dashboard overview.** https://docs.clickpesa.com/dashboard/dashboard-overview — describes collection, payouts, balances, transactions, notifications and exports.
11. **Selcom Developers API reference.** https://developers.selcommobile.com/ — lists checkout/order operations, payment status, collection/C2B, wallet/card methods and Qwiksend bank transfer operations. Public docs reviewed do not conclusively establish Travelar marketplace split settlement.
12. **Selcom Paytech business page.** https://www.selcom.net/business — states that APIs span e-commerce and disbursements; this does not alone establish split settlement for Travelar's proposed account structure.
13. **Pesapal Developer Community / API 3.0.** https://developer.pesapal.com/ — documents REST API 3.0 and related transaction operations including order submission, transaction status, IPN, and refund endpoints. Public material reviewed does not establish split submerchant settlement.
14. **DPO Pay by Network API Docs.** https://docs.dpopay.com/dpo-pay-by-network/docs/api-docs — documents merchant API checkout integration and describes risk screening/multi-currency features. Public page reviewed does not establish a Travelar marketplace split product in Tanzania.

## D. Flights / GDS and airline settlement

15. **Amadeus for Developers, Self-Service API FAQ: Flight payment.** https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/ — distinguishes app-owner customer collection from payment to a chosen consolidator; says the latter is separately agreed; describes a markup implemented through the app's payment gateway. Specific to the referenced Self-Service products and subject to supplier contract.
16. **IATA, Billing & Settlement Plan (BSP).** https://www.iata.org/en/services/finance/bsp/ — describes BSP as a financial framework for sales reporting, remittance and settlement between accredited agents and participating airlines.
17. **IATA, BSP Manual for Agents.** https://www.iata.org/contentassets/bfacf03f8e914960898e262df2777352/bsp-manual-for-agents.pdf — describes different BSP payment options, including cash sales remitted to BSP and customer-card sales processed under airline merchant agreements, and notes accreditation/ticketing authority requirements.
18. **IATA, Travel Agent Accreditation.** https://www.iata.org/en/services/travel-agency-program/accreditation-travel — describes accreditation benefits, including access to industry relationships, ticketing authority/payment flexibility; does not prove OuterBlocks is accredited or appointed.

## E. Accommodation and experiences

19. **Expedia Group Rapid API, property collect.** https://developers.expediagroup.com/rapid/lodging/booking/property-collect?locale=en_US — describes property collect (guest pays property; card may be required for guarantee/security) and model-specific payment responsibilities.
20. **Expedia Group Rapid API, booking receipts and payment models.** https://developers.expediagroup.com/rapid/lodging/manage-booking/booking-receipts?locale=en_US — distinguishes property collect, Expedia collect and updated Expedia collect, including who collects and when lodging partners receive payments.
21. **Booking.com Demand API, partner collects payment (VCC flow).** https://developers.booking.com/demand/docs/payments/models/partner-collects — partner must be authorized to charge travellers and have the applicable online payment/VCC capability; partner collects the traveller payment and pays Booking.com by VCC under the relevant agreement.
22. **Viator Partner API documentation.** https://docs.viator.com/partner-api/ — outlines separate affiliate and merchant partner access. Merchant partners act as merchant of record and assume monetary, cancellation and customer-support responsibilities; affiliate transactions complete on Viator and accrue commission to the partner.
23. **Viator Travel Commerce API solutions.** https://partnerresources.viator.com/travel-commerce/ — explains that affiliate API redirects customers to Viator (Viator merchant of record; partner earns commission), while the merchant API executes transactions on the partner site and allows markup/discounts, subject to partner qualification.
24. **GetYourGuide Supplier API / Integrator docs.** https://integrator.getyourguide.com/documentation/overview — describes supplier-side connectivity for supplier availability, reservation and cancellation; not evidence of a general reseller payment/commission API for Travelar.

## F. Railways

25. **Tanzania Railways Corporation, official e-ticketing website.** https://eticketing.trc.co.tz/ — public booking journey includes train selection, seat, passenger data, confirmation, payment prompt via mobile/agent and ticket retrieval. Public material reviewed did not establish third-party reseller API access, commission rights or split settlement.
26. **Tanzania Railways Corporation, official FAQ.** https://www.trc.co.tz/faqs — describes customer ticketing, ID, changes and refund rules; does not establish a Travelar reseller agreement.
27. **Kenya Railways, Madaraka Express FAQ.** https://krc.co.ke/madaraka-express-faq/ — describes listed purchase channels and railway terms. Read alongside the formal conditions before designing any commercial reseller flow.
28. **Kenya Railways, Madaraka Express Passenger Service Conditions of Carriage (PDF).** https://krc.co.ke/wp-content/uploads/2021/10/Madaraka-Express-Passenger-Service-Ticketing-Terms-Conditions.pdf — states tickets are only sold by the railway through listed channels and warns profit/commercial resale can invalidate tickets. Obtain explicit approval before any reseller model.

## Evidence interpretation

- Official API documentation proves a documented API surface, not production account approval, contract authorization, merchant category eligibility, actual fees, settlement SLA or split-payment eligibility.
- A payout API is not proof of split settlement. A collection API plus a payout API is not proof that a supplier and Travelar can receive automatic shares of one customer payment.
- GDS/OTA access is not proof of merchant-of-record status, seller appointment, ticketing authority, BSP participation, or permission to use a markup.
- Public train ticketing access is not evidence that resale is authorized.
- Legal and accounting decisions remain open until counsel, accountant/tax adviser and relevant provider/supplier give specific written approval.
