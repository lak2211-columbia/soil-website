// The SOIL Letter: email rendering and sending. Sending goes through Resend's HTTP API
// (RESEND_API_KEY, NEWSLETTER_FROM). Locally, without a key, letters are written to
// .dev/outbox/ as .html files instead of being sent.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { esc, inline, plain } from './html.js';

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.NEWSLETTER_FROM);
export const canSend = () => emailConfigured() || !process.env.VERCEL;

const C = { paper: '#F8F5F0', ink: '#1A1A1A', accent: '#4A6B60', slate: '#5C5C5C', grey: '#8B8577', rule: '#D8D3C7' };
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// Email clients ignore stylesheets, so every element carries its own style.
const emailInline = (text) => inline(text)
  .replace(/<a href=/g, `<a style="color:${C.accent};" href=`)
  .replace(/<b class="ko">/g, '<b style="font-weight:600;">');

function blockHtml(b) {
  const p = `margin:0 0 20px;font-family:${SERIF};font-size:20px;line-height:1.6;color:${C.ink};`;
  switch (b.type) {
    case 'p': return b.text.trim() ? `<p style="${p}">${emailInline(b.text)}</p>` : '';
    case 'h': return b.text.trim() ? `<h2 style="margin:32px 0 14px;font-family:${SERIF};font-weight:500;font-size:26px;line-height:1.2;color:${C.ink};">${emailInline(b.text)}</h2>` : '';
    case 'quote': return b.text.trim() ? `<p style="margin:28px 0;padding:18px 0;border-top:1px solid ${C.rule};border-bottom:1px solid ${C.rule};text-align:center;font-family:${SERIF};font-style:italic;font-size:26px;line-height:1.3;color:${C.accent};">${emailInline(b.text)}${b.cite ? `<br><span style="font-family:${SANS};font-style:normal;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.grey};">${emailInline(b.cite)}</span>` : ''}</p>` : '';
    case 'qa': return `${b.q ? `<p style="margin:0 0 8px;font-family:${SANS};font-size:15px;font-weight:bold;line-height:1.5;color:${C.accent};">${emailInline(b.q)}</p>` : ''}${b.a ? `<p style="${p}">${emailInline(b.a)}</p>` : ''}`;
    case 'image': return b.url ? `<div style="margin:28px 0;"><img src="${esc(b.url)}" alt="${esc(b.alt)}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;">${b.caption ? `<p style="margin:10px 0 0;font-family:${SANS};font-size:12px;line-height:1.5;color:${C.grey};">${emailInline(b.caption)}</p>` : ''}</div>` : '';
    case 'divider': return `<p style="margin:28px 0;text-align:center;font-family:${SERIF};font-size:20px;letter-spacing:8px;color:${C.grey};">· · ·</p>`;
    default: return '';
  }
}

const absolutize = (url, siteUrl) => (url && url.startsWith('/') ? siteUrl + url : url);

export function renderLetter({ letter, settings, siteUrl, unsubscribeUrl }) {
  const blocks = (letter.body ?? []).map((b) => (b.type === 'image' ? { ...b, url: absolutize(b.url, siteUrl) } : b));
  const n = settings.newsletter;
  const site = settings.site;
  const htmlBody = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(letter.subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:${C.paper};">
<div style="display:none;max-height:0;overflow:hidden;">${esc(letter.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper};"><tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td align="center" style="padding-bottom:28px;border-bottom:1px solid ${C.rule};">
  <a href="${esc(siteUrl)}" style="font-family:${SERIF};font-size:26px;font-weight:600;letter-spacing:7px;color:${C.ink};text-decoration:none;">${esc(site.title)}</a>
  <div style="margin-top:10px;font-family:${SANS};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${C.grey};">${esc(n.eyebrow)}</div>
</td></tr>
<tr><td style="padding-top:32px;">
${blocks.map(blockHtml).join('\n')}
</td></tr>
<tr><td style="padding-top:28px;border-top:1px solid ${C.rule};font-family:${SANS};font-size:11px;line-height:1.7;color:${C.grey};text-align:center;">
  ${esc(site.footerTagline)}<br>
  ${n.postalAddress ? `${esc(n.postalAddress)}<br>` : ''}
  <a href="${esc(unsubscribeUrl)}" style="color:${C.grey};">Unsubscribe</a> · <a href="${esc(siteUrl)}" style="color:${C.grey};">${esc(siteUrl.replace(/^https?:\/\//, ''))}</a>
</td></tr>
</table></td></tr></table>
</body></html>`;

  const text = [
    site.title, n.eyebrow, '',
    ...blocks.map((b) => {
      switch (b.type) {
        case 'p': case 'h': return plain(b.text);
        case 'quote': return `“${plain(b.text)}”${b.cite ? ` — ${plain(b.cite)}` : ''}`;
        case 'qa': return [b.q && `Q: ${plain(b.q)}`, b.a && plain(b.a)].filter(Boolean).join('\n');
        case 'image': return b.caption ? `[${plain(b.caption)}]` : '';
        case 'divider': return '· · ·';
        default: return '';
      }
    }).filter(Boolean).flatMap((t) => [t, '']),
    '—', site.footerTagline, n.postalAddress, `Unsubscribe: ${unsubscribeUrl}`,
  ].filter((l) => l !== undefined && l !== null).join('\n');

  return { html: htmlBody, text };
}

// messages: [{ to, subject, html, text, unsubscribeUrl, oneClickUrl, key }]
// Returns one result per message: { ok, id, status: 'sent'|'logged'|'failed', error }.
export async function sendMessages(messages) {
  if (!emailConfigured()) {
    if (process.env.VERCEL) throw Object.assign(new Error('Email sending isn’t set up. Add RESEND_API_KEY and NEWSLETTER_FROM to the project’s environment variables.'), { status: 503 });
    const dir = new URL('../.dev/outbox/', import.meta.url).pathname;
    await mkdir(dir, { recursive: true });
    return Promise.all(messages.map(async (m) => {
      const file = `${new Date().toISOString().replace(/[:.]/g, '-')}-${m.key}.html`;
      await writeFile(join(dir, file), `<!-- To: ${esc(m.to)} | Subject: ${esc(m.subject)} -->\n${m.html}`);
      return { ok: true, id: file, status: 'logged' };
    }));
  }

  const payload = messages.map((m) => ({
    from: process.env.NEWSLETTER_FROM,
    to: [m.to],
    subject: m.subject,
    html: m.html,
    text: m.text,
    headers: m.oneClickUrl ? {
      'List-Unsubscribe': `<${m.oneClickUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    } : undefined,
  }));
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data.message || data.error || `Email service returned ${res.status}`;
    return messages.map(() => ({ ok: false, status: 'failed', error }));
  }
  const ids = Array.isArray(data.data) ? data.data : [];
  return messages.map((m, i) => ({ ok: true, status: 'sent', id: ids[i]?.id ?? '' }));
}
