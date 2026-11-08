# Stage 15 source and evidence register — IDE agent assessment

**Access date:** 24 October 2026. All vendor/product statements are limited to the cited documentation. Product versions, account features, plans and security defaults can change; re-check at adoption.

| Source | What it supports | Limitations |
|---|---|---|
| Cursor Agent — https://cursor.com/docs/agent/overview | Codebase search, file editing, terminal tools, multiple-agent/project capability | Vendor documentation; no Travelar performance benchmark |
| Cursor Plan Mode — https://cursor.com/docs/agent/plan-mode | Plan before coding, reviewable/editable plan | Plan can still be incomplete or wrong |
| Cursor Rules — https://cursor.com/docs/rules | Project `.cursor/rules`, versioned instructions and `AGENTS.md` | Prompt-based guidance; not deterministic enforcement |
| Cursor Agent Skills — https://cursor.com/docs/skills | Portable, version-controlled `SKILL.md`; `.agents/skills` and `.cursor/skills` paths | Agent may not follow skill perfectly; verify output |
| Cursor Hooks — https://cursor.com/docs/hooks | Agent lifecycle hooks to inspect/control steps | Hook implementation must be tested; not a substitute for CI or OS permissions |
| Cursor security — https://cursor.com/docs/agent/security | Terminal approval modes, ignore rules, MCP approvals and best-effort guardrails | Exact settings depend on version; best-effort guardrails aren't a hard boundary |
| Cursor privacy — https://cursor.com/help/security-and-privacy/privacy | Privacy Mode's stated training-use policy and data sent to model providers | Verify account/plan terms, DPA, subprocessors and data-location requirements |
| Cursor Bugbot — https://cursor.com/docs/bugbot | Automated PR diff review | Findings are imperfect; not a required human review replacement |
| Antigravity overview — https://www.antigravity.google/docs/overview?tab=ide | Product surfaces/features; IDE vs app/CLI note | Feature availability varies by surface/account |
| Antigravity agent — https://www.antigravity.google/docs/agent | Agent tools and multi-step actions | No guarantee of correctness |
| Antigravity rules — https://antigravity.google/docs/rules/ | `AGENTS.md`, `GEMINI.md`, `.agents/rules` behavior and precedence | Verify installed product surface discovers intended path |
| Antigravity Skills — https://www.antigravity.google/docs/skills | Portable SKILL.md packages with scripts/resources | Skills provide guidance, not guaranteed compliance |
| Antigravity security — https://antigravity.google/docs/features | Bounded workspace and interactive approvals, sandbox claims | Secure posture depends on actual permission settings and OS/surface |
| Antigravity artifact review — https://www.antigravity.google/docs/artifact-review | Request review vs Always proceed modes | Human still must review meaningfully |
| Antigravity workflow migration — https://www.antigravity.google/docs/migration/workflows-to-skills/ | Legacy workflows cutoff 19 Oct 2026 and migration to skills | Re-check product changelog after access date |
| NIST SSDF SP 800-218 — https://csrc.nist.gov/pubs/sp/800/218/final | Secure development practices integrated into SDLC | Framework guidance; not a Travelar certification |
| OWASP ASVS 5.0.0 — https://asvs.owasp.org/ | Verifiable security requirements for web applications/services | Scope/level must be chosen and tested; citation does not mean compliance |

**Evidence classification:** official product capability where stated by vendor; recommendations and pilot acceptance criteria are Travelar proposals; relative product quality remains unverified until measured on the actual repository.
