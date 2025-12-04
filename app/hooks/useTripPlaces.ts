import { useState, useCallback, useRef } from 'react';
import { Coordinates, PlaceWithDistance, ServiceType } from '../types';

export function useTripPlaces(map: google.maps.Map | null) {
    // AÑADIDO 'search' y 'found' AL ESTADO INICIAL
    const [places, setPlaces] = useState<Record<ServiceType, PlaceWithDistance[]>>({
        camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [], custom: [], search: [], found: []
    });
    const [loadingPlaces, setLoadingPlaces] = useState<Record<ServiceType, boolean>>({
        camping: false, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: false, search: false, found: false
    });
    const [toggles, setToggles] = useState<Record<ServiceType, boolean>>({
        camping: false, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: false, search: false, found: false
    });

    // 💰 CACHÉ EN MEMORIA (Ahorro de API Calls)
    // Estructura: { "gas_40.41_3.70": [Array de sitios], ... }
    const placesCache = useRef<Record<string, PlaceWithDistance[]>>({});

    // BÚSQUEDA ESTÁNDAR (Categorías)
    const searchPlaces = useCallback((location: Coordinates, type: ServiceType) => {
        if (!map || typeof google === 'undefined') return;
        if (type === 'custom' || type === 'search' || type === 'found') return; // 'search' y 'found' van por otro lado

        // 1. GENERAR CLAVE DE CACHÉ
        // Redondeamos coords para que pequeños movimientos no invaliden la caché innecesariamente
        const cacheKey = `${type}_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}`;

        // 2. VERIFICAR SI YA PAGAMOS POR ESTO
        if (placesCache.current[cacheKey]) {
            // console.log("💰 Ahorro: Recuperando de caché", cacheKey);
            setPlaces(prev => ({...prev, [type]: placesCache.current[cacheKey]}));
            return;
        }

        const service = new google.maps.places.PlacesService(map);
        const centerPoint = new google.maps.LatLng(location.lat, location.lng);
        let placeType = ''; let radius = 10000; 

        switch(type) {
            case 'camping': placeType = 'campground'; radius = 30000; break;
            case 'restaurant': placeType = 'restaurant'; radius = 10000; break;
            case 'water': placeType = 'campground'; radius = 25000; break; // No hay tipo específico, usamos campground
            case 'gas': placeType = 'gas_station'; radius = 20000; break;
            case 'supermarket': placeType = 'supermarket'; radius = 15000; break;
            case 'laundry': placeType = 'laundry'; radius = 20000; break;
            case 'tourism': placeType = 'tourist_attraction'; radius = 15000; break;
        }

        setLoadingPlaces(prev => ({...prev, [type]: true}));
        
        console.log(`🔍 [${type}] Búsqueda iniciada:`, {
            location: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
            radius: `${radius}m (${(radius/1000).toFixed(1)}km)`,
            type: placeType
        });
        
        service.nearbySearch({ location: centerPoint, radius, type: placeType }, (res, status) => {
            setLoadingPlaces(prev => ({...prev, [type]: false}));
            
            console.log(`📊 [${type}] Respuesta de Google:`, {
                status,
                resultadosBrutos: res?.length || 0
            });
            
            let finalSpots: PlaceWithDistance[] = [];

            if (status === google.maps.places.PlacesServiceStatus.OK && res) {
                let spots = res.map(spot => {
                    let dist = 999999;
                    if (spot.geometry?.location) dist = google.maps.geometry.spherical.computeDistanceBetween(centerPoint, spot.geometry.location);
                    
                    // Obtener URL de foto
                    let photoUrl: string | undefined;
                    if (spot.photos && spot.photos.length > 0) {
                        try {
                            photoUrl = spot.photos[0].getUrl({ maxWidth: 400, maxHeight: 400 });
                        } catch (e) {
                            console.warn(`[${type}] Error getting photo URL for`, spot.name, ':', e);
                        }
                    }
                    
                    // Convertir geometry de Google Maps a nuestro formato
                    const geometry = spot.geometry?.location ? {
                        location: {
                            lat: spot.geometry.location.lat(),
                            lng: spot.geometry.location.lng()
                        }
                    } : undefined;
                    return { name: spot.name, rating: spot.rating, vicinity: spot.vicinity, place_id: spot.place_id, geometry, distanceFromCenter: dist, type, opening_hours: spot.opening_hours as PlaceWithDistance['opening_hours'], user_ratings_total: spot.user_ratings_total, photoUrl, types: spot.types };
                });
                // Filtros del Portero
                const rechazados: {name: string, types: string[], razon: string}[] = [];
                spots = spots.filter(spot => {
                    const tags = spot.types || [];
                    let pasa = true;
                    let razon = '';
                    
                    if (type === 'camping') {
                        // Filtro estricto: debe ser campground/rv_park Y NO ser tienda/ferretería
                        const esCamping = tags.includes('campground') || tags.includes('rv_park') || (tags.includes('parking') && /camping|area|camper|autocaravana/i.test(spot.name || ''));
                        const esTienda = tags.includes('hardware_store') || tags.includes('store') || tags.includes('locksmith') || tags.includes('clothing_store') || tags.includes('sporting_goods_store') || tags.includes('shopping_mall');
                        pasa = esCamping && !esTienda;
                        if (!pasa) {
                            if (esTienda) razon = 'Es tienda/ferretería, no camping real';
                            else razon = 'No es campground, rv_park ni parking con nombre camping/autocaravana';
                        }
                    } else if (type === 'gas') {
                        pasa = tags.includes('gas_station');
                        if (!pasa) razon = 'No tiene tag gas_station';
                    } else if (type === 'restaurant') {
                        // Filtro: debe ser restaurant/café Y NO ser hotel/alojamiento
                        const esRestaurante = tags.includes('restaurant') || tags.includes('cafe') || tags.includes('meal_takeaway') || tags.includes('meal_delivery');
                        const esHotel = tags.includes('lodging') || tags.includes('hotel') || tags.includes('motel') || tags.includes('resort');
                        pasa = esRestaurante && !esHotel;
                        if (!pasa) {
                            if (esHotel) razon = 'Es hotel/alojamiento con restaurante, no restaurante independiente';
                            else razon = 'No es restaurant, cafe ni meal_takeaway';
                        }
                    } else if (type === 'supermarket') {
                        pasa = tags.includes('supermarket') || tags.includes('grocery_or_supermarket') || tags.includes('convenience_store');
                        if (!pasa) razon = 'No es supermarket, grocery ni convenience_store';
                    } else if (type === 'laundry') {
                        pasa = tags.includes('laundry') && !tags.includes('lodging');
                        if (!pasa) razon = tags.includes('laundry') ? 'Es lodging (hotel con lavandería)' : 'No tiene tag laundry';
                    }
                    
                    if (!pasa) {
                        rechazados.push({ name: spot.name || 'Sin nombre', types: tags, razon });
                    }
                    
                    return pasa;
                });
                
                const filtrados = res.length - spots.length;
                console.log(`🚫 [${type}] Filtrado del Portero:`, {
                    recibidos: res.length,
                    rechazados: filtrados,
                    aceptados: spots.length,
                    porcentajeRechazo: `${((filtrados/res.length)*100).toFixed(1)}%`
                });
                
                if (rechazados.length > 0) {
                    console.log(`📋 [${type}] Primeros rechazados (máx 5):`, rechazados.slice(0, 5));
                }
                
                // Calcular score para cada lugar
                const spotsWithScore = spots.map(spot => {
                    const dist = spot.distanceFromCenter || 999999;
                    const rating = spot.rating || 0;
                    const reviews = spot.user_ratings_total || 0;
                    // Usar optional chaining sin acceder a open_now deprecado
                    const isOpen = spot.opening_hours ? undefined : undefined; // Ignoramos open_now deprecado
                    
                    // Score de distancia (40%): exponencial, mejor cerca
                    const distanceScore = Math.max(0, 100 * Math.exp(-dist / 5000)); // Decae rápido después de 5km
                    
                    // Score de rating (30%): lineal sobre 5
                    const ratingScore = rating > 0 ? (rating / 5) * 100 : 50; // Sin rating = penalización a 50
                    
                    // Score de reviews (20%): logarítmico
                    const reviewsScore = reviews > 0 ? Math.min(100, Math.log10(reviews + 1) * 50) : 25;
                    
                    // Score de disponibilidad (10%) - neutral por defecto al no usar API deprecada
                    const openScore = 75; // Valor neutral al no tener info de apertura
                    
                    const totalScore = Math.round(
                        distanceScore * 0.4 + 
                        ratingScore * 0.3 + 
                        reviewsScore * 0.2 + 
                        openScore * 0.1
                    );
                    
                    return { ...spot, score: totalScore };
                });
                
                // Ordenar por score en lugar de solo distancia
                finalSpots = spotsWithScore.sort((a, b) => (b.score || 0) - (a.score || 0));
            } else {
                console.warn(`❌ [${type}] Sin resultados:`, status);
            } 
            
            // 3. GUARDAR RESULTADO EN CACHÉ (Incluso si está vacío, para no reintentar a lo tonto)
            placesCache.current[cacheKey] = finalSpots;
            setPlaces(prev => ({...prev, [type]: finalSpots}));
            
            console.log(`✅ [${type}] Búsqueda completada:`, {
                resultadosFinales: finalSpots.length,
                cacheKey
            });
        });
    }, [map]);

    // --- BÚSQUEDA LIBRE (TEXT SEARCH) ---
    const searchByQuery = useCallback((query: string, centerLat: number, centerLng: number) => {
        if (!map || typeof google === 'undefined') return;
        if (!query.trim()) return;

        // También cacheamos las búsquedas libres
        const cacheKey = `search_${query.trim()}_${centerLat.toFixed(4)}_${centerLng.toFixed(4)}`;
        
        if (placesCache.current[cacheKey]) {
            setPlaces(prev => ({...prev, search: placesCache.current[cacheKey]}));
            return;
        }

        const service = new google.maps.places.PlacesService(map);
        const centerPoint = new google.maps.LatLng(centerLat, centerLng);

        setLoadingPlaces(prev => ({...prev, search: true}));
        setToggles(prev => ({...prev, search: true}));

        const request = {
            location: centerPoint,
            radius: 20000, 
            query: query
        };

        console.log(`🔍 [search] Búsqueda textSearch iniciada:`, {
            query,
            location: `${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`,
            radius: '20km'
        });

        service.textSearch(request, (res, status) => {
            setLoadingPlaces(prev => ({...prev, search: false}));
            
            console.log(`📊 [search] Respuesta de Google:`, {
                status,
                resultados: res?.length || 0
            });
            
            let finalSpots: PlaceWithDistance[] = [];

            if (status === google.maps.places.PlacesServiceStatus.OK && res) {
                 finalSpots = res.map(spot => {
                    let dist = 999999;
                    if (spot.geometry?.location) dist = google.maps.geometry.spherical.computeDistanceBetween(centerPoint, spot.geometry.location);
                    
                    // Obtener URL de foto
                    let photoUrl: string | undefined;
                    if (spot.photos && spot.photos.length > 0) {
                        try {
                            photoUrl = spot.photos[0].getUrl({ maxWidth: 400, maxHeight: 400 });
                        } catch (e) {
                            console.warn(`[search] Error getting photo URL for`, spot.name, ':', e);
                        }
                    }
                    
                    // Convertir geometry de Google Maps a nuestro formato
                    const geometry = spot.geometry?.location ? {
                        location: {
                            lat: spot.geometry.location.lat(),
                            lng: spot.geometry.location.lng()
                        }
                    } : undefined;
                    return { 
                        name: spot.name, rating: spot.rating, vicinity: spot.formatted_address, 
                        place_id: spot.place_id, geometry, distanceFromCenter: dist, 
                        type: 'search' as ServiceType, 
                        opening_hours: spot.opening_hours as PlaceWithDistance['opening_hours'], user_ratings_total: spot.user_ratings_total, photoUrl, types: spot.types 
                    };
                });
            } else {
                // No alertamos aquí para no ser intrusivos si falla silenciosamente, 
                // o lo manejamos en la UI.
                if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    alert("No se encontraron resultados para: " + query);
                }
                console.warn(`❌ [search] Sin resultados:`, status);
            }

            // Guardar en caché y actualizar estado
            placesCache.current[cacheKey] = finalSpots;
            setPlaces(prev => ({...prev, search: finalSpots}));
            
            console.log(`✅ [search] Búsqueda completada:`, {
                resultadosFinales: finalSpots.length,
                cacheKey
            });
        });
    }, [map]);

    const clearSearch = () => {
        setPlaces(prev => ({...prev, search: []}));
        setToggles(prev => ({...prev, search: false}));
    };

    // ... (Resto igual)
    const handleToggle = (type: ServiceType, coordinates?: Coordinates) => {
        const newState = !toggles[type];
        setToggles(prev => ({...prev, [type]: newState}));
        // Solo buscamos si se enciende Y tenemos coordenadas
        if (newState && coordinates) {
            searchPlaces(coordinates, type);
        }
    };

    const resetPlaces = () => {
        // Opcional: Podríamos limpiar la caché aquí si quisiéramos forzar recarga al cambiar de viaje
        // placesCache.current = {}; 
        setToggles({ camping: false, restaurant: false, water: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: false, search: false, found: false });
        setPlaces({ camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [], custom: [], search: [], found: [] });
    };

    return { 
        places, loadingPlaces, toggles, 
        searchPlaces, searchByQuery, clearSearch, handleToggle, resetPlaces 
    };
}