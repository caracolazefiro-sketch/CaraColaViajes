// app/hooks/useTripPersistence.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { TripResult } from '../types';

export interface TripData {
    formData: Record<string, string | number | boolean>;
    results: TripResult;
    tripId?: number;
    apiTripId?: string | null;
}

export function useTripPersistence<T extends Record<string, string | number | boolean>>(
    formData: T,
    setFormData: (data: T | ((prev: T) => T)) => void,
    results: TripResult,
    setResults: (results: TripResult) => void,
    currentTripId: number | null,
    setCurrentTripId: (id: number | null) => void,
    // Funciones extra para resetear la UI al cargar un viaje
    resetUiState?: () => void,
    apiTripId?: string | null,
    setApiTripId?: (tripId: string | null) => void
) {
    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [hasLoadedUserData, setHasLoadedUserData] = useState(false);
    const previousUserIdRef = useRef<string | null>(null);

    const normalizeTripResults = useCallback((raw: TripResult): TripResult => {
        const dailyItinerary = Array.isArray(raw.dailyItinerary)
            ? raw.dailyItinerary.map((d) => {
                const distance = typeof (d as unknown as { distance?: unknown }).distance === 'string'
                    ? Number((d as unknown as { distance: string }).distance)
                    : d.distance;
                const durationMinRaw = (d as unknown as { durationMin?: unknown }).durationMin;
                const durationMin = typeof durationMinRaw === 'string' ? Number(durationMinRaw) : d.durationMin;
                return {
                    ...d,
                    distance: Number.isFinite(distance) ? Number(distance) : d.distance,
                    durationMin: typeof durationMin === 'number' && Number.isFinite(durationMin) ? durationMin : d.durationMin,
                };
            })
            : raw.dailyItinerary;

        return {
            ...raw,
            totalDays: typeof (raw as unknown as { totalDays?: unknown }).totalDays === 'string'
                ? Number((raw as unknown as { totalDays: string }).totalDays)
                : raw.totalDays,
            distanceKm: typeof (raw as unknown as { distanceKm?: unknown }).distanceKm === 'string'
                ? Number((raw as unknown as { distanceKm: string }).distanceKm)
                : raw.distanceKm,
            totalCost: typeof (raw as unknown as { totalCost?: unknown }).totalCost === 'string'
                ? Number((raw as unknown as { totalCost: string }).totalCost)
                : raw.totalCost,
            liters: typeof (raw as unknown as { liters?: unknown }).liters === 'string'
                ? Number((raw as unknown as { liters: string }).liters)
                : raw.liters,
            dailyItinerary,
        };
    }, []);

    const setApiTripIdSafe = useCallback(
        (tripId: string | null) => {
            if (setApiTripId) setApiTripId(tripId);
        },
        [setApiTripId]
    );

    // Obtener el user_id y cargar datos en un solo efecto
    useEffect(() => {
        const initializeUser = async () => {
            if (!supabase) {
                // Sin Supabase, limpiar todo
                setResults({ totalDays: null, distanceKm: null, totalCost: null, liters: null, dailyItinerary: null, error: null });
                setCurrentTripId(null);
                setUserId(null);
                previousUserIdRef.current = null;
                setApiTripIdSafe(null);
                setHasLoadedUserData(true);
                return;
            }
            
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user?.id) {
                // Usuario logueado: cargar su viaje guardado
                const currentUserId = session.user.id;
                setAccessToken(session.access_token || null);
                
                // Si cambió el usuario, limpiar el estado primero
                if (previousUserIdRef.current && previousUserIdRef.current !== currentUserId) {
                    setFormData({} as T);
                    setResults({ totalDays: null, distanceKm: null, totalCost: null, liters: null, dailyItinerary: null, error: null });
                    setCurrentTripId(null);
                    setApiTripIdSafe(null);
                    if (resetUiState) resetUiState();
                }
                
                setUserId(currentUserId);
                previousUserIdRef.current = currentUserId;
                
                if (typeof window !== 'undefined') {
                    const storageKey = `caracola_trip_v1_${currentUserId}`;
                    const savedData = localStorage.getItem(storageKey);
                    if (savedData) {
                        try {
                            const parsed = JSON.parse(savedData);
                            if (parsed.formData) setFormData(parsed.formData);
                            if (parsed.results) setResults(normalizeTripResults(parsed.results));
                            if (parsed.tripId) setCurrentTripId(parsed.tripId);
                            if (typeof parsed.apiTripId === 'string' || parsed.apiTripId === null) setApiTripIdSafe(parsed.apiTripId);
                        } catch (e: unknown) { 
                            console.error("Error leyendo caché:", e); 
                        }
                    }
                }
                setHasLoadedUserData(true);
            } else {
                // Sin sesión: limpiar todo (pantalla virgen)
                setResults({ totalDays: null, distanceKm: null, totalCost: null, liters: null, dailyItinerary: null, error: null });
                setCurrentTripId(null);
                setUserId(null);
                setAccessToken(null);
                previousUserIdRef.current = null;
                setApiTripIdSafe(null);
                setHasLoadedUserData(true);
            }
        };
        
        initializeUser();

        // Escuchar cambios de autenticación
        if (supabase) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user?.id) {
                    const newUserId = session.user.id;
                    setAccessToken(session.access_token || null);
                    
                    // Si es un usuario diferente, limpiar primero
                    if (previousUserIdRef.current && previousUserIdRef.current !== newUserId) {
                        setFormData({} as T);
                        setResults({ totalDays: null, distanceKm: null, totalCost: null, liters: null, dailyItinerary: null, error: null });
                        setCurrentTripId(null);
                        setApiTripIdSafe(null);
                        if (resetUiState) resetUiState();
                    }
                    
                    setUserId(newUserId);
                    previousUserIdRef.current = newUserId;
                    
                    // Cargar datos del nuevo usuario
                    if (typeof window !== 'undefined') {
                        const storageKey = `caracola_trip_v1_${newUserId}`;
                        const savedData = localStorage.getItem(storageKey);
                        if (savedData) {
                            try {
                                const parsed = JSON.parse(savedData);
                                if (parsed.formData) setFormData(parsed.formData);
                                if (parsed.results) setResults(normalizeTripResults(parsed.results));
                                if (parsed.tripId) setCurrentTripId(parsed.tripId);
                                if (typeof parsed.apiTripId === 'string' || parsed.apiTripId === null) setApiTripIdSafe(parsed.apiTripId);
                            } catch (e: unknown) { 
                                console.error("Error leyendo caché:", e); 
                            }
                        }
                    }
                    setHasLoadedUserData(true);
                } else if (event === 'SIGNED_OUT') {
                    // Limpiar todo al hacer logout
                    setFormData({} as T);
                    setResults({ totalDays: null, distanceKm: null, totalCost: null, liters: null, dailyItinerary: null, error: null });
                    setCurrentTripId(null);
                    setUserId(null);
                    setAccessToken(null);
                    setApiTripIdSafe(null);
                    if (resetUiState) resetUiState();
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [normalizeTripResults, resetUiState, setApiTripIdSafe, setCurrentTripId, setFormData, setResults]);

    // 2. AUTOGUARDADO (LocalStorage con user_id)
    useEffect(() => {
        if (hasLoadedUserData && typeof window !== 'undefined' && userId) {
            const storageKey = `caracola_trip_v1_${userId}`;
            const dataToSave = { formData, results, tripId: currentTripId, apiTripId: apiTripId ?? null };
            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        }
    }, [formData, results, currentTripId, hasLoadedUserData, userId, apiTripId]);

    // 3. ACCIONES (Handlers)

    const handleResetTrip = () => {
        console.log('🗑️ handleResetTrip llamado');
        const confirmed = window.confirm("¿Borrar viaje y empezar de cero?");
        console.log('🗑️ Usuario confirmó:', confirmed);
        if (confirmed) {
            console.log('🗑️ Limpiando localStorage...');
            
            // Borrar ambas claves: con y sin userId
            const storageKeyWithUser = userId ? `caracola_trip_v1_${userId}` : null;
            const storageKeyLegacy = 'caracola_trip_v1';
            
            console.log('🗑️ Keys a borrar:', { storageKeyWithUser, storageKeyLegacy });
            
            const beforeWithUser = storageKeyWithUser ? localStorage.getItem(storageKeyWithUser) : null;
            const beforeLegacy = localStorage.getItem(storageKeyLegacy);
            console.log('🗑️ Contenido ANTES:', { 
                withUser: beforeWithUser ? 'EXISTS' : 'NULL',
                legacy: beforeLegacy ? 'EXISTS' : 'NULL'
            });
            
            if (storageKeyWithUser) localStorage.removeItem(storageKeyWithUser);
            localStorage.removeItem(storageKeyLegacy);
            
            const afterWithUser = storageKeyWithUser ? localStorage.getItem(storageKeyWithUser) : null;
            const afterLegacy = localStorage.getItem(storageKeyLegacy);
            console.log('🗑️ Contenido DESPUÉS:', { 
                withUser: afterWithUser ? 'STILL EXISTS (ERROR!)' : 'NULL',
                legacy: afterLegacy ? 'STILL EXISTS (ERROR!)' : 'NULL'
            });
            
            console.log('🗑️ Recargando página...');
            window.location.reload();
        }
    };

    const handleLoadCloudTrip = (tripData: TripData, tripId: number) => {
        if (tripData) {
            setFormData(tripData.formData as T);
            setResults(normalizeTripResults(tripData.results));
            setCurrentTripId(tripId);
            // Correlación estable para logs cuando el viaje viene de cloud
            setApiTripIdSafe(tripData.apiTripId ?? `cloud-${tripId}`);
            // Limpiamos la UI (mapa, selección...)
            if (resetUiState) resetUiState();
            alert(`✅ Viaje cargado. (ID: ${tripId})`);
        }
    };

    const handleShareTrip = async () => {
        if (!currentTripId || !supabase) return alert("Guarda el viaje primero.");
        const client = supabase;
        const { error } = await client.from('trips').update({ is_public: true }).eq('id', currentTripId);
        if (error) return alert("Error: " + error.message);
        
        const shareUrl = `${window.location.origin}/share/${currentTripId}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert(`🔗 Enlace copiado:\n\n${shareUrl}`);
        } catch {
            prompt("Copia este enlace:", shareUrl);
        }
    };

    const handleSaveToCloud = async () => {
        if (!results.dailyItinerary || !supabase) return;
        const client = supabase;
        const { data: { session } } = await client.auth.getSession();
        if (!session) return alert("Inicia sesión para guardar.");

        setIsSaving(true);
        // Usar el nombre personalizado del viaje o generar uno automático
        const origenStr = String(formData.origen || '');
        const destinoStr = String(formData.destino || '');
        const tripName = formData.tripName || `${origenStr.split(',')[0]} → ${destinoStr.split(',')[0]} (${formData.fechaInicio})`;
        const tripPayload = { formData, results };

        try {
            if (currentTripId) {
                const overwrite = confirm(`¿Sobrescribir viaje existente (ID: ${currentTripId})?\nCancelar = Guardar copia nueva`);
                if (overwrite) {
                    const { error } = await client.from('trips').update({ name: tripName, trip_data: tripPayload, updated_at: new Date().toISOString() }).eq('id', currentTripId);
                    if (error) throw error;
                    setApiTripIdSafe(`cloud-${currentTripId}`);
                    alert("✅ Actualizado correctamente.");
                } else {
                    const { data, error } = await client.from('trips').insert([{ name: tripName + " (Copia)", trip_data: tripPayload, user_id: session.user.id }]).select();
                    if (error) throw error;
                    if (data && data[0]) {
                        setCurrentTripId(data[0].id);
                        setApiTripIdSafe(`cloud-${data[0].id}`);
                    }
                    alert("✅ Copia guardada.");
                }
            } else {
                const { data, error } = await client.from('trips').insert([{ name: tripName, trip_data: tripPayload, user_id: session.user.id }]).select();
                if (error) throw error;
                if (data && data[0]) {
                    setCurrentTripId(data[0].id);
                    setApiTripIdSafe(`cloud-${data[0].id}`);
                }
                alert("✅ Viaje nuevo guardado.");
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            alert("❌ Error: " + msg);
        } finally {
            setIsSaving(false);
        }
    };

    return {
        isSaving,
        auth: {
            userId,
            accessToken,
            isLoggedIn: Boolean(userId),
        },
        handleResetTrip,
        handleLoadCloudTrip,
        handleShareTrip,
        handleSaveToCloud
    };
}