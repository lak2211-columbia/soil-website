// Tiny DOM helpers for the admin. No framework: h() builds elements, the rest are small widgets.

export function h(tag, props = {}, ...children) {
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (classes.length) el.className = classes.join(' ');
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = [el.className, v].filter(Boolean).join(' ');
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k in el && k !== 'list' && k !== 'form') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export const clear = (el) => { el.replaceChildren(); return el; };

export function plain(text) {
  return String(text ?? '').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
}

export function autosize(textarea) {
  const fit = () => { textarea.style.height = 'auto'; textarea.style.height = `${textarea.scrollHeight + 2}px`; };
  textarea.addEventListener('input', fit);
  requestAnimationFrame(fit);
  return textarea;
}

export function field(label, control, hint) {
  return h('label.field', {}, h('span.label', {}, label), control, hint ? h('span.hint', {}, hint) : null);
}

export const input = (props = {}) => h('input', { type: 'text', ...props });
export const textarea = (props = {}) => autosize(h('textarea', { rows: 2, ...props }));

export function select(options, value, props = {}) {
  const el = h('select', props, options.map(([v, label]) => h('option', { value: v }, label)));
  el.value = value ?? '';
  return el;
}

export function button(label, onClick, kind = '', props = {}) {
  return h(`button.btn${kind ? `.${kind}` : ''}`, { type: 'button', onclick: onClick, ...props }, label);
}

export function badge(status) {
  return h(`span.badge.${status}`, {}, status);
}

export function toast(message, kind = 'ok') {
  let host = document.querySelector('.toasts');
  if (!host) host = document.body.appendChild(h('div.toasts', { role: 'status', 'aria-live': 'polite' }));
  const t = host.appendChild(h(`div.toast.${kind}`, {}, message));
  setTimeout(() => t.classList.add('out'), kind === 'error' ? 6000 : 2600);
  setTimeout(() => t.remove(), kind === 'error' ? 6500 : 3100);
}

export function confirmDialog(message, { confirm = 'Confirm', danger = false, detail = '' } = {}) {
  return new Promise((resolve) => {
    const dlg = h('dialog.dialog', {},
      h('p.dialog-title', {}, message),
      detail ? h('p.dialog-detail', {}, detail) : null,
      h('div.dialog-actions', {},
        button('Cancel', () => dlg.close('no'), 'ghost'),
        button(confirm, () => dlg.close('yes'), danger ? 'danger' : 'primary')));
    dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'yes'); dlg.remove(); });
    document.body.append(dlg);
    dlg.showModal();
  });
}

export function modal(title, content, { wide = false } = {}) {
  const dlg = h(`dialog.dialog${wide ? '.wide' : ''}`, {},
    h('div.dialog-head', {}, h('p.dialog-title', {}, title), button('Close', () => dlg.close(), 'ghost')),
    content);
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function pageHead(title, ...actions) {
  return h('div.page-head', {}, h('h1', {}, title), h('div.actions', {}, actions));
}

// Up/down/remove controls for an item in an ordered list.
export function moveControls({ onUp, onDown, onRemove, removeLabel = 'Remove' }) {
  return h('span.move', {},
    onUp ? h('button.icon', { type: 'button', title: 'Move up', 'aria-label': 'Move up', onclick: onUp }, '↑') : null,
    onDown ? h('button.icon', { type: 'button', title: 'Move down', 'aria-label': 'Move down', onclick: onDown }, '↓') : null,
    onRemove ? h('button.icon', { type: 'button', title: removeLabel, 'aria-label': removeLabel, onclick: onRemove }, '×') : null);
}
