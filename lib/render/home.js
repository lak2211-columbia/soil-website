// The homepage (current issue) and the archive page for any one issue share this template.

import { esc, inline, issueLabel } from '../html.js';
import { readMinutes } from '../blocks.js';
import { SECTION_ANCHORS } from '../content.js';
import { layout, photo, metaLine, storyUrl } from './layout.js';

const byline = (story) => {
  const names = (story.authors ?? []).map((a) =>
    `<a href="/contributors/${esc(a.slug)}"><strong>${esc(a.name)}</strong></a>`).join(' &amp; ');
  const parts = [names && `By ${names}`, story.credit && esc(story.credit)].filter(Boolean);
  return parts.length ? `<div class="byline">${parts.join(' · ')}</div>` : '';
};

const sectionLabel = (s) => `<div class="section-label reveal">
      <span class="numeral">${esc(s.numeral)}</span>
      <span class="section-title">${esc(s.hangul)}<span class="sub">${esc(s.sub)}</span></span>
    </div>`;

function interviewCard(s) {
  const meta = metaLine(s, readMinutes(s));
  return `<article class="interview reveal">
        <a class="portrait" href="${storyUrl(s)}" tabindex="-1" aria-hidden="true">${photo(s)}</a>
        <div>
          ${s.category ? `<div class="interview-cat">${esc(s.category)}</div>` : ''}
          <h3 class="interview-title"><a href="${storyUrl(s)}">${inline(s.title)}</a></h3>
          ${s.dek ? `<p class="interview-dek">${inline(s.dek)}</p>` : ''}
          ${meta ? `<div class="meta">${meta}</div>` : ''}
        </div>
      </article>`;
}

function card(s, kind, tag) {
  const meta = metaLine(s, readMinutes(s));
  return `<article class="${kind}-card reveal">
        <a class="fig-link" href="${storyUrl(s)}" tabindex="-1" aria-hidden="true"><figure>${photo(s)}</figure></a>
        <span class="tag tag-${kind === 'food' ? 'food' : 'culture'}">${esc(tag)}</span>
        <h3 class="${kind}-title"><a href="${storyUrl(s)}">${inline(s.title)}</a></h3>
        ${s.dek ? `<p class="${kind}-dek">${inline(s.dek)}</p>` : ''}
        ${meta ? `<div class="meta">${meta}</div>` : ''}
      </article>`;
}

export function issueBody({ settings, issue, stories, archive = false }) {
  const { sections } = settings;
  const byId = new Map(stories.map((s) => [s.id, s]));
  const cover = byId.get(issue.cover_story_id);
  const highlights = (issue.highlight_ids ?? []).map((id) => byId.get(id)).filter(Boolean);
  const featured = new Set([cover?.id, ...highlights.map((h) => h.id)]);
  const inSection = (key) => stories.filter((s) => s.section === key && !featured.has(s.id));

  const eyebrow = settings.site.comingSoon || `Issue ${issueLabel(issue.number)} — ${issue.season}`;
  let html = `
  <div class="eyebrow-block reveal">
    ${archive ? '<a class="back-link" href="/issues">← All issues</a>' : ''}
    <div class="eyebrow">${esc(eyebrow)}</div>
    <div class="divider"></div>
    ${issue.strap ? `<div class="strap">${inline(issue.strap)}</div>` : ''}
  </div>`;

  if (cover || highlights.length) {
    html += `
  <section class="hero${highlights.length ? '' : ' hero-solo'}" style="padding-top:0;">
    ${cover ? `<div class="hero-main reveal">
      <a class="fig-link" href="${storyUrl(cover)}" tabindex="-1" aria-hidden="true"><figure class="hero-figure">${photo(cover, { eager: true })}</figure></a>
      <div class="kicker">${esc(issue.cover_kicker)}</div>
      <h1 class="hero-title"><a href="${storyUrl(cover)}">${inline(cover.title)}</a></h1>
      ${cover.dek ? `<p class="hero-dek">${inline(cover.dek)}</p>` : ''}
      ${byline(cover)}
    </div>` : '<div></div>'}
    ${highlights.length ? `<aside class="hero-side reveal">
      <div class="sidebar-head">In This Issue</div>
      ${highlights.map((h) => `<a class="issue-item" href="${storyUrl(h)}">
        <div class="issue-thumb">${photo(h)}</div>
        <div><div class="issue-cat">${esc(sections[h.section].hangul)} · ${esc(h.category || sections[h.section].name)}</div><div class="issue-name">${inline(h.title)}</div></div>
      </a>`).join('\n      ')}
    </aside>` : ''}
  </section>`;
  }

  const dress = inSection('dress');
  if (dress.length) html += `
  <section id="${SECTION_ANCHORS.dress}">
    ${sectionLabel(sections.dress)}
    <div class="interview-grid">
      ${dress.map(interviewCard).join('\n      ')}
    </div>
  </section>`;

  const food = inSection('food');
  if (food.length) html += `
  <section id="${SECTION_ANCHORS.food}">
    ${sectionLabel(sections.food)}
    <div class="food-grid">
      ${food.map((s) => card(s, 'food', s.category || sections.food.hangul)).join('\n      ')}
    </div>
  </section>`;

  const home = inSection('home');
  if (home.length) html += `
  <section id="${SECTION_ANCHORS.home}">
    ${sectionLabel(sections.home)}
    <div class="culture-grid">
      ${home.map((s) => card(s, 'culture', s.category || sections.home.hangul)).join('\n      ')}
    </div>
  </section>`;

  return html;
}

function about(settings, issue) {
  const a = settings.about;
  const facts = [...a.facts, issue && (settings.site.comingSoon
    ? { label: 'First Issue', value: 'Coming soon', note: '' }
    : { label: 'This Issue', value: issueLabel(issue.number), note: issue.season })]
    .filter(Boolean);
  return `
  <section id="about" class="about reveal">
    <div class="about-eyebrow">About</div>
    <h2 class="about-title">${inline(a.title)}</h2>
    <div class="about-divider"></div>
    <div class="about-body">
      <p class="lead">${inline(a.lead)}</p>
      ${a.paragraphs.map((p) => `<p>${inline(p)}</p>`).join('\n      ')}
    </div>
    <dl class="about-meta">
      ${facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}<span>${esc(f.note)}</span></dd></div>`).join('\n      ')}
    </dl>
  </section>`;
}

export function newsletterSection(settings, { status } = {}) {
  const n = settings.newsletter;
  const message = status === 'subscribed' ? 'Thank you — you’re on the list.'
    : status === 'invalid' ? 'That email address doesn’t look right.'
    : status === 'error' ? 'Something went wrong. Please try again.' : '';
  return `
<section id="newsletter" class="newsletter reveal">
  <div class="news-eyebrow">${esc(n.eyebrow)}</div>
  <h2 class="news-title">${inline(n.title)}</h2>
  <div class="news-divider"></div>
  <p class="news-dek">${inline(n.dek)}</p>
  <form class="news-form" method="post" action="/api/subscribe" data-subscribe>
    <input type="email" name="email" required placeholder="Your email address" aria-label="Your email address" autocomplete="email">
    <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
    <button type="submit">Subscribe</button>
  </form>
  <p class="news-status" role="status" aria-live="polite">${esc(message)}</p>
</section>`;
}

export function renderHome({ settings, issue, stories, preview, query }) {
  const body = issue
    ? `<main>${issueBody({ settings, issue, stories })}${about(settings, issue)}\n</main>${newsletterSection(settings, { status: query.get('subscribed') })}`
    : `<main><div class="eyebrow-block"><div class="eyebrow">${esc(settings.site.comingSoon || 'The first issue is on its way')}</div></div>${about(settings, null)}</main>${newsletterSection(settings)}`;
  const title = issue && !settings.site.comingSoon
    ? `${settings.site.title} · ${settings.site.taglineKo} — Issue ${issueLabel(issue.number)} · ${issue.season}`
    : issue ? `${settings.site.title} · ${settings.site.taglineKo}` : settings.site.title;
  return layout({ settings, issue, title, body, preview });
}

export function renderIssuePage({ settings, issue, current, stories, preview }) {
  const body = `<main>${issueBody({ settings, issue, stories, archive: true })}\n</main>`;
  const title = `${settings.site.comingSoon || `Issue ${issueLabel(issue.number)} · ${issue.season}`} — ${settings.site.title}`;
  return layout({ settings, issue: current ?? issue, title, body, preview });
}
