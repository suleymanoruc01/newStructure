# ADR-0020: Wizard / multi-step form state ownership

**Date:** 2026-10-09  
**Status:** accepted  
**Detail:** [`../../shared/04-wizard-state.md`](../../shared/04-wizard-state.md)

## Context

PartOn uses multi-step wizards (create job, onboarding, occasional admin flows). Step UIs are separate components (and sometimes separate React Navigation / routes). When the user goes **Back**, the next step **unmounts** and any answers kept only in that step’s local React state are lost — a classic client bug that breaks CASE-UX (T-236, T-237) and create-job draft expectations (T-161).

Four common fixes exist: lift state up, global store, browser/device storage, hide-instead-of-unmount. PartOn needs a single baseline that fits bare RN + Vite admin + Nest as system of record.

## Decision

1. **Required:** Lift wizard answers to a **parent `WizardShell`** (controlled steps: `values` + `onChange`). Step-local state may hold ephemeral UI only (focus, local toggles).  
2. **When steps are separate routes/screens:** Use a **scoped** Zustand store or React Context+reducer **per wizard instance** (factory keyed by `wizardSessionId` / `draftId`) — not app-wide Redux for every form.  
3. **Durable wizards (create job, payment-failed draft):** Persist **Nest draft** via REST (`status: draft`); client cache (MMKV / sessionStorage) is optional assist only.  
4. **Hide-instead-of-unmount:** Allowed only as an optimization **inside** one screen **in addition to** lifted state — **Hold** as the sole strategy (insufficient across navigation stacks; Vue `keep-alive` N/A).  
5. Validate with **Zod step slices** in shared contracts + full Nest validation on publish.  
6. Reset store/cache on publish success or explicit discard.

## Alternatives

### Step-local state only
- **Pros:** Fast to code  
- **Cons:** Data loss on Back/unmount  
- **Why not:** Broken UX

### App-wide Redux for all forms
- **Pros:** Familiar  
- **Cons:** Boilerplate; draft leakage; cleanup bugs  
- **Why not:** Scoped wizard store is enough

### localStorage / AsyncStorage as only persistence
- **Pros:** Survives reload  
- **Cons:** Not AuthZ-aware; sync conflicts; PII on disk  
- **Why not:** Nest draft is SoR for jobs; cache optional

### CSS hide / keep-alive only
- **Pros:** Preserves local state if still mounted  
- **Cons:** Fails when navigator unmounts screens; memory; not portable  
- **Why not:** Not the architecture

## Consequences

### Positive
- Back/forward keeps field values  
- Create-job resume and T-161 draft align with Nest  
- Clear review checklist for wizard PRs  

### Negative / risks
- Authors must wire controlled steps (discipline)  
- Autosave needs debounce + conflict handling on draft PATCH  

### Follow-ups
- Implement `WizardShell` + `createJobWizardStore` in mobile/admin scaffolds  
- Document draft REST on jobs module OpenAPI  
