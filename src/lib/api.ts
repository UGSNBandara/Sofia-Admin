// Use Vite env variable when available so the deployed site can point to any API host.
// In development, create a `.env` file with VITE_API_BASE if you need to override.
export const BASE = (import.meta.env as any).VITE_API_BASE || 'https://icecreamemultiagent-production.up.railway.app';

export async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}