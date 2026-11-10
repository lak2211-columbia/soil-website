// HTML helpers for the hand-written templates.

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHref(url) {
  const u = String(url).trim();
  if (/^(https?:|mailto:)/i.test(u) || u.startsWith('/') || u.startsWith('#')) return u;
  return '';
}

// Inline markup for editor-written text:
//   *word*        → <em>word</em>
//   **한글**       → <b class="ko">한글</b>  (an upright Korean phrase)
//   [text](url)   → a link (http, https, mailto, or a path on this site)
// Everything else is escaped.
export function inline(text) {
  return esc(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
      const href = safeHref(url.replace(/&amp;/g, '&'));
      return href ? `<a href="${esc(href)}">${label}</a>` : label;
    })
    .replace(/\*\*(.+?)\*\*/g, '<b class="ko">$1</b>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

// Inline markup removed, for <title>, meta descriptions and plain-text email.
export function plain(text) {
  return String(text ?? '')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1');
}

export const issueLabel = (n) => `No. ${String(n).padStart(2, '0')}`;
