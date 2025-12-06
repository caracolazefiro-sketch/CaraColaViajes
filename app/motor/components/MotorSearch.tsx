'use client';

import React, { useRef, useEffect } from 'react';
import { Autocomplete } from '@react-google-maps/api';

interface MotorSearchProps {
  origen: string;
  destino: string;
  onOrigenChange: (value: string) => void;
  onDestinoChange: (value: string) => void;
  onCalculate: () => void;
  loading: boolean;
}

export default function MotorSearch({
  origen,
  destino,
  onOrigenChange,
  onDestinoChange,
  onCalculate,
  loading,
}: MotorSearchProps) {
  const origenRef = useRef<any>(null);
  const destinoRef = useRef<any>(null);

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      onCalculate();
    }
  };

  return (
    <div className="motor-search">
      <h2>🚗 MOTOR - Búsqueda</h2>
      
      <div className="motor-search-inputs">
        <div className="motor-input-group">
          <label>📍 Origen</label>
          <Autocomplete 
            onLoad={ref => (origenRef.current = ref)} 
            onPlaceChanged={() => handleOrigenChange('origen')}
            options={{ types: ['(cities)'] }}
          >
            <input
              type="text"
              value={origen}
              onChange={(e) => onOrigenChange(e.target.value)}
              placeholder="Ej: Salamanca, España"
              className="motor-input"
              onKeyPress={handleKeyPress}
            />
          </Autocomplete>
        </div>

        <div className="motor-input-group">
          <label>📍 Destino</label>
          <Autocomplete 
            onLoad={ref => (destinoRef.current = ref)} 
            onPlaceChanged={() => handleOrigenChange('destino')}
            options={{ types: ['(cities)'] }}
          >
            <input
              type="text"
              value={destino}
              onChange={(e) => onDestinoChange(e.target.value)}
              placeholder="Ej: Barcelona, España"
              className="motor-input"
              onKeyPress={handleKeyPress}
            />
          </Autocomplete>
        </div>

        <button
          onClick={onCalculate}
          disabled={loading || !origen || !destino}
          className={`motor-button ${loading ? 'loading' : ''}`}
        >
          {loading ? '⏳ Calculando...' : '🔄 Calcular Ruta'}
        </button>
      </div>
    </div>
  );
}
