/**
 * Download utilities for fetching official Mexican legal sources
 * Downloads PDFs from diputados.gob.mx and extracts raw text with pdf-parse
 */

import * as fs from 'fs';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';

export type NormCode = 'LFT' | 'LSS' | 'R_LSS' | 'INFONAVIT' | 'R_INFONAVIT';

export interface LegalDocument {
  norm: NormCode;
  book: string;
  rawText: string;
}

export interface LegalSource {
  norm: NormCode;
  book: string;
  url: string;
  file: string;
}

/**
 * Official sources from Cámara de Diputados (diputados.gob.mx)
 */
export const LEGAL_SOURCES: LegalSource[] = [
  {
    norm: 'LFT',
    book: 'Ley Federal del Trabajo',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf',
    file: 'LFT.pdf',
  },
  {
    norm: 'LSS',
    book: 'Ley del Seguro Social',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LSS.pdf',
    file: 'LSS.pdf',
  },
  {
    norm: 'INFONAVIT',
    book: 'Ley del INFONAVIT',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LIFNVT.pdf',
    file: 'LIFNVT.pdf',
  },
  {
    norm: 'R_LSS',
    book: 'Reglamento de la Ley del Seguro Social en materia de Afiliación',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LSS_MACERF.pdf',
    file: 'Reg_LSS_MACERF.pdf',
  },
  {
    norm: 'R_INFONAVIT',
    book: 'Reglamento de Inscripción, Pago de Aportaciones y Entero de Descuentos al INFONAVIT',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/regla/n327.pdf',
    file: 'Reg_INFONAVIT_n327.pdf',
  },
];

const SOURCES_DIR = path.join(process.cwd(), 'data', 'sources');

/**
 * Ensure the PDF for a source is downloaded (cached in data/sources)
 */
const ensureDownloaded = async (source: LegalSource): Promise<string> => {
  if (!fs.existsSync(SOURCES_DIR)) {
    fs.mkdirSync(SOURCES_DIR, { recursive: true });
  }

  const target = path.join(SOURCES_DIR, source.file);

  if (fs.existsSync(target) && fs.statSync(target).size > 0) {
    return target;
  }

  console.log(`  Downloading ${source.norm} from ${source.url}...`);
  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(`Failed to download ${source.norm}: HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(target, buffer);
  console.log(`  Saved ${target} (${buffer.length} bytes)`);
  return target;
};

/**
 * Extract raw text from a PDF file
 */
const extractPdfText = async (filePath: string): Promise<string> => {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) });
  const result = await parser.getText();
  return trimReformDecrees(result.text);
};

/**
 * Cut the text at the first appended reform decree ("DECRETO por el que se
 * reforma..."). Official diputados PDFs append every historical reform decree
 * after the law body; those are noise for retrieval.
 */
const trimReformDecrees = (rawText: string): string => {
  const firstTransitorios = rawText.search(/TRANSITORIOS/);
  if (firstTransitorios === -1) return rawText;

  let cut = rawText.length;

  const feMatch = rawText
    .slice(firstTransitorios)
    .search(/En la p[áa]gina \d+, Primera Secci[óo]n/);
  if (feMatch !== -1) {
    cut = Math.min(cut, firstTransitorios + feMatch);
  }

  const reformMatch = rawText
    .slice(firstTransitorios)
    .search(/DECRETO por el que se reforma|DECRETO que reforma|DECRETO por el que se reforman|DECRETO que adiciona|DECRETO que deroga|Fe de erratas/i);
  if (reformMatch !== -1) {
    cut = Math.min(cut, firstTransitorios + reformMatch);
  }

  if (cut === rawText.length) return rawText;
  return rawText.slice(0, cut);
};

/**
 * Download all official documents and extract their raw text
 * Reuses cached PDFs when available
 */
export const downloadLegalArticles = async (): Promise<LegalDocument[]> => {
  console.log(`Downloading ${LEGAL_SOURCES.length} official documents...`);

  const documents: LegalDocument[] = [];

  for (const source of LEGAL_SOURCES) {
    try {
      const pdfPath = await ensureDownloaded(source);
      const rawText = await extractPdfText(pdfPath);
      documents.push({
        norm: source.norm,
        book: source.book,
        rawText,
      });
      console.log(`✓ ${source.norm}: ${rawText.length.toLocaleString()} chars extracted`);
    } catch (error) {
      console.error(`Failed to process ${source.norm}:`, error);
    }
  }

  return documents;
};
