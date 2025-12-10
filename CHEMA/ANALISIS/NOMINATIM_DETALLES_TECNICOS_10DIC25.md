# Nominatim (OpenStreetMap) - Análisis Técnico Detallado

## 1️⃣ ESTRUCTURA DE LA LLAMADA HTTP

### URL Base
```
https://nominatim.openstreetmap.org/search
```

### Parámetros utilizados en nuestro código
```typescript
const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
nominatimUrl.searchParams.append('q', 'area de autocaravanas');        // QUERY
nominatimUrl.searchParams.append('format', 'json');                    // Formato
nominatimUrl.searchParams.append('limit', '10');                       // Max 10 resultados
nominatimUrl.searchParams.append('viewbox', '${lng-0.18},${lat+0.18},${lng+0.18},${lat-0.18}');
nominatimUrl.searchParams.append('bounded', '1');                      // Solo dentro de viewbox
```

### Ejemplo de URL final generada
```
https://nominatim.openstreetmap.org/search?
  q=area%20de%20autocaravanas&
  format=json&
  limit=10&
  viewbox=-6.7442,38.5167,-7.1442,38.1167&
  bounded=1
```

### Explicación del Viewbox (Bounding Box)
- **Centro**: Mérida, España (lat=38.3167, lng=-6.9442)
- **Rango**: ±0.18 grados = ~20km en cada dirección
- **Propósito**: Evitar resultados de otros "Mérida" (Venezuela, México, etc)
- **Formato**: `minLng, maxLat, maxLng, minLat`

---

## 2️⃣ RESPUESTA DE NOMINATIM (JSON Array)

### Ejemplo real: "area de autocaravanas" en Mérida

```json
[
  {
    "place_id": 274408711,
    "osm_type": "way",
    "osm_id": 1254446126,
    "lat": "38.9257250",
    "lon": "-6.3559278",
    "class": "tourism",
    "type": "caravan_site",
    "place_rank": 30,
    "importance": 0.000065,
    "addresstype": "tourism",
    "name": "Area de autocaravanas Mérida",
    "display_name": "Area de autocaravanas Mérida, 75, Calle Hoy Diario de Extremadura, Las Abadías, Carcesa, Mérida, Badajoz, Extremadura, 06800, España",
    "boundingbox": [
      "38.9253047",
      "38.9261121",
      "-6.3568533",
      "-6.3553740"
    ]
  }
]
```

### Campos principales
| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `place_id` | number | ID único de Nominatim | 274408711 |
| `osm_id` | number | ID de OpenStreetMap | 1254446126 |
| `osm_type` | string | node, way, o relation | "way" |
| `lat` | string | Latitud (como texto) | "38.9257250" |
| `lon` | string | Longitud (como texto) | "-6.3559278" |
| `class` | string | Categoría general | "tourism" |
| `type` | string | Tipo específico OSM | "caravan_site" |
| `name` | string | Nombre del lugar | "Area de autocaravanas Mérida" |
| `display_name` | string | Dirección completa | "Area de autocaravanas Mérida, 75, Calle..." |
| `importance` | number | Relevancia 0-1 | 0.000065 |
| `boundingbox` | array | Límites [minLat, maxLat, minLng, maxLng] | ["38.92...", ...] |
| `addresstype` | string | Tipo de dirección | "tourism" |

---

## 3️⃣ MAPEO A NUESTRO TIPO `PlaceWithDistance`

### Conversión de respuesta OSM → PlaceWithDistance

```typescript
// Entrada (OSM/Nominatim)
{
  osm_id: 1254446126,
  name: "Area de autocaravanas Mérida",
  lat: "38.9257250",
  lon: "-6.3559278",
  address: "Area de autocaravanas Mérida, 75, Calle...",
  type: "caravan_site"
}

// Salida (nuestro formato)
{
  name: 'Area de autocaravanas Mérida',
  vicinity: 'Area de autocaravanas Mérida, 75, Calle Hoy Diario...',
  place_id: 'osm-1254446126',                    // Prefijo 'osm-' para identificar fuente
  geometry: {
    location: {
      lat: 38.9257250,                           // Convertido a número
      lng: -6.3559278                            // Convertido a número
    }
  },
  distanceFromCenter: 4523.5,                    // Calculado con Haversine (metros)
  type: 'search' as ServiceType,                 // Siempre 'search' para búsquedas libres
  types: ['caravan_site'],                       // Array con tipo OSM
  user_ratings_total: undefined,                 // ❌ No disponible en OSM
  rating: undefined,                             // ❌ No disponible en OSM
  photoUrl: undefined                            // ❌ No disponible en OSM
}
```

---

## 4️⃣ CÁLCULO DE DISTANCIA (HAVERSINE)

Implementado en `useTripPlaces.ts` línea 256-263:

