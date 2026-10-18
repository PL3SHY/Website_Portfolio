// Imported first thing in main.tsx. A few places in the app call the backend with a plain fetch()
// instead of the Supabase client (device check, payments, refunds, ...). This answers those calls
// from the in-memory backend so nothing ever leaves the page.

import { handleFunction } from './backend';

const BASE = String(import.meta.env.VITE_SUPABASE_URL ?? 'https://demo.invalid');
const realFetch = window.fetch.bind(window);

function headersToObject(h?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {};
  if (!h) return out;
  new Headers(h).forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

  if (url.startsWith(`${BASE}/functions/v1/`)) {
    const name = url.slice(`${BASE}/functions/v1/`.length).split('?')[0];
    let body: unknown = {};
    try {
      body = JSON.parse(String(init?.body ?? '{}'));
    } catch {
      body = {};
    }
    const result = await handleFunction(name, body, headersToObject(init?.headers));
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (url.startsWith(BASE)) {
    return new Response(JSON.stringify({ error: 'Not available in the demo.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return realFetch(input, init);
};
