import { useState, useEffect } from 'react';
import { Coordinates, WeatherData } from '../types';
import { apiLogger } from '../utils/api-logger';

interface RouteWeather {
    start?: WeatherData;
    end?: WeatherData;
    summary: 'good' | 'caution' | 'danger' | 'unknown';
}

export function useWeather(
    endCoords: Coordinates | undefined, 
    isoDate: string,
    startCoords?: Coordinates // Opcional: Coordenadas de salida
) {
    const [weather, setWeather] = useState<WeatherData | null>(null); // Clima destino (compatible con v1)
    const [routeWeather, setRouteWeather] = useState<RouteWeather | null>(null); // Clima ruta (v2)
    const [weatherStatus, setWeatherStatus] = useState<'loading' | 'success' | 'far_future' | 'error'>('loading');

    useEffect(() => {
        if (!endCoords || !isoDate) return;

        const fetchPoint = async (lat: number, lng: number): Promise<WeatherData | null> => {
            try {
                // Añadimos wind_speed_10m_max a la petición
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto&start_date=${isoDate}&end_date=${isoDate}`;
                
                // 🔍 Timing de Weather API
                const weatherStartTime = performance.now();
                const res = await fetch(url);
                const data = await res.json();
                const weatherEndTime = performance.now();
                const weatherDuration = weatherEndTime - weatherStartTime;
                
                // 🔍 Log de Weather API
                apiLogger.logWeather({ lat, lng, date: isoDate }, data, weatherDuration);
                
                if (data.daily) {
                    return {
                        code: data.daily.weather_code[0],
                        maxTemp: data.daily.temperature_2m_max[0],
                        minTemp: data.daily.temperature_2m_min[0],
                        rainProb: data.daily.precipitation_probability_max[0],
                        windSpeed: data.daily.wind_speed_10m_max[0] || 0 // Velocidad viento
                    };
                }
            } catch (e) { console.error(e); }
            return null;
        };

        const fetchAll = async () => {
            setWeatherStatus('loading');
            const today = new Date();
            const tripDate = new Date(isoDate);
            const diffDays = Math.ceil((tripDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays < 0 || diffDays > 14) {
                setWeatherStatus('far_future');
                return;
            }

            // 1. Pedir Destino (Siempre)
            const endData = await fetchPoint(endCoords.lat, endCoords.lng);
            
            // 2. Pedir Origen (Si existe y es diferente, para ahorrar)
            let startData = null;
            if (startCoords && (Math.abs(startCoords.lat - endCoords.lat) > 0.1 || Math.abs(startCoords.lng - endCoords.lng) > 0.1)) {
                startData = await fetchPoint(startCoords.lat, startCoords.lng);
            }

            if (endData) {
                setWeather(endData);
                
                // Determinar riesgo global
                const checkRisk = (w: WeatherData) => {
                    // Viento > 40km/h o Lluvia > 80% o Nieve (códigos 71-77, 85-86)
                    if (w.windSpeed > 40 || w.rainProb > 80 || (w.code >= 71 && w.code <= 77)) return 'danger';
                    // Viento > 25km/h o Lluvia > 40%
                    if (w.windSpeed > 25 || w.rainProb > 40) return 'caution';
                    return 'good';
                };

                const endRisk = checkRisk(endData);
                const startRisk = startData ? checkRisk(startData) : 'good';
                
                // El riesgo del día es el peor de los dos
                const finalRisk = (startRisk === 'danger' || endRisk === 'danger') ? 'danger' : 
                                  (startRisk === 'caution' || endRisk === 'caution') ? 'caution' : 'good';

                setRouteWeather({
                    start: startData || undefined,
                    end: endData,
                    summary: finalRisk
                });
                
                setWeatherStatus('success');
            } else {
                setWeatherStatus('error');
            }
        };

        fetchAll();
    }, [endCoords, startCoords, isoDate]);

    return { weather, routeWeather, weatherStatus };
}