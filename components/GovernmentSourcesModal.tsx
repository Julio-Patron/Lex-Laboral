import { Building2, ExternalLink, ShieldAlert, X } from 'lucide-react';
import React, { useState } from 'react';
import { GOVERNMENT_SOURCES, GovernmentSource, OFFICIAL_DISCLAIMER } from '../lib/legal-sources';

interface GovernmentSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryFilter?: 'labor' | 'social_security' | 'pension';
}

export const GovernmentSourcesModal: React.FC<GovernmentSourcesModalProps> = ({
  isOpen,
  onClose,
  categoryFilter,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'filtered'>(categoryFilter ? 'filtered' : 'all');

  if (!isOpen) return null;

  const displayedSources = (activeTab === 'filtered' && categoryFilter)
    ? GOVERNMENT_SOURCES.filter(s => s.category === categoryFilter || s.category === 'general')
    : GOVERNMENT_SOURCES;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-sources-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 id="modal-sources-title" className="text-sm font-bold text-amber-400">
                Fuentes Oficiales y Deslinde
              </h2>
              <p className="text-[11px] text-slate-400">
                Herramienta independiente no gubernamental
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 active:scale-95"
            aria-label="Cerrar ventana"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-slate-800 text-xs">
          {/* Disclaimer Box */}
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-900">
              {OFFICIAL_DISCLAIMER.badge}
            </span>
            <p className="mt-2 text-xs font-semibold text-amber-950">
              Lex Laboral es un desarrollo privado e independiente.
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-900">
              {OFFICIAL_DISCLAIMER.full}
            </p>
          </div>

          {/* Filter options if category is provided */}
          {categoryFilter && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('filtered')}
                className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition-colors ${
                  activeTab === 'filtered'
                    ? 'bg-slate-900 text-amber-400'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Fuentes de esta herramienta
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition-colors ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-amber-400'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas las fuentes (.gob.mx)
              </button>
            </div>
          )}

          {/* Sources list */}
          <div className="space-y-2.5">
            <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
              Leyes y portales oficiales del Gobierno de México:
            </p>
            {displayedSources.map((source: GovernmentSource) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 transition-colors hover:border-amber-400 hover:bg-amber-50/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-900 text-xs group-hover:text-amber-700">
                    {source.name}
                  </span>
                  <ExternalLink size={13} className="shrink-0 text-slate-400 group-hover:text-amber-600" />
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Building2 size={12} className="shrink-0" />
                  <span className="truncate">{source.institution}</span>
                </div>
                <span className="mt-1.5 font-mono text-[10px] text-amber-800 underline truncate">
                  {source.url}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-5 text-xs font-bold text-amber-400 hover:bg-slate-800 active:scale-95"
          >
            Entendido y cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
