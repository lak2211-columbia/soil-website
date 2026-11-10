// SOIL editor: shell, login, dashboard and the hash router (#/stories/12 and so on).

import { h, clear, button, toast, field, pageHead, formatDate, badge, plain, confirmDialog } from './dom.js';
import { api, setUnauthorizedHandler } from './api.js';
import { storiesView, storyView } from './views/stories.js';
import { issuesView, issueView } from './views/issues.js';
import { contributorsView, contributorView } from './views/contributors.js';
import { settingsView } from './views/settings.js';
import { lettersView, letterView, subscribersView } from './views/newsletter.js';

const app = document.getElementById('app');
export const state = { session: null, dirty: false };

export function setDirty(on) {
  state.dirty = on;
  document.body.classList.toggle('is-dirty', on);
}
window.addEventListener('beforeunload', (e) => { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });

export const go = (hash) => { location.hash = hash; };
export const reload = () => route();

const NAV = [
  ['#/', 'Dashboard'],
  ['#/stories', 'Stories'],
  ['#/issues', 'Issues'],
  ['#/contributors', 'Contributors'],
  ['#/letters', 'Letters'],
  ['#/subscribers', 'Subscribers'],
  ['#/settings', 'Site settings'],
];

function shell(content) {
  const current = location.hash || '#/';
  const active = (href) => (href === '#/' ? current === '#/' : current.startsWith(href));
  return h('div.shell', {},
    h('aside.sidebar', {},
      h('a.brand', { href: '#/' }, h('span.wordmark', {}, 'SOIL'), h('span.brand-sub', {}, 'Editor')),
      h('nav', {}, NAV.map(([href, label]) => h('a', { href, class: active(href) ? 'active' : '' }, label))),
      h('div.sidebar-foot', {},
        h('a', { href: '/', target: '_blank', rel: 'noopener' }, 'View site ↗'),
        h('button.linkish', { type: 'button', onclick: logout }, 'Log out'))),
    h('main.main', {}, content));
}

async function logout() {
  await api('logout', { method: 'POST', body: {} }).catch(() => {});
  setDirty(false);
  state.session = { ...state.session, admin: false };
  render();
}

function loginView(message = '') {
  const s = state.session ?? {};
  const pw = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'Password', autofocus: true });
  const err = h('p.login-error', { role: 'alert' }, message);
  const submit = async (e) => {
    e.preventDefault();
    err.textContent = '';
    try {
      await api('login', { method: 'POST', body: { password: pw.value } });
      state.session = await api('session');
      render();
    } catch (ex) { err.textContent = ex.message; pw.select(); }
  };
  const notReady = !s.configured
    ? h('p.login-note', {}, 'Login isn’t set up yet: add ADMIN_PASSWORD and SESSION_SECRET (32+ characters) to the project’s environment variables, then redeploy.')
    : null;
  return h('div.login', {},
    h('form.login-card', { onsubmit: submit },
      h('div.wordmark.big', {}, 'SOIL'),
      h('p.login-sub', {}, 'Editor'),
      notReady,
      field('Password', pw),
      err,
      h('button.btn.primary.wide', { type: 'submit', disabled: !s.configured }, 'Log in')));
}

