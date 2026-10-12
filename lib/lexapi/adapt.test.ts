import { describe, expect, it } from 'vitest';
import { adaptArticle } from './adapt';
import type { LexApiArticle } from './types';

const lftArticle: LexApiArticle = {
  id: 'art-47',
  norma: 'Ley Federal del Trabajo',
  norma_slug: 'lft',
  label: 'Artículo 47',
  text: 'Son causas de rescisión de la relación de trabajo, sin responsabilidad para el patrón: '.repeat(8),
  valid_from: '1970-04-01',
  valid_to: null,
  source: 'Cámara de Diputados',
  source_url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf',
  is_official: true,
  checksum: 'abc123checksum',
  canonical_citation: 'Artículo 47 LFT',
};

describe('adaptArticle', () => {
  it('maps an LFT article to a Consultas SearchResult', () => {
    const result = adaptArticle(lftArticle, 0);

    expect(result.metadata.norm).toBe('LFT');
    expect(result.metadata.title).toBe('Ley Federal del Trabajo');
    expect(result.metadata.article).toBe('47');
    expect(result.metadata.num).toBe(47);
    expect(result.sourceUrl).toBe(lftArticle.source_url);
    expect(result.sourceName).toBe('Cámara de Diputados');
    expect(result.validFrom).toBe('1970-04-01');
    expect(result.checksum).toBe('abc123checksum');
    expect(result.canonicalCitation).toBe('Artículo 47 LFT');
    expect(result.score).toBe(100);
    expect(result.snippet.length).toBeLessThanOrEqual(240);
  });

  it('ranks later hits with a lower display score', () => {
    expect(adaptArticle(lftArticle, 1).score).toBe(90);
    expect(adaptArticle(lftArticle, 9).score).toBe(10);
  });
});
