# PartOn mobile — platform matrix

Generated from the React Native **0.87.1** template in `apps/mobile` (bare RN, no Expo). Re-resolve when upgrading `react-native`.

| Field | Value | Source |
| --- | --- | --- |
| React Native | **0.87.1** | `apps/mobile/package.json` |
| React | **19.2.3** | `apps/mobile/package.json` |
| Node (engines) | **≥ 20.19.0** | `apps/mobile/package.json` |
| iOS deployment target | **15.1** | `ios/PartonMobile.xcodeproj/project.pbxproj` |
| Android minSdk | **24** | `android/build.gradle` |
| Android compileSdk | **37** | `android/build.gradle` |
| Android targetSdk | **36** | `android/build.gradle` |
| Android buildTools | **37.0.0** | `android/build.gradle` |
| NDK | **27.1.12297006** | `android/build.gradle` |
| Kotlin | **2.2.0** | `android/build.gradle` |
| Application ID (Android) | `com.partonmobile` | `android/app/build.gradle` |
| Bundle ID (iOS) | `com.parton.app` | `ios/PartonMobile.xcodeproj` — Sign in with Apple audience |

## QA targets

- Latest stable **iOS Simulator** matching Xcode + iOS **15.1+** deployment target.
- Latest stable **Android Emulator** image with **API 35+** for store-readiness QA (compile/target per table above).

## Local run

```bash
pnpm install
pnpm --filter @parton/mobile start
pnpm --filter @parton/mobile android   # requires SDK + emulator/device
pnpm --filter @parton/mobile ios       # requires macOS + Xcode
```

## Release

Fastlane lanes: `bundle exec fastlane ios beta|release`, `bundle exec fastlane android beta|release`. Store upload requires CI secrets ([`PartonNewArch/mobile/07-fastlane.md`](../../PartonNewArch/mobile/07-fastlane.md)).
