// The page shell shared by every public page: head, header, footer, palette bar.

import { esc, inline, plain, issueLabel } from '../html.js';
import { art } from '../art.js';
import { svgDefs } from './defs.js';
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

function header(settings) {
  const { site } = settings;
  return `<header id="site-header">
  <div class="header-inner">
    <a href="/" class="logo" aria-label="${esc(site.title)} home">${wordmark}</a>
    <nav class="nav">
      ${site.nav.map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('\n      ')}
    </nav>
  </div>
</header>`;
}

function footer(settings, issue) {
  const { site } = settings;
  const year = new Date().getFullYear();
  const copy = [`© ${year} ${site.title}`, site.taglineKo,
    issue && `Issue ${issueLabel(issue.number)}`, issue && issue.season, 'All Rights Reserved']
    .filter(Boolean).map(esc).join(' · ');
  return `<footer>
  <div>
    <div class="footer-logo" role="img" aria-label="${esc(site.title)}">${wordmark}</div>
    <div class="footer-tag">${esc(site.footerTagline)}</div>
  </div>
  <nav class="footer-links">
    ${site.footerLinks.map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}
  </nav>
  <div class="footer-copy">${copy}</div>
</footer>`;
}

const paletteBar = `<div class="palette-bar" role="group" aria-label="Color scheme">
  <span class="pb-label">Palette</span>
  <button class="swatch sw-celadon"   data-p="celadon"   title="Porcelain &amp; Celadon" aria-pressed="true"></button>
  <button class="swatch sw-persimmon" data-p="persimmon" title="Hanji &amp; Persimmon" aria-pressed="false"></button>
  <button class="swatch sw-indigo"    data-p="indigo"    title="Bojagi Indigo" aria-pressed="false"></button>
  <button class="swatch sw-pine"      data-p="pine"      title="Pine &amp; Clay" aria-pressed="false"></button>
  <button class="swatch sw-ink"       data-p="ink"       title="Ink (dark)" aria-pressed="false"></button>
</div>`;

export function layout({ settings, issue, title, description, body, preview = false, noindex = false, canonical = '' }) {
  const desc = plain(description || settings.site.description);
  return `<!DOCTYPE html>
<html lang="en" data-palette="celadon">
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
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/soil.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script src="/js/soil.js" defer></script>
</head>
<body>
${preview ? '<div class="preview-flag">Preview · drafts are visible only to you</div>' : ''}
${svgDefs}
${header(settings)}
${body}
${footer(settings, issue)}
${paletteBar}
</body>
</html>`;
}

export { inline };
