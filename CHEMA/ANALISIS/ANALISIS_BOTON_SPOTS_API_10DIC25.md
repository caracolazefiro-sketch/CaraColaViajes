# 📱 ANÁLISIS: ¿Botón "Spots" hace llamadas API directas al pinchar en un día?

**Fecha:** 10 DIC 2025  
**Conclusión:** ✅ **SÍ, HACE LLAMADAS DIRECTAS A GOOGLE PLACES API**

---

## 🔗 FLUJO TÉCNICO COMPLETO

### 1. Usuario hace clic en botón "Spots" en un día del itinerario

**Archivo:** `app/components/DaySpotsList.tsx` (línea 47)
```tsx
<ServiceButton 
    type="camping"
    label="Spots"
    toggles={toggles}
    onToggle={onToggle}  // ← Click aquí ejecuta onToggle
    count={places.camping.length}
/>
```

---

### 2. `onToggle` es llamado desde el padre (ItineraryPanel)

**Archivo:** `app/page.tsx` (línea 118)
```tsx
const handleToggleWrapper = (type: ServiceType) => {
    const day = selectedDayIndex !== null ? results.dailyItinerary?.[selectedDayIndex] : null;
    handleToggle(type, day?.coordinates);  // ← Pasa coordenadas del día seleccionado
};
```

---

### 3. `handleToggle` está en el hook `useTripPlaces.ts`

**Archivo:** `app/hooks/useTripPlaces.ts` (línea 305)
```typescript
const handleToggle = (type: ServiceType, coordinates?: Coordinates) => {
    const newState = !toggles[type];
    setToggles(prev => ({...prev, [type]: newState}));
    
    // 🔴 **AQUÍ ES DONDE OCURRE LA LLAMADA A API**
    if (newState && coordinates) {
        searchPlaces(coordinates, type);  // ← Llama a searchPlaces
    }
};
```

---

### 4. `searchPlaces` HACE LA LLAMADA DIRECTA A GOOGLE PLACES API

**Archivo:** `app/hooks/useTripPlaces.ts` (línea 21-200)

```typescript
const searchPlaces = useCallback((location: Coordinates, type: ServiceType) => {
    // ... configuración ...
    
    const service = new google.maps.places.PlacesService(map);
    const centerPoint = new google.maps.LatLng(location.lat, location.lng);
    
    // 🔴 **LLAMADA DIRECTA A GOOGLE PLACES API**
    service.nearbySearch(searchRequest, (res, status) => {
        // Procesa resultados
        // Filtra resultados (removes stores, hotels incorrectos, etc.)
        // Calcula score para cada lugar
        // Guarda en caché
        setPlaces(prev => ({...prev, [type]: finalSpots}));
    });
}, [map, setPlaces, setLoadingPlaces, placesCache]);
```

---

## 🔴 LLAMADAS A API POR TIPO DE SERVICIO

| Tipo | Radio | Keyword/Type | Coste | Filtros |
|------|-------|--------------|-------|---------|
| **Spots** | 30 km | keyword: `camping OR "RV park" OR pernocta` | $0.032 | Campground + RV park, excluye tiendas |
| **Restaurant** | 10 km | type: `restaurant` | $0.032 | Restaurant/café, excluye hoteles |
| **Gas** | 20 km | type: `gas_station` | $0.032 | Solo gas_station |
| **Water** | 25 km | type: `campground` | $0.032 | Campground (sin keyword) |
| **Supermarket** | 15 km | type: `supermarket` | $0.032 | Supermarket, grocery |
| **Laundry** | 20 km | type: `laundry` | $0.032 | Laundry, excluye hoteles |
| **Tourism** | 15 km | type: `tourist_attraction` | $0.032 | Tourist attractions |

---

## 💾 OPTIMIZACIÓN: CACHÉ LOCAL

**Buena noticia:** Se implementó **caché en memoria** durante la sesión

**Cómo funciona:**
```typescript
const cacheKey = `${type}_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}`;

// Si ya hizo la búsqueda en esta ubicación: ✅ USA CACHÉ
if (placesCache.current[cacheKey]) {
    setPlaces(prev => ({...prev, [type]: placesCache.current[cacheKey]}));
    return;  // ← NO HACE LLAMADA A API
}

// Si es primera búsqueda en este lugar: ❌ HACE LLAMADA A API
service.nearbySearch(searchRequest, ...);
```

