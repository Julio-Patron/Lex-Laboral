import React from 'react';
import { ShieldAlert, ExternalLink } from 'lucide-react';

interface GovernmentDisclaimerBannerProps {
  onOpenSources: () => void;
  className?: string;
  compact?: boolean;
}

export const GovernmentDisclaimerBanner: React.FC<GovernmentDisclaimerBannerProps> = ({
  onOpenSources,
  className = '',
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-amber-950 ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert size={14} className="shrink-0 text-amber-700" aria-hidden="true" />
          <span className="truncate text-xs font-medium text-amber-900">
            No oficial · Herramienta privada no afiliada al IMSS ni al Gobierno de México
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenSources}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-amber-950 underline hover:text-amber-800"
        >
          <span>Fuentes</span>
          <ExternalLink size={11} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Aviso de deslinde y no representación gubernamental"
      className={`rounded-2xl border border-amber-300/80 bg-amber-50/95 p-4 text-amber-950 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-200/90 text-amber-900">
          <ShieldAlert size={18} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-950">
              Iniciativa Privada · No Oficial
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-amber-950">
            Esta calculadora es una herramienta independiente y no representa a ninguna entidad pública (IMSS, INFONAVIT ni Gobierno de México).
          </p>
          <p className="mt-0.5 text-xs text-amber-900/90 leading-relaxed">
            Los resultados son estimaciones informativas basadas en legislación pública. No constituyen resoluciones oficiales ni sustituyen la asesoría profesional.
          </p>
          <button
            type="button"
            onClick={onOpenSources}
            className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-amber-950 underline hover:text-amber-800"
          >
            Consultar fuentes oficiales gubernamentales (.gob.mx) y deslinde completo
            <ExternalLink size={12} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};
