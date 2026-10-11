#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fail() {
  echo "verify-ponytail-integration: $1" >&2
  exit 1
}

[[ -f "$ROOT/vendor/ponytail/LICENSE" ]] || fail "missing vendor/ponytail (run vendor README refresh)"
[[ -f "$ROOT/.cursor/skills/ponytail/SKILL.md" ]] || fail "missing .cursor/skills — run: bun run ponytail:sync"
[[ -f "$ROOT/.cursor/rules/ponytail.mdc" ]] || fail "missing .cursor/rules/ponytail.mdc"
[[ -f "$ROOT/.cursor/rules/parton-ponytail-precedence.mdc" ]] || fail "missing parton-ponytail-precedence.mdc"
grep -q 'run-ponytail-hook.mjs' "$ROOT/.cursor/hooks.json" || fail ".cursor/hooks.json must use portable run-ponytail-hook.mjs"
[[ -f "$ROOT/PartonNewArch/agents/11-ponytail-integration.md" ]] || fail "missing integration doc"

echo "Ponytail integration OK"
