'use client';

import React, { useState } from 'react';
import { Star, Trophy, Gem, Flame, MapPin } from 'lucide-react';

/**
 * PÁGINA DE TESTING: Rating Filter v0.8
 * 
 * Objetivo: Validar que el filtro de rating (min 3⭐) funciona correctamente
 * en todas las condiciones, edge cases y tipos de servicios.
 * 
 * Casos de prueba:
 * 1. Rating filter (0-5⭐, step 0.5)
 * 2. Search radius (5-50km)
 * 3. Sort options (Score/Distance/Rating)
 * 4. Combinaciones de filtros
 * 5. Edge cases: sin resultados, rating en límites
 * 6. Integración con DaySpotsList (todos los tipos de servicio)
 */

interface MockPlace {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  distanceFromCenter: number;
  type: string;
}

// Mock data: 20 lugares de prueba con ratings variados
const MOCK_PLACES: MockPlace[] = [
  // Excelentes (4.5+)
  { place_id: '1', name: 'Camping Premium 5⭐', rating: 4.9, user_ratings_total: 150, distanceFromCenter: 2000, type: 'camping' },
  { place_id: '2', name: 'Gas Station Elite', rating: 4.8, user_ratings_total: 200, distanceFromCenter: 5000, type: 'gas' },
  { place_id: '3', name: 'Restaurant Gourmet', rating: 4.7, user_ratings_total: 180, distanceFromCenter: 3000, type: 'restaurant' },
  
  // Buenos (3.5-4.4)
  { place_id: '4', name: 'Camping Bueno', rating: 4.2, user_ratings_total: 80, distanceFromCenter: 4000, type: 'camping' },
  { place_id: '5', name: 'Water Station B', rating: 3.9, user_ratings_total: 60, distanceFromCenter: 2500, type: 'water' },
  { place_id: '6', name: 'Supermarket OK', rating: 4.0, user_ratings_total: 100, distanceFromCenter: 1500, type: 'supermarket' },
  { place_id: '7', name: 'Laundry Service', rating: 3.7, user_ratings_total: 45, distanceFromCenter: 3500, type: 'laundry' },
  
  // Pasables (3.0-3.4)
  { place_id: '8', name: 'Camping Básico', rating: 3.2, user_ratings_total: 40, distanceFromCenter: 6000, type: 'camping' },
  { place_id: '9', name: 'Gas Cheap', rating: 3.1, user_ratings_total: 30, distanceFromCenter: 8000, type: 'gas' },
  { place_id: '10', name: 'Tourism Site', rating: 3.0, user_ratings_total: 50, distanceFromCenter: 4500, type: 'tourism' },
  
  // Malos (<3.0) — DEBEN FILTRARSE CON minRating=3
  { place_id: '11', name: 'Camping Pobre', rating: 2.8, user_ratings_total: 20, distanceFromCenter: 5000, type: 'camping' },
  { place_id: '12', name: 'Water Bad', rating: 2.5, user_ratings_total: 15, distanceFromCenter: 7000, type: 'water' },
  { place_id: '13', name: 'Restaurant Meh', rating: 2.3, user_ratings_total: 25, distanceFromCenter: 9000, type: 'restaurant' },
  { place_id: '14', name: 'Gas Terrible', rating: 1.8, user_ratings_total: 10, distanceFromCenter: 12000, type: 'gas' },
  { place_id: '15', name: 'Supermarket Awful', rating: 2.1, user_ratings_total: 8, distanceFromCenter: 11000, type: 'supermarket' },
  
  // Lejanos (para testear radio)
  { place_id: '16', name: 'Camping Lejano 4.5⭐', rating: 4.5, user_ratings_total: 120, distanceFromCenter: 45000, type: 'camping' },
  { place_id: '17', name: 'Gas Lejano 4.2⭐', rating: 4.2, user_ratings_total: 90, distanceFromCenter: 48000, type: 'gas' },
  
  // Cercanos y buenos (para testear proximidad)
  { place_id: '18', name: 'Camping Cercanía', rating: 4.3, user_ratings_total: 110, distanceFromCenter: 500, type: 'camping' },
  { place_id: '19', name: 'Restaurant Close', rating: 4.6, user_ratings_total: 140, distanceFromCenter: 800, type: 'restaurant' },
  { place_id: '20', name: 'Water Nearby', rating: 3.8, user_ratings_total: 70, distanceFromCenter: 1200, type: 'water' },
];

type SortOption = 'score' | 'distance' | 'rating';

