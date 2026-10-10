# 06 — iOS + Android platform readiness (latest)

**Status:** `accepted`  
**Last updated:** 2026-10-10  
**ADR:** [0029 — Dual-platform latest iOS & Android](../backend/adr/0029-dual-platform-ios-android.md)  
**Stack:** Bare React Native (no Expo) — [ADR-0006](../backend/adr/0006-bare-react-native-no-expo.md)  
**Latest libs:** [ADR-0028](../backend/adr/0028-latest-stable-stack.md) · [agents/09](../agents/09-latest-stack-policy.md)

> PartOn mobile **must** be production-ready for **both iOS and Android**. Target the **latest stable** OS releases and the SDK/tooling required by the **latest stable React Native**. Never ship an iOS-only or Android-only product slice.

---

## Verdict

| Topic | Stance |
| --- | --- |
| Platforms | **iOS + Android** — both first-class from S2 onward |
| OS targets | **Latest stable** iOS and Android for QA/store readiness |
| Min OS / SDK | Follow **current RN template** floors (verify at scaffold — do not invent) |
| Tooling | Latest stable **Xcode** + **Android Studio / SDK** required by that RN |
| UI chrome | iOS: Liquid Glass principles — [05](05-wwdc-liquid-glass.md); Android: Material 3 Expressive — same tokens |
| Feature parity | Same cases, screens, REST, AuthZ; platform-idiomatic chrome only |
| CI | **Both** `ios` and `android` build jobs green |
| Store | **Fastlane** → App Store + Play — [07](07-fastlane.md) · ADR-0030 |

---

## 1. Why both + latest

| Driver | Implication |
| --- | --- |
| Turkey marketplace | Workers/employers on mixed devices |
| Check-in / FCM / Keychain | Native modules must work on both |
| Liquid Glass + M3 | Latest OS for design language fidelity |
| ADR-0028 | Latest RN pulls latest platform SDK expectations |

---

## 2. Version policy (re-resolve at scaffold)

Do **not** hardcode stale API levels in memory. At init:

```bash
# From the RN version you installed (@latest):
# - Read ios/Podfile platform :ios
# - Read android minSdkVersion / compileSdkVersion / targetSdkVersion
# - Install matching Xcode + Android SDK Platform
```

| Layer | Policy |
| --- | --- |
| **compile / target Android** | SDK required by current RN (e.g. RN 0.86 docs: **Android 15 / API 35**, Build-Tools current) |
| **minSdk Android** | RN template minimum (never below RN’s supported floor) |
| **iOS deployment target** | RN template `platform :ios` (never below RN’s supported floor) |
| **QA devices / simulators** | Latest **stable** iOS simulator + latest Android emulator system image |
| **Xcode** | Latest stable that supports that iOS SDK |
| **Edge-to-edge (Android 15+)** | Enabled per RN guidance when on current RN |

Document the resolved numbers in `apps/mobile/PLATFORM.md` (generated at scaffold) so CI and humans share one source.

---

## 3. Dual-platform product rules

| Rule | Detail |
| --- | --- |
| **Same screen IDs** | `m.*` catalogs apply to both |
| **Same REST client** | One API layer; platform storage adapters only |
| **Push** | FCM on both (iOS via APNs) — real sandbox |
| **Secure storage** | Keychain (iOS) + Keystore/EncryptedSharedPreferences (Android) |
| **Permissions** | Location / notifications flows on **both** with platform copy |
| **Deep links** | Universal Links + App Links + `parton://` |
| **a11y** | VoiceOver + TalkBack on P0 |
| **No `#ifdef` product features** | Platform forks only for chrome, permissions APIs, store IAP later |

---

## 4. Design mapping

| Concern | iOS (latest) | Android (latest) |
| --- | --- | --- |
| Chrome | Liquid Glass / translucent system bars | Material 3 navigation / edge-to-edge |
| Content | Solid cards, PartOn tokens | Same tokens / elevation |
| Motion | Native stack; Reduce Motion | Same; system settings |
| Typography | Dynamic Type | Font scale / TalkBack |

See [05-wwdc-liquid-glass](05-wwdc-liquid-glass.md) · [shared/01-color-system](../shared/01-color-system.md) · [shared/09](../shared/09-modern-ui-principles.md).

---

## 5. CI / DoD (mobile slices)

- [ ] `npx react-native run-ios` (or CI xcodebuild) succeeds on latest stable simulator  
- [ ] `npx react-native run-android` succeeds on latest stable emulator (API = compile target)  
- [ ] Detox/Maestro smoke (when introduced) runs on **both**  
- [ ] FCM token register works on both platform builds  
- [ ] Permission + check-in path exercised on both  
- [ ] No Expo packages in `package.json` / native projects  
- [ ] `PLATFORM.md` lists resolved min/target SDK versions  

A slice that only builds on one OS is **incomplete**.

---

## 6. Agent rules

1. Never prioritize “iOS first, Android later” for marketplace features.  
2. When adding a native module, add **both** `ios/` and `android/` bindings or reject the dependency.  
3. Re-read RN release notes for the installed version’s platform floors.  
4. Latest iOS/Android **OS** for QA ≠ raising min OS beyond RN support without product ADR.

---

## Related

- [ADR-0029](../backend/adr/0029-dual-platform-ios-android.md)  
- Fastlane: [07](07-fastlane.md) · [ADR-0030](../backend/adr/0030-fastlane-mobile-release.md)  
- NativeWind: [04](04-nativewind-ui.md)  
- Routing: [`../shared/08-routing.md`](../shared/08-routing.md)  
- Scaffold: [`../agents/03-scaffold-spec.md`](../agents/03-scaffold-spec.md)  
