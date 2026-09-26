/**
 * Fundamentador jurídico - semantic legal query component
 * Search, retrieve and organize articles from Mexican labor laws
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AlertCircle, Search, TrendingUp, X, Copy, Check, Scale } from 'lucide-react';
import { WorkspacePage, WorkspaceHeader, WorkspacePanel, WorkspaceEmpty } from './ui/Workspace';

type NormFilter = 'LFT' | 'IMSS' | 'INFONAVIT' | 'all';

interface SearchResult {
  score: number;
  snippet: string;
  metadata: {
    norm: string;
    title: string;
    article: string;
    book?: string;
    num: number;
  };
}

interface SearchResponse {
  results: SearchResult[];
  query?: string;
  norm?: string;
  count: number;
  mode?: 'semantic' | 'local';
  warning?: string;
}

const getNormLabel = (norm: string): string => {
  switch (norm) {
    case 'LFT':
      return 'Ley Federal del Trabajo';
    case 'LSS':
    case 'R_LSS':
      return 'Ley del Seguro Social';
    case 'INFONAVIT':
    case 'R_INFONAVIT':
      return 'Ley del INFONAVIT';
    default:
      return norm;
  }
};

const getShortNormLabel = (norm: string): string => {
  switch (norm) {
    case 'R_LSS':
      return 'Reglamento IMSS';
    case 'R_INFONAVIT':
      return 'Reglamento INFONAVIT';
    default:
      return norm;
  }
};

const formatArticleReference = (result: SearchResult): string =>
  `${getNormLabel(result.metadata.norm)}, art. ${result.metadata.article}`;

const buildFoundationText = (sourceQuery: string, foundationResults: SearchResult[]): string => {
  const references = foundationResults
    .map((result, index) => {
      const title = result.metadata.title ? ` (${result.metadata.title})` : '';
      return `${index + 1}. ${formatArticleReference(result)}${title}: ${result.snippet}`;
    })
    .join('\n');

  return `Consulta: ${sourceQuery.trim()}\n\nFundamento jurídico sugerido:\n${references}\n\nNota: revisar el expediente, la estrategia del caso y el texto legal aplicable antes de presentar este fundamento.`;
};

export const Consultas: React.FC = () => {
  const [query, setQuery] = useState('');
  const [resolvedQuery, setResolvedQuery] = useState('');
  const [selectedNorm, setSelectedNorm] = useState<NormFilter>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'semantic' | 'local' | null>(null);
  const [copiedFoundation, setCopiedFoundation] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Map UI norm filter to API norm parameter
   */
  const getNormParam = (norm: NormFilter): string => {
    switch (norm) {
      case 'IMSS':
        return 'LSS';
      case 'INFONAVIT':
        return 'INFONAVIT';
      case 'all':
        return 'all';
      case 'LFT':
      default:
        return norm;
    }
  };

  /**
   * Perform search via API
   */
  const performSearch = useCallback(async (searchQuery: string, norm: NormFilter) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearched(false);
      setError(null);
      setSearchMode(null);
      setResolvedQuery('');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          norm: getNormParam(norm),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || `Search failed: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      setResults(data.results || []);
      setSearchMode(data.mode || 'semantic');
      setResolvedQuery(data.query || searchQuery);
      setCopiedFoundation(false);
    } catch (err) {
      console.error('Search error:', err);
      setError('No se pudo realizar la búsqueda. Revisa que el servicio esté desplegado e intenta nuevamente.');
      setResults([]);
      setSearchMode(null);
      setResolvedQuery('');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setSearchMode(null);
    setResolvedQuery('');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    performSearch(query, selectedNorm);
  };

  const foundationResults = results.slice(0, 3);
  const foundationText = foundationResults.length > 0
    ? buildFoundationText(resolvedQuery || query, foundationResults)
    : '';

  const handleCopyFoundation = async () => {
    if (!foundationText) return;

    try {
      await navigator.clipboard.writeText(foundationText);
      setCopiedFoundation(true);
      window.setTimeout(() => setCopiedFoundation(false), 1800);
    } catch (copyError) {
      console.error('Copy foundation error:', copyError);
    }
  };

  /**
   * Get badge color for norm
   */
  const getNormBadgeColor = (norm: string): string => {
    switch (norm) {
      case 'LFT':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'LSS':
      case 'R_LSS':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'INFONAVIT':
      case 'R_INFONAVIT':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        eyebrow="Fundamentador Jurídico"
        title="Fundamentador jurídico laboral"
        description="Describe el caso y obtén artículos relevantes de la LFT, Seguro Social e INFONAVIT organizados como fundamento sugerido."
        icon={<Scale size={24} className="text-legal-gold" />}
      />

      {/* Search Panel */}
      <WorkspacePanel className="mb-6 p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Search Input */}
          <div className="space-y-3">
            <label htmlFor="legal-search-query" className="ui-label px-0">
              Describe el caso o duda a fundamentar
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-4 text-slate-500" size={20} />
              <textarea
                id="legal-search-query"
                placeholder="Ejemplo: trabajador despedido por faltas injustificadas, cálculo de aguinaldo o aportaciones IMSS/INFONAVIT pendientes."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ui-input min-h-[132px] resize-y py-4 pl-12 pr-12 text-base leading-7"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Limpiar consulta"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <p className="text-xs leading-5 text-slate-500">
              Puedes escribir hechos breves, una pregunta completa o palabras clave. El sistema busca artículos y arma una base de fundamento.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Norm Filter */}
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="w-full text-xs font-bold uppercase tracking-[0.14em] text-slate-500 sm:w-auto">Filtrar</span>
              {(['all', 'LFT', 'IMSS', 'INFONAVIT'] as const).map((norm) => (
                <button
                  key={norm}
                  type="button"
                  onClick={() => setSelectedNorm(norm)}
                  className={`min-w-0 rounded-lg px-3 py-2 text-xs font-bold transition-all sm:px-4 ${
                    selectedNorm === norm
                      ? 'bg-slate-950 text-legal-gold shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {norm === 'all' ? 'Todas' : norm}
                </button>
              ))}
            </div>
            <button type="submit" className="ui-primary-action w-full sm:w-auto sm:px-6">
              <Search size={18} />
              <span>Fundamentar</span>
            </button>
          </div>
        </form>
      </WorkspacePanel>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-legal-gold/20 border-t-legal-gold rounded-full animate-spin"></div>
            <span className="text-sm text-slate-500 font-medium">Buscando artículos...</span>
          </div>
        </div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <WorkspaceEmpty
          icon={<TrendingUp size={32} className="text-slate-300" />}
          title="Sin resultados"
          description="No encontramos artículos relevantes para tu búsqueda. Intenta con otros términos."
        />
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-legal-gold" />
              <span className="text-sm font-semibold text-slate-600">
                {results.length} resultado{results.length !== 1 ? 's' : ''}
              </span>
            </div>
            {searchMode && (
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${
                searchMode === 'semantic'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {searchMode === 'semantic' ? 'Semántico activo' : 'Índice jurídico activo'}
              </span>
            )}
          </div>

          {searchMode === 'local' && (
            <div className="rounded-lg border border-slate-200 bg-white/80 p-4 text-sm leading-6 text-slate-600">
              Se muestran coincidencias del índice jurídico local mientras el índice semántico no esté habilitado en este entorno.
            </div>
          )}

          <WorkspacePanel className="border-slate-900/10 bg-white/95 p-5 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.55)] sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-legal-gold">
                    <Scale size={18} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="break-words font-serif text-xl font-bold text-slate-950">
                      Fundamento jurídico sugerido
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Base generada con los artículos más cercanos a la consulta.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyFoundation}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-white md:w-auto"
              >
                {copiedFoundation ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedFoundation ? 'Copiado' : 'Copiar fundamento'}</span>
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm leading-6 text-slate-700">
                Para la consulta <span className="font-semibold text-slate-950">"{resolvedQuery || query}"</span>, revisa primero estas referencias:
              </p>
              <ol className="mt-4 space-y-3">
                {foundationResults.map((result, index) => (
                  <li key={`${result.metadata.norm}-${result.metadata.article}-${index}`} className="grid gap-2 border-t border-slate-200 pt-3 first:border-t-0 first:pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-950 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-legal-gold">
                        {index + 1}
                      </span>
                      <span className="break-words text-sm font-bold text-slate-950">
                        {formatArticleReference(result)}
                      </span>
                      <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${getNormBadgeColor(result.metadata.norm)}`}>
                        {getShortNormLabel(result.metadata.norm)}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-slate-700">{result.snippet}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>Es una guía de apoyo: valida el texto legal contra el expediente, los hechos y la estrategia del caso antes de presentarlo.</span>
            </div>
          </WorkspacePanel>

          {results.map((result, idx) => (
            <WorkspacePanel key={idx} className="p-5 transition-shadow hover:shadow-md">
              <div className="space-y-3">
                {/* Header with similarity score */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="break-words font-serif font-bold text-slate-900">
                        Art. {result.metadata.article}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded border ${getNormBadgeColor(
                          result.metadata.norm
                        )}`}
                      >
                        {getShortNormLabel(result.metadata.norm)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                      {result.metadata.title}
                    </p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <div className="font-sans text-2xl font-extrabold tabular-nums text-legal-gold">
                      {result.score.toFixed(1)}%
                    </div>
                    <span className="text-xs text-slate-500">similitud</span>
                  </div>
                </div>

                {/* Snippet */}
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  {result.snippet}
                </p>

                {/* Metadata footer */}
                <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-2 text-xs text-slate-500">
                  <span>
                    <strong>Ley:</strong> {result.metadata.norm}
                  </span>
                  {result.metadata.book && (
                    <span>
                      <strong>Libro:</strong> {result.metadata.book}
                    </span>
                  )}
                </div>
              </div>
            </WorkspacePanel>
          ))}
        </div>
      )}

      {!searched && !loading && (
        <WorkspaceEmpty
          icon={<Search size={32} className="text-slate-300" />}
          title="Comienza tu búsqueda"
          description="Ingresa un término relacionado con derecho laboral, seguridad social o vivienda para encontrar los artículos más relevantes."
        />
      )}
    </WorkspacePage>
  );
};
