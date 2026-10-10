# ADR-0029: Dual-platform readiness — latest iOS and Android

**Status:** Accepted  
**Date:** 2026-10-10  
**Deciders:** Product / Eng  
**Related:** [ADR-0006](0006-bare-react-native-no-expo.md) · [ADR-0016](0016-mobile-ui-wwdc-liquid-glass.md) · [ADR-0028](0028-latest-stable-stack.md) · [mobile/06-ios-android-platforms.md](../../mobile/06-ios-android-platforms.md)

## Context

PartOn is a Turkey marketplace for workers and employers on mixed devices. Building bare React Native without an explicit dual-platform / latest-OS mandate risks iOS-only chrome, Android SDK drift, or CI that only builds one side. Latest React Native lines also require current Android SDK platforms (e.g. API 35 for RN 0.86) and current Xcode — agents must track those floors.

## Decision

1. The mobile app is **first-class on both iOS and Android** from the client shell slice (S2) onward — no single-platform MVP.  
2. QA and store readiness target the **latest stable** iOS and Android OS releases.  
3. `minSdk` / iOS deployment target / `compileSdk` / `targetSdk` follow the **installed React Native template** (latest stable RN per ADR-0028); record resolved values in `apps/mobile/PLATFORM.md`.  
4. Feature parity across platforms; only chrome and native permission APIs may differ (Liquid Glass vs Material 3).  
5. CI must produce green **iOS and Android** builds for release candidates.  
6. Native dependencies must support **both** platforms or be rejected.

## Consequences

### Positive

- Equal product quality for both stores  
- Aligns with FCM, check-in, and Keychain/Keystore security baseline  
- Clear agent DoD: one-OS-only work is incomplete  

### Negative / tradeoffs

- Higher CI/macOS cost for iOS builds  
- Must maintain two native projects (already accepted with bare RN)  

### Follow-ups

- **Fastlane** lanes for both stores — [ADR-0030](0030-fastlane-mobile-release.md) · [mobile/07](../../mobile/07-fastlane.md)  
- Device farm / Maestro on both platforms in P1+  

## Alternatives considered

| Option | Verdict |
| --- | --- |
| iOS-first then Android | **Reject** — marketplace mix |
| Expo for easier dual builds | **Reject** — ADR-0006 |
| Support only latest OS (no min floor) | **Reject** — use RN-supported mins; QA on latest |
| Kotlin/Swift native twin apps | **Reject** — one RN codebase |