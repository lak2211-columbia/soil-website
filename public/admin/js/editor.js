// The block editor for story and letter bodies. Blocks: paragraph, subheading, pull quote,
// Q&A, image, divider. Shortcuts: ⌘/Ctrl+Enter adds a paragraph below; pasting text with blank
// lines into a paragraph splits it into several paragraphs.

import { h, autosize, button, select, toast } from './dom.js';
import { uploadImage, pickImage } from './api.js';

const TYPES = [
  ['p', 'Paragraph'], ['h', 'Subheading'], ['quote', 'Pull quote'], ['qa', 'Q & A'], ['image', 'Image'], ['divider', 'Divider'],
];
const LABELS = Object.fromEntries(TYPES);
const blank = (type) => ({
  p: { type, text: '' }, h: { type, text: '' }, quote: { type, text: '', cite: '' }, qa: { type, q: '', a: '' },
  image: { type, url: '', alt: '', caption: '', size: 'normal' }, divider: { type },
}[type]);

export function blockEditor(initial, onChange, { imageBlocks = true } = {}) {
  let blocks = (Array.isArray(initial) && initial.length ? initial : [blank('p')]).map((b) => ({ ...b }));
  const root = h('div.blocks');
  const changed = () => onChange?.(blocks);
  let focusIndex = null;

  function insertMenu(at) {
    const menu = h('div.insert', {},
      h('span.insert-label', {}, '+'),
      TYPES.filter(([t]) => imageBlocks || t !== 'image').map(([type, label]) =>
        h('button', { type: 'button', onclick: () => { blocks.splice(at, 0, blank(type)); focusIndex = at; render(); changed(); } }, label)));
    return menu;
  }

  function text(block, key, { placeholder, cls = '', multi = true } = {}, i) {
    const el = autosize(h(`textarea.${cls || 'b-text'}`, {
      rows: 1, placeholder, value: block[key] ?? '',
      oninput: () => { block[key] = el.value; changed(); },
      onkeydown: (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          blocks.splice(i + 1, 0, blank('p')); focusIndex = i + 1; render(); changed();
        }
        if (!multi && e.key === 'Enter') e.preventDefault();
      },
      onpaste: (e) => {
        if (block.type !== 'p') return;
        const pasted = e.clipboardData.getData('text/plain');
        const parts = pasted.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
        if (parts.length < 2) return;
        e.preventDefault();
        const before = el.value.slice(0, el.selectionStart);
        const after = el.value.slice(el.selectionEnd);
        block.text = (before + parts[0]).trim();
        const extra = parts.slice(1).map((t) => ({ type: 'p', text: t }));
        extra[extra.length - 1].text += after;
        blocks.splice(i + 1, 0, ...extra);
        focusIndex = i + extra.length; render(); changed();
      },
    }));
    return el;
  }

  function imageBlock(b) {
    const preview = h('div.b-image-preview', {}, b.url ? h('img', { src: b.url, alt: '' }) : h('span', {}, 'No image yet'));
    const urlInput = h('input', {
      type: 'url', placeholder: 'Image URL, or upload', value: b.url,
      oninput: () => { b.url = urlInput.value.trim(); changed(); },
      onchange: () => { preview.replaceChildren(b.url ? h('img', { src: b.url, alt: '' }) : h('span', {}, 'No image yet')); },
    });
    const uploadBtn = button('Upload…', async () => {
      const file = await pickImage();
      if (!file) return;
      uploadBtn.disabled = true; uploadBtn.textContent = 'Uploading…';
      try {
        b.url = await uploadImage(file);
        urlInput.value = b.url;
        if (!b.alt) { b.alt = ''; }
        preview.replaceChildren(h('img', { src: b.url, alt: '' }));
        changed();
      } catch (err) { toast(err.message, 'error'); }
      uploadBtn.disabled = false; uploadBtn.textContent = 'Upload…';
    }, 'small');
    return h('div.b-image', {}, preview,
      h('div.b-image-fields', {},
        h('div.row', {}, urlInput, uploadBtn),
        h('input', { placeholder: 'Alt text (describe the image for screen readers)', value: b.alt, oninput: (e) => { b.alt = e.target.value; changed(); } }),
        h('input', { placeholder: 'Caption (optional)', value: b.caption, oninput: (e) => { b.caption = e.target.value; changed(); } }),
        select([['normal', 'Text width'], ['wide', 'Wide']], b.size, { onchange: (e) => { b.size = e.target.value; changed(); } })));
  }

  function blockEl(b, i) {
    let content;
    switch (b.type) {
      case 'p': content = text(b, 'text', { placeholder: 'Write…' }, i); break;
      case 'h': content = text(b, 'text', { placeholder: 'Subheading', cls: 'b-heading', multi: false }, i); break;
      case 'quote': content = h('div', {},
        text(b, 'text', { placeholder: 'A line worth pulling out', cls: 'b-quote' }, i),
        h('input.b-cite', { placeholder: 'Attribution (optional)', value: b.cite, oninput: (e) => { b.cite = e.target.value; changed(); } }));
        break;
      case 'qa': content = h('div', {},
        text(b, 'q', { placeholder: 'Question', cls: 'b-q' }, i),
        text(b, 'a', { placeholder: 'Answer' }, i));
        break;
      case 'image': content = imageBlock(b); break;
      default: content = h('div.b-divider', {}, '· · ·');
    }
    const typeSwitch = ['p', 'h', 'quote'].includes(b.type)
      ? select([['p', 'Paragraph'], ['h', 'Subheading'], ['quote', 'Pull quote']], b.type, {
        class: 'b-type', title: 'Change block type',
        onchange: (e) => { b.type = e.target.value; if (b.type === 'quote') b.cite ??= ''; render(); changed(); },
      })
      : h('span.b-type', {}, LABELS[b.type]);
    return h(`div.block.b-${b.type}`, {},
      h('div.b-gutter', {}, typeSwitch,
        h('span.b-tools', {},
          i > 0 ? h('button.icon', { type: 'button', title: 'Move up', onclick: () => { [blocks[i - 1], blocks[i]] = [blocks[i], blocks[i - 1]]; render(); changed(); } }, '↑') : null,
          i < blocks.length - 1 ? h('button.icon', { type: 'button', title: 'Move down', onclick: () => { [blocks[i + 1], blocks[i]] = [blocks[i], blocks[i + 1]]; render(); changed(); } }, '↓') : null,
          h('button.icon', { type: 'button', title: 'Remove block', onclick: () => { blocks.splice(i, 1); if (!blocks.length) blocks.push(blank('p')); render(); changed(); } }, '×'))),
      h('div.b-body', {}, content));
  }

  function render() {
    root.replaceChildren(insertMenu(0), ...blocks.flatMap((b, i) => [blockEl(b, i), insertMenu(i + 1)]));
    if (focusIndex !== null) {
      const target = root.querySelectorAll('.block')[focusIndex]?.querySelector('textarea, input');
      target?.focus();
      focusIndex = null;
    }
  }
  render();
  root.getValue = () => blocks;
  return root;
}

export const markupHint = 'Use *word* for italics, **한글** for an upright Korean phrase, and [text](https://…) for a link.';
