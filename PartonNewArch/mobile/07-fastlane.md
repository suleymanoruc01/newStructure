# 07 — Fastlane (mobile build & store release)

**Status:** `accepted`  
**Last updated:** 2026-10-10  
**ADR:** [0030 — Fastlane for mobile release](../backend/adr/0030-fastlane-mobile-release.md)  
**Platforms:** [06-ios-android-platforms.md](06-ios-android-platforms.md) · [ADR-0029](../backend/adr/0029-dual-platform-ios-android.md)  
**Bare RN:** [ADR-0006](../backend/adr/0006-bare-react-native-no-expo.md) — **no EAS**

> PartOn mobile uses **Fastlane** for CI builds, signing, and App Store / Play uploads. Both platforms share one Fastlane project under `apps/mobile/`.

---

## Verdict

| Topic | Stance |
| --- | --- |
| Release automation | **Fastlane** (Adopt) |
| Location | `apps/mobile/fastlane/` |
| Platforms | iOS **and** Android lanes from day one |
| Local debug | `npx react-native run-ios` / `run-android` OK |
| Store submit | Fastlane lanes only (not manual one-off as process) |
| Banned | EAS Build / EAS Submit / Expo Application Services |

---

## 1. Layout

```text
apps/mobile/
  ios/
  android/
  PLATFORM.md
  fastlane/
    Fastfile
    Appfile
    Matchfile          # iOS certs (when match enabled)
    Pluginfile         # optional
    metadata/          # optional store metadata
  Gemfile              # fastlane gem pin (latest stable)
```

Ruby via `Gemfile` + Bundler; CI uses `bundle exec fastlane …`.

---

## 2. Required lanes

| Lane | Purpose |
| --- | --- |
| `ios beta` | Build + upload to TestFlight (or internal) |
| `ios release` | App Store submission train |
| `android beta` | Build AAB + upload to Play internal/closed testing |
| `android release` | Play production train |

Shared helpers for version bump / changelog are fine; do **not** invent Expo-shaped channels.

---

## 3. Signing & secrets

| Secret | Use | Storage |
| --- | --- | --- |
| Apple ASC API key (preferred) or Apple ID + app-specific password | iOS upload | CI secret manager |
| match passphrase + git URL (if match) | iOS certs/profiles | CI secrets; cert repo private |
| Android upload keystore + passwords | Play signing | CI secrets — **never** git |
| Google Play service account JSON | Play upload | CI secrets |

Ask the user **once** for missing store credentials — **never** stub Fastlane with fake upload actions that claim success ([agents/08](../agents/08-no-mocks-fully-functional.md)).

Until secrets exist: implement lanes that **build** artifacts locally/CI; gate **upload** actions behind env checks that fail clearly.

---

## 4. CI integration

| Job | Invokes |
| --- | --- |
| PR / main mobile | Lint + typecheck + unit; optional `fastlane ios build` / `android build` without upload |
| Release candidate | `bundle exec fastlane ios beta` **and** `android beta` |
| Production cut | `ios release` + `android release` (human-approved) |

Path filters: mobile job separate from backend (AO-1). macOS runners for iOS; Linux OK for Android-only jobs if split.

Align OS/SDK floors with [06](06-ios-android-platforms.md) and `PLATFORM.md`.

---

## 5. Agent rules

1. Scaffold Fastlane in **S2** (client shell) — empty-but-runnable lane stubs OK; upload gated on secrets.  
2. Do not introduce EAS, `eas.json`, or Expo Application Services.  
3. Do not replace Fastlane with one-off shell as the documented release path.  
4. Prefer latest stable `fastlane` gem (`bundle update` at scaffold; verify — do not invent version from memory).  
5. Document lane usage in `apps/mobile/README.md` (or `fastlane/README.md` generated).

---

## 6. DoD

- [ ] `Gemfile` + `fastlane/` present under `apps/mobile`  
- [ ] Four required lanes defined  
- [ ] CI can invoke at least beta builds for **both** platforms  
- [ ] No private keys in git  
- [ ] No EAS / Expo release tooling  

---

## Related

- [ADR-0030](../backend/adr/0030-fastlane-mobile-release.md)  
- Dual-platform: [06](06-ios-android-platforms.md)  
- Ops: [`../07-environments-and-ops.md`](../07-environments-and-ops.md)  
- Roadmap stores: [`../02-product-roadmap.md`](../02-product-roadmap.md)  
- Scaffold: [`../agents/03-scaffold-spec.md`](../agents/03-scaffold-spec.md)  
