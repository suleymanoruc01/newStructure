# @parton/mobile

Bare React Native client (no Expo). S2 shell: NativeWind, i18n `tr-TR`, React Navigation auth graph (`m.auth.*`), typed API client via `@parton/api-contracts`, refresh token in Keychain.

## Development

```bash
# from repo root — Bun 1.4.3+, builds @parton/api-contracts, npm ci here, pod install on macOS
bun run setup

cd apps/mobile
npm start
npm run ios       # macOS + Xcode simulator
npm run android   # SDK + emulator or device
```

`react-native-worklets` is a direct dependency (Reanimated 4 peer). CocoaPods only links `RNWorklets` when it is installed that way; do not drop it back to a transitive peer.

API base: `https://api.parton.app/api/v1` (`src/api/config.ts`). Release Android blocks cleartext; a debug build still allows `http://10.0.2.2:3000/api/v1`.

## Fastlane

```bash
cd apps/mobile
bundle install
bundle exec fastlane ios beta
bundle exec fastlane android beta
```

Upload steps are gated on `ASC_API_KEY_PATH`, `PLAY_JSON_KEY_PATH`, and related env vars.

## Docs

- Platform versions: [`PLATFORM.md`](./PLATFORM.md)
- Architecture: [`PartonNewArch/mobile/`](../../PartonNewArch/mobile/)
