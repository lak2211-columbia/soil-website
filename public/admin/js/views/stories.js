// Stories: the list, and the editor (body on the left, details on the right).

import { h, button, field, input, textarea, select, toast, confirmDialog, badge, formatDate, plain, pageHead } from '../dom.js';
import { api, uploadImage, pickImage } from '../api.js';
import { blockEditor, markupHint } from '../editor.js';
import { go, setDirty } from '../app.js';

export const SECTIONS = [['dress', '의 · Dress'], ['food', '식 · Food'], ['home', '주 · Home']];
const SECTION_SHORT = { dress: '의', food: '식', home: '주' };
const ART = ['', 'moon-jar', 'thumb-hanok', 'thumb-hangwa', 'thumb-onggi', 'portrait-min-jin-lee', 'portrait-david-chang',
  'portrait-sandra-oh', 'portrait-jay-park', 'hangwa', 'grill', 'jangajji', 'old-kitchen', 'two-alphabets', 'root', 'home'];

// A small square preview. Tries each image URL in turn, like the public site does.
export function thumb(story) {
  const list = Array.isArray(story.photos) ? story.photos.filter(Boolean) : [];
  const box = h('span.thumb');
  if (!list.length) return box;
  const img = h('img', { alt: '', referrerPolicy: 'no-referrer', loading: 'lazy' });
  let i = 0;
  img.addEventListener('error', () => { if (++i < list.length) img.src = list[i]; else img.remove(); });
  img.src = list[0];
  box.append(img);
  return box;
}

export async function storiesView() {
  const issues = await api('issues');
  const q = input({ type: 'search', placeholder: 'Search titles' });
  const issueFilter = select([['', 'All issues'], ...issues.map((i) => [String(i.id), `No. ${String(i.number).padStart(2, '0')} · ${i.season}`]), ['none', 'Not in an issue']], '');
  const list = h('div.table');

  async function load() {
    const rows = await api('stories', { params: { q: q.value, issue: issueFilter.value } });
    list.replaceChildren(
      h('div.tr.th', {}, h('span', {}, ''), h('span', {}, 'Title'), h('span', {}, 'Section'), h('span', {}, 'Issue'), h('span', {}, 'Status'), h('span', {}, 'Edited')),
      ...rows.map((s) => h('a.tr', { href: `#/stories/${s.id}` },
        thumb(s),
        h('span.title-cell', {}, h('strong', {}, plain(s.title)), s.authors || s.kind ? h('span.muted', {}, [s.kind, s.authors].filter(Boolean).join(' · ')) : null),
        h('span', {}, SECTION_SHORT[s.section]),
        h('span', {}, s.issue_number ? `No. ${String(s.issue_number).padStart(2, '0')}` : '—'),
        h('span', {}, badge(s.status)),
        h('span.muted', {}, formatDate(s.updated_at)))));
    if (!rows.length) list.append(h('p.muted.empty', {}, 'No stories match.'));
  }
  let t;
  q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(load, 200); });
  issueFilter.addEventListener('change', load);
  await load();

  return h('div', {},
    pageHead('Stories', button('New story', () => go('#/stories/new'), 'primary')),
    h('div.filters', {}, q, issueFilter),
    list);
}

export async function storyView(idParam) {
  if (idParam === 'new') {
    const created = await api('story', { method: 'POST', body: { title: 'Untitled story' } });
    history.replaceState(null, '', `#/stories/${created.id}`);
    idParam = created.id;
  }
  const [story, issues, people] = await Promise.all([
    api('story', { id: idParam }), api('issues'), api('contributors'),
  ]);
  const s = { ...story, photos: [...(story.photos ?? [])], contributor_ids: [...story.contributor_ids] };
  const dirty = () => { setDirty(true); saveBtn.disabled = false; saveBtn.textContent = 'Save'; };

  // ----- main column -----
  const title = textarea({ class: 'title-input', placeholder: 'Title', value: s.title, rows: 1, oninput: (e) => { s.title = e.target.value; dirty(); } });
  const dek = textarea({ class: 'dek-input', placeholder: 'Dek: the one or two lines under the title', value: s.dek, oninput: (e) => { s.dek = e.target.value; dirty(); } });
  const words = h('span.muted', {}, `${story.words} words`);
  const editor = blockEditor(s.body, (blocks) => {
    s.body = blocks;
    const n = blocks.reduce((sum, b) => sum + [b.text, b.q, b.a].filter(Boolean).join(' ').split(/\s+/).filter(Boolean).length, 0);
    words.textContent = `${n} words`;
    dirty();
  });

  // ----- details column -----
  const set = (key) => (e) => { s[key] = e.target.value; dirty(); };
  const statusLine = h('div.status-line', {}, badge(s.status), s.published_at ? h('span.muted', {}, `since ${formatDate(s.published_at)}`) : null);

  const imageBox = h('div.image-box');
  const urls = textarea({ class: 'mono', rows: 2, value: s.photos.join('\n'), placeholder: 'https://…',
    oninput: (e) => { s.photos = e.target.value.split('\n').map((x) => x.trim()).filter(Boolean); drawImage(); dirty(); } });
  function drawImage() {
    const src = s.photos[0];
    imageBox.replaceChildren(src ? h('img', { src, alt: '', referrerPolicy: 'no-referrer' }) : h('span.muted', {}, s.art ? `Drawing: ${s.art}` : 'No image'));
  }
  drawImage();
  const uploadBtn = button('Upload image…', async () => {
    const file = await pickImage();
    if (!file) return;
    uploadBtn.disabled = true; uploadBtn.textContent = 'Uploading…';
    try {
      const url = await uploadImage(file);
      s.photos = [url, ...s.photos.filter((p) => p !== url)];
      urls.value = s.photos.join('\n'); urls.dispatchEvent(new Event('input'));
      toast('Image uploaded');
    } catch (err) { toast(err.message, 'error'); }
    uploadBtn.disabled = false; uploadBtn.textContent = 'Upload image…';
  }, 'small');

  const peopleBox = h('div.checks', {}, people.length ? people.map((p) => h('label.check', {},
    h('input', { type: 'checkbox', checked: s.contributor_ids.includes(p.id), onchange: (e) => {
      s.contributor_ids = e.target.checked ? [...s.contributor_ids, p.id] : s.contributor_ids.filter((x) => x !== p.id);
      dirty();
    } }), p.name)) : h('span.muted', {}, 'No contributors yet.'));

  async function save(extra = {}) {
    Object.assign(s, extra);
    saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
    try {
      const saved = await api('story', { method: 'PUT', id: s.id, body: { ...s, body: editor.getValue() } });
      Object.assign(s, { slug: saved.slug, status: saved.status, published_at: saved.published_at });
      slug.value = saved.slug;
      statusLine.replaceChildren(badge(saved.status), saved.published_at ? h('span.muted', {}, `since ${formatDate(saved.published_at)}`) : null);
      publishBtn.textContent = saved.status === 'published' ? 'Unpublish' : 'Publish';
      setDirty(false);
      saveBtn.textContent = 'Saved';
      toast(extra.status === 'published' ? 'Published' : extra.status === 'draft' ? 'Moved back to drafts' : 'Saved');
    } catch (err) {
      saveBtn.disabled = false; saveBtn.textContent = 'Save';
      toast(err.message, 'error');
    }
  }

  const saveBtn = button('Saved', () => save(), 'primary', { disabled: true, 'data-save': true });
  const publishBtn = button(s.status === 'published' ? 'Unpublish' : 'Publish', () =>
    save({ status: s.status === 'published' ? 'draft' : 'published' }));
  const slug = input({ value: s.slug, class: 'mono', oninput: set('slug') });

  const del = button('Delete story', async () => {
    if (!(await confirmDialog(`Delete “${plain(s.title)}”?`, { confirm: 'Delete', danger: true, detail: 'This can’t be undone.' }))) return;
    await api('story', { method: 'DELETE', id: s.id });
    setDirty(false); toast('Story deleted'); go('#/stories');
  }, 'danger small');

  const details = h('aside.details', {},
    h('div.panel', {},
      statusLine,
      h('div.row', {}, saveBtn, publishBtn),
      h('a.btn.ghost.wide', { href: `/stories/${s.slug}?preview=1`, target: '_blank', rel: 'noopener',
        onclick: (e) => { e.currentTarget.href = `/stories/${s.slug}?preview=1`; } }, 'Preview ↗')),
    h('div.panel', {},
      field('Issue', select([['', 'Not in an issue'], ...issues.map((i) => [String(i.id), `No. ${String(i.number).padStart(2, '0')} · ${i.season}`])],
        s.issue_id ? String(s.issue_id) : '', { onchange: set('issue_id') })),
      h('div.row', {},
        field('Section', select(SECTIONS, s.section, { onchange: set('section') })),
        field('Order', input({ type: 'number', min: 0, value: s.position, oninput: set('position') }))),
      field('Category', input({ value: s.category, placeholder: 'e.g. Literature, Craft', oninput: set('category') })),
      field('Kind', input({ value: s.kind, list: 'kinds', placeholder: 'e.g. Interview, Essay', oninput: set('kind') })),
      h('datalist', { id: 'kinds' }, ['Interview', 'Essay', 'Feature', 'Recipe', 'Photo essay', 'Column'].map((k) => h('option', { value: k }))),
      field('Credit', input({ value: s.credit, placeholder: 'e.g. Photographs by …', oninput: set('credit') })),
      field('Read time (minutes)', input({ type: 'number', min: 1, value: s.read_minutes ?? '', placeholder: 'Counted from the text', oninput: set('read_minutes') }))),
    h('div.panel', {},
      h('span.label', {}, 'Contributors'), peopleBox,
      h('a.small-link', { href: '#/contributors' }, 'Manage contributors')),
    h('div.panel', {},
      h('span.label', {}, 'Image'), imageBox,
      h('div.row', {}, uploadBtn),
      field('Image URLs', urls, 'The first that loads is shown. Upload adds to the top.'),
      field('Alt text', input({ value: s.photo_alt, oninput: set('photo_alt') })),
      field('Drawing', select(ART.map((a) => [a, a || 'None']), s.art, { onchange: (e) => { s.art = e.target.value; drawImage(); dirty(); } }),
        'Shown while the photo loads, or instead of it.')),
    h('div.panel', {},
      field('URL', slug, `soilmag.com/stories/${s.slug}`),
      del));

  return h('div.editor-page', {},
    h('div.crumbs', {}, h('a', { href: '#/stories' }, '← Stories'), words),
    h('div.editor-grid', {},
      h('div.compose', {}, title, dek, h('p.hint.markup', {}, markupHint), editor),
      details));
}
