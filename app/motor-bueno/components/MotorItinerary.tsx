'use client';

import React from 'react';
import type { DynamicDay } from '../hooks/useDynamicItinerary';

interface MotorItineraryProps {
  itinerary: DynamicDay[];
  startCity: string;
  endCity: string;
  totalDistance: number;
  onAddExtraDay: (cityName: string) => void;
}

export default function MotorItinerary({
  itinerary,
  startCity,
  endCity,
  totalDistance,
  onAddExtraDay
}: MotorItineraryProps) {
  if (itinerary.length === 0) {
    return (
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
    );
  }

  return (
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
            {startCity} → {endCity}
          </div>
        </div>
        <div style={{
          textAlign: 'right',
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#fff',
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
        }}>
          {totalDistance.toFixed(1)} km
        </div>
      </div>

      {/* Lista de días */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {itinerary.map((day) => (
          <div
            key={`day-${day.dayNumber}`}
            style={{
              padding: '1rem',
              background: day.type === 'driving' ? '#e3f2fd' : '#FFF3E0',
              borderRadius: '6px',
              border: day.type === 'driving' ? '2px solid #2196F3' : '2px dashed #FF9800',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 'bold', color: day.type === 'driving' ? '#2196F3' : '#FF9800', fontSize: '0.85rem' }}>
                Día {day.dayNumber}
                <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'normal' }}>
                  {day.date}
                </div>
              </div>
              <div style={{ fontSize: '0.95rem', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {day.type === 'stay' ? (
                  <span>🛏️ Estancia en {day.stayCity}</span>
                ) : (
                  <>
                    <span>{day.from} → {day.to}</span>
                    {day.isManualWaypoint ? (
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
                    {/* Botón +1 día solo en días de conducción */}
                    <button
                      onClick={() => onAddExtraDay(day.cityName)}
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
                    >
                      +1 día
                    </button>
                  </>
                )}
              </div>
              <div style={{ textAlign: 'right', fontWeight: 'bold', color: day.type === 'driving' ? '#4CAF50' : '#999', fontSize: '0.85rem' }}>
                {day.distance.toFixed(0)} km
              </div>
            </div>

            {/* Información adicional para días de conducción */}
            {day.type === 'driving' && (
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem', paddingLeft: '100px' }}>
                📍 Distancia {day.isManualWaypoint ? 'acumulada' : 'real'} por carretera hasta {day.to}: {day.distance.toFixed(0)} km
                <br />
                {!day.isManualWaypoint && (
                  <span>(Punto de corte cada 300 km, ciudad en ruta a {day.distance.toFixed(0)} km del origen)</span>
                )}
                {day.isManualWaypoint && (
                  <span>(Segmento aproximado: ~{day.distance.toFixed(0)} km desde punto anterior)</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
