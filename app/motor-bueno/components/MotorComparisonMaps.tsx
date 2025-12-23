'use client';

// ⚠️🚨 RED FLAG - CRITICAL FILE - VERSIÓN ESTABLE V1 - DO NOT MODIFY 🚨⚠️
// ✅ ESTA VERSIÓN FUNCIONA PERFECTAMENTE - NO TOCAR SIN BACKUP
// Este archivo contiene la lógica de segmentación del MOTOR que calcula puntos
// EXACTAMENTE sobre el polyline de Google Maps. Los marcadores están perfectamente
// alineados con la línea azul de la ruta.
// FUNCIONAMIENTO:
//   - Extrae polyline de motorDirections (cliente)
//   - Calcula puntos cada 300km caminando el polyline
//   - Hace geocoding inverso para obtener nombres de ciudades
//   - Notifica a través de callback onSegmentationPointsCalculated
// IMPORTANTE: Los marcadores se calculan del polyline de motorDirections,
// NO de dailyItinerary del servidor. Esta separación es INTENCIONAL.
// ⚠️🚨 CUALQUIER CAMBIO DEBE PROBARSE EXHAUSTIVAMENTE EN /motor 🚨⚠️
// Fecha estable: 06/12/2025

import React, { useEffect, useState } from 'react';
import { GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';

interface DailyPlan {
  day: number;
  date: string;
  from: string;
  to: string;
  distance: number;
  isDriving: boolean;
  coordinates?: { lat: number; lng: number };
  startCoordinates?: { lat: number; lng: number };
}

interface MotorComparisonMapsProps {
  origen: string;
  destino: string;
  kmMaximo?: number;
  manualWaypoints?: string[]; // 🛏️ Pernoctas manuales del usuario
  dailyItinerary?: DailyPlan[];
  showOnlyOurRequest?: boolean;
  showOnlyGoogleMap?: boolean;
  showOnlyMotorMap?: boolean;
  onSegmentationPointsCalculated?: (points: Array<{
    lat: number;
    lng: number;
    day: number;
    distance: number;
    cityName?: string;
    cityCoordinates?: { lat: number; lng: number };
    realDistance?: number;
    isManualWaypoint?: boolean; // 🔵 Waypoint manual
  }>, startCity: string, endCity: string) => void;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = { lat: 40.416775, lng: -3.703790 };

export default function MotorComparisonMaps({ origen, destino, kmMaximo = 300, manualWaypoints = [], dailyItinerary, showOnlyOurRequest, showOnlyGoogleMap, showOnlyMotorMap, onSegmentationPointsCalculated }: MotorComparisonMapsProps) {
  const [ourRequestMap, setOurRequestMap] = useState<google.maps.Map | null>(null);
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null);
  const [motorMap, setMotorMap] = useState<google.maps.Map | null>(null);
  const [ourDirections, setOurDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [googleDirections, setGoogleDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [googleInfo, setGoogleInfo] = useState<{ distance: string; duration: string; routeName: string; alternativesCount: number } | null>(null);
  const [motorDirections, setMotorDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [segmentationPoints, setSegmentationPoints] = useState<Array<{
    lat: number;
    lng: number;
    day: number;
    distance: number;
    cityName?: string;
    cityCoordinates?: { lat: number; lng: number };
    realDistance?: number; // Distancia real origen → ciudad (incluyendo desvío)
    isManualWaypoint?: boolean; // 🔵 Waypoint manual (sin alternativas)
    alternatives?: Array<{
      name: string;
      lat: number;
      lng: number;
      rating: number;
      userRatingsTotal: number;
      vicinity?: string;
      distanceFromOrigin: number;
      score: number;
    }>;
  }>>([]);
  const [startCityName, setStartCityName] = useState<string>('');
  const [endCityName, setEndCityName] = useState<string>('');

  // Calcular puntos de segmentación desde el polyline de la ruta
  useEffect(() => {
    console.log('🔄 useEffect segmentación - motorDirections:', motorDirections ? 'EXISTE' : 'NULL');
    console.log('🔄 useEffect segmentación - dailyItinerary:', dailyItinerary?.length || 0, 'días');
    console.log('🔄 useEffect segmentación - motorMap:', motorMap ? 'EXISTE' : 'NULL');
    console.log('🔄 useEffect segmentación - manualWaypoints:', manualWaypoints.length);

    if (!motorDirections || !dailyItinerary || dailyItinerary.length === 0) {
      console.log('❌ useEffect segmentación: Sin datos necesarios');
      setSegmentationPoints([]);
      return;
    }

    try {
      console.log('✅ useEffect segmentación: Iniciando cálculo...');

      // 🛏️ SI HAY WAYPOINTS MANUALES: Usar híbrido servidor + polyline
      if (manualWaypoints.length > 0) {
        console.log('🛏️ WAYPOINTS DETECTADOS - Usando modo híbrido (servidor para manuales, polyline para automáticos)');

        // Primero extraer polyline real del mapa
        const allPoints: google.maps.LatLng[] = [];
        motorDirections.routes[0].legs.forEach(leg => {
          leg.steps.forEach(step => {
            if (step.path) {
              allPoints.push(...step.path);
            }
          });
        });

        console.log('📍 Polyline del mapa tiene', allPoints.length, 'puntos');

        let accumulatedDistance = 0;
        const pointsFromHybrid: typeof segmentationPoints = [];

        for (const day of dailyItinerary.filter(d => d.isDriving && d.coordinates)) {
          accumulatedDistance += day.distance;
          const cityName = day.to;

          // Detectar si es waypoint manual
          const isManualWaypoint = manualWaypoints.some(wp => {
            const normalized = wp.toLowerCase().trim();
            const cityNormalized = cityName.toLowerCase().trim();
            const cityFirstPart = cityNormalized.split(',')[0];
            return normalized.includes(cityFirstPart) || cityFirstPart.includes(normalized.split(',')[0]);
          });

          console.log(`  📍 Día ${day.day}: ${day.from} → ${day.to} (${day.distance.toFixed(0)}km, ${accumulatedDistance.toFixed(0)}km acum) ${isManualWaypoint ? '🔵 MANUAL' : '🟢 AUTO'}`);

          let coords = day.coordinates!;

          // 🟢 Si es parada AUTOMÁTICA → buscar punto más cercano en el polyline real
          if (!isManualWaypoint) {
            // Buscar punto del polyline más cercano a las coordenadas del servidor
            let closestPoint = allPoints[0];
            let minDistance = Number.MAX_VALUE;

            for (const point of allPoints) {
              const dist = getDistanceFromLatLonInM(
                day.coordinates!.lat, day.coordinates!.lng,
                point.lat(), point.lng()
              );
              if (dist < minDistance) {
                minDistance = dist;
                closestPoint = point;
              }
            }

            coords = { lat: closestPoint.lat(), lng: closestPoint.lng() };
            console.log(`    ├─> 🔧 Ajustado a polyline (desplazamiento: ${(minDistance/1000).toFixed(1)}km)`);
          }

          pointsFromHybrid.push({
            lat: coords.lat,
            lng: coords.lng,
            day: day.day,
            distance: day.distance,
            cityName: cityName,
            cityCoordinates: coords,
            realDistance: accumulatedDistance,
            isManualWaypoint: isManualWaypoint,
            alternatives: []
          });
        }

        setSegmentationPoints(pointsFromHybrid);
        setStartCityName(dailyItinerary[0].from);
        setEndCityName(dailyItinerary[dailyItinerary.length - 1].to);

        if (onSegmentationPointsCalculated) {
          onSegmentationPointsCalculated(pointsFromHybrid, dailyItinerary[0].from, dailyItinerary[dailyItinerary.length - 1].to);
        }

        console.log('✅ Segmentación híbrida completada:', pointsFromHybrid.length, 'puntos');
        return; // ⚠️ SALIR - No calcular desde polyline
      }

      // 🔄 SIN WAYPOINTS: Calcular desde polyline (comportamiento original)
      console.log('🔄 SIN WAYPOINTS - Usando cálculo desde polyline');

      // Extraer todos los puntos del polyline
      const allPoints: google.maps.LatLng[] = [];
      motorDirections.routes[0].legs.forEach(leg => {
        leg.steps.forEach(step => {
          if (step.path) {
            allPoints.push(...step.path);
          }
        });
      });

      console.log('📍 Polyline tiene', allPoints.length, 'puntos');

      // Calcular distancia total
      let totalDistance = 0;
      for (let i = 0; i < allPoints.length - 1; i++) {
        const lat1 = allPoints[i].lat();
        const lng1 = allPoints[i].lng();
        const lat2 = allPoints[i + 1].lat();
        const lng2 = allPoints[i + 1].lng();
        totalDistance += getDistanceFromLatLonInM(lat1, lng1, lat2, lng2);
      }

      console.log('📏 Distancia total del polyline:', (totalDistance / 1000).toFixed(1), 'km');

      // Calcular puntos de parada cada kmMaximo
      const maxMeters = kmMaximo * 1000;
      console.log('🎯 Calculando paradas cada', kmMaximo, 'km');
      const points: Array<{ lat: number; lng: number; day: number; distance: number }> = [];

      let accumulatedDistance = 0;
      let dayCounter = 1;
      let lastStopDistance = 0;

      for (let i = 0; i < allPoints.length - 1; i++) {
        const lat1 = allPoints[i].lat();
        const lng1 = allPoints[i].lng();
        const lat2 = allPoints[i + 1].lat();
        const lng2 = allPoints[i + 1].lng();
        const segmentDist = getDistanceFromLatLonInM(lat1, lng1, lat2, lng2);

        accumulatedDistance += segmentDist;

        // ¿Hemos superado 300km desde la última parada?
        if (accumulatedDistance - lastStopDistance >= maxMeters) {
          points.push({
            lat: allPoints[i + 1].lat(),
            lng: allPoints[i + 1].lng(),
            day: dayCounter,
            distance: (accumulatedDistance - lastStopDistance) / 1000,
          });
          lastStopDistance = accumulatedDistance;
          dayCounter++;
          console.log(`  🚩 Punto día ${dayCounter - 1}:`, allPoints[i + 1].lat(), allPoints[i + 1].lng());
        }
      }

      console.log('✅ Calculados', points.length, 'puntos de parada');

      // T1 + T2.1: Obtener nombres de ciudades con radio dinámico y estrategia fallback
      if (!motorMap) {
        console.log('⚠️ motorMap no disponible aún, esperando...');
        return;
      }

      const service = new google.maps.places.PlacesService(motorMap);
      const searchRadius = calculateSearchRadius(kmMaximo);
      console.log(`📏 Radio de búsqueda calculado: ${(searchRadius / 1000).toFixed(1)} km (para ${kmMaximo} km/día)`);

      points.forEach((point, idx) => {
        console.log(`🔍 Buscando ciudad cercana a punto ${idx + 1}:`, point.lat.toFixed(6), point.lng.toFixed(6));

        // Prioridad 1: Buscar localidades (ciudades/pueblos) ordenadas por proximidad
        service.nearbySearch(
          {
            location: { lat: point.lat, lng: point.lng },
            radius: searchRadius,
            type: 'locality',
            rankBy: google.maps.places.RankBy.PROMINENCE, // Usar PROMINENCE con radius
          },
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
              // El primer resultado es la ciudad recomendada (PROMINENCE)
              const closestPlace = results[0];
              const cityName = closestPlace.name || 'Unknown City';
              const cityLat = closestPlace.geometry?.location?.lat();
              const cityLng = closestPlace.geometry?.location?.lng();

              console.log(`  📍 Encontradas ${results.length} localidades en ${(searchRadius/1000).toFixed(1)}km`);
              console.log(`  🏙️ Ciudad recomendada: "${cityName}" (${closestPlace.vicinity})`);

              // 🛏️ VERIFICAR SI ES WAYPOINT MANUAL
              const isManualWaypoint = manualWaypoints.some(wp => {
                const normalized = wp.toLowerCase().trim();
                const cityNormalized = cityName.toLowerCase().trim();
                // Comparar ciudad completa o solo primera parte (antes de coma)
                const cityFirstPart = cityNormalized.split(',')[0];
                return normalized.includes(cityFirstPart) || cityFirstPart.includes(normalized.split(',')[0]);
              });

              if (isManualWaypoint) {
                console.log(`  🔵 WAYPOINT MANUAL detectado: "${cityName}" - NO buscar alternativas`);
              } else {
                console.log(`  🟢 Ciudad automática: "${cityName}" - Buscando alternativas...`);
              }

              // Procesar top 5 alternativas con scoring (SOLO si NO es waypoint manual)
              const alternatives = !isManualWaypoint ? results
                .slice(0, 10) // Tomar 10 para filtrar después
                .map((place) => {
                  const lat = place.geometry?.location?.lat() || 0;
                  const lng = place.geometry?.location?.lng() || 0;
                  const distanceFromTactical = getDistanceFromLatLonInM(point.lat, point.lng, lat, lng) / 1000;
                  const distanceFromOrigin = point.distance + distanceFromTactical;
                  const rating = place.rating || 0;
                  const userRatingsTotal = place.user_ratings_total || 0;

                  // Score: (rating × votos) / distancia desde punto táctico
                  const score = userRatingsTotal > 0 ? (rating * userRatingsTotal) / Math.max(distanceFromTactical, 0.1) : 0;

                  return {
                    name: place.name || 'Sin nombre',
                    lat,
                    lng,
                    rating,
                    userRatingsTotal,
                    vicinity: place.vicinity,
                    distanceFromOrigin,
                    score
                  };
                })
                // SIN FILTRO de reviews - mostrar todas las alternativas
                .sort((a, b) => b.score - a.score) // Ordenar por score descendente
                .slice(0, 5) // Top 5 después de ordenar
              : []; // 🔵 Array vacío si es waypoint manual

              console.log(`  🎯 Alternativas encontradas (ordenadas por score):`);
              if (alternatives.length === 0) {
                console.log(`    ⚠️ ${isManualWaypoint ? 'Waypoint manual - sin alternativas' : 'No hay alternativas disponibles'}`);
              }
              alternatives.forEach((alt, i) => {
                console.log(`    ${i + 1}. ${alt.name} - ${alt.distanceFromOrigin.toFixed(0)}km - ⭐${alt.rating} (${alt.userRatingsTotal}) - Score: ${alt.score.toFixed(0)}`);
              });

              // Calcular distancia del punto táctico a la ciudad recomendada
              if (cityLat !== undefined && cityLng !== undefined) {
                const desvioKm = getDistanceFromLatLonInM(point.lat, point.lng, cityLat, cityLng) / 1000;

                console.log(`  📏 Distancia punto → ciudad: ${desvioKm.toFixed(1)} km`);
                console.log(`  🔄 Calculando distancia real por carretera...`);

                // Obtener origen desde dailyItinerary
                const firstDay = dailyItinerary?.[0];
                if (!firstDay || !firstDay.from || firstDay.from.length < 5 || !firstDay.from.includes(',')) {
                  console.log('  ⚠️ No se puede calcular distancia real: origen inválido');
                  const fallbackDistance = point.distance + desvioKm;

                  setSegmentationPoints(prev => {
                    const updated = [...prev];
                    if (updated[idx]) {
                      updated[idx].cityName = cityName;
                      updated[idx].cityCoordinates = { lat: cityLat, lng: cityLng };
                      updated[idx].realDistance = fallbackDistance;
                      updated[idx].isManualWaypoint = isManualWaypoint; // 🔵 Marcar waypoint manual
                      updated[idx].alternatives = alternatives;
                    }
                    return updated;
                  });
                  return;
                }

                // Calcular distancia real con DirectionsService
                const directionsService = new google.maps.DirectionsService();
                directionsService.route(
                  {
                    origin: firstDay.from,
                    destination: { lat: cityLat, lng: cityLng },
                    travelMode: google.maps.TravelMode.DRIVING,
                  },
                  (result, status) => {
                    if (status === google.maps.DirectionsStatus.OK && result) {
                      const realDistanceMeters = result.routes[0].legs[0].distance?.value || 0;
                      const realDistance = realDistanceMeters / 1000;

                      console.log(`  ✅ Distancia real origen → ${cityName}: ${realDistance.toFixed(1)} km`);

                      setSegmentationPoints(prev => {
                        const updated = [...prev];
                        if (updated[idx]) {
                          updated[idx].cityName = cityName;
                          updated[idx].cityCoordinates = { lat: cityLat, lng: cityLng };
                          updated[idx].realDistance = realDistance;
                          updated[idx].isManualWaypoint = isManualWaypoint; // 🔵
                          updated[idx].alternatives = alternatives;
                        }
                        return updated;
                      });
                    } else {
                      console.log(`  ⚠️ Error calculando distancia real (${status}), usando estimación`);
                      const fallbackDistance = point.distance + desvioKm;

                      setSegmentationPoints(prev => {
                        const updated = [...prev];
                        if (updated[idx]) {
                          updated[idx].cityName = cityName;
                          updated[idx].cityCoordinates = { lat: cityLat, lng: cityLng };
                          updated[idx].realDistance = fallbackDistance;
                          updated[idx].isManualWaypoint = isManualWaypoint; // 🔵
                          updated[idx].alternatives = alternatives;
                        }
                        return updated;
                      });
                    }
                  }
                );
              } else {
                // Fallback: usar distancia táctica si no hay coordenadas exactas
                console.log(`  ⚠️ No hay coordenadas exactas para "${cityName}", usando distancia táctica`);
                const realDistance = point.distance; // Sin offset, usar punto táctico

                setSegmentationPoints(prev => {
                  const updated = [...prev];
                  if (updated[idx]) {
                    updated[idx].cityName = cityName;
                    updated[idx].realDistance = realDistance;
                    updated[idx].isManualWaypoint = isManualWaypoint; // 🔵
                    updated[idx].alternatives = alternatives;
                  }
                  return updated;
                });
              }
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              // Prioridad 2: Fallback a lugares con servicios (lodging/restaurant/gas_station)
              console.log(`  ⚠️ No hay localidades, buscando lugares con servicios...`);
              service.nearbySearch(
                {
                  location: { lat: point.lat, lng: point.lng },
                  radius: searchRadius,
                  type: 'lodging', // Google Places API solo acepta un tipo a la vez
                },
                (serviceResults, serviceStatus) => {
                  if (serviceStatus === google.maps.places.PlacesServiceStatus.OK && serviceResults && serviceResults.length > 0) {
                    // Filtrar solo operativos
                    const operational = serviceResults.filter(p =>
                      !p.business_status || p.business_status === 'OPERATIONAL'
                    );
                    if (operational.length > 0) {
                      const closestService = operational[0];
                      const cityName = closestService.name;
                      console.log(`  🏪 Servicio más cercano: "${cityName}" (${closestService.vicinity})`);
                      console.log(`  ✅ Usando nombre del servicio`);

                      setSegmentationPoints(prev => {
                        const updated = [...prev];
                        if (updated[idx]) {
                          updated[idx].cityName = cityName;
                        }
                        return updated;
                      });
                    } else {
                      useFallbackGeocoding(point, idx);
                    }
                  } else {
                    useFallbackGeocoding(point, idx);
                  }
                }
              );
            } else {
              useFallbackGeocoding(point, idx);
            }
          }
        );
      });

      // Prioridad 3: Fallback final a geocoding tradicional
      function useFallbackGeocoding(point: typeof points[0], idx: number) {
        console.log(`  ⚠️ Usando geocoding tradicional...`);
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: point.lat, lng: point.lng } },
          (geoResults, geoStatus) => {
            if (geoStatus === 'OK' && geoResults && geoResults[0]) {
              const cityComponent = geoResults[0].address_components.find(
                comp => comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
              );
              const cityName = cityComponent?.long_name || geoResults[0].formatted_address.split(',')[0];
              console.log(`  ✅ Geocoding: "${cityName}"`);

              setSegmentationPoints(prev => {
                const updated = [...prev];
                if (updated[idx]) {
                  updated[idx].cityName = cityName;
                }
                return updated;
              });
            }
          }
        );
      }

      setSegmentationPoints(points);
    } catch (error) {
      console.error('💥 Error calculando puntos de segmentación:', error);
    }
  }, [motorDirections, dailyItinerary, kmMaximo, motorMap, manualWaypoints, onSegmentationPointsCalculated]);

  // Obtener nombres de ciudades de inicio y fin
  useEffect(() => {
    if (!motorDirections) return;

    const geocoder = new google.maps.Geocoder();
    const startLoc = motorDirections.routes[0].legs[0].start_location;
    const endLoc = motorDirections.routes[0].legs[motorDirections.routes[0].legs.length - 1].end_location;

    // Geocoding para ciudad de inicio
    geocoder.geocode({ location: startLoc }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const cityComponent = results[0].address_components.find(
          comp => comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
        );
        setStartCityName(cityComponent?.long_name || results[0].formatted_address.split(',')[0]);
      }
    });

    // Geocoding para ciudad de fin
    geocoder.geocode({ location: endLoc }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const cityComponent = results[0].address_components.find(
          comp => comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
        );
        setEndCityName(cityComponent?.long_name || results[0].formatted_address.split(',')[0]);
      }
    });
  }, [motorDirections]);

  // Notificar cuando tengamos todos los datos calculados
  useEffect(() => {
    if (onSegmentationPointsCalculated && segmentationPoints.length > 0 && startCityName && endCityName) {
      // Verificar si todos los puntos tienen cityName
      const allHaveCityNames = segmentationPoints.every(p => p.cityName);
      if (allHaveCityNames) {
        onSegmentationPointsCalculated(segmentationPoints, startCityName, endCityName);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentationPoints, startCityName, endCityName]);

  // T1: Calcular radio de búsqueda dinámico basado en kmMaximo
  // Fórmula: radio = min(max(kmMaximo * 80, 15000), 50000)
  // Ejemplos: 200km→16km, 300km→24km, 400km→32km, 600km→48km, 700km→50km
  function calculateSearchRadius(kmMaximo: number): number {
    return Math.min(Math.max(kmMaximo * 80, 15000), 50000);
  }

  // Función auxiliar para calcular distancia (copia de la que está en actions.ts)
  function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Log cuando motorDirections cambia
  useEffect(() => {
    console.log('🔄 motorDirections cambió:', motorDirections ? 'TIENE DATOS' : 'null');
  }, [motorDirections]);

  // Debug y calcular ruta SIMPLE para el MOTOR (solo origen-destino)
  useEffect(() => {
    console.log('🚗 MotorComparisonMaps - dailyItinerary:', dailyItinerary);
    console.log('   - length:', dailyItinerary?.length);
    console.log('   - primer día:', dailyItinerary?.[0]);

    // Si no hay datos, limpiar
    if (!dailyItinerary || dailyItinerary.length === 0) {
      console.log('❌ No hay dailyItinerary');
      setMotorDirections(null);
      return;
    }

    try {
      const firstDay = dailyItinerary[0];
      const lastDay = dailyItinerary[dailyItinerary.length - 1];

      if (!firstDay.startCoordinates || !lastDay.coordinates) {
        console.log('❌ Faltan coordenadas de inicio o fin');
        return;
      }

      // Validar que las coordenadas estén en rangos válidos
      if (
        Math.abs(firstDay.startCoordinates.lat) > 90 ||
        Math.abs(firstDay.startCoordinates.lng) > 180 ||
        Math.abs(lastDay.coordinates.lat) > 90 ||
        Math.abs(lastDay.coordinates.lng) > 180
      ) {
        console.error('❌ Coordenadas fuera de rango válido');
        console.error('   - Origen:', firstDay.startCoordinates);
        console.error('   - Destino:', lastDay.coordinates);
        return;
      }

      console.log('🗺️ Calculando ruta del MOTOR (origen → destino directo)');
      console.log('   - Origen:', firstDay.from, firstDay.startCoordinates);
      console.log('   - Destino:', lastDay.to, lastDay.coordinates);

      // SIEMPRE usar nombres de ciudades (strings) - DirectionsService prefiere strings
      const originRequest = firstDay.from;
      const destRequest = lastDay.to;

      // Validar que tengamos strings válidos Y CON LONGITUD MÍNIMA (sin exigir formato con coma)
      if (!originRequest || typeof originRequest !== 'string' ||
          originRequest.trim() === '' || originRequest.length < 3) {
        console.log('⚠️ Origen inválido o muy corto:', originRequest);
        return;
      }
      if (!destRequest || typeof destRequest !== 'string' ||
          destRequest.trim() === '' || destRequest.length < 3) {
        console.log('⚠️ Destino inválido o muy corto:', destRequest);
        return;
      }

      console.log('✅ Usando strings para DirectionsService:');
      console.log('   - Origen (string):', originRequest);
      console.log('   - Destino (string):', destRequest);

      // 🛏️ Si hay waypoints manuales, incluirlos en la ruta del mapa
      const waypointsForMap = manualWaypoints.length > 0
        ? manualWaypoints.map(wp => ({ location: wp, stopover: true }))
        : [];

      if (waypointsForMap.length > 0) {
        console.log('🛏️ Calculando ruta del MOTOR con waypoints:', manualWaypoints);
      }

      // Pequeño delay para asegurar que los valores están estables
      const timeoutId = setTimeout(() => {
        const service = new google.maps.DirectionsService();
        service.route(
          {
            origin: originRequest,
            destination: destRequest,
            waypoints: waypointsForMap, // ✅ Incluir waypoints si existen
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              console.log('✅ Ruta del MOTOR calculada');
              setMotorDirections(result);
            } else {
              console.error('❌ Error calculando ruta del MOTOR:', status);
              console.error('   - Origen usado:', originRequest);
              console.error('   - Destino usado:', destRequest);
            }
          }
        );
      }, 300);

      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error('💥 ERROR en useEffect motorDirections:', error);
    }
  }, [dailyItinerary, manualWaypoints]); // ✅ Añadido manualWaypoints para recalcular ruta cuando cambien

  // Ajustar el mapa del MOTOR cuando hay puntos de segmentación
  useEffect(() => {
    if (motorMap && segmentationPoints.length > 0) {
      console.log('🗺️ Ajustando bounds del mapa del MOTOR con', segmentationPoints.length, 'puntos...');
      const bounds = new google.maps.LatLngBounds();
      segmentationPoints.forEach(point => {
        bounds.extend({ lat: point.lat, lng: point.lng });
        console.log('  Añadido al bounds:', point.lat, point.lng);
      });
      motorMap.fitBounds(bounds);
      console.log('✅ fitBounds aplicado');
    }
  }, [motorMap, segmentationPoints]);

  useEffect(() => {
    if (!origen || !destino) {
      setOurDirections(null);
      setGoogleDirections(null);
      setGoogleInfo(null);
      return;
    }

    // Validar que sean strings válidos Y NO VACÍOS Y CON FORMATO COMPLETO
    if (typeof origen !== 'string' || typeof destino !== 'string' ||
        origen.trim() === '' || destino.trim() === '' ||
        origen.length < 5 || destino.length < 5 ||
        !origen.includes(',') || !destino.includes(',')) {
      console.log('⚠️ Origen o destino incompletos (esperando "Ciudad, País"):', { origen, destino });
      return;
    }

    console.log('📍 Calculando rutas de comparación:', origen, '→', destino);

    // Pequeño delay para asegurar que los valores están estables
    const timeoutId = setTimeout(() => {
      // Nuestra ruta (puede incluir waypoints en el futuro)
      const service = new google.maps.DirectionsService();
      service.route(
        {
          origin: origen,
          destination: destino,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setOurDirections(result);
          } else {
            console.log('⚠️ No se pudo calcular ruta directa:', status);
          }
        }
      );

      // Ruta de Google Maps directo (con alternativas)
      service.route(
      {
        origin: origen,
        destination: destino,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true, // Solicitar rutas alternativas
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setGoogleDirections(result);

          // Google devuelve la PRIMERA ruta como la "mejor"
          const route = result.routes[0];
          let totalDistance = 0;
          let totalDuration = 0;

          route.legs.forEach(leg => {
            totalDistance += leg.distance?.value || 0;
            totalDuration += leg.duration?.value || 0;
          });

          // Extraer nombre de la ruta (si está disponible)
          const routeName = route.summary || 'Ruta sin nombre';

          setGoogleInfo({
            distance: `${(totalDistance / 1000).toFixed(1)} km`,
            duration: `${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}min`,
            routeName: routeName,
            alternativesCount: result.routes.length
          });

          // Log para debug
          console.log('🗺️ Google devuelve', result.routes.length, 'rutas:');
          result.routes.forEach((r, idx) => {
            const dist = r.legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
            const dur = r.legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0);
            console.log(`  Ruta ${idx + 1}: ${r.summary} - ${(dist/1000).toFixed(0)}km, ${Math.floor(dur/3600)}h${Math.floor((dur%3600)/60)}min`);
          });
        } else {
          console.log('⚠️ No se pudo calcular ruta alternativa de Google:', status);
        }
      }
    );
    }, 300); // Delay de 300ms para evitar llamadas con valores incompletos

    return () => clearTimeout(timeoutId);
  }, [origen, destino]);

  if (!origen || !destino) {
    if (showOnlyOurRequest) {
      return (
        <div className="motor-comparison-box">
          <div className="motor-comparison-header">📤 Nuestra petición</div>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            Introduce origen y destino para comparar
          </div>
        </div>
      );
    }
    if (showOnlyGoogleMap) {
      return (
        <div className="motor-comparison-box">
          <div className="motor-comparison-header">🗺️ Google Maps Directo</div>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            Introduce origen y destino para comparar
          </div>
        </div>
      );
    }
    if (showOnlyMotorMap) {
      return (
        <div className="motor-comparison-box">
          <div className="motor-comparison-header">🚗 Nuestro MOTOR</div>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            Introduce origen y destino para calcular
          </div>
        </div>
      );
    }
    return (
      <div className="motor-comparison-container">
        <div className="motor-comparison-box">
          <div className="motor-comparison-header">📤 Nuestra petición</div>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            Introduce origen y destino para comparar
          </div>
        </div>
        <div className="motor-comparison-box">
          <div className="motor-comparison-header">🗺️ Google Maps Directo</div>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            Introduce origen y destino para comparar
          </div>
        </div>
        <div className="motor-comparison-box">
          <div className="motor-comparison-header">🚗 Nuestro MOTOR</div>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            Introduce origen y destino para calcular
          </div>
        </div>
      </div>
    );
  }

  // Si solo queremos mostrar nuestra petición
  if (showOnlyOurRequest) {
    return (
      <div className="motor-comparison-box">
        <div className="motor-comparison-header">📤 Nuestra petición</div>
        <div className="motor-comparison-map" style={{ height: '400px' }}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={defaultCenter}
            zoom={6}
            onLoad={setOurRequestMap}
              options={mapId ? { mapId } : undefined}
          >
            {ourDirections && <DirectionsRenderer directions={ourDirections} />}
          </GoogleMap>
        </div>
      </div>
    );
  }

  // Si solo queremos mostrar el mapa de Google
  if (showOnlyGoogleMap) {
    return (
      <div className="motor-comparison-box">
        <div className="motor-comparison-header">
          🗺️ Google Maps Directo
          {googleInfo && (
            <div style={{ marginTop: '0.25rem', fontWeight: 'normal', fontSize: '0.75rem', color: '#666' }}>
              <div><strong>Ruta elegida por Google API:</strong> {googleInfo.routeName}</div>
              <div>{googleInfo.distance} • {googleInfo.duration} • {googleInfo.alternativesCount} alternativa(s) disponible(s)</div>
            </div>
          )}
        </div>
        <div className="motor-comparison-map" style={{ height: '400px' }}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={defaultCenter}
            zoom={6}
            onLoad={setGoogleMap}
              options={mapId ? { mapId } : undefined}
          >
            {googleDirections && <DirectionsRenderer directions={googleDirections} />}
          </GoogleMap>
        </div>
      </div>
    );
  }

  // Si solo queremos mostrar el mapa del MOTOR
  if (showOnlyMotorMap) {
    return (
      <div className="motor-comparison-box">
        <div className="motor-comparison-header">
          🚗 Nuestro MOTOR (segmentación)
          {dailyItinerary && dailyItinerary.length > 0 && (
            <div style={{ marginTop: '0.25rem', fontWeight: 'normal', fontSize: '0.75rem', color: '#666' }}>
              {dailyItinerary.length} días de viaje • Puntos exactos sobre la ruta
            </div>
          )}
        </div>
        <div className="motor-comparison-map" style={{ height: '400px' }}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={defaultCenter}
            zoom={6}
            onLoad={setMotorMap}
              options={mapId ? { mapId } : undefined}
          >
            {/* Ruta azul */}
            {motorDirections && (
              <DirectionsRenderer
                directions={motorDirections}
                options={{
                  polylineOptions: {
                    strokeColor: '#2196F3',
                    strokeOpacity: 0.8,
                    strokeWeight: 5,
                  },
                  suppressMarkers: true,
                }}
              />
            )}

            {/* Bandera de inicio */}
            {motorDirections && (
              <Marker
                key="start-flag"
                position={motorDirections.routes[0].legs[0].start_location}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="24">🏁</text></svg>'
                  ),
                  scaledSize: new google.maps.Size(32, 32),
                }}
                title={`Inicio: ${startCityName || 'Cargando...'}`}
              />
            )}

            {/* Bandera de fin */}
            {motorDirections && (
              <Marker
                key="end-flag"
                position={motorDirections.routes[0].legs[motorDirections.routes[0].legs.length - 1].end_location}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="24">🏁</text></svg>'
                  ),
                  scaledSize: new google.maps.Size(32, 32),
                }}
                title={`Fin: ${endCityName || 'Cargando...'}`}
              />
            )}

            {/* Marcadores de paradas intermedias */}
            {segmentationPoints.map((point, idx) => {
              // T2.2: Usar distancia real del polyline (point.distance ya viene calculada)
              const distanceFromPrevious = point.distance;

              // Tooltip mejorado con distancia real por carretera
              const tooltipText = point.cityName
                ? `📍 ${point.cityName}\n🛣️ ~${distanceFromPrevious.toFixed(0)} km por carretera desde parada anterior\n💡 Lugar recomendado por @CaraColaViajes`
                : `Punto ${idx + 1} - ${distanceFromPrevious.toFixed(0)} km`;

              return (
                <Marker
                  key={`segmentation-${idx}`}
                  position={{ lat: point.lat, lng: point.lng }}
                  label={point.cityName ? {
                    text: point.cityName,
                    color: '#1e7e34',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  } : {
                    text: `${point.day}`,
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 12,
                    fillColor: '#4CAF50',
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2,
                  }}
                  title={tooltipText}
                />
              );
            })}
          </GoogleMap>
        </div>
      </div>
    );
  }

  return (
    <div className="motor-comparison-container">
      {/* Nuestra petición */}
      <div className="motor-comparison-box">
        <div className="motor-comparison-header">
          📤 Nuestra petición
        </div>
        <div className="motor-comparison-map">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={6}
            onLoad={setOurRequestMap}
          >
            {ourDirections && <DirectionsRenderer directions={ourDirections} />}
          </GoogleMap>
        </div>
      </div>

      {/* Google Maps Directo */}
      <div className="motor-comparison-box">
        <div className="motor-comparison-header">
          🗺️ Google Maps Directo
          {googleInfo && (
            <div style={{ marginTop: '0.25rem', fontWeight: 'normal', fontSize: '0.75rem', color: '#666' }}>
              <div><strong>Ruta elegida por Google API:</strong> {googleInfo.routeName}</div>
              <div>{googleInfo.distance} • {googleInfo.duration} • {googleInfo.alternativesCount} alternativa(s) disponible(s)</div>
            </div>
          )}
        </div>
        <div className="motor-comparison-map">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={6}
            onLoad={setGoogleMap}
          >
            {googleDirections && <DirectionsRenderer directions={googleDirections} />}
          </GoogleMap>
        </div>
      </div>

      {/* Nuestro MOTOR - Ruta + marcadores */}
      <div className="motor-comparison-box">
        <div className="motor-comparison-header">
          🚗 Nuestro MOTOR (segmentación)
          {dailyItinerary && dailyItinerary.length > 0 && (
            <div style={{ marginTop: '0.25rem', fontWeight: 'normal', fontSize: '0.75rem', color: '#666' }}>
              {dailyItinerary.length} días de viaje • Puntos exactos sobre la ruta
            </div>
          )}
        </div>
        <div className="motor-comparison-map">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={6}
            onLoad={setMotorMap}
          >
            {/* Ruta azul */}
            {motorDirections && (
              <DirectionsRenderer
                directions={motorDirections}
                options={{
                  polylineOptions: {
                    strokeColor: '#2196F3',
                    strokeOpacity: 0.8,
                    strokeWeight: 5,
                  },
                  suppressMarkers: true,
                }}
              />
            )}

            {/* Bandera de inicio */}
            {motorDirections && (
              <Marker
                key="start-flag"
                position={motorDirections.routes[0].legs[0].start_location}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="24">🏁</text></svg>'
                  ),
                  scaledSize: new google.maps.Size(32, 32),
                }}
                title={`Inicio: ${startCityName || 'Cargando...'}`}
              />
            )}

            {/* Bandera de fin */}
            {motorDirections && (
              <Marker
                key="end-flag"
                position={motorDirections.routes[0].legs[motorDirections.routes[0].legs.length - 1].end_location}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="24">🏁</text></svg>'
                  ),
                  scaledSize: new google.maps.Size(32, 32),
                }}
                title={`Fin: ${endCityName || 'Cargando...'}`}
              />
            )}

            {/* Marcadores de paradas intermedias (calculados del polyline de la ruta azul) */}
            {segmentationPoints.map((point, idx) => (
              <Marker
                key={`segmentation-${idx}`}
                position={{ lat: point.lat, lng: point.lng }}
                label={point.cityName ? {
                  text: point.cityName,
                  color: '#1e7e34',
                  fontSize: '11px',
                  fontWeight: 'bold',
                } : {
                  text: `${point.day}`,
                  color: 'white',
                  fontWeight: 'bold',
                }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: '#4CAF50',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 2,
                }}
                title={`Día ${point.day}${point.cityName ? ': ' + point.cityName : ''} - ${point.distance.toFixed(1)}km desde parada anterior`}
              />
            ))}
          </GoogleMap>
        </div>
      </div>
    </div>
  );
}
