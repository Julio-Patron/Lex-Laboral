import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildIdempotencyKey, SEARCH_LIMIT, SEARCH_TIMEOUT_MS, searchArticles } from './client';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('buildIdempotencyKey', () => {
  it('is stable for the same query, norma and limit', () => {
    const a = buildIdempotencyKey('despido injustificado', 'lft', 10);
    const b = buildIdempotencyKey('despido injustificado', 'lft', 10);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes when the query changes', () => {
    expect(buildIdempotencyKey('despido', 'lft', 10)).not.toBe(
      buildIdempotencyKey('aguinaldo', 'lft', 10)
    );
  });
});

describe('searchArticles', () => {
  it('calls GET /articulos/search with key, idempotency and limit 10', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'X-Request-ID': 'req-1' }),
      json: async () => ({
        data: [{ id: '1', norma_slug: 'lft', label: 'Artículo 47', text: 'texto' }],
      }),
    });

    const result = await searchArticles({
      query: 'despido injustificado',
      norma: 'lft',
      apiKey: 'lex_test_key',
      baseUrl: 'https://api.lexapi.mx',
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://api.lexapi.mx/api/v1/articulos/search?q=despido+injustificado&norma=lft&limit=10'
    );
    expect(init.method).toBe('GET');
    const headers = new Headers(init.headers);
    expect(headers.get('X-API-Key')).toBe('lex_test_key');
    expect(headers.get('Idempotency-Key')).toBe(
      buildIdempotencyKey('despido injustificado', 'lft', SEARCH_LIMIT)
    );
    expect(result.status).toBe(200);
    expect(result.requestId).toBe('req-1');
    expect(result.articles).toHaveLength(1);
  });

  it('omits norma when searching all labor norms', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ data: [] }),
    });

    await searchArticles({
      query: 'aguinaldo',
      apiKey: 'lex_test_key',
      baseUrl: 'https://api.lexapi.mx',
      fetchImpl,
    });

    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toBe('https://api.lexapi.mx/api/v1/articulos/search?q=aguinaldo&limit=10');
    expect(url).not.toContain('norma=');
  });

  it('aborts after 4 seconds', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
        });
      });
    });

    const pending = searchArticles({
      query: 'despido',
      apiKey: 'lex_test_key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const expectation = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(SEARCH_TIMEOUT_MS);
    await expectation;
  });
});
