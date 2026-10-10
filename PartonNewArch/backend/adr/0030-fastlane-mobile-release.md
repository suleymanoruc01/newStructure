# ADR-0030: Fastlane for mobile release & CI

**Status:** Accepted  
**Date:** 2026-10-10  
**Deciders:** Product / Eng  
**Related:** [ADR-0006](0006-bare-react-native-no-expo.md) · [ADR-0029](0029-dual-platform-ios-android.md) · [mobile/07-fastlane.md](../../mobile/07-fastlane.md) · [mobile/06-ios-android-platforms.md](../../mobile/06-ios-android-platforms.md)

## Context

Bare React Native (ADR-0006) owns `ios/` and `android/`. Dual-platform readiness (ADR-0029) requires green store-oriented builds for both App Store and Google Play. Expo EAS is banned. Without a single release automation choice, agents invent ad-hoc shell scripts, Xcode Cloud-only, or Gradle-only pipelines that diverge per platform.

## Decision

1. **Fastlane** is the **Adopt** tool for mobile build, signing, and store upload automation.  
2. Fastlane lives under `apps/mobile/fastlane/` (shared `Fastfile` + platform lanes).  
3. Minimum lanes: `ios beta`, `ios release`, `android beta`, `android release` (names may use underscores; intent fixed).  
4. CI invokes Fastlane for release candidates and store submissions — not ad-hoc `xcodebuild`/`gradle` scripts as the primary release path (local debug `run-ios` / `run-android` remain fine).  
5. Signing: prefer **match** (or equivalent shared cert repo) for iOS; Android keystore from CI secrets — never commit private keys.  
6. **Hold:** EAS Build / EAS Submit / Expo Application Services.

## Consequences

### Positive

- One automation language for both stores  
- Aligns with bare RN + dual-platform DoD  
- Clear agent scaffold: init Fastlane in S2; wire store lanes before soft launch  

### Negative / tradeoffs

- Ruby + Fastlane gem on CI macOS runners  
- Secrets (ASC API key, Play JSON, match passphrase, keystore) must be provisioned — ask user once; never stub  

### Follow-ups

- Soft-launch / public store trains in [02-product-roadmap](../../02-product-roadmap.md)  
- Optional: Detox/Maestro after Fastlane `beta` artifacts  

## Alternatives considered

| Option | Verdict |
| --- | --- |
| EAS Build / Submit | **Reject** — ADR-0006 |
| Xcode Cloud only | **Reject** as sole path — Android left behind |
| Gradle + shell only | **Reject** as sole path — weak iOS store story |
| Codemagic / Bitrise as SoR | **Assess** later as CI host; Fastlane still the lane layer |
| Manual Xcode / Android Studio uploads | **Reject** for release trains |
