// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetCacheForTests } from '../lib/lexapi/cache';
import { resetRateLimitForTests } from '../lib/lexapi/rate-limit';
import handler from './search';

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(key: string, value: string) {
      this.headers[key] = value;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    end(payload?: string) {
      if (payload !== undefined) this.body = payload;
      return this;
    },
  };
  return res;
}

function mockReq(overrides: { method?: string; body?: unknown; origin?: string; ip?: string } = {}) {
  return {
    method: overrides.method ?? 'POST',
    headers: {
      origin: overrides.origin,
      'x-forwarded-for': overrides.ip ?? '203.0.113.10',
    },
    body: overrides.body ?? { query: 'despido injustificado', norm: 'LFT' },
  };
}

const lftArticle = {
  id: 'art-47',
  norma: 'Ley Federal del Trabajo',
  norma_slug: 'lft',
  label: 'Artículo 47',
  text: 'Son causas de rescisión de la relación de trabajo, sin responsabilidad para el patrón.',
  valid_from: '1970-04-01',
  valid_to: null,
  source: 'Cámara de Diputados',
  source_url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf',
  is_official: true,
  checksum: 'abc123',
  canonical_citation: 'Artículo 47 LFT',
};

function jsonResponse(status: number, data: unknown, requestId = 'req-test') {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'X-Request-ID': requestId }),
    json: async () => data,
  };
}

beforeEach(() => {
  resetRateLimitForTests();
  resetCacheForTests();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetRateLimitForTests();
  resetCacheForTests();
});

describe('POST /api/search', () => {
  it('returns 405 when the method is not POST', async () => {
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(405);
    expect((res.body as { results: unknown[] }).results).toEqual([]);
  });

  it('returns 400 when the query is empty', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { query: '   ', norm: 'LFT' } }), res);
    expect(res.statusCode).toBe(400);
    expect((res.body as { count: number }).count).toBe(0);
  });

  it('proxies to Lex API MX and returns mode lexapi', async () => {
    vi.stubEnv('LEX_API_MX_KEY', 'lex_test_key');
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { data: [lftArticle] }));
    vi.stubGlobal('fetch', fetchImpl);

    const res = mockRes();
    await handler(mockReq(), res);

    expect(res.statusCode).toBe(200);
    const body = res.body as { mode: string; results: Array<{ metadata: { article: string } }>; count: number };
    expect(body.mode).toBe('lexapi');
    expect(body.results[0].metadata.article).toBe('47');
    expect(body.count).toBe(1);
    expect(JSON.stringify(body)).not.toContain('lex_test_key');
    expect(JSON.stringify(body)).not.toContain('X-API-Key');
    expect(fetchImpl.mock.calls[0][0]).toContain('limit=10');
  });

  it('falls back to the local index when Lex API MX returns 402', async () => {
    vi.stubEnv('LEX_API_MX_KEY', 'lex_test_key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(402, { code: 'insufficient_credits' })));

    const res = mockRes();
    await handler(mockReq(), res);

    expect(res.statusCode).toBe(200);
    const body = res.body as { mode: string; warning?: string; results: unknown[] };
    expect(body.mode).toBe('local');
    expect(body.warning).toBe('credits_exhausted');
    expect(body.results.length).toBeGreaterThan(0);
  });

  it('falls back to the local index when the upstream call times out', async () => {
    vi.stubEnv('LEX_API_MX_KEY', 'lex_test_key');
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
          });
        });
      })
    );

    const res = mockRes();
    const pending = handler(mockReq(), res);
    await vi.advanceTimersByTimeAsync(4000);
    await pending;

    expect(res.statusCode).toBe(200);
    expect((res.body as { mode: string }).mode).toBe('local');
    expect(vi.mocked(fetch)).toHaveBeenCalled();
  });

  it('returns 503 when Lex API MX rejects the key', async () => {
    vi.stubEnv('LEX_API_MX_KEY', 'lex_test_key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { detail: 'invalid' })));

    const res = mockRes();
    await handler(mockReq(), res);

    expect(res.statusCode).toBe(503);
    const body = res.body as { message: string };
    expect(body.message).toMatch(/servicio/i);
    expect(JSON.stringify(body)).not.toContain('invalid');
  });

  it('does not call Lex API MX when the server key is missing', async () => {
    vi.stubEnv('LEX_API_MX_KEY', '');
    const fetchImpl = vi.fn();
    vi.stubGlobal('fetch', fetchImpl);

    const res = mockRes();
    await handler(mockReq(), res);

    expect(fetchImpl).not.toHaveBeenCalled();
    expect((res.body as { mode: string }).mode).toBe('local');
  });

  it('sets CORS only for allowed origins', async () => {
    vi.stubEnv('LEX_API_MX_KEY', '');
    const allowed = mockRes();
    await handler(mockReq({ origin: 'https://lexlaboral.com.mx' }), allowed);
    expect(allowed.headers['Access-Control-Allow-Origin']).toBe('https://lexlaboral.com.mx');

    const denied = mockRes();
    await handler(mockReq({ origin: 'https://evil.example' }), denied);
    expect(denied.headers['Access-Control-Allow-Origin']).not.toBe('https://evil.example');
  });

  it('rate-limits the 11th request from the same IP', async () => {
    vi.stubEnv('LEX_API_MX_KEY', '');
    for (let i = 0; i < 10; i += 1) {
      await handler(mockReq({ ip: '198.51.100.9' }), mockRes());
    }

    const res = mockRes();
    await handler(mockReq({ ip: '198.51.100.9' }), res);
    expect(res.statusCode).toBe(429);
    expect(res.headers['Retry-After']).toBeTruthy();
    expect((res.body as { message: string }).message).toMatch(/intenta/i);
  });

  it('reuses a cached Lex API MX response within 60 seconds', async () => {
    vi.stubEnv('LEX_API_MX_KEY', 'lex_test_key');
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { data: [lftArticle] }));
    vi.stubGlobal('fetch', fetchImpl);

    await handler(mockReq(), mockRes());
    const second = mockRes();
    await handler(mockReq(), second);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect((second.body as { mode: string }).mode).toBe('lexapi');
  });

  it('drops non-labor articles when the filter is all', async () => {
    vi.stubEnv('LEX_API_MX_KEY', 'lex_test_key');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          data: [
            lftArticle,
            { ...lftArticle, id: 'cpf-1', norma_slug: 'cpf', norma: 'Código Penal Federal', label: 'Artículo 1' },
          ],
        })
      )
    );

    const res = mockRes();
    await handler(mockReq({ body: { query: 'despido', norm: 'all' } }), res);
    const body = res.body as { mode: string; results: Array<{ metadata: { norm: string } }> };
    expect(body.mode).toBe('lexapi');
    expect(body.results.every((item) => item.metadata.norm !== 'CPF')).toBe(true);
    expect(body.results.some((item) => item.metadata.norm === 'LFT')).toBe(true);
  });
});
