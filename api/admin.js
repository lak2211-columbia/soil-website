// The admin API behind /admin. One function, routed by ?r=<resource>[&id=<id>].
// Everything except login and session requires the editor's session cookie, and every change
// must carry the `x-soil-admin: 1` header (a browser won't send it cross-site).

import { randomBytes } from 'node:crypto';
import { db, ensureSchema, json as toJson, databaseUrl } from '../lib/db.js';
import { json, siteUrl } from '../lib/http.js';
import { authConfigured, isAdmin, checkPassword, sessionCookie, clearCookie } from '../lib/auth.js';
import { normalizeBlocks, wordCount } from '../lib/blocks.js';
import { getSettings, SETTINGS_KEYS } from '../lib/content.js';
import { ART_NAMES } from '../lib/art.js';
import { saveImage, blobConfigured } from '../lib/storage.js';
import { emailConfigured, canSend, renderLetter, sendMessages } from '../lib/email.js';
import { plain } from '../lib/html.js';
import { seed, isEmpty } from '../db/seed.js';

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new HttpError(status, message); };

const SECTIONS = ['dress', 'food', 'home'];
const SEND_BATCH = 50;

export function slugify(text) {
  return plain(text).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

async function uniqueSlug(sql, table, base, exceptId = 0) {
  const root = base || `${table === 'stories' ? 'story' : 'person'}-${randomBytes(3).toString('hex')}`;
  for (let i = 1; ; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const [hit] = await sql`select id from ${sql(table)} where slug = ${candidate} and id <> ${exceptId}`;
    if (!hit) return candidate;
  }
}

const int = (v, fallback = null) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? fallback : Math.trunc(Number(v)));
const text = (v, max = 5000) => String(v ?? '').slice(0, max);
const urlList = (v) => (Array.isArray(v) ? v : []).map((u) => text(u, 2000).trim()).filter(Boolean).slice(0, 10);

// ---------- stories ----------

async function storyWithContributors(sql, id) {
  const [story] = await sql`select * from stories where id = ${id}`;
  if (!story) fail(404, 'Story not found.');
  const rows = await sql`select contributor_id from story_contributors where story_id = ${id} order by position`;
  return { ...story, contributor_ids: rows.map((r) => r.contributor_id) };
}

async function saveStory(sql, id, input) {
  const current = await storyWithContributors(sql, id);
  const next = { ...current };
  if ('title' in input) next.title = text(input.title, 500).trim() || 'Untitled';
  if ('slug' in input) next.slug = slugify(input.slug) || current.slug;
  for (const k of ['dek', 'category', 'kind', 'credit', 'photo_alt']) if (k in input) next[k] = text(input[k]);
  if ('section' in input && SECTIONS.includes(input.section)) next.section = input.section;
  if ('read_minutes' in input) next.read_minutes = int(input.read_minutes);
  if ('issue_id' in input) next.issue_id = int(input.issue_id);
  if ('position' in input) next.position = int(input.position, 0);
  if ('art' in input) next.art = ART_NAMES.includes(input.art) ? input.art : '';
  if ('photos' in input) next.photos = urlList(input.photos);
  if ('body' in input) next.body = normalizeBlocks(input.body);
  if ('status' in input && ['draft', 'published'].includes(input.status)) next.status = input.status;
  if (next.status === 'published' && !next.published_at) next.published_at = new Date();

  next.slug = await uniqueSlug(sql, 'stories', next.slug, id);
  await sql`
    update stories set slug = ${next.slug}, title = ${next.title}, dek = ${next.dek}, section = ${next.section},
      category = ${next.category}, kind = ${next.kind}, read_minutes = ${next.read_minutes}, credit = ${next.credit},
      issue_id = ${next.issue_id}, position = ${next.position}, art = ${next.art}, photos = ${toJson(next.photos)}::jsonb,
      photo_alt = ${next.photo_alt}, body = ${toJson(next.body)}::jsonb, status = ${next.status},
      published_at = ${next.published_at}, updated_at = now()
    where id = ${id}`;

  if (Array.isArray(input.contributor_ids)) {
    const ids = [...new Set(input.contributor_ids.map((x) => int(x)).filter(Boolean))];
    await sql`delete from story_contributors where story_id = ${id}`;
    for (const [i, cid] of ids.entries()) {
      await sql`insert into story_contributors (story_id, contributor_id, position) values (${id}, ${cid}, ${i})
                on conflict do nothing`;
    }
  }
  return storyWithContributors(sql, id);
}

