/**
 * useNominatimCache.ts
 * 
 * Hook para gestionar caché HÍBRIDA (memoria + localStorage) de búsquedas Nominatim.
 * Propósito: Evitar llamadas redundantes a Nominatim reutilizando resultados previos.
 * 
 * Flujo:
 * 1. Check memory cache (rápido)
 * 2. Check localStorage (persistente entre sesiones)
 * 3. Si no existe → fetch a Nominatim
 * 4. Guardar en ambas cachés
 * 
 * Ventajas:
 * - $0.00 para búsquedas repetidas
 * - Persistencia entre refresh de página
 * - Búsquedas compartidas entre contextos (geocoding + search)
 */

import { useRef, useCallback } from 'react';

export interface NominatimResult {
    osm_id: number;
    name: string;
    address: string;
    lat: string;
    lon: string;
    type: string;
    importance: number;
}

export interface CachedNominatimQuery {
    query: string;
    centerLat: number;
    centerLng: number;
    results: NominatimResult[];
    timestamp: number; // Para potencial invalidación
}

const STORAGE_KEY = 'nominatim_queries_v1';
const CACHE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

/**
 * Genera clave de caché basada en query + coordenadas
 * Utilizamos las mismas coordenadas redondeadas que usaTripPlaces para consistencia
 */
function getCacheKey(query: string, centerLat: number, centerLng: number): string {
    return `${query.trim()}_${centerLat.toFixed(4)}_${centerLng.toFixed(4)}`;
}

/**
 * Obtiene caché de localStorage (si existe)
 */
function loadFromLocalStorage(): Record<string, CachedNominatimQuery> {
    if (typeof window === 'undefined') return {};

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return {};

        const parsed = JSON.parse(stored) as Record<string, CachedNominatimQuery>;
        
        // Filtrar entries expiradas
        const now = Date.now();
        const valid = Object.fromEntries(
            Object.entries(parsed).filter(([, entry]) => {
                const age = now - entry.timestamp;
                return age < CACHE_EXPIRY_MS;
            })
        );

        return valid;
    } catch (error) {
        console.warn('❌ Error cargando localStorage Nominatim:', error);
        return {};
    }
}

/**
 * Guarda caché en localStorage
 */
function saveToLocalStorage(cache: Record<string, CachedNominatimQuery>): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.warn('❌ Error guardando en localStorage:', error);
        // Si localStorage está lleno, simplemente ignoramos (memoria sigue funcionando)
    }
}

export function useNominatimCache() {
    // Caché en memoria (persiste mientras la componente está montada)
    const memoryCache = useRef<Record<string, CachedNominatimQuery>>({});

    // Caché en localStorage (persiste entre sesiones)
    const persistentCache = useRef<Record<string, CachedNominatimQuery> | null>(null);

    /**
     * Obtiene caché persistente (lazy load)
     */
    const getPersistentCache = useCallback(() => {
        if (persistentCache.current === null) {
            persistentCache.current = loadFromLocalStorage();
        }
        return persistentCache.current;
    }, []);

    /**
     * Busca en caché (primero memoria, luego localStorage)
     */
    const checkCache = useCallback((
        query: string,
        centerLat: number,
        centerLng: number
    ): NominatimResult[] | null => {
        const key = getCacheKey(query, centerLat, centerLng);

        // 1. Check memoria
        if (memoryCache.current[key]) {
            console.log(`💾 [Cache] Resultado en MEMORIA:`, {
                query,
                location: `${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`,
                resultados: memoryCache.current[key].results.length,
                ahorro: '$0.00'
            });
            return memoryCache.current[key].results;
        }

        // 2. Check localStorage
        const persistent = getPersistentCache();
        if (persistent[key]) {
            console.log(`💾 [Cache] Resultado en localStorage:`, {
                query,
                location: `${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`,
                resultados: persistent[key].results.length,
                antigüedad: Math.round((Date.now() - persistent[key].timestamp) / 1000) + 's',
                ahorro: '$0.00'
            });

            // Copiar a memoria para futuro acceso más rápido
            memoryCache.current[key] = persistent[key];
            return persistent[key].results;
        }

        return null;
    }, [getPersistentCache]);

    /**
     * Guarda resultado en caché (memoria + localStorage)
     */
    const saveToCache = useCallback((
        query: string,
        centerLat: number,
        centerLng: number,
        results: NominatimResult[]
    ): void => {
        const key = getCacheKey(query, centerLat, centerLng);

        const cacheEntry: CachedNominatimQuery = {
            query,
            centerLat,
            centerLng,
            results,
            timestamp: Date.now()
        };

        // Guardar en memoria
        memoryCache.current[key] = cacheEntry;

        // Guardar en localStorage
        const persistent = getPersistentCache();
        persistent[key] = cacheEntry;
        saveToLocalStorage(persistent);

        console.log(`✅ [Cache] Guardado en MEMORIA + localStorage:`, {
            query,
            resultados: results.length
        });
    }, [getPersistentCache]);

    /**
     * Ejecuta búsqueda Nominatim (con caché automática)
     */
    const searchNominatim = useCallback(async (
        query: string,
        centerLat: number,
        centerLng: number
    ): Promise<NominatimResult[]> => {
        // 1. Verificar caché
        const cached = checkCache(query, centerLat, centerLng);
        if (cached) {
            return cached;
        }

        // 2. Fetch a Nominatim
        console.log(`🌐 [Nominatim] Iniciando búsqueda (caché miss):`, {
            query,
            location: `${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`,
            costo: '$0.00'
        });

        try {
            const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
            nominatimUrl.searchParams.append('q', query.trim());
            nominatimUrl.searchParams.append('format', 'json');
            nominatimUrl.searchParams.append('limit', '10');
            nominatimUrl.searchParams.append(
                'viewbox',
                `${centerLng - 0.18},${centerLat + 0.18},${centerLng + 0.18},${centerLat - 0.18}`
            );
            nominatimUrl.searchParams.append('bounded', '1');

            const response = await fetch(nominatimUrl.toString());

            if (!response.ok) {
                throw new Error(`Nominatim error: ${response.status}`);
            }

            const results = (await response.json()) as NominatimResult[];

            // 3. Guardar en caché
            saveToCache(query, centerLat, centerLng, results);

            return results;
        } catch (error) {
            console.error('❌ [Nominatim] Error:', error);
            return [];
        }
    }, [checkCache, saveToCache]);

    /**
     * Limpia toda la caché (útil para testing o reset manual)
     */
    const clearCache = useCallback((): void => {
        memoryCache.current = {};
        const persistent = getPersistentCache();
        Object.keys(persistent).forEach(key => delete persistent[key]);
        saveToLocalStorage({});
        console.log('🗑️ [Cache] Limpiada completamente');
    }, [getPersistentCache]);

    /**
     * Obtiene estadísticas de caché
     */
    const getCacheStats = useCallback((): { memory: number; persistent: number } => {
        const persistent = getPersistentCache();
        return {
            memory: Object.keys(memoryCache.current).length,
            persistent: Object.keys(persistent).length
        };
    }, [getPersistentCache]);

    return {
        checkCache,
        saveToCache,
        searchNominatim,
        clearCache,
        getCacheStats
    };
}
