#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PT="$ROOT/vendor/ponytail"

if [[ ! -d "$PT/skills" ]]; then
  echo "sync-ponytail-agents: missing $PT — clone upstream into vendor/ponytail first." >&2
  exit 1
fi

mkdir -p \
  "$ROOT/.cursor/skills" \
  "$ROOT/.agents/skills" \
  "$ROOT/.agents/rules" \
  "$ROOT/.clinerules" \
  "$ROOT/.kiro/steering" \
  "$ROOT/.qoder/rules"

rsync -a --delete "$PT/skills/" "$ROOT/.cursor/skills/"
rsync -a --delete "$PT/skills/" "$ROOT/.agents/skills/"
cp "$PT/.cursor/rules/ponytail.mdc" "$ROOT/.cursor/rules/ponytail.mdc"
cp "$PT/.agents/rules/ponytail.md" "$ROOT/.agents/rules/ponytail.md"
cp "$PT/.clinerules/ponytail.md" "$ROOT/.clinerules/ponytail.md"
cp "$PT/.kiro/steering/ponytail.md" "$ROOT/.kiro/steering/ponytail.md"
cp "$PT/.qoder/rules/ponytail.md" "$ROOT/.qoder/rules/ponytail.md"
cp "$PT/.windsurf/rules/ponytail.md" "$ROOT/.windsurf/rules/ponytail.md"

echo "Synced Ponytail skills and rules from vendor/ponytail into .cursor, .agents, Cline, Kiro, Qoder, Windsurf."
