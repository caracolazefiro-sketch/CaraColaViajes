'use client';

import React, { useState } from 'react';
import { Star, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * TEST PAGE: Rating Filter Integration v0.8
 * 
 * Simula la integración real del filtro con DaySpotsList
 * Todos los tipos de servicio: camping, water, gas, restaurant, supermarket, laundry, tourism, custom, search, found
 */

interface PlaceWithDistance {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  distanceFromCenter: number;
  type: string;
  isSaved?: boolean;
}

type SortOption = 'score' | 'distance' | 'rating';
type ServiceType = 'camping' | 'water' | 'gas' | 'restaurant' | 'supermarket' | 'laundry' | 'tourism' | 'custom' | 'search' | 'found';

// Mock data por tipo de servicio
const MOCK_SERVICES: Record<ServiceType, PlaceWithDistance[]> = {
  camping: [
    { place_id: 'c1', name: 'Camping Deluxe 5⭐', rating: 4.9, user_ratings_total: 150, distanceFromCenter: 2000, type: 'camping' },
    { place_id: 'c2', name: 'Camping Premium', rating: 4.5, user_ratings_total: 120, distanceFromCenter: 3500, type: 'camping' },
    { place_id: 'c3', name: 'Camping OK', rating: 3.8, user_ratings_total: 60, distanceFromCenter: 4000, type: 'camping' },
    { place_id: 'c4', name: 'Camping Básico', rating: 3.2, user_ratings_total: 40, distanceFromCenter: 5500, type: 'camping' },
    { place_id: 'c5', name: 'Camping Malo', rating: 2.5, user_ratings_total: 15, distanceFromCenter: 6000, type: 'camping' },
    { place_id: 'c6', name: 'Camping Lejano 4.6⭐', rating: 4.6, user_ratings_total: 110, distanceFromCenter: 48000, type: 'camping' },
  ],
  water: [
    { place_id: 'w1', name: 'Agua Premium', rating: 4.8, user_ratings_total: 140, distanceFromCenter: 2500, type: 'water' },
    { place_id: 'w2', name: 'Agua Buena', rating: 4.0, user_ratings_total: 75, distanceFromCenter: 3000, type: 'water' },
    { place_id: 'w3', name: 'Agua Pasable', rating: 3.5, user_ratings_total: 50, distanceFromCenter: 4500, type: 'water' },
    { place_id: 'w4', name: 'Agua Mala', rating: 2.3, user_ratings_total: 20, distanceFromCenter: 5000, type: 'water' },
  ],
  gas: [
    { place_id: 'g1', name: 'Gasolinera Premium', rating: 4.7, user_ratings_total: 180, distanceFromCenter: 1500, type: 'gas' },
    { place_id: 'g2', name: 'Gasolinera OK', rating: 3.9, user_ratings_total: 70, distanceFromCenter: 3000, type: 'gas' },
    { place_id: 'g3', name: 'Gasolinera Mala', rating: 2.4, user_ratings_total: 25, distanceFromCenter: 4500, type: 'gas' },
  ],
  restaurant: [
    { place_id: 'r1', name: 'Restaurante Gourmet', rating: 4.9, user_ratings_total: 200, distanceFromCenter: 2000, type: 'restaurant' },
    { place_id: 'r2', name: 'Restaurante Bueno', rating: 4.2, user_ratings_total: 100, distanceFromCenter: 3500, type: 'restaurant' },
    { place_id: 'r3', name: 'Restaurante Pasable', rating: 3.4, user_ratings_total: 45, distanceFromCenter: 4000, type: 'restaurant' },
    { place_id: 'r4', name: 'Restaurante Malo', rating: 2.1, user_ratings_total: 10, distanceFromCenter: 5000, type: 'restaurant' },
  ],
  supermarket: [
    { place_id: 's1', name: 'Supermercado Premium', rating: 4.6, user_ratings_total: 160, distanceFromCenter: 1000, type: 'supermarket' },
    { place_id: 's2', name: 'Supermercado OK', rating: 4.0, user_ratings_total: 90, distanceFromCenter: 2500, type: 'supermarket' },
    { place_id: 's3', name: 'Supermercado Malo', rating: 2.6, user_ratings_total: 30, distanceFromCenter: 3500, type: 'supermarket' },
  ],
  laundry: [
    { place_id: 'l1', name: 'Lavandería Excelente', rating: 4.8, user_ratings_total: 120, distanceFromCenter: 2000, type: 'laundry' },
    { place_id: 'l2', name: 'Lavandería Buena', rating: 4.1, user_ratings_total: 60, distanceFromCenter: 3000, type: 'laundry' },
    { place_id: 'l3', name: 'Lavandería Mala', rating: 2.8, user_ratings_total: 20, distanceFromCenter: 4500, type: 'laundry' },
  ],
  tourism: [
    { place_id: 't1', name: 'Atracción Turística Top', rating: 4.9, user_ratings_total: 300, distanceFromCenter: 5000, type: 'tourism' },
    { place_id: 't2', name: 'Atracción Buena', rating: 4.3, user_ratings_total: 150, distanceFromCenter: 6000, type: 'tourism' },
    { place_id: 't3', name: 'Atracción Pasable', rating: 3.2, user_ratings_total: 80, distanceFromCenter: 7000, type: 'tourism' },
    { place_id: 't4', name: 'Atracción Mala', rating: 2.0, user_ratings_total: 15, distanceFromCenter: 8000, type: 'tourism' },
  ],
  custom: [
    { place_id: 'x1', name: 'Lugar Personalizado 1', rating: 4.5, user_ratings_total: 50, distanceFromCenter: 3000, type: 'custom', isSaved: true },
  ],
  search: [
    { place_id: 'sr1', name: 'Lugar Buscado 1', rating: 4.7, user_ratings_total: 80, distanceFromCenter: 2500, type: 'search', isSaved: true },
  ],
  found: [
    { place_id: 'f1', name: 'Lugar Encontrado 1', rating: 4.4, user_ratings_total: 60, distanceFromCenter: 2000, type: 'found', isSaved: true },
  ],
};

const SERVICE_NAMES: Record<ServiceType, string> = {
  camping: '🏕️ Camping',
  water: '💧 Agua',
  gas: '⛽ Gas',
  restaurant: '🍽️ Restaurante',
  supermarket: '🛒 Supermercado',
  laundry: '🧺 Lavandería',
  tourism: '🎭 Turismo',
  custom: '📌 Personalizado',
  search: '🔍 Buscado',
  found: '✨ Encontrado',
};

export default function TestIntegrationPage() {
  const [minRating, setMinRating] = useState(3);
  const [searchRadius, setSearchRadius] = useState(50);
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [selectedService, setSelectedService] = useState<ServiceType>('camping');

  // Función de filtro idéntica a useSearchFilters.ts
  const filterAndSort = (places: PlaceWithDistance[]): PlaceWithDistance[] => {
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

  const serviceTypes: ServiceType[] = ['camping', 'water', 'gas', 'restaurant', 'supermarket', 'laundry', 'tourism', 'custom', 'search', 'found'];
  const results = serviceTypes.map(service => {
    const allPlaces = MOCK_SERVICES[service];
    const filtered = filterAndSort(allPlaces);
    const saved = allPlaces.filter(p => p.isSaved);
    const search = allPlaces.filter(p => !p.isSaved);
    const filteredSearch = filterAndSort(search);
    
    return {
      service,
      total: allPlaces.length,
      before_filter: allPlaces.length,
      after_filter: filtered.length,
      saved_places: saved.length,
      search_places: search.length,
      filtered_search: filteredSearch.length,
      filtered,
      saved,
      search,
    };
  });

  const selectedResult = results.find(r => r.service === selectedService);

  // Estadísticas globales
  const totalPlaces = results.reduce((sum, r) => sum + r.total, 0);
  const totalFiltered = results.reduce((sum, r) => sum + r.after_filter, 0);
  const totalSaved = results.reduce((sum, r) => sum + r.saved_places, 0);
  const totalRemoved = totalPlaces - totalFiltered;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🧪 Test: Rating Filter Integration v0.8</h1>
          <p className="text-gray-600">Validación en tiempo real de la integración con todos los tipos de servicio</p>
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Rating */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <label className="flex items-center gap-2 mb-3">
              <Star className="text-yellow-500" size={20} />
              <span className="font-bold">Valoración Mínima</span>
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="w-full"
              style={{
                background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${(minRating / 5) * 100}%, #e5e7eb ${(minRating / 5) * 100}%, #e5e7eb 100%)`,
              }}
            />
            <div className="text-center mt-2">
              <div className="text-3xl font-bold text-yellow-600">{minRating.toFixed(1)} ⭐</div>
            </div>
          </div>

          {/* Radio */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <label className="flex items-center gap-2 mb-3">
              <MapPin className="text-blue-500" size={20} />
              <span className="font-bold">Radio de Búsqueda</span>
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={searchRadius}
              onChange={(e) => setSearchRadius(parseInt(e.target.value))}
              className="w-full"
              style={{
                background: `linear-gradient(to right, #60a5fa 0%, #60a5fa ${((searchRadius - 5) / 45) * 100}%, #e5e7eb ${((searchRadius - 5) / 45) * 100}%, #e5e7eb 100%)`,
              }}
            />
            <div className="text-center mt-2">
              <div className="text-3xl font-bold text-blue-600">{searchRadius} km</div>
            </div>
          </div>

          {/* Sort */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <label className="font-bold mb-3 block">Ordenar Por</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-semibold"
            >
              <option value="score">📊 Puntuación</option>
              <option value="distance">📍 Distancia</option>
              <option value="rating">⭐ Valoración</option>
            </select>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">Total Lugares</div>
            <div className="text-3xl font-bold text-blue-600">{totalPlaces}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-600">Tras Filtros</div>
            <div className="text-3xl font-bold text-yellow-600">{totalFiltered}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600">Lugares Guardados</div>
            <div className="text-3xl font-bold text-green-600">{totalSaved}</div>
            <div className="text-xs text-gray-500 mt-1">No se filtran</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="text-sm text-gray-600">Eliminados</div>
            <div className="text-3xl font-bold text-red-600">{totalRemoved}</div>
            <div className="text-xs text-gray-500 mt-1">{((totalRemoved / totalPlaces) * 100).toFixed(0)}%</div>
          </div>
        </div>

        {/* Service Tabs */}
        <div className="mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            {serviceTypes.map(service => {
              const result = results.find(r => r.service === service);
              const isActive = selectedService === service;
              return (
                <button
                  key={service}
                  onClick={() => setSelectedService(service)}
                  className={`px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div>{SERVICE_NAMES[service]}</div>
                  <div className="text-xs mt-1">{result?.after_filter || 0} de {result?.total || 0}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Service Results */}
        {selectedResult && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {SERVICE_NAMES[selectedService]} - Resultados ({selectedResult.after_filter} / {selectedResult.total})
            </h2>

            {/* Stats for this service */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-2xl font-bold text-blue-600">{selectedResult.total}</div>
              </div>
              <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                <div className="text-sm text-gray-600">Guardados</div>
                <div className="text-2xl font-bold text-green-600">{selectedResult.saved_places}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-500">
                <div className="text-sm text-gray-600">Visible</div>
                <div className="text-2xl font-bold text-purple-600">{selectedResult.after_filter}</div>
              </div>
            </div>

            {/* Places List */}
            {selectedResult.after_filter === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-xl text-gray-500">No hay resultados con estos filtros</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedResult.filtered.map((place, idx) => {
                  const score = place.rating * (Math.log(place.user_ratings_total + 1) + 1);
                  return (
                    <div key={place.place_id} className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">
                            {idx + 1}. {place.name}
                            {place.isSaved && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded ml-2">💾 Guardado</span>}
                          </h3>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span>⭐ {place.rating.toFixed(1)} ({place.user_ratings_total} reseñas)</span>
                            <span>📍 {(place.distanceFromCenter / 1000).toFixed(1)}km</span>
                            <span className="text-purple-600 font-semibold">Score: {score.toFixed(2)}</span>
                          </div>
                        </div>
                        <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Filtered out places */}
            {selectedResult.search_places > selectedResult.filtered_search && (
              <div className="mt-6 pt-6 border-t-2 border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">
                  ❌ Eliminados por filtros ({selectedResult.search_places - selectedResult.filtered_search})
                </h3>
                <div className="space-y-2">
                  {selectedResult.search.filter(p => !selectedResult.filtered.find(f => f.place_id === p.place_id)).map(place => (
                    <div key={place.place_id} className="p-3 rounded-lg border border-red-200 bg-red-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800">{place.name}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            {place.rating < minRating && <span className="text-red-600">Rating {place.rating}⭐ &lt; {minRating}⭐ </span>}
                            {place.distanceFromCenter > searchRadius * 1000 && <span className="text-red-600">Distancia {(place.distanceFromCenter / 1000).toFixed(1)}km &gt; {searchRadius}km</span>}
                          </div>
                        </div>
                        <span className="text-red-500 font-bold">FILTRADO</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
