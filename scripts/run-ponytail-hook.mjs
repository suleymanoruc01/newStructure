#!/usr/bin/env node
/**
 * Portable Cursor hook entrypoint — forwards stdin/stdout to vendored Ponytail hooks.
 * Usage: node scripts/run-ponytail-hook.mjs <activate|mode-tracker>
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const hook = process.argv[2];
const scriptName =
  hook === 'activate'
    ? 'ponytail-activate.js'
    : hook === 'mode-tracker'
      ? 'ponytail-mode-tracker.js'
      : null;

if (!scriptName) {
  process.stderr.write(
    'run-ponytail-hook: expected activate or mode-tracker\n',
  );
  process.exit(1);
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(
  repoRoot,
  'vendor',
  'ponytail',
  'hooks',
  scriptName,
);

const child = spawn(process.execPath, [target], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
