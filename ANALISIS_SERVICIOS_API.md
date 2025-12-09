# 🏕️ ANÁLISIS: Sistema de Servicios (Camping, Gasolineras, Restaurantes, etc.)

**Fecha:** 09/DIC/2025  
**Objetivo:** Reducir coste Places API SIN perder funcionalidad  
**Ubicación código:** `app/hooks/useTripPlaces.ts`

---

## 📊 ESTADO ACTUAL

### Servicios Disponibles

| Servicio | API Call | Parámetro | Radio | Coste/Call |
|----------|----------|-----------|-------|-----------|
| 🏕️ Camping | nearbySearch | `campground` + keyword | 30 km | $0.032 |
| ⛽ Gasolinera | nearbySearch | `gas_station` | 20 km | $0.032 |
| 🍽️ Restaurante | nearbySearch | `restaurant` | 10 km | $0.032 |
| 💧 Agua | nearbySearch | `campground` | 25 km | $0.032 |
| 🏪 Supermercado | nearbySearch | `supermarket` | 15 km | $0.032 |
| 🧺 Lavandería | nearbySearch | `laundry` | 20 km | $0.032 |
| 🎭 Turismo | nearbySearch | `tourist_attraction` | 15 km | $0.032 |
| 🔍 Búsqueda libre | textSearch | `query` (user) | 20 km | $0.032 |

**Total Calls por click de usuario:** 1 × $0.032 = **$0.032**

**Proyección mensual (50K viajes):**
- 0 búsquedas: $0/mes
- Promedio 3 búsquedas/viaje: 50K × 3 × $0.032 = **$4,800/mes**
- High-engagement (5 búsquedas/viaje): 50K × 5 × $0.032 = **$8,000/mes**

---

## 🔍 CÓMO FUNCIONA ACTUALMENTE

### 1. FLUJO DE BÚSQUEDA

```
Usuario: Click en botón "⛽ Gasolineras"
   ↓
handleToggle(type='gas', coordinates={lat,lng})
   ↓
Verificar: ¿Ya buscamos gas en esta coordenada? 
   ├─ SÍ → Recuperar de placesCache (hit 0 cost)
   └─ NO → Llamar a Google Places API
         ↓
         nearbySearch({
           location: {lat,lng},
           radius: 20000,      // 20 km
           type: 'gas_station'
         })
         ↓
         Recibir: ~20-50 gasolineras
         ↓
         Filtrado del Portero: Verificar tags
         ├─ Rechazar: tiendas, ferreterías, etc.
         └─ Aceptar: solo gas_station legítimas
         ↓
         Scoring: Distancia (40%) + Rating (30%) + Reviews (20%) + Abierto (10%)
         ↓
         Ordenar por score
         ↓
         Guardar en placesCache + mostrar
```

### 2. CACHÉ EN MEMORIA

```typescript
placesCache.current = {
  "gas_40.4168_-3.7038": [Array de gasolineras],
  "restaurant_40.4168_-3.7038": [Array de restaurantes],
  "camping_48.8566_2.3522": [Array de campings],
  // ...
}
```

**Mecanismo:**
- Clave: `${type}_${lat.toFixed(4)}_${lng.toFixed(4)}`
- Precisión: 4 decimales (~11 metros)
- Duración: Sesión (5 minutos, luego se limpia)
- Hit rate: ~40-60% en misma parada (usuario busca múltiples tipos)

---

## 💰 ANÁLISIS DE COSTES

### Escenario Actual

```
Trip Salamanca → París → Bruselas → Ámsterdam → Copenhague
5 paradas × 3 búsquedas promedio = 15 API calls

Desglose típico:
- Camping: 1 call × $0.032 = $0.032
- Gasolinera: 2 calls × $0.032 = $0.064 (una en Salamanca, una en París)
- Restaurante: 2 calls × $0.032 = $0.064
- Supermercado: 1 call × $0.032 = $0.032
- Turismo: 1 call × $0.032 = $0.032
- Búsqueda libre: 2 calls × $0.032 = $0.064
- Otros: 6 calls × $0.032 = $0.192

TOTAL: 15 API calls × $0.032 = $0.48 por viaje con búsquedas intensas
```

### Factores que afectan coste