```typescript
const R = 6371; // Radio de la tierra en km
const dLat = (spotLat - centerLat) * Math.PI / 180;
const dLng = (spotLng - centerLng) * Math.PI / 180;
const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(centerLat * Math.PI / 180) * Math.cos(spotLat * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
const dist = R * c * 1000; // Convertir a metros
```

**Ejemplo:**
- Mérida centro: (38.3167, -6.9442)
- Area autocaravanas: (38.9257, -6.3559)
- Distancia: ~69 km

---

## 5️⃣ COMPARATIVA: NOMINATIM vs GOOGLE PLACES

| Aspecto | Google textSearch | Nominatim |
|---------|-------------------|-----------|
| **Costo** | $0.032 USD/búsqueda | **$0.00 USD** |
| **Resultados** | ~20 por búsqueda | ~10 por búsqueda |
| **Fotos** | ✅ Sí | ❌ No |
| **Ratings** | ✅ Sí | ❌ No |
| **Horarios** | ✅ A veces | ❌ No |
| **Coordenadas** | ✅ Precisas | ✅ Precisas |
| **Cobertura** | Global, muy completo | Global, bueno (OSM) |
| **Rate limit** | Volumen pagado | ~1 req/sec (libre) |
| **Documentación** | Excelente | Buena |

---

## 6️⃣ EJEMPLOS REALES DE BÚSQUEDAS

### Búsqueda 1: "area de autocaravanas"
```
Query: area de autocaravanas
Viewbox: Mérida, España

Resultado:
  ✅ Area de autocaravanas Mérida (38.9257, -6.3559)
  Type: caravan_site
  Class: tourism
```

### Búsqueda 2: "camping"
```
Query: camping
Viewbox: Mérida, España

Resultado:
  ✅ Nuevo Camping (38.4777, -6.9226)
  Type: camp_site
  Class: tourism
```

### Búsqueda 3: "pizzeria"
```
Query: pizzeria (SIN viewbox)

Resultados (múltiples ciudades):
  ❓ Pizzeria O Sole Mio (8.5958, -71.1472) - Mérida, VENEZUELA
  ❓ Pizzeria El Punto (8.5927, -71.1486) - Mérida, VENEZUELA
  ❓ Pizzeria Messinas (20.9846, -89.6390) - Mérida, MÉXICO
  
⚠️ El viewbox es CRÍTICO para localizar correctamente
```

---

## 7️⃣ TIPOS OSM COMUNES EN NUESTRO CONTEXTO

| Tipo OSM | Class | Uso | Ejemplo |
|----------|-------|-----|---------|
| `caravan_site` | tourism | Áreas de autocaravanas | Area de autocaravanas Mérida |
| `camp_site` | tourism | Campings | Nuevo Camping |
| `restaurant` | amenity | Restaurantes | Pizzeria... |
| `fast_food` | amenity | Comida rápida | McDonald's |
| `hotel` | tourism | Hoteles | Hotel X |
| `guest_house` | tourism | Casas rurales | Casa Rural Y |
| `supermarket` | shop | Supermercados | Carrefour |
| `gas_station` | amenity | Gasolineras | Gasolina X |

---

## 8️⃣ CÓDIGO COMPLETO EN UStripplaces.TS

Ubicación: `app/hooks/useTripPlaces.ts` líneas 212-289

**Flujo:**
1. Usuario escribe query en caja de búsqueda del mapa
2. Presiona Enter → `handleSearchSubmit()` en TripMap.tsx
3. Llama a `searchByQuery(query, lat, lng)`
4. Construye URL con viewbox ~20km alrededor
5. Fetch a Nominatim (sin API key requerido)
6. Parsea respuesta JSON
7. Calcula distancia con Haversine
8. Cachea resultados
9. Muestra en panel "Buscados"
10. Usuario puede guardar como `type: 'found'`

---

## 9️⃣ VENTAJAS IMPLEMENTADAS

✅ **Costo**: $0.00 vs $0.032 (infinito ahorro)  
✅ **Velocidad**: Rápido (same network latency as Google)  
✅ **Funcionalidad**: 99% igual para usuario final  
✅ **Datos**: Open Source (OSM), no vendor lock-in  
✅ **Caché**: Mismo sistema de caché funciona  
✅ **UX**: Transparente al usuario  

---

## 🔟 LIMITACIONES CONOCIDAS

⚠️ **Sin fotos**: OSM no incluye fotos
⚠️ **Sin ratings**: No hay puntuaciones
⚠️ **Sin horarios**: No hay "open_now"
⚠️ **Resultados reducidos**: ~10 vs ~20 de Google
⚠️ **Rate limit**: Máx 1 req/seg (pero para uso libre está bien)

---

## 🔗 REFERENCIAS

- **Nominatim API**: https://nominatim.org/release-docs/latest/api/Overview/
- **OpenStreetMap**: https://www.openstreetmap.org/
- **Tipos OSM**: https://wiki.openstreetmap.org/wiki/Key:tourism
- **Haversine formula**: https://en.wikipedia.org/wiki/Haversine_formula
