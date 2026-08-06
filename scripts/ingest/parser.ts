/**
 * Parser for official Mexican legal texts into structured articles
 * Handles TITULO/CAPITULO sections and "Artículo N.-" / "Artículo N." /
 * "ARTÍCULO N." heading variants from diputados.gob.mx PDFs
 */

import type { LegalDocument, NormCode } from './download';

export interface ParsedArticle {
  id: string;
  norm: NormCode;
  title: string;
  book?: string;
  article: string;
  num: number;
  text: string;
}

export interface LegalArticle {
  norm: NormCode;
  title: string;
  book?: string;
  article: string;
  num: number;
  text: string;
}

/**
 * Document-level noise lines (page headers, footers, DOF legends)
 */
const DOC_NOISE_RE: RegExp[] = [
  /^C[ÁA]mara de Diputados del H\. Congreso de la Uni[óo]n/i,
  /^Secretar[ií]a General$/i,
  /^Secretar[ií]a de Servicios Parlamentarios$/i,
  /^[UÚ]ltima Reforma DOF/i,
  /^[UÚ]ltima reforma publicada DOF/i,
  /^Nueva Ley publicada en el Diario Oficial/i,
  /^Nuevo Reglamento publicad[oa] en el Diario Oficial/i,
  /^TEXTO VIGENTE$/i,
  /^Al margen un sello con el Escudo Nacional/i,
  /^[A-Z0-9ÁÉÍÓÚÑ]{3,}.*DIARIO OFICIAL/i,
  /^\s*\d{1,4}\s+de\s+\d{1,4}\s*$/i, // page numbers "1 de 457"
  /^Ley Federal del Trabajo$/i,
  /^Ley del Seguro Social$/i,
  /^Ley del Instituto del Fondo Nacional de la Vivienda/i,
  /^Diario Oficial/i,
  /^--\s*\d+\s+(?:de|of)\s+\d+\s*--$/i, // "-- 30 of 93 --"
];

/**
 * Inline annotation notes inside articles (omitted from body text)
 */
const REFORM_NOTE_RE = /^\s*(Art[ií]culo|P[áa]rrafo|Fracci[óo]n|Inciso|Reformas|Fe de erratas)\s+(reformado|adicionado|derogado|recorrido|DOF)/i;

/**
 * Section heading: TITULO / CAPITULO followed by PRIMERO|SEGUNDO|...|I|
 * Matches only fully-uppercase keywords (no case-insensitive flag to
 * avoid matching body references like "título particular")
 */
const SECTION_HEADING_RE =
  /^(TITULO|TÍTULO|CAPITULO|CAPÍTULO)\s+([A-ZÁÉÍÓÚÑ0-9]{2,})/;

/**
 * Article heading at start of a line:
 *   "Artículo 1.-", "Artículo 1o.-", "Artículo 47 Bis.-", "ARTÍCULO 1."
 * Case-sensitive on purpose: body references are lowercase "artículo"
 */
const ARTICLE_HEADING_RE =
  /^(Artículo|ARTÍCULO|ARTICULO)\s+(\d{1,4}(?:[oº])?(?:\s*(?:Bis|Del|Ter|Quater|Quinquies|Transitorio))?)\s*[.\-–:]\s*/;

const ROMANS: Record<string, string> = {
  PRIMERO: '1',
  SEGUNDO: '2',
  TERCERO: '3',
  CUARTO: '4',
  QUINTO: '5',
  SEXTO: '6',
  SÉPTIMO: '7',
  SEPTIMO: '7',
  OCTAVO: '8',
  NOVENO: '9',
  DÉCIMO: '10',
  DECIMO: '10',
  I: '1',
  II: '2',
  III: '3',
  IV: '4',
  V: '5',
  VI: '6',
  VII: '7',
  VIII: '8',
  IX: '9',
  X: '10',
  XI: '11',
  XII: '12',
  XIII: '13',
  XIV: '14',
  XV: '15',
  XVI: '16',
  XVII: '17',
  XVIII: '18',
  XIX: '19',
  XX: '20',
  XXI: '21',
  XXII: '22',
};

/**
 * True if line is document header/footer noise
 */
const isNoiseLine = (line: string): boolean => {
  const t = line.trim();
  if (!t) return true;
  return DOC_NOISE_RE.some(re => re.test(t));
};

/**
 * Normalize whitespace and strip inline annotation notes
 */
const cleanArticleText = (text: string): string => {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !REFORM_NOTE_RE.test(l));
  return lines.join(' ').replace(/\s{2,}/g, ' ').trim();
};

/**
 * Parse a single legal document into structured articles
 */
export const parseLegalText = (doc: LegalDocument): ParsedArticle[] => {
  const lines = doc.rawText.split('\n').map(l => l.trim());
  const articles: ParsedArticle[] = [];

  let currentSection = '';
  let currentArticle: {
    header: string;
    num: number;
    body: string[];
  } | null = null;

  const flush = () => {
    if (!currentArticle) return;
    const text = cleanArticleText(currentArticle.body.join('\n'));
    if (text.length > 0) {
      articles.push({
        id: '',
        norm: doc.norm,
        title: currentSection || doc.book,
        book: doc.book,
        article: currentArticle.header,
        num: currentArticle.num,
        text,
      });
    }
    currentArticle = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (isNoiseLine(line)) continue;

    const sectionMatch = line.match(SECTION_HEADING_RE);
    if (sectionMatch) {
      flush();
      const type = sectionMatch[1];
      const numRaw = sectionMatch[2];
      const numLabel = ROMANS[numRaw.toUpperCase()] ?? numRaw;
      const sectionBase = `${doc.book} • ${type} ${numLabel}`;

      // Next line is often the section name (e.g. "Principios Generales")
      const nextLine = lines[i + 1];
      const nextIsArticle = nextLine && nextLine.match(ARTICLE_HEADING_RE);
      const nextIsSection = nextLine && nextLine.match(SECTION_HEADING_RE);
      const nextHasPeriod = nextLine && nextLine.includes('.');
      if (
        nextLine &&
        !nextIsArticle &&
        !nextIsSection &&
        !nextHasPeriod &&
        nextLine.length < 80
      ) {
        currentSection = `${sectionBase} — ${nextLine}`;
        i++; // consume the name line
      } else {
        currentSection = sectionBase;
      }
      continue;
    }

    const articleMatch = line.match(ARTICLE_HEADING_RE);
    if (articleMatch) {
      flush();
      const header = articleMatch[2].trim().replace(/\s+/g, ' ');
      currentArticle = {
        header,
        num: parseInt(articleMatch[2].match(/\d+/)?.[0] ?? '0', 10),
        body: [line.slice(articleMatch[0].length)],
      };
      continue;
    }

    if (currentArticle) {
      currentArticle.body.push(line);
    }
  }

  flush();

  return articles.map((article, idx) => ({
    ...article,
    id: `${doc.norm}_${idx}_${article.num}`,
  }));
};

/**
 * Parse a batch of legal documents into articles
 */
export const parseArticles = async (
  documents: LegalDocument[],
): Promise<ParsedArticle[]> => {
  const all: ParsedArticle[] = [];
  for (const doc of documents) {
    try {
      const parsed = parseLegalText(doc);
      console.log(`✓ ${doc.norm}: ${parsed.length} articles`);
      all.push(...parsed);
    } catch (error) {
      console.error(`Failed to parse ${doc.norm}:`, error);
    }
  }
  return all;
};

export const validateArticle = (article: LegalArticle): boolean => {
  return !!(
    article.norm &&
    article.title &&
    article.article &&
    typeof article.num === 'number' &&
    article.text &&
    article.text.length > 0
  );
};