# 06 — Copy-paste start prompts

Use these as the **entire** user message. Agents should not need follow-up questions.

---

## Full autonomous build

```text
PartonNewArch is production-ready for full-stack coding (agents/10).
Implement the PartOn monorepo from PartonNewArch.
Read AGENTS.md, DESIGN.md, agents/10, agents/07, 08, 09, mobile/06, mobile/07, and agents/01-implementation-playbook.md.
Use agents/02 defaults — do not ask me to decide stack or gaps. No eng TODOs. No MVP stubs.
UI/UX from DESIGN.md (cream/forest/orange — no purple-glow AI UI). Ground routes/screens/cases in files.
No mocks/noops — real Postgres + SMS/FCM sandbox; fail boot if unset. Ask once if sandbox creds missing.
Latest stable Nest 12 / TS 6 / Node LTS / RN / Zod / Prisma (npm view or ctx7). pnpm + Turborepo (ADR-0038).
Mobile latest iOS+Android + Fastlane. Nest web PM2 + NGINX. Marketing production (web/07).
Admin CASE-* (web/08), DevOps (web/09), MCP (web/10), legal audit CSV/PDF (web/11 / backend/22).
Start S0→S9. Report after each slice; do not ask whether to continue.
Never claim tests passed unless you ran them.
```

---

## Single slice

```text
Execute PartonNewArch slice S5 only (see agents/05-slice-catalog.md).
Follow AGENTS.md bans and coding conventions.
Use agent defaults for gaps. Do not ask clarifying questions.
```

---

## Resume

```text
Resume PartOn implementation from the next incomplete slice in agents/01-implementation-playbook.md.
Obey PartonNewArch/AGENTS.md. Do not re-ask locked ADRs.
```
