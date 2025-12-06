'use client';

import React from 'react';
import { DailyPlan } from '../../types';

interface MotorItineraryProps {
  itinerary: DailyPlan[] | null;
  loading?: boolean;
}

export default function MotorItinerary({ itinerary, loading }: MotorItineraryProps) {
  if (loading) {
    return <div className="motor-itinerary-loading">Calculando ruta...</div>;
  }

  if (!itinerary || itinerary.length === 0) {
    return <div className="motor-itinerary-empty">Introduce origen y destino para ver la ruta</div>;
  }

  const totalKm = itinerary.reduce((sum, day) => sum + day.distance, 0);
  const totalDays = itinerary.length;

  return (
    <div className="motor-itinerary">
      <div className="motor-itinerary-header">
        <h3>Itinerario</h3>
        <div className="motor-itinerary-summary">
          <span>{totalDays} días • {totalKm.toFixed(0)} km</span>
        </div>
      </div>

      <div className="motor-itinerary-table">
        <div className="motor-itinerary-row motor-itinerary-thead">
          <div className="col-day">Día</div>
          <div className="col-from">De</div>
          <div className="col-to">A</div>
          <div className="col-km">Km</div>
        </div>

        {itinerary.map((day, index) => (
          <div key={index} className="motor-itinerary-row">
            <div className="col-day">{day.day}</div>
            <div className="col-from">{day.from}</div>
            <div className="col-to">{day.to}</div>
            <div className="col-km">{day.distance.toFixed(0)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
