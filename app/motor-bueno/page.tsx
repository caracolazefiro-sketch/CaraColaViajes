'use client';

// ⚠️🚨 RED FLAG - CRITICAL FILE - VERSIÓN ESTABLE V1 - DO NOT MODIFY 🚨⚠️
// ✅ ESTA VERSIÓN FUNCIONA PERFECTAMENTE - NO TOCAR SIN BACKUP
// Este archivo es la página principal del MOTOR MVP completamente aislado.
// LAYOUT:
//   Fila 1: Nuestra petición | Google Maps Directo
//   Fila 2: Nuestro MOTOR (con marcadores) | Itinerario por etapas
// FUNCIONAMIENTO:
//   - El itinerario usa state.segmentationData (datos del polyline del mapa)
//   - Callback onSegmentationPointsCalculated sincroniza mapa → itinerario
//   - Los nombres de ciudades del itinerario coinciden EXACTAMENTE con el mapa
//   - Fallback: muestra datos del servidor mientras se calculan los del cliente
// ⚠️🚨 TESTEAR EXHAUSTIVAMENTE CUALQUIER CAMBIO 🚨⚠️
// Fecha estable: 06/12/2025

import React from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useMotor } from './hooks/useMotor';
import { useDynamicItinerary } from './hooks/useDynamicItinerary';
import MotorSearch from './components/MotorSearch';
import MotorComparisonMaps from './components/MotorComparisonMaps';
import MotorItinerary from './components/MotorItinerary';
import './styles/motor.css';

const googleMapsLibraries: ('places' | 'geometry' | 'drawing' | 'visualization')[] = ['places'];

