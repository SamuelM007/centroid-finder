import { vi } from 'vitest';

type Handler = (url: string, init?: RequestInit) => unknown;

// Replaces the global fetch with fake responses, so components can be tested
// without the backend. Keys are "METHOD /path" (query string ignored), e.g.
//   mockFetch({ 'GET /api/videos': () => ['a.mp4'] })
// A handler's return value is sent as JSON; return a Response to control the status.
// Unknown URLs get a 404. Returns the mock so tests can check which URLs were called.
export function mockFetch(routes: Record<string, Handler>) {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const path = url.split('?')[0];
    const key = `${(init?.method ?? 'GET').toUpperCase()} ${path}`;
    const handler = routes[key];
    if (!handler) return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
    const result = await handler(url, init);
    if (result instanceof Response) return result;
    return new Response(typeof result === 'string' ? result : JSON.stringify(result), { status: 200 });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

// The URLs fetch was called with, in order
export const calledUrls = (fn: ReturnType<typeof mockFetch>) =>
  fn.mock.calls.map(([input, init]) => `${(init?.method ?? 'GET').toUpperCase()} ${String(input)}`);
