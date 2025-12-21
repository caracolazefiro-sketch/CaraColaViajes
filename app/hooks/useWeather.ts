import { useState, useEffect } from 'react';
import { Coordinates, WeatherData } from '../types';
import { apiLogger } from '../utils/api-logger';

interface RouteWeather {
    start?: WeatherData;
    end?: WeatherData;
    summary: 'good' | 'caution' | 'danger' | 'unknown';
}

function pad2(n: number) {
    return String(n).padStart(2, '0');
}

function normalizeToDateOnly(input: string): string | null {
    const raw = String(input || '').trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.slice(0, 10);
    const d = new Date(raw);
    if (!Number.isFinite(d.getTime())) return null;
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
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
        const dateOnly = normalizeToDateOnly(isoDate);
        if (!dateOnly) return;

        const fetchPoint = async (lat: number, lng: number): Promise<WeatherData | null> => {
            try {
                // Añadimos wind_speed_10m_max a la petición
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto&start_date=${dateOnly}&end_date=${dateOnly}`;
                
                // 🔍 Timing de Weather API
                const weatherStartTime = performance.now();
                const res = await fetch(url);
                const data = await res.json().catch(() => null);
                const weatherEndTime = performance.now();
                const weatherDuration = weatherEndTime - weatherStartTime;
                
                // 🔍 Log de Weather API
                apiLogger.logWeather({ lat, lng, date: dateOnly }, { ok: res.ok, status: res.status, data }, weatherDuration);

                if (!res.ok || !data || !data.daily) {
                    return null;
                }
                
                return {
                    code: data.daily.weather_code[0],
                    maxTemp: data.daily.temperature_2m_max[0],
                    minTemp: data.daily.temperature_2m_min[0],
                    rainProb: data.daily.precipitation_probability_max[0],
                    windSpeed: data.daily.wind_speed_10m_max?.[0] || 0 // Velocidad viento
                };
            } catch (e) { console.error(e); }
            return null;
        };

        const fetchAll = async () => {
            setWeatherStatus('loading');
            const today = new Date();
            const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const [yy, mm, dd] = dateOnly.split('-').map((v) => Number(v));
            const tripMidnight = new Date(yy, (mm || 1) - 1, dd || 1);
            const diffDays = Math.ceil((tripMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

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
                    // Viento > 50km/h o Lluvia > 80% o Nieve (códigos 71-77, 85-86)
                    const isSnow = (w.code >= 71 && w.code <= 77) || w.code === 85 || w.code === 86;
                    if (w.windSpeed > 50 || w.rainProb > 80 || isSnow) return 'danger';
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