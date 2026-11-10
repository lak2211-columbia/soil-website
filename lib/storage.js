// Image uploads. On Vercel they go to Vercel Blob (BLOB_READ_WRITE_TOKEN, added when you create a
// Blob store under Storage). Locally, without a token, they're saved to public/uploads/.

import { put } from '@vercel/blob';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';

export const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel functions accept request bodies up to 4.5 MB

export const blobConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function safeName(name, ext) {
  const base = String(name || 'image').replace(/\.[a-z0-9]+$/i, '')
    .normalize('NFKD').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 60) || 'image';
  return `${base}.${ext}`;
}

export async function saveImage(bytes, contentType, name) {
  const ext = IMAGE_TYPES[contentType];
  if (!ext) throw Object.assign(new Error('Upload a JPEG, PNG, WebP or GIF image.'), { status: 415 });
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw Object.assign(new Error('That image is over 4 MB.'), { status: 413 });
  const filename = safeName(name, ext);

  if (blobConfigured()) {
    const month = new Date().toISOString().slice(0, 7);
    const blob = await put(`images/${month}/${filename}`, Buffer.from(bytes), {
      access: 'public', addRandomSuffix: true, contentType,
    });
    return blob.url;
  }
  if (process.env.VERCEL) {
    throw Object.assign(new Error('Image storage isn’t set up. Create a Blob store for this project in Vercel (Storage), then redeploy.'), { status: 503 });
  }
  const dir = new URL('../public/uploads/', import.meta.url).pathname;
  await mkdir(dir, { recursive: true });
  const stored = `${randomBytes(4).toString('hex')}-${filename}`;
  await writeFile(join(dir, stored), Buffer.from(bytes));
  return `/uploads/${stored}`;
}
