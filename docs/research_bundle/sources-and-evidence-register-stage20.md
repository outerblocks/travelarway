# Sources and Evidence Register — Stage 20

**Date:** 24 October 2026. Primary-source web review for the new corporate/channel/regulatory/security implementation details.

## Tanzania legal, regulator and company evidence

1. **Government Notice No. 158C, Electronic Transactions (Mandatory Electronic Payments for Specified Transactions) Order, 2026**, hosted by Tanzania Revenue Authority, dated 30 June 2026. The order says it comes into operation on 1 July 2026, lists ferry/long-distance bus/air/rail fares, accommodation and tourism-related services and includes a six-month transitional provision for persons already receiving covered payments before commencement. It does not by itself resolve treatment of each new entrant/channel; counsel review required. URL: https://www.tra.go.tz/images/uploads/acts/GN158C-THE_ELECTRONIC_TRANSACTIONS_%28MANDATORY_ELECTRONIC_PAYMENTS_FOR_SPECIFIED_TRANSACTIONS%29_ORDER%2C_2026-TGPA.pdf

2. **LATRA, Safari Tiketi enhances travel assurance**, 8 October 2026. The public statement reports 14 online-ticketing providers connected to Safari Tiketi and reports historic cash/online payment proportions. Connection is not the same as Travelar's authorization or an open API entitlement. URL: https://www.latra.go.tz/news/safari-tiketi-enhances-travel-assurance

3. **LATRA, unregistered online ticketing providers prohibited from 1 July 2025**, 14 June 2025. LATRA says providers were required to connect systems to Safari Tiketi and TRA EFDMS; operators may own their own ticketing systems or choose LATRA-authorized providers. URL: https://www.latra.go.tz/news/watuo-huduma-za-tiketi-mtandao-wasiosajiliwa-marufuku-julai-01-2025

4. **LATRA, 6 July 2025 statement on online ticketing integration**. It describes Online Ticketing Regulations 2024 Regulation 5 criteria as including cybersecurity protections and ability to connect to government systems, and reiterates system connection direction. URL: https://www.latra.go.tz/news/prof-kahyarara-aitaka-latra-kuhakikisha-kampani-za-tiketi-mtandao-zinaunganisha-mifumo-yao-na-ya-serikali

5. **Tanzania Revenue Authority — EFD/VFD suppliers**. Defines EFD/VFD and fiscal receipt/invoice and explains EFD/VFD suppliers. URL: https://www.tra.go.tz/page/efd-vfd-suppliers

6. **BRELA Online Registration System**. Company registration/filings and service for company information extracts/status; proves a verification pathway, not any specific proposed company's existence. URL: https://ors.brela.go.tz/

7. **Bank of Tanzania — Payment System regulations**. Official portal lists NPS legal/regulatory framework; payment/wallet/collection design still requires a transaction-specific legal assessment. URL: https://bot.go.tz/PaymentSystem/regulations?lang=en

## Official technical/security documentation

8. **OWASP Webhook Security Cheat Sheet**. Provider-specific webhook verification, raw payload verification when required, replay/idempotency handling, secret management, rate limits, asynchronous processing and careful logging. URL: https://cheatsheetseries.owasp.org/cheatsheets/Webhook_Security_Cheat_Sheet.html

9. **PostgreSQL 18 CREATE POLICY**. Describes SQL row security policy creation; policies apply only when RLS is enabled and does not eliminate privileged-role bypass concerns. URL: https://www.postgresql.org/docs/current/sql-createpolicy.html

10. **PostgreSQL Row Security Policies**. Notes default behavior and that superusers/BYPASSRLS/table owners can bypass normal row-security policy behavior. URL: https://www.postgresql.org/docs/17/ddl-rowsecurity.html

11. **Redis distributed locks**. Discusses lock safety/liveness, failover limitations in simple replication patterns, time windows and fencing tokens. URL: https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/

12. **Cloudflare rate limiting rules**. Documents that rate-limiting features and counting characteristics differ by plan. URL: https://developers.cloudflare.com/waf/rate-limiting-rules/

13. **Cloudflare rate-limiting best practices**. Gives examples of bot-abuse controls and plan-specific requirements for certain rules. URL: https://developers.cloudflare.com/waf/rate-limiting-rules/best-practices/

14. **NestJS validation**. Documents server-side validation configuration including whitelisting and rejection of non-whitelisted request properties. URL: https://docs.nestjs.com/techniques/validation

15. **OWASP API Security Top 10**. Lists object/function authorization, resource consumption, sensitive business flows, SSRF, configuration, API inventory and unsafe API consumption risks. URL: https://devguide.owasp.org/en/07-training-education/07-api-top-ten/

## Evidence limits

- No actual BRELA extracts or company documents were supplied; entity status remains unknown.
- LATRA notices are verified public statements but do not give Travelar an approval, API credential or production entitlement.
- GN 158C is an official published order; application to a particular entity/channel/transaction and the transition period should be confirmed with qualified counsel and the responsible authority.
- Public WAF/Redis/PostgreSQL/framework docs support implementation considerations, not proof of correct deployment or adequate security.
- No Travelar source repository, database or infrastructure was inspected or changed; the bundle adds research requirements only.
