// app/hooks/useTripPlaces.ts
import { useState, useCallback } from 'react';
import { Coordinates, PlaceWithDistance, ServiceType } from '../types';

export function useTripPlaces(map: google.maps.Map | null) {
    // ESTADOS
    const [places, setPlaces] = useState<Record<ServiceType, PlaceWithDistance[]>>({
        camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [], custom: []
    });
    const [loadingPlaces, setLoadingPlaces] = useState<Record<ServiceType, boolean>>({
        camping: false, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: false
    });
    const [toggles, setToggles] = useState<Record<ServiceType, boolean>>({
        camping: true, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: true
    });

    // LÓGICA DE BÚSQUEDA (El Portero de Discoteca)
    const searchPlaces = useCallback((location: Coordinates, type: ServiceType) => {
        if (!map || typeof google === 'undefined') return;
        
        const service = new google.maps.places.PlacesService(map);
        const centerPoint = new google.maps.LatLng(location.lat, location.lng);
        let keywords = ''; 
        let radius = 10000; 
        
        if (type === 'custom') return; 

        switch(type) {
            case 'camping': keywords = 'camping OR "area autocaravanas" OR "rv park" OR "parking caravanas"'; radius = 20000; break;
            case 'restaurant': keywords = 'restaurante OR comida OR bar'; radius = 5000; break;
            case 'water': keywords = '"punto limpio autocaravanas" OR "rv dump station" OR "area servicio autocaravanas"'; radius = 15000; break;
            case 'gas': keywords = 'gasolinera OR "estacion servicio"'; radius = 10000; break;
            case 'supermarket': keywords = 'supermercado OR "tienda alimentacion"'; radius = 5000; break;
            case 'laundry': keywords = 'lavanderia OR "laundry"'; radius = 10000; break;
            case 'tourism': keywords = 'turismo OR monumento OR museo OR "punto interes"'; radius = 10000; break;
        }

        setLoadingPlaces(prev => ({...prev, [type]: true}));
        
        service.nearbySearch({ location: centerPoint, radius, keyword: keywords }, (res, status) => {
            setLoadingPlaces(prev => ({...prev, [type]: false}));
            
            if (status === google.maps.places.PlacesServiceStatus.OK && res) {
                let spots = res.map(spot => {
                    let dist = 999999;
                    if (spot.geometry?.location) { 
                        dist = google.maps.geometry.spherical.computeDistanceBetween(centerPoint, spot.geometry.location); 
                    }
                    const photoUrl = spot.photos && spot.photos.length > 0 ? spot.photos[0].getUrl({ maxWidth: 200 }) : undefined;
                    
                    return { 
                        name: spot.name, rating: spot.rating, vicinity: spot.vicinity, place_id: spot.place_id, 
                        geometry: spot.geometry, distanceFromCenter: dist, type, 
                        opening_hours: spot.opening_hours as any, user_ratings_total: spot.user_ratings_total, photoUrl, types: spot.types 
                    };
                });

                // FILTROS ESTRICTOS (Portero)
                spots = spots.filter(spot => {
                    const tags = spot.types || [];
                    if (type === 'camping') return tags.includes('campground') || tags.includes('rv_park') || (tags.includes('parking') && /camping|area|camper|autocaravana/i.test(spot.name || ''));
                    if (type === 'gas') return tags.includes('gas_station');
                    if (type === 'supermarket') return tags.includes('supermarket') || tags.includes('grocery_or_supermarket') || tags.includes('convenience_store');
                    if (type === 'laundry') return tags.includes('laundry') && !tags.includes('lodging');
                    return true;
                });

                setPlaces(prev => ({...prev, [type]: spots.sort((a, b) => (a.distanceFromCenter || 0) - (b.distanceFromCenter || 0))}));
            } else { 
                setPlaces(prev => ({...prev, [type]: []})); 
            }
        });
    }, [map]);

    // MANEJADORES
    const handleToggle = (type: ServiceType, coordinates?: Coordinates) => {
        const newState = !toggles[type];
        setToggles(prev => ({...prev, [type]: newState}));
        // Si activamos el botón y tenemos coordenadas, buscamos automáticamente
        if (newState && coordinates) {
            searchPlaces(coordinates, type);
        }
    };

    const resetPlaces = () => {
        setToggles({ camping: true, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: true });
        setPlaces({ camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [], custom: [] });
    };

    return { 
        places, loadingPlaces, toggles, 
        searchPlaces, handleToggle, resetPlaces 
    };
}