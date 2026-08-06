/**
 * API endpoint for semantic legal search
 * POST /api/search
 *
 * Query the knowledge base using Gemini embeddings and cosine similarity
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import { handlePreflight, sanitizeInput, setCorsHeaders, setSecurityHeaders } from './_utils/security';

interface EmbeddedChunk {
  id: string;
  norm: string;
  title: string;
  book?: string;
  article: string;
  num: number;
  text: string;
  embedding: number[];
}

interface SearchResult {
  score: number;
  snippet: string;
  metadata: {
    norm: string;
    title: string;
    article: string;
    book?: string;
    num: number;
  };
}

interface SearchResponse {
  results: SearchResult[];
  query?: string;
  norm?: string;
  count: number;
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Embed query text using Gemini
 */
async function embedQuery(query: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured');
  }

  const client = new GoogleGenerativeAI(apiKey);

  try {
    const result = await (client as any).embedContent({
      model: 'models/text-embedding-004',
      content: {
        parts: [{ text: query }],
      },
    });

    if (!result.embedding || !result.embedding.values) {
      throw new Error('No embedding returned from Gemini');
    }

    return result.embedding.values;
  } catch (error) {
    console.error('Error embedding query:', error);
    throw error;
  }
}

/**
 * Load knowledge base from JSON file
 */
function loadKnowledgeBase(): EmbeddedChunk[] {
  try {
    const kbPath = path.join(process.cwd(), 'data', 'lance', 'kb.json');

    if (!fs.existsSync(kbPath)) {
      console.warn(`KB file not found at ${kbPath}`);
      return [];
    }

    const content = fs.readFileSync(kbPath, 'utf-8');
    return JSON.parse(content) as EmbeddedChunk[];
  } catch (error) {
    console.error('Error loading KB:', error);
    return [];
  }
}

/**
 * Search knowledge base with query embedding
 */
function searchKB(
  queryEmbedding: number[],
  kb: EmbeddedChunk[],
  norm?: string,
  threshold: number = 0.55,
  topK: number = 10
): SearchResult[] {
  const results: Array<{ chunk: EmbeddedChunk; score: number }> = [];

  for (const chunk of kb) {
    // Filter by norm if specified
    if (norm && norm !== 'all' && chunk.norm !== norm) {
      continue;
    }

    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);

    // Apply threshold
    if (similarity >= threshold) {
      results.push({ chunk, score: similarity });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Limit to topK results
  const topResults = results.slice(0, topK);

  return topResults.map(({ chunk, score }) => ({
    score: Math.round(score * 1000) / 10, // Convert to 0-100 percentage, 1 decimal
    snippet: chunk.text.substring(0, 200) + (chunk.text.length > 200 ? '...' : ''),
    metadata: {
      norm: chunk.norm,
      title: chunk.title,
      article: chunk.article,
      book: chunk.book,
      num: chunk.num,
    },
  }));
}

/**
 * Map multiple norms to single norm filter
 * e.g., 'IMSS' maps to ['LSS', 'R_LSS']
 */
function normToFilter(norm?: string): string | undefined {
  if (!norm || norm === 'all') return 'all';
  if (norm === 'IMSS') return 'LSS'; // Search both LSS and R_LSS
  if (norm === 'INFONAVIT_GROUP')
    return 'INFONAVIT'; // Search both INFONAVIT and R_INFONAVIT
  return norm;
}

export default async function handler(
  req: any,
  res: any
) {
  // Set security headers
  setSecurityHeaders(res);
  setCorsHeaders(req, res);

  // Handle preflight
  if (handlePreflight(req, res)) {
    return;
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      results: [],
      count: 0,
      query: undefined,
      norm: undefined,
    });
  }

  try {
    const { query, norm } = req.body as {
      query?: string;
      norm?: string;
    };

    // Validate query
    const sanitizedQuery = sanitizeInput(query, 500);
    if (!sanitizedQuery) {
      return res.status(400).json({
        results: [],
        count: 0,
        query: '',
        norm: norm || 'all',
      });
    }

    // Embed query with Gemini
    const queryEmbedding = await embedQuery(sanitizedQuery);

    // Load KB
    const kb = loadKnowledgeBase();
    if (kb.length === 0) {
      return res.status(500).json({
        results: [],
        count: 0,
        query: sanitizedQuery,
        norm: norm || 'all',
      });
    }

    // Search
    const normFilter = normToFilter(norm);
    const results = searchKB(
      queryEmbedding,
      kb,
      normFilter === 'all' ? undefined : normFilter,
      0.55,
      10
    );

    return res.status(200).json({
      results,
      query: sanitizedQuery,
      norm: norm || 'all',
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      results: [],
      count: 0,
    });
  }
}