async function dashboardView() {
  const d = await api('dashboard');
  const s = state.session;
  const card = (n, label, href) => h('a.stat', { href }, h('span.stat-n', {}, n), h('span.stat-l', {}, label));
  const check = (ok, label, help) => h(`li.${ok ? 'ok' : 'todo'}`, {}, h('span.dot', {}, ok ? '✓' : '·'), h('span', {}, label), ok ? null : h('span.hint', {}, help));

  const seedBox = d.empty ? h('div.panel.notice', {},
    h('h2', {}, 'Your database is empty'),
    h('p', {}, 'Load Issue No. 04 as it appeared on the original homepage: 15 stories, 4 contributors and the site text. You can edit or delete any of it afterwards.'),
    button('Load starter content', async (e) => {
      e.target.disabled = true;
      try { await api('seed', { method: 'POST', body: {} }); toast('Starter content loaded'); route(); }
      catch (err) { toast(err.message, 'error'); e.target.disabled = false; }
    }, 'primary')) : null;

  return h('div', {},
    pageHead('Dashboard',
      button('New story', () => go('#/stories/new'), 'primary'),
      button('New letter', () => go('#/letters/new'))),
    seedBox,
    h('div.stats', {},
      card(d.counts.stories, 'Stories', '#/stories'),
      card(d.counts.drafts, 'Drafts', '#/stories'),
      card(d.counts.issues, 'Issues', '#/issues'),
      card(d.counts.contributors, 'Contributors', '#/contributors'),
      card(d.counts.subscribers, 'Subscribers', '#/subscribers'),
      card(d.counts.letters_sent, 'Letters sent', '#/letters')),
    h('div.two-col', {},
      h('section.panel', {},
        h('h2', {}, 'Recently edited'),
        d.recent.length ? h('ul.simple', {}, d.recent.map((r) => h('li', {},
          h('a', { href: `#/stories/${r.id}` }, plain(r.title)), badge(r.status), h('span.muted', {}, formatDate(r.updated_at)))))
          : h('p.muted', {}, 'No stories yet.'),
        d.current ? h('p.muted.top-gap', {}, 'Homepage shows ', h('a', { href: `#/issues/${d.current.id}` }, `Issue No. ${String(d.current.number).padStart(2, '0')} · ${d.current.season}`), '.') : null),
      h('section.panel', {},
        h('h2', {}, 'Setup'),
        h('ul.checklist', {},
          check(s.database, 'Database connected', 'Connect Postgres under Storage in Vercel.'),
          check(s.configured, 'Admin password set', 'ADMIN_PASSWORD and SESSION_SECRET.'),
          check(s.blob, s.local ? 'Image uploads (saved locally while developing)' : 'Image storage (Vercel Blob)', 'Create a Blob store under Storage in Vercel.'),
          check(s.email, s.local && !s.email ? 'Email sending (letters go to .dev/outbox locally)' : 'Email sending (Resend)', 'Add RESEND_API_KEY and NEWSLETTER_FROM.')))));
}

const ROUTES = [
  [/^#?\/?$/, dashboardView],
  [/^#\/stories$/, storiesView],
  [/^#\/stories\/(new|\d+)$/, storyView],
  [/^#\/issues$/, issuesView],
  [/^#\/issues\/(\d+)$/, issueView],
  [/^#\/contributors$/, contributorsView],
  [/^#\/contributors\/(\d+)$/, contributorView],
  [/^#\/letters$/, lettersView],
  [/^#\/letters\/(new|\d+)$/, letterView],
  [/^#\/subscribers$/, subscribersView],
  [/^#\/settings$/, settingsView],
];

let lastHash = location.hash;
let routeSeq = 0;
async function route() {
  const seq = ++routeSeq;
  const hash = location.hash || '#/';
  const match = ROUTES.map(([re, view]) => [hash.match(re), view]).find(([m]) => m);
  const page = h('div.page', {}, h('p.muted.loading', {}, 'Loading…'));
  clear(app).append(shell(page));
  setDirty(false);
  try {
    const content = match ? await match[1](...match[0].slice(1)) : h('p', {}, 'Page not found.');
    // Views for "new" items swap the URL to the created item's id, so compare by request, not hash.
    if (seq === routeSeq) { page.replaceChildren(content); lastHash = location.hash; }
  } catch (err) {
    if (err.status !== 401) page.replaceChildren(h('div.panel.error-panel', {}, h('h2', {}, 'Couldn’t load this page'), h('p', {}, err.message)));
  }
}

window.addEventListener('hashchange', async () => {
  if (state.dirty && !(await confirmDialog('Leave without saving?', { confirm: 'Discard changes', danger: true, detail: 'Your unsaved changes on this page will be lost.' }))) {
    history.replaceState(null, '', lastHash || '#/');
    return;
  }
  lastHash = location.hash;
  if (state.session?.admin) route();
});

async function render() {
  if (!state.session?.admin) { clear(app).append(loginView()); return; }
  route();
}

setUnauthorizedHandler(() => {
  state.session = { ...state.session, admin: false };
  setDirty(false);
  clear(app).append(loginView('Your session ended. Please log in again.'));
});

// ⌘/Ctrl+S saves whatever page is open.
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
    const save = document.querySelector('[data-save]');
    if (save) { e.preventDefault(); save.click(); }
  }
});

(async () => {
  try { state.session = await api('session'); } catch { state.session = { admin: false, configured: false }; }
  render();
})();