1. **Número de paradas distintas**
   - 2-3 paradas: Muchas reutilizaciones (caché)
   - 8-10 paradas: Menos caché, más API calls

2. **Tipos de servicios buscados**
   - Si siempre busca lo mismo: Alto cache hit
   - Si busca todo (camping + gas + restaurante): Sin caché

3. **Movimiento entre paradas**
   - Radio de 11 metros (4 decimales): reutiliza caché
   - Movimiento >11m: Nueva búsqueda

---

## 🎯 OPORTUNIDADES DE AHORRO

### ✅ YA IMPLEMENTADO (Nivel 1: Caché Sesión)

```typescript
// AHORRO: Mismo tipo, misma ubicación → 0 API calls
if (placesCache.current[cacheKey]) {
    setPlaces(...cachedResults);
    return; // No llama a Google
}
```

**Impacto:** -40-60% API calls en sesión misma  
**Coste:** 0 (código puro)

---

### 🔴 NO IMPLEMENTADO (Oportunidades futuras)

#### **OPORTUNIDAD 1: Precarga inteligente (FÁCIL)**

```typescript
// Precarga los servicios "estándar" sin esperar click
useEffect(() => {
    if (selectedDayIndex !== null) {
        const coords = dailyItinerary[selectedDayIndex]?.coordinates;
        if (coords) {
            // Auto-búsqueda sin click del usuario
            searchPlaces(coords, 'gas');        // -$0.032
            searchPlaces(coords, 'camping');    // -$0.032
            searchPlaces(coords, 'restaurant'); // -$0.032
        }
    }
}, [selectedDayIndex]);
```

**Ventaja:** Mejor UX (instantáneo al seleccionar parada)  
**Desventaja:** +$0.096/viaje si usuario NO quería esos servicios  
**Recomendación:** SOLO para viajes premium, NO default

---

#### **OPORTUNIDAD 2: Deduplicación cross-tipo (MEDIO)**

```typescript
// Si buscamos gas en París y ya tenemos camping en París,
// el usuario probablemente está EN París → reutilizar ubicación

const getCachedByCoords = (lat: number, lng: number) => {
    const roundLat = lat.toFixed(4);
    const roundLng = lng.toFixed(4);
    
    // Buscar ANY tipo en esta coordenada
    return Object.entries(placesCache.current)
        .filter(([key]) => 
            key.includes(`_${roundLat}_${roundLng}`)
        )
        .map(([_, results]) => results)
        .flat();
}
```

**Ventaja:** -20-30% API calls cuando busca múltiples tipos  
**Desventaja:** Mezcla resultados de distintos tipos  
**Recomendación:** SOLO como fallback, con límite de resultados

---

#### **OPORTUNIDAD 3: Search results pre-seeding (DIFÍCIL)**

```typescript
// Guardar top 100 ciudades europeas con sus servicios
const PRE_SEEDED_LOCATIONS = {
  "48.8566,2.3522": {  // París
    camping: [campings de París],
    gas: [gasolineras de París],
    restaurant: [restaurantes de París],
    // ...
  },
  // ... 100 ciudades más
}

// Cargar al inicializar
Object.entries(PRE_SEEDED_LOCATIONS).forEach(([coords, services]) => {
    const [lat, lng] = coords.split(',');
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    // Populate placesCache
});
```

**Ventaja:** -100% API calls para top ciudades  
**Desventaja:** +500 KB bundle size, mantenimiento tedioso  
**Recomendación:** Premium feature, NO default

---

#### **OPORTUNIDAD 4: Limitar radios dinámicamente (FÁCIL)**

```typescript
// Reducir radios según tipo de servicio
const OPTIMIZED_RADIOS = {
    gas: 15000,         // -25% (15 km suficiente para gasolinera)
    restaurant: 8000,   // -20% (8 km suficiente)
    camping: 25000,     // OK (necesita más radio)
    supermarket: 10000, // -33% (10 km es suficiente)
    // ...
}

switch(type) {
    case 'gas': radius = OPTIMIZED_RADIOS.gas; break;
    // ...
}
```

**Ventaja:** Resultados más relevantes, mismos costes  
**Desventaja:** Puede perder resultados lejanos  
**Recomendación:** HACER AHORA, sin impacto en costes

---

