# Stage 16 source and evidence register — cybersecurity self-defence and observability

**Access date:** 24 October 2026. Official vendor/regulator statements are distinguished from Travelar design recommendations. Guidance does not prove that Travelar has implemented or passed any control.

| Source | Supports | Limitations / interpretation |
|---|---|---|
| NIST Cybersecurity Framework 2.0 — https://www.nist.gov/cyberframework | Risk program organized around Govern, Identify, Protect, Detect, Respond, Recover | Framework is flexible guidance; adopting its terminology does not confer certification |
| NIST SP 800-61 Rev. 3 — https://csrc.nist.gov/pubs/sp/800/61/r3/final | Current incident response and integration with cybersecurity risk management; published April 2025 | Guidance; Travelar needs its own owners, runbooks and exercises |
| OWASP ASVS — https://asvs.owasp.org/ | Official site lists ASVS 5.0.0 as stable, published 30 May 2025; basis for verifiable app/service security requirements | Select and test the applicable requirements; no compliance claim follows from citation |
| OWASP Top 10:2025 — https://owasp.org/www-project-top-ten/ and https://top10.owasp.org/2025/0x00_2025-Introduction/ | Current awareness risks, including access control, security misconfiguration, software supply chain, authentication, logging/alerting | Awareness document, not exhaustive threat model or assessment standard |
| OWASP API Security Top 10 — https://owasp.org/www-project-api-security/ | API-specific risks, including object/function authorization, resource consumption, SSRF and unsafe API consumption | Must be mapped to actual Travelar routes and tests |
| OWASP Logging Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html | App-level event selection, central monitoring, sensitive-data exclusions, log protection and response integration | Logging must be tailored to risk and law; overly broad logs can create privacy risk and alert fog |
| OWASP Web Security Testing Guide — https://owasp.org/www-project-web-security-testing-guide | Practical testing methodology for web apps, APIs and deployment/infrastructure aspects | Latest development content may differ from stable release; document the version used in an actual assessment |
| CISA Cross-Sector Cybersecurity Performance Goals — https://www.cisa.gov/cybersecurity-performance-goals | Baseline outcome framework for cybersecurity program and operations | US government guidance, not Tanzanian law or a Travelar certification |
| PDPC Tanzania registration guidance — https://pdpc.go.tz/services/registration/ | PDPC page says a person must be registered as controller or processor before collecting/processing personal data | Verify OuterBlocks' actual status, role(s), current rule and exceptions/direct application with the Commission/adviser |
| PDPC Tanzania Personal Data Protection Act — https://www.pdpc.go.tz/media/media/THE_PERSONAL_DATA_PROTECTION_ACT.pdf | Act 11 of 2022 and the text of the Personal Data Protection Act | Legal interpretation, amendments/current subsidiary legislation and specific duties require Tanzanian counsel |
| PDPC March 2026 public notice — https://www.pdpc.go.tz/media/media/PUBLIC_NOTICE_MARCH_2026.pdf | Regulator notice about DPO, registration, policies, secure systems and reports, with a stated institutional deadline | Confirm current enforcement position and applicability rather than extrapolating from a notice alone |
| Tanzania Cybercrimes Act — https://oagmis.oag.go.tz/portal/acts/89 | Official Office of Attorney General listing and revised Act material | Does not substitute for legal analysis of incident evidence, cooperation or reporting obligations |
| PCI SSC PCI DSS — https://www.pcisecuritystandards.org/standards/pci-dss/ | PCI DSS baseline; intended scope includes entities that store/process/transmit cardholder data or can impact its security | Actual scope depends on Travelar's payment architecture, contracts and acquirer/PSP rules; seek qualified validation if needed |
| PCI SSC document library — https://www.pcisecuritystandards.org/document_library/?category=pcidss | Official document library lists PCI DSS 4.0.1 | Confirm current applicable version and validation requirements with acquirer/PSP/qualified assessor |
| Internal Travelar research Document 24 — `24-security-threat-model-and-control-matrix.md` | Existing threat/control matrix, Travelar-specific assets and attack paths | Proposed controls; requires implementation tests and operational validation |
| Internal Travelar research Document 26 — `26-observability-incident-response-and-disaster-recovery.md` | Existing observability, incident response and disaster recovery strategy | Provider selection, RTO/RPO, runbooks and real restore tests remain open unless separately evidenced |
| Internal Travelar research Document 38 — `38-hosting-verification-location-data-flows-backups-recovery-security.md` | Hosting verification, data-flow, backup/recovery and security gates | NIDC/Wingu shortlist only; no production host selected or verified by this Stage 16 report |

## Evidence classification

- **Source-backed baseline:** the named official standards and regulator/public guidance as cited.
- **Travelar-specific recommendation:** architecture, detection patterns, severity, containment and launch gates authored for this product; they must be approved, implemented and tested.
- **Unverified at this stage:** selected vendor/tool, complete alert coverage, alert response coverage, production host hardening, incident-response effectiveness, restoration performance, pentest outcome, corporate PDPC registration status and final PCI scope.
- **No compliance or implementation claim:** this installment does not assert that Travelar is secure, certified, penetrated-tested, compliant or production-ready.
