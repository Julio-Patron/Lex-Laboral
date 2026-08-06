/**
 * Orchestrator for the ingestion pipeline
 * Runs: download → parse → chunk → embed
 */

import { downloadLegalArticles } from './download';
import { parseArticles } from './parser';
import { chunkArticles } from './chunk';
import { embedChunks, saveEmbeddingsToFile } from './embed';
import * as path from 'path';

const KB_OUTPUT_PATH = path.join(process.cwd(), 'data', 'lance', 'kb.json');

async function main() {
  try {
    console.log('Starting legal KB ingest pipeline...\n');

    // Step 1: Download/Get articles
    console.log('Step 1: Downloading legal articles...');
    const articles = await downloadLegalArticles();
    console.log(`✓ Downloaded ${articles.length} articles\n`);

    // Step 2: Parse articles
    console.log('Step 2: Parsing articles...');
    const parsedArticles = parseArticles(articles);
    console.log(`✓ Parsed ${parsedArticles.length} articles\n`);

    // Step 3: Chunk articles
    console.log('Step 3: Chunking articles...');
    const chunks = chunkArticles(parsedArticles, { chunkSize: 512, overlap: 64 });
    console.log(`✓ Created ${chunks.length} chunks\n`);

    // Step 4: Embed chunks
    console.log('Step 4: Embedding chunks with Gemini...');
    const embeddedChunks = await embedChunks(chunks);
    console.log(`✓ Embedded ${embeddedChunks.length} chunks\n`);

    // Step 5: Save to file
    console.log('Step 5: Saving embeddings to file...');
    await saveEmbeddingsToFile(embeddedChunks, KB_OUTPUT_PATH);
    console.log(`✓ Saved to ${KB_OUTPUT_PATH}\n`);

    console.log('✓ Ingest pipeline completed successfully!');
  } catch (error) {
    console.error('Ingest pipeline failed:', error);
    process.exit(1);
  }
}

main();
