/**
 * Consultas - Semantic Legal Query Component
 * Search and retrieve articles from Mexican labor laws
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AlertCircle, Search, BookOpen, TrendingUp } from 'lucide-react';
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

export const Consultas: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedNorm, setSelectedNorm] = useState<NormFilter>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'semantic' | 'local' | null>(null);
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
    } catch (err) {
      console.error('Search error:', err);
      setError('No se pudo realizar la búsqueda. Revisa que el servicio esté desplegado e intenta nuevamente.');
      setResults([]);
      setSearchMode(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Debounced search on query change
   */
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (query.trim()) {
        performSearch(query, selectedNorm);
      } else {
        setResults([]);
        setSearched(false);
        setSearchMode(null);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, selectedNorm, performSearch]);

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
        eyebrow="Consultas Jurídicas"
        title="Búsqueda jurídica laboral"
        description="Encuentra artículos relevantes de la Ley Federal del Trabajo, Seguro Social e INFONAVIT con una consulta rápida y enfocada."
        icon={<BookOpen size={24} className="text-legal-gold" />}
      />

      {/* Search Panel */}
      <WorkspacePanel className="mb-6 p-5 sm:p-6">
        <div className="space-y-5">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Busca por tema: 'salario mínimo', 'vacaciones', 'pensión', etc."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="ui-input py-4 pl-12 pr-4 text-base"
            />
          </div>

          {/* Norm Filter */}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="w-full text-xs font-bold uppercase tracking-[0.14em] text-slate-500 sm:w-auto">Filtrar</span>
            {(['all', 'LFT', 'IMSS', 'INFONAVIT'] as const).map((norm) => (
              <button
                key={norm}
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
        </div>
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

          {results.map((result, idx) => (
            <WorkspacePanel key={idx} className="p-5 transition-shadow hover:shadow-md">
              <div className="space-y-3">
                {/* Header with similarity score */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="break-words font-serif font-bold text-slate-900">
                        {result.metadata.article} {result.metadata.num}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded border ${getNormBadgeColor(
                          result.metadata.norm
                        )}`}
                      >
                        {result.metadata.norm === 'R_LSS'
                          ? 'Reglamento IMSS'
                          : result.metadata.norm === 'R_INFONAVIT'
                            ? 'Reglamento INFONAVIT'
                            : result.metadata.norm}
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
