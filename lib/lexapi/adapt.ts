import { toUiNorm } from './norms';
import type { LexApiArticle, SearchResult } from './types';

const SNIPPET_MAX = 240;

function articleNumber(label: string): { article: string; num: number } {
  const match = label.match(/(\d+[a-záéíóúñ]*)/i);
  const article = match?.[1] ?? label;
  const num = parseInt(article, 10);
  return { article, num: Number.isFinite(num) ? num : 0 };
}

function snippetFrom(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length <= SNIPPET_MAX) return compact;
  return `${compact.slice(0, SNIPPET_MAX - 3).trim()}...`;
}

export function adaptArticle(article: LexApiArticle, rankIndex: number): SearchResult {
  const { article: articleLabel, num } = articleNumber(article.label);
  return {
    score: Math.max(10, 100 - rankIndex * 10),
    snippet: snippetFrom(article.text ?? ''),
    metadata: {
      norm: toUiNorm(article.norma_slug),
      title: article.norma,
      article: articleLabel,
      num,
    },
    sourceUrl: article.source_url,
    sourceName: article.source,
    validFrom: article.valid_from ?? undefined,
    checksum: article.checksum,
    canonicalCitation: article.canonical_citation,
  };
}
