// app/share/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker, InfoWindow } from '@react-google-maps/api';
// Importamos desde dos niveles arriba (../../)
import { supabase } from '../../supabase'; 
import { MARKER_ICONS, ICONS_ITINERARY } from '../../constants';
import { PlaceWithDistance, DailyPlan, ServiceType } from '../../types';
// --- NUEVOS ICONOS LUCIDE ---
import { Copy } from 'lucide-react';
// ----------------------------

const containerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
const center = { lat: 40.416775, lng: -3.703790 };
const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"]; 

export default function SharedTripPage() {
    const params = useParams(); // Recupera el ID de la URL (ej: 15)
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
    const [hoveredPlace, setHoveredPlace] = useState<PlaceWithDistance | null>(null);

    useEffect(() => {
        const fetchTrip = async () => {
            if (!params.id) return;
            
            // 1. Pedir el viaje a Supabase
            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error || !data) {
                setError("Este viaje no existe, ha sido borrado o es privado.");
                setLoading(false);
                return;
            }

            // --- 2. EL SANITIZER (PROTOCOLO TÍA PEPITA) ---
            // Filtramos los sitios para proteger la privacidad
            const sanitizedItinerary = data.trip_data.results.dailyItinerary.map((day: DailyPlan) => ({
                ...day,
                savedPlaces: day.savedPlaces?.filter(p => {
                    // Si NO es custom, se muestra siempre (Gasolinera, Camping...)
                    if (p.type !== 'custom') return true;
                    // Si ES custom, SOLO se muestra si el usuario marcó "Hacer público"
                    return p.isPublic === true;
                }) || []
            }));

            // Actualizamos los datos locales con la versión limpia
            data.trip_data.results.dailyItinerary = sanitizedItinerary;
            
            setTrip(data);
            setLoading(false);
            
            // Calcular la línea azul del mapa
            calculateRouteForMap(data.trip_data.formData, data.trip_data.results.dailyItinerary);
        };

        fetchTrip();
    }, [params.id]);

    const calculateRouteForMap = async (formData: any, itinerary: any) => {
        if (typeof google === 'undefined') return;
        const directionsService = new google.maps.DirectionsService();
        
        // Reconstruir waypoints
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
            // Si no está logueado, le mandamos a la home para que entre
            if(confirm("Necesitas tener una cuenta en CaraCola para copiar este viaje.\n\n¿Ir a la página principal para entrar/registrarte?")) {
                router.push('/'); 
            }
            return;
        }

        if (confirm(`¿Quieres copiar el viaje "${trip.name}" a tu colección de 'Mis Viajes'?`)) {
            const newName = `Copia de ${trip.name}`;
            
            // Insertamos la copia en SU cuenta
            const { error } = await supabase
                .from('trips')
                .insert([{ 
                    name: newName, 
                    trip_data: trip.trip_data, 
                    user_id: session.user.id 
                }]);

            if (error) {
                alert("Error al copiar: " + error.message);
            } else {
                alert("✅ ¡Viaje copiado! Ya es tuyo.");
                router.push('/'); // Le llevamos a su panel
            }
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen text-red-600 font-bold animate-pulse">Cargando ruta compartida... 🐌</div>;
    if (error) return <div className="flex flex-col justify-center items-center h-screen gap-4"><p className="text-gray-500 font-bold">{error}</p><a href="/" className="text-blue-500 underline">Volver al inicio</a></div>;
    if (!isLoaded) return null;

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 font-sans text-gray-900">
            <div className="w-full max-w-6xl space-y-6">
                
                {/* HEADER PÚBLICO (Bonito y limpio) */}
                <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-red-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                    <div className="flex justify-center mb-2">
                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Ruta Compartida</span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-2">{trip.name}</h1>
                    <div className="flex justify-center gap-4 text-gray-500 text-xs mb-6 font-mono">
                        <span className="flex items-center gap-1">🗓️ {trip.trip_data.results.totalDays} Días</span>
                        <span className="flex items-center gap-1">📍 {Math.round(trip.trip_data.results.distanceKm)} km</span>
                    </div>
                    
                    <button 
                        onClick={handleCloneTrip}
                        className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg hover:bg-black transform hover:-translate-y-0.5 transition flex items-center gap-2 mx-auto"
                    >
                        <Copy className="h-5 w-5" /> COPIAR A MIS VIAJES
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* MAPA (SOLO LECTURA) */}
                    <div className="lg:col-span-2 h-[500px] bg-gray-200 rounded-xl shadow-lg overflow-hidden border-4 border-white relative">
                        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={6} onLoad={map => { setMap(map); if (directionsResponse) map.fitBounds(directionsResponse.routes[0].bounds); }}>
                            {directionsResponse && <DirectionsRenderer directions={directionsResponse} options={{ polylineOptions: { strokeColor: "#DC2626", strokeWeight: 4 } }} />}
                            
                            {/* Pintamos los marcadores del día activo (o todos si no hay selección) */}
                            {trip.trip_data.results.dailyItinerary.map((day: any, dIdx: number) => (
                                (activeDay === null || activeDay === dIdx) && day.savedPlaces?.map((spot: any, i: number) => (
                                    spot.geometry?.location && (
                                        <Marker 
                                            key={`${dIdx}-${i}`}
                                            position={spot.geometry.location}
                                            icon={{
                                                url: MARKER_ICONS[spot.type] || MARKER_ICONS.custom,
                                                scaledSize: new window.google.maps.Size(30, 30)
                                            }}
                                            onClick={() => setHoveredPlace(spot)}
                                        />
                                    )
                                ))
                            ))}

                            {hoveredPlace && hoveredPlace.geometry?.location && (
                                <InfoWindow position={hoveredPlace.geometry.location} onCloseClick={() => setHoveredPlace(null)}>
                                    <div className="p-1">
                                        <h6 className="font-bold text-sm">{hoveredPlace.name}</h6>
                                        <p className="text-xs text-gray-500">{hoveredPlace.vicinity}</p>
                                    </div>
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    </div>

                    {/* LISTA DE DÍAS (RESUMEN) */}
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-[500px] overflow-y-auto">
                        <div className="p-4 space-y-4">
                            <h3 className="font-bold text-gray-700 text-sm border-b pb-2 sticky top-0 bg-white z-10">Itinerario Detallado</h3>
                            {trip.trip_data.results.dailyItinerary.map((day: DailyPlan, index: number) => (
                                <div 
                                    key={index} 
                                    onClick={() => setActiveDay(index === activeDay ? null : index)}
                                    className={`border rounded-lg p-3 cursor-pointer transition-all ${activeDay === index ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-red-700 text-sm">Día {day.day}</span>
                                        <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border">{day.distance.toFixed(0)} km</span>
                                    </div>
                                    <div className="text-xs text-gray-800 mb-2">
                                        {day.from.split('|')[0]} ➝ {day.to.replace('📍 Parada Táctica: ', '').split('|')[0]}
                                    </div>
                                    
                                    {/* SITIOS (YA FILTRADOS) */}
                                    {day.savedPlaces && day.savedPlaces.length > 0 ? (
                                        <div className="space-y-1 mt-2 pt-2 border-t border-red-100">
                                            {day.savedPlaces.map((place, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px] text-green-800">
                                                    <span className="text-base">
                                                        {place.type === 'camping' ? '🚐' : 
                                                         place.type === 'restaurant' ? '🍳' : 
                                                         place.type === 'water' ? '💧' :
                                                         place.type === 'gas' ? '⛽' :
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