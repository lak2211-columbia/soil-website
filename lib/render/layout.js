// The page shell shared by every public page: head, header, footer, palette bar.

import { esc, inline, plain, issueLabel } from '../html.js';
import { art } from '../art.js';
import { svgDefs } from './defs.js';
import { SECTION_ANCHORS } from '../content.js';
import { wordmark } from './wordmark.js';

export function photo({ art: name, photos, photo_alt, alt }, { eager = false } = {}) {
  const svg = art[name] ?? '';
  const list = Array.isArray(photos) ? photos.filter(Boolean) : [];
  const img = list.length
    ? `<img alt="${esc(photo_alt ?? alt ?? '')}" ${eager ? '' : 'loading="lazy" '}decoding="async" data-cands="${esc(JSON.stringify(list))}">`
    : '';
  return `<div class="ph${svg ? '' : ' ph-blank'}">${svg}${img}</div>`;
}

export function metaLine(story, minutes) {
  const parts = [];
  if (story.kind) parts.push(esc(story.kind));
  if (story.authors?.length) parts.push(story.authors.map((a) => esc(a.name)).join(' &amp; '));
  else if (minutes) parts.push(`${minutes} min read`);
  return parts.join(' · ');
}

export const storyUrl = (s) => `/stories/${encodeURIComponent(s.slug)}`;

// With no published issue there are no story sections or archive to link to.
const ISSUE_LINKS = new Set([...Object.values(SECTION_ANCHORS).map((a) => `/#${a}`), '/issues']);
const links = (list, issue) => (issue ? list : list.filter((l) => !ISSUE_LINKS.has(l.href)));
const isHanja = (label) => /^[\u3400-\u9fff]+$/.test(label);
function navItem(l, issue) {
  const cls = isHanja(l.label) ? ' class="hanja"' : '';
  const isSection = ISSUE_LINKS.has(l.href) && l.href !== '/issues';
  if (!issue && isSection) return `<span${cls}>${esc(l.label)}</span>`;
  return `<a href="${esc(l.href)}"${cls}>${esc(l.label)}</a>`;
}

function header(settings, issue) {
  const { site } = settings;
  return `<header id="site-header">
  <div class="header-inner">
    <a href="/" class="logo" aria-label="${esc(site.title)} home">${wordmark}</a>
    <nav class="nav">
      ${site.nav.filter((l) => issue || l.href !== '/issues').map((l) => navItem(l, issue)).join('\n      ')}
    </nav>
  </div>
</header>`;
}

function footer(settings, issue) {
  const { site } = settings;
  const year = new Date().getFullYear();
  const copy = [`© ${year} ${site.title}`, site.taglineKo,
    !site.comingSoon && issue && `Issue ${issueLabel(issue.number)}`, !site.comingSoon && issue && issue.season, 'All Rights Reserved']
    .filter(Boolean).map(esc).join(' · ');
  return `<footer>
  <div>
    <div class="footer-logo" role="img" aria-label="${esc(site.title)}">${wordmark}</div>
    <div class="footer-tag">${esc(site.footerTagline)}</div>
  </div>
  <nav class="footer-links">
    ${links(site.footerLinks, issue).map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}
  </nav>
  <div class="footer-copy">${copy}</div>
</footer>`;
}

export function layout({ settings, issue, title, description, body, preview = false, noindex = false, canonical = '' }) {
  const desc = plain(description || settings.site.description);
  return `<!DOCTYPE html>
<html lang="en" data-palette="persimmon">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(plain(title))}</title>
<meta name="description" content="${esc(desc)}">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<meta property="og:title" content="${esc(plain(title))}">
<meta property="og:description" content="${esc(desc)}">
${preview || noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&family=Noto+Serif+KR:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/soil.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script src="/js/soil.js" defer></script>
</head>
<body>
${preview ? '<div class="preview-flag">Preview · drafts are visible only to you</div>' : ''}
${svgDefs}
${header(settings, issue)}
${body}
${footer(settings, issue)}
</body>
</html>`;
}

export { inline };
