// Read queries for the public site. `preview` includes drafts (only for a logged-in editor).

import { db, ensureSchema } from './db.js';
import seedData from '../db/seed-data.js';

const DEFAULT_SETTINGS = seedData.settings;
export const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS);
export const SECTION_ANCHORS = { dress: 'interviews', food: 'food', home: 'culture' };

export async function getSettings() {
  await ensureSchema();
  const rows = await db()`select key, value from settings`;
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const out = {};
  for (const key of SETTINGS_KEYS) out[key] = { ...DEFAULT_SETTINGS[key], ...(stored[key] ?? {}) };
  return out;
}

const authorsSql = (sql) => sql`
  coalesce((select json_agg(json_build_object('name', c.name, 'slug', c.slug) order by sc.position)
            from story_contributors sc join contributors c on c.id = sc.contributor_id
            where sc.story_id = s.id), '[]'::json) as authors`;

const visible = (sql, preview) => preview
  ? sql`true`
  : sql`s.status = 'published' and (s.issue_id is null or i.status = 'published')`;

export async function getCurrentIssue({ preview = false } = {}) {
  await ensureSchema();
  const sql = db();
  const [issue] = await sql`
    select * from issues
    where ${preview ? sql`true` : sql`status = 'published'`}
    order by is_current desc, number desc limit 1`;
  return issue ?? null;
}

export async function getIssueByNumber(number, { preview = false } = {}) {
  await ensureSchema();
  const sql = db();
  const [issue] = await sql`
    select * from issues where number = ${number}
    and ${preview ? sql`true` : sql`status = 'published'`}`;
  return issue ?? null;
}

export async function getIssueStories(issueId, { preview = false } = {}) {
  const sql = db();
  return sql`
    select s.*, ${authorsSql(sql)}
    from stories s join issues i on i.id = s.issue_id
    where s.issue_id = ${issueId} and ${visible(sql, preview)}
    order by s.section, s.position, s.id`;
}

export async function getStory(slug, { preview = false } = {}) {
  await ensureSchema();
  const sql = db();
  const [story] = await sql`
    select s.*, i.number as issue_number, i.season as issue_season, ${authorsSql(sql)}
    from stories s left join issues i on i.id = s.issue_id
    where s.slug = ${slug} and ${visible(sql, preview)}`;
  return story ?? null;
}

export async function getContributorsFor(storyId) {
  return db()`
    select c.* from story_contributors sc join contributors c on c.id = sc.contributor_id
    where sc.story_id = ${storyId} order by sc.position`;
}

export async function listIssues() {
  await ensureSchema();
  const sql = db();
  return sql`
    select i.*, s.title as cover_title, s.slug as cover_slug, s.art as cover_art,
           s.photos as cover_photos, s.photo_alt as cover_photo_alt
    from issues i left join stories s on s.id = i.cover_story_id
    where i.status = 'published'
    order by i.number desc`;
}

export async function getContributor(slug) {
  await ensureSchema();
  const sql = db();
  const [person] = await sql`select * from contributors where slug = ${slug}`;
  if (!person) return null;
  const stories = await sql`
    select s.*, i.number as issue_number, ${authorsSql(sql)}
    from stories s
    join story_contributors sc on sc.story_id = s.id and sc.contributor_id = ${person.id}
    left join issues i on i.id = s.issue_id
    where ${visible(sql, false)}
    order by s.published_at desc nulls last, s.id desc`;
  return { person, stories };
}
