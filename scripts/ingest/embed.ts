/**
 * Embedding module using Gemini text-embedding-004
 * Embeds chunks and saves to data/lance/kb.json
 */

import type { ChunkedArticle } from './chunk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

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
  embedding: number[];
}

const EMBEDDING_MODEL = 'text-embedding-004';

/**
 * Embed a single text using Gemini
 */
export const embedText = async (text: string, client: GoogleGenerativeAI): Promise<number[]> => {
  try {
    const result = await (client as any).embedContent({
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text }],
      },
    });

    if (!result.embedding || !result.embedding.values) {
      throw new Error('No embedding returned from Gemini');
    }

    return result.embedding.values;
  } catch (error) {
    console.error('Error embedding text:', error);
    throw error;
  }
};

/**
 * Embed all chunks and save to kb.json
 */
export const embedChunks = async (chunks: ChunkedArticle[]): Promise<EmbeddedChunk[]> => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not set');
  }

  const client = new GoogleGenerativeAI(apiKey);
  const embeddedChunks: EmbeddedChunk[] = [];

  console.log(`Embedding ${chunks.length} chunks...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (i % 10 === 0) {
      console.log(`Progress: ${i}/${chunks.length}`);
    }

    try {
      const embedding = await embedText(chunk.text, client);
      embeddedChunks.push({
        id: chunk.id,
        norm: chunk.norm,
        title: chunk.title,
        book: chunk.book,
        article: chunk.article,
        num: chunk.num,
        text: chunk.text,
        chunkIndex: chunk.chunkIndex,
        totalChunks: chunk.totalChunks,
        embedding,
      });

      // Rate limiting: small delay between API calls
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.warn(`Failed to embed chunk ${chunk.id}:`, error);
      // Continue with next chunk on error
    }
  }

  console.log(`Successfully embedded ${embeddedChunks.length} chunks`);
  return embeddedChunks;
};

/**
 * Save embedded chunks to kb.json file
 */
export const saveEmbeddingsToFile = async (
  embeddedChunks: EmbeddedChunk[],
  outputPath: string
): Promise<void> => {
  const dir = path.dirname(outputPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(embeddedChunks, null, 2), 'utf-8');
  console.log(`Saved ${embeddedChunks.length} embeddings to ${outputPath}`);
};

/**
 * Load embeddings from kb.json file
 */
export const loadEmbeddingsFromFile = (kbPath: string): EmbeddedChunk[] => {
  if (!fs.existsSync(kbPath)) {
    console.warn(`KB file not found: ${kbPath}`);
    return [];
  }

  const content = fs.readFileSync(kbPath, 'utf-8');
  return JSON.parse(content) as EmbeddedChunk[];
};
