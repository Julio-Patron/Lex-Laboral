import LZString from 'lz-string';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const mockScenario = {
  salary: 15000,
  salaryPeriod: 'monthly',
  startDate: '2023-01-01',
  endDate: '2024-01-01',
  dismissalType: 'unjustified',
  hasVacation: true,
  pendingVacationDays: 5,
  hasAguinaldo: true,
  vacationPremium: 25,
  aguinaldoDays: 15
};

describe('Link Generator (lz-string algorithm)', () => {
  it('should perfectly compress and decompress a complex scenario state', () => {
    const payload = JSON.stringify(mockScenario);
    
    // Compress
    const encoded = LZString.compressToEncodedURIComponent(payload);
    
    // Decompress
    const decoded = LZString.decompressFromEncodedURIComponent(encoded);
    
    expect(decoded).toBeDefined();
    if (decoded) {
      const parsedScenario = JSON.parse(decoded);
      expect(parsedScenario).toEqual(mockScenario);
    }
  });

  it('should return null for corrupted or invalid encoded strings', () => {
    const invalidEncoded = 'this-is-not-valid-lz-string-data!';
    const decoded = LZString.decompressFromEncodedURIComponent(invalidEncoded);
    expect(decoded).toBeNull();
  });
});

describe('Link Shortener Fallback (Redis → lz-string)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Limpiar mocks antes de cada test
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Restaurar fetch original
    globalThis.fetch = originalFetch;
  });

  it('should fall back to lz-string compression when the server returns an error', async () => {
    // Simular que el servidor Redis/API devuelve un error 500
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Redis no configurado' }),
    });

    const payload = JSON.stringify(mockScenario);
    let shareUrl = '';

    try {
      const response = await fetch('/api/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: payload }),
      });

      if (response.ok) {
        const { hash } = await response.json();
        shareUrl = `https://lexlaboral.com.mx/?s=${hash}`;
      } else {
        throw new Error('Fallback to local compression');
      }
    } catch {
      // Fallback: comprimir con lz-string directamente en la URL
      const encoded = LZString.compressToEncodedURIComponent(payload);
      shareUrl = `https://lexlaboral.com.mx/?scenario=${encoded}`;
    }

    // Verificar que el fallback generó una URL válida con el parámetro scenario
    expect(shareUrl).toContain('?scenario=');
    expect(shareUrl).not.toContain('?s=');

    // Verificar que los datos se pueden recuperar desde la URL
    const urlParams = new URLSearchParams(shareUrl.split('?')[1]);
    const scenarioParam = urlParams.get('scenario');
    expect(scenarioParam).toBeTruthy();
    const decompressed = LZString.decompressFromEncodedURIComponent(scenarioParam!);
    expect(JSON.parse(decompressed!)).toEqual(mockScenario);
  });

  it('should fall back to lz-string compression when fetch throws a network error', async () => {
    // Simular error de red (sin internet, DNS falla, etc.)
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const payload = JSON.stringify(mockScenario);
    let shareUrl = '';

    try {
      const response = await fetch('/api/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: payload }),
      });

      if (response.ok) {
        const { hash } = await response.json();
        shareUrl = `https://lexlaboral.com.mx/?s=${hash}`;
      } else {
        throw new Error('Fallback to local compression');
      }
    } catch {
      const encoded = LZString.compressToEncodedURIComponent(payload);
      shareUrl = `https://lexlaboral.com.mx/?scenario=${encoded}`;
    }

    // Verificar que incluso sin red, el enlace se genera correctamente
    expect(shareUrl).toContain('?scenario=');
    const urlParams = new URLSearchParams(shareUrl.split('?')[1]);
    const scenarioParam = urlParams.get('scenario');
    const decompressed = LZString.decompressFromEncodedURIComponent(scenarioParam!);
    expect(JSON.parse(decompressed!)).toEqual(mockScenario);
  });

  it('should use the short URL when the server responds successfully', async () => {
    // Simular respuesta exitosa del servidor
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ hash: 'abc123' }),
    });

    const payload = JSON.stringify(mockScenario);
    let shareUrl = '';

    try {
      const response = await fetch('/api/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: payload }),
      });

      if (response.ok) {
        const { hash } = await response.json();
        shareUrl = `https://lexlaboral.com.mx/?s=${hash}`;
      } else {
        throw new Error('Fallback to local compression');
      }
    } catch {
      const encoded = LZString.compressToEncodedURIComponent(payload);
      shareUrl = `https://lexlaboral.com.mx/?scenario=${encoded}`;
    }

    // Verificar que se usó el shortener, no el fallback
    expect(shareUrl).toBe('https://lexlaboral.com.mx/?s=abc123');
    expect(shareUrl).not.toContain('?scenario=');
  });
});
