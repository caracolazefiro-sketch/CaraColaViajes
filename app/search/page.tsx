'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';

interface SearchResult {
  filename: string;
  path: string;
  lineNumber: number;
  lineContent: string;
  context: {
    before: string[];
    after: string[];
  };
  matchIndices: number[];
}

interface SearchResponse {
  query: string;
  totalResults: number;
  results: SearchResult[];
  executionTime: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [executionTime, setExecutionTime] = useState(0);
  const [showContext, setShowContext] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setTotalResults(0);
      setError('');
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = useCallback(async (searchQuery: string, forceRefresh: boolean) => {
    setLoading(true);
    setError('');
    setRefreshing(forceRefresh);

    try {
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      params.set('limit', '100');
      if (forceRefresh) {
        params.set('refresh', 'true');
      }

      const response = await fetch(`/api/search?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
      setTotalResults(data.totalResults);
      setExecutionTime(data.executionTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const highlightMatch = (text: string, indices: number[]) => {
    if (indices.length === 0) return text;

    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;

    indices.forEach((index) => {
      const queryLen = query.length;
      parts.push(text.slice(lastIndex, index));
      parts.push(
        <mark key={`${index}-${queryLen}`} className="bg-yellow-200 font-semibold">
          {text.slice(index, index + queryLen)}
        </mark>
      );
      lastIndex = index + queryLen;
    });

    parts.push(text.slice(lastIndex));
    return parts;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/80 border-b border-slate-700 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/" className="text-2xl font-bold text-white hover:text-slate-300 transition">
            ← Cara Cola Viajes
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📚 Búsqueda de Referencias</h1>
          <p className="text-slate-300">
            Busca en toda la documentación del proyecto (docs/ + CHEMA/ANALISIS/)
          </p>
        </div>

        {/* Search Box */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca: 'optimizacion', 'api', 'motor', etc..."
              className="w-full px-6 py-4 text-lg bg-slate-700 text-white border-2 border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
            <span className="absolute right-4 top-4 text-slate-400 text-sm">
              {query.length >= 2 ? '✓' : 'min 2 caracteres'}
            </span>
          </div>

          {/* Options */}
          <div className="flex gap-4 mt-4 flex-wrap">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={showContext}
                onChange={(e) => setShowContext(e.target.checked)}
                className="w-4 h-4"
              />
              Mostrar contexto (líneas antes/después)
            </label>

            {query.length >= 2 && (
              <button
                onClick={() => performSearch(query, true)}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition"
              >
                {refreshing ? '🔄 Actualizando...' : '🔄 Actualizar índice'}
              </button>
            )}
          </div>
        </div>

        {/* Status */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block">
              <div className="animate-spin text-4xl mb-2">⏳</div>
              <p className="text-slate-300">Buscando...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-200 px-6 py-4 rounded-lg mb-8">
            <p>❌ Error: {error}</p>
          </div>
        )}

        {!loading && query.length >= 2 && totalResults === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No se encontraron resultados para "{query}"</p>
            <p className="text-slate-500 text-sm mt-2">Intenta con otro término</p>
          </div>
        )}

        {/* Results Summary */}
        {!loading && totalResults > 0 && (
          <div className="bg-slate-700/50 border border-slate-600 px-6 py-4 rounded-lg mb-8">
            <p className="text-slate-200">
              <span className="font-bold text-blue-400">{totalResults}</span> resultados encontrados en{' '}
              <span className="font-bold">{executionTime}ms</span>
            </p>
          </div>
        )}

        {/* Results */}
        <div className="space-y-6">
          {results.map((result, idx) => (
            <div
              key={`${result.path}-${result.lineNumber}-${idx}`}
              className="bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden hover:border-slate-500 transition"
            >
              {/* File Header */}
              <div className="bg-slate-800/80 px-6 py-3 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-slate-400 text-sm font-mono">{result.path}</p>
                  <p className="text-white font-semibold">{result.filename}</p>
                </div>
                <Link
                  href={`/${result.path.replace(/^docs\//, '').replace(/^CHEMA\/ANALISIS\//, '')}`}
                  target="_blank"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition whitespace-nowrap ml-4"
                >
                  Ver →
                </Link>
              </div>

              {/* Line Info */}
              <div className="px-6 py-4">
                <p className="text-slate-400 text-xs mb-2">Línea {result.lineNumber}</p>

                {/* Main Match Line */}
                <div className="bg-slate-900 px-4 py-2 rounded border-l-4 border-yellow-500 mb-3 overflow-x-auto">
                  <code className="text-slate-100 text-sm whitespace-pre-wrap break-words">
                    {highlightMatch(result.lineContent, result.matchIndices)}
                  </code>
                </div>

                {/* Context */}
                {showContext && (result.context.before.length > 0 || result.context.after.length > 0) && (
                  <div className="text-slate-400 text-xs space-y-1">
                    {result.context.before.length > 0 && (
                      <div className="text-slate-500">
                        <p className="text-slate-600 mb-1">Antes:</p>
                        {result.context.before.map((line, i) => (
                          <div key={i} className="font-mono text-slate-600 ml-2">
                            {line.slice(0, 100)}
                            {line.length > 100 ? '...' : ''}
                          </div>
                        ))}
                      </div>
                    )}

                    {result.context.after.length > 0 && (
                      <div className="text-slate-500 mt-2">
                        <p className="text-slate-600 mb-1">Después:</p>
                        {result.context.after.map((line, i) => (
                          <div key={i} className="font-mono text-slate-600 ml-2">
                            {line.slice(0, 100)}
                            {line.length > 100 ? '...' : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Help Section */}
        {!query && (
          <div className="mt-12 bg-slate-700/30 border border-slate-600 rounded-lg p-8">
            <h2 className="text-xl font-bold text-white mb-4">💡 Cómo usar</h2>
            <ul className="text-slate-300 space-y-2">
              <li>✨ <strong>Escribe para buscar</strong>: Obtén resultados en tiempo real mientras escribes</li>
              <li>🔍 <strong>Mínimo 2 caracteres</strong>: Busca con términos de al menos 2 caracteres</li>
              <li>📂 <strong>Scope limitado</strong>: Solo busca en documentación (docs/ y CHEMA/ANALISIS/)</li>
              <li>📍 <strong>Contexto</strong>: Activa/desactiva líneas de contexto antes y después</li>
              <li>🔄 <strong>Actualizar</strong>: Haz clic en "Actualizar índice" para buscar archivos recientes</li>
              <li>🔗 <strong>Ver archivo</strong>: Haz clic en "Ver →" para abrir el archivo completo</li>
            </ul>

            <div className="mt-6 p-4 bg-slate-800/50 rounded border border-slate-600">
              <p className="text-slate-400 text-sm">
                <strong>Ejemplos de búsqueda:</strong>
              </p>
              <p className="text-slate-500 text-sm mt-2 font-mono">
                "optimizacion" • "api" • "motor" • "supabase" • "cache" • "routes"
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
