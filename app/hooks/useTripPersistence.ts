// app/hooks/useTripPersistence.ts
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { TripResult } from '../types';

export interface TripData {
    formData: Record<string, string | number | boolean>;
    results: TripResult;
    tripId?: number;
}

export function useTripPersistence<T extends Record<string, string | number | boolean>>(
    formData: T,
    setFormData: (data: T | ((prev: T) => T)) => void,
    results: TripResult,
    setResults: (results: TripResult) => void,
    currentTripId: number | null,
    setCurrentTripId: (id: number | null) => void,
    // Funciones extra para resetear la UI al cargar un viaje
    resetUiState?: () => void
) {
    const [isSaving, setIsSaving] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Obtener el user_id de Supabase
    useEffect(() => {
        const getUserId = async () => {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                setUserId(session.user.id);
            }
        };
        getUserId();
    }, []);

    // 1. CARGA INICIAL (LocalStorage con user_id)
    useEffect(() => {
        if (typeof window !== 'undefined' && userId) {
            const storageKey = `caracola_trip_v1_${userId}`;
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    if (parsed.formData) setFormData(parsed.formData);
                    if (parsed.results) setResults(parsed.results);
                    if (parsed.tripId) setCurrentTripId(parsed.tripId);
                } catch (e: unknown) { console.error("Error leyendo caché:", e); }
            }
            setIsInitialized(true);
        }
    }, [userId]);

    // 2. AUTOGUARDADO (LocalStorage con user_id)
    useEffect(() => {
        if (isInitialized && typeof window !== 'undefined' && userId) {
            const storageKey = `caracola_trip_v1_${userId}`;
            const dataToSave = { formData, results, tripId: currentTripId };
            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        }
    }, [formData, results, currentTripId, isInitialized, userId]);

    // 3. ACCIONES (Handlers)

    const handleResetTrip = () => {
        if (confirm("¿Borrar viaje y empezar de cero?")) {
            localStorage.removeItem('caracola_trip_v1');
            window.location.reload();
        }
    };

    const handleLoadCloudTrip = (tripData: TripData, tripId: number) => {
        if (tripData) {
            setFormData(tripData.formData as T);
            setResults(tripData.results);
            setCurrentTripId(tripId);
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
                    alert("✅ Actualizado correctamente.");
                } else {
                    const { data, error } = await client.from('trips').insert([{ name: tripName + " (Copia)", trip_data: tripPayload, user_id: session.user.id }]).select();
                    if (error) throw error;
                    if (data && data[0]) setCurrentTripId(data[0].id);
                    alert("✅ Copia guardada.");
                }
            } else {
                const { data, error } = await client.from('trips').insert([{ name: tripName, trip_data: tripPayload, user_id: session.user.id }]).select();
                if (error) throw error;
                if (data && data[0]) setCurrentTripId(data[0].id);
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
        handleResetTrip,
        handleLoadCloudTrip,
        handleShareTrip,
        handleSaveToCloud
    };
}