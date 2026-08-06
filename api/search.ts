/**
 * API endpoint for semantic legal search
 * POST /api/search
 *
 * Queries a committed LanceDB dataset (data/lance/kb.lance) using
 * Gemini embeddings and cosine similarity via LanceDB vectorSearch
 */

import * as lancedb from '@lancedb/lancedb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as path from 'path';
import { handlePreflight, sanitizeInput, setCorsHeaders, setSecurityHeaders } from './_utils/security';

interface LanceRow {
  id: string;
  norm: string;
  title: string;
  book?: string;
  article: string;
  num: number;
  text: string;
  chunkIndex: number;
  totalChunks: number;
  vector: number[];
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

const EMBEDDING_MODEL = 'text-embedding-004';
const LANCE_DIR = path.join(process.cwd(), 'data', 'lance');
const LANCE_TABLE = 'kb';

/**
 * Embed query text using Gemini (correct API)
 */
async function embedQuery(query: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY not configured');
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(query);

  if (!result.embedding.values) {
    throw new Error('No embedding returned from Gemini');
  }

  return Array.from(result.embedding.values);
}

/**
 * Map UI norm filter to a set of normalized norms in the KB
 */
function normToFilters(norm?: string): string[] | null {
  if (!norm || norm === 'all') return null; // no filter
  switch (norm) {
    case 'LFT':
      return ['LFT'];
    case 'LSS':
    case 'IMSS':
      return ['LSS', 'R_LSS'];
    case 'INFONAVIT':
    case 'INFONAVIT_GROUP':
      return ['INFONAVIT', 'R_INFONAVIT'];
    default:
      return null;
  }
}

/**
 * Convert LanceDB cosine distance to a 0-100 similarity score
 */
function distanceToScore(distance: number): number {
  const similarity = 1 - distance; // cosine similarity
  const score = Math.max(0, Math.min(1, similarity));
  return Math.round(score * 1000) / 10;
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

    // Open LanceDB dataset read-only and run vector search
    const db = await lancedb.connect(LANCE_DIR);
    const table = await db.openTable(LANCE_TABLE);

    let results = await table
      .vectorSearch(queryEmbedding)
      .limit(50)
      .toArray();

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(200).json({
        results: [],
        query: sanitizedQuery,
        norm: norm || 'all',
        count: 0,
      });
    }

    // Apply norm filter + threshold + sort + dedupe by article
    const allowedNorms = normToFilters(norm);
    const THRESHOLD = 0.4;

    const ranked = (results as any[])
      .map(row => ({
        row: row as unknown as LanceRow,
        score: distanceToScore(row._distance),
      }))
      .filter(({ score }) => score >= THRESHOLD * 100)
      .filter(({ row }) => {
        if (!allowedNorms) return true;
        return allowedNorms.includes(row.norm);
      })
      .sort((a, b) => b.score - a.score);

    // Keep best chunk per (norm, article) to avoid duplicate articles
    const seen = new Set<string>();
    const finalResults: SearchResult[] = [];

    for (const { row, score } of ranked) {
      const key = `${row.norm}:${row.article}:${row.title}`;
      if (seen.has(key)) continue;
      seen.add(key);

      finalResults.push({
        score,
        snippet: row.text.substring(0, 220) + (row.text.length > 220 ? '...' : ''),
        metadata: {
          norm: row.norm,
          title: row.title,
          article: row.article,
          book: row.book,
          num: row.num,
        },
      });

      if (finalResults.length >= 10) break;
    }

    return res.status(200).json({
      results: finalResults,
      query: sanitizedQuery,
      norm: norm || 'all',
      count: finalResults.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      results: [],
      count: 0,
    });
  }
}