// One editor, one password. The password is the ADMIN_PASSWORD environment variable; a successful
// login sets a signed, HttpOnly session cookie (SESSION_SECRET) that lasts 14 days.

import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { db, ensureSchema } from './db.js';
import { cookies, clientIp } from './http.js';

const COOKIE = 'soil_admin';
const MAX_AGE = 14 * 24 * 60 * 60;
const MAX_FAILURES = 8;          // per IP address
const WINDOW_MINUTES = 15;

export function authConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
}

const sign = (value) => createHmac('sha256', process.env.SESSION_SECRET).update(value).digest('base64url');
const digest = (s) => createHash('sha256').update(String(s)).digest();

export function isAdmin(request) {
  if (!authConfigured()) return false;
  const raw = cookies(request)[COOKIE];
  if (!raw) return false;
  const [exp, sig] = raw.split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const expected = sign(`v1.${exp}`);
  return sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

function cookieAttrs(request, maxAge) {
  const secure = new URL(request.url).protocol === 'https:' || process.env.VERCEL ? '; Secure' : '';
  return `Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function sessionCookie(request) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  return `${COOKIE}=${exp}.${sign(`v1.${exp}`)}; ${cookieAttrs(request, MAX_AGE)}`;
}

export function clearCookie(request) {
  return `${COOKIE}=; ${cookieAttrs(request, 0)}`;
}

// Returns { ok } or { ok: false, status, error }.
export async function checkPassword(request, password) {
  if (!authConfigured()) {
    return { ok: false, status: 503, error: 'Admin login is not set up. Add ADMIN_PASSWORD and SESSION_SECRET (32+ characters) to the environment.' };
  }
  await ensureSchema();
  const sql = db();
  const ip = clientIp(request);
  const [{ n }] = await sql`
    select count(*)::int as n from login_attempts
    where ip = ${ip} and at > now() - make_interval(mins => ${WINDOW_MINUTES})`;
  if (n >= MAX_FAILURES) {
    return { ok: false, status: 429, error: `Too many attempts. Try again in ${WINDOW_MINUTES} minutes.` };
  }
  const ok = timingSafeEqual(digest(password ?? ''), digest(process.env.ADMIN_PASSWORD));
  if (!ok) {
    await sql`insert into login_attempts (ip) values (${ip})`;
    await sql`delete from login_attempts where at < now() - interval '1 day'`;
    return { ok: false, status: 401, error: 'That password isn’t right.' };
  }
  await sql`delete from login_attempts where ip = ${ip}`;
  return { ok: true };
}
