// Public newsletter endpoint.
//   POST /api/subscribe                       sign up (form or JSON: { email, website })
//   POST /api/subscribe  action=unsubscribe   leave, from the /unsubscribe page
//   POST /api/subscribe?unsubscribe=<token>   one-click unsubscribe from mail clients (RFC 8058)

import { randomBytes } from 'node:crypto';
import { db, ensureSchema } from '../lib/db.js';
import { json, redirect, readForm } from '../lib/http.js';

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i;

async function unsubscribe(token) {
  if (!token) return false;
  const rows = await db()`update subscribers set status = 'unsubscribed', unsubscribed_at = now()
                          where token = ${token} and status = 'active' returning id`;
  return rows.length > 0;
}

async function handle(request) {
  await ensureSchema();
  const url = new URL(request.url);
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');

  const oneClick = url.searchParams.get('unsubscribe');
  if (oneClick) {
    await unsubscribe(oneClick);
    return json({ ok: true });
  }

  const form = await readForm(request);
  if (form.action === 'unsubscribe') {
    await unsubscribe(String(form.token || ''));
    return redirect('/unsubscribe?done=1');
  }

  const reply = (status, ok, message) => (wantsJson
    ? json({ ok, message }, ok ? 200 : 400)
    : redirect(`/?subscribed=${status}#newsletter`));

  if (form.website) return reply('subscribed', true, 'Thank you — you’re on the list.'); // spam trap
  const email = String(form.email || '').trim();
  if (email.length > 254 || !EMAIL_RE.test(email)) return reply('invalid', false, 'That email address doesn’t look right.');

  await db()`
    insert into subscribers (email, token, source) values (${email}, ${randomBytes(18).toString('base64url')}, 'site')
    on conflict (lower(email)) do update set status = 'active', unsubscribed_at = null`;
  return reply('subscribed', true, 'Thank you — you’re on the list.');
}

export async function POST(request) {
  try {
    return await handle(request);
  } catch (err) {
    console.error(err);
    return json({ ok: false, message: 'Something went wrong. Please try again.' }, 500);
  }
}

export const GET = () => redirect('/#newsletter');