export default function TestRatingFilterPage() {
  const [minRating, setMinRating] = useState(3);
  const [searchRadius, setSearchRadius] = useState(50);
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [showDetails, setShowDetails] = useState(true);

  // Función de filtro y ordenación (idéntica a useSearchFilters.ts)
  const filterAndSort = (places: MockPlace[]): MockPlace[] => {
    // 1️⃣ Filtrar por rating mínimo
    let filtered = places.filter(p => p.rating >= minRating);
    
    // 2️⃣ Filtrar por radio de búsqueda
    filtered = filtered.filter(p => p.distanceFromCenter <= searchRadius * 1000); // convertir km a metros
    
    // 3️⃣ Ordenar según opción
    let sorted = [...filtered];
    if (sortBy === 'score') {
      // Score = rating * (logaritmo de reseñas + 1)
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

  const filtered = filterAndSort(MOCK_PLACES);
  const filtered_before = MOCK_PLACES.filter(p => p.rating >= minRating);
  const filtered_before_radio = filtered_before.filter(p => p.distanceFromCenter <= searchRadius * 1000);

  // Estadísticas
  const stats = {
    total: MOCK_PLACES.length,
    afterRating: filtered_before.length,
    filtered_by_rating_only: MOCK_PLACES.length - filtered_before.length,
    afterRadio: filtered_before_radio.length,
    filtered_by_radio_only: filtered_before.length - filtered_before_radio.length,
    final: filtered.length,
  };

  const placesToShow = filtered.slice(0, 10); // Mostrar top 10

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔧 Testing: Rating Filter v0.8</h1>
          <p className="text-gray-600">Validación completa del filtro de valoración mínima (≥3⭐), radio de búsqueda y ordenación</p>
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Rating Slider */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <label className="flex items-center gap-2 mb-3">
              <Star className="text-yellow-500" size={20} />
              <span className="font-bold text-gray-800">Valoración Mínima</span>
            </label>
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${(minRating / 5) * 100}%, #e5e7eb ${(minRating / 5) * 100}%, #e5e7eb 100%)`,
                }}
              />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{minRating.toFixed(1)}</div>
              <div className="text-sm text-gray-500">⭐ mínimas</div>
            </div>
          </div>

          {/* Search Radius */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <label className="flex items-center gap-2 mb-3">
              <MapPin className="text-blue-500" size={20} />
              <span className="font-bold text-gray-800">Radio de Búsqueda</span>
            </label>
            <div className="mb-4">
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #60a5fa 0%, #60a5fa ${((searchRadius - 5) / 45) * 100}%, #e5e7eb ${((searchRadius - 5) / 45) * 100}%, #e5e7eb 100%)`,
                }}
              />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{searchRadius}</div>
              <div className="text-sm text-gray-500">km máximo</div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <label className="flex items-center gap-2 mb-3">
              <Trophy className="text-purple-500" size={20} />
              <span className="font-bold text-gray-800">Ordenar Por</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
            >
              <option value="score">📊 Puntuación (rating × reviews)</option>
              <option value="distance">📍 Distancia (más cerca primero)</option>
              <option value="rating">⭐ Valoración (mejor primero)</option>
            </select>
          </div>
        </div>

        {/* Statistics Panel */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">Total Original</div>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-600">Tras Rating ≥{minRating}</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.afterRating}</div>
            <div className="text-xs text-red-500 mt-1">❌ {stats.filtered_by_rating_only} eliminados</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">Tras Radio ≤{searchRadius}km</div>
            <div className="text-3xl font-bold text-blue-600">{stats.afterRadio}</div>
            <div className="text-xs text-red-500 mt-1">❌ {stats.filtered_by_radio_only} lejanos</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600">Final Visible</div>
            <div className="text-3xl font-bold text-green-600">{stats.final}</div>
            <div className="text-xs text-gray-500 mt-1">✅ {((stats.final / stats.total) * 100).toFixed(1)}% restante</div>
          </div>
        </div>

        {/* Toggle Details */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              showDetails
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showDetails ? '👁️ Ocultando' : '👁️ Mostrando'} Detalles
          </button>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Resultados Filtrados ({filtered.length} lugares)
          </h2>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-500">❌ No hay resultados con estos filtros</p>
              <p className="text-sm text-gray-400 mt-2">Intenta: ↓ Rating mínimo, ↑ Radio de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {placesToShow.map((place, idx) => {
                const score = place.rating * (Math.log(place.user_ratings_total + 1) + 1);
                const passesRating = place.rating >= minRating;
                const passesRadius = place.distanceFromCenter <= searchRadius * 1000;
                const isTop3 = idx < 3;
                const isExcellent = place.rating >= 4.5;

                return (
                  <div
                    key={place.place_id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      passesRating && passesRadius
                        ? 'border-green-400 bg-green-50'
                        : 'border-red-400 bg-red-50 opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{idx + 1}. {place.name}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Star className="text-yellow-500" size={16} />
                            {place.rating.toFixed(1)} ({place.user_ratings_total} reseñas)
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="text-blue-500" size={16} />
                            {(place.distanceFromCenter / 1000).toFixed(1)}km
                          </span>
                          <span className="text-purple-600 font-semibold">
                            Score: {score.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex gap-2 flex-shrink-0">
                        {isTop3 && <Trophy className="text-yellow-500" size={20} title="Top 3" />}
                        {isExcellent && <Gem className="text-purple-500" size={20} title="4.5+" />}
                        {place.user_ratings_total >= 100 && <Flame className="text-orange-500" size={20} title="Muy popular" />}
                        <div
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            passesRating ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                          }`}
                        >
                          Rating: {passesRating ? '✅' : '❌'}
                        </div>
                        <div
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            passesRadius ? 'bg-blue-200 text-blue-800' : 'bg-red-200 text-red-800'
                          }`}
                        >
                          Radio: {passesRadius ? '✅' : '❌'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filtered.length > 10 && (
                <div className="text-center pt-4 text-gray-500">
                  ... y {filtered.length - 10} más
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detailed Filter Logic (Collapsible) */}
        {showDetails && (
          <div className="bg-gray-900 text-gray-100 rounded-lg p-6 font-mono text-sm mb-8 overflow-x-auto">
            <h3 className="text-lg font-bold mb-4 text-green-400">🔍 Lógica de Filtrado Paso a Paso</h3>
            <pre className="whitespace-pre-wrap">
{`1️⃣ FILTRO POR RATING (≥ ${minRating}⭐)
   Entrada: ${MOCK_PLACES.length} lugares
   Salida: ${stats.afterRating} lugares
   Eliminados: ${stats.filtered_by_rating_only}
   
   ${MOCK_PLACES.filter(p => p.rating < minRating).map(p => `   ❌ "${p.name}" (${p.rating}⭐) - BAJO`).join('\n')}

2️⃣ FILTRO POR RADIO (≤ ${searchRadius}km = ${searchRadius * 1000}m)
   Entrada: ${stats.afterRating} lugares
   Salida: ${stats.afterRadio} lugares
   Eliminados: ${stats.filtered_by_radio_only}
   
   ${filtered_before.filter(p => p.distanceFromCenter > searchRadius * 1000).map(p => `   ❌ "${p.name}" (${(p.distanceFromCenter / 1000).toFixed(1)}km) - LEJANO`).join('\n')}

3️⃣ ORDENAR POR: ${sortBy.toUpperCase()}
   Final: ${stats.final} lugares visibles
   
   Orden aplicado:
   ${filtered.slice(0, 5).map((p, i) => {
     const score = p.rating * (Math.log(p.user_ratings_total + 1) + 1);
     let sortValue = '';
     if (sortBy === 'score') sortValue = ` (score: ${score.toFixed(2)})`;
     else if (sortBy === 'distance') sortValue = ` (${(p.distanceFromCenter / 1000).toFixed(1)}km)`;
     else if (sortBy === 'rating') sortValue = ` (${p.rating}⭐)`;
     return `   ${i + 1}. "${p.name}"${sortValue}`;
   }).join('\n')}
`}
            </pre>
          </div>
        )}

        {/* Test Cases Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-lg shadow p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-bold text-green-900 mb-3">✅ Casos Validados</h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li>✓ Filtro rating: {minRating === 3 ? 'DEFAULT (3⭐)' : `CUSTOM (${minRating}⭐)`}</li>
              <li>✓ Filtro radio: {searchRadius === 50 ? 'DEFAULT (50km)' : `CUSTOM (${searchRadius}km)`}</li>
              <li>✓ Ordenación: {sortBy === 'score' ? 'SCORE (recomendado)' : sortBy.toUpperCase()}</li>
              <li>✓ {stats.filtered_by_rating_only} lugares rechazados por rating bajo</li>
              <li>✓ {stats.filtered_by_radio_only} lugares rechazados por lejanía</li>
              <li>✓ {stats.final}/{stats.total} lugares visibles ({((stats.final / stats.total) * 100).toFixed(0)}%)</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-bold text-blue-900 mb-3">🎯 Próximos Pasos</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>1. Probar en DaySpotsList con datos reales</li>
              <li>2. Verificar que saved places NO se filtran</li>
              <li>3. Validar UI en mobile (sliders responsive)</li>
              <li>4. Testear toggle on/off de servicios</li>
              <li>5. Integración con Google Places (rating real)</li>
              <li>6. Commit a main cuando esté 100% OK</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
