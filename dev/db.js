// Local Postgres for development: a private cluster in .dev/pgdata on port 54329.
// `npm run db:start` creates it on first run (and writes .env.local), `npm run db:stop` stops it.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dataDir = join(root, '.dev/pgdata');
const logFile = join(root, '.dev/postgres.log');
const envFile = join(root, '.env.local');
const PORT = 54329;

function pgBin(name) {
  for (const dir of ['/opt/homebrew/opt/postgresql@17/bin', '/usr/local/opt/postgresql@17/bin']) {
    if (existsSync(join(dir, name))) return join(dir, name);
  }
  return name; // fall back to PATH
}
// LC_ALL must be set or Postgres on macOS refuses to start ("postmaster became multithreaded").
const run = (bin, args) =>
  execFileSync(pgBin(bin), args, { stdio: 'pipe', env: { ...process.env, LC_ALL: 'C' } }).toString();

function isRunning() {
  try { run('pg_ctl', ['-D', dataDir, 'status']); return true; } catch { return false; }
}

export function start() {
  mkdirSync(join(root, '.dev'), { recursive: true });
  if (!existsSync(join(dataDir, 'PG_VERSION'))) {
    run('initdb', ['-D', dataDir, '-U', 'soil', '--auth=trust', '--encoding=UTF8', '--locale=C']);
    console.log('Created local database cluster in .dev/pgdata');
  }
  if (!isRunning()) {
    run('pg_ctl', ['-D', dataDir, '-l', logFile, '-o', `-p ${PORT} -k ${join(root, '.dev')} -c listen_addresses=localhost`, '-w', 'start']);
    console.log(`Postgres running on localhost:${PORT}`);
  }
  try { run('createdb', ['-h', 'localhost', '-p', String(PORT), '-U', 'soil', 'soil']); } catch { /* already exists */ }

  if (!existsSync(envFile)) {
    const password = randomBytes(9).toString('base64url');
    writeFileSync(envFile, [
      '# Local development settings. Not committed.',
      `DATABASE_URL=postgres://soil@localhost:${PORT}/soil`,
      `ADMIN_PASSWORD=${password}`,
      `SESSION_SECRET=${randomBytes(32).toString('hex')}`,
      'SITE_URL=http://127.0.0.1:3000',
      '# RESEND_API_KEY=            (leave unset locally: letters are written to .dev/outbox)',
      '# NEWSLETTER_FROM=SOIL <letter@soilmag.com>',
      '',
    ].join('\n'));
    console.log('Wrote .env.local (your local admin password is in there).');
  }
}

export function stop() {
  if (isRunning()) { run('pg_ctl', ['-D', dataDir, '-m', 'fast', 'stop']); console.log('Postgres stopped'); }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const cmd = process.argv[2];
  if (cmd === 'start') start();
  else if (cmd === 'stop') stop();
  else console.log('Usage: node dev/db.js start|stop');
}

export function loadEnv() {
  if (existsSync(envFile)) process.loadEnvFile(envFile);
}
