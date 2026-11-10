// Talks to /api/admin. Changes carry the x-soil-admin header the server requires.

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export async function api(r, { method = 'GET', id, params = {}, body } = {}) {
  const qs = new URLSearchParams({ r, ...(id ? { id } : {}), ...params });
  const res = await fetch(`/api/admin?${qs}`, {
    method,
    headers: method === 'GET' ? {} : { 'content-type': 'application/json', 'x-soil-admin': '1' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && r !== 'login') onUnauthorized();
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  return data;
}

// Large photos are scaled down in the browser before upload (max 2400px, JPEG), which keeps
// every upload under the 4 MB the server accepts.
async function prepare(file, maxSide = 2400) {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1.5 * 1024 * 1024 && ['image/jpeg', 'image/webp', 'image/png'].includes(file.type)) {
    return file;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const keepPng = file.type === 'image/png' && file.size < 3 * 1024 * 1024;
  return new Promise((resolve) => canvas.toBlob(resolve, keepPng ? 'image/png' : 'image/jpeg', 0.86));
}

export async function uploadImage(file) {
  const blob = await prepare(file);
  const res = await fetch(`/api/admin?r=upload&name=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    headers: { 'content-type': blob.type || file.type, 'x-soil-admin': '1' },
    body: blob,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Upload failed', res.status);
  return data.url;
}

export function pickImage() {
  return new Promise((resolve) => {
    const el = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/gif' });
    el.addEventListener('change', () => resolve(el.files[0] ?? null));
    el.click();
  });
}
