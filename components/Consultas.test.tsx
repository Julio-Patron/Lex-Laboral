import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, Fragment, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Consultas } from './Consultas';

vi.mock('../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('framer-motion', () => {
  const passthrough = ({ children }: { children?: ReactNode }) =>
    createElement(Fragment, null, children);
  return {
    motion: new Proxy(
      {},
      {
        get: () => passthrough,
      }
    ),
  };
});

const lexapiBody = {
  mode: 'lexapi',
  count: 1,
  query: 'despido injustificado',
  results: [
    {
      score: 100,
      snippet: 'Son causas de rescisión de la relación de trabajo, sin responsabilidad para el patrón.',
      metadata: {
        norm: 'LFT',
        title: 'Ley Federal del Trabajo',
        article: '47',
        num: 47,
      },
      sourceUrl: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf',
      sourceName: 'Cámara de Diputados',
      validFrom: '1970-04-01',
      canonicalCitation: 'Artículo 47 LFT',
    },
  ],
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Consultas', () => {
  it('credits Lex API MX with a visible link', () => {
    render(<Consultas />);
    const credits = screen.getAllByRole('link', { name: 'Lex API MX' });
    expect(credits.length).toBeGreaterThan(0);
    expect(credits[0]).toHaveAttribute('href', 'https://lexapi.mx');
  });

  it('submits a case and shows the suggested foundation from Lex API MX', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => lexapiBody,
    } as Response);

    render(<Consultas />);

    await user.type(
      screen.getByLabelText(/describe el caso/i),
      'despido injustificado'
    );
    await user.click(screen.getByRole('button', { name: 'LFT' }));
    await user.click(screen.getByRole('button', { name: /fundamentar/i }));

    expect(await screen.findByText(/fundamento jurídico sugerido/i)).toBeInTheDocument();
    expect(screen.getAllByText(/art\.?\s*47/i).length).toBeGreaterThan(0);
    const sourceLinks = screen.getAllByRole('link', { name: /cámara de diputados/i });
    expect(sourceLinks.length).toBeGreaterThan(0);
    expect(sourceLinks[0]).toHaveAttribute(
      'href',
      'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf'
    );
    expect(screen.getAllByText(/1970-04-01/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/similitud/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copiar fundamento/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Lex API MX' }).length).toBeGreaterThan(0);

    expect(fetch).toHaveBeenCalledWith(
      '/api/search',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ query: 'despido injustificado', norm: 'LFT' }),
      })
    );
  });

  it('shows the Spanish service message on 503', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        message: 'El servicio de consulta normativa no está disponible. Intenta más tarde.',
      }),
    } as Response);

    render(<Consultas />);
    await user.type(screen.getByLabelText(/describe el caso/i), 'aguinaldo');
    await user.click(screen.getByRole('button', { name: /fundamentar/i }));

    expect(
      await screen.findByText(/el servicio de consulta normativa no está disponible/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Search failed/i)).not.toBeInTheDocument();
  });
});
