// app/share/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../supabase';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker, InfoWindow } from '@react-google-maps/api';
import { MARKER_ICONS, ICONS_ITINERARY } from '../../constants';
import { PlaceWithDistance, DailyPlan, ServiceType } from '../../types';

const containerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
const center = { lat: 40.416775, lng: -3.703790 };
const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"]; 

// Estilos simples para la vista pública
const IconCopy = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>);

export default function SharedTripPage() {
    const params = useParams();
    const router = useRouter();
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: LIBRARIES,
        language: 'es'
    });

    const [trip, setTrip] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
    const [activeDay, setActiveDay] = useState<number | null>(null);

    useEffect(() => {
        const fetchTrip = async () => {
            if (!params.id) return;
            
            // Pedir el viaje a Supabase
            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error || !data) {
                setError("Este viaje no existe o es privado. Pídele al autor que lo haga público.");
                setLoading(false);
                return;
            }

            // --- EL PORTERO DE DISCOTECA PÚBLICO ---
            // Filtramos sitios CUSTOM que no estén marcados como públicos
            const sanitizedItinerary = data.trip_data.results.dailyItinerary.map((day: DailyPlan) => ({
                ...day,
                savedPlaces: day.savedPlaces?.filter(p => {
                    // Si no es custom, pasa siempre.
                    if (p.type !== 'custom') return true;
                    // Si es custom, SOLO pasa si isPublic es true.
                    return p.isPublic === true;
                }) || []
            }));

            // Actualizamos los datos con la versión limpia
            data.trip_data.results.dailyItinerary = sanitizedItinerary;
            setTrip(data);
            setLoading(false);
            
            // Calcular ruta para el mapa
            calculateRouteForMap(data.trip_data.formData, data.trip_data.results.dailyItinerary);
        };

        fetchTrip();
    }, [params.id]);

    const calculateRouteForMap = async (formData: any, itinerary: any) => {
        if (typeof google === 'undefined') return;
        const directionsService = new google.maps.DirectionsService();
        
        const waypoints = itinerary
            .filter((day: any) => day.type === 'tactical')
            .map((day: any) => ({ location: day.coordinates, stopover: true }));

        try {
            const result = await directionsService.route({
                origin: formData.origen,
                destination: formData.destino,
                waypoints: waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
                avoidTolls: formData.evitarPeajes,
            });
            setDirectionsResponse(result);
        } catch (e) { console.error("Error mapa share", e); }
    };

    const handleCloneTrip = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert("Necesitas registrarte en CaraCola para copiar este viaje.");
            router.push('/'); 
            return;
        }

        if (confirm(`¿Quieres copiar el viaje "${trip.name}" a tu cuenta?`)) {
            const newName = `Copia de ${trip.name}`;
            const { error } = await supabase.from('trips').insert([{ 
                    name: newName, 
                    trip_data: trip.trip_data, 
                    user_id: session.user.id 
                }]);

            if (error) alert("Error al copiar: " + error.message);
            else {
                alert("✅ ¡Viaje copiado! Ahora lo tienes en 'Mis Viajes'.");
                router.push('/'); 
            }
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen text-red-600 font-bold animate-pulse">Cargando ruta... 🐌</div>;
    if (error) return <div className="flex flex-col justify-center items-center h-screen gap-4"><p className="text-gray-500 font-bold">{error}</p><a href="/" className="text-blue-500 underline">Volver al inicio</a></div>;
    if (!isLoaded) return null;

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 font-sans text-gray-900">
            <div className="w-full max-w-6xl space-y-6">
                
                {/* HEADER COMPARTIDO */}
                <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-red-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-2">Ruta Compartida</p>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-2">{trip.name}</h1>
                    <div className="flex justify-center gap-4 text-gray-500 text-xs mb-6 font-mono">
                        <span>🗓️ {trip.trip_data.results.totalDays} Días</span>
                        <span>📍 {Math.round(trip.trip_data.results.distanceKm)} km</span>
                    </div>
                    
                    <button onClick={handleCloneTrip} className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:bg-black transform hover:-translate-y-0.5 transition flex items-center gap-2 mx-auto">
                        <IconCopy /> COPIAR A MIS VIAJES
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* MAPA READ-ONLY */}
                    <div className="lg:col-span-2 h-[500px] bg-gray-200 rounded-xl shadow-lg overflow-hidden border-4 border-white relative">
                        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={6} onLoad={map => { setMap(map); if (directionsResponse) map.fitBounds(directionsResponse.routes[0].bounds); }}>
                            {directionsResponse && <DirectionsRenderer directions={directionsResponse} options={{ polylineOptions: { strokeColor: "#DC2626", strokeWeight: 4 } }} />}
                            
                            {/* PINTAMOS SOLO LOS SITIOS DEL DÍA ACTIVO (O TODOS SI NO HAY SELECCIÓN) */}
                            {trip.trip_data.results.dailyItinerary.map((day: any, dIdx: number) => (
                                (activeDay === null || activeDay === dIdx) && day.savedPlaces?.map((spot: any, i: number) => (
                                    spot.geometry?.location && (
                                        <Marker 
                                            key={`${dIdx}-${i}`}
                                            position={spot.geometry.location}
                                            icon={MARKER_ICONS[spot.type] || MARKER_ICONS.custom}
                                            title={spot.name}
                                        />
                                    )
                                ))
                            ))}
                        </GoogleMap>
                    </div>

                    {/* LISTA DE DÍAS */}
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-[500px] overflow-y-auto">
                        <div className="p-4 space-y-4">
                            <h3 className="font-bold text-gray-700 text-sm border-b pb-2">Itinerario Detallado</h3>
                            {trip.trip_data.results.dailyItinerary.map((day: DailyPlan, index: number) => (
                                <div 
                                    key={index} 
                                    onClick={() => setActiveDay(index)}
                                    className={`border rounded-lg p-3 cursor-pointer transition-all ${activeDay === index ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-red-700 text-sm">Día {day.day}</span>
                                        <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border">{day.distance.toFixed(0)} km</span>
                                    </div>
                                    <div className="text-xs text-gray-800 mb-2">
                                        {day.from.split('|')[0]} ➝ {day.to.replace('📍 Parada Táctica: ', '').split('|')[0]}
                                    </div>
                                    
                                    {/* SITIOS GUARDADOS (YA FILTRADOS POR EL USEEFFECT) */}
                                    {day.savedPlaces && day.savedPlaces.length > 0 ? (
                                        <div className="space-y-1 mt-2 pt-2 border-t border-red-100">
                                            {day.savedPlaces.map((place, i) => (
                                                <div key={i} className="flex items-center gap-1 text-[10px] text-green-800">
                                                    <span className="text-base">
                                                        {place.type === 'camping' ? '🚐' : 
                                                         place.type === 'restaurant' ? '🍳' : 
                                                         place.type === 'custom' ? '⭐' : '📍'}
                                                    </span>
                                                    <span className="truncate">{place.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[9px] text-gray-400 italic mt-1">Sin paradas públicas.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}