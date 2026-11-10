// Issues: the list, and the issue page where you set the cover, the "In This Issue" list and
// the order of stories in each section.

import { h, button, field, input, textarea, select, toast, confirmDialog, badge, plain, pageHead, moveControls } from '../dom.js';
import { api } from '../api.js';
import { go, setDirty, reload } from '../app.js';
import { SECTIONS, thumb } from './stories.js';

const no = (n) => `No. ${String(n).padStart(2, '0')}`;

export async function issuesView() {
  const issues = await api('issues');
  return h('div', {},
    pageHead('Issues', button('New issue', async () => {
      const created = await api('issue', { method: 'POST', body: {} });
      go(`#/issues/${created.id}`);
    }, 'primary')),
    h('div.table', {},
      h('div.tr.th.issues', {}, h('span', {}, 'Issue'), h('span', {}, 'Season'), h('span', {}, 'Stories'), h('span', {}, 'Status'), h('span', {}, '')),
      issues.map((i) => h('a.tr.issues', { href: `#/issues/${i.id}` },
        h('strong', {}, no(i.number)), h('span', {}, i.season), h('span', {}, i.story_count), h('span', {}, badge(i.status)),
        h('span', {}, i.is_current ? h('span.badge.current', {}, 'on homepage') : '')))),
    issues.length ? null : h('p.muted.empty', {}, 'No issues yet.'));
}

