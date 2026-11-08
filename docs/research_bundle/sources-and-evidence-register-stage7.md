# Stage 7 Source and Evidence Register

**Access date:** 23 October 2026. Verify versions again when implementation work is authorized.

| Source | URL | Supports | Does not prove |
|---|---|---|---|
| NIST SP 800-218 SSDF v1.1 | https://csrc.nist.gov/pubs/sp/800/218/final | Secure software development practices incorporated into SDLC | Travelar compliance or a certification |
| OWASP ASVS 5.0.0 | https://asvs.owasp.org/ | Application security verification requirements; stable version published 30 May 2025 | A penetration-test result or legal compliance |
| OWASP API Security Top 10:2023 | https://devguide.owasp.org/en/07-training-education/07-api-top-ten/ | API abuse and authorization risk categories | A complete Travelar threat model |
| NIST SP 800-61 Rev. 3 | https://csrc.nist.gov/pubs/sp/800/61/r3/final | Current NIST incident-response risk management guidance; final April 2025 | Country-specific notification deadlines |
| OpenTelemetry docs | https://opentelemetry.io/docs/ | Vendor-neutral traces, metrics, logs and collector framework | Production observability without instrumentation/operations |
| PostgreSQL concurrency docs | https://www.postgresql.org/docs/current/mvcc.html | Transaction isolation, locking and concurrency concepts | Correctness of Travelar's application-specific inventory design |
| Supabase architecture | https://supabase.com/docs/guides/getting-started/architecture | Supabase component architecture and PostgreSQL basis | That Supabase is the best fit for Travelar |
| Supabase available regions | https://supabase.com/docs/guides/platform/regions | Published region choices and region semantics | That choosing a region ensures legal compliance |
| Supabase self-hosting | https://supabase.com/docs/guides/self-hosting | Self-hosting responsibilities and feature differences | That self-hosting is operationally easy or automatically compliant |
| Supabase backups | https://supabase.com/docs/guides/platform/backups | Published managed backup features by plan | A tested Travelar restore or sufficient RPO/RTO |

| Tanzania National Business Portal — Register a business | https://www.business.go.tz/register-a-business | General role of BRELA and registration/business steps | OuterBlocks Limited's actual status or licences |
| Tanzania National Business Portal — Obtain a business licence | https://www.business.go.tz/obtain-a-business-license | General prerequisites and sector-licence examples, including travel-agent/air-ticketing categories | Whether Travelar's specific activity is licensed in a particular category; obtain classification |
| BRELA company registration services | https://www.brela.go.tz/services/registration-of-companies | Official company registration process | Current OuterBlocks Limited company extract/shareholder/IP facts |

Evidence classification: primary documentation. Recommendations are conditional on Travelar-specific tests, provider contracts, legal assessment and assigned operational ownership.
