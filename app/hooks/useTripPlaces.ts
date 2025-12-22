import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Coordinates, PlaceWithDistance, ServiceType } from '../types';
import { getOrCreateClientId } from '../utils/client-id';

type Supercat = 1 | 2 | 3 | 4;

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
    note?: string;
    link?: string;
    photoName?: string;
};

export function useTripPlaces(
    map: google.maps.Map | null,
    tripId?: string | null,
    tripName?: string,
    searchRadiusKm: number = 10,
    authToken?: string | null
) {
    // Opción A: el slider global llega a 25km, pero cada bloque/tipo tiene su tope interno.
    const RADIUS_CAPS_KM = useMemo(
        () => ({
            camping: 25,
            restaurant: 8,
            supermarket: 8,
            gas: 12,
            laundry: 12,
            tourism: 15,
        } as const),
        []
    );

    const clampRadiusMeters = useCallback((km: number) => {
        const safeKm = Number.isFinite(km) ? km : 10;
        return Math.max(1000, Math.min(50000, Math.round(safeKm * 1000)));
    }, []);

    const effectiveRadiusMetersForType = useCallback((type: ServiceType) => {
        const sliderKm = Number.isFinite(searchRadiusKm) ? searchRadiusKm : 10;

        const capKm =
            type === 'camping'
                ? RADIUS_CAPS_KM.camping
                : type === 'restaurant'
                    ? RADIUS_CAPS_KM.restaurant
                    : type === 'supermarket'
                        ? RADIUS_CAPS_KM.supermarket
                        : type === 'gas'
                            ? RADIUS_CAPS_KM.gas
                            : type === 'laundry'
                                ? RADIUS_CAPS_KM.laundry
                                : type === 'tourism'
                                    ? RADIUS_CAPS_KM.tourism
                                    : sliderKm;

        return clampRadiusMeters(Math.min(sliderKm, capKm));
    }, [RADIUS_CAPS_KM, clampRadiusMeters, searchRadiusKm]);
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

    // 🛡️ Robustez: evitar setState tras unmount y evitar que respuestas antiguas machaquen resultados nuevos
    const isMountedRef = useRef(true);
    const requestSeqByTypeRef = useRef<Record<ServiceType, number>>({
        camping: 0,
        restaurant: 0,
        gas: 0,
        supermarket: 0,
        laundry: 0,
        tourism: 0,
        custom: 0,
        search: 0,
        found: 0,
    });
    const requestSeqRef = useRef({ supercat1: 0, supercat2: 0, supercat3: 0, supercat4: 0, search: 0 });
    const supercatDisabledRef = useRef({ supercat1: false, supercat2: false, supercat3: false, supercat4: false });

    // 🧯 Anti-loop: si el UI dispara repetido (map/efectos), evitamos abort+restart del MISMO request.
    // - Si llega la misma key y hay in-flight: reusar.
    // - Si llega key distinta: abortar la anterior y lanzar la nueva.
    // - Cooldown corto post-completado para evitar ráfagas innecesarias.
    const supercatInFlightRef = useRef<{
        supercat1?: { key: string; controller: AbortController };
        supercat2?: { key: string; controller: AbortController };
        supercat3?: { key: string; controller: AbortController };
        supercat4?: { key: string; controller: AbortController };
    }>({});
    const supercatLastDoneAtRef = useRef<Record<string, number>>({});
    const SUPERCAT_COOLDOWN_MS = 2500;

    // 📊 Debug interno (para diagnosticar loops sin mirar Supabase)
    const supercatDebugRef = useRef({
        inFlightDedupe: 0,
        cooldownSkip: 0,
        abortedOnKeyChange: 0,
        started: 0,
        finished: 0,
        lastLogAt: 0,
    });

    const logSupercatDebug = useCallback(
        (
            event:
                | 'inFlight-dedupe'
                | 'cooldown-skip'
                | 'abort-key-change'
                | 'start'
                | 'finish',
            supercat: Supercat,
            key: string
        ) => {
            const d = supercatDebugRef.current;
            if (event === 'inFlight-dedupe') d.inFlightDedupe += 1;
            else if (event === 'cooldown-skip') d.cooldownSkip += 1;
            else if (event === 'abort-key-change') d.abortedOnKeyChange += 1;
            else if (event === 'start') d.started += 1;
            else if (event === 'finish') d.finished += 1;

            // Evitar spam: log como máximo cada 2s (y siempre que haya evento raro).
            const now = Date.now();
            const isRare = event !== 'start' && event !== 'finish';
            if (!isRare && now - d.lastLogAt < 2000) return;
            d.lastLogAt = now;

            // Nota: console.debug para no ensuciar demasiado.
            console.debug('🧯 [places-supercat-dedupe]', {
                event,
                supercat,
                key,
                counts: {
                    inFlightDedupe: d.inFlightDedupe,
                    cooldownSkip: d.cooldownSkip,
                    abortedOnKeyChange: d.abortedOnKeyChange,
                    started: d.started,
                    finished: d.finished,
                },
            });
        },
        []
    );
    const abortStore = useMemo(
        () => ({
            supercat1: undefined as AbortController | undefined,
            supercat2: undefined as AbortController | undefined,
            supercat3: undefined as AbortController | undefined,
            supercat4: undefined as AbortController | undefined,
            search: undefined as AbortController | undefined,
        }),
        []
    );

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            abortStore.supercat1?.abort();
            abortStore.supercat2?.abort();
            abortStore.supercat3?.abort();
            abortStore.supercat4?.abort();
            abortStore.search?.abort();
        };
    }, [abortStore]);

    const haversineDistanceM = useCallback((a: Coordinates, b: Coordinates) => {
        const R = 6371e3;
        const φ1 = (a.lat * Math.PI) / 180;
        const φ2 = (b.lat * Math.PI) / 180;
        const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
        const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
        const sinΔφ = Math.sin(Δφ / 2);
        const sinΔλ = Math.sin(Δλ / 2);
        const x = sinΔφ * sinΔφ + Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ;
        return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    }, []);

    const distanceFromCenter = useCallback((center: Coordinates, spot: Coordinates) => {
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
    }, [haversineDistanceM]);

    const toPhotoUrl = useCallback((p: ServerPlace): string | undefined => {
        // Legacy Places Photos: photo_reference (used by NearbySearch legacy JSON)
        const ref = p.photos?.[0]?.photo_reference;
        if (ref) {
            return `/api/google/place-photo?ref=${encodeURIComponent(ref)}&maxwidth=400`;
        }

        // Places API (New) photos: photo resource name (places/..../photos/..)
        const photoName = p.photoName;
        if (photoName) {
            return `/api/google/place-photo?name=${encodeURIComponent(photoName)}&maxwidth=400&maxheight=400`;
        }

        return undefined;
    }, []);

    const toPlace = useCallback((center: Coordinates, type: ServiceType, p: ServerPlace): PlaceWithDistance => {
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
            note: p.note,
            link: p.link,
        };
    }, [distanceFromCenter, toPhotoUrl]);

    const fetchSupercat = useCallback(async (supercat: Supercat, center: Coordinates, radiusMeters: number, signal?: AbortSignal) => {
        const radius = Math.max(1000, Math.min(50000, Math.round(radiusMeters)));
        const clientId = getOrCreateClientId();
        const res = await fetch('/api/places-supercat', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                ...(clientId ? { 'x-caracola-client-id': clientId } : {}),
                ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({
                tripId: tripId || undefined,
                tripName: tripName || undefined,
                center,
                radius,
                supercat,
            })
            ,
            signal,
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
    }, [authToken, tripId, tripName]);

    // BÚSQUEDA ESTÁNDAR (Categorías)
    // Control absoluto: NO usar PlacesService/Autocomplete en cliente. Todo va por /api/places-supercat.
    const searchPlaces = useCallback((location: Coordinates, type: ServiceType) => {
        if (type === 'custom' || type === 'search' || type === 'found') return;

        const seq = (requestSeqByTypeRef.current[type] || 0) + 1;
        requestSeqByTypeRef.current[type] = seq;

        const radiusMeters = effectiveRadiusMetersForType(type);
        const cacheKey = `${type}_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}_r${radiusMeters}`;

        if (placesCache.current[cacheKey]) {
            setPlaces(prev => ({ ...prev, [type]: placesCache.current[cacheKey] }));
            return;
        }

        const supercat: Supercat =
            type === 'camping'
                ? 1
                : type === 'restaurant' || type === 'supermarket'
                    ? 2
                    : type === 'gas' || type === 'laundry'
                        ? 3
                        : 4;

        setLoadingPlaces(prev => ({ ...prev, [type]: true }));

        (async () => {
            try {
                const data = await fetchSupercat(supercat, location, radiusMeters);
                if (!isMountedRef.current) return;
                if (requestSeqByTypeRef.current[type] !== seq) return;

                const raw = (data.categories[type] || []) as ServerPlace[];
                const list = raw.map(p => toPlace(location, type, p));

                placesCache.current[cacheKey] = list;
                setPlaces(prev => ({ ...prev, [type]: list }));
            } catch (e) {
                console.error(`❌ [${type}] places-supercat fallback failed:`, e);
                if (!isMountedRef.current) return;
                if (requestSeqByTypeRef.current[type] !== seq) return;
                placesCache.current[cacheKey] = [];
                setPlaces(prev => ({ ...prev, [type]: [] }));
            } finally {
                if (isMountedRef.current && requestSeqByTypeRef.current[type] === seq) {
                    setLoadingPlaces(prev => ({ ...prev, [type]: false }));
                }
            }
        })();
    }, [effectiveRadiusMetersForType, fetchSupercat, toPlace]);

    // --- SOLUCIÓN AGRESIVA: 4 llamadas deterministas (1 request por bloque) ---

    // 1) Spots (camping)
    const searchBlockSpots = useCallback((location: Coordinates) => {
        const radiusMeters = effectiveRadiusMetersForType('camping');
        const cacheKey = `supercat1_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}_r${radiusMeters}`;

        setLoadingPlaces(prev => ({...prev, camping: true}));

        if (supercatDisabledRef.current.supercat1) {
            searchPlaces(location, 'camping');
            return;
        }

        if (placesCache.current[cacheKey]) {
            const cached = placesCache.current[cacheKey];
            setPlaces(prev => ({ ...prev, camping: cached.filter(p => p.type === 'camping') }));
            setLoadingPlaces(prev => ({...prev, camping: false}));
            return;
        }

        const now = Date.now();
        const lastDoneAt = supercatLastDoneAtRef.current[cacheKey] || 0;
        if (now - lastDoneAt < SUPERCAT_COOLDOWN_MS) {
            logSupercatDebug('cooldown-skip', 1, cacheKey);
            setLoadingPlaces(prev => ({...prev, camping: false}));
            return;
        }

        const existing = supercatInFlightRef.current.supercat1;
        if (existing?.key === cacheKey) {
            // Ya hay una request idéntica en vuelo; no abortar ni relanzar.
            logSupercatDebug('inFlight-dedupe', 1, cacheKey);
            return;
        }

        // Key distinta: abortamos la anterior para que "gane" la última.
        if (existing?.controller) {
            logSupercatDebug('abort-key-change', 1, `${existing.key} -> ${cacheKey}`);
            existing.controller.abort();
        }

        const seq = ++requestSeqRef.current.supercat1;
        const controller = new AbortController();
        abortStore.supercat1 = controller;
        supercatInFlightRef.current.supercat1 = { key: cacheKey, controller };
        logSupercatDebug('start', 1, cacheKey);

        (async () => {
            let didFallbackToClient = false;
            try {
                const data = await fetchSupercat(1, location, radiusMeters, controller.signal);
                if (!isMountedRef.current || requestSeqRef.current.supercat1 !== seq) return;

                const campingRaw = (data.categories.camping || []) as ServerPlace[];
                // Importante: NO refiltrar aquí con heurísticas de cliente.
                // El servidor ya separa categorías (portero), y a veces `types` viene vacío.
                const campingList = campingRaw.map(p => toPlace(location, 'camping', p));

                placesCache.current[cacheKey] = campingList;
                setPlaces(prev => ({ ...prev, camping: campingList }));
            } catch (e) {
                if ((e as { name?: string })?.name === 'AbortError') return;
                console.error('❌ [places-supercat-1] Error:', e);
                supercatDisabledRef.current.supercat1 = true;
                didFallbackToClient = true;
                if (isMountedRef.current && requestSeqRef.current.supercat1 === seq) {
                    searchPlaces(location, 'camping');
                }
            } finally {
                if (supercatInFlightRef.current.supercat1?.key === cacheKey) {
                    supercatInFlightRef.current.supercat1 = undefined;
                }
                supercatLastDoneAtRef.current[cacheKey] = Date.now();
                logSupercatDebug('finish', 1, cacheKey);
                if (didFallbackToClient) return;
                if (isMountedRef.current && requestSeqRef.current.supercat1 === seq) {
                    setLoadingPlaces(prev => ({...prev, camping: false}));
                }
            }
        })();
    }, [abortStore, effectiveRadiusMetersForType, fetchSupercat, logSupercatDebug, searchPlaces, toPlace]);

    // 2) Comer + Super
    const searchBlockFood = useCallback((location: Coordinates) => {
        const radiusMeters = clampRadiusMeters(
            Math.min(
                Number.isFinite(searchRadiusKm) ? searchRadiusKm : 10,
                Math.max(RADIUS_CAPS_KM.restaurant, RADIUS_CAPS_KM.supermarket)
            )
        );
        const cacheKey = `supercat2_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}_r${radiusMeters}`;

        setLoadingPlaces(prev => ({...prev, restaurant: true, supermarket: true}));

        if (supercatDisabledRef.current.supercat2) {
            searchPlaces(location, 'restaurant');
            searchPlaces(location, 'supermarket');
            return;
        }

        if (placesCache.current[cacheKey]) {
            const cached = placesCache.current[cacheKey];
            setPlaces(prev => ({
                ...prev,
                restaurant: cached.filter(p => p.type === 'restaurant'),
                supermarket: cached.filter(p => p.type === 'supermarket'),
            }));
            setLoadingPlaces(prev => ({...prev, restaurant: false, supermarket: false}));
            return;
        }

        const now = Date.now();
        const lastDoneAt = supercatLastDoneAtRef.current[cacheKey] || 0;
        if (now - lastDoneAt < SUPERCAT_COOLDOWN_MS) {
            logSupercatDebug('cooldown-skip', 2, cacheKey);
            setLoadingPlaces(prev => ({...prev, restaurant: false, supermarket: false}));
            return;
        }

        const existing = supercatInFlightRef.current.supercat2;
        if (existing?.key === cacheKey) {
            logSupercatDebug('inFlight-dedupe', 2, cacheKey);
            return;
        }
        if (existing?.controller) {
            logSupercatDebug('abort-key-change', 2, `${existing.key} -> ${cacheKey}`);
            existing.controller.abort();
        }

        const seq = ++requestSeqRef.current.supercat2;
        const controller = new AbortController();
        abortStore.supercat2 = controller;
        supercatInFlightRef.current.supercat2 = { key: cacheKey, controller };
        logSupercatDebug('start', 2, cacheKey);

        (async () => {
            let didFallbackToClient = false;
            try {
                const data = await fetchSupercat(2, location, radiusMeters, controller.signal);
                if (!isMountedRef.current || requestSeqRef.current.supercat2 !== seq) return;

                const restaurantRaw = (data.categories.restaurant || []) as ServerPlace[];
                const supermarketRaw = (data.categories.supermarket || []) as ServerPlace[];

                // Confiamos en la clasificación del servidor; evita falsos negativos si faltan `types`.
                const restaurantList = restaurantRaw.map(p => toPlace(location, 'restaurant', p));
                const supermarketList = supermarketRaw.map(p => toPlace(location, 'supermarket', p));

                const merged = [...restaurantList, ...supermarketList];
                placesCache.current[cacheKey] = merged;
                setPlaces(prev => ({ ...prev, restaurant: restaurantList, supermarket: supermarketList }));
            } catch (e) {
                if ((e as { name?: string })?.name === 'AbortError') return;
                console.error('❌ [places-supercat-2] Error:', e);
                supercatDisabledRef.current.supercat2 = true;
                didFallbackToClient = true;
                if (isMountedRef.current && requestSeqRef.current.supercat2 === seq) {
                    searchPlaces(location, 'restaurant');
                    searchPlaces(location, 'supermarket');
                }
            } finally {
                if (supercatInFlightRef.current.supercat2?.key === cacheKey) {
                    supercatInFlightRef.current.supercat2 = undefined;
                }
                supercatLastDoneAtRef.current[cacheKey] = Date.now();
                logSupercatDebug('finish', 2, cacheKey);
                if (didFallbackToClient) return;
                if (isMountedRef.current && requestSeqRef.current.supercat2 === seq) {
                    setLoadingPlaces(prev => ({...prev, restaurant: false, supermarket: false}));
                }
            }
        })();
    }, [abortStore, clampRadiusMeters, fetchSupercat, logSupercatDebug, searchPlaces, searchRadiusKm, toPlace, RADIUS_CAPS_KM]);

    // 3) Gas + Lavar
    const searchBlockServices = useCallback((location: Coordinates) => {
        const radiusMeters = clampRadiusMeters(
            Math.min(
                Number.isFinite(searchRadiusKm) ? searchRadiusKm : 10,
                Math.max(RADIUS_CAPS_KM.gas, RADIUS_CAPS_KM.laundry)
            )
        );
        const cacheKey = `supercat3_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}_r${radiusMeters}`;

        setLoadingPlaces(prev => ({...prev, gas: true, laundry: true}));

        if (supercatDisabledRef.current.supercat3) {
            searchPlaces(location, 'gas');
            searchPlaces(location, 'laundry');
            return;
        }

        if (placesCache.current[cacheKey]) {
            const cached = placesCache.current[cacheKey];
            setPlaces(prev => ({
                ...prev,
                gas: cached.filter(p => p.type === 'gas'),
                laundry: cached.filter(p => p.type === 'laundry'),
            }));
            setLoadingPlaces(prev => ({...prev, gas: false, laundry: false}));
            return;
        }

        const now = Date.now();
        const lastDoneAt = supercatLastDoneAtRef.current[cacheKey] || 0;
        if (now - lastDoneAt < SUPERCAT_COOLDOWN_MS) {
            logSupercatDebug('cooldown-skip', 3, cacheKey);
            setLoadingPlaces(prev => ({...prev, gas: false, laundry: false}));
            return;
        }

        const existing = supercatInFlightRef.current.supercat3;
        if (existing?.key === cacheKey) {
            logSupercatDebug('inFlight-dedupe', 3, cacheKey);
            return;
        }
        if (existing?.controller) {
            logSupercatDebug('abort-key-change', 3, `${existing.key} -> ${cacheKey}`);
            existing.controller.abort();
        }

        const seq = ++requestSeqRef.current.supercat3;
        const controller = new AbortController();
        abortStore.supercat3 = controller;
        supercatInFlightRef.current.supercat3 = { key: cacheKey, controller };
        logSupercatDebug('start', 3, cacheKey);

        (async () => {
            let didFallbackToClient = false;
            try {
                const data = await fetchSupercat(3, location, radiusMeters, controller.signal);
                if (!isMountedRef.current || requestSeqRef.current.supercat3 !== seq) return;

                const gasRaw = (data.categories.gas || []) as ServerPlace[];
                const laundryRaw = (data.categories.laundry || []) as ServerPlace[];

                const gasList = gasRaw.map(p => toPlace(location, 'gas', p));
                const laundryList = laundryRaw.map(p => toPlace(location, 'laundry', p));

                const merged = [...gasList, ...laundryList];
                placesCache.current[cacheKey] = merged;
                setPlaces(prev => ({ ...prev, gas: gasList, laundry: laundryList }));
            } catch (e) {
                if ((e as { name?: string })?.name === 'AbortError') return;
                console.error('❌ [places-supercat-3] Error:', e);
                supercatDisabledRef.current.supercat3 = true;
                didFallbackToClient = true;
                if (isMountedRef.current && requestSeqRef.current.supercat3 === seq) {
                    searchPlaces(location, 'gas');
                    searchPlaces(location, 'laundry');
                }
            } finally {
                if (supercatInFlightRef.current.supercat3?.key === cacheKey) {
                    supercatInFlightRef.current.supercat3 = undefined;
                }
                supercatLastDoneAtRef.current[cacheKey] = Date.now();
                logSupercatDebug('finish', 3, cacheKey);
                if (didFallbackToClient) return;
                if (isMountedRef.current && requestSeqRef.current.supercat3 === seq) {
                    setLoadingPlaces(prev => ({...prev, gas: false, laundry: false}));
                }
            }
        })();
    }, [abortStore, clampRadiusMeters, fetchSupercat, logSupercatDebug, searchPlaces, searchRadiusKm, toPlace, RADIUS_CAPS_KM]);

    // 4) Turismo
    const searchBlockTourism = useCallback((location: Coordinates) => {
        const radiusMeters = effectiveRadiusMetersForType('tourism');
        const cacheKey = `supercat4_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}_r${radiusMeters}`;

        setLoadingPlaces(prev => ({...prev, tourism: true}));

        if (supercatDisabledRef.current.supercat4) {
            searchPlaces(location, 'tourism');
            return;
        }

        if (placesCache.current[cacheKey]) {
            const cached = placesCache.current[cacheKey];
            setPlaces(prev => ({ ...prev, tourism: cached.filter(p => p.type === 'tourism') }));
            setLoadingPlaces(prev => ({...prev, tourism: false}));
            return;
        }

        const now = Date.now();
        const lastDoneAt = supercatLastDoneAtRef.current[cacheKey] || 0;
        if (now - lastDoneAt < SUPERCAT_COOLDOWN_MS) {
            logSupercatDebug('cooldown-skip', 4, cacheKey);
            setLoadingPlaces(prev => ({...prev, tourism: false}));
            return;
        }

        const existing = supercatInFlightRef.current.supercat4;
        if (existing?.key === cacheKey) {
            logSupercatDebug('inFlight-dedupe', 4, cacheKey);
            return;
        }
        if (existing?.controller) {
            logSupercatDebug('abort-key-change', 4, `${existing.key} -> ${cacheKey}`);
            existing.controller.abort();
        }

        const seq = ++requestSeqRef.current.supercat4;
        const controller = new AbortController();
        abortStore.supercat4 = controller;
        supercatInFlightRef.current.supercat4 = { key: cacheKey, controller };
        logSupercatDebug('start', 4, cacheKey);

        (async () => {
            let didFallbackToClient = false;
            try {
                const data = await fetchSupercat(4, location, radiusMeters, controller.signal);
                if (!isMountedRef.current || requestSeqRef.current.supercat4 !== seq) return;

                const tourismRaw = (data.categories.tourism || []) as ServerPlace[];
                const tourismList = tourismRaw.map(p => toPlace(location, 'tourism', p));

                placesCache.current[cacheKey] = tourismList;
                setPlaces(prev => ({ ...prev, tourism: tourismList }));
            } catch (e) {
                if ((e as { name?: string })?.name === 'AbortError') return;
                console.error('❌ [places-supercat-4] Error:', e);
                supercatDisabledRef.current.supercat4 = true;
                didFallbackToClient = true;
                if (isMountedRef.current && requestSeqRef.current.supercat4 === seq) {
                    searchPlaces(location, 'tourism');
                }
            } finally {
                if (supercatInFlightRef.current.supercat4?.key === cacheKey) {
                    supercatInFlightRef.current.supercat4 = undefined;
                }
                supercatLastDoneAtRef.current[cacheKey] = Date.now();
                logSupercatDebug('finish', 4, cacheKey);
                if (didFallbackToClient) return;
                if (isMountedRef.current && requestSeqRef.current.supercat4 === seq) {
                    setLoadingPlaces(prev => ({...prev, tourism: false}));
                }
            }
        })();
    }, [abortStore, effectiveRadiusMetersForType, fetchSupercat, logSupercatDebug, searchPlaces, toPlace]);

    // --- BÚSQUEDA LIBRE (NOMINATIM/OSM) - GRATIS, SIN COSTO API ---
    const searchByQuery = useCallback(async (query: string, centerLat: number, centerLng: number) => {
        if (!query.trim()) return;

        const seq = ++requestSeqRef.current.search;
        abortStore.search?.abort();
        abortStore.search = new AbortController();

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

            const response = await fetch(nominatimUrl.toString(), { signal: abortStore.search?.signal });
            
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
            if (isMountedRef.current && requestSeqRef.current.search === seq) {
                setPlaces(prev => ({...prev, search: finalSpots}));
            }
            
            console.log(`✅ [search] Búsqueda Nominatim completada:`, {
                resultadosFinales: finalSpots.length,
                cacheKey,
                costo: '$0.00'
            });
        } catch (error) {
            if ((error as { name?: string })?.name === 'AbortError') return;
            console.error(`❌ [search] Error en Nominatim:`, error);
            if (isMountedRef.current && requestSeqRef.current.search === seq) {
                setPlaces(prev => ({...prev, search: []}));
            }
        } finally {
            if (isMountedRef.current && requestSeqRef.current.search === seq) {
                setLoadingPlaces(prev => ({...prev, search: false}));
            }
        }
    }, [abortStore]);

    const clearSearch = useCallback(() => {
        setPlaces(prev => ({...prev, search: []}));
        setToggles(prev => ({...prev, search: false}));
    }, []);

    // ... (Resto igual)
    const handleToggle = useCallback((type: ServiceType, coordinates?: Coordinates) => {
        const newState = !toggles[type];
        // Solo cambiamos el toggle clicado; no tocamos los demás
        setToggles(prev => ({...prev, [type]: newState}));

        console.log('🟦 [toggle]', {
            type,
            newState,
            hasCoordinates: !!coordinates,
            coordinates,
        });
        
        // Solo buscamos si se enciende Y tenemos coordenadas
        if (newState && coordinates) {
            // Solución agresiva: 4 llamadas deterministas
            if (type === 'camping') {
                searchBlockSpots(coordinates);
            } else if (type === 'restaurant' || type === 'supermarket') {
                searchBlockFood(coordinates);
            } else if (type === 'gas' || type === 'laundry') {
                searchBlockServices(coordinates);
            } else if (type === 'tourism') {
                searchBlockTourism(coordinates);
            } else {
                searchPlaces(coordinates, type);
            }
        }
    }, [searchBlockFood, searchBlockServices, searchBlockSpots, searchBlockTourism, searchPlaces, toggles]);

    const resetPlaces = useCallback(() => {
        // Opcional: Podríamos limpiar la caché aquí si quisiéramos forzar recarga al cambiar de viaje
        // placesCache.current = {}; 
        setToggles({ camping: false, restaurant: false, gas: false, supermarket: false, laundry: false, tourism: false, custom: false, search: false, found: false });
        setPlaces({ camping: [], restaurant: [], gas: [], supermarket: [], laundry: [], tourism: [], custom: [], search: [], found: [] });
    }, []);

    return { 
        places, loadingPlaces, toggles, 
        searchPlaces,
        searchBlockSpots,
        searchBlockFood,
        searchBlockServices,
        searchBlockTourism,
        searchByQuery,
        clearSearch,
        handleToggle,
        resetPlaces 
    };
}