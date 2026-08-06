/**
 * Orchestrator for the ingestion pipeline
 * Runs: download → parse → chunk → embed → save LanceDB dataset
 */

import { downloadLegalArticles } from './download';
import { parseArticles } from './parser';
import { chunkArticles } from './chunk';
import { embedChunks, saveEmbeddingsToLance } from './embed';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars from backend/.env when running locally
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
dotenv.config();

const LANCE_DIR = path.join(process.cwd(), 'data', 'lance');
const LANCE_TABLE = 'kb';

async function main() {
  try {
    console.log('Starting legal KB ingest pipeline...\n');

    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY not set (backend/.env)'
      );
    }
    const client = new GoogleGenerativeAI(apiKey);

    // Step 1: Download official PDFs and extract text
    console.log('Step 1: Downloading legal documents...');
    const documents = await downloadLegalArticles();
    console.log(`✓ Got ${documents.length} documents\n`);

    // Step 2: Parse into articles
    console.log('Step 2: Parsing articles...');
    const articles = await parseArticles(documents);
    console.log(`✓ Parsed ${articles.length} articles\n`);

    // Step 3: Chunk articles
    console.log('Step 3: Chunking articles...');
    const chunks = chunkArticles(articles, { chunkSize: 512, overlap: 64 });
    console.log(`✓ Created ${chunks.length} chunks\n`);

    // Step 4: Embed chunks with Gemini
    console.log('Step 4: Embedding chunks with Gemini...');
    const embeddedChunks = await embedChunks(chunks, client);
    console.log(`✓ Embedded ${embeddedChunks.length} chunks\n`);

    // Step 5: Save LanceDB dataset (committed for read-only use in api/search.ts)
    console.log('Step 5: Saving LanceDB dataset...');
    await saveEmbeddingsToLance(embeddedChunks, {
      dbDir: LANCE_DIR,
      tableName: LANCE_TABLE,
      distanceType: 'cosine',
    });
    console.log(`✓ Dataset saved to ${LANCE_DIR}\n`);

    console.log('✓ Ingest pipeline completed successfully!');
  } catch (error) {
    console.error('Ingest pipeline failed:', error);
    process.exit(1);
  }
}

main();