export default function MotorPage() {
  const {
    state,
    setOrigen,
    setDestino,
    setFecha,
    setKmMaximo,
    setShowWaypoints,
    addWaypoint,
    removeWaypoint,
    moveWaypointUp,
    moveWaypointDown,
    addExtraDay,
    calculate,
    setSegmentationData
  } = useMotor();

  // Memoizar callback para evitar recrearlo en cada render
  const handleSegmentationCalculated = React.useCallback((points: Array<{ lat: number; lng: number; day: number; distance: number }>, startCity: string, endCity: string) => {
    setSegmentationData({ points, startCity, endCity });
  }, [setSegmentationData]);

  // 🆕 Hook centralizado para calcular itinerario completo con fechas
  const dynamicItinerary = useDynamicItinerary(
    state.debugResponse?.dailyItinerary,
    state.segmentationData?.points,
    state.extraDays,
    state.segmentationData?.startCity || state.origen
  );

  // 🛏️ Función helper: Calcular fecha dinámica considerando días extra
  const calculateDynamicDate = (baseDate: string, previousPoints: Array<{ lat: number; lng: number; day: number; distance: number }>, currentPointIdx: number) => {
    if (!state.segmentationData) return baseDate;

    // Contar días extra acumulados ANTES de este punto (no incluir el punto actual)
    let extraDaysCount = 0;
    for (let i = 0; i < currentPointIdx; i++) {
      const point = state.segmentationData.points[i];
      if (point?.cityName) {
        extraDaysCount += state.extraDays[point.cityName] || 0;
      }
    }

    // Parsear fecha DD/MM/YYYY correctamente (formato español)
    const [day, month, year] = baseDate.split('/').map(Number);
    const date = new Date(year, month - 1, day); // mes es 0-indexed
    date.setDate(date.getDate() + extraDaysCount);

    // Formatear como DD/MM/YYYY
    const newDay = String(date.getDate()).padStart(2, '0');
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newYear = date.getFullYear();

    return `${newDay}/${newMonth}/${newYear}`;
  };

  // 🛏️ Función helper: Calcular número de día considerando días extra
  const calculateDayNumber = (baseDay: number, previousPoints: any[], currentPointIdx: number) => {
    if (!state.segmentationData) return baseDay;

    // Contar días extra acumulados hasta este punto
    let extraDaysCount = 0;
    for (let i = 0; i < currentPointIdx; i++) {
      const point = state.segmentationData.points[i];
      if (point?.cityName) {
        extraDaysCount += state.extraDays[point.cityName] || 0;
      }
    }

    return baseDay + extraDaysCount;
  };

  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: googleMapsLibraries,
  });

  if (!isGoogleMapsLoaded) {
    return <div className="motor-page" style={{ textAlign: 'center', padding: '2rem' }}>Cargando Google Maps...</div>;
  }

  return (
    <div className="motor-page">
      <div className="motor-search-only-wrapper">
        <MotorSearch
          origen={state.origen}
          destino={state.destino}
          fecha={state.fecha}
          kmMaximo={state.kmMaximo}
          waypoints={state.waypoints}
          showWaypoints={state.showWaypoints}
          onOrigenChange={setOrigen}
          onDestinoChange={setDestino}
          onFechaChange={setFecha}
          onKmMaximoChange={setKmMaximo}
          onShowWaypointsChange={setShowWaypoints}
          onAddWaypoint={addWaypoint}
          onRemoveWaypoint={removeWaypoint}
          onMoveWaypointUp={moveWaypointUp}
          onMoveWaypointDown={moveWaypointDown}
          onCalculate={calculate}
          loading={state.loading}
        />
      </div>

      {/* Mapa MOTOR + Itinerario */}
      <div style={{ maxWidth: '1400px', margin: '1rem auto', padding: '0 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Columna izquierda: Nuestro MOTOR */}
          <div>
            <MotorComparisonMaps
              origen={state.origen}
              destino={state.destino}
              kmMaximo={state.kmMaximo}
              manualWaypoints={state.waypoints}
              dailyItinerary={state.debugResponse?.dailyItinerary}
              showOnlyMotorMap={true}
              onSegmentationPointsCalculated={handleSegmentationCalculated}
            />
          </div>

          {/* Columna derecha: Itinerario */}
          <div>
            <MotorItinerary
              itinerary={dynamicItinerary}
              startCity={state.segmentationData?.startCity || state.origen}
              endCity={state.segmentationData?.endCity || state.destino}
              totalDistance={state.debugResponse?.dailyItinerary?.reduce((sum: number, day: any) => sum + day.distance, 0) || 0}
              onAddExtraDay={addExtraDay}
            />
          </div>
        </div>
      </div>
              <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                height: '100%'
              }}>
                <h2 style={{ margin: '0 0 1rem 0', color: '#2196F3', fontSize: '1.5rem' }}>
                  🗓️ Itinerario por etapas
                </h2>

                {/* Caja TOTAL del viaje */}
                {state.segmentationData?.points && state.segmentationData.points.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '1rem',
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '8px',
                      border: '3px solid #5a67d8',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginBottom: '0.25rem' }}>
                        Distancia total del viaje
                      </div>
                      <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>
                        {state.segmentationData?.startCity} → {state.segmentationData?.endCity}
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'right',
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: '#fff',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {(() => {
                        const totalFromServer = state.debugResponse?.dailyItinerary?.reduce((sum: number, day: any) => sum + day.distance, 0) || 0;
                        return totalFromServer.toFixed(1);
                      })()} km
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {state.segmentationData?.points && state.segmentationData.points.length > 0 ? (
                    <>
                      {/* Primera etapa: origen → primer punto */}
                      {(() => {
                        const firstPoint = state.segmentationData?.points?.[0];
                        if (!firstPoint) return null;
                        const dynamicDate = state.debugResponse?.dailyItinerary?.[0]?.date || '';
                        const extraDaysHere = state.extraDays[firstPoint.cityName || ''] || 0;

                        return (
                        <>
                      <div
                        style={{
                          padding: '1rem',
                          background: '#e3f2fd',
                          borderRadius: '6px',
                          border: '2px solid #2196F3',
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ fontWeight: 'bold', color: '#2196F3', fontSize: '0.85rem' }}>
                            Día 1
                            <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal' }}>
                              {dynamicDate}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.95rem', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span>{state.segmentationData?.startCity} → {firstPoint.cityName || 'Cargando...'}</span>
                            {firstPoint.isManualWaypoint ? (
                              <>
                                <span style={{
                                  padding: '0.15rem 0.5rem',
                                  background: '#2196F3',
                                  color: 'white',
                                  borderRadius: '12px',
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold'
                                }}>
                                  🔵 MANUAL
                                </span>
                                <button
                                  onClick={() => addExtraDay(firstPoint.cityName || '')}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    background: '#FF9800',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                  title="Añadir 1 día de estancia"
                                >
                                  +1 día {extraDaysHere > 0 && `(${extraDaysHere})`}
                                </button>
                              </>
                            ) : (
                              <span style={{
                                padding: '0.15rem 0.5rem',
                                background: '#4CAF50',
                                color: 'white',
                                borderRadius: '12px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold'
                              }}>
                                🟢 SUGERIDO
                              </span>
                            )}
                          </div>
                          <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#4CAF50', fontSize: '0.85rem' }}>
                            {firstPoint.realDistance
                              ? `${firstPoint.realDistance.toFixed(0)} km`
                              : `~${firstPoint.distance.toFixed(0)} km`
                            }
                          </div>
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#666',
                          paddingLeft: '100px',
                          borderTop: '1px solid #bbdefb',
                          paddingTop: '0.5rem'
                        }}>
                          {firstPoint.realDistance ? (
                            <>
                              📍 Distancia real por carretera hasta <strong>{firstPoint.cityName}</strong>: {firstPoint.realDistance.toFixed(0)} km<br/>
                              <span style={{ fontSize: '0.75rem', color: '#999' }}>
                                (Punto de corte cada {state.kmMaximo} km, ciudad en ruta a {firstPoint.distance.toFixed(0)} km del origen)
                              </span>
                              {firstPoint.alternatives && firstPoint.alternatives.length > 1 && (
                                <details style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                  <summary style={{ cursor: 'pointer', color: '#2196F3', fontWeight: 'bold' }}>
                                    🔽 Ver otras opciones en esta zona ({firstPoint.alternatives.length - 1} alternativas)
                                  </summary>
                                  <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid #bbdefb' }}>
                                    {firstPoint.alternatives.slice(1).map((alt, altIdx) => (
                                      <div key={altIdx} style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#f5f5f5', borderRadius: '4px' }}>
                                        <div style={{ fontWeight: 'bold', color: '#000' }}>{alt.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                          📍 {alt.distanceFromOrigin.toFixed(0)} km desde origen ·
                                          ⭐ {alt.rating.toFixed(1)} ({alt.userRatingsTotal.toLocaleString()} opiniones) ·
                                          Score: {alt.score.toFixed(0)}
                                        </div>
                                        {alt.vicinity && <div style={{ fontSize: '0.7rem', color: '#999' }}>{alt.vicinity}</div>}
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </>
                          ) : (
                            <>
                              📍 Punto de parada táctico en ruta a ~{firstPoint.distance.toFixed(0)} km<br/>
                              🏙️ Ciudad cercana con servicios: <strong>{firstPoint.cityName || 'Cargando...'}</strong>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Días de estancia en primer punto */}
                      {extraDaysHere > 0 && Array.from({ length: extraDaysHere }).map((_, extraIdx) => {
                        const stayDate = new Date(dynamicDate);
                        stayDate.setDate(stayDate.getDate() + extraIdx + 1);
                        return (
                          <div
                            key={`stay-first-${extraIdx}`}
                            style={{
                              padding: '1rem',
                              background: '#FFF3E0',
                              borderRadius: '6px',
                              border: '2px dashed #FF9800',
                              marginTop: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px', gap: '0.75rem', alignItems: 'center' }}>
                              <div style={{ fontWeight: 'bold', color: '#FF9800', fontSize: '0.85rem' }}>
                                Día {2 + extraIdx}
                                <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal' }}>
                                  {stayDate.toLocaleDateString('es-ES')}
                                </div>
                              </div>
                              <div style={{ fontSize: '0.95rem', color: '#000', fontWeight: 'bold' }}>
                                🛏️ Estancia en {firstPoint.cityName}
                              </div>
                              <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#999', fontSize: '0.85rem' }}>
                                0 km
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </>
                      );
                      })()}

                      {/* Etapas intermedias: punto → punto */}
                      {state.segmentationData?.points?.slice(1).map((point, idx) => {
                        const actualPointIdx = idx + 1;
                        // El índice del servidor es simplemente idx (0, 1, 2...)
                        // porque el servidor NO conoce los días extra
                        const serverIdx = idx + 1; // idx + 1 porque slice(1) ya saltó el primer punto
                        const dynamicDate = calculateDynamicDate(
                          state.debugResponse?.dailyItinerary?.[serverIdx]?.date || '',
                          state.segmentationData?.points || [],
                          actualPointIdx
                        );
                        const dayNumber = calculateDayNumber(
                          actualPointIdx + 1,
                          state.segmentationData?.points || [],
                          actualPointIdx
                        );
                        const extraDaysHere = state.extraDays[point.cityName || ''] || 0;

                        return (
                        <React.Fragment key={idx}>
                        <div
                          style={{
                            padding: '1rem',
                            background: '#f5f5f5',
                            borderRadius: '6px',
                            marginTop: '0.5rem',
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: 'bold', color: '#2196F3', fontSize: '0.85rem' }}>
                              Día {dayNumber}
                              <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal' }}>{dynamicDate}</div>
                            </div>
                            <div style={{ fontSize: '0.95rem', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span>{state.segmentationData?.points[idx].cityName || 'Cargando...'} → {point.cityName || 'Cargando...'}</span>
                              {point.isManualWaypoint ? (
                                <>
                                  <span style={{
                                    padding: '0.15rem 0.5rem',
                                    background: '#2196F3',
                                    color: 'white',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold'
                                  }}>
                                    🔵 MANUAL
                                  </span>
                                  <button
                                    onClick={() => addExtraDay(point.cityName || '')}
                                    style={{
                                      padding: '0.25rem 0.5rem',
                                      background: '#FF9800',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}
                                    title="Añadir 1 día de estancia"
                                  >
                                    +1 día {extraDaysHere > 0 && `(${extraDaysHere})`}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span style={{
                                    padding: '0.15rem 0.5rem',
                                    background: '#4CAF50',
                                    color: 'white',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold'
                                  }}>
                                    🟢 SUGERIDO
                                  </span>
                                  {/* Botón también en destino final (último punto) */}
                                  {actualPointIdx === (state.segmentationData?.points?.length || 0) - 1 && (
                                    <button
                                      onClick={() => addExtraDay(point.cityName || '')}
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        background: '#FF9800',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                      }}
                                      title="Añadir 1 día de estancia"
                                    >
                                      +1 día {extraDaysHere > 0 && `(${extraDaysHere})`}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#4CAF50', fontSize: '0.85rem' }}>
                              {point.realDistance && state.segmentationData?.points?.[idx]?.realDistance
                                ? `${(point.realDistance - (state.segmentationData.points[idx].realDistance || 0)).toFixed(0)} km`
                                : point.realDistance
                                ? `${point.realDistance.toFixed(0)} km`
                                : `~${point.distance.toFixed(0)} km`
                              }
                            </div>
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#666',
                            paddingLeft: '100px',
                            borderTop: '1px solid #e0e0e0',
                            paddingTop: '0.5rem'
                          }}>
                            {point.realDistance ? (
                              <>
                                📍 Distancia acumulada por carretera hasta <strong>{point.cityName}</strong>: {point.realDistance.toFixed(0)} km<br/>
                                <span style={{ fontSize: '0.75rem', color: '#999' }}>
                                  (Segmento aproximado: ~{point.distance.toFixed(0)} km desde punto anterior)
                                </span>
                                {point.alternatives && point.alternatives.length > 1 && (
                                  <details style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                    <summary style={{ cursor: 'pointer', color: '#2196F3', fontWeight: 'bold' }}>
                                      🔽 Ver otras opciones en esta zona ({point.alternatives.length - 1} alternativas)
                                    </summary>
                                    <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid #e0e0e0' }}>
                                      {point.alternatives.slice(1).map((alt, altIdx) => (
                                        <div key={altIdx} style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#fff', borderRadius: '4px' }}>
                                          <div style={{ fontWeight: 'bold', color: '#000' }}>{alt.name}</div>
                                          <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                            📍 {alt.distanceFromOrigin.toFixed(0)} km desde origen ·
                                            ⭐ {alt.rating.toFixed(1)} ({alt.userRatingsTotal.toLocaleString()} opiniones) ·
                                            Score: {alt.score.toFixed(0)}
                                          </div>
                                          {alt.vicinity && <div style={{ fontSize: '0.7rem', color: '#999' }}>{alt.vicinity}</div>}
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                )}
                              </>
                            ) : (
                              <>
                                📍 Punto de parada táctico en ruta a ~{point.distance.toFixed(0)} km<br/>
                                🏙️ Ciudad cercana con servicios: <strong>{point.cityName || 'Cargando...'}</strong>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Días de estancia en este punto */}
                        {extraDaysHere > 0 && Array.from({ length: extraDaysHere }).map((_, extraIdx) => {
                          const baseDate = new Date(dynamicDate.split('/').reverse().join('-'));
                          baseDate.setDate(baseDate.getDate() + extraIdx + 1);
                          return (
                            <div
                              key={`stay-${idx}-${extraIdx}`}
                              style={{
                                padding: '1rem',
                                background: '#FFF3E0',
                                borderRadius: '6px',
                                border: '2px dashed #FF9800',
                                marginTop: '0.5rem'
                              }}
                            >
                              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px', gap: '0.75rem', alignItems: 'center' }}>
                                <div style={{ fontWeight: 'bold', color: '#FF9800', fontSize: '0.85rem' }}>
                                  Día {dayNumber + extraIdx + 1}
                                  <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal' }}>
                                    {baseDate.toLocaleDateString('es-ES')}
                                  </div>
                                </div>
                                <div style={{ fontSize: '0.95rem', color: '#000', fontWeight: 'bold' }}>
                                  🛏️ Estancia en {point.cityName}
                                </div>
                                <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#999', fontSize: '0.85rem' }}>
                                  0 km
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        </React.Fragment>
                      )})}
                      {/* Última etapa: último punto → destino (SOLO si hay más etapas después) */}
                      {(() => {
                        // Si el número de puntos en segmentationData es igual al número de días con conducción - 1,
                        // significa que el último punto YA ES el destino final (no hay etapa adicional)
                        const drivingDays = state.debugResponse?.dailyItinerary?.filter((d: any) => d.isDriving).length || 0;
                        const hasMoreDays = (state.segmentationData?.points?.length || 0) < drivingDays;
                        if (!hasMoreDays || !state.segmentationData?.points) return null;

                        // Calcular fecha y día dinámicos para última etapa
                        const lastPoint = state.segmentationData.points[state.segmentationData.points.length - 1];
                        const totalExtraDays = state.segmentationData.points.reduce((sum, p) =>
                          sum + (state.extraDays[p.cityName || ''] || 0), 0
                        );
                        const finalDayNumber = state.segmentationData.points.length + 1 + totalExtraDays;
                        const baseDate = state.debugResponse?.dailyItinerary?.[state.debugResponse.dailyItinerary.length - 1]?.date || '';
                        const date = new Date(baseDate);
                        date.setDate(date.getDate() + totalExtraDays);
                        const dynamicDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                        const extraDaysHere = state.extraDays[state.segmentationData?.endCity || ''] || 0;

                        return (
                        <>
                      <div
                        style={{
                          padding: '1rem',
                          background: '#e3f2fd',
                          borderRadius: '6px',
                          border: '2px solid #2196F3',
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ fontWeight: 'bold', color: '#2196F3', fontSize: '0.85rem' }}>
                            Día {finalDayNumber}
                            <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal' }}>{dynamicDate}</div>
                          </div>
                          <div style={{ fontSize: '0.95rem', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span>{lastPoint.cityName || 'Cargando...'} → {state.segmentationData?.endCity}</span>
                            <button
                              onClick={() => addExtraDay(state.segmentationData?.endCity || '')}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: '#FF9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title="Añadir 1 día de estancia"
                            >
                              +1 día {extraDaysHere > 0 && `(${extraDaysHere})`}
                            </button>
                          </div>
                          <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#4CAF50', fontSize: '0.85rem' }}>
                            {(() => {
                              const totalFromServer = state.debugResponse?.dailyItinerary?.reduce((sum: number, day: any) => sum + day.distance, 0) || 0;
                              const calculatedSoFar = state.segmentationData?.points?.reduce((sum: number, p: any) => sum + p.distance, 0) || 0;
                              return (totalFromServer - calculatedSoFar).toFixed(0);
                            })()} km
                          </div>
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#666',
                          paddingLeft: '100px',
                          borderTop: '1px solid #bbdefb',
                          paddingTop: '0.5rem'
                        }}>
                          🏁 Etapa final hasta destino: <strong>{state.segmentationData.endCity}</strong>
                        </div>
                      </div>

                      {/* Días de estancia en destino final */}
                      {extraDaysHere > 0 && Array.from({ length: extraDaysHere }).map((_, extraIdx) => {
                        const baseDate = new Date(dynamicDate.split('/').reverse().join('-'));
                        baseDate.setDate(baseDate.getDate() + extraIdx + 1);
                        return (
                          <div
                            key={`stay-final-${extraIdx}`}
                            style={{
                              padding: '1rem',
                              background: '#FFF3E0',
                              borderRadius: '6px',
                              border: '2px dashed #FF9800',
                              marginTop: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px', gap: '0.75rem', alignItems: 'center' }}>
                              <div style={{ fontWeight: 'bold', color: '#FF9800', fontSize: '0.85rem' }}>
                                Día {finalDayNumber + extraIdx + 1}
                                <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal' }}>
                                  {baseDate.toLocaleDateString('es-ES')}
                                </div>
                              </div>
                              <div style={{ fontSize: '0.95rem', color: '#000', fontWeight: 'bold' }}>
                                🛏️ Estancia en {state.segmentationData?.endCity}
                              </div>
                              <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#999', fontSize: '0.85rem' }}>
                                0 km
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </>
            ) : state.debugResponse?.dailyItinerary ? (
              // Fallback: usar datos del servidor mientras se calculan los del mapa
              state.debugResponse.dailyItinerary.map((day: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '100px 1fr 100px',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          background: day.isDriving ? '#e3f2fd' : '#f5f5f5',
                          borderRadius: '6px',
                          border: day.isDriving ? '2px solid #2196F3' : '1px solid #ddd',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', color: '#2196F3', fontSize: '0.85rem' }}>
                          {day.date}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#000' }}>
                          <strong style={{ color: '#000' }}>Día {day.day}:</strong> {day.from} → {day.to}
                          {!day.isDriving && <span style={{ color: '#666', marginLeft: '0.5rem' }}>(no conducción)</span>}
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 'bold', color: day.isDriving ? '#4CAF50' : '#999', fontSize: '0.85rem' }}>
                          {day.distance.toFixed(1)} km
                        </div>
                      </div>
                ))
            ) : (
              <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                textAlign: 'center',
                color: '#666'
              }}>
                Calcula una ruta para ver el itinerario
              </div>
            )}
          </div>

            {/* 🆕 NUEVO ITINERARIO CON HOOK (para comparación) */}
            {dynamicItinerary.length > 0 && (
              <div style={{ marginTop: '2rem', border: '3px solid #4CAF50', borderRadius: '12px', padding: '1rem', background: '#f0fff0' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#4CAF50', fontSize: '1.2rem' }}>
                  🆕 NUEVO ITINERARIO (Hook Centralizado)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dynamicItinerary.map((day, idx) => (
                    <div
                      key={`dynamic-${idx}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '100px 1fr 100px',
                        gap: '0.75rem',
                        padding: '1rem',
                        background: day.type === 'driving' ? '#e3f2fd' : '#FFF3E0',
                        borderRadius: '6px',
                        border: day.type === 'driving' ? '2px solid #2196F3' : '2px dashed #FF9800',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: day.type === 'driving' ? '#2196F3' : '#FF9800', fontSize: '0.85rem' }}>
                        Día {day.dayNumber}
                        <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal' }}>
                          {day.date}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.95rem', color: '#000', fontWeight: 'bold' }}>
                        {day.type === 'stay' ? `🛏️ Estancia en ${day.stayCity}` : `${day.from} → ${day.to}`}
                        {day.isManualWaypoint && day.type === 'driving' && (
                          <span style={{
                            padding: '0.15rem 0.5rem',
                            background: '#2196F3',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            marginLeft: '0.5rem'
                          }}>
                            🔵 MANUAL
                          </span>
                        )}
                        {!day.isManualWaypoint && day.type === 'driving' && (
                          <span style={{
                            padding: '0.15rem 0.5rem',
                            background: '#4CAF50',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            marginLeft: '0.5rem'
                          }}>
                            🟢 SUGERIDO
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 'bold', color: day.type === 'driving' ? '#4CAF50' : '#999', fontSize: '0.85rem' }}>
                        {day.distance.toFixed(0)} km
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

      {/* TABLA DE TESTS - OCULTA TEMPORALMENTE */}
      {false && (
      <div style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#2196F3', fontSize: '1.5rem' }}>
            🧪 Tests de Consistencia - Registro de Resultados
          </h2>

          {/* Formulario de resultado del test actual */}
          {state.debugResponse?.dailyItinerary && (
            <div style={{
              background: '#e3f2fd',
              border: '2px solid #2196F3',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#000', fontSize: '1.2rem' }}>
                📝 Registrar resultado del test actual
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.85rem', color: '#000' }} title="Abre Google Maps, traza la ruta ciudad a ciudad y anota la distancia total que te muestra">
                    Google Total (km): ℹ️
                  </label>
                  <input
                    type="number"
                    id="googleTotal"
                    placeholder="Ej: 350"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      color: '#000'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.85rem', color: '#000' }} title="Distancia calculada por nuestro MOTOR desde el polyline de Google (automático del console log)">
                    Polyline Total (km): ℹ️
                  </label>
                  <input
                    type="text"
                    id="polylineTotal"
                    value={state.debugResponse?.totalDistance?.toFixed(1) || 'N/A'}
                    readOnly
                    title="Este valor se rellena automáticamente desde el resultado del servidor"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      background: '#f5f5f5',
                      color: '#000'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.85rem', color: '#000' }} title="Número de puntos de parada calculados por el MOTOR (automático)">
                    N° Paradas: ℹ️
                  </label>
                  <input
                    type="text"
                    value={state.segmentationData?.points?.length || state.debugResponse?.dailyItinerary?.length || 0}
                    readOnly
                    title="Este valor se rellena automáticamente del resultado"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      background: '#f5f5f5',
                      color: '#000'
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.85rem', color: '#000' }} title="Comentarios sobre la ruta: ¿ciudades lógicas? ¿buenos servicios? ¿algún problema?">
                  Observaciones: ℹ️
                </label>
                <textarea
                  id="observaciones"
                  placeholder="Ej: Ciudades con buenos servicios, ruta lógica, algún rodeo innecesario..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    color: '#000'
                  }}
                />
              </div>
              <button
                onClick={() => {
                  const googleTotal = (document.getElementById('googleTotal') as HTMLInputElement)?.value;
                  const polylineTotal = state.debugResponse?.totalDistance?.toFixed(1) || 'N/A';
                  const observaciones = (document.getElementById('observaciones') as HTMLTextAreaElement)?.value;
                  const nParadas = state.segmentationData?.points?.length || state.debugResponse?.dailyItinerary?.length || 0;

                  if (!googleTotal) {
                    alert('⚠️ Por favor introduce la distancia total de Google Maps');
                    return;
                  }

                  const diff = polylineTotal !== 'N/A' ? (((parseFloat(polylineTotal) - parseFloat(googleTotal)) / parseFloat(googleTotal)) * 100).toFixed(1) : 'N/A';

                  const ciudades = state.segmentationData?.points
                    ? state.segmentationData.points.map(p => p.cityName || 'Cargando...').join(', ')
                    : state.debugResponse?.dailyItinerary?.map((d: any) => d.to).join(', ') || '';

                  const timestamp = new Date().toLocaleString('es-ES');
                  const testNum = prompt('¿Número de test? (1-10)', '1');

                  const resultado = `Test ${testNum}: ${state.origen} → ${state.destino} (${state.kmMaximo} km/día)
Google Total: ${googleTotal} km
Polyline Total: ${polylineTotal} km
Diferencia: ${diff}%
N° Paradas: ${nParadas}
Ciudades: ${ciudades}
Observaciones: ${observaciones || 'Ninguna'}
Fecha: ${timestamp}

---

`;

                  // Copiar al portapapeles
                  navigator.clipboard.writeText(resultado);

                  // Descargar archivo
                  const blob = new Blob([resultado], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `test-${testNum}-${state.origen}-${state.destino}-${Date.now()}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);

                  alert('✅ Resultado:\n\n1️⃣ Copiado al portapapeles\n2️⃣ Descargado como archivo TXT\n\nPuedes pegarlo donde quieras o abrir el archivo descargado');
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#45a049')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#4CAF50')}
              >
                💾 Descargar resultado + Copiar al portapapeles
              </button>
            </div>
          )}

          <h3 style={{ margin: '1.5rem 0 1rem 0', color: '#000', fontSize: '1.2rem' }}>
            📊 Plan de Pruebas
          </h3>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.85rem'
          }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#000' }}>#</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#000' }}>Origen</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#000' }}>Destino</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>km/día</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: '#e3f2fd', borderBottom: '1px solid #ddd', color: '#000' }}>
                <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#000' }}>1</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Barcelona</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Valencia</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>300</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>🔵 ACTUAL</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd', color: '#000' }}>
                <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#000' }}>2</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Madrid</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Bilbao</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>300</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>⏳ Pendiente</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd', color: '#000' }}>
                <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#000' }}>3</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Sevilla</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Barcelona</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>300</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>⏳ Pendiente</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd', color: '#000' }}>
                <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#000' }}>4</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Lisboa</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Berlín</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>300</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>⏳ Pendiente</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd', color: '#000' }}>
                <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#000' }}>5</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Santander</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Porto</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>300</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>⏳ Pendiente</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd', color: '#000' }}>
                <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#000' }}>6</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Salamanca</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Zaragoza</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>300</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>⏳ Pendiente</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd', color: '#000' }}>
                <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#000' }}>7</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>París</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Ámsterdam</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>300</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>⏳ Pendiente</td>
              </tr>
              <tr style={{ background: '#fff3cd', borderTop: '2px solid #ffc107' }}>
                <td colSpan={5} style={{ padding: '0.5rem', fontWeight: 'bold', color: '#856404' }}>
                  Tests con Variación de km/día
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd', color: '#000' }}>
                <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#000' }}>8</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Salamanca</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>París</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>200</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>⏳ Pendiente</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd', color: '#000' }}>
                <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#000' }}>9</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Salamanca</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>París</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>300</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>⏳ Pendiente</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd', color: '#000' }}>
                <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#000' }}>10</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>Salamanca</td>
                <td style={{ padding: '0.75rem', color: '#000' }}>París</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>400</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#000' }}>⏳ Pendiente</td>
              </tr>
            </tbody>
          </table>
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            fontSize: '0.85rem',
            color: '#000'
          }}>
            <strong>📝 Instrucciones:</strong>
            <ol style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
              <li>Cambia origen/destino/km en los campos de búsqueda según el test</li>
              <li>Dale a <strong>🔄 Calcular</strong></li>
              <li>Abre Google Maps y mide la distancia total (ciudad a ciudad)</li>
              <li>Rellena el formulario arriba con la distancia de Google y observaciones</li>
              <li>Dale a <strong>💾 Descargar resultado</strong> - se descargará un archivo TXT automáticamente</li>
              <li>Los archivos se guardan en tu carpeta de Descargas con nombre: <code>test-[N]-[origen]-[destino].txt</code></li>
            </ol>
          </div>
        </div>
      </div>
      )}
      {/* FIN TABLA TESTS */}

      {state.error && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          background: '#f8d7da',
          color: '#721c24',
          padding: '1rem',
          borderRadius: '4px',
          border: '1px solid #f5c6cb',
          maxWidth: '300px',
          zIndex: 1000,
        }}>
          {state.error}
        </div>
      )}
    </div>
  );
}
