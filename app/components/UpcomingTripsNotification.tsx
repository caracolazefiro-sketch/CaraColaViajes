'use client';

import React, { useEffect, useState } from 'react';
import { X, Calendar, MapPin } from 'lucide-react';
import { supabase } from '../supabase';

interface UpcomingTrip {
    id: number;
    name: string;
    trip_data: {
        formData: {
            fechaInicio: string;
            origen: string;
            destino: string;
        };
    };
    daysUntil: number;
}

interface UpcomingTripsNotificationProps {
    onLoadTrip?: (tripId: number) => void;
}

const UpcomingTripsNotification: React.FC<UpcomingTripsNotificationProps> = ({ onLoadTrip }) => {
    const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [sessionChecked, setSessionChecked] = useState(0); // Contador para forzar re-check

    useEffect(() => {
        const checkUpcomingTrips = async () => {
            if (!supabase) return;
            
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Verificar si fue cerrada en esta sesión (no por día, sino por sesión)
            const dismissedInSession = sessionStorage.getItem('upcomingTripsDismissed');
            if (dismissedInSession === 'true') return;

            try {
                const { data: trips, error } = await supabase
                    .from('trips')
                    .select('id, name, trip_data')
                    .eq('user_id', session.user.id);

                if (error || !trips) return;

                const now = new Date();
                const in15Days = new Date();
                in15Days.setDate(in15Days.getDate() + 15);

                const upcoming = trips
                    .map((trip) => {
                        const startDate = new Date(trip.trip_data?.formData?.fechaInicio);
                        const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return {
                            id: trip.id,
                            name: trip.name,
                            trip_data: trip.trip_data,
                            daysUntil,
                        };
                    })
                    .filter((trip) => trip.daysUntil > 0 && trip.daysUntil <= 15)
                    .sort((a, b) => a.daysUntil - b.daysUntil);

                if (upcoming.length > 0) {
                    setUpcomingTrips(upcoming);
                    setIsVisible(true);
                }
            } catch (error) {
                console.error('Error checking upcoming trips:', error);
            }
        };

        checkUpcomingTrips();

        // Escuchar cambios de sesión para re-chequear
        if (supabase) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
                if (event === 'SIGNED_IN') {
                    // Usuario acaba de loguearse, forzar re-check
                    sessionStorage.removeItem('upcomingTripsDismissed');
                    setIsDismissed(false);
                    setSessionChecked(prev => prev + 1);
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [sessionChecked]);

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        sessionStorage.setItem('upcomingTripsDismissed', 'true');
    };

    const handleLoadTrip = (tripId: number) => {
        if (onLoadTrip) {
            onLoadTrip(tripId);
        }
        handleDismiss();
    };

    if (!isVisible || isDismissed || upcomingTrips.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-[9999] animate-slideIn">
            <div className="bg-white rounded-xl shadow-2xl border-2 border-red-500 p-4 max-w-sm">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="text-red-600" size={20} />
                        <h3 className="font-bold text-gray-800">
                            🚐 {upcomingTrips.length === 1 ? 'Próximo viaje' : `${upcomingTrips.length} próximos viajes`}
                        </h3>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-600 transition"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-2">
                    {upcomingTrips.slice(0, 3).map((trip) => (
                        <div
                            key={trip.id}
                            className="bg-gradient-to-r from-red-50 to-blue-50 rounded-lg p-3 border border-gray-200 hover:border-red-300 transition cursor-pointer"
                            onClick={() => handleLoadTrip(trip.id)}
                        >
                            <div className="font-semibold text-sm text-gray-800 mb-1">
                                {trip.name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <MapPin size={12} />
                                <span>
                                    {trip.trip_data?.formData?.origen?.split(',')[0]} → {trip.trip_data?.formData?.destino?.split(',')[0]}
                                </span>
                            </div>
                            <div className="mt-2 text-xs font-bold">
                                {trip.daysUntil === 1 ? (
                                    <span className="text-red-600">¡Mañana! 🔥</span>
                                ) : trip.daysUntil <= 7 ? (
                                    <span className="text-orange-600">En {trip.daysUntil} días</span>
                                ) : (
                                    <span className="text-blue-600">En {trip.daysUntil} días</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-3 text-center text-xs text-gray-500">
                    Haz clic en un viaje para cargarlo
                </div>
            </div>
        </div>
    );
};

export default UpcomingTripsNotification;
