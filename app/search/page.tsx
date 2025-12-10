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

interface IndexEntry {
  filename: string;
  path: string;
  content: string;
  lines: string[];
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [executionTime, setExecutionTime] = useState(0);
  const [showContext, setShowContext] = useState(true);
  const [indexLoaded, setIndexLoaded] = useState(false);
  const [indexData, setIndexData] = useState<IndexEntry[]>([]);
  const [selectedResult, setSelectedResult] = useState<number | null>(null);

  // Cargar índice y query inicial de URL
  useEffect(() => {
    const loadIndex = async () => {
      try {
        const response = await fetch('/search-index.json');
        if (!response.ok) throw new Error('Failed to load index');
        const data = await response.json();
        setIndexData(data.entries || []);
        setIndexLoaded(true);

        // Cargar query desde URL si existe
        const urlParams = new URLSearchParams(window.location.search);
        const urlQuery = urlParams.get('q');
        if (urlQuery) {
          setQuery(decodeURIComponent(urlQuery));
        }
      } catch (err) {
        setError('No se pudo cargar el índice de búsqueda');
        console.error(err);
      }
    };
    loadIndex();
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setTotalResults(0);
      setError('');
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, indexLoaded, indexData]);

  const performSearch = useCallback((searchQuery: string) => {
    const startTime = performance.now();
    setLoading(true);
    setError('');

    try {
      if (!indexData.length) {
        setError('Índice no cargado. Por favor recarga la página.');
        setResults([]);
        setTotalResults(0);
        return;
      }

      const results: SearchResult[] = [];
      const queryLower = searchQuery.toLowerCase();
      const queryRegex = new RegExp(`\\b${searchQuery.toLowerCase()}`, 'gi');

      indexData.forEach((entry) => {
        const contentLower = entry.content.toLowerCase();

        // Búsqueda por palabra completa
        if (!contentLower.includes(queryLower)) return;

        entry.lines.forEach((line, lineIndex) => {
          const lineLower = line.toLowerCase();
          if (!lineLower.includes(queryLower)) return;

          const matches = [...line.matchAll(queryRegex)];
          if (matches.length === 0) return;

          const matchIndices = matches.map((m) => m.index || 0);

          const context = {
            before: entry.lines.slice(Math.max(0, lineIndex - 2), lineIndex),
            after: entry.lines.slice(lineIndex + 1, Math.min(entry.lines.length, lineIndex + 3)),
          };

          results.push({
            filename: entry.filename,
            path: entry.path,
            lineNumber: lineIndex + 1,
            lineContent: line,
            context,
            matchIndices,
          });
        });
      });

      const endTime = performance.now();
      setResults(results.slice(0, 100));
      setTotalResults(results.length);
      setExecutionTime(Math.round(endTime - startTime));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en búsqueda');
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [indexData]);

  const highlightMatch = (text: string, indices: number[]) => {
    if (indices.length === 0) return text;

    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;

    indices.forEach((index, i) => {
      const queryLen = query.length;
      parts.push(text.slice(lastIndex, index));
      parts.push(
        <mark key={`${index}-${i}`} className="bg-yellow-300 font-semibold text-gray-900">
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
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white hover:text-slate-300 transition">
            ← Cara Cola Viajes
          </Link>
          <div className="text-slate-400 text-sm">🔍 Búsqueda en documentación</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📚 Búsqueda Rápida</h1>
          <p className="text-slate-300">
            Busca en documentación y código {!indexLoaded && '(cargando índice...)'}
          </p>
        </div>

        {/* Search Box */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca: 'optimizacion', 'api', 'motor', 'hook'..."
              className="w-full px-6 py-4 text-lg bg-slate-700 text-white border-2 border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              autoFocus
              disabled={!indexLoaded}
            />
            <span className="absolute right-4 top-4 text-slate-400 text-sm">
              {!indexLoaded ? '⏳' : query.length >= 2 ? '✓' : 'min 2 caracteres'}
            </span>
          </div>

          {/* Options */}
          <div className="flex gap-4 mt-4 flex-wrap items-center">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white transition px-3 py-2 bg-slate-700/30 rounded-lg border border-slate-600">
              <input
                type="checkbox"
                checked={showContext}
                onChange={(e) => setShowContext(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span>📍 Contexto</span>
            </label>
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
              onClick={() => {
                // Actualizar URL con el término buscado
                const newUrl = `/search?q=${encodeURIComponent(query)}`;
                window.history.pushState({ query }, '', newUrl);
                setSelectedResult(idx);
              }}
              className="bg-slate-700/50 border-2 border-slate-600 rounded-lg overflow-hidden hover:border-blue-500 hover:bg-slate-600/50 transition cursor-pointer"
            >
              {/* File Header */}
              <div className="bg-slate-800/80 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-500 text-xs font-mono mb-1">📄 {result.path}</p>
                  <p className="text-white font-semibold text-sm">{result.filename}</p>
                </div>
                <span className="px-2 py-1 bg-blue-600/30 text-blue-300 text-xs rounded font-medium">
                  Línea {result.lineNumber}
                </span>
              </div>
              {/* Line Info */}
              <div className="px-6 py-4">
                <p className="text-slate-500 text-xs mb-3 font-semibold">📍 Línea {result.lineNumber}</p>

                {/* Main Match Line */}
                <div className="bg-slate-950 px-4 py-3 rounded border-l-4 border-yellow-400 mb-4 overflow-x-auto">
                  <code className="text-yellow-100 text-sm whitespace-pre-wrap break-words font-mono">
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
            <h2 className="text-xl font-bold text-white mb-4">💡 Cómo usar el buscador</h2>
            <ul className="text-slate-300 space-y-2">
              <li>✨ <strong>Escribe para buscar</strong>: Obtén resultados en tiempo real mientras escribes (mín. 2 caracteres)</li>
              <li>📂 <strong>Scope</strong>: Busca en documentación completa (ROADMAP, PARA_DUMMIES, análisis, etc.)</li>
              <li>📍 <strong>Contexto</strong>: Activa/desactiva líneas antes y después del match</li>
              <li>🖱️ <strong>Seleccionar resultado</strong>: Haz clic en cualquier resultado para actualizar la URL con el término buscado</li>
              <li>⚡ <strong>URL persistente</strong>: Puedes compartir la URL con `?q=tuTermino` para que otros vean los resultados</li>
              <li>🔍 <strong>Búsqueda rápida</strong>: Los resultados se filtran automáticamente al escribir</li>
            </ul>

            <div className="mt-6 p-4 bg-slate-800/50 rounded border border-slate-600">
              <p className="text-slate-400 text-sm mb-2">
                <strong>🔍 Sugerencias de búsqueda:</strong>
              </p>
              <div className="text-slate-500 text-sm font-mono space-y-1">
                <p>github • vercel • next.js • typescript • react • api • database</p>
                <p>motor • hook • component • cache • authentication • security • performance</p>
                <p>dummies • roadmap • arquitectura • optimizacion • viaje • ruta</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-slate-900/50 rounded border border-slate-700">
              <p className="text-slate-400 text-xs">
                💾 Archivo índice: <code>public/search-index.json</code> (18 documentos indexados)
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
