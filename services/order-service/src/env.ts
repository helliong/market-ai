import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function loadRootEnv() {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '..', '..', '.env'),
  ];
  const envFile = candidates.find((candidate) => existsSync(candidate));

  if (!envFile) {
    return;
  }

  const lines = readFileSync(envFile, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const [rawKey, ...valueParts] = trimmed.split('=');
    const key = rawKey.trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = valueParts.join('=').trim();
  }
}

export function getClientUrl() {
  return process.env.CLIENT_URL ?? 'http://localhost:3000';
}
