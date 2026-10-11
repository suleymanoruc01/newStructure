import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';

export const PARTON_E2E_S3_ENDPOINT_FILE = '/tmp/parton-e2e-s3-endpoint';

let proc: ChildProcess | null = null;

function pickPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      server.close((err) => (err ? reject(err) : resolve(port)));
    });
    server.on('error', reject);
  });
}

export default async function globalSetup() {
  const port = await pickPort();
  const endpoint = `http://127.0.0.1:${port}`;
  writeFileSync(PARTON_E2E_S3_ENDPOINT_FILE, endpoint, 'utf8');
  const dataDir = join('/tmp', `parton-s3rver-${port}`);
  mkdirSync(dataDir, { recursive: true });
  proc = spawn(
    'node',
    ['test/s3rver-private.mjs', String(port), dataDir],
    { stdio: ['ignore', 'pipe', 'inherit'] },
  );
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('s3rver did not become ready')),
      15_000,
    );
    proc?.stdout?.on('data', (chunk: Buffer) => {
      if (chunk.toString().includes('ready')) {
        clearTimeout(timer);
        resolve();
      }
    });
    proc?.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`s3rver exited before ready (${code})`));
    });
  });

  return async () => {
    proc?.kill('SIGTERM');
    try {
      unlinkSync(PARTON_E2E_S3_ENDPOINT_FILE);
    } catch {
      /* ignore */
    }
  };
}