// ---------- issues ----------

async function issueDetail(sql, id) {
  const [issue] = await sql`select * from issues where id = ${id}`;
  if (!issue) fail(404, 'Issue not found.');
  const stories = await sql`
    select id, slug, title, section, position, status, art, photos, category
    from stories where issue_id = ${id} order by section, position, id`;
  return { ...issue, stories };
}

async function saveIssue(sql, id, input) {
  const issue = await issueDetail(sql, id);
  const next = { ...issue };
  if ('number' in input) next.number = int(input.number, issue.number);
  if ('season' in input) next.season = text(input.season, 200).trim() || issue.season;
  if ('strap' in input) next.strap = text(input.strap, 1000);
  if ('cover_kicker' in input) next.cover_kicker = text(input.cover_kicker, 100);
  if ('status' in input && ['draft', 'published'].includes(input.status)) next.status = input.status;
  if (next.status === 'published' && !next.published_at) next.published_at = new Date();
  const own = new Set(issue.stories.map((s) => s.id));
  if ('cover_story_id' in input) {
    const cid = int(input.cover_story_id);
    next.cover_story_id = cid && own.has(cid) ? cid : null;
  }
  if (Array.isArray(input.highlight_ids)) {
    next.highlight_ids = [...new Set(input.highlight_ids.map((x) => int(x)).filter((x) => own.has(x)))].slice(0, 6);
  }
  const [clash] = await sql`select id from issues where number = ${next.number} and id <> ${id}`;
  if (clash) fail(409, `Issue No. ${next.number} already exists.`);

  await sql.begin(async (tx) => {
    await tx`
      update issues set number = ${next.number}, season = ${next.season}, strap = ${next.strap},
        cover_kicker = ${next.cover_kicker}, status = ${next.status}, published_at = ${next.published_at},
        cover_story_id = ${next.cover_story_id}, highlight_ids = ${next.highlight_ids}::int[], updated_at = now()
      where id = ${id}`;
    // Story order and section, as arranged on the issue page.
    if (Array.isArray(input.layout)) {
      for (const row of input.layout) {
        const sid = int(row.id);
        if (!own.has(sid) || !SECTIONS.includes(row.section)) continue;
        await tx`update stories set section = ${row.section}, position = ${int(row.position, 0)}, updated_at = now()
                 where id = ${sid}`;
      }
    }
    if (input.is_current === true) {
      await tx`update issues set is_current = false where is_current and id <> ${id}`;
      await tx`update issues set is_current = true where id = ${id}`;
    }
  });
  return issueDetail(sql, id);
}

// ---------- contributors ----------

async function saveContributor(sql, id, input) {
  const [c] = await sql`select * from contributors where id = ${id}`;
  if (!c) fail(404, 'Contributor not found.');
  const name = 'name' in input ? text(input.name, 200).trim() || c.name : c.name;
  const slug = await uniqueSlug(sql, 'contributors', 'slug' in input ? slugify(input.slug) || c.slug : c.slug, id);
  const role = 'role' in input ? text(input.role, 200) : c.role;
  const bio = 'bio' in input ? text(input.bio, 3000) : c.bio;
  const photo = 'photo_url' in input ? text(input.photo_url, 2000) : c.photo_url;
  const [row] = await sql`
    update contributors set name = ${name}, slug = ${slug}, role = ${role}, bio = ${bio}, photo_url = ${photo},
      updated_at = now() where id = ${id} returning *`;
  return row;
}