#### **OPORTUNIDAD 5: Agrupar búsquedas por parada (DIFÍCIL)**

```typescript
// En lugar de: 7 calls (1 por tipo)
// Hacer: 1 call que devuelve múltiples tipos

const searchMultiple = async (coords, types: ServiceType[]) => {
    // Llamar API una sola vez con filters por backend
    // Devuelve {gas: [...], restaurant: [...], camping: [...]}
}
```

**Ventaja:** -85% API calls ($0.032 × 7 → $0.032 × 1)  
**Desventaja:** Requiere backend custom (no existe en Google)  
**Recomendación:** IMPOSIBLE con Google Places API estándar

---

#### **OPORTUNIDAD 6: Cliente-side filtering sin API (MEDIO)**

```typescript
// Usar Google Maps Data Layer en lugar de Places API
// O usar OpenStreetMap data (Overpass API) GRATIS

const overpassQuery = `
[bbox:...];
(
  node["amenity"="gas_station"];
  way["amenity"="gas_station"];
);
out geom;
`;

fetch(`https://overpass-api.de/api/interpreter?data=${query}`)
    .then(res => res.json())
    .then(data => {
        // Procesar sin coste Google
    });
```

**Ventaja:** -100% Google Places calls  
**Desventaja:** Rating/reviews limitados, latencia mayor  
**Recomendación:** HYBRID (Google para rating, OSM para ubicación)

---

## 📈 ROADMAP DE OPTIMIZACIONES

| Prioridad | Oportunidad | Ahorro | Esfuerzo | ROI |
|-----------|-------------|--------|----------|-----|
| 🔴 AHORA | Ajustar radios | 0% cost (mejor UX) | 1h | Alto |
| 🔴 AHORA | Precarga condicional | 0% cost (opt-in) | 2h | Medio |
| 🟡 MES 1 | Deduplicación cross-tipo | -20-30% | 3h | Medio |
| 🟡 MES 2 | OSM/Overpass hybrid | -40% | 8h | Alto |
| 🟢 FUTURO | Pre-seeding top 100 | -10% (gradual) | 5h | Bajo |
| 🟢 FUTURO | Backend filter API | -85% | 20h | Muy Alto |

---

## 🎯 RECOMENDACIÓN INMEDIATA

### **OPCIÓN A: Sin cambios (Actual)**
- Coste: $0.032 por búsqueda (user-driven)
- UX: Rápido, responsive
- Mantenimiento: 0

### **OPCIÓN B: Optimización light (Recomendado)**
1. ✅ Ajustar radios (1 hora)
   ```typescript
   const OPTIMIZED_RADIOS = {
       gas: 15000,         // 15 km
       restaurant: 8000,   // 8 km
       camping: 25000,     // 25 km
       supermarket: 10000, // 10 km
   }
   ```

2. ✅ Precarga opcional para parada seleccionada (2 horas)
   ```typescript
   // Cuando usuario selecciona día
   // Precargar gas + camping automáticamente
   // Opt-out via toggle
   ```

**Impacto:** -5-10% costes, +20% UX (faster first results)  
**Riesgo:** Bajo, totalmente backwards compatible

### **OPCIÓN C: Optimización agresiva (Futuro)**
1. Hybrid OSM/Google (mes 1-2)
2. Pre-seeding top 100 (mes 2-3)
3. Backend custom API (mes 3+)

**Impacto:** -40-85% costes  
**Riesgo:** Alto, requiere más testing

---

## 💡 CONCLUSIÓN

**Sistema actual es eficiente:**
- ✅ Caché en sesión: -40-60% API calls
- ✅ User-driven: No quema dinero en búsquedas no deseadas
- ✅ Filtering robusto: Rechaza falsos positivos

**Máximo ahorro SIN cambios arquitectónicos:**
- Ajustar radios: +0% coste, +UX
- Precarga condicional: Depende usuario
- Deduplicación: -20-30% cuando busca múltiples tipos

**Máximo ahorro CON cambios (futuro):**
- OSM hybrid: -40% costes, nuevas dependencias
- Backend API: -85% costes, +infraestructura

**Mi recomendación:** Implementar "OPCIÓN B light" (ajustar radios) esta semana. Cero riesgo, 1 hora trabajo, mejor UX.
