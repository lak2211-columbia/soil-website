// Local development server. Mirrors what Vercel does in production:
// static files from public/, the rewrites and headers in vercel.json, and the functions in api/.
// `npm run dev` starts Postgres (dev/db.js) and serves http://127.0.0.1:3000.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { join, normalize, extname } from 'node:path';
import { start as startDb, loadEnv } from './db.js';

const root = new URL('..', import.meta.url).pathname;
const publicDir = join(root, 'public');
const PORT = Number(process.env.PORT) || 3000;

loadEnv();
startDb();
const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.txt': 'text/plain',
};

// "/stories/:slug" → regex with named groups; ":name*" matches the rest of the path.
function compile(pattern) {
  const names = [];
  const src = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/:(\w+)(\*)?/g, (m, name, star) => {
    names.push(name);
    return star ? '(.*)' : '([^/]+)';
  });
  return { re: new RegExp(`^${src}$`), names };
}
const rewrites = config.rewrites.map((r) => ({ ...r, ...compile(r.source) }));
const headerRules = (config.headers ?? []).map((h) => ({ re: new RegExp(`^${h.source}$`), headers: h.headers }));

function rewrite(url) {
  for (const r of rewrites) {
    const m = url.pathname.match(r.re);
    if (!m) continue;
    let dest = r.destination;
    r.names.forEach((name, i) => { dest = dest.replace(new RegExp(`:${name}\\*?`, 'g'), m[i + 1]); });
    const next = new URL(dest, url);
    for (const [k, v] of url.searchParams) if (!next.searchParams.has(k)) next.searchParams.append(k, v);
    return next;
  }
  return url;
}

async function serveFunction(name, req, url) {
  const file = join(root, 'api', `${name}.js`);
  const mod = await import(file);
  const handler = mod[req.method];
  if (!handler) return new Response('Method not allowed', { status: 405 });
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
  headers.set('x-forwarded-for', req.socket.remoteAddress || '127.0.0.1');
  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const request = new Request(url, {
    method: req.method, headers, body: hasBody ? Readable.toWeb(req) : undefined, duplex: hasBody ? 'half' : undefined,
  });
  return handler(request);
}

async function serveStatic(pathname) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(publicDir, safe);
  if (!file.startsWith(publicDir)) return null;
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    return new Response(body, { headers: { 'content-type': TYPES[extname(file)] || 'application/octet-stream' } });
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const original = new URL(req.url, `http://${req.headers.host || `127.0.0.1:${PORT}`}`);
  let response;
  try {
    // Like Vercel: files in public/ win, then rewrites, then functions.
    response = (original.pathname !== '/' && await serveStatic(original.pathname)) || null;
    if (!response) {
      const url = rewrite(original);
      const fn = url.pathname.match(/^\/api\/([\w-]+)$/);
      response = fn ? await serveFunction(fn[1], req, url) : await serveStatic(url.pathname);
    }
    response ??= new Response('Not found', { status: 404 });
  } catch (err) {
    console.error(err);
    response = new Response(`Dev server error:\n${err.stack}`, { status: 500 });
  }
  const headers = {};
  response.headers.forEach((v, k) => { if (k !== 'set-cookie') headers[k] = v; });
  for (const rule of headerRules) if (rule.re.test(original.pathname)) for (const h of rule.headers) headers[h.key.toLowerCase()] ??= h.value;
  const cookies = response.headers.getSetCookie();
  if (cookies.length) headers['set-cookie'] = cookies;
  res.writeHead(response.status, headers);
  res.end(req.method === 'HEAD' ? undefined : Buffer.from(await response.arrayBuffer()));
  if (!original.pathname.match(/\.(css|js|svg|png|jpe?g|webp|ico)$/)) {
    console.log(`${req.method} ${original.pathname}${original.search} → ${response.status}`);
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`SOIL dev server: http://127.0.0.1:${PORT}  (admin: /admin)`);
});
