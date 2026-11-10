// Loads the starter content (Issue No. 04) into an empty database.
// Run locally with `npm run db:seed`; on Vercel the admin dashboard offers the same thing
// when the database has no issues yet.

import data from './seed-data.js';
import { db, ensureSchema, json } from '../lib/db.js';

export async function isEmpty(sql = db()) {
  const [{ n }] = await sql`select count(*)::int as n from issues`;
  return n === 0;
}

export async function seed(sql = db()) {
  await ensureSchema();
  return sql.begin(async (tx) => {
    const [{ n }] = await tx`select count(*)::int as n from issues`;
    if (n > 0) return { seeded: false, reason: 'The database already has issues.' };

    for (const [key, value] of Object.entries(data.settings)) {
      await tx`insert into settings (key, value) values (${key}, ${json(value)}::jsonb)
               on conflict (key) do nothing`;
    }

    const contributorIds = {};
    for (const c of data.contributors) {
      const [row] = await tx`insert into contributors (slug, name, role) values (${c.slug}, ${c.name}, ${c.role})
                             on conflict (slug) do update set name = excluded.name returning id`;
      contributorIds[c.slug] = row.id;
    }

    const now = new Date();
    const [issue] = await tx`
      insert into issues (number, season, strap, status, is_current, cover_kicker, published_at)
      values (${data.issue.number}, ${data.issue.season}, ${data.issue.strap}, 'published', true,
              ${data.issue.coverKicker}, ${now})
      returning id`;

    const storyIds = {};
    for (const s of data.stories) {
      const [row] = await tx`
        insert into stories (slug, title, dek, section, category, kind, read_minutes, credit, issue_id,
                             position, art, photos, photo_alt, status, published_at)
        values (${s.slug}, ${s.title}, ${s.dek ?? ''}, ${s.section}, ${s.category ?? ''}, ${s.kind ?? ''},
                ${s.readMinutes ?? null}, ${s.credit ?? ''}, ${issue.id}, ${s.position ?? 0}, ${s.art},
                ${json(s.photos)}::jsonb, ${s.photoAlt ?? ''}, ${s.status ?? 'published'},
                ${s.status === 'draft' ? null : now})
        returning id`;
      storyIds[s.slug] = row.id;
      for (const [i, slug] of (s.authors ?? []).entries()) {
        await tx`insert into story_contributors (story_id, contributor_id, position)
                 values (${row.id}, ${contributorIds[slug]}, ${i})`;
      }
    }

    const highlights = data.issue.highlightSlugs.map((slug) => storyIds[slug]);
    await tx`update issues set cover_story_id = ${storyIds[data.issue.coverSlug]},
                               highlight_ids = ${highlights}::int[]
             where id = ${issue.id}`;
    return { seeded: true, stories: data.stories.length, contributors: data.contributors.length };
  });
}

if (process.argv[1]?.endsWith('db/seed.js')) {
  const { loadEnv } = await import('../dev/db.js');
  loadEnv();
  const result = await seed();
  console.log(result);
  await db().end();
}
