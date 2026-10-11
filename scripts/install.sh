#!/usr/bin/env bash
# Install the PartOn monorepo.
#
# Root workspace: Bun (packageManager in package.json). bun.lock is lockfileVersion 2,
# which Bun 1.3.x cannot read.
# apps/mobile is not a Bun workspace (ADR-0040): npm ci from apps/mobile/package-lock.json.
# Reanimated 4 autolinking needs react-native-worklets as a direct mobile dependency.
# Mobile imports @parton/api-contracts from its dist/, so that package is built after bun install.
# On macOS, CocoaPods are installed when `pod` is on PATH.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() {
  echo "install: $1" >&2
  exit 1
}

version_ge() {
  # $1 >= $2 for up to three numeric segments
  local IFS=.
  local -a have=($1) need=($2)
  local i
  for ((i = 0; i < 3; i++)); do
    local h=${have[i]:-0}
    local n=${need[i]:-0}
    if ((h > n)); then
      return 0
    fi
    if ((h < n)); then
      return 1
    fi
  done
  return 0
}

required_bun="$(sed -n 's/.*"packageManager": "bun@\([^"]*\)".*/\1/p' package.json)"
[[ -n "$required_bun" ]] || fail "package.json is missing packageManager bun@…"

if ! command -v bun >/dev/null 2>&1; then
  fail "Bun ${required_bun} or newer is required (bun.lock lockfileVersion 2). Install: curl -fsSL https://bun.com/install | bash"
fi

have_bun="$(bun --version)"
if ! version_ge "$have_bun" "$required_bun"; then
  fail "Bun ${have_bun} cannot read this lockfile. Need ${required_bun} or newer (packageManager). Upgrade: curl -fsSL https://bun.com/install | bash"
fi

echo "install: bun ${have_bun}"
bun install

echo "install: build @parton/api-contracts"
bun run --filter '@parton/api-contracts' build
[[ -f packages/api-contracts/dist/index.js ]] || fail "api-contracts dist was not produced"

echo "install: npm ci in apps/mobile"
(cd apps/mobile && npm ci)
node scripts/patch-css-interop-image-background.js
(cd apps/mobile && node -e "require.resolve('react-native-worklets/package.json')") \
  || fail "react-native-worklets must stay a direct dependency of @parton/mobile (Reanimated 4 / RNWorklets)"

if [[ "$(uname -s)" == "Darwin" ]]; then
  if command -v pod >/dev/null 2>&1; then
    echo "install: pod install (apps/mobile/ios)"
    (cd apps/mobile/ios && pod install)
  else
    echo "install: skipped CocoaPods (pod not on PATH). iOS builds need: cd apps/mobile/ios && pod install" >&2
  fi
else
  echo "install: skipped CocoaPods (not macOS)"
fi

echo "install: done"
