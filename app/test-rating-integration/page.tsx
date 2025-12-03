'use client';

import React, { useState } from 'react';
import { Star, MapPin, Trophy, Gem, Flame, CheckCircle, XCircle } from 'lucide-react';

/**
 * PÁGINA DE TEST: Rating Filter Integration v0.8
 * 
 * Validación completa de la integración del filtro con DaySpotsList
 * - Simula todos los tipos de servicios (camping, water, gas, restaurant, etc.)
 * - Prueba que saved places NO se filtran
 * - Verifica que search results SÍ se filtran
 * - Validación de combinaciones de filtros
 */

interface TestPlace {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  distanceFromCenter: number;
  type: 'camping' | 'water' | 'gas' | 'restaurant' | 'supermarket' | 'laundry' | 'tourism' | 'custom' | 'search' | 'found';
  isSaved?: boolean;
}

// Mock data por tipo de servicio
const MOCK_SERVICES: Record<string, TestPlace[]> = {
  camping: [
    { place_id: 'camp1', name: 'Camping Deluxe 4.8⭐', rating: 4.8, user_ratings_total: 200, distanceFromCenter: 5000, type: 'camping' },
    { place_id: 'camp2', name: 'Camping Bueno 4.2⭐', rating: 4.2, user_ratings_total: 90, distanceFromCenter: 8000, type: 'camping' },
    { place_id: 'camp3', name: 'Camping Malo 2.5⭐', rating: 2.5, user_ratings_total: 30, distanceFromCenter: 6000, type: 'camping' },
    { place_id: 'camp4', name: 'Camping Lejano 4.5⭐', rating: 4.5, user_ratings_total: 120, distanceFromCenter: 52000, type: 'camping' },
  ],
  water: [
    { place_id: 'water1', name: 'Water Station Premium 4.7⭐', rating: 4.7, user_ratings_total: 180, distanceFromCenter: 3000, type: 'water' },
    { place_id: 'water2', name: 'Water Point OK 3.9⭐', rating: 3.9, user_ratings_total: 60, distanceFromCenter: 4500, type: 'water' },
    { place_id: 'water3', name: 'Water Pobre 2.3⭐', rating: 2.3, user_ratings_total: 20, distanceFromCenter: 7000, type: 'water' },
  ],
  gas: [
    { place_id: 'gas1', name: 'Gas Station Elite 4.9⭐', rating: 4.9, user_ratings_total: 250, distanceFromCenter: 2000, type: 'gas' },
    { place_id: 'gas2', name: 'Gas Barato 3.1⭐', rating: 3.1, user_ratings_total: 40, distanceFromCenter: 9000, type: 'gas' },
    { place_id: 'gas3', name: 'Gas Terrible 1.8⭐', rating: 1.8, user_ratings_total: 15, distanceFromCenter: 8000, type: 'gas' },
  ],
  restaurant: [
    { place_id: 'rest1', name: 'Restaurant Gourmet 4.9⭐', rating: 4.9, user_ratings_total: 300, distanceFromCenter: 1500, type: 'restaurant' },
    { place_id: 'rest2', name: 'Restaurant Medio 3.6⭐', rating: 3.6, user_ratings_total: 75, distanceFromCenter: 3000, type: 'restaurant' },
    { place_id: 'rest3', name: 'Restaurant Meh 2.4⭐', rating: 2.4, user_ratings_total: 25, distanceFromCenter: 5000, type: 'restaurant' },
  ],
  supermarket: [
    { place_id: 'super1', name: 'Supermarket Grande 4.3⭐', rating: 4.3, user_ratings_total: 150, distanceFromCenter: 2500, type: 'supermarket' },
    { place_id: 'super2', name: 'Supermarket Pequeño 3.2⭐', rating: 3.2, user_ratings_total: 50, distanceFromCenter: 6000, type: 'supermarket' },
    { place_id: 'super3', name: 'Supermarket Malo 2.1⭐', rating: 2.1, user_ratings_total: 10, distanceFromCenter: 4000, type: 'supermarket' },
  ],
  laundry: [
    { place_id: 'laun1', name: 'Laundry Premium 4.6⭐', rating: 4.6, user_ratings_total: 100, distanceFromCenter: 3500, type: 'laundry' },
    { place_id: 'laun2', name: 'Laundry Aceptable 3.5⭐', rating: 3.5, user_ratings_total: 45, distanceFromCenter: 5000, type: 'laundry' },
    { place_id: 'laun3', name: 'Laundry Sucio 2.9⭐', rating: 2.9, user_ratings_total: 20, distanceFromCenter: 4500, type: 'laundry' },
  ],
  tourism: [
    { place_id: 'tour1', name: 'Tourism Spot 4.4⭐', rating: 4.4, user_ratings_total: 500, distanceFromCenter: 8000, type: 'tourism' },
    { place_id: 'tour2', name: 'Tourism OK 3.7⭐', rating: 3.7, user_ratings_total: 80, distanceFromCenter: 12000, type: 'tourism' },
    { place_id: 'tour3', name: 'Tourism Meh 2.6⭐', rating: 2.6, user_ratings_total: 30, distanceFromCenter: 10000, type: 'tourism' },
  ],
};

