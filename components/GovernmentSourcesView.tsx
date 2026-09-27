import { ArrowLeft, BookOpen, Building2, ExternalLink, Landmark, ShieldAlert } from 'lucide-react';
import React, { useState } from 'react';
import { GOVERNMENT_SOURCES, GovernmentSource, OFFICIAL_DISCLAIMER } from '../lib/legal-sources';
import { AppView } from '../types';

interface GovernmentSourcesViewProps {
  onBack: () => void;
  onNavigate?: (view: AppView) => void;
}

export const GovernmentSourcesView: React.FC<GovernmentSourcesViewProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todas las fuentes' },
    { id: 'labor', label: 'Laboral (LFT)' },
    { id: 'social_security', label: 'IMSS e INFONAVIT' },
    { id: 'pension', label: 'Pensiones' },
    { id: 'general', label: 'Salarios y UMA' },
  ];

  const filteredSources = selectedCategory === 'all'
    ? GOVERNMENT_SOURCES
    : GOVERNMENT_SOURCES.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-full bg-slate-50 pb-20 text-slate-900">
      {/* Top Breadcrumb / Navigation Bar */}
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span>Volver al Inicio</span>
          </button>

          <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-900 border border-amber-200">
            Transparencia y Legalidad
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 space-y-8">
        {/* Title Header */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
            Marco Normativo y Transparencia
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Fuentes Oficiales y Deslinde Gubernamental
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
            Lex Laboral es un desarrollo privado con fines didácticos e informativos. Consulta el deslinde de responsabilidad y los accesos a los portales oficiales del Gobierno de México.
          </p>
        </div>

        {/* Prominent Government Non-Affiliation Disclaimer Box */}
        <section
          aria-label="Aviso de No Afiliación Gubernamental"
          className="rounded-3xl border-2 border-amber-300 bg-amber-50/90 p-6 sm:p-8 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md">
              <ShieldAlert size={28} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-200 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-950">
                  Aviso Legal Obligatorio
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Iniciativa Privada e Independiente
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-amber-950">
                {OFFICIAL_DISCLAIMER.title}
              </h2>
              <p className="text-sm leading-relaxed text-amber-900">
                {OFFICIAL_DISCLAIMER.full}
              </p>
            </div>
          </div>
        </section>

        {/* Public Normative Foundation Info Card */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-slate-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-amber-400">
              <BookOpen size={18} />
            </div>
            <h3 className="text-base sm:text-lg font-bold">
              Base Jurídica Federal Abierta
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Las fórmulas, tablas de prestaciones, cuotas patronales y esquemas de retiro aplicados en esta plataforma provienen de leyes y tabuladores federales aprobados por el H. Congreso de la Unión y publicados en el Diario Oficial de la Federación (DOF).
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            A continuación se ofrecen los enlaces directos a los portales gubernamentales oficiales (dominios <strong>.gob.mx</strong>) donde cualquier persona puede verificar los textos de ley vigentes:
          </p>
        </section>

        {/* Categories Filter */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Filtrar fuentes por ámbito legal:
          </p>
          <div className="flex flex-wrap gap-2" role="tablist">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-amber-400 shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sources Cards Grid */}
        <section aria-label="Lista de fuentes oficiales gubernamentales" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSources.map((source: GovernmentSource) => (
            <article
              key={source.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-amber-500/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Building2 size={14} className="shrink-0 text-slate-400" />
                  <span className="truncate">{source.institution}</span>
                </div>
                <h4 className="mt-2 text-base font-bold text-slate-900 leading-snug">
                  {source.name}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {source.description}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-11 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 transition-colors hover:border-amber-500/50 hover:bg-amber-500/10"
                >
                  <span className="truncate pr-2 font-mono text-[11px] text-slate-600 group-hover:text-slate-900">
                    {source.url}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-amber-600 font-sans font-bold">
                    <span>Abrir</span>
                    <ExternalLink size={13} aria-hidden="true" />
                  </span>
                </a>
              </div>
            </article>
          ))}
        </section>

        {/* Guidance on Official Procedures */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-slate-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-amber-400">
              <Landmark size={18} />
            </div>
            <h3 className="text-base sm:text-lg font-bold">
              ¿Dónde realizar trámites legales y oficiales?
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Los cálculos generados en Lex Laboral tienen carácter meramente orientativo. Si requieres emitir o formalizar un trámite, debes acudir a los canales oficiales del Estado Mexicano:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-1.5">
              <p className="text-xs font-bold text-slate-900">Pensión y Semanas IMSS</p>
              <p className="text-xs text-slate-600">Solicita tu reporte oficial de semanas cotizadas o inicia tu trámite en tu subdelegación IMSS.</p>
              <a href="https://www.imss.gob.mx/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 underline pt-1">
                imss.gob.mx <ExternalLink size={10} />
              </a>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-1.5">
              <p className="text-xs font-bold text-slate-900">Subcuenta INFONAVIT</p>
              <p className="text-xs text-slate-600">Revisa tu puntuación, aportaciones patronales y crédito en el portal oficial Mi Cuenta Infonavit.</p>
              <a href="https://portalmx.infonavit.org.mx/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 underline pt-1">
                infonavit.org.mx <ExternalLink size={10} />
              </a>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-1.5">
              <p className="text-xs font-bold text-slate-900">Conciliación Laboral</p>
              <p className="text-xs text-slate-600">Para despidos injustificados o reclamos de finiquito, acude al Centro Federal o Local de Conciliación.</p>
              <a href="https://www.gob.mx/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 underline pt-1">
                gob.mx <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
