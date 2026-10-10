# 09 — Latest technology & libraries (mandatory)

**Status:** `accepted`  
**As-of policy:** Always current at scaffold / upgrade time  
**ADR:** [0028 — Latest stable within locked boundaries](../backend/adr/0028-latest-stable-stack.md)  
**Radar:** [`../03-tech-radar-2026.md`](../03-tech-radar-2026.md)

> Agents **must** use the **latest stable** release of every **Adopt** technology that fits locked ADRs. Do **not** pin stale minors from memory. Do **not** “latest” your way into Hold items (Expo, GraphQL, RabbitMQ, Next admin).

---

## 1. Rules

1. **Latest stable inside the fence** — For each Adopt stack choice, install `@latest` (or current stable documented by the vendor) at scaffold time.  
2. **Verify before pin** — Use `npm view <pkg> version`, official docs, or **ctx7** — never invent version numbers.  
3. **Locked boundaries win** — Latest Expo is still banned; latest Nest is required.  
4. **Prefer current LTS runtimes** — Node **current Active/Maintenance LTS** that satisfies Nest’s floor (Nest 12: Node **≥ 20.19** or **≥ 22.12**; CLI generate may need **≥ 22.22.3** / **24+**).  
5. **Majors: adopt when stable** — When Nest/Prisma/RN ship a new **stable** major compatible with our fence, **upgrade** (do not stay on old major “for comfort”).  
6. **No alpha/beta as default** — Unless radar says Trial and a spike passed.  
7. **Renovate/Dependabot** — Enable on the monorepo; group safe minors; major bumps follow this policy.  
8. **Document pins in code** — `package.json` is source of truth; update radar “floor” notes when majors change.

---

## 2. Current targets (refresh at install — Oct 2026)

| Area | Policy target | Notes |
| --- | --- | --- |
| **NestJS** | **12.x** latest stable | ESM-capable; Standard Schema; `nest upgrade` from 11 — [docs](https://docs.nestjs.com) |
| **Node.js** | **22 LTS** or **24 LTS** meeting Nest 12 floor | ≥ 20.19 minimum to run; prefer newest LTS Nest CLI accepts |
| **TypeScript** | **6.x** with Nest 12 | Nest 12 CLI bumps to TS 6 |
| **Prisma** | **Latest stable 7+** (or current major if 8+ stable & PG 18 OK) | Driver adapter `@prisma/adapter-pg` |
| **PostgreSQL** | **18** (or newer stable major when Adopt) | Managed preferred |
| **Zod** | **4.x** latest | ADR-0027 |
| **React Native** | **Latest stable** bare (no Expo) | Verify New Architecture + **iOS/Android SDK floors** — [mobile/06](../mobile/06-ios-android-platforms.md) · ADR-0029 |
| **Fastlane** | **Latest stable** gem (Bundler) | Store/CI lanes — [mobile/07](../mobile/07-fastlane.md) · ADR-0030 |
| **PM2** | **Latest stable** | Nest web staging/prod — [web/05](../web/05-pm2.md) · ADR-0031 |
| **NGINX** | **Latest stable** distro/package | Edge TLS + proxy — [web/06](../web/06-nginx.md) · ADR-0032 |
| **MCP SDK** | **Latest stable** official SDK | DevOps MCP — [web/10](../web/10-devops-mcp.md) · ADR-0036 |
| **React Navigation** | Latest stable major compatible with that RN | Native stack + tabs |
| **NativeWind** | Latest stable v4+ | |
| **React (admin)** | Latest stable compatible with Vite + shadcn | |
| **Vite** | Latest stable | |
| **shadcn/ui** | Latest CLI / registry components | Dark default ADR-0014 |
| **pnpm / Turborepo** | Latest stable | |
| **BullMQ / ioredis** | Latest stable when Stage B | Managed Redis |
| **OpenTelemetry** | Latest stable Node SDK | |

Re-resolve versions on every greenfield scaffold. If this table disagrees with `npm view`, **npm wins**.

---

## 3. Hold fence (latest does **not** override)

| Still Hold | Why |
| --- | --- |
| Expo / EAS / Expo Router | ADR-0006 · use Fastlane (ADR-0030) |
| GraphQL / tRPC / gRPC-to-clients | ADR-0004/0009 |
| RabbitMQ / Kafka day-1 | ADR-0007 |
| Next.js App Router admin | ADR-0014 |
| Firestore SoR | ADR-0002 |

---

## 4. Agent checklist (scaffold & upgrades)

- [ ] `node -v` meets Nest latest floor  
- [ ] `@nestjs/*` at latest 12.x (or newer stable major)  
- [ ] `prisma` / `@prisma/client` at latest stable  
- [ ] `react-native` at latest stable **without** Expo packages  
- [ ] `zod` at latest 4.x  
- [ ] No Hold packages in any `package.json`  
- [ ] Versions verified via registry/docs this session (not memory)  
- [ ] Radar floor note updated if a new **stable major** was adopted  

---

## 5. How to look up (required)

```bash
npm view @nestjs/core version
npm view prisma version
npm view react-native version
npm view zod version
# or: npx ctx7@latest docs <libraryId> "current stable version requirements"
```

---

## Related

- [ADR-0028](../backend/adr/0028-latest-stable-stack.md)  
- Scaffold: [`03-scaffold-spec.md`](03-scaffold-spec.md)  
- Radar: [`../03-tech-radar-2026.md`](../03-tech-radar-2026.md)  
