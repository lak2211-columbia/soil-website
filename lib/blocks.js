// Story and letter bodies are an ordered list of blocks:
//   { type: 'p',       text }                         paragraph
//   { type: 'h',       text }                         subheading
//   { type: 'quote',   text, cite }                   pull quote
//   { type: 'qa',      q, a }                         interview question and answer
//   { type: 'image',   url, alt, caption, size }      size: 'normal' | 'wide'
//   { type: 'divider' }
// Text fields use the inline markup in lib/html.js.

import { esc, inline, plain } from './html.js';

const TYPES = new Set(['p', 'h', 'quote', 'qa', 'image', 'divider']);
const str = (v, max = 20000) => String(v ?? '').slice(0, max);

// Keeps only known block types and fields, so stored bodies stay clean.
export function normalizeBlocks(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((b) => b && TYPES.has(b.type))
    .slice(0, 2000)
    .map((b) => {
      switch (b.type) {
        case 'p': case 'h': return { type: b.type, text: str(b.text) };
        case 'quote': return { type: 'quote', text: str(b.text), cite: str(b.cite, 300) };
        case 'qa': return { type: 'qa', q: str(b.q), a: str(b.a) };
        case 'image': return {
          type: 'image', url: str(b.url, 2000), alt: str(b.alt, 500), caption: str(b.caption, 1000),
          size: b.size === 'wide' ? 'wide' : 'normal',
        };
        default: return { type: 'divider' };
      }
    });
}

export function wordCount(blocks) {
  let n = 0;
  for (const b of blocks ?? []) {
    for (const t of [b.text, b.q, b.a]) if (t) n += plain(t).split(/\s+/).filter(Boolean).length;
  }
  return n;
}

export function readMinutes(story) {
  if (story.read_minutes) return story.read_minutes;
  const words = wordCount(story.body);
  return words ? Math.max(1, Math.round(words / 230)) : null;
}

// Body HTML for the article page.
export function renderBlocks(blocks) {
  return (blocks ?? []).map((b) => {
    switch (b.type) {
      case 'p': return b.text.trim() ? `<p>${inline(b.text)}</p>` : '';
      case 'h': return b.text.trim() ? `<h2>${inline(b.text)}</h2>` : '';
      case 'quote': return b.text.trim()
        ? `<blockquote class="pull"><p>${inline(b.text)}</p>${b.cite ? `<cite>${inline(b.cite)}</cite>` : ''}</blockquote>`
        : '';
      case 'qa': return (b.q || b.a)
        ? `<div class="qa">${b.q ? `<p class="q">${inline(b.q)}</p>` : ''}${b.a ? `<p class="a">${inline(b.a)}</p>` : ''}</div>`
        : '';
      case 'image': return b.url
        ? `<figure class="body-figure${b.size === 'wide' ? ' wide' : ''}"><img src="${esc(b.url)}" alt="${esc(b.alt)}" loading="lazy" decoding="async">${b.caption ? `<figcaption>${inline(b.caption)}</figcaption>` : ''}</figure>`
        : '';
      case 'divider': return '<hr class="ornament">';
      default: return '';
    }
  }).join('\n');
}