export async function issueView(id) {
  const [issue, unassigned] = await Promise.all([api('issue', { id }), api('stories', { params: { issue: 'none' } })]);
  const s = { ...issue, highlight_ids: [...issue.highlight_ids] };
  let stories = issue.stories.map((x) => ({ ...x }));
  const dirty = () => { setDirty(true); saveBtn.disabled = false; saveBtn.textContent = 'Save'; };
  const set = (key) => (e) => { s[key] = e.target.value; dirty(); };
  const byId = () => new Map(stories.map((x) => [x.id, x]));
  const options = () => stories.map((x) => [String(x.id), plain(x.title)]);

  // cover + highlights
  const coverSlot = h('div');
  const highlightsSlot = h('div');
  function drawFeatured() {
    coverSlot.replaceChildren(field('Cover story', select([['', 'None'], ...options()], s.cover_story_id ? String(s.cover_story_id) : '',
      { onchange: (e) => { s.cover_story_id = e.target.value ? Number(e.target.value) : null; dirty(); drawLayout(); } })));
    const map = byId();
    const list = s.highlight_ids.map((hid, i) => h('li.order-item', {},
      thumb(map.get(hid) ?? {}), h('span', {}, plain(map.get(hid)?.title ?? 'Missing story')),
      moveControls({
        onUp: i > 0 ? () => { [s.highlight_ids[i - 1], s.highlight_ids[i]] = [s.highlight_ids[i], s.highlight_ids[i - 1]]; dirty(); drawFeatured(); } : null,
        onDown: i < s.highlight_ids.length - 1 ? () => { [s.highlight_ids[i + 1], s.highlight_ids[i]] = [s.highlight_ids[i], s.highlight_ids[i + 1]]; dirty(); drawFeatured(); } : null,
        onRemove: () => { s.highlight_ids.splice(i, 1); dirty(); drawFeatured(); drawLayout(); },
      })));
    const add = select([['', 'Add a story to the sidebar…'], ...options().filter(([v]) => !s.highlight_ids.includes(Number(v)))], '', {
      onchange: (e) => { if (e.target.value) { s.highlight_ids.push(Number(e.target.value)); dirty(); drawFeatured(); drawLayout(); } },
    });
    highlightsSlot.replaceChildren(h('span.label', {}, 'In This Issue (homepage sidebar)'),
      list.length ? h('ol.order', {}, list) : h('p.muted', {}, 'Nothing in the sidebar.'), add);
  }

  // section layout
  const layoutSlot = h('div.sections-layout');
  function drawLayout() {
    const featured = new Set([s.cover_story_id, ...s.highlight_ids]);
    layoutSlot.replaceChildren(...SECTIONS.map(([key, label]) => {
      const inSection = stories.filter((x) => x.section === key).sort((a, b) => a.position - b.position);
      const move = (i, d) => {
        const a = inSection[i], b = inSection[i + d];
        [a.position, b.position] = [b.position, a.position];
        if (a.position === b.position) a.position += d;
        dirty(); drawLayout();
      };
      return h('section.panel', {},
        h('h3', {}, label),
        inSection.length ? h('ol.order', {}, inSection.map((x, i) => h('li.order-item', { class: featured.has(x.id) ? 'featured' : '' },
          thumb(x),
          h('span', {}, h('a', { href: `#/stories/${x.id}` }, plain(x.title)), ' ', x.status === 'draft' ? badge('draft') : null,
            featured.has(x.id) ? h('span.muted', {}, x.id === s.cover_story_id ? ' · cover' : ' · sidebar') : null),
          select(SECTIONS.map(([k]) => [k, k === 'dress' ? '의' : k === 'food' ? '식' : '주']), x.section, {
            class: 'tiny', title: 'Move to section',
            onchange: (e) => { x.section = e.target.value; x.position = 999; dirty(); drawLayout(); },
          }),
          moveControls({ onUp: i > 0 ? () => move(i, -1) : null, onDown: i < inSection.length - 1 ? () => move(i, 1) : null }))))
          : h('p.muted', {}, 'No stories.'));
    }));
  }

  const addExisting = select([['', 'Add an existing story…'], ...unassigned.map((x) => [String(x.id), plain(x.title)])], '', {
    onchange: async (e) => {
      if (!e.target.value) return;
      if (document.body.classList.contains('is-dirty')) await save();
      await api('story', { method: 'PUT', id: e.target.value, body: { issue_id: s.id } });
      toast('Story added to this issue'); reload();
    },
  });

  async function save(extra = {}) {
    saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
    try {
      const layout = stories.map((x) => ({ id: x.id, section: x.section, position: x.position }));
      const saved = await api('issue', { method: 'PUT', id: s.id, body: { ...s, ...extra, layout } });
      Object.assign(s, { status: saved.status, is_current: saved.is_current, number: saved.number });
      stories = saved.stories.map((x) => ({ ...x }));
      heading.textContent = `Issue ${no(saved.number)}`;
      statusLine.replaceChildren(badge(saved.status), saved.is_current ? h('span.badge.current', {}, 'on homepage') : null);
      publishBtn.textContent = saved.status === 'published' ? 'Unpublish' : 'Publish';
      currentBtn.hidden = saved.is_current;
      setDirty(false); saveBtn.textContent = 'Saved';
      drawLayout();
      toast('Saved');
    } catch (err) {
      saveBtn.disabled = false; saveBtn.textContent = 'Save';
      toast(err.message, 'error');
    }
  }

  const heading = h('h1', {}, `Issue ${no(s.number)}`);
  const statusLine = h('div.status-line', {}, badge(s.status), s.is_current ? h('span.badge.current', {}, 'on homepage') : null);
  const saveBtn = button('Saved', () => save(), 'primary', { disabled: true, 'data-save': true });
  const publishBtn = button(s.status === 'published' ? 'Unpublish' : 'Publish', () => { s.status = s.status === 'published' ? 'draft' : 'published'; save(); });
  const currentBtn = button('Put on homepage', async () => {
    if (!(await confirmDialog('Make this the current issue?', { confirm: 'Put on homepage', detail: 'The homepage will show this issue instead of the one there now.' }))) return;
    save({ is_current: true });
  }, '', { hidden: s.is_current });

  drawFeatured();
  drawLayout();

  return h('div.editor-page', {},
    h('div.crumbs', {}, h('a', { href: '#/issues' }, '← Issues')),
    h('div.page-head', {}, heading, h('div.actions', {}, h('a.btn.ghost', { href: `/issues/${s.number}?preview=1`, target: '_blank', rel: 'noopener' }, 'Preview ↗'))),
    h('div.editor-grid', {},
      h('div.compose', {},
        h('div.panel', {}, coverSlot, field('Cover label', input({ value: s.cover_kicker, oninput: set('cover_kicker') })), highlightsSlot),
        h('h2.section-head', {}, 'Stories by section'),
        h('p.hint', {}, 'Use the arrows to set the order on the homepage. The cover and sidebar stories are shown at the top instead of in their section.'),
        layoutSlot,
        h('div.row.top-gap', {}, addExisting, button('New story in this issue', async () => {
          const created = await api('story', { method: 'POST', body: { title: 'Untitled story', issue_id: s.id } });
          go(`#/stories/${created.id}`);
        }))),
      h('aside.details', {},
        h('div.panel', {}, statusLine, h('div.row', {}, saveBtn, publishBtn), currentBtn),
        h('div.panel', {},
          h('div.row', {},
            field('Number', input({ type: 'number', min: 1, value: s.number, oninput: set('number') })),
            field('Season', input({ value: s.season, oninput: set('season') }))),
          field('Strap line', textarea({ value: s.strap, oninput: set('strap') }), 'The line under the issue name. *italic*, **한글**')),
        h('div.panel', {}, button('Delete issue', async () => {
          if (!(await confirmDialog(`Delete Issue ${no(s.number)}?`, { confirm: 'Delete', danger: true, detail: 'Its stories are kept but no longer belong to an issue.' }))) return;
          try { await api('issue', { method: 'DELETE', id: s.id }); setDirty(false); toast('Issue deleted'); go('#/issues'); }
          catch (err) { toast(err.message, 'error'); }
        }, 'danger small')))));
}
