// Site settings: the words around the stories. Header and footer, section headings, the About
// block and the newsletter box. Each panel saves on its own.

import { h, button, field, input, textarea, toast, pageHead, moveControls } from '../dom.js';
import { api } from '../api.js';
import { setDirty } from '../app.js';

// An editable list of small objects (links, facts, paragraphs).
function listEditor(items, columns, { addLabel, onChange, make }) {
  const root = h('div.list-editor');
  function draw() {
    root.replaceChildren(
      ...items.map((item, i) => h('div.list-row', {},
        columns.map(([key, placeholder, wide]) => {
          const ctl = wide ? textarea({ value: item[key] ?? '', placeholder }) : input({ value: item[key] ?? '', placeholder });
          ctl.addEventListener('input', () => { item[key] = ctl.value; onChange(); });
          return ctl;
        }),
        moveControls({
          onUp: i > 0 ? () => { [items[i - 1], items[i]] = [items[i], items[i - 1]]; onChange(); draw(); } : null,
          onDown: i < items.length - 1 ? () => { [items[i + 1], items[i]] = [items[i], items[i + 1]]; onChange(); draw(); } : null,
          onRemove: () => { items.splice(i, 1); onChange(); draw(); },
        }))),
      button(addLabel, () => { items.push(make()); onChange(); draw(); }, 'ghost small'));
  }
  draw();
  return root;
}

function panel(title, key, value, build, note, serialize = (v) => v) {
  const saveBtn = button('Saved', async () => {
    saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
    try {
      await api('settings', { method: 'PUT', body: { key, value: serialize(value) } });
      saveBtn.textContent = 'Saved'; toast(`${title} saved`);
      if (!document.querySelector('.settings .btn.primary:not([disabled])')) setDirty(false);
    } catch (err) { saveBtn.disabled = false; saveBtn.textContent = 'Save'; toast(err.message, 'error'); }
  }, 'primary small');
  saveBtn.disabled = true;
  const dirty = () => { setDirty(true); saveBtn.disabled = false; saveBtn.textContent = 'Save'; };
  return h('section.panel', {},
    h('div.panel-head', {}, h('h2', {}, title), saveBtn),
    note ? h('p.hint', {}, note) : null,
    build(dirty));
}

const bind = (obj, key, dirty) => (e) => { obj[key] = e.target.value; dirty(); };

export async function settingsView() {
  const s = await api('settings');
  const { site, sections, about, newsletter } = s;
  const about2 = { ...about, paragraphs: about.paragraphs.map((text) => ({ text })) };

  return h('div.settings', {},
    pageHead('Site settings'),
    panel('Site', 'site', site, (dirty) => h('div', {},
      h('div.row', {},
        field('Site title', input({ value: site.title, oninput: bind(site, 'title', dirty) }), 'The logo text in the header and footer, until the drawn logo is in.'),
        field('Korean tagline', input({ value: site.taglineKo, oninput: bind(site, 'taglineKo', dirty) }))),
      field('Description', textarea({ value: site.description, oninput: bind(site, 'description', dirty) }), 'Used by search engines and link previews.'),
      field('Footer tagline', textarea({ value: site.footerTagline, oninput: bind(site, 'footerTagline', dirty) })),
      h('span.label', {}, 'Header links'),
      listEditor(site.nav, [['label', 'Label'], ['href', '/#food']], { addLabel: 'Add link', onChange: dirty, make: () => ({ label: '', href: '/' }) }),
      h('span.label.top-gap', {}, 'Footer links'),
      listEditor(site.footerLinks, [['label', 'Label'], ['href', '/issues']], { addLabel: 'Add link', onChange: dirty, make: () => ({ label: '', href: '/' }) }))),

    panel('Section headings', 'sections', sections, (dirty) => h('div.three', {},
      ['dress', 'food', 'home'].map((k) => h('div', {},
        h('div.row', {},
          field('Numeral', input({ value: sections[k].numeral, oninput: bind(sections[k], 'numeral', dirty) })),
          field('Hangul', input({ value: sections[k].hangul, oninput: bind(sections[k], 'hangul', dirty) }))),
        field('Name', input({ value: sections[k].name, oninput: bind(sections[k], 'name', dirty) })),
        field('Subtitle', textarea({ value: sections[k].sub, oninput: bind(sections[k], 'sub', dirty) })))))),

    panel('About', 'about', about2, (dirty) => h('div', {},
      field('Title', input({ value: about.title, oninput: bind(about2, 'title', dirty) })),
      field('Lead paragraph', textarea({ value: about.lead, oninput: bind(about2, 'lead', dirty) })),
      h('span.label', {}, 'Paragraphs'),
      listEditor(about2.paragraphs, [['text', 'Paragraph', true]], { addLabel: 'Add paragraph', onChange: dirty, make: () => ({ text: '' }) }),
      h('span.label.top-gap', {}, 'Facts'),
      listEditor(about.facts, [['label', 'Label'], ['value', 'Value'], ['note', 'Note']], { addLabel: 'Add fact', onChange: dirty, make: () => ({ label: '', value: '', note: '' }) }),
      h('p.hint', {}, '“This Issue” is added automatically from the current issue.')),
    'Markup: *italic*, **한글** for an upright Korean phrase.',
    (v) => ({ ...v, paragraphs: v.paragraphs.map((p) => p.text).filter((t) => t.trim()) })),

    panel('Newsletter box', 'newsletter', newsletter, (dirty) => h('div', {},
      field('Eyebrow', input({ value: newsletter.eyebrow, oninput: bind(newsletter, 'eyebrow', dirty) })),
      field('Title', input({ value: newsletter.title, oninput: bind(newsletter, 'title', dirty) })),
      field('Dek', textarea({ value: newsletter.dek, oninput: bind(newsletter, 'dek', dirty) })),
      field('Postal address', textarea({ value: newsletter.postalAddress, oninput: bind(newsletter, 'postalAddress', dirty) }),
        'Printed at the foot of every letter. Anti-spam laws (e.g. CAN-SPAM in the US) require a real postal address in newsletters.'))),
  );
}
