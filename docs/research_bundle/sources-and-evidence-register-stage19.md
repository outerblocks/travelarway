# Sources and Evidence Register — Stage 19

**Date:** 24 October 2026 · **Purpose:** Evidence for data-driven configuration, authorization and workflow-design recommendations.

## Primary/official engineering sources reviewed

1. **OWASP Authorization Cheat Sheet** — https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html  
   Supports denying by default, validating authorization on every request and explicit permission reasoning. It is general application-security guidance, not Travelar-specific regulatory approval.

2. **OWASP Developer Guide — Enforce Access Controls** — https://devguide.owasp.org/en/04-design/02-web-app-checklist/07-access-controls/  
   Supports upfront authorization design, least privilege, default deny, logging and tests across function/data/field scopes.

3. **OWASP Multi-Tenant Security Cheat Sheet** — https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html  
   Describes trade-offs among shared-table/row-level, schema and database isolation. Travelar must validate its selected tenant boundary with negative tests; the guide does not choose a storage pattern for the platform.

4. **Keycloak Authorization Services Guide** — https://www.keycloak.org/docs/latest/authorization_services/index.html  
   Documents RBAC, ABAC, user/context/rule-based policies, resources, scopes and enforcement architecture. Keycloak can support identity/authorization features; it does not replace Travelar's domain checks or prove deployment suitability.

5. **Camunda DMN overview** — https://camunda.com/dmn/ and **Camunda 8 BPMN/DMN/FEEL concepts** — https://docs.camunda.io/docs/components/concepts/bpmn-dmn-feel/  
   Describes decision tables for repeatable policies and BPMN/DMN process/decision models. Use as a candidate pattern, not a mandate to buy/deploy Camunda.

6. **Temporal documentation** — https://docs.temporal.io/temporal  
   Describes durable workflow execution that retains event history and resumes through failures. This establishes product capability, not that Temporal is necessary or has been evaluated/approved for Travelar production.

## Evidence classification

- The user's direction that the platform be data-driven and that HIMS/OIMS cover real daily operations is a product requirement.
- The module catalogue, configuration lifecycle, role workflows, and recommended modular-monolith-first approach are architecture proposals, not implementation evidence.
- No Travelar application repository, deployed system, database schema, production config, or end-to-end test suite was inspected as part of this stage. No claim is made that hardcoded values have already been removed or workflows implemented.
- Legal requirements, supplier contracts, precise approval thresholds, staffing/SLA policies, accounting decisions and production permissions must be confirmed with named owners and current primary evidence.
