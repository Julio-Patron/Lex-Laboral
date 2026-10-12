import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, Fragment, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LaborCalculator } from './LaborCalculator';

vi.mock('../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('framer-motion', () => {
  const passthrough = ({ children }: { children?: ReactNode }) =>
    createElement(Fragment, null, children);
  return {
    motion: new Proxy({}, { get: () => passthrough }),
    AnimatePresence: passthrough,
  };
});

describe('LaborCalculator interaction flow', () => {
  it('calculates the example case and shows a total with desglose', async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    render(<LaborCalculator notify={notify} />);

    await user.click(screen.getByRole('button', { name: /ejemplo/i }));

    expect(notify).toHaveBeenCalledWith('Ejemplo calculado para liquidación', 'success');
    expect(screen.getAllByText(/total estimado/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/despido injustificado/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/aguinaldo/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/prima vacacional/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /despido injustificado/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /editar datos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /términos y condiciones/i })).toHaveAttribute('href', '/terminos');
  });

  it('warns when calculating with empty salary', async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    render(<LaborCalculator notify={notify} />);

    await user.click(screen.getByRole('button', { name: /calcular pago estimado/i }));

    expect(notify).toHaveBeenCalledWith(
      'Complete los campos obligatorios para generar el cálculo',
      'warning'
    );
    expect(screen.getByText(/captura sueldo/i)).toBeInTheDocument();
  });
});