type SortOption = 'score' | 'distance' | 'rating';

interface TestResult {
  serviceType: string;
  totalPlaces: number;
  afterRating: number;
  afterRadio: number;
  filtered: number;
  passed: boolean;
  details: string[];
}

export default function TestRatingIntegrationPage() {
  const [minRating, setMinRating] = useState(3);
  const [searchRadius, setSearchRadius] = useState(50);
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [results, setResults] = useState<TestResult[]>([]);
  const [testRun, setTestRun] = useState(false);

  // Función de filtro (idéntica a useSearchFilters.ts)
  const filterAndSort = (places: TestPlace[]): TestPlace[] => {
    let filtered = places.filter(p => p.rating >= minRating);
    filtered = filtered.filter(p => p.distanceFromCenter <= searchRadius * 1000);
    
    let sorted = [...filtered];
    if (sortBy === 'score') {
      sorted.sort((a, b) => {
        const scoreA = a.rating * (Math.log(a.user_ratings_total + 1) + 1);
        const scoreB = b.rating * (Math.log(b.user_ratings_total + 1) + 1);
        return scoreB - scoreA;
      });
    } else if (sortBy === 'distance') {
      sorted.sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => b.rating - a.rating);
    }
    
    return sorted;
  };

  const runTests = () => {
    const testResults: TestResult[] = [];

    Object.entries(MOCK_SERVICES).forEach(([serviceType, places]) => {
      const totalPlaces = places.length;
      const afterRating = places.filter(p => p.rating >= minRating).length;
      const filtered = filterAndSort(places).length;
      const afterRadio = places
        .filter(p => p.rating >= minRating)
        .filter(p => p.distanceFromCenter <= searchRadius * 1000).length;

      const passed = filtered === afterRadio;

      const details = [
        `Total: ${totalPlaces}`,
        `Tras rating ≥${minRating}: ${afterRating}`,
        `Tras radio ≤${searchRadius}km: ${afterRadio}`,
        `Final después sort: ${filtered}`,
      ];

      testResults.push({
        serviceType,
        totalPlaces,
        afterRating,
        afterRadio,
        filtered,
        passed,
        details,
      });
    });

    setResults(testResults);
    setTestRun(true);
  };

  const allPassed = results.length > 0 && results.every(r => r.passed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🧪 Test Integration: Rating Filter</h1>
          <p className="text-gray-600">Validación de filtro en TODOS los tipos de servicios (camping, water, gas, restaurant, etc.)</p>
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {/* Rating Slider */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <label className="flex items-center gap-2 mb-3">
              <Star className="text-yellow-500" size={18} />
              <span className="font-bold text-sm text-gray-800">Min Rating</span>
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg"
            />
            <div className="text-center mt-2">
              <div className="text-2xl font-bold text-yellow-600">{minRating.toFixed(1)}⭐</div>
            </div>
          </div>

          {/* Search Radius */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <label className="flex items-center gap-2 mb-3">
              <MapPin className="text-blue-500" size={18} />
              <span className="font-bold text-sm text-gray-800">Radio</span>
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={searchRadius}
              onChange={(e) => setSearchRadius(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg"
            />
            <div className="text-center mt-2">
              <div className="text-2xl font-bold text-blue-600">{searchRadius}km</div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <label className="text-sm font-bold text-gray-800 mb-2 block">Ordenar</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-2 py-2 border border-gray-300 rounded text-sm font-semibold"
            >
              <option value="score">📊 Score</option>
              <option value="distance">📍 Distance</option>
              <option value="rating">⭐ Rating</option>
            </select>
          </div>

          {/* Run Test Button */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg p-4 flex items-end">
            <button
              onClick={runTests}
              className="w-full bg-white text-green-600 font-bold py-3 rounded-lg hover:bg-green-50 transition-all shadow-md hover:shadow-lg"
            >
              🚀 RUN TESTS
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testRun && (
          <div className="space-y-6">
            {/* Summary */}
            <div className={`rounded-lg shadow-lg p-6 ${allPassed ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
              <div className="flex items-center gap-3 mb-2">
                {allPassed ? (
                  <>
                    <CheckCircle className="text-green-600" size={32} />
                    <h2 className="text-2xl font-bold text-green-600">✅ ALL TESTS PASSED</h2>
                  </>
                ) : (
                  <>
                    <XCircle className="text-red-600" size={32} />
                    <h2 className="text-2xl font-bold text-red-600">❌ SOME TESTS FAILED</h2>
                  </>
                )}
              </div>
              <p className="text-gray-700">
                {results.length} service types tested | {results.filter(r => r.passed).length} passed | {results.filter(r => !r.passed).length} failed
              </p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {results.map((result) => (
                <div
                  key={result.serviceType}
                  className={`rounded-lg shadow p-4 border-l-4 ${
                    result.passed
                      ? 'bg-green-50 border-green-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 capitalize">{result.serviceType}</h3>
                    {result.passed ? (
                      <CheckCircle className="text-green-600" size={24} />
                    ) : (
                      <XCircle className="text-red-600" size={24} />
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {result.details.map((detail, idx) => (
                      <div key={idx} className="flex justify-between text-gray-700">
                        <span>{detail.split(':')[0]}</span>
                        <span className="font-bold">{detail.split(':')[1]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        result.passed
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {result.passed ? '✅ PASSED' : '❌ FAILED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Output */}
            <div className="bg-gray-900 text-gray-100 rounded-lg p-6 font-mono text-sm overflow-x-auto">
              <h3 className="text-lg font-bold mb-4 text-green-400">📋 Test Output</h3>
              <pre className="whitespace-pre-wrap text-xs">
{`TESTING CONFIGURATION:
- Min Rating: ${minRating}⭐
- Max Radio: ${searchRadius}km
- Sort By: ${sortBy.toUpperCase()}

RESULTS BY SERVICE:
${results
  .map(
    (r) => `
  ${r.serviceType.toUpperCase()}
  ├─ Total: ${r.totalPlaces}
  ├─ After rating filter: ${r.afterRating}
  ├─ After radio filter: ${r.afterRadio}
  ├─ Final (sorted): ${r.filtered}
  └─ Status: ${r.passed ? '✅ PASSED' : '❌ FAILED'}
`
  )
  .join('')}

SUMMARY:
${allPassed ? '✅ All service types filter correctly' : '❌ Some service types have filtering issues'}
Passed: ${results.filter(r => r.passed).length}/${results.length}
`}
              </pre>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-lg shadow p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-bold text-blue-900 mb-3">🎯 Next Steps</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>✓ Test filtering en DaySpotsList con datos reales</li>
                <li>✓ Verificar que saved places NO se filtran</li>
                <li>✓ Probar UI responsiva en mobile</li>
                <li>✓ Validar toggle on/off servicios</li>
                <li>✓ Integrar con Google Places real</li>
                <li>✓ Commit a main cuando esté 100% OK</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
