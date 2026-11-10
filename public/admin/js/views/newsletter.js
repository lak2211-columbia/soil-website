// The SOIL Letter: writing and sending letters, and the subscriber list.

import { h, button, input, textarea, toast, confirmDialog, badge, formatDate, pageHead, modal } from '../dom.js';
import { api } from '../api.js';
import { blockEditor, markupHint } from '../editor.js';
import { go, setDirty, state, reload } from '../app.js';

const people = (n) => `${n} subscriber${n === 1 ? '' : 's'}`;

export async function lettersView() {
  const letters = await api('letters');
  return h('div', {},
    pageHead('Letters', button('New letter', () => go('#/letters/new'), 'primary')),
    h('div.table', {},
      h('div.tr.th.letters', {}, h('span', {}, 'Subject'), h('span', {}, 'Status'), h('span', {}, 'Delivered'), h('span', {}, 'Date')),
      letters.map((l) => h('a.tr.letters', { href: `#/letters/${l.id}` },
        h('strong', {}, l.subject || 'Untitled letter'), h('span', {}, badge(l.status)),
        h('span', {}, l.status === 'draft' ? '—' : `${l.delivered} of ${l.recipient_count}`),
        h('span.muted', {}, formatDate(l.sent_at || l.updated_at))))),
    letters.length ? null : h('p.muted.empty', {}, 'No letters yet. Write the first one.'));
}

function preview(id) {
  const frame = h('iframe.letter-frame', { src: `/api/admin?r=letter-preview&id=${id}&t=${Date.now()}`, title: 'Letter preview' });
  modal('Preview', frame, { wide: true });
}

export async function letterView(idParam) {
  if (idParam === 'new') {
    const created = await api('letter', { method: 'POST', body: { subject: '' } });
    history.replaceState(null, '', `#/letters/${created.id}`);
    idParam = created.id;
  }
  const letter = await api('letter', { id: idParam });
  const s = state.session;
  const locked = letter.status !== 'draft';
  const dirty = () => { setDirty(true); saveBtn.disabled = false; saveBtn.textContent = 'Save'; };

  const subject = input({ class: 'title-input small', value: letter.subject, placeholder: 'Subject', disabled: locked, oninput: (e) => { letter.subject = e.target.value; dirty(); } });
  const preheader = input({ value: letter.preheader, placeholder: 'Preview text shown after the subject in most inboxes', disabled: locked, oninput: (e) => { letter.preheader = e.target.value; dirty(); } });
  const editor = locked ? null : blockEditor(letter.body, (b) => { letter.body = b; dirty(); });

  async function save() {
    saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
    try {
      await api('letter', { method: 'PUT', id: letter.id, body: { subject: letter.subject, preheader: letter.preheader, body: editor.getValue() } });
      setDirty(false); saveBtn.textContent = 'Saved'; return true;
    } catch (err) { saveBtn.disabled = false; saveBtn.textContent = 'Save'; toast(err.message, 'error'); return false; }
  }
  const saveBtn = button('Saved', async () => { if (await save()) toast('Saved'); }, 'primary', { disabled: true, 'data-save': true, hidden: locked });
  const ensureSaved = async () => (document.body.classList.contains('is-dirty') ? save() : true);

  const testTo = input({ type: 'email', placeholder: 'you@example.com' });
  try { testTo.value = localStorage.getItem('soil-test-to') || ''; } catch {}
  const progress = h('p.progress', { role: 'status', 'aria-live': 'polite' });

  async function sendAll() {
    if (!(await ensureSaved())) return;
    const active = letter.stats.active;
    if (!(await confirmDialog(`Send “${letter.subject || 'Untitled letter'}” to ${people(active)}?`, {
      confirm: 'Send now', detail: s.email ? 'This can’t be undone.' : 'Email sending isn’t set up, so while developing locally the letters are written to .dev/outbox instead of being sent.',
    }))) return;
    sendBtn.disabled = true;
    let total = 0;
    try {
      for (;;) {
        const r = await api('letter-send', { method: 'POST', id: letter.id, body: {} });
        total += r.sent;
        progress.textContent = `Sent ${total}… ${r.remaining} to go`;
        if (r.remaining === 0 || (r.sent === 0 && r.failed === 0)) break;
      }
      toast(`Letter sent to ${total}`);
      setDirty(false); reload();
    } catch (err) {
      progress.textContent = `Stopped after ${total}: ${err.message}. Sending again continues where it left off.`;
      sendBtn.disabled = false;
    }
  }
  const sendBtn = button(letter.status === 'sending' ? 'Resume sending' : `Send to ${people(letter.stats.active)}`, sendAll, 'primary wide', {
    disabled: letter.status === 'sent' || !s.canSend || letter.stats.active === 0,
  });

  const sendPanel = letter.status === 'sent'
    ? h('div.panel', {}, h('div.status-line', {}, badge('sent'), h('span.muted', {}, formatDate(letter.sent_at))),
      h('p', {}, `Delivered to ${letter.stats.delivered} of ${people(letter.recipient_count)}.`),
      letter.stats.failed ? h('div', {}, h('p.error-text', {}, `${letter.stats.failed} failed.`),
        button('Retry failed', async () => { await api('letter-retry', { method: 'POST', id: letter.id, body: {} }); reload(); }, 'small')) : null)
    : h('div.panel', {},
      h('div.status-line', {}, badge(letter.status)),
      h('div.row', {}, saveBtn, button('Preview', async () => { if (await ensureSaved()) preview(letter.id); })),
      h('span.label.top-gap', {}, 'Send a test'),
      h('div.row', {}, testTo, button('Send test', async (e) => {
        if (!(await ensureSaved())) return;
        e.target.disabled = true;
        try {
          const r = await api('letter-test', { method: 'POST', id: letter.id, body: { to: testTo.value } });
          try { localStorage.setItem('soil-test-to', testTo.value); } catch {}
          toast(r.status === 'logged' ? 'Test written to .dev/outbox (sending isn’t set up locally)' : `Test sent to ${testTo.value}`);
        } catch (err) { toast(err.message, 'error'); }
        e.target.disabled = false;
      }, 'small')),
      h('span.label.top-gap', {}, 'Send'),
      sendBtn, progress,
      !s.canSend ? h('p.hint', {}, 'Email sending isn’t set up. Add RESEND_API_KEY and NEWSLETTER_FROM in Vercel.') : null,
      letter.stats.active === 0 ? h('p.hint', {}, 'No active subscribers yet.') : null);

  return h('div.editor-page', {},
    h('div.crumbs', {}, h('a', { href: '#/letters' }, '← Letters')),
    h('div.editor-grid', {},
      h('div.compose', {},
        subject, preheader,
        locked ? h('div.panel', {}, button('View the letter as sent', () => preview(letter.id)))
          : h('div', {}, h('p.hint.markup', {}, markupHint), editor)),
      h('aside.details', {},
        sendPanel,
        letter.status === 'draft' ? h('div.panel', {}, button('Delete letter', async () => {
          if (!(await confirmDialog('Delete this draft?', { confirm: 'Delete', danger: true }))) return;
          await api('letter', { method: 'DELETE', id: letter.id });
          setDirty(false); go('#/letters');
        }, 'danger small')) : null)));
}

