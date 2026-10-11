# @parton/mobile

Bare React Native client (no Expo). S2 shell: NativeWind, i18n `tr-TR`, React Navigation auth graph (`m.auth.*`), typed API client via `@parton/api-contracts`, refresh token in Keychain.

## Development

```bash
# from repo root
pnpm install
pnpm --filter @parton/mobile start
pnpm --filter @parton/mobile android
pnpm --filter @parton/mobile ios
```

Default API base: `http://localhost:3000/api/v1` (iOS) / `http://10.0.2.2:3000/api/v1` (Android emulator) — see `src/api/config.ts`.

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
