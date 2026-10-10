# 10 — Modern UX design principles (September 2026)

**Status:** `accepted`  
**Snapshot:** September 2026 (locked for PartOn v1 experience bar)  
**Last updated:** 2026-10-09  
**ADR:** [0026 — Modern UX principles (Sept 2026)](../backend/adr/0026-modern-ux-principles.md)  
**Architecture:** [`../04-application-architecture.md`](../04-application-architecture.md) §15.9  

**Companion (look):** [09 — Modern UI principles](09-modern-ui-principles.md) · **[`../DESIGN.md`](../DESIGN.md)** (visual SoR)  
**Implements via:** [Screen UX R1–R8](03-screen-ux-layout.md) · [Wizard state](04-wizard-state.md) · [Push UX](05-push-notifications-ux.md) · [A11y](06-accessibility-wcag.md) · [i18n](07-i18n.md) · [Routing](08-routing.md) · [CASE-UX](../cases/groups/CASE-UX.md)

> **UX** = how people succeed over time (goals, trust, recovery, cognitive load). **UI** = how it looks — agents use [`DESIGN.md`](../DESIGN.md) (ADR-0039) + ADR-0025. September 2026 marketplace UX favors **time-to-value, permission honesty, status clarity, and calm notifications**—not feature tours or dark patterns.

---

## Verdict

| Pillar | PartOn stance (Sept 2026) |
| --- | --- |
| Outcome first | Every flow answers: *what do I do next?* |
| Time budget | Respect clock — profile & create-job short; day-of screens urgent-clear |
| Mental models | Tokens, match, application status, check-in window — teach once, reinforce in-context |
| Honesty | Permissions, costs, holds, geo — explain **before** commit |
| Continuity | Back keeps work (wizards); deep links land gated & correct |
| Feedback | Immediate, human TR copy; never silent failure |
| Trust | No dark patterns; prefs respected; inbox when push off |
| Inclusion | A11y + plain language; same outcomes across channels |
| Measure | CASE-UX T-235–T-243 + task success / time / error rate |

---

## 1. Why “September 2026” (UX)

| Era signal | Implication for PartOn |
| --- | --- |
| Permission & privacy fatigue | Pre-prompt rationale; deny paths that still work (inbox, manual) |
| Notification overload | Inbox-first, prefs by category, quiet hours — not spam for engagement |
| Gig / shift economy UX | Day-of clarity (3h, check-in window) beats decorative dashboards |
| AI-form bloat backlash | Short wizards; optional fields skippable; no 10-step onboarding |
| Trust & marketplace fraud awareness | Status timelines, cost previews, AuthZ explainers — not hidden gates |
| Cross-device continuity | Same state machines; deep links + drafts survive Back |

UI era signals (Liquid Glass, etc.) live in [09](09-modern-ui-principles.md). This doc owns **behavior**.

---

## 2. Twelve UX principles

### X1 — Goal over chrome

Users come to **earn, hire, or operate**—not explore a design system. First run and every return visit surface the next valuable action (apply, confirm, check in, review, publish).

→ T-235 · R1 home

### X2 — Time-to-value

Cut steps until the first win. Profile: mandatory-only first (T-236). Create job: ≤6 steps, cost visible before publish (T-237). Prefer progressive profiling over upfront biography.

### X3 — One decision per step

Wizards and sheets ask for **one cluster** of answers. Don’t mix location permission with wage entry. Back never destroys prior answers (ADR-0020).

### X4 — Teach the mental model in context

| Model | Teach where |
| --- | --- |
| Tokens / holds | Create-job summary + tokens root (T-243) |
| Match / feed | Job card facts: time, pay, distance (T-238) |
| Application status | Badge + timeline (T-239) |
| Check-in window | Countdown + copy above CTA (T-240) |
| Favorites | Obvious toggle + empty → browse (T-242) |

No separate “academy” required for P0.

### X5 — Ask with rationale

OS permissions (location, notifications) only after **why + when used**. Deny = degraded but usable path (T-241 · push prefs).

### X6 — Make status obvious

Always show: where am I in the process, what’s blocking, what’s next. Prefer timeline / badge over buried FAQ.

### X7 — Recover gracefully

Errors: human message + retry + safe exit. Empty: reason + CTA. Blocked: explainer + path to unblock (tokens, profile, policy). Never dead-end “No data”.

### X8 — Continuity across interrupt

Push, deep link, backgrounding, Back: resume with gates (session → role → onboarding → AuthZ → screen). Drafts persist for wizards. Wrong role → friendly switch path, not crash.

### X9 — Respect attention

Notifications are **hints**, not the product. Category prefs, dedupe, inbox fallback. Day-of alerts loud; marketing quiet (ADR-0021).

### X10 — Honest economics & gates

Show token cost, holds, incomplete profile, geo failure **before** the primary commit. Disabled CTA without reason = UX bug.

### X11 — Role-appropriate density

Workers: sparse, urgent clarity. Employers: form clarity + cost. Managers: branch-scoped ops. Admins: speed + audit. Same labels, different density.

### X12 — Inclusive by default

WCAG 2.2 AA / mobile equivalent; plain Turkish; no color-only meaning; keyboard on admin; Reduce Motion doesn’t break task completion.

---

## 3. CASE-UX → principle map

| Case | Primary principles |
| --- | --- |
| **T-235** First-run worker | X1, X2, X4 |
| **T-236** Profile time | X2, X3, X7 |
| **T-237** Create job clarity | X2, X3, X4, X10 |
| **T-238** Feed clarity | X1, X4 |
| **T-239** Application status | X6, X7 |
| **T-240** Check-in timing | X4, X6 |
| **T-241** Location rationale | X5, X7 |
| **T-242** Favorites | X1, X7 |
| **T-243** Token mental model | X4, X10 |

Layout recipes for these cases: [03 §5](03-screen-ux-layout.md).

---

## 4. Flow quality bar (Sept 2026)

| Check | Pass if… |
| --- | --- |
| First 60s | New worker understands Home job + can reach feed |
| Wizard Back | Answers intact; no remount wipe |
| Permission deny | User can continue with explained limits |
| Push off | Inbox still delivers critical day-of items |
| Deep link cold start | Lands on correct screen after gates (T-109) |
| Error | Retry path without losing form data where safe |
| Cost | Token impact visible before publish / hold |
| Copy | TR, short, verb-led CTAs |

---

## 5. Anti-patterns (UX Hold)

| Anti-pattern | Why banned |
| --- | --- |
| Dark patterns (forced push, hidden fees) | Breaks trust / KVKK spirit |
| Infinite onboarding / 10+ wizard steps | Fails T-236/T-237 |
| Engagement spam notifications | Notification fatigue era |
| “Just click Allow” permission sheets | Fails T-241 |
| Silent disabled buttons | Feels broken |
| Status only in email/push | App must show state (T-239) |
| Resetting stack on every tab | Loses continuity (X8) |
| Same UX density for admin & worker Home | Wrong job |
| English-only errors / jargon codes as only message | i18n + X7 |
| Celebratory confetti on every micro-action | Noise; reserve for rare wins |

---

## 6. UX review checklist (PR / flow)

- [ ] Next action obvious in ≤3 seconds  
- [ ] Time-to-value defended (no extra mandatory fields)  
- [ ] Permission / cost / gate explained before commit  
- [ ] loading / empty / error / blocked with next step  
- [ ] Back / kill / deep link continuity verified  
- [ ] Push/inbox path for notify cases  
- [ ] CASE-UX id tagged if applicable (T-235–T-243)  
- [ ] UI principles (09) not violated — look supports behavior  

---

## 7. Relationship to other docs

| Doc | Owns |
| --- | --- |
| **This file** | UX principles & anti-patterns (Sept 2026) |
| [09 UI principles](09-modern-ui-principles.md) | Visual / interaction chrome bar |
| [03 Screen UX](03-screen-ux-layout.md) | Layout recipes + CASE-UX mapping |
| [04 Wizard](04-wizard-state.md) | Multi-step state continuity |
| [05 Push](05-push-notifications-ux.md) | Attention & notify UX |
| [08 Routing](08-routing.md) | Navigation continuity |
| [CASE-UX](../cases/groups/CASE-UX.md) | Acceptance tests |

---

## Related

- [ADR-0026](../backend/adr/0026-modern-ux-principles.md)  
- [ADR-0019](../backend/adr/0019-screen-ux-layout.md) · [ADR-0021](../backend/adr/0021-push-notifications-ux.md) · [ADR-0025](../backend/adr/0025-modern-ui-principles.md)  