export async function subscribersView() {
  const q = input({ type: 'search', placeholder: 'Search email' });
  const filter = h('select', {}, h('option', { value: '' }, 'All'), h('option', { value: 'active' }, 'Active'), h('option', { value: 'unsubscribed' }, 'Unsubscribed'));
  const list = h('div.table');
  const counts = h('p.muted');

  async function load() {
    const { rows, counts: c } = await api('subscribers', { params: { q: q.value, status: filter.value } });
    counts.textContent = `${c.active} active · ${c.unsubscribed} unsubscribed`;
    list.replaceChildren(
      h('div.tr.th.subs', {}, h('span', {}, 'Email'), h('span', {}, 'Status'), h('span', {}, 'From'), h('span', {}, 'Joined'), h('span', {}, '')),
      ...rows.map((r) => h('div.tr.subs', {},
        h('span', {}, r.email), h('span', {}, badge(r.status)), h('span.muted', {}, r.source), h('span.muted', {}, formatDate(r.created_at)),
        h('span.row-actions', {},
          button(r.status === 'active' ? 'Unsubscribe' : 'Reactivate', async () => {
            await api('subscriber', { method: 'PUT', id: r.id, body: { status: r.status === 'active' ? 'unsubscribed' : 'active' } });
            load();
          }, 'ghost small'),
          button('Delete', async () => {
            if (!(await confirmDialog(`Delete ${r.email}?`, { confirm: 'Delete', danger: true, detail: 'Removes them from the list entirely. To stop sending but keep a record, use Unsubscribe.' }))) return;
            await api('subscriber', { method: 'DELETE', id: r.id }); load();
          }, 'ghost small danger-text')))));
    if (!rows.length) list.append(h('p.muted.empty', {}, 'No subscribers match.'));
  }
  let t;
  q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(load, 200); });
  filter.addEventListener('change', load);
  await load();

  const addBox = textarea({ placeholder: 'One or more email addresses, separated by commas or new lines' });
  return h('div', {},
    pageHead('Subscribers', h('a.btn', { href: '/api/admin?r=subscribers-csv', download: 'soil-subscribers.csv' }, 'Export CSV')),
    counts,
    h('div.panel', {},
      h('span.label', {}, 'Add subscribers'),
      h('p.hint', {}, 'Only add people who asked to receive the letter.'),
      addBox,
      button('Add', async () => {
        try {
          const r = await api('subscriber', { method: 'POST', body: { emails: addBox.value } });
          toast(`Added ${r.added}${r.invalid.length ? `, skipped ${r.invalid.length} invalid` : ''}`, r.invalid.length ? 'error' : 'ok');
          addBox.value = ''; load();
        } catch (err) { toast(err.message, 'error'); }
      }, 'small')),
    h('div.filters', {}, q, filter),
    list);
}