// ---------- newsletter ----------

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i;
export const validEmail = (e) => typeof e === 'string' && e.length <= 254 && EMAIL_RE.test(e.trim());

async function addSubscriber(sql, email, source) {
  const clean = email.trim();
  const [row] = await sql`
    insert into subscribers (email, token, source) values (${clean}, ${randomBytes(18).toString('base64url')}, ${source})
    on conflict (lower(email)) do update set status = 'active', unsubscribed_at = null
    returning *`;
  return row;
}

function letterMessage(letter, settings, base, sub, key) {
  const unsubscribeUrl = `${base}/unsubscribe?token=${encodeURIComponent(sub.token)}`;
  const oneClickUrl = `${base}/api/subscribe?unsubscribe=${encodeURIComponent(sub.token)}`;
  const { html, text: plainText } = renderLetter({ letter, settings, siteUrl: base, unsubscribeUrl });
  return { to: sub.email, subject: letter.subject, html, text: plainText, unsubscribeUrl, oneClickUrl, key };
}

// ---------- router ----------

async function route(request) {
  const url = new URL(request.url);
  const r = url.searchParams.get('r') || '';
  const id = int(url.searchParams.get('id'));
  const method = request.method;

  if (r === 'session') {
    return json({
      admin: isAdmin(request), configured: authConfigured(), database: Boolean(databaseUrl()),
      blob: blobConfigured() || !process.env.VERCEL, email: emailConfigured(), canSend: canSend(),
      local: !process.env.VERCEL,
    });
  }
  if (r === 'login' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const result = await checkPassword(request, body.password);
    if (!result.ok) return json({ error: result.error }, result.status);
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie(request) });
  }
  if (r === 'logout' && method === 'POST') return json({ ok: true }, 200, { 'set-cookie': clearCookie(request) });

  if (!isAdmin(request)) fail(401, 'Please log in.');
  if (method !== 'GET' && request.headers.get('x-soil-admin') !== '1') fail(403, 'Missing admin header.');
  await ensureSchema();
  const sql = db();
  const body = ['POST', 'PUT'].includes(method) && r !== 'upload' ? await request.json().catch(() => ({})) : {};

  switch (`${method} ${r}`) {
    // ----- dashboard -----
    case 'GET dashboard': {
      const [counts] = await sql`select
        (select count(*)::int from stories) as stories,
        (select count(*)::int from stories where status = 'draft') as drafts,
        (select count(*)::int from issues) as issues,
        (select count(*)::int from contributors) as contributors,
        (select count(*)::int from subscribers where status = 'active') as subscribers,
        (select count(*)::int from letters where status = 'sent') as letters_sent`;
      const [current] = await sql`select id, number, season, status from issues where is_current`;
      const recent = await sql`select id, title, status, updated_at from stories order by updated_at desc limit 6`;
      return json({ counts, current: current ?? null, recent, empty: await isEmpty(sql) });
    }
    case 'POST seed': return json(await seed(sql));

    // ----- stories -----
    case 'GET stories': {
      const q = `%${url.searchParams.get('q') || ''}%`;
      const issue = url.searchParams.get('issue');
      const rows = await sql`
        select s.id, s.slug, s.title, s.section, s.status, s.updated_at, s.issue_id, s.art, s.photos, s.kind,
               i.number as issue_number,
               coalesce((select string_agg(c.name, ' & ' order by sc.position) from story_contributors sc
                         join contributors c on c.id = sc.contributor_id where sc.story_id = s.id), '') as authors
        from stories s left join issues i on i.id = s.issue_id
        where s.title ilike ${q}
          and ${issue === 'none' ? sql`s.issue_id is null` : issue ? sql`s.issue_id = ${int(issue)}` : sql`true`}
        order by s.updated_at desc`;
      return json(rows);
    }
    case 'GET story': {
      const story = await storyWithContributors(sql, id);
      return json({ ...story, words: wordCount(story.body) });
    }
    case 'POST story': {
      const title = text(body.title, 500).trim() || 'Untitled story';
      const slug = await uniqueSlug(sql, 'stories', slugify(title));
      const issueId = int(body.issue_id);
      const section = SECTIONS.includes(body.section) ? body.section : 'home';
      const [{ next }] = await sql`select coalesce(max(position), 0) + 1 as next from stories
                                   where issue_id is not distinct from ${issueId} and section = ${section}`;
      const [row] = await sql`insert into stories (slug, title, section, issue_id, position)
                              values (${slug}, ${title}, ${section}, ${issueId}, ${next}) returning id`;
      return json(await storyWithContributors(sql, row.id), 201);
    }
    case 'PUT story': {
      const saved = await saveStory(sql, id, body);
      return json({ ...saved, words: wordCount(saved.body) });
    }
    case 'DELETE story': {
      await sql`update issues set cover_story_id = null where cover_story_id = ${id}`;
      await sql`update issues set highlight_ids = array_remove(highlight_ids, ${id}::int)`;
      await sql`delete from stories where id = ${id}`;
      return json({ ok: true });
    }

    // ----- issues -----
    case 'GET issues': return json(await sql`
      select i.*, (select count(*)::int from stories s where s.issue_id = i.id) as story_count
      from issues i order by number desc`);
    case 'GET issue': return json(await issueDetail(sql, id));
    case 'POST issue': {
      const [{ next }] = await sql`select coalesce(max(number), 0) + 1 as next from issues`;
      const [row] = await sql`insert into issues (number, season) values (${int(body.number, next)}, ${text(body.season, 200) || 'Season Year'})
                              returning id`;
      return json(await issueDetail(sql, row.id), 201);
    }
    case 'PUT issue': return json(await saveIssue(sql, id, body));
    case 'DELETE issue': {
      const [issue] = await sql`select is_current from issues where id = ${id}`;
      if (issue?.is_current) fail(409, 'This is the current issue. Make another issue current first.');
      await sql`update stories set issue_id = null where issue_id = ${id}`;
      await sql`delete from issues where id = ${id}`;
      return json({ ok: true });
    }

    // ----- contributors -----
    case 'GET contributors': return json(await sql`
      select c.*, (select count(*)::int from story_contributors sc where sc.contributor_id = c.id) as story_count
      from contributors c order by c.name`);
    case 'GET contributor': {
      const [c] = await sql`select * from contributors where id = ${id}`;
      if (!c) fail(404, 'Contributor not found.');
      const stories = await sql`select s.id, s.title, s.status from stories s join story_contributors sc
                                on sc.story_id = s.id where sc.contributor_id = ${id} order by s.updated_at desc`;
      return json({ ...c, stories });
    }
    case 'POST contributor': {
      const name = text(body.name, 200).trim() || 'New contributor';
      const slug = await uniqueSlug(sql, 'contributors', slugify(name));
      const [row] = await sql`insert into contributors (name, slug) values (${name}, ${slug}) returning *`;
      return json(row, 201);
    }
    case 'PUT contributor': return json(await saveContributor(sql, id, body));
    case 'DELETE contributor': {
      await sql`delete from contributors where id = ${id}`;
      return json({ ok: true });
    }

    // ----- settings -----
    case 'GET settings': return json(await getSettings());
    case 'PUT settings': {
      const key = body.key;
      if (!SETTINGS_KEYS.includes(key) || typeof body.value !== 'object') fail(400, 'Unknown settings section.');
      await sql`insert into settings (key, value) values (${key}, ${toJson(body.value)}::jsonb)
                on conflict (key) do update set value = excluded.value, updated_at = now()`;
      return json((await getSettings())[key]);
    }

    // ----- uploads -----
    case 'POST upload': {
      const type = (request.headers.get('content-type') || '').split(';')[0];
      const bytes = await request.arrayBuffer();
      return json({ url: await saveImage(bytes, type, url.searchParams.get('name')) }, 201);
    }

    // ----- subscribers -----
    case 'GET subscribers': {
      const q = `%${url.searchParams.get('q') || ''}%`;
      const status = url.searchParams.get('status');
      const rows = await sql`
        select id, email, status, source, created_at, unsubscribed_at from subscribers
        where email ilike ${q} and ${status ? sql`status = ${status}` : sql`true`}
        order by created_at desc limit 1000`;
      const [counts] = await sql`select count(*) filter (where status = 'active')::int as active,
                                        count(*) filter (where status = 'unsubscribed')::int as unsubscribed
                                 from subscribers`;
      return json({ rows, counts });
    }
    case 'GET subscribers-csv': {
      const rows = await sql`select email, status, source, created_at from subscribers order by created_at`;
      const csv = ['email,status,source,signed_up', ...rows.map((s) =>
        [s.email, s.status, s.source, s.created_at.toISOString()].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
      return new Response(csv, { headers: {
        'content-type': 'text/csv; charset=utf-8', 'cache-control': 'private, no-store',
        'content-disposition': 'attachment; filename="soil-subscribers.csv"',
      } });
    }
    case 'POST subscriber': {
      const emails = String(body.emails ?? body.email ?? '').split(/[\s,;]+/).filter(Boolean);
      const added = []; const invalid = [];
      for (const e of emails.slice(0, 5000)) {
        if (validEmail(e)) added.push((await addSubscriber(sql, e, 'admin')).email); else invalid.push(e);
      }
      return json({ added: added.length, invalid });
    }
    case 'PUT subscriber': {
      const status = body.status === 'unsubscribed' ? 'unsubscribed' : 'active';
      await sql`update subscribers set status = ${status},
                unsubscribed_at = ${status === 'unsubscribed' ? new Date() : null} where id = ${id}`;
      return json({ ok: true });
    }
    case 'DELETE subscriber': {
      await sql`delete from subscribers where id = ${id}`;
      return json({ ok: true });
    }

    // ----- letters -----
    case 'GET letters': return json(await sql`
      select id, subject, status, recipient_count, sent_at, updated_at,
             (select count(*)::int from letter_sends ls where ls.letter_id = l.id and ls.status <> 'failed') as delivered
      from letters l order by created_at desc`);
    case 'GET letter': {
      const [letter] = await sql`select * from letters where id = ${id}`;
      if (!letter) fail(404, 'Letter not found.');
      const [stats] = await sql`select
          count(*) filter (where status <> 'failed')::int as delivered,
          count(*) filter (where status = 'failed')::int as failed,
          (select count(*)::int from subscribers where status = 'active') as active
        from letter_sends where letter_id = ${id}`;
      return json({ ...letter, stats });
    }
    case 'POST letter': {
      const [row] = await sql`insert into letters (subject, body) values (${text(body.subject, 300)},
        ${toJson([{ type: 'p', text: '' }])}::jsonb) returning *`;
      return json(row, 201);
    }
    case 'PUT letter': {
      const [letter] = await sql`select status from letters where id = ${id}`;
      if (!letter) fail(404, 'Letter not found.');
      if (letter.status !== 'draft') fail(409, 'This letter has already been sent and can’t be edited.');
      const [row] = await sql`update letters set subject = ${text(body.subject, 300)}, preheader = ${text(body.preheader, 300)},
        body = ${toJson(normalizeBlocks(body.body))}::jsonb, updated_at = now() where id = ${id} returning *`;
      return json(row);
    }
    case 'DELETE letter': {
      const [letter] = await sql`select status from letters where id = ${id}`;
      if (letter && letter.status !== 'draft') fail(409, 'Sent letters are kept as a record.');
      await sql`delete from letters where id = ${id}`;
      return json({ ok: true });
    }
    case 'GET letter-preview': {
      const [letter] = await sql`select * from letters where id = ${id}`;
      if (!letter) fail(404, 'Letter not found.');
      const base = siteUrl(request);
      const { html } = renderLetter({ letter, settings: await getSettings(), siteUrl: base, unsubscribeUrl: `${base}/unsubscribe` });
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, no-store' } });
    }
    case 'POST letter-test': {
      const [letter] = await sql`select * from letters where id = ${id}`;
      if (!letter) fail(404, 'Letter not found.');
      if (!validEmail(body.to)) fail(400, 'Enter a valid email address for the test.');
      if (!letter.subject.trim()) fail(400, 'Give the letter a subject first.');
      const base = siteUrl(request);
      const msg = letterMessage({ ...letter, subject: `[Test] ${letter.subject}` }, await getSettings(), base,
        { email: body.to.trim(), token: 'test' }, `test-${id}`);
      const [result] = await sendMessages([msg]);
      if (!result.ok) fail(502, result.error);
      return json({ ok: true, status: result.status, id: result.id });
    }
    case 'POST letter-send': {
      const [letter] = await sql`select * from letters where id = ${id}`;
      if (!letter) fail(404, 'Letter not found.');
      if (letter.status === 'sent') fail(409, 'This letter has already been sent.');
      if (!letter.subject.trim()) fail(400, 'Give the letter a subject first.');
      if (!canSend()) fail(503, 'Email sending isn’t set up yet.');
      if (letter.status === 'draft') {
        const [{ n }] = await sql`select count(*)::int as n from subscribers where status = 'active'`;
        if (n === 0) fail(400, 'There are no active subscribers yet.');
        await sql`update letters set status = 'sending', recipient_count = ${n}, updated_at = now() where id = ${id}`;
      }
      const batch = await sql`
        select s.id, s.email, s.token from subscribers s
        where s.status = 'active'
          and not exists (select 1 from letter_sends ls where ls.letter_id = ${id} and ls.subscriber_id = s.id)
        order by s.id limit ${SEND_BATCH}`;
      const settings = await getSettings();
      const base = siteUrl(request);
      const results = batch.length
        ? await sendMessages(batch.map((s) => letterMessage(letter, settings, base, s, `${id}-${s.id}`)))
        : [];
      for (const [i, s] of batch.entries()) {
        const res = results[i];
        await sql`insert into letter_sends (letter_id, subscriber_id, status, provider_id, error)
                  values (${id}, ${s.id}, ${res.status}, ${res.id ?? ''}, ${res.error ?? ''})
                  on conflict do nothing`;
      }
      const failedAll = results.length > 0 && results.every((x) => !x.ok);
      const [{ remaining }] = await sql`
        select count(*)::int as remaining from subscribers s where s.status = 'active'
        and not exists (select 1 from letter_sends ls where ls.letter_id = ${id} and ls.subscriber_id = s.id)`;
      if (remaining === 0) await sql`update letters set status = 'sent', sent_at = now(), updated_at = now() where id = ${id}`;
      if (failedAll) fail(502, results[0].error);
      return json({ sent: results.filter((x) => x.ok).length, failed: results.filter((x) => !x.ok).length, remaining });
    }
    case 'POST letter-retry': {
      await sql`delete from letter_sends where letter_id = ${id} and status = 'failed'`;
      await sql`update letters set status = 'sending', sent_at = null where id = ${id} and status = 'sent'
                and exists (select 1 from subscribers s where s.status = 'active' and not exists
                  (select 1 from letter_sends ls where ls.letter_id = ${id} and ls.subscriber_id = s.id))`;
      return json({ ok: true });
    }
    default: fail(404, 'Unknown admin route.');
  }
}

async function handle(request) {
  try {
    return await route(request);
  } catch (err) {
    if (err instanceof HttpError || err.status) return json({ error: err.message }, err.status);
    if (err.code === '23505') return json({ error: 'That would duplicate an existing entry.' }, 409);
    console.error(err);
    return json({ error: 'Something went wrong on the server.' }, 500);
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
