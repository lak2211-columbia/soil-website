// Renders every public page from the database. vercel.json rewrites /, /stories/*, /issues,
// /issues/*, /contributors/* and /unsubscribe here, passing the original path as ?p=.

import {
  getSettings, getCurrentIssue, getIssueByNumber, getIssueStories, getStory,
  getContributorsFor, listIssues, getContributor,
} from '../lib/content.js';
import { renderHome, renderIssuePage } from '../lib/render/home.js';
import {
  renderStory, renderIssues, renderContributor, renderUnsubscribe, renderNotFound,
} from '../lib/render/pages.js';
import { isAdmin } from '../lib/auth.js';
import { db, databaseUrl } from '../lib/db.js';
import { html, NO_STORE, siteUrl } from '../lib/http.js';

async function handle(request) {
  const url = new URL(request.url);
  const path = (url.searchParams.get('p') || url.pathname).replace(/\/+$/, '') || '/';
  if (!databaseUrl()) {
    return html('<!doctype html><meta charset="utf-8"><title>SOIL</title><p style="font:16px Georgia;padding:40px">The site’s database isn’t connected yet. Connect a Postgres database to this Vercel project (Storage), then reload.</p>', { status: 503, cache: NO_STORE });
  }

  const preview = url.searchParams.has('preview') && isAdmin(request);
  const cache = preview ? NO_STORE : undefined;
  const settings = await getSettings();
  const current = await getCurrentIssue({ preview });
  let m;

  if (path === '/') {
    const stories = current ? await getIssueStories(current.id, { preview }) : [];
    const subscribed = url.searchParams.get('subscribed');
    return html(renderHome({ settings, issue: current, stories, preview, query: url.searchParams }),
      { cache: subscribed ? NO_STORE : cache });
  }

  if ((m = path.match(/^\/stories\/([a-z0-9-]+)$/))) {
    const story = await getStory(m[1], { preview });
    if (story) {
      const contributors = await getContributorsFor(story.id);
      const siblings = story.issue_id ? await getIssueStories(story.issue_id, { preview }) : [];
      const related = siblings.filter((s) => s.id !== story.id)
        .sort((a, b) => (a.section === story.section ? -1 : 0) - (b.section === story.section ? -1 : 0))
        .slice(0, 3);
      return html(renderStory({ settings, current, story, contributors, related, preview, siteUrl: siteUrl(request) }), { cache });
    }
  }

  if (path === '/issues') {
    return html(renderIssues({ settings, current, issues: await listIssues() }), { cache });
  }

  if ((m = path.match(/^\/issues\/(\d{1,4})$/))) {
    const issue = await getIssueByNumber(Number(m[1]), { preview });
    if (issue) {
      const stories = await getIssueStories(issue.id, { preview });
      return html(renderIssuePage({ settings, issue, current, stories, preview }), { cache });
    }
  }

  if ((m = path.match(/^\/contributors\/([a-z0-9-]+)$/))) {
    const found = await getContributor(m[1]);
    if (found) return html(renderContributor({ settings, current, ...found }), { cache });
  }

  if (path === '/unsubscribe') {
    const token = url.searchParams.get('token') || '';
    const done = url.searchParams.has('done');
    const [subscriber] = token && !done
      ? await db()`select email from subscribers where token = ${token} and status = 'active'` : [];
    return html(renderUnsubscribe({ settings, current, token, subscriber, done }), { cache: NO_STORE });
  }

  return html(renderNotFound({ settings, current }), { status: 404, cache: NO_STORE });
}

async function safe(request) {
  try {
    return await handle(request);
  } catch (err) {
    console.error(err);
    return html('<!doctype html><meta charset="utf-8"><title>SOIL</title><p style="font:16px Georgia;padding:40px">Something went wrong loading this page. Please try again in a moment.</p>', { status: 500, cache: NO_STORE });
  }
}

export const GET = safe;
export const HEAD = safe;
