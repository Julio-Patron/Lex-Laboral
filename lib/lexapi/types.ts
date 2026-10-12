export type SearchMode = 'lexapi' | 'semantic' | 'local';

export interface SearchResult {
  score: number;
  snippet: string;
  metadata: {
    norm: string;
    title: string;
    article: string;
    book?: string;
    num: number;
  };
  sourceUrl?: string;
  sourceName?: string;
  validFrom?: string;
  checksum?: string;
  canonicalCitation?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query?: string;
  norm?: string;
  count: number;
  mode?: SearchMode;
  warning?: string;
  message?: string;
}

export interface LexApiArticle {
  id: string;
  norma: string;
  norma_slug: string;
  label: string;
  text: string;
  valid_from: string | null;
  valid_to: string | null;
  source: string;
  source_url: string;
  is_official: boolean;
  checksum: string;
  canonical_citation: string;
}

export type RateLimitDecision =
  | { ok: true }
  | { ok: false; retryAfterSec: number };
