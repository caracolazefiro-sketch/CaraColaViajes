'use client';

import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { DailyPlan } from '../types';

interface MotorMapProps {
  origen: string;
  destino: string;
  itinerary: DailyPlan[] | null;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = { lat: 40.416775, lng: -3.703790 }; // Centro España

export default function MotorMap({ origen, destino, itinerary }: MotorMapProps) {
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);

  useEffect(() => {
    if (!origen || !destino) return;

    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: origen,
        destination: destino,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirectionsResult(result);
          const newBounds = new google.maps.LatLngBounds();
          result.routes[0].bounds && newBounds.union(result.routes[0].bounds);
          setBounds(newBounds);
        }
      }
    );
  }, [origen, destino]);

  useEffect(() => {
    if (map && bounds) {
      map.fitBounds(bounds);
    }
  }, [map, bounds]);

  return (
    <div className="motor-map-container">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={6}
        onLoad={setMap}
        options={mapId ? { mapId } : undefined}
      >
        {directionsResult && (
          <DirectionsRenderer directions={directionsResult} />
        )}

        {/* Markers para origen y destino */}
        {origen && (
          <Marker
            position={{ lat: 0, lng: 0 }} // Placeholder, la ruta se dibuja con DirectionsRenderer
            title="Origen"
          />
        )}
      </GoogleMap>
    </div>
  );
}
