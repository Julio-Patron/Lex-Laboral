// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { searchArticles } from '../lib/lexapi/client';

const live = Boolean(process.env.LEX_API_MX_LIVE_TEST && process.env.LEX_API_MX_KEY);

describe.skipIf(!live)('Lex API MX live smoke', () => {
  it('returns LFT articles for a labor query', async () => {
    const result = await searchArticles({
      query: 'despido injustificado',
      norma: 'lft',
      apiKey: process.env.LEX_API_MX_KEY as string,
      baseUrl: process.env.LEX_API_MX_BASE_URL,
    });

    expect(result.status).toBe(200);
    expect(result.articles.length).toBeGreaterThan(0);
    expect(result.articles[0].norma_slug).toBe('lft');
  });
});