**Precisión:** ±0.0001 lat/lng = ±11 metros de distancia

---

## 📊 RESUMEN DEL FLUJO

```
Usuario pincha botón "Spots"
    ↓
handleToggleWrapper(type="camping", coordinates={lat,lng})
    ↓
handleToggle(type="camping", coordinates={lat,lng})
    ↓
searchPlaces({lat,lng}, "camping")
    ↓
¿Existe en caché placesCache[cacheKey]?
    ├─ SÍ: Retorna resultados en caché (sin API call)
    └─ NO: Hace nearbySearch a Google Places API
         ↓
         Recibe ~30-50 resultados brutos
         ↓
         Filtra (camping/rv_park, excluye tiendas)
         ↓
         Calcula score (distancia 40% + rating 30% + reviews 20% + open 10%)
         ↓
         Guarda en placesCache
         ↓
         Renderiza en mapa
```

---

## 🎯 COMPORTAMIENTO ACTUAL

### ✅ SI PINCHA EN "SPOTS" (primer clic, nuevo día):
- **Hace:** 1 llamada a Google Places API ($0.032)
- **Retorna:** 30-50 resultados brutos
- **Filtra:** Excluye tiendas, hardware stores, hoteles
- **Calcula:** Score de cada lugar
- **Guarda:** En `placesCache` para reutilizar

### ✅ SI PINCHA EN "SPOTS" (segundo clic, mismo día):
- **Hace:** 0 llamadas (usa caché)
- **Retorna:** Resultados guardados en memoria
- **Rendimiento:** Instantáneo

### ✅ SI CAMBIAS DE DÍA Y PINCHES "SPOTS" NUEVAMENTE:
- **Hace:** 1 llamada a Google Places API (diferente ubicación)
- **Guarda:** En caché con nueva clave
- **Reutiliza:** Si vuelves al primer día

---

## 🔍 DETALLES DE LA BÚSQUEDA "CAMPING/SPOTS"

**Cuando pinches "Spots":**
```
Location: {coordenadas del día}
Radius: 30 km
Keyword: camping OR "área de autocaravanas" OR "RV park" OR "motorhome area" OR pernocta
```

**Filtros aplicados:**
- ✅ Aceptados: campground, rv_park, parking con nombre "camping/autocaravana"
- ❌ Rechazados: hardware_store, clothing_store, shopping_mall, hotel+camping

**Ejemplo de rechazo:**
- "Camping España S.L." → hardware store → ❌ RECHAZADO
- "Camping Rural Los Pinos" → campground → ✅ ACEPTADO

---

## 💰 COSTE ACTUAL POR VIAJE

Si el usuario:
- Busca Spots en 3 días: 3 × $0.032 = $0.096
- Busca 2 tipos más (gas + restaurant): 2 × $0.032 = $0.064
- **Total: $0.16 por viaje** (si busca 5 servicios)

**Sin búsquedas de usuario:** $0.02 por viaje (solo Directions + Geocoding)

---

## ✨ CONCLUSIÓN

**Respuesta a tu pregunta:**

> "¿El botón spots hace llamada a la api directamente al pinchar en un día del itinerario?"

**✅ SÍ, HACE LLAMADA DIRECTA A GOOGLE PLACES API**

Pero:
- 🟢 Solo si es la **primera búsqueda** en esa ubicación
- 🟢 Usa **caché en memoria** si repites la misma búsqueda
- 🟢 Costo: **$0.032 por búsqueda** (Places API)
- 🟢 Cada búsqueda retorna 30-50 resultados filtrados y scored

**Optimización:** El caché de sesión evita llamadas duplicadas dentro de la misma sesión del usuario. Para persistencia entre sesiones, sería necesario localStorage o una BD (Supabase).

---

**Recomendación:**
Si quieres reducir costos API y mejorar UX:
- ✅ Implementar caché en localStorage (persiste entre sesiones)
- ✅ Precalcular spots populares (top 20 ciudades europeas)
- ✅ Usar Redis en Vercel para session-level deduplication

---

**Responsable del análisis:** GitHub Copilot  
**Fecha:** 10 DIC 2025
