# Architecture Decision Records (Backend)

Short records of decisions that shape the NestJS API.

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-nestjs-modular-monolith.md) | NestJS modular monolith (API + admin) | accepted |
| [0002](0002-postgresql-owned-db.md) | Self-managed PostgreSQL as system of record | accepted |
| [0003](0003-orm-choice.md) | ORM choice (Prisma latest stable on PG 18) | accepted |
| [0004](0004-rest-json-api.md) | REST / JSON as the public API (`/api/v1`) | accepted |
| [0005](0005-monorepo.md) | Monorepo with separate mobile and backend apps | accepted |
| [0006](0006-bare-react-native-no-expo.md) | Bare React Native — Expo forbidden | accepted |
| [0007](0007-bullmq-over-rabbitmq.md) | BullMQ (Redis) over RabbitMQ for jobs | accepted |
| [0008](0008-managed-redis.md) | Managed Redis for BullMQ (ops baseline) | accepted |
| [0009](0009-rest-vs-grpc.md) | REST at the edge; gRPC not for clients | accepted |
| [0010](0010-privacy-kvkk-gdpr.md) | Privacy-by-design — KVKK primary, GDPR-ready | accepted |
| [0011](0011-auth-rbac.md) | AuthN (OTP + JWT) and RBAC + resource scope | accepted |
| [0012](0012-sse-foreground-realtime.md) | SSE for foreground realtime (not WebSocket) | accepted |
| [0013](0013-fcm-push.md) | FCM for mobile push (HTTP v1 + inbox/outbox) | accepted |
| [0014](0014-web-ui-shadcn-dark.md) | Nest-hosted Vite admin + shadcn/ui dark | accepted |
| [0015](0015-mobile-ui-nativewind.md) | NativeWind for bare React Native mobile UI | accepted |
| [0016](0016-mobile-ui-wwdc-liquid-glass.md) | Apple Liquid Glass / WWDC principles on mobile | accepted |
| [0017](0017-color-system.md) | Shared PartOn color tokens (Web + Mobile) | accepted |
| [0018](0018-client-security.md) | Client security baseline (Web + Mobile) | accepted |
| [0019](0019-screen-ux-layout.md) | Screen UX & layout recipes (CASE-UX) | accepted |
| [0020](0020-wizard-state.md) | Wizard / multi-step form state ownership | accepted |
| [0021](0021-push-notifications-ux.md) | User-centered push notification experience | accepted |
| [0022](0022-accessibility-wcag.md) | Accessibility — WCAG 2.2 AA (Web + Mobile) | accepted |
| [0023](0023-i18n-turkish-primary.md) | i18n — Turkish (`tr-TR`) primary | accepted |
| [0024](0024-fluid-routing.md) | Fluid routing — React Navigation + React Router | accepted |
| [0025](0025-modern-ui-principles.md) | Modern UI principles — September 2026 bar | accepted |
| [0026](0026-modern-ux-principles.md) | Modern UX principles — September 2026 bar | accepted |
| [0027](0027-api-contracts-baseline.md) | API contracts — envelope, Zod, pagination | accepted |
| [0028](0028-latest-stable-stack.md) | Latest stable tech within locked ADR fences | accepted |
| [0029](0029-dual-platform-ios-android.md) | Dual-platform — latest iOS & Android ready | accepted |
| [0030](0030-fastlane-mobile-release.md) | Fastlane for mobile build & store release | accepted |
| [0031](0031-pm2-web-process-manager.md) | PM2 for Nest web (API + admin) process manager | accepted |
| [0032](0032-nginx-reverse-proxy.md) | NGINX reverse proxy / TLS for Nest web | accepted |
| [0033](0033-marketing-site.md) | Marketing site (public Vite web) | accepted |
| [0034](0034-admin-full-case-coverage.md) | Web admin covers all CASE-* domains | accepted |
| [0035](0035-admin-devops-error-tracking.md) | Admin DevOps — errors & codebase/release ops | accepted |
| [0036](0036-admin-devops-mcp.md) | Admin DevOps MCP server for AI agents | accepted |
| [0037](0037-legal-audit-logger.md) | Legal audit logger + admin CSV/PDF reports | accepted |
| [0038](0038-monorepo-tooling.md) | Monorepo tooling — pnpm + Turborepo + locked packages | accepted |
| [0039](0039-design-md.md) | DESIGN.md visual SoR (Stitch / awesome-design-md) | accepted |

Detail: [`../14-bullmq-vs-rabbitmq.md`](../14-bullmq-vs-rabbitmq.md) · [`../15-redis-management.md`](../15-redis-management.md) · [`../16-rest-vs-grpc.md`](../16-rest-vs-grpc.md) · [`../17-privacy-kvkk-gdpr.md`](../17-privacy-kvkk-gdpr.md) · [`../18-auth-rbac.md`](../18-auth-rbac.md) · [`../19-sse.md`](../19-sse.md) · [`../20-fcm-messaging.md`](../20-fcm-messaging.md) · [`../21-client-security.md`](../21-client-security.md) · [`../22-legal-audit-logger.md`](../22-legal-audit-logger.md) · [`../../web/04-shadcn-dark-ui.md`](../../web/04-shadcn-dark-ui.md) · [`../../mobile/04-nativewind-ui.md`](../../mobile/04-nativewind-ui.md) · [`../../mobile/05-wwdc-liquid-glass.md`](../../mobile/05-wwdc-liquid-glass.md) · [`../../shared/01-color-system.md`](../../shared/01-color-system.md) · [`../../shared/03-screen-ux-layout.md`](../../shared/03-screen-ux-layout.md) · [`../../shared/04-wizard-state.md`](../../shared/04-wizard-state.md) · [`../../shared/05-push-notifications-ux.md`](../../shared/05-push-notifications-ux.md) · [`../../shared/06-accessibility-wcag.md`](../../shared/06-accessibility-wcag.md) · [`../../shared/07-i18n.md`](../../shared/07-i18n.md) · [`../../shared/08-routing.md`](../../shared/08-routing.md) · [`../../shared/09-modern-ui-principles.md`](../../shared/09-modern-ui-principles.md) · [`../../shared/10-modern-ux-principles.md`](../../shared/10-modern-ux-principles.md) · [`../../shared/11-glossary.md`](../../shared/11-glossary.md) · [`../../shared/12-api-contracts.md`](../../shared/12-api-contracts.md) · [`../../mobile/06-ios-android-platforms.md`](../../mobile/06-ios-android-platforms.md) · [`../../mobile/07-fastlane.md`](../../mobile/07-fastlane.md) · [`../../web/05-pm2.md`](../../web/05-pm2.md) · [`../../web/06-nginx.md`](../../web/06-nginx.md) · [`../../web/07-marketing.md`](../../web/07-marketing.md) · [`../../web/08-admin-case-coverage.md`](../../web/08-admin-case-coverage.md) · [`../../web/09-admin-devops.md`](../../web/09-admin-devops.md) · [`../../web/10-devops-mcp.md`](../../web/10-devops-mcp.md) · [`../../web/11-legal-audit-reports.md`](../../web/11-legal-audit-reports.md) · [`../../agents/10-production-ready.md`](../../agents/10-production-ready.md) · [`../../DESIGN.md`](../../DESIGN.md).

Product-level locked/open list: [`../../01-architecture-decisions.md`](../../01-architecture-decisions.md).

## When to add an ADR

- Choosing a library that is hard to reverse (ORM, queue, auth protocol)
- Changing module boundaries or tenancy model
- Rejecting a serious alternative (e.g. GraphQL, microservices, non-REST client protocols)

## Template

```markdown
# ADR-NNNN: Title

**Date:** YYYY-MM-DD
**Status:** proposed | accepted | superseded

## Context
## Decision
## Alternatives
## Consequences
```
