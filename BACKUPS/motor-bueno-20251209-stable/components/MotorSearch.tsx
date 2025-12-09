'use client';

import React, { useRef, useEffect } from 'react';
import { Autocomplete } from '@react-google-maps/api';

interface MotorSearchProps {
  origen: string;
  destino: string;
  fecha: string;
  kmMaximo: number;
  waypoints: string[];
  showWaypoints: boolean;
  onOrigenChange: (value: string) => void;
  onDestinoChange: (value: string) => void;
  onFechaChange: (value: string) => void;
  onKmMaximoChange: (value: number) => void;
  onShowWaypointsChange: (show: boolean) => void;
  onAddWaypoint: (waypoint: string) => void;
  onRemoveWaypoint: (index: number) => void;
  onMoveWaypointUp: (index: number) => void;
  onMoveWaypointDown: (index: number) => void;
  onCalculate: () => void;
  loading: boolean;
}

export default function MotorSearch({
  origen,
  destino,
  fecha,
  kmMaximo,
  waypoints,
  showWaypoints,
  onOrigenChange,
  onDestinoChange,
  onFechaChange,
  onKmMaximoChange,
  onShowWaypointsChange,
  onAddWaypoint,
  onRemoveWaypoint,
  onMoveWaypointUp,
  onMoveWaypointDown,
  onCalculate,
  loading,
}: MotorSearchProps) {
  const origenRef = useRef<any>(null);
  const destinoRef = useRef<any>(null);
  const waypointRef = useRef<any>(null);
  const [tempWaypoint, setTempWaypoint] = React.useState('');

  const handleOrigenChange = (field: 'origen' | 'destino') => {
    const ref = field === 'origen' ? origenRef : destinoRef;
    const place = ref.current?.getPlace();
    if (place && place.formatted_address) {
      if (field === 'origen') {
        onOrigenChange(place.formatted_address);
      } else {
        onDestinoChange(place.formatted_address);
      }
    }
  };

  return (
    <>
    <div className="motor-search-compact">
      <span style={{ fontSize: '1rem', fontWeight: 'bold', marginRight: '0.5rem' }}>🚗</span>

      <Autocomplete
        onLoad={ref => (origenRef.current = ref)}
        onPlaceChanged={() => handleOrigenChange('origen')}
        options={{ types: ['(cities)'] }}
      >
        <input
          type="text"
          value={origen}
          onChange={(e) => onOrigenChange(e.target.value)}
          placeholder="Origen"
          className="motor-input-compact"
        />
      </Autocomplete>

      <span style={{ margin: '0 0.5rem', color: '#999' }}>→</span>

      <Autocomplete
        onLoad={ref => (destinoRef.current = ref)}
        onPlaceChanged={() => handleOrigenChange('destino')}
        options={{ types: ['(cities)'] }}
      >
        <input
          type="text"
          value={destino}
          onChange={(e) => onDestinoChange(e.target.value)}
          placeholder="Destino"
          className="motor-input-compact"
        />
      </Autocomplete>

      <input
        type="date"
        value={fecha}
        onChange={(e) => onFechaChange(e.target.value)}
        className="motor-input-date"
        style={{ width: '140px', marginLeft: '0.5rem' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
        <input
          type="number"
          value={kmMaximo}
          onChange={(e) => onKmMaximoChange(Number(e.target.value))}
          placeholder="300"
          min="50"
          max="1000"
          className="motor-input-km"
          style={{ width: '70px' }}
        />
        <span style={{ marginLeft: '0.25rem', fontSize: '0.85rem', color: '#666' }}>km/día</span>
      </div>

      {/* 🛏️ Checkbox Pernoctas */}
      <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={showWaypoints}
          onChange={(e) => onShowWaypointsChange(e.target.checked)}
          id="showWaypoints"
          style={{ cursor: 'pointer' }}
        />
        <label htmlFor="showWaypoints" style={{ marginLeft: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', color: '#000', fontWeight: '500' }}>
          🛏️ Pernoctas
        </label>
      </div>
    </div>

    {/* 🛏️ UI de Pernoctas */}
    {showWaypoints && (
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        background: '#fff3cd',
        borderRadius: '6px',
        border: '2px solid #ffc107'
      }}>
        {waypoints.length === 0 && (
          <div style={{
            marginBottom: '0.75rem',
            padding: '0.75rem',
            background: '#fff',
            borderRadius: '4px',
            border: '1px solid #ffc107',
            fontSize: '0.9rem',
            color: '#856404',
            fontWeight: '500'
          }}>
            💡 <strong>Tip:</strong> ¿Tienes ciudades obligatorias en tu ruta? Añádelas aquí ANTES de configurar para evitar llamadas extra.
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Autocomplete
            onLoad={ref => (waypointRef.current = ref)}
            onPlaceChanged={() => {
              const place = waypointRef.current?.getPlace();
              if (place && place.formatted_address) {
                onAddWaypoint(place.formatted_address);
                setTempWaypoint('');
              }
            }}
            options={{ types: ['(cities)'] }}
          >
            <input
              type="text"
              value={tempWaypoint}
              onChange={(e) => setTempWaypoint(e.target.value)}
              placeholder="Añadir ciudad..."
              className="motor-input-compact"
              style={{ flex: 1 }}
            />
          </Autocomplete>
          <button
            onClick={() => {
              if (tempWaypoint.trim()) {
                onAddWaypoint(tempWaypoint);
                setTempWaypoint('');
              }
            }}
            disabled={!tempWaypoint.trim()}
            style={{
              padding: '0.5rem 1rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              opacity: tempWaypoint.trim() ? 1 : 0.5
            }}
          >
            ➕
          </button>
        </div>

        {waypoints.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {waypoints.map((waypoint, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  background: 'white',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}
              >
                {/* Botones mover */}
                <button
                  onClick={() => onMoveWaypointUp(index)}
                  disabled={index === 0}
                  title="Mover arriba"
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    opacity: index === 0 ? 0.3 : 1
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={() => onMoveWaypointDown(index)}
                  disabled={index === waypoints.length - 1}
                  title="Mover abajo"
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    opacity: index === waypoints.length - 1 ? 0.3 : 1
                  }}
                >
                  ↓
                </button>

                {/* Nombre ciudad */}
                <span style={{ flex: 1, fontSize: '0.9rem', color: '#000', fontWeight: '500' }}>{waypoint}</span>

                {/* Botón eliminar */}
                <button
                  onClick={() => onRemoveWaypoint(index)}
                  title="Eliminar"
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {waypoints.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6c757d', fontSize: '0.85rem', padding: '0.5rem', marginTop: '0.5rem' }}>
            Sin pernoctas configuradas. Añade ciudades si quieres paradas obligatorias.
          </div>
        )}

        {waypoints.length > 0 && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.5rem',
            background: '#d4edda',
            borderRadius: '4px',
            fontSize: '0.85rem',
            color: '#155724',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            ✅ {waypoints.length} pernocta{waypoints.length > 1 ? 's' : ''} configurada{waypoints.length > 1 ? 's' : ''}. Click 🛠️ para configurar ruta.
          </div>
        )}
      </div>
    )}

    {/* 🔄 BOTÓN CALCULAR - SIEMPRE VISIBLE AL FINAL */}
    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
      <button
        onClick={onCalculate}
        disabled={loading || !origen || !destino}
        style={{
          padding: '0.75rem 2rem',
          background: loading ? '#6c757d' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          cursor: loading || !origen || !destino ? 'not-allowed' : 'pointer',
          opacity: loading || !origen || !destino ? 0.6 : 1,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!loading && origen && destino) {
            e.currentTarget.style.background = '#0056b3';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.background = '#007bff';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          }
        }}
      >
        {loading ? '⏳ Configurando...' : '🛠️ CONFIGURAR VIAJE'}
      </button>
    </div>
    </>
  );
}
