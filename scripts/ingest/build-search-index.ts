/**
 * Builds a compact lexical search index for api/search.ts fallback mode.
 * It uses the same official PDFs and parser as the semantic ingest pipeline,
 * but does not call Gemini or create vector embeddings.
 */

import * as fs from 'fs';
import * as path from 'path';
import { downloadLegalArticles } from './download';
import { parseArticles, validateArticle } from './parser';

const OUTPUT_PATH = path.join(process.cwd(), 'data', 'search-index.json');

async function main() {
  const documents = await downloadLegalArticles();
  const articles = await parseArticles(documents);

  const rows = articles
    .filter(validateArticle)
    .map((article) => ({
      id: article.id,
      norm: article.norm,
      title: article.title,
      book: article.book,
      article: article.article,
      num: article.num,
      text: article.text.replace(/\s+/g, ' ').trim(),
    }));

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        version: 1,
        count: rows.length,
        rows,
      },
      null,
      0
    ),
    'utf-8'
  );

  console.log(`Wrote ${rows.length} articles to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error('Failed to build search index:', error);
  process.exit(1);
});
