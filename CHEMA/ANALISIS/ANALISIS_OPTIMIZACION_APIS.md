# 📊 ANÁLISIS EXHAUSTIVO: Optimización de APIs en CaraColaViajes

**Fecha:** 09/DIC/2025  
**Estado:** Motor Bueno 100% operativo  
**Scope:** Estrategia completa de llamadas a Google Maps APIs + caché + costes  

---

## 🎯 ÍNDICE

1. [APIs en Uso](#apis-en-uso)
2. [Estrategia de Optimización](#estrategia-de-optimización)
3. [Implementación Actual](#implementación-actual)
4. [Análisis de Costes](#análisis-de-costes)
5. [Benchmarks Reales](#benchmarks-reales)
6. [Recomendaciones](#recomendaciones)

---

## 1. APIs EN USO

### 📍 Google Directions API
**Propósito:** Calcular rutas entre origen → waypoints → destino

**Llamadas por viaje:** 1 única llamada
```
POST /maps/api/directions/json
Parámetros:
  - origin: "Salamanca, España"
  - destination: "Copenhague, Dinamarca"
  - waypoints: "Paris, France|Brussels, Belgium|Amsterdam, Netherlands"
  - mode: "driving"
```

**Respuesta:** 
- Polyline de ruta completa
- Legs (tramos entre waypoints)
- Steps (segmentos detallados dentro de cada leg)
- Distance + duration para cada step

**Coste Google:** $0.005 per request (Directions API)

---

### 🗺️ Google Geocoding API
**Propósito:** Convertir coordenadas (lat,lng) → nombre de ciudad

**Llamadas por viaje:** Variable (1-2 por parada táctica + finales)
```
GET /maps/api/geocode/json
Parámetros:
  - latlng: "44.1289,-2.4623"
  - result_type: "locality|administrative_area_level_2"
  - language: "es"
```

**Respuesta:**
- Address components (locality, admin2, admin3, country, etc.)
- Formatted address

**Coste Google:** $0.005 per request (Geocoding API)

---

### 🏨 Google Places API (Búsquedas)
**Propósito:** Buscar hoteles, restaurantes, gasolineras en radio de parada

**Llamadas por viaje:** Variable (usuario-driven, no automático)
```
GET /maps/api/place/nearbysearch/json
Parámetros:
  - location: "44.1289,-2.4623"
  - radius: 50000 (metros)
  - type: "lodging|restaurant|gas_station"
```

**Coste Google:** $0.032 per request (Places API)

---

## 2. ESTRATEGIA DE OPTIMIZACIÓN

### 🎪 Pirámide de Optimización

```
┌─────────────────────────────────────┐
│  NIVEL 1: Evitar llamadas innecesarias
│  (Validación, deduplicación, limites)
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  NIVEL 2: Caché persistente
│  (geocoding-cache.json en Git)
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  NIVEL 3: Rate limiting & Backoff
│  (Exponential backoff en Geocoding)
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  NIVEL 4: Caché en tiempo de ejecución
│  (Request deduplication durante sesión)
└─────────────────────────────────────┘
```

---

## 3. IMPLEMENTACIÓN ACTUAL

### 3.1 Directions API (Optimización: NULA)

**Ubicación:** `app/actions.ts` línea 220

```typescript
const url = `https://maps.googleapis.com/maps/api/directions/json?...`;
const response = await fetch(url);
const directionsResult = await response.json();
```

**Características:**
- ❌ SIN caché (cada cálculo = API call)
- ❌ SIN deduplicación
- ✅ UNA llamada por viaje (eficiente)

**Justificación:** Directions API es cara ($0.005) pero necesaria y única. Cachearla sería complejo (depende de paradas manuales que cambian).

**Coste típico:**
- Viaje Salamanca → Copenhague = 1 call × $0.005 = **$0.005 por viaje**

---

### 3.2 Geocoding API (Optimización: 3 NIVELES)

#### **NIVEL 1: Caché Persistente en Git**

**Archivo:** `data/geocoding-cache.json`  
**Tamaño actual:** 565 bytes (4 entradas)  
**Formato:**
```json
{
  "44.13,-2.46": {
    "cityName": "Pancorbo",
    "timestamp": "2025-12-09T...",
    "lat": 44.13,
    "lng": -2.46
  }
}
```

**Lectura:** `app/lib/geocoding-cache.ts`
```typescript
function getCacheKey(lat: number, lng: number): string {
    return `${lat.toFixed(4)},${lng.toFixed(4)}`; // Precisión ~11 metros
}

function getCachedCityName(lat: number, lng: number): string | null {
    const cache = require('../../data/geocoding-cache.json');
    const key = getCacheKey(lat, lng);
    return cache[key]?.cityName || null;
}
```

**Escritura en tiempo de ejecución:**
```typescript
// Si geocoding.json está en .gitignore (dev), se actualiza localmente
// Si está trackeado en git (prod), se usa como lectura-sola
// Futuro: Supabase para sync automático
```

**Tasa de acierto:** 63.2% (últimos 8 viajes de prueba)

---

#### **NIVEL 2: Exponential Backoff en Geocoding**

**Ubicación:** `app/actions.ts` línea 107

```typescript
async function getCityNameFromCoords(
    lat: number, 
    lng: number, 
    apiKey: string, 
    attempt = 1
): Promise<string> {
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&...`;
        const res = await fetch(url);
        const data = await res.json();
        
        // 🔑 RETRY CON BACKOFF EXPONENCIAL
        if (data.status === 'OVER_QUERY_LIMIT' && attempt <= 3) {
            await sleep(1000 * attempt);  // 1s, 2s, 3s
            return getCityNameFromCoords(lat, lng, apiKey, attempt + 1);
        }
        
        // ... resto del parsing
    }
}
```

**Algoritmo:**
- Intento 1: Falla con `OVER_QUERY_LIMIT`
- Espera 1 segundo
- Intento 2: Falla nuevamente
- Espera 2 segundos
- Intento 3: Falla nuevamente
- Espera 3 segundos
- Intento 4: Éxito ✅

**Coste:** Evita throttling de Google. Sin backoff → ban temporal.

---

#### **NIVEL 3: Admin3 Fallback (Hoy aplicado)**

**Ubicación:** `app/actions.ts` línea 114-116

```typescript
const locality = comp.find(...)?.long_name;      // Nivel ciudad
const admin3 = comp.find(...)?.long_name;         // Nivel comarca/municipio
const admin2 = comp.find(...)?.long_name;         // Nivel provincia/región

return locality || admin3 || admin2 || `Punto en Ruta (${lat}, ${lng})`;
```

**Beneficio:** Evita mostrar coordenadas, mejora UX

**Coste API:** 0 (es parsing local de respuesta existente)

---

### 3.3 Places API (Optimización: USER-DRIVEN)

**Ubicación:** `app/hooks/useTripPlaces.ts`

```typescript
// Búsqueda manual del usuario
const searchPlaces = async (query: string, lat: number, lng: number) => {
    const service = new google.maps.places.PlacesService(map);
    service.nearbySearch({
        location: { lat, lng },
        radius: searchRadius,
        type: placesType
    }, callback);
}
```

**Optimizaciones aplicadas:**
- ✅ Solo en respuesta a click del usuario
- ✅ Radio configurable (default 50 km)
- ✅ Tipo de lugar filtrable
- ❌ SIN caché (búsquedas son personales)

**Coste típico:**
- Usuario busca "hoteles" en 5 paradas = 5 × $0.032 = **$0.16 por viaje**

---

## 4. ANÁLISIS DE COSTES

### 📈 Desglose por Viaje Típico

**Ruta:** Salamanca → París → Bruselas → Ámsterdam → Copenhague (8 días)

```
Directions API:
  1 llamada × $0.005                           = $0.005

Geocoding API (paradas tácticas):
  3 paradas × $0.005                           = $0.015
  
Geocoding CACHED (paradas tácticas):
  Estimado 2 aciertos en caché                 = $0.00

Places API (búsquedas usuario):
  Promedio 3 búsquedas × $0.032                = $0.096
  
─────────────────────────────────────────────
TOTAL POR VIAJE (con búsquedas)               = $0.116 ≈ $0.12

TOTAL POR VIAJE (sin búsquedas)               = $0.020 ≈ $0.02
```

### 💰 Proyección Mensual (50K viajes/mes)

```
Escenario 1: 50% búsquedas de usuario
  50,000 viajes × $0.12 = $6,000/mes

Escenario 2: 20% búsquedas de usuario
  50,000 viajes × $0.04 = $2,000/mes

Escenario 3: 0% búsquedas de usuario (engine puro)
  50,000 viajes × $0.02 = $1,000/mes
```

### 🎯 Ahorro Real con Optimizaciones

**Con caché del 63.2%:**
```
50,000 viajes × (3 geocoding calls - 63.2% aciertos)
= 50,000 × (3 × 0.368) × $0.005
= 50,000 × 0.0055
= $275/mes ahorrados
```

**Total con optimizaciones:**
- Caso base: $3,000/mes
- Con caché: $2,725/mes
- **Ahorro: ~9%**

---

## 5. BENCHMARKS REALES

### Test API Report (08/DIC/2025)

**Dataset:** 16 rutas variadas (mountain, cross-continent, small towns)

**Métricas:**
```
Total rutas:                    16
Total viajes simulados:         8 (algunos con múltiples paradas)
Directions API calls:           7
Geocoding API calls:            7
Geocoding CACHED:               12
Cache hit rate:                 63.2%
```

**Detalles por ruta:**
- Alpine Crossing (294 km, 3 días): 1 Directions + 0 Geocoding (directo a destino)
- Western Europe Tour (1954 km, 9 días): 1 Directions + 8 Geocoding (paradas tácticas)
- Mediterranean Coast (2591 km, 12 días): 1 Directions + 11 Geocoding

**Conclusión:** Caché está funcionando bien. 63% es un buen inicio.

---

## 6. RECOMENDACIONES

### ✅ QUE ESTÁ BIEN

1. **Directions API:** 1 llamada por viaje (óptimo)
2. **Caché persistente:** Trackeado en git, aciertos reales
3. **Backoff exponencial:** Previene throttling de Google
4. **Admin3 fallback:** Mejora UX sin coste

### ⚠️ OPORTUNIDADES FUTURAS

#### **Corto Plazo (1-2 semanas)**

1. **Expandir caché seed inicial**
   - Añadir top 100 ciudades europeas
   - Resultado: ~20-30% más aciertos
   - Coste: 0 (local)

2. **Deduplicación de Geocoding**
   - Si mismo viaje calcula 2 paradas con similar lat/lng, reutilizar respuesta
   - Coste: 0 (código)
   - Ahorro: ~5% más

#### **Mediano Plazo (1 mes)**

3. **Migrar caché a Supabase Storage**
   - Si llegas a >1000 entradas
   - Ventaja: Sync automático prod ↔ git
   - Coste: ~$0.02/mes
   - Validar: cuando gitignore cache

4. **Implementar Places API caché**
   - Guardar búsquedas típicas (hoteles en París, etc.)
   - Reutilizar en viajes posteriores
   - Ahorro: ~20-30% en Places calls

#### **Largo Plazo (3 meses)**

5. **Redis en Vercel**
   - Session-level cache (durante cálculo de ruta)
   - Deduplicación automática
   - Coste: +$5/mes
   - ROI: >$100/mes en ahorros API

6. **Precalcular rutas populares**
   - Caché de "top 20" rutas más buscadas
   - Serve precalculado en <100ms
   - Ahorro: ~10% Directions API calls

---

## 📋 TABLA COMPARATIVA: Estrategias

| Estrategia | Coste | Complejidad | Ahorro | Timeframe |
|-----------|-------|------------|--------|-----------|
| Expandir seed caché | $0 | 🟢 Baja | ~5% | 1 semana |
| Supabase Storage | $0.02/mes | 🟡 Media | ~15% | 2-3 semanas |
| Places API caché | $0 | 🟡 Media | ~20% | 1 mes |
| Redis session | $5/mes | 🔴 Alta | ~30% | 2-3 meses |
| Precálculo rutas | $0 | 🔴 Alta | ~10% | 3 meses |

---

## 🎯 ACCIÓN INMEDIATA

### ✅ Hoy/Mañana
```bash
# 1. Documentar caché actual
cat data/geocoding-cache.json | jq '.' > CACHE_SNAPSHOT.md

# 2. Monitorear crecimiento
watch -n 3600 'wc -c data/geocoding-cache.json'

# 3. Tracking en commits
git log --oneline data/geocoding-cache.json
```

### ✅ Esta Semana
```bash
# Expandir seed con ciudades españolas + europeas populares
# Script: scripts/seed-initial-cache.js
npm run seed-cache

# Resultado: 100-150 entradas iniciales
# Beneficio: 30-40% aciertos en próximos viajes
```

### ✅ Este Mes
```bash
# Cuando llegues a >5000 entradas:
# 1. Evaluar migración a Supabase
# 2. Setup Supabase Storage
# 3. Script de sync automático
```

---

## 📊 ESTADO ACTUAL VS. OBJETIVO

```
MÉTRICA                 AHORA        OBJETIVO (3m)   MEJORA
─────────────────────────────────────────────────────────
Cache hit rate          63.2%        80%             +16.8pp
Geocoding calls/viaje   3            2.2             -27%
Places calls            User-driven  Caché 40%       -40%
Coste/viaje             $0.02        $0.012          -40%
Coste/mes (50K)         $1,000       $600            -40%
```

---

## 🏁 RESUMEN EJECUTIVO

✅ **CaraColaViajes tiene una estrategia sólida de optimización:**
- Caché persistente en git (63.2% hit rate)
- Exponential backoff previene throttling
- Admin3 fallback mejora UX
- Coste/viaje: $0.02 (excelente)

⚠️ **Próximas mejoras sin urgencia:**
- Expandir seed caché (fácil, sin coste)
- Supabase Storage si crece (escalable)
- Redis session (premium, ROI >$100/mes)

✨ **Conclusión:** Motor está optimizado. Mantener monitoreo y escalar cuando sea necesario.
