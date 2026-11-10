// Article, archive, contributor, unsubscribe and not-found pages.

import { esc, inline, plain, issueLabel } from '../html.js';
import { renderBlocks, readMinutes } from '../blocks.js';
import { SECTION_ANCHORS } from '../content.js';
import { layout, photo, metaLine, storyUrl } from './layout.js';

export function renderStory({ settings, current, story, contributors, related, preview, siteUrl }) {
  const section = settings.sections[story.section];
  const minutes = readMinutes(story);
  const names = (story.authors ?? []).map((a) =>
    `<a href="/contributors/${esc(a.slug)}"><strong>${esc(a.name)}</strong></a>`).join(' &amp; ');
  const byline = [names && `By ${names}`, story.credit && esc(story.credit), minutes && `${minutes} min read`]
    .filter(Boolean).join(' · ');
  const eyebrow = [
    `<a href="/#${SECTION_ANCHORS[story.section]}">${esc(section.hangul)} · ${esc(story.category || section.name)}</a>`,
    story.issue_number && `<a href="/issues/${story.issue_number}">Issue ${issueLabel(story.issue_number)}</a>`,
    story.kind && esc(story.kind),
  ].filter(Boolean).join('<span aria-hidden="true"> · </span>');
  const portrait = story.section === 'dress' || String(story.art).startsWith('portrait');
  const hasBody = (story.body ?? []).some((b) => b.text || b.q || b.a || b.url || b.type === 'divider');

  const bios = contributors.filter((c) => c.bio);
  const body = `<main class="article">
  <div class="article-head reveal">
    <div class="article-eyebrow">${eyebrow}</div>
    <h1 class="article-title">${inline(story.title)}</h1>
    ${story.dek ? `<p class="article-dek">${inline(story.dek)}</p>` : ''}
    ${byline ? `<div class="byline">${byline}</div>` : ''}
    ${story.status !== 'published' ? '<div class="draft-flag">Draft</div>' : ''}
  </div>
  ${(story.art || story.photos?.length) ? `<figure class="article-hero${portrait ? ' portrait' : ''} reveal">${photo(story, { eager: true })}</figure>` : ''}
  <div class="article-body">
    ${hasBody ? renderBlocks(story.body) : '<p class="article-pending">The full text of this story hasn’t been published online yet.</p>'}
  </div>
  ${bios.length ? `<aside class="article-bios">
    ${bios.map((c) => `<p><a href="/contributors/${esc(c.slug)}"><strong>${esc(c.name)}</strong></a> ${inline(c.bio)}</p>`).join('\n    ')}
  </aside>` : ''}
  ${related.length ? `<section class="related">
    <div class="sidebar-head">More from Issue ${issueLabel(story.issue_number)}</div>
    <div class="related-grid">
      ${related.map((r) => `<a class="related-item" href="${storyUrl(r)}">
        <div class="related-thumb">${photo(r)}</div>
        <div class="issue-cat">${esc(settings.sections[r.section].hangul)} · ${esc(r.category || settings.sections[r.section].name)}</div>
        <div class="issue-name">${inline(r.title)}</div>
      </a>`).join('\n      ')}
    </div>
  </section>` : ''}
</main>`;
  return layout({
    settings, issue: current, preview, body,
    title: `${plain(story.title)} — ${settings.site.title}`,
    description: story.dek,
    canonical: siteUrl ? `${siteUrl}${storyUrl(story)}` : '',
  });
}

export function renderIssues({ settings, current, issues }) {
  const body = `<main class="archive">
  <div class="eyebrow-block reveal">
    <div class="eyebrow">The Archive</div>
    <div class="divider"></div>
    <div class="strap">Every issue of ${esc(settings.site.title)}, from the first</div>
  </div>
  <div class="archive-grid">
    ${issues.map((i) => `<a class="archive-item reveal" href="/issues/${i.number}">
      <figure>${photo({ art: i.cover_art, photos: i.cover_photos, photo_alt: i.cover_photo_alt })}</figure>
      <div class="issue-cat">Issue ${issueLabel(i.number)} · ${esc(i.season)}</div>
      ${i.cover_title ? `<div class="archive-title">${inline(i.cover_title)}</div>` : ''}
    </a>`).join('\n    ')}
  </div>
  ${issues.length ? '' : '<p class="article-pending">No issues have been published yet.</p>'}
</main>`;
  return layout({ settings, issue: current, body, title: `Archive — ${settings.site.title}` });
}

export function renderContributor({ settings, current, person, stories }) {
  const body = `<main class="contributor">
  <div class="contributor-head reveal">
    ${person.photo_url ? `<img class="contributor-photo" src="${esc(person.photo_url)}" alt="${esc(person.name)}">` : ''}
    ${person.role ? `<div class="eyebrow">${esc(person.role)}</div>` : ''}
    <h1 class="article-title">${esc(person.name)}</h1>
    ${person.bio ? `<p class="article-dek">${inline(person.bio)}</p>` : ''}
  </div>
  ${stories.length ? `<div class="culture-grid">
    ${stories.map((s) => {
      const meta = metaLine(s, readMinutes(s));
      return `<article class="culture-card reveal">
      <a class="fig-link" href="${storyUrl(s)}" tabindex="-1" aria-hidden="true"><figure>${photo(s)}</figure></a>
      <span class="tag tag-culture">${esc(settings.sections[s.section].hangul)}${s.issue_number ? ` · Issue ${issueLabel(s.issue_number)}` : ''}</span>
      <h3 class="culture-title"><a href="${storyUrl(s)}">${inline(s.title)}</a></h3>
      ${s.dek ? `<p class="culture-dek">${inline(s.dek)}</p>` : ''}
      ${meta ? `<div class="meta">${meta}</div>` : ''}
    </article>`;
    }).join('\n    ')}
  </div>` : ''}
</main>`;
  return layout({ settings, issue: current, body, title: `${person.name} — ${settings.site.title}`, description: person.bio });
}

export function renderUnsubscribe({ settings, current, token, subscriber, done }) {
  const masked = subscriber ? subscriber.email.replace(/^(.).*?(@.*)$/, '$1•••$2') : '';
  const inner = done
    ? `<h1 class="news-title">You’re <em>unsubscribed</em></h1><p class="news-dek">You won’t receive the ${esc(settings.newsletter.eyebrow)} any more. You can sign up again any time.</p>`
    : subscriber
      ? `<h1 class="news-title">Leave the <em>letter</em>?</h1>
         <p class="news-dek">Stop sending the ${esc(settings.newsletter.eyebrow)} to ${esc(masked)}.</p>
         <form class="news-form solo" method="post" action="/api/subscribe">
           <input type="hidden" name="action" value="unsubscribe">
           <input type="hidden" name="token" value="${esc(token)}">
           <button type="submit">Unsubscribe</button>
         </form>`
      : `<h1 class="news-title">Link <em>expired</em></h1><p class="news-dek">This unsubscribe link isn’t valid. If you keep receiving letters, reply to one and we’ll remove you.</p>`;
  const body = `<main><section class="newsletter standalone">${inner}</section></main>`;
  return layout({ settings, issue: current, body, title: `Newsletter — ${settings.site.title}`, noindex: true });
}

export function renderNotFound({ settings, current }) {
  const body = `<main><div class="eyebrow-block">
    <div class="eyebrow">Not found</div>
    <div class="divider"></div>
    <div class="strap">This page isn’t here. <a href="/">Return to the current issue</a>.</div>
  </div></main>`;
  return layout({ settings, issue: current, body, title: `Not found — ${settings.site.title}`, noindex: true });
}
