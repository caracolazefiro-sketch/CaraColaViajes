'use server';

import fs from 'fs';
import path from 'path';

interface GeocacheCacheEntry {
  cityName: string;
  timestamp: string;
  lat: number;
  lng: number;
}

interface GeocodingCache {
  [key: string]: GeocacheCacheEntry;
}

const CACHE_FILE = path.join(process.cwd(), 'data', 'geocoding-cache.json');
const MAX_CACHE_AGE_DAYS = 90; // Caché válido por 90 días

/**
 * Redondea coordenadas a 4 decimales (~11 metros de precisión)
 */
function roundCoord(num: number): number {
  return Math.round(num * 10000) / 10000;
}

/**
 * Genera clave de caché desde coordenadas
 */
function getCacheKey(lat: number, lng: number): string {
  const rLat = roundCoord(lat);
  const rLng = roundCoord(lng);
  return `${rLat},${rLng}`;
}

/**
 * Lee la caché del disco (o crea archivo vacío si no existe)
 */
function loadCache(): GeocodingCache {
  try {
    // Crear directorio si no existe
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Leer archivo si existe
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(data);
    }

    // Crear archivo vacío
    fs.writeFileSync(CACHE_FILE, JSON.stringify({}), 'utf-8');
    return {};
  } catch (error) {
    console.error('Error loading geocoding cache:', error);
    return {};
  }
}

/**
 * Guarda la caché al disco
 */
function saveCache(cache: GeocodingCache): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving geocoding cache:', error);
  }
}

/**
 * Verifica si una entrada de caché es válida (no expirada)
 * NOTA: Caché ilimitada - los nombres de ciudades no cambian
 */
function isEntryValid(entry: GeocacheCacheEntry): boolean {
  return true; // Caché ilimitada
}

/**
 * Obtiene nombre de ciudad desde la caché persistente
 * @returns Ciudad si está en caché y es válida, null si no
 */
export async function getCachedCityName(lat: number, lng: number): Promise<string | null> {
  const cache = loadCache();
  const key = getCacheKey(lat, lng);
  const entry = cache[key];

  if (entry && isEntryValid(entry)) {
    return entry.cityName;
  }

  return null;
}

/**
 * Guarda un resultado de geocoding en la caché persistente
 */
export async function setCachedCityName(lat: number, lng: number, cityName: string): Promise<void> {
  const cache = loadCache();
  const key = getCacheKey(lat, lng);

  cache[key] = {
    cityName,
    timestamp: new Date().toISOString(),
    lat: roundCoord(lat),
    lng: roundCoord(lng),
  };

  saveCache(cache);
}

/**
 * Obtiene estadísticas de la caché
 */
export async function getCacheStats(): Promise<{ total: number; valid: number; expired: number }> {
  const cache = loadCache();
  const entries = Object.values(cache);
  
  let valid = 0;
  let expired = 0;

  entries.forEach(entry => {
    if (isEntryValid(entry)) {
      valid++;
    } else {
      expired++;
    }
  });

  return {
    total: entries.length,
    valid,
    expired,
  };
}

/**
 * Limpia entradas expiradas de la caché
 */
export async function cleanExpiredCache(): Promise<number> {
  const cache = loadCache();
  let removed = 0;

  Object.entries(cache).forEach(([key, entry]) => {
    if (!isEntryValid(entry)) {
      delete cache[key];
      removed++;
    }
  });

  if (removed > 0) {
    saveCache(cache);
  }

  return removed;
}
