import { createHash } from 'node:crypto';
import type { LexApiArticle } from './types';

export const SEARCH_TIMEOUT_MS = 4000;
export const SEARCH_LIMIT = 10;

export function buildIdempotencyKey(query: string, norma?: string, limit: number = SEARCH_LIMIT): string {
  const payload = `GET|/api/v1/articulos/search|${query}|${norma ?? ''}|${limit}`;
  return createHash('sha256').update(payload).digest('hex');
}

export interface SearchArticlesInput {
  query: string;
  norma?: string;
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface SearchArticlesResult {
  articles: LexApiArticle[];
  requestId?: string;
  status: number;
}

export class LexApiHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId?: string
  ) {
    super(message);
    this.name = 'LexApiHttpError';
  }
}

export async function searchArticles(input: SearchArticlesInput): Promise<SearchArticlesResult> {
  const baseUrl = (input.baseUrl ?? 'https://api.lexapi.mx').replace(/\/$/, '');
  const timeoutMs = input.timeoutMs ?? SEARCH_TIMEOUT_MS;
  const fetchImpl = input.fetchImpl ?? fetch;

  const params = new URLSearchParams();
  params.set('q', input.query);
  if (input.norma) params.set('norma', input.norma);
  params.set('limit', String(SEARCH_LIMIT));

  const url = `${baseUrl}/api/v1/articulos/search?${params.toString()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        'X-API-Key': input.apiKey,
        'Idempotency-Key': buildIdempotencyKey(input.query, input.norma, SEARCH_LIMIT),
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    const requestId = response.headers.get('X-Request-ID') ?? undefined;
    const body = (await response.json().catch(() => ({}))) as { data?: LexApiArticle[] };

    if (!response.ok) {
      throw new LexApiHttpError(`Lex API MX search failed with ${response.status}`, response.status, requestId);
    }

    return {
      articles: Array.isArray(body.data) ? body.data : [],
      requestId,
      status: response.status,
    };
  } finally {
    clearTimeout(timer);
  }
}
