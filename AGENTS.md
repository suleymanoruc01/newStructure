# AGENTS.md

PartOn rebuild instructions for AI coding agents live here:

→ **[`PartonNewArch/AGENTS.md`](PartonNewArch/AGENTS.md)**  
→ **[`PartonNewArch/DESIGN.md`](PartonNewArch/DESIGN.md)** (UI/UX visual SoR — Stitch / awesome-design-md)  
→ **[`PartonNewArch/agents/10-production-ready.md`](PartonNewArch/agents/10-production-ready.md)** (full-stack production coding gate)  
→ **[`PartonNewArch/agents/07-anti-hallucination.md`](PartonNewArch/agents/07-anti-hallucination.md)** (mandatory grounding)  
→ **[`PartonNewArch/agents/08-no-mocks-fully-functional.md`](PartonNewArch/agents/08-no-mocks-fully-functional.md)** (no mocks)  
→ **[`PartonNewArch/agents/09-latest-stack-policy.md`](PartonNewArch/agents/09-latest-stack-policy.md)** (latest stable libs)  
→ **[`PartonNewArch/backend/adr/0040-bun-monorepo-exclude-mobile.md`](PartonNewArch/backend/adr/0040-bun-monorepo-exclude-mobile.md)** (Bun root; mobile npm + Fastlane)  
→ **[`PartonNewArch/mobile/06-ios-android-platforms.md`](PartonNewArch/mobile/06-ios-android-platforms.md)** (latest iOS + Android)  
→ **[`PartonNewArch/mobile/07-fastlane.md`](PartonNewArch/mobile/07-fastlane.md)** (Fastlane release)  
→ **[`PartonNewArch/web/05-pm2.md`](PartonNewArch/web/05-pm2.md)** (PM2 Nest web)  
→ **[`PartonNewArch/web/06-nginx.md`](PartonNewArch/web/06-nginx.md)** (NGINX edge)  
→ **[`PartonNewArch/web/07-marketing.md`](PartonNewArch/web/07-marketing.md)** (marketing site)  
→ **[`PartonNewArch/web/08-admin-case-coverage.md`](PartonNewArch/web/08-admin-case-coverage.md)** (admin × all cases)  
→ **[`PartonNewArch/web/09-admin-devops.md`](PartonNewArch/web/09-admin-devops.md)** (admin DevOps / errors)  
→ **[`PartonNewArch/web/10-devops-mcp.md`](PartonNewArch/web/10-devops-mcp.md)** (DevOps MCP)  
→ **[`PartonNewArch/web/11-legal-audit-reports.md`](PartonNewArch/web/11-legal-audit-reports.md)** (legal audit CSV/PDF)  
→ **[`PartonNewArch/backend/22-legal-audit-logger.md`](PartonNewArch/backend/22-legal-audit-logger.md)** (legal audit logger)

Then: [`PartonNewArch/agents/`](PartonNewArch/agents/) (playbook, defaults, scaffold, conventions, slices).

**Ponytail** (lazy senior dev — smallest correct diff, `/ponytail-review`): [`PartonNewArch/agents/11-ponytail-integration.md`](PartonNewArch/agents/11-ponytail-integration.md) · vendored [`vendor/ponytail`](vendor/ponytail). PartOn production gates in `PartonNewArch/AGENTS.md` override scope cuts.

Architecture index: [`PartonNewArch/DOC-INDEX.md`](PartonNewArch/DOC-INDEX.md)  
Cohesion rules: [`PartonNewArch/DOC-COHESION.md`](PartonNewArch/DOC-COHESION.md)  
Acceptance cases: [`parton_case_tests_tr.json`](parton_case_tests_tr.json)

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
