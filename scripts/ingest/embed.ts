/**
 * Embedding module using Gemini text-embedding-004
 * Embeds chunks and saves a LanceDB dataset at data/lance/kb.lance
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as lancedb from '@lancedb/lancedb';
import * as fs from 'fs';
import * as path from 'path';
import type { ChunkedArticle } from './chunk';

export interface EmbeddedChunk {
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

export interface LanceRow extends EmbeddedChunk {}

const EMBEDDING_MODEL = 'text-embedding-004';
const BATCH_SIZE = 10;

/**
 * Embed a single text using Gemini (correct API: getGenerativeModel().embedContent)
 */
export const embedText = async (text: string, client: GoogleGenerativeAI): Promise<number[]> => {
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  const values = result.embedding.values;

  if (!values) {
    throw new Error('No embedding returned from Gemini');
  }

  return Array.from(values);
};

/**
 * Embed all chunks in batches and build LanceDB rows
 */
export const embedChunks = async (
  chunks: ChunkedArticle[],
  client: GoogleGenerativeAI,
): Promise<EmbeddedChunk[]> => {
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
  const embedded: EmbeddedChunk[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    console.log(`Embedding ${i + 1}-${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length}`);

    try {
      const result = await model.batchEmbedContents({
        requests: batch.map(c => ({
          content: { role: 'user', parts: [{ text: c.text }] },
        })),
      });
      const embeddings = result.embeddings;

      batch.forEach((chunk, j) => {
        const values = embeddings[j]?.values;
        if (!values) {
          console.warn(`No embedding for chunk ${chunk.id}, skipping`);
          return;
        }
        embedded.push({
          id: chunk.id,
          norm: chunk.norm,
          title: chunk.title,
          book: chunk.book,
          article: chunk.article,
          num: chunk.num,
          text: chunk.text,
          chunkIndex: chunk.chunkIndex,
          totalChunks: chunk.totalChunks,
          vector: Array.from(values),
        });
      });
    } catch (error) {
      console.warn(`Batch ${i} failed, retrying one-by-one...`, error);
      for (const chunk of batch) {
        try {
          const vector = await embedText(chunk.text, client);
          embedded.push({
            id: chunk.id,
            norm: chunk.norm,
            title: chunk.title,
            book: chunk.book,
            article: chunk.article,
            num: chunk.num,
            text: chunk.text,
            chunkIndex: chunk.chunkIndex,
            totalChunks: chunk.totalChunks,
            vector,
          });
        } catch (retryError) {
          console.warn(`Failed to embed chunk ${chunk.id}, skipping`, retryError);
        }
      }
    }
  }

  console.log(`Embedded ${embedded.length} chunks`);
  return embedded;
};

export interface LanceIndexConfig {
  dbDir: string;
  tableName: string;
  distanceType?: 'l2' | 'cosine' | 'dot';
}

/**
 * Save embedded chunks into a LanceDB dataset (data/lance/kb.lance)
 * The dataset is committed to the repo and opened read-only by api/search.ts
 */
export const saveEmbeddingsToLance = async (
  rows: EmbeddedChunk[],
  config: LanceIndexConfig,
): Promise<void> => {
  const { dbDir, tableName, distanceType = 'cosine' } = config;

  fs.mkdirSync(dbDir, { recursive: true });

  const db = await lancedb.connect(dbDir);
  const table = await db.createTable(
    tableName,
    rows.map(r => ({ ...r }) as Record<string, unknown>)
  );

  await table.createIndex('vector', {
    indexType: 'IvfFlat',
    distanceType,
    config: { numPartitions: 128, numIterations: 25, sampleRate: 256 },
  } as any);

  console.log(`Saved ${rows.length} rows to LanceDB table "${tableName}" at ${dbDir}`);
  console.log(`Index created (${distanceType}) on vector column`);
};

/**
 * Load chunks from a LanceDB dataset (read-only)
 */
export const loadEmbeddingsFromLance = async (
  dbDir: string,
  tableName: string,
): Promise<EmbeddedChunk[]> => {
  const db = await lancedb.connect(dbDir);
  const table = await db.openTable(tableName);
  const rows = await table.query().toArray();
  return rows as unknown as EmbeddedChunk[];
};

/**
 * Fallback JSON persistence (data/lance/kb.json)
 */
export const saveEmbeddingsToFile = async (
  embeddedChunks: EmbeddedChunk[],
  outputPath: string,
): Promise<void> => {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(embeddedChunks, null, 2), 'utf-8');
  console.log(`Saved ${embeddedChunks.length} embeddings to ${outputPath}`);
};

export const loadEmbeddingsFromFile = (kbPath: string): EmbeddedChunk[] => {
  if (!fs.existsSync(kbPath)) {
    console.warn(`KB file not found: ${kbPath}`);
    return [];
  }
  const content = fs.readFileSync(kbPath, 'utf-8');
  return JSON.parse(content) as EmbeddedChunk[];
};