import { useState, useEffect } from 'react';
import { Coordinates, WeatherData } from '../types';

export function useWeather(coordinates: Coordinates | undefined, isoDate: string) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [weatherStatus, setWeatherStatus] = useState<'loading' | 'success' | 'far_future' | 'error'>('loading');

    useEffect(() => {
        if (!coordinates || !isoDate) return;

        const fetchWeather = async () => {
            setWeatherStatus('loading');
            const today = new Date();
            const tripDate = new Date(isoDate);
            const diffDays = Math.ceil((tripDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // Open-Meteo solo da previsión a 14-16 días
            if (diffDays < 0 || diffDays > 14) { 
                setWeatherStatus('far_future'); 
                return; 
            }

            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${isoDate}&end_date=${isoDate}`);
                const data = await res.json();
                
                if (data.daily) {
                    setWeather({ 
                        code: data.daily.weather_code[0], 
                        maxTemp: data.daily.temperature_2m_max[0], 
                        minTemp: data.daily.temperature_2m_min[0], 
                        rainProb: data.daily.precipitation_probability_max[0] 
                    });
                    setWeatherStatus('success');
                } else {
                    setWeatherStatus('error');
                }
            } catch (e) { 
                setWeatherStatus('error'); 
            }
        };

        fetchWeather();
    }, [coordinates, isoDate]);

    return { weather, weatherStatus };
}