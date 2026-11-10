// Small helpers around the Web Request/Response objects every function receives.

export const PUBLIC_CACHE = 'public, max-age=0, s-maxage=60, stale-while-revalidate=600';
export const NO_STORE = 'private, no-store';

export function html(body, { status = 200, cache = PUBLIC_CACHE } = {}) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': cache },
  });
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': NO_STORE, ...headers },
  });
}

export function redirect(location, status = 303) {
  return new Response(null, { status, headers: { location, 'cache-control': NO_STORE } });
}

export function clientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  return (fwd ? fwd.split(',')[0] : request.headers.get('x-real-ip') || 'local').trim();
}

export function siteUrl(request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  return new URL(request.url).origin;
}

export function cookies(request) {
  const out = {};
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

// Reads a form or JSON body into a plain object.
export async function readForm(request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return request.json().catch(() => ({}));
  if (type.includes('form')) return Object.fromEntries(await request.formData());
  return {};
}
