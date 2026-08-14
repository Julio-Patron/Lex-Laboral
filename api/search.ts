/**
 * API endpoint for semantic legal search
 * POST /api/search
 *
 * Queries a committed LanceDB dataset (data/lance/kb.lance) using
 * Gemini embeddings and cosine similarity via LanceDB vectorSearch
 */

import * as fs from 'fs';
import * as path from 'path';

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
  mode?: 'semantic' | 'local';
  warning?: string;
  message?: string;
}

const EMBEDDING_MODEL = 'text-embedding-004';
const LANCE_DIR = path.join(process.cwd(), 'data', 'lance');
const LANCE_TABLE = 'kb';
const LOCAL_INDEX_PATH = path.resolve(process.cwd(), 'data', 'search-index.json');
const LOCAL_INDEX_CANDIDATES = [
  LOCAL_INDEX_PATH,
  path.resolve(process.cwd(), '..', 'data', 'search-index.json'),
  path.resolve(process.cwd(), 'api', '..', 'data', 'search-index.json'),
];

function handlePreflight(req: any, res: any): boolean {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

function setCorsHeaders(req: any, res: any): void {
  const origin = req.headers?.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function setSecurityHeaders(res: any): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}

function sanitizeInput(input: string | undefined, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input.trim().substring(0, maxLength).replace(/[<>"']/g, '');
}

interface SearchIndexRow {
  id: string;
  norm: string;
  title: string;
  book?: string;
  article: string;
  num: number;
  text: string;
}

interface NormalizedSearchIndexRow extends SearchIndexRow {
  normalizedText: string;
  normalizedTitle: string;
  normalizedArticle: string;
}

interface SearchIndexFile {
  version: number;
  count: number;
  rows: SearchIndexRow[];
}

const STOPWORDS = new Set([
  'ante',
  'bajo',
  'cada',
  'como',
  'con',
  'contra',
  'cuando',
  'cual',
  'cuales',
  'del',
  'desde',
  'donde',
  'dos',
  'el',
  'ella',
  'ellas',
  'ellos',
  'en',
  'entre',
  'era',
  'ese',
  'eso',
  'esta',
  'este',
  'estos',
  'las',
  'ley',
  'los',
  'mas',
  'para',
  'pero',
  'por',
  'que',
  'sin',
  'sobre',
  'sus',
  'una',
  'uno',
  'unos',
]);

let cachedLocalRows: NormalizedSearchIndexRow[] | null = null;

function getGeminiApiKey(): string | null {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || null;
}

function findLocalIndexPath(): string | null {
  return LOCAL_INDEX_CANDIDATES.find((candidate) => fs.existsSync(candidate)) || null;
}

/**
 * Embed query text using Gemini (correct API)
 */
async function embedQuery(query: string): Promise<number[]> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY not configured');
  }

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
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

function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeForSearch(value)
    .split(' ')
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countTokenHits(text: string, token: string): number {
  return text.match(new RegExp(`\\b${escapeRegExp(token)}\\b`, 'g'))?.length ?? 0;
}

function loadLocalRows(): NormalizedSearchIndexRow[] {
  if (cachedLocalRows) return cachedLocalRows;
  const indexPath = findLocalIndexPath();
  if (!indexPath) {
    throw new Error(`Local search index not found. Checked: ${LOCAL_INDEX_CANDIDATES.join(', ')}`);
  }

  const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as SearchIndexFile | SearchIndexRow[];
  const rows = Array.isArray(parsed) ? parsed : parsed.rows;

  cachedLocalRows = rows
    .filter((row) => row.norm && row.article && row.title && row.text)
    .map((row) => ({
      ...row,
      normalizedText: normalizeForSearch(`${row.article} ${row.title} ${row.book || ''} ${row.text}`),
      normalizedTitle: normalizeForSearch(`${row.title} ${row.book || ''}`),
      normalizedArticle: normalizeForSearch(`${row.article} ${row.num}`),
    }));

  return cachedLocalRows;
}

function buildSnippet(text: string, tokens: string[], maxLength = 240): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;

  const normalized = normalizeForSearch(compact);
  const firstHit = tokens
    .map((token) => normalized.indexOf(token))
    .filter((idx) => idx >= 0)
    .sort((a, b) => a - b)[0];

  const start = Math.max(0, (firstHit ?? 0) - 70);
  const end = Math.min(compact.length, start + maxLength);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < compact.length ? '...' : '';
  return `${prefix}${compact.slice(start, end).trim()}${suffix}`;
}

async function searchSemantic(query: string, norm?: string): Promise<SearchResult[]> {
  if (!fs.existsSync(LANCE_DIR)) {
    throw new Error(`LanceDB directory not found: ${LANCE_DIR}`);
  }

  const queryEmbedding = await embedQuery(query);
  const lancedb = await import('@lancedb/lancedb');
  const db = await lancedb.connect(LANCE_DIR);
  const table = await db.openTable(LANCE_TABLE);

  const results = await table
    .vectorSearch(queryEmbedding)
    .limit(50)
    .toArray();

  if (!Array.isArray(results) || results.length === 0) {
    return [];
  }

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

  return finalResults;
}

function searchLocal(query: string, norm?: string): SearchResult[] {
  const rows = loadLocalRows();
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const normalizedQuery = normalizeForSearch(query);
  const allowedNorms = normToFilters(norm);

  const scored = rows
    .filter((row) => !allowedNorms || allowedNorms.includes(row.norm))
    .map((row) => {
      let rawScore = 0;
      let matchedTokens = 0;
      const phraseHit = normalizedQuery.length >= 4 && row.normalizedText.includes(normalizedQuery);

      if (phraseHit) {
        rawScore += 12;
      }

      for (const token of tokens) {
        const titleHits = countTokenHits(row.normalizedTitle, token);
        const articleHits = countTokenHits(row.normalizedArticle, token);
        const textHits = countTokenHits(row.normalizedText, token);

        if (titleHits || articleHits || textHits) {
          matchedTokens += 1;
          rawScore += Math.min(textHits, 10) + titleHits * 4 + articleHits * 6;
        }
      }

      if (matchedTokens === 0 || rawScore <= 0) return null;

      const coverage = matchedTokens / tokens.length;
      const score = Math.min(
        98,
        Math.round((coverage * 72 + Math.min(22, Math.log2(rawScore + 1) * 5) + (phraseHit ? 4 : 0)) * 10) / 10
      );

      return {
        row,
        score,
      };
    })
    .filter((item): item is { row: NormalizedSearchIndexRow; score: number } => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return scored.map(({ row, score }) => ({
    score,
    snippet: buildSnippet(row.text, tokens),
    metadata: {
      norm: row.norm,
      title: row.title,
      article: row.article,
      book: row.book,
      num: row.num,
    },
  }));
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
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { query, norm } = body as {
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
        mode: findLocalIndexPath() ? 'local' : undefined,
      });
    }

    if (getGeminiApiKey() && fs.existsSync(LANCE_DIR)) {
      try {
        const semanticResults = await searchSemantic(sanitizedQuery, norm);
        return res.status(200).json({
          results: semanticResults,
          query: sanitizedQuery,
          norm: norm || 'all',
          count: semanticResults.length,
          mode: 'semantic',
        } satisfies SearchResponse);
      } catch (semanticError) {
        console.error('Semantic search unavailable, falling back to local index:', semanticError);
      }
    }

    try {
      const localResults = searchLocal(sanitizedQuery, norm);
      const warning = !getGeminiApiKey()
        ? 'embedding_key_missing'
        : fs.existsSync(LANCE_DIR)
          ? 'semantic_unavailable'
          : 'semantic_index_missing';

      return res.status(200).json({
        results: localResults,
        query: sanitizedQuery,
        norm: norm || 'all',
        count: localResults.length,
        mode: 'local',
        warning,
      } satisfies SearchResponse);
    } catch (localError) {
      console.error('Local search error:', localError);
      return res.status(503).json({
        results: [],
        count: 0,
        query: sanitizedQuery,
        norm: norm || 'all',
        message: 'El índice de búsqueda no está disponible en este despliegue.',
      } satisfies SearchResponse);
    }
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      results: [],
      count: 0,
      message: 'No se pudo procesar la búsqueda.',
    });
  }
}
