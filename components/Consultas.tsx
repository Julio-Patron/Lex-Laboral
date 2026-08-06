/**
 * Consultas - Semantic Legal Query Component
 * Search and retrieve articles from Mexican labor laws
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, BookOpen, TrendingUp } from 'lucide-react';
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
}

export const Consultas: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedNorm, setSelectedNorm] = useState<NormFilter>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        throw new Error(`Search failed: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('No se pudo realizar la búsqueda. Intenta nuevamente.');
      setResults([]);
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
        title="Búsqueda Semántica en Leyes Laborales"
        description="Encuentra rápidamente los artículos más relevantes de la Ley Federal del Trabajo (LFT), Ley del Seguro Social (IMSS) e INFONAVIT usando inteligencia artificial."
        icon={<BookOpen size={24} className="text-legal-gold" />}
      />

      {/* Search Panel */}
      <WorkspacePanel className="mb-8">
        <div className="space-y-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Busca por tema: 'salario mínimo', 'vacaciones', 'pensión', etc."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-legal-gold focus:outline-none focus:ring-2 focus:ring-legal-gold/20 transition-all"
            />
          </div>

          {/* Norm Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-600 pt-2">Filtrar por:</span>
            {(['all', 'LFT', 'IMSS', 'INFONAVIT'] as const).map((norm) => (
              <button
                key={norm}
                onClick={() => setSelectedNorm(norm)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedNorm === norm
                    ? 'bg-legal-gold text-slate-950 shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {norm === 'all' ? 'Todas las Leyes' : norm}
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
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Search size={16} className="text-legal-gold" />
            <span className="text-sm font-semibold text-slate-600">
              {results.length} resultado{results.length !== 1 ? 's' : ''}
            </span>
          </div>

          {results.map((result, idx) => (
            <WorkspacePanel key={idx} className="hover:shadow-md transition-shadow">
              <div className="space-y-3">
                {/* Header with similarity score */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-bold text-slate-900">
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
                    <p className="text-sm font-medium text-slate-700 mt-1">
                      {result.metadata.title}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-legal-gold">
                      {result.score.toFixed(1)}%
                    </div>
                    <span className="text-xs text-slate-500">similitud</span>
                  </div>
                </div>

                {/* Snippet */}
                <p className="text-sm text-slate-600 leading-6 bg-slate-50 rounded-lg p-3 border border-slate-200">
                  {result.snippet}
                </p>

                {/* Metadata footer */}
                <div className="flex gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
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
