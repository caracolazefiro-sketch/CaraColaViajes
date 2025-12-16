import { useState, useCallback, useRef } from 'react';
import { Coordinates, PlaceWithDistance, ServiceType } from '../types';

type Supercat = 1 | 2;

type ServerPlace = {
    name?: string;
    rating?: number;
    user_ratings_total?: number;
    vicinity?: string;
    place_id?: string;
    types?: string[];
    geometry?: { location?: Coordinates };
    opening_hours?: { open_now?: boolean };
    photos?: Array<{ photo_reference?: string }>;
};

export function useTripPlaces(map: google.maps.Map | null, tripId?: string | null, tripName?: string) {
    // AÑADIDO 'search' y 'found' AL ESTADO INICIAL
    const [places, setPlaces] = useState<Record<ServiceType, PlaceWithDistance[]>>({
        camping: [], restaurant: [], gas: [], supermarket: [], laundry: [], tourism: [], custom: [], search: [], found: []
    });
    const [loadingPlaces, setLoadingPlaces] = useState<Record<ServiceType, boolean>>({
        camping: false, restaurant: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: false, search: false, found: false
    });
    const [toggles, setToggles] = useState<Record<ServiceType, boolean>>({
        camping: false, restaurant: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: false, search: false, found: false
    });

    // 💰 CACHÉ EN MEMORIA (Ahorro de API Calls)
    // Estructura: { "gas_40.41_3.70": [Array de sitios], ... }
    const placesCache = useRef<Record<string, PlaceWithDistance[]>>({});

    const haversineDistanceM = (a: Coordinates, b: Coordinates) => {
        const R = 6371e3;
        const φ1 = (a.lat * Math.PI) / 180;
        const φ2 = (b.lat * Math.PI) / 180;
        const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
        const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
        const sinΔφ = Math.sin(Δφ / 2);
        const sinΔλ = Math.sin(Δλ / 2);
        const x = sinΔφ * sinΔφ + Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ;
        return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    };

    const distanceFromCenter = (center: Coordinates, spot: Coordinates) => {
        try {
            if (typeof google !== 'undefined' && google.maps?.geometry?.spherical?.computeDistanceBetween) {
                const c = new google.maps.LatLng(center.lat, center.lng);
                const s = new google.maps.LatLng(spot.lat, spot.lng);
                return google.maps.geometry.spherical.computeDistanceBetween(c, s);
            }
        } catch {
            // ignore
        }
        return haversineDistanceM(center, spot);
    };

    const toPhotoUrl = (p: ServerPlace): string | undefined => {
        const ref = p.photos?.[0]?.photo_reference;
        if (!ref) return undefined;
        const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
        if (!key) return undefined;
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${encodeURIComponent(ref)}&key=${encodeURIComponent(key)}`;
    };

    const toPlace = (center: Coordinates, type: ServiceType, p: ServerPlace): PlaceWithDistance => {
        const loc = p.geometry?.location;
        const dist = loc ? distanceFromCenter(center, loc) : 999999;
        return {
            name: p.name,
            rating: p.rating,
            user_ratings_total: p.user_ratings_total,
            vicinity: p.vicinity,
            place_id: p.place_id,
            geometry: loc ? { location: loc } : undefined,
            distanceFromCenter: dist,
            type,
            opening_hours: p.opening_hours as PlaceWithDistance['opening_hours'],
            photoUrl: toPhotoUrl(p),
            types: p.types,
        };
    };

    const fetchSupercat = useCallback(async (supercat: Supercat, center: Coordinates) => {
        const radius = 20000;
        const res = await fetch('/api/places-supercat', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                tripId: tripId || undefined,
                tripName: tripName || undefined,
                center,
                radius,
                supercat,
            })
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) {
            throw new Error(json?.reason || `places-supercat failed (${res.status})`);
        }
        return json as {
            ok: true;
            supercat: Supercat;
            categories: Record<string, ServerPlace[]>;
        };
    }, [tripId, tripName]);

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
        let useKeyword = false; // Para búsquedas que requieren keyword en lugar de type
        let searchKeyword = '';

        switch(type) {
            case 'camping': 
                // COMBO 1: camping + restaurant + supermarket (bilingüe)
                placeType = 'campground'; 
                radius = 10000; 
                useKeyword = true;
                searchKeyword = 'camping OR "área de autocaravanas" OR "RV park" OR "motorhome area" OR pernocta OR restaurante OR restaurant OR "fast food" OR comida OR supermercado OR supermarket OR "grocery store"';
                break;
            case 'restaurant': 
                // COMBO 1: gestionado por función combinada
                return; // No hacemos búsqueda individual, se trae con función combinada
            case 'supermarket': 
                // COMBO 1: gestionado por función combinada
                return; // No hacemos búsqueda individual, se trae con función combinada
            case 'gas': placeType = 'gas_station'; radius = 10000; break;
            case 'laundry': 
                // COMBO 2: gas + laundry + tourism (bilingüe)
                placeType = 'laundry'; 
                radius = 10000; 
                useKeyword = true;
                searchKeyword = 'laundry OR "self-service laundry" OR "lavandería autoservicio"';
                break;
            case 'tourism': 
                // COMBO 2: gestionado por función combinada
                return; // No hacemos búsqueda individual
        }

        setLoadingPlaces(prev => ({...prev, [type]: true}));
        
        console.log(`🔍 [${type}] Búsqueda iniciada:`, {
            location: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
            radius: `${radius}m (${(radius/1000).toFixed(1)}km)`,
            type: placeType,
            keyword: useKeyword ? searchKeyword : 'N/A'
        });
        
        const searchRequest: google.maps.places.PlaceSearchRequest = {
            location: centerPoint,
            radius,
            ...(useKeyword ? { keyword: searchKeyword } : { type: placeType })
        };
        
        service.nearbySearch(searchRequest, (res, status) => {
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
                    
                    if (type === 'camping') { // COMBO 1: camping + restaurant + supermarket
                        // Filtro estricto: debe ser campground/rv_park Y NO ser tienda/ferretería
                        const esCamping = tags.includes('campground') || tags.includes('rv_park') || (tags.includes('parking') && /camping|area|camper|autocaravana/i.test(spot.name || ''));
                        const esTienda = tags.includes('hardware_store') || tags.includes('store') || tags.includes('locksmith') || tags.includes('clothing_store') || tags.includes('sporting_goods_store') || tags.includes('shopping_mall');
                        pasa = esCamping && !esTienda;
                        if (!pasa) {
                            if (esTienda) razon = 'Es tienda/ferretería, no camping real';
                            else razon = 'No es campground, rv_park ni parking con nombre camping/autocaravana';
                        }
                    } else if (type === 'gas') { // COMBO 2: gas + laundry + tourism
                        pasa = tags.includes('gas_station');
                        if (!pasa) razon = 'No tiene tag gas_station';
                    } else if (type === 'laundry') { // Filtro secundario para combo 2
                        pasa = tags.includes('laundry') && !tags.includes('lodging');
                        if (!pasa) razon = tags.includes('laundry') ? 'Es lodging (hotel con lavandería)' : 'No tiene tag laundry';
                    } else if (type === 'tourism') { // Filtro secundario para combo 2
                        pasa = tags.includes('tourist_attraction') || tags.includes('museum') || tags.includes('park') || tags.includes('point_of_interest');
                        if (!pasa) razon = 'No es atracción turística reconocida';
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

    // BÚSQUEDA COMBINADA: camping + restaurant + supermarket
    const searchComboCampingRestaurantSuper = useCallback((location: Coordinates) => {
        setLoadingPlaces(prev => ({...prev, camping: true, restaurant: true, supermarket: true}));
        const cacheKey = `supercat1_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}`;

        if (placesCache.current[cacheKey]) {
            const cached = placesCache.current[cacheKey];
            setPlaces(prev => ({
                ...prev,
                camping: cached.filter(p => p.type === 'camping'),
                restaurant: cached.filter(p => p.type === 'restaurant'),
                supermarket: cached.filter(p => p.type === 'supermarket'),
            }));
            setLoadingPlaces(prev => ({...prev, camping: false, restaurant: false, supermarket: false}));
            return;
        }

        (async () => {
            try {
                const data = await fetchSupercat(1, location);
                const campingRaw = (data.categories.camping || []) as ServerPlace[];
                const restaurantRaw = (data.categories.restaurant || []) as ServerPlace[];
                const supermarketRaw = (data.categories.supermarket || []) as ServerPlace[];

                const campingList = campingRaw.map(p => toPlace(location, 'camping', p));
                const restaurantList = restaurantRaw.map(p => toPlace(location, 'restaurant', p));
                const supermarketList = supermarketRaw.map(p => toPlace(location, 'supermarket', p));

                const merged = [...campingList, ...restaurantList, ...supermarketList];
                placesCache.current[cacheKey] = merged;
                setPlaces(prev => ({ ...prev, camping: campingList, restaurant: restaurantList, supermarket: supermarketList }));
            } catch (e) {
                console.error('❌ [places-supercat-1] Error:', e);
                setPlaces(prev => ({ ...prev, camping: [], restaurant: [], supermarket: [] }));
            } finally {
                setLoadingPlaces(prev => ({...prev, camping: false, restaurant: false, supermarket: false}));
            }
        })();
    }, [fetchSupercat]);

    // BÚSQUEDA COMBINADA: gas + laundry + tourism
    const searchComboGasLaundryTourism = useCallback((location: Coordinates) => {
        setLoadingPlaces(prev => ({...prev, gas: true, laundry: true, tourism: true}));
        const cacheKey = `supercat2_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}`;

        if (placesCache.current[cacheKey]) {
            const cached = placesCache.current[cacheKey];
            setPlaces(prev => ({
                ...prev,
                gas: cached.filter(p => p.type === 'gas'),
                laundry: cached.filter(p => p.type === 'laundry'),
                tourism: cached.filter(p => p.type === 'tourism'),
            }));
            setLoadingPlaces(prev => ({...prev, gas: false, laundry: false, tourism: false}));
            return;
        }

        (async () => {
            try {
                const data = await fetchSupercat(2, location);
                const gasRaw = (data.categories.gas || []) as ServerPlace[];
                const laundryRaw = (data.categories.laundry || []) as ServerPlace[];
                const tourismRaw = (data.categories.tourism || []) as ServerPlace[];

                const gasList = gasRaw.map(p => toPlace(location, 'gas', p));
                const laundryList = laundryRaw.map(p => toPlace(location, 'laundry', p));
                const tourismList = tourismRaw.map(p => toPlace(location, 'tourism', p));

                const merged = [...gasList, ...laundryList, ...tourismList];
                placesCache.current[cacheKey] = merged;
                setPlaces(prev => ({ ...prev, gas: gasList, laundry: laundryList, tourism: tourismList }));
            } catch (e) {
                console.error('❌ [places-supercat-2] Error:', e);
                setPlaces(prev => ({ ...prev, gas: [], laundry: [], tourism: [] }));
            } finally {
                setLoadingPlaces(prev => ({...prev, gas: false, laundry: false, tourism: false}));
            }
        })();
    }, [fetchSupercat]);

    // --- BÚSQUEDA LIBRE (NOMINATIM/OSM) - GRATIS, SIN COSTO API ---
    const searchByQuery = useCallback(async (query: string, centerLat: number, centerLng: number) => {
        if (!query.trim()) return;

        // Cacheamos las búsquedas libres
        const cacheKey = `search_${query.trim()}_${centerLat.toFixed(4)}_${centerLng.toFixed(4)}`;
        
        if (placesCache.current[cacheKey]) {
            setPlaces(prev => ({...prev, search: placesCache.current[cacheKey]}));
            return;
        }

        setLoadingPlaces(prev => ({...prev, search: true}));
        setToggles(prev => ({...prev, search: true}));

        console.log(`🔍 [search] Búsqueda Nominatim (OSM) iniciada:`, {
            query,
            location: `${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`,
            radius: '20km',
            costo: '$0.00 (gratis)'
        });

        try {
            // Llamar a Nominatim (OpenStreetMap) - GRATIS
            const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
            nominatimUrl.searchParams.append('q', query.trim());
            nominatimUrl.searchParams.append('format', 'json');
            nominatimUrl.searchParams.append('limit', '10');
            nominatimUrl.searchParams.append('viewbox', `${centerLng - 0.18},${centerLat + 0.18},${centerLng + 0.18},${centerLat - 0.18}`); // ~20km box
            nominatimUrl.searchParams.append('bounded', '1'); // Limitar a viewbox

            const response = await fetch(nominatimUrl.toString());
            
            if (!response.ok) {
                throw new Error(`Nominatim error: ${response.status}`);
            }

            const results = await response.json() as Array<{
                osm_id: number;
                name: string;
                address: string;
                lat: string;
                lon: string;
                type: string;
                importance: number;
            }>;

            console.log(`📊 [search] Respuesta Nominatim:`, {
                status: 'OK',
                resultados: results.length
            });

            let finalSpots: PlaceWithDistance[] = [];

            if (results && results.length > 0) {
                finalSpots = results.map(spot => {
                    const spotLat = parseFloat(spot.lat);
                    const spotLng = parseFloat(spot.lon);
                    
                    // Calcular distancia usando la fórmula de Haversine
                    const R = 6371; // Radio de la tierra en km
                    const dLat = (spotLat - centerLat) * Math.PI / 180;
                    const dLng = (spotLng - centerLng) * Math.PI / 180;
                    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                              Math.cos(centerLat * Math.PI / 180) * Math.cos(spotLat * Math.PI / 180) *
                              Math.sin(dLng/2) * Math.sin(dLng/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    const dist = R * c * 1000; // Convertir a metros
                    
                    return {
                        name: spot.name,
                        vicinity: spot.address || spot.type,
                        place_id: `osm-${spot.osm_id}`,
                        geometry: {
                            location: {
                                lat: spotLat,
                                lng: spotLng
                            }
                        },
                        distanceFromCenter: dist,
                        type: 'search' as ServiceType,
                        user_ratings_total: undefined,
                        rating: undefined,
                        types: [spot.type],
                        photoUrl: undefined
                    };
                });
            } else {
                console.warn(`❌ [search] Sin resultados de Nominatim:`, {query});
            }

            // Guardar en caché y actualizar estado
            placesCache.current[cacheKey] = finalSpots;
            setPlaces(prev => ({...prev, search: finalSpots}));
            
            console.log(`✅ [search] Búsqueda Nominatim completada:`, {
                resultadosFinales: finalSpots.length,
                cacheKey,
                costo: '$0.00'
            });
        } catch (error) {
            console.error(`❌ [search] Error en Nominatim:`, error);
            setPlaces(prev => ({...prev, search: []}));
        } finally {
            setLoadingPlaces(prev => ({...prev, search: false}));
        }
    }, []);

    const clearSearch = () => {
        setPlaces(prev => ({...prev, search: []}));
        setToggles(prev => ({...prev, search: false}));
    };

    // ... (Resto igual)
    const handleToggle = (type: ServiceType, coordinates?: Coordinates) => {
        const newState = !toggles[type];
        // Solo cambiamos el toggle clicado; no tocamos los demás
        setToggles(prev => ({...prev, [type]: newState}));
        
        // Solo buscamos si se enciende Y tenemos coordenadas
        if (newState && coordinates) {
            // COMBO 1: camping, restaurant, supermarket
            if (type === 'camping' || type === 'restaurant' || type === 'supermarket') {
                searchComboCampingRestaurantSuper(coordinates);
            } 
            // COMBO 2: gas, laundry, tourism
            else if (type === 'gas' || type === 'laundry' || type === 'tourism') {
                searchComboGasLaundryTourism(coordinates);
            }
            else {
                searchPlaces(coordinates, type);
            }
        }
    };

    const resetPlaces = () => {
        // Opcional: Podríamos limpiar la caché aquí si quisiéramos forzar recarga al cambiar de viaje
        // placesCache.current = {}; 
        setToggles({ camping: false, restaurant: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: false, search: false, found: false });
        setPlaces({ camping: [], restaurant: [], gas: [], supermarket: [], laundry: [], tourism: [], custom: [], search: [], found: [] });
    };

    return { 
        places, loadingPlaces, toggles, 
        searchPlaces, searchByQuery, clearSearch, handleToggle, resetPlaces 
    };
}