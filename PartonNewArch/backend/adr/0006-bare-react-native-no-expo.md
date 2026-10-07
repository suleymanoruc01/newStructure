# ADR-0006: Bare React Native — Expo forbidden

**Date:** 2026-10-07  
**Status:** accepted

## Context

PartOn mobile must support iOS and Android with full control over native modules (location/geofence, push, secure storage). The team rejects Expo and Expo-managed toolchains (Expo Go, EAS-as-required path, Expo Router, `expo-*` SDK as the app foundation).

## Decision

Build the mobile app as **bare React Native** (React Native CLI / community CLI init, owned `ios/` and `android/` projects).

**Forbidden for PartOn:**

- Expo SDK as the application framework
- Expo Go
- Expo Router as the navigation foundation
- `expo-updates` / EAS Update as the release model
- Any requirement that the app be an “Expo project”

Native builds, signing, and CI use standard RN + Xcode / Android Gradle (Fastlane or equivalent is fine). React Native **New Architecture** may still be enabled via RN itself when the team chooses — that is independent of Expo.

## Alternatives

### Expo (managed or prebuild / dev client)
- **Pros:** Faster bootstrap, EAS cloud builds  
- **Cons:** Rejected by product/engineering mandate  
- **Why not:** Hard ban — do not reopen without a new ADR that supersedes this one

## Consequences

### Positive
- Full ownership of native projects and dependencies
- No Expo version coupling for GPS / check-in native code

### Negative / risks
- Higher mobile ops cost (local native toolchains, store pipelines) — accept and budget in P0
- Must document RN upgrade + New Architecture enablement without Expo guides
