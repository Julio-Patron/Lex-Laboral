import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CLIENT_FILES = [
  'components/Consultas.tsx',
  'components/Home.tsx',
  'lib/seo.ts',
  'App.tsx',
];

describe('Lex API MX key stays on the server', () => {
  it('never references LEX_API_MX_KEY or VITE_LEX_API in client files', () => {
    for (const file of CLIENT_FILES) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/VITE_LEX_API/);
      expect(source, file).not.toMatch(/LEX_API_MX_KEY/);
    }
  });
});
