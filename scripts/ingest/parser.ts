/**
 * Parser for legal text into structured articles
 */

import type { LegalArticle } from './download';

export interface ParsedArticle extends LegalArticle {
  id: string;
}

/**
 * Parse raw legal text into structured articles
 * In this implementation, articles come pre-structured from the download module
 */
export const parseArticles = (rawArticles: LegalArticle[]): ParsedArticle[] => {
  return rawArticles.map((article, idx) => ({
    ...article,
    id: `${article.norm}_${article.num}_${idx}`,
  }));
};

export const validateArticle = (article: LegalArticle): boolean => {
  return !!(
    article.norm &&
    article.title &&
    article.article &&
    typeof article.num === 'number' &&
    article.text &&
    article.text.length > 0
  );
};
