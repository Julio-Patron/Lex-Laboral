/**
 * Text chunking utility to split articles into overlapping chunks
 * Preserves metadata (norm, title, article, num) for each chunk
 */

import type { ParsedArticle } from './parser';

export interface ChunkedArticle {
  id: string;
  norm: string;
  title: string;
  book?: string;
  article: string;
  num: number;
  text: string;
  chunkIndex: number;
  totalChunks: number;
  sourceArticleId: string;
}
export interface ChunkConfig {
  chunkSize: number;
  overlap: number;
}

const DEFAULT_CONFIG: ChunkConfig = {
  chunkSize: 512,
  overlap: 64,
};

/**
 * Chunks text while preserving sentence boundaries when possible
 */
const splitIntoSentences = (text: string): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.map(s => s.trim()).filter(s => s.length > 0);
};

/**
 * Intelligently chunk text with overlap
 */
export const chunkText = (text: string, config: Partial<ChunkConfig> = {}): string[] => {
  const { chunkSize, overlap } = { ...DEFAULT_CONFIG, ...config };

  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = splitIntoSentences(text);
  let currentChunk = '';
  let lastChunk = '';

  for (const sentence of sentences) {
    const testChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;

    if (testChunk.length <= chunkSize) {
      currentChunk = testChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        lastChunk = currentChunk;
        // Create overlap by including last part of previous chunk
        if (lastChunk.length > overlap) {
          currentChunk = lastChunk.slice(-overlap) + ' ' + sentence;
        } else {
          currentChunk = sentence;
        }
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk && currentChunk !== chunks[chunks.length - 1]) {
    chunks.push(currentChunk);
  }

  return chunks;
};

/**
 * Process articles into chunks
 */
export const chunkArticles = (
  articles: ParsedArticle[],
  config: Partial<ChunkConfig> = {}
): ChunkedArticle[] => {
  const chunks: ChunkedArticle[] = [];

  for (const article of articles) {
    const textChunks = chunkText(article.text, config);
    const totalChunks = textChunks.length;

    for (let i = 0; i < textChunks.length; i++) {
      chunks.push({
        id: `${article.id}_chunk_${i}`,
        norm: article.norm,
        title: article.title,
        book: article.book,
        article: article.article,
        num: article.num,
        text: textChunks[i],
        chunkIndex: i,
        totalChunks,
        sourceArticleId: article.id,
      });
    }
  }

  return chunks;
};
