import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Order-service запускается из своей папки, поэтому вручную подтягиваем .env из корня проекта.
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

// URL клиента нужен YooKassa, чтобы вернуть пользователя обратно после оплаты.
export function getClientUrl() {
  return process.env.CLIENT_URL ?? 'http://localhost:3000';
}
