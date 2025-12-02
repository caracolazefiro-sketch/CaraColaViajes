import { useState } from 'react';
import { Coordinates } from '../types';

export function useElevation() {
    const [elevationData, setElevationData] = useState<{ distance: number, elevation: number }[] | null>(null);
    const [loadingElevation, setLoadingElevation] = useState(false);

    const calculateElevation = (origin: string, destinationCoords: Coordinates | undefined) => {
        if (typeof google === 'undefined' || !destinationCoords) return;
        
        setLoadingElevation(true);
        const cleanFrom = origin.split('|')[0]; // Limpiar nombre origen
        const ds = new google.maps.DirectionsService();
        const dest = new google.maps.LatLng(destinationCoords.lat, destinationCoords.lng);

        ds.route({ 
            origin: cleanFrom, 
            destination: dest, 
            travelMode: google.maps.TravelMode.DRIVING 
        }, (result, status) => {
            if (status === 'OK' && result) {
                const path = result.routes[0].overview_path;
                const es = new google.maps.ElevationService();
                
                es.getElevationAlongPath({ path: path, samples: 100 }, (elevations, statusElev) => {
                    setLoadingElevation(false);
                    if (statusElev === 'OK' && elevations) {
                        const data = elevations.map((e, i) => ({ distance: i, elevation: e.elevation }));
                        setElevationData(data);
                    }
                });
            } else { 
                setLoadingElevation(false); 
            }
        });
    };

    const clearElevation = () => {
        setElevationData(null);
    };

    return { elevationData, loadingElevation, calculateElevation, clearElevation };
}