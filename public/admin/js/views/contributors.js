// Contributors: writers, photographers and editors, with the profile shown at /contributors/<name>.

import { h, button, field, input, textarea, toast, confirmDialog, badge, plain, pageHead } from '../dom.js';
import { api, uploadImage, pickImage } from '../api.js';
import { go, setDirty } from '../app.js';

export async function contributorsView() {
  const people = await api('contributors');
  return h('div', {},
    pageHead('Contributors', button('New contributor', async () => {
      const created = await api('contributor', { method: 'POST', body: { name: 'New contributor' } });
      go(`#/contributors/${created.id}`);
    }, 'primary')),
    h('div.table', {},
      h('div.tr.th.people', {}, h('span', {}, ''), h('span', {}, 'Name'), h('span', {}, 'Role'), h('span', {}, 'Stories')),
      people.map((p) => h('a.tr.people', { href: `#/contributors/${p.id}` },
        h('span.thumb.round', {}, p.photo_url ? h('img', { src: p.photo_url, alt: '' }) : null),
        h('strong', {}, p.name), h('span', {}, p.role || '—'), h('span', {}, p.story_count)))),
    people.length ? null : h('p.muted.empty', {}, 'No contributors yet.'));
}

export async function contributorView(id) {
  const c = await api('contributor', { id });
  const dirty = () => { setDirty(true); saveBtn.disabled = false; saveBtn.textContent = 'Save'; };
  const set = (key) => (e) => { c[key] = e.target.value; dirty(); };
  const photo = h('div.avatar', {}, c.photo_url ? h('img', { src: c.photo_url, alt: '' }) : null);

  async function save() {
    saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
    try {
      const saved = await api('contributor', { method: 'PUT', id: c.id, body: c });
      Object.assign(c, saved);
      slug.value = saved.slug;
      setDirty(false); saveBtn.textContent = 'Saved'; toast('Saved');
    } catch (err) { saveBtn.disabled = false; saveBtn.textContent = 'Save'; toast(err.message, 'error'); }
  }
  const saveBtn = button('Saved', save, 'primary', { disabled: true, 'data-save': true });
  const slug = input({ value: c.slug, class: 'mono', oninput: set('slug') });

  return h('div.editor-page', {},
    h('div.crumbs', {}, h('a', { href: '#/contributors' }, '← Contributors')),
    h('div.editor-grid', {},
      h('div.compose', {},
        h('div.panel', {},
          h('div.person-head', {}, photo, h('div.grow', {},
            field('Name', input({ value: c.name, oninput: set('name') })),
            field('Role', input({ value: c.role, placeholder: 'e.g. Writer, Photographer, Contributing editor', oninput: set('role') })))),
          field('Bio', textarea({ value: c.bio, rows: 3, oninput: set('bio') }), 'Shown at the end of their stories and on their page. *italic* and [links](https://…) work.')),
        h('div.panel', {},
          h('h3', {}, 'Stories'),
          c.stories.length ? h('ul.simple', {}, c.stories.map((s) => h('li', {}, h('a', { href: `#/stories/${s.id}` }, plain(s.title)), badge(s.status))))
            : h('p.muted', {}, 'Not credited on any story yet. Add them from a story’s Contributors box.'))),
      h('aside.details', {},
        h('div.panel', {}, saveBtn,
          h('a.btn.ghost.wide', { href: `/contributors/${c.slug}`, target: '_blank', rel: 'noopener' }, 'View page ↗')),
        h('div.panel', {},
          h('span.label', {}, 'Photo'),
          h('div.row', {},
            button('Upload photo…', async (e) => {
              const file = await pickImage();
              if (!file) return;
              e.target.disabled = true;
              try {
                c.photo_url = await uploadImage(file);
                photo.replaceChildren(h('img', { src: c.photo_url, alt: '' }));
                dirty();
              } catch (err) { toast(err.message, 'error'); }
              e.target.disabled = false;
            }, 'small'),
            c.photo_url ? button('Remove', () => { c.photo_url = ''; photo.replaceChildren(); dirty(); }, 'ghost small') : null)),
        h('div.panel', {},
          field('URL', slug, `soilmag.com/contributors/${c.slug}`),
          button('Delete contributor', async () => {
            if (!(await confirmDialog(`Delete ${c.name}?`, { confirm: 'Delete', danger: true, detail: 'Their stories stay, without this byline.' }))) return;
            await api('contributor', { method: 'DELETE', id: c.id });
            setDirty(false); toast('Contributor deleted'); go('#/contributors');
          }, 'danger small')))));
}
