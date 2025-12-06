'use client';

import React from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useMotor } from './hooks/useMotor';
import MotorSearch from './components/MotorSearch';
import MotorMap from './components/MotorMap';
import MotorItinerary from './components/MotorItinerary';
import './styles/motor.css';

const googleMapsLibraries: ('places' | 'geometry' | 'drawing' | 'visualization')[] = ['places'];

export default function MotorPage() {
  const { state, setOrigen, setDestino, calculate, setLoading, setError } = useMotor();

  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: googleMapsLibraries,
  });

  if (!isGoogleMapsLoaded) {
    return <div className="motor-page" style={{ textAlign: 'center', padding: '2rem' }}>Cargando Google Maps...</div>;
  }

  return (
    <div className="motor-page">
      <div className="motor-container">
        {/* Left Panel: Search + Itinerary */}
        <div className="motor-itinerary-wrapper">
          <MotorSearch
            origen={state.origen}
            destino={state.destino}
            onOrigenChange={setOrigen}
            onDestinoChange={setDestino}
            onCalculate={calculate}
            loading={state.loading}
          />
          <MotorItinerary itinerary={state.itinerary} loading={state.loading} />
        </div>

        {/* Right Panel: Map */}
        <MotorMap
          origen={state.origen}
          destino={state.destino}
          itinerary={state.itinerary}
        />
      </div>

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
