# 🔬 ANÁLISIS PROFUNDO: 5 APIs - QUÉ HACE, QUÉ OBTIENE, COSTE

Verificación directa del código en `app/actions.ts` y componentes.

---

## API 1️⃣: GOOGLE DIRECTIONS API

### 📍 DÓNDE SE LLAMA
**Archivo:** `app/actions.ts`  
**Línea:** 237  
**Contexto:** Función `getDirectionsAndCost()` - Server Action

### 🔗 REQUEST (Lo que ENVIAMOS a Google)

```typescript
// Línea 237 - Construcción de URL
const url = `https://maps.googleapis.com/maps/api/directions/json?
  origin=${normalizedOrigin}                    // "Madrid"
  &destination=${normalizedDestination}        // "Barcelona"
  &mode=driving                                // Siempre driving
  &waypoints=${waypointsParam}                 // "Valencia|Sevilla|Bilbao|..."
  &key=${apiKey}`;                             // API Key

// Línea 246 - Ejecución
const response = await fetch(url);
const directionsResult = await response.json();
```

**Ejemplo concreto:**
```
https://maps.googleapis.com/maps/api/directions/json?
  origin=Madrid
  &destination=Barcelona
  &mode=driving
  &waypoints=Valencia|Sevilla|Bilbao|Zaragoza|Pamplona|San%20Sebastian|Oviedo|Coruña|Badajoz|Plasencia|Toledo|Cuenca|Guadalajara
  &key=AIzaSyD...
```

### 📦 RESPONSE (Lo que GOOGLE DEVUELVE)

```json
{
  "status": "OK",
  "routes": [
    {
      "legs": [
        {
          "start_location": { "lat": 40.4168, "lng": -3.7038 },    // Madrid
          "end_location": { "lat": 39.4699, "lng": -0.3763 },      // Valencia
          "distance": { "value": 320000, "text": "320 km" },
          "duration": { "value": 11520, "text": "3 horas" },
          "steps": [
            {
              "start_location": { "lat": 40.4168, "lng": -3.7038 },
              "end_location": { "lat": 40.4200, "lng": -3.7100 },
              "distance": { "value": 500 },
              "duration": { "value": 30 },
              "polyline": {
                "points": "_p~iF~ps|U_ulLnnqC_mqNvxq`@"  // Codificado en polyline
              },
              "html_instructions": "<b>Head south on Paseo del Prado</b>"
            },
            // ... miles de steps más ...
          ]
        },
        // ... más legs (uno por cada waypoint) ...
      ]
    }
  ]
}
```

### 🔍 QUÉ EXTRAE NUESTRO CÓDIGO

**Línea 258-260:**
```typescript
const route = directionsResult.routes[0];  // Tomar primera ruta (hay alternativas)

let totalDistanceMeters = 0;
route.legs.forEach((leg) => { 
  totalDistanceMeters += leg.distance.value;  // Sumar distancias
});
const distanceKm = totalDistanceMeters / 1000;  // Convertir a km
```

**Línea 275-277:**
```typescript
let currentLegStartCoords = { 
  lat: route.legs[0].start_location.lat,
  lng: route.legs[0].start_location.lng
};
// ✅ Coordenadas precisas de inicio
```

**Línea 293-310 (En loop):**
```typescript
for (let i = 0; i < route.legs.length; i++) {
  const leg = route.legs[i];
  const nextStopName = allStops[i + 1];
  let legDistanceMeters = 0;

  for (const step of leg.steps) {
    legDistanceMeters += step.distance.value;
    const path = decodePolyline(step.polyline.points);  // ✅ Decodificar polyline
    // Ahora tenemos: miles de puntos lat/lng de cada step
  }
}
```

### 📊 DATOS OBTENIDOS (Resumen)

| Dato | Tipo | Cantidad | Uso |
|------|------|----------|-----|
| **Distancia total** | número | 1 | Cálculo de días |
| **Legs** | array | = waypoints + 1 | Segmentos entre paradas |
| **Steps** | array | 100-500 | Instrucciones detalladas |
| **Polylines** | string (encoded) | 100-500 | Miles de puntos lat/lng |
| **Coordenadas** | lat/lng | Decenas | Inicio/fin de cada instrucción |
| **Duración** | tiempo | Múltiples | Estimación viaje |

**Total de datos:** ~50-100 KB por viaje típico

### 💰 COSTE EXACTO

**Modelo de precios Google Directions:**
- €0.005 por solicitud base
- €0.005 adicional por cada waypoint (máximo 25)

**Fórmula:**
```
Coste = €0.005 + (€0.005 × número_waypoints)
```

**Ejemplos:**
```
0 waypoints (A→B):      €0.005
1 waypoint (A→X→B):     €0.010
13 waypoints (A→X→...→B): €0.005 + (€0.005 × 13) = €0.070
25 waypoints (máx):     €0.005 + (€0.005 × 25) = €0.130
```

### ❓ CUÁNTAS VECES SE LLAMA

**1 SOLA VEZ por viaje**, sin importar:
- La distancia
- El número de paradas tácticas que creemos
- Si revisamos el itinerario

✅ **Se llama en línea 246** una sola vez en toda la función.

---

## API 2️⃣: GOOGLE REVERSE GEOCODING

### 📍 DÓNDE SE LLAMA
**Archivo:** `app/actions.ts`  
**Línea:** 110 (dentro de función `getCityNameFromCoords`)  
**Contexto:** Se invoca para CADA PARADA TÁCTICA que no está en cache

### 🔗 REQUEST (Lo que ENVIAMOS a Google)

```typescript
// Línea 110
const url = `https://maps.googleapis.com/maps/api/geocode/json?
  latlng=${lat},${lng}                         // "40.123,-3.456"
  &result_type=locality|administrative_area_level_2  // Solo ciudades/regiones
  &key=${apiKey}                               // API Key
  &language=es`;                               // Respuesta en español
```

**Ejemplo concreto:**
```
https://maps.googleapis.com/maps/api/geocode/json?
  latlng=40.123,-3.456
  &result_type=locality|administrative_area_level_2
  &language=es
  &key=AIzaSyD...
```

### 📦 RESPONSE (Lo que GOOGLE DEVUELVE)

```json
{
  "status": "OK",
  "results": [
    {
      "formatted_address": "Torrejón de Ardoz, Madrid, Spain",
      "address_components": [
        { "long_name": "Torrejón de Ardoz", "types": ["locality"] },
        { "long_name": "Madrid", "types": ["administrative_area_level_2"] },
        { "long_name": "Spain", "types": ["country"] }
      ],
      "geometry": {
        "location": { "lat": 40.4506, "lng": -3.4564 },
        "location_type": "APPROXIMATE"
      }
    },
    // ... otros resultados menos precisos ...
  ]
}
```

### 🔍 QUÉ EXTRAE NUESTRO CÓDIGO

**Línea 113-120:**
```typescript
if (data.status === 'OK' && data.results?.[0]) {
  const comp = data.results[0].address_components;
  
  const locality = comp.find(c => c.types.includes('locality'))?.long_name;
  const admin3 = comp.find(c => c.types.includes('administrative_area_level_3'))?.long_name;
  const admin2 = comp.find(c => c.types.includes('administrative_area_level_2'))?.long_name;
  
  return locality || admin3 || admin2 || `Punto en Ruta (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
}
```

**Lógica de extracción:**
1. Si hay ciudad (locality) → usar esa
2. Si no, usar región nivel 3 (provincia)
3. Si no, usar región nivel 2 (región autónoma)
4. Si nada → usar "Punto en Ruta 40.12, -3.45"

### 📊 DATOS OBTENIDOS

| Dato | Tipo | Cantidad | Uso |
|------|------|----------|-----|
| **Nombre ciudad** | string | 1 | "Cuenca", "Torrejón", etc |
| **Región** | string | 1 | Nivel 2 si no hay ciudad |
| **Address components** | array | 3-5 | Búsqueda inteligente |
| **Coordenadas** | lat/lng | 1 | Validación |
| **Formatted address** | string | 1 | Mostrar al usuario |

**Total de datos:** ~2-3 KB por llamada

### 💾 CACHE (Migrado hoy)

**Archivo:** `app/motor-bueno/geocoding-cache.ts`  
**Storage:** `data/geocoding-cache.json`

```typescript
// Línea 103 en actions.ts (NUEVO - HOY)
const cachedName = await getCachedCityName(lat, lng);
if (cachedName) {
  return cachedName;  // ✅ ZERO coste, retorna en <1ms
}

// Si NO en cache, llamar Google
const cityName = await getCityNameFromCoords(lat, lng, apiKey);

// Guardar en cache para futuras
await setCachedCityName(lat, lng, cityName);
```

**Cache actual:** 52 ciudades almacenadas
```json
{
  "48.8566,2.3522": { "cityName": "París", "timestamp": "...", "lat": 48.8566, "lng": 2.3522 },
  "50.8465,4.3488": { "cityName": "Bruselas", "timestamp": "...", "lat": 50.8465, "lng": 4.3488 },
  ...
}
```

### 💰 COSTE EXACTO

**Modelo de precios Google Geocoding:**
- €0.005 por solicitud

**Fórmula:**
```
Coste = €0.005 × número_de_llamadas_NO_cacheadas
```

**Ejemplos:**
```
0 nuevas (todo en cache):     €0.000
5 nuevas:                     €0.025
15 nuevas (viaje típico):     €0.075
30 nuevas (ruta larga):       €0.150
```

### ❓ CUÁNTAS VECES SE LLAMA

**1 vez POR PARADA TÁCTICA NUEVA**, ejemplo:

```
Viaje: Madrid → Barcelona (13 waypoints)
Distancia: 1200 km, maxKmPerDay: 300 km

Etapa 1: Madrid → Valencia (320 km) > 300 km
  → Se crea 1 parada táctica intermedia
  → 1 llamada Geocoding

Etapa 2: Valencia → Sevilla (450 km) > 300 km
  → Se crean 2 paradas tácticas intermedias
  → 2 llamadas Geocoding

... (más etapas) ...

TOTAL: ~15 llamadas para paradas tácticas nuevas
```

**CON CACHE (implementado hoy):**
```
Si "Cuenca" ya estaba en cache → 0 llamadas
Si "Torrejón" ya estaba en cache → 0 llamadas
Si "Alcalá de Henares" es NUEVA → 1 llamada
```

---

## API 3️⃣: OPEN-METEO WEATHER

### 📍 DÓNDE SE LLAMA
**Archivo:** `app/hooks/useWeather.ts`  
**Línea:** 27  
**Contexto:** Hook que se ejecuta en el NAVEGADOR del usuario

### 🔗 REQUEST (Lo que ENVIAMOS a Open-Meteo)

```typescript
// Línea 27
const url = `https://api.open-meteo.com/v1/forecast?
  latitude=${lat}                                    // "40.4168"
  &longitude=${lng}                                 // "-3.7038"
  &daily=weather_code,temperature_2m_max,          // Variables solicitadas
           temperature_2m_min,
           precipitation_probability_max,
           wind_speed_10m_max
  &timezone=auto                                    // Zona horaria automática
  &start_date=${isoDate}                           // "2025-12-15"
  &end_date=${isoDate}`;                           // "2025-12-15"
```

**Ejemplo concreto:**
```
https://api.open-meteo.com/v1/forecast?
  latitude=40.4168
  &longitude=-3.7038
  &daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max
  &timezone=auto
  &start_date=2025-12-15
  &end_date=2025-12-15
```

### 📦 RESPONSE (Lo que OPEN-METEO DEVUELVE)

```json
{
  "latitude": 40.4168,
  "longitude": -3.7038,
  "timezone": "Europe/Madrid",
  "daily": {
    "time": ["2025-12-15"],
    "weather_code": [80],           // Código WMO
    "temperature_2m_max": [12.5],   // Temp máxima en Celsius
    "temperature_2m_min": [8.3],
    "precipitation_probability_max": [60],  // % probabilidad lluvia
    "wind_speed_10m_max": [22.4]    // km/h viento máximo
  }
}
```

### 🔍 QUÉ EXTRAE NUESTRO CÓDIGO

**Línea 35-41:**
```typescript
if (data.daily) {
  return {
    code: data.daily.weather_code[0],              // 80 = rain showers
    maxTemp: data.daily.temperature_2m_max[0],     // 12.5°C
    minTemp: data.daily.temperature_2m_min[0],     // 8.3°C
    rainProb: data.daily.precipitation_probability_max[0],  // 60%
    windSpeed: data.daily.wind_speed_10m_max[0]   // 22.4 km/h
  };
}
```

**Línea 63-74 (Análisis de riesgo):**
```typescript
const checkRisk = (w: WeatherData) => {
  // Viento > 40km/h o Lluvia > 80% o Nieve
  if (w.windSpeed > 40 || w.rainProb > 80 || (w.code >= 71 && w.code <= 77)) 
    return 'danger';
  // Viento > 25km/h o Lluvia > 40%
  if (w.windSpeed > 25 || w.rainProb > 40) 
    return 'caution';
  return 'good';
};
```

### 📊 DATOS OBTENIDOS

| Dato | Tipo | Cantidad | Uso |
|------|------|----------|-----|
| **Código clima** | número | 1 | Código WMO (0-99) |
| **Temp máxima** | float | 1 | "12.5°C" |
| **Temp mínima** | float | 1 | "8.3°C" |
| **Prob lluvia** | % | 1 | "60%" |
| **Viento máximo** | km/h | 1 | "22.4 km/h" |
| **Zona horaria** | string | 1 | "Europe/Madrid" |

**Total de datos:** ~500 bytes por llamada

### 💰 COSTE EXACTO

**Modelo de precios Open-Meteo:**
```
€ 0.00 (GRATIS) ✅
```

**Detalles:**
- API pública sin clave requerida
- Sin límite de requests
- SIN autenticación
- Libre para uso comercial y personal

**Fuente:** https://open-meteo.com/en

### ❓ CUÁNTAS VECES SE LLAMA

**2 VECES POR DÍA** (aproximadamente), ejemplo:

```
Viaje: 7 días
  Día 1: Start coords (Madrid) + End coords (Valencia) = 2 llamadas
  Día 2: Start coords (Valencia) + End coords (Sevilla) = 2 llamadas
  ...
  Día 7: Start coords + End coords = 2 llamadas

TOTAL: ~14 llamadas

PERO: Si start y end están muy cerca, solo 1 llamada
Rango típico: 7-14 llamadas por viaje
```

**Línea 56-59 (Control de duplicados):**
```typescript
if (startCoords && (Math.abs(startCoords.lat - endCoords.lat) > 0.1 || 
                     Math.abs(startCoords.lng - endCoords.lng) > 0.1)) {
  startData = await fetchPoint(startCoords.lat, startCoords.lng);
  // Solo si está a >0.1° de distancia (~11 km)
}
```

---

## API 4️⃣: GOOGLE PLACES AUTOCOMPLETE

### 📍 DÓNDE SE LLAMA
**Archivo:** `app/components/TripForm.tsx`  
**Línea:** 4  
**Contexto:** NAVEGADOR del usuario cuando escribe ciudades

### 🔗 REQUEST (Lo que ENVIAMOS a Google)

```typescript
// Línea 4 - Import del componente
import { Autocomplete } from '@react-google-maps/api';

// Uso en componente (típicamente):
<Autocomplete 
  onPlaceChanged={handlePlaceChange}
  options={{
    types: ['(cities)'],  // Solo ciudades
    componentRestrictions: { country: 'es' }  // Opcional
  }}
>
  <input placeholder="Buscar ciudad..." />
</Autocomplete>
```

**¿Qué envía Google Maps JS API?**
```
Mientras el usuario escribe: "B", "Ba", "Bar", "Barc", "Barce", "Barcelo", "Barcelona"

Cada keystroke (o debounce de 300ms) envía:
  query: "Barcelona"
  types: ['cities']
  language: 'es'
```

### 📦 RESPONSE (Lo que GOOGLE DEVUELVE)

```json
{
  "predictions": [
    {
      "place_id": "ChIJ15aXWPkH0gkR...",
      "main_text": "Barcelona",
      "secondary_text": "Spain",
      "description": "Barcelona, Spain",
      "matched_substrings": [{ "offset": 0, "length": 9 }],
      "types": ["locality", "political"]
    },
    {
      "place_id": "ChIJ...",
      "main_text": "Barcelona",
      "secondary_text": "Argentina",
      "description": "Barcelona, Argentina",
      "matched_substrings": [{ "offset": 0, "length": 9 }],
      "types": ["locality", "political"]
    }
    // ... más resultados ...
  ]
}
```

### 🔍 QUÉ EXTRAE NUESTRO CÓDIGO

En `TripForm.tsx` (línea no mostrada, pero típico):
```typescript
const handlePlaceChanged = () => {
  const place = autocompleteRef.current?.getPlace();
  
  // Extraemos:
  const cityName = place.name;              // "Barcelona"
  const lat = place.geometry.location.lat();
  const lng = place.geometry.location.lng();
  const countryCode = place.address_components
    .find(c => c.types.includes('country'))?.short_name;
  
  // Guardamos en formulario
  setOrigin(`${cityName}, ${countryCode}`);
};
```

### 📊 DATOS OBTENIDOS

| Dato | Tipo | Cantidad | Uso |
|------|------|----------|-----|
| **Predicciones** | array | 5-10 | Dropdown con sugerencias |
| **Place ID** | string | 1 (seleccionado) | Identificar lugar único |
| **Nombre** | string | 1 | "Barcelona" |
| **Coordenadas** | lat/lng | 1 | Pasar a Directions API |
| **País** | string | 1 | "Spain" / "ES" |

**Total de datos:** ~1-2 KB por búsqueda

### 💰 COSTE EXACTO

**Modelo de precios Google Places Autocomplete:**

Hay 2 opciones:

**Opción A: Sesión completa**
```
€0.011 por sesión (unlimited queries en sesión)
```

**Opción B: Prediction only (sin Place ID)**
```
€0.002 por prediction + €0.017 al seleccionar
```

**¿Cuál usa nuestro código?**

Mirando la implementación con `@react-google-maps/api`, usamos:
```typescript
<Autocomplete ... />  // Esto es "Autocomplete", no "Places"
```

**Google Autocomplete ≠ Google Places Autocomplete**
- Google Maps Autocomplete (nuestra implementación): **Incluido en Maps JS API**
- Modelo de cobro de Maps JS API: €7/mes base + €0.012/request

**PERO:** Veremos si realmente se cobra mirando la cuenta de Google Cloud.

### ❓ CUÁNTAS VECES SE LLAMA

**VARIABLE**, depende del usuario:
```
Usuario típico:
  - Abre página: 0 llamadas
  - Empieza a escribir: 1-2 requests (debounced)
  - Selecciona ciudad: 1 request adicional
  
TOTAL por sesión: 3-5 requests

Pero Google cuenta por SESIÓN, no por request
→ 1 sesión = 1 cargo de €0.011 (aproximadamente)
```

---

## API 5️⃣: GOOGLE MAPS EMBED

### 📍 DÓNDE SE LLAMA
**Archivo:** `app/actions.ts`  
**Línea:** 449  
**Contexto:** Se genera una URL, se embeds en HTML

### 🔗 REQUEST (Lo que ENVIAMOS a Google)

```typescript
// Línea 449
const mapUrl = `https://www.google.com/maps/embed/v1/directions?
  origin=${origin}                     // "Madrid"
  &destination=${destination}          // "Barcelona"
  &mode=driving                        // Siempre driving
  &key=${apiKey}                       // API Key
`;

// Se embeds en HTML:
<iframe src={mapUrl} />
```

**Ejemplo concreto:**
```
https://www.google.com/maps/embed/v1/directions?
  origin=Madrid
  &destination=Barcelona
  &mode=driving
  &key=AIzaSyD...
```

### 📦 RESPONSE (Lo que GOOGLE DEVUELVE)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Google Maps</title>
  </head>
  <body>
    <div id="map" style="width: 100%; height: 100%;"></div>
    <script>
      // Script que renderiza el mapa interactivo
      // Incluye: rutas, marcadores, zoom, etc.
    </script>
  </body>
</html>
```

### 🔍 QUÉ EXTRAE NUESTRO CÓDIGO

Nuestro código NO extrae nada:

```typescript
// Línea 449-456 (app/actions.ts)
const mapUrl = `https://www.google.com/maps/embed/v1/directions?...`;

// Simplemente retorna:
return {
  mapUrl,  // ← Se devuelve al frontend
  dailyItinerary,
  distanceKm
};

// Frontend lo usa en:
<iframe src={mapUrl} width="100%" height="600" frameBorder="0" />
```

### 📊 DATOS OBTENIDOS

| Dato | Tipo | Cantidad | Uso |
|------|------|----------|-----|
| **HTML renderizado** | string | 1 | Mostrar mapa al usuario |
| **Mapa interactivo** | DOM | 1 | Usuario puede zoom, pan, etc |

**Total de datos:** ~200-500 KB (incluye assets de Google Maps)

### 💰 COSTE EXACTO

**Modelo de precios Google Maps Embed:**
```
€ 0.00 (GRATIS) ✅
```

**Detalles:**
- Embed API es gratuito
- No se cobra por vistas
- Requiere API key pero no consume cuota de billing
- Limitación: Sin autenticación, se puede usar públicamente

### ❓ CUÁNTAS VECES SE LLAMA

**NUNCA se llama realmente**, ejemplo:

```typescript
// Línea 449: Solo genera una URL string
const mapUrl = `https://www.google.com/maps/embed/v1/directions?...`;

// NO ejecuta fetch
// Simplemente retorna la URL

// El NAVEGADOR después carga el iframe:
<iframe src={mapUrl} />  // ← Esto es carga asincrónica, no una "llamada"
```

**Técnicamente:**
- 0 llamadas desde el servidor
- 1 carga de iframe (cuando el usuario ve la página)
- Costo: 0€

---

## 📊 RESUMEN TABULAR COMPLETO

| API | Línea | Qué hace | Qué obtiene | Coste/llamada | Llamadas/viaje | Coste total |
|-----|-------|----------|-------------|---------------|----------------|------------|
| **1. Directions** | 237 | Ruta completa A→B→C | Polylines, legs, steps, coords | €0.005 + €0.005×waypoints | 1 | €0.070 (típico 13 wp) |
| **2. Reverse Geocoding** | 110 | Coords → nombre ciudad | "Madrid", "Barcelona", etc | €0.005 (sin cache) | ~15 (paradas nuevas) | €0.075 |
| **3. Open-Meteo Weather** | 27 | Clima por día | Temp, lluvia, viento, code | GRATIS | 7-14 (2×días) | €0.00 |
| **4. Places Autocomplete** | 4 | Buscar ciudades | Predicciones, place_id | €0.011-€0.017 (sesión) | 1-5 (usuario) | €0.011 |
| **5. Maps Embed** | 449 | Mostrar mapa | HTML + JS renderizado | GRATIS | 1 (carga) | €0.00 |

---

## 🎯 VIAJE TÍPICO - DESGLOSE TOTAL

**Escenario:** Madrid → Barcelona, 13 waypoints, 7 días

### **GASTO POR CADA COMPONENTE:**

```
1. Google Directions API:
   1 solicitud × (€0.005 + €0.005×13) = €0.070

2. Google Reverse Geocoding:
   - Si TODO en cache:        €0.000
   - Si 15 nuevas:            €0.075
   - PROMEDIO (50% cache):    €0.0375

3. Open-Meteo Weather:
   14 llamadas × €0.000 = €0.000 ✅ GRATIS

4. Google Places Autocomplete:
   1 sesión × €0.011 = €0.011

5. Google Maps Embed:
   1 carga × €0.000 = €0.000 ✅ GRATIS

TOTAL POR VIAJE: €0.070 + €0.038 + €0.000 + €0.011 + €0.000 = €0.119
```

**Rango realista:** €0.081 - €0.156 (8-15 céntimos)

---

## 🔑 RESPUESTAS DIRECTAS A TUS PREGUNTAS

### **API 1 - Google Directions**
- **¿Qué hace?** Calcula ruta completa de A a B, pasando por waypoints, devuelve instrucciones paso a paso
- **¿Qué obtiene?** Polylines (miles de coords), distancias, duraciones, instrucciones HTML
- **¿Cuánto cuesta?** €0.005 + (€0.005 × waypoints), ejemplo: 13 wp = €0.070

### **API 2 - Google Reverse Geocoding**
- **¿Qué hace?** Convierte lat/lng en nombre de ciudad
- **¿Qué obtiene?** "Madrid", "Alcalá de Henares", "Torrejón de Ardoz"
- **¿Cuánto cuesta?** €0.005 por llamada (CACHE implementado hoy = gratis si repetida)

### **API 3 - Open-Meteo**
- **¿Qué hace?** Obtiene clima para una ubicación y fecha
- **¿Qué obtiene?** Temp máxima/mínima, lluvia, viento, código WMO
- **¿Cuánto cuesta?** €0.00 (COMPLETAMENTE GRATIS)

### **API 4 - Google Places Autocomplete**
- **¿Qué hace?** Autocomplete mientras escribes ciudad
- **¿Qué obtiene?** Lista de ciudades coincidentes, place_id, coords
- **¿Cuánto cuesta?** €0.011 por sesión de usuario

### **API 5 - Google Maps Embed**
- **¿Qué hace?** Carga mapa interactivo en la página
- **¿Qué obtiene?** Mapa zoomeable, paneable, con ruta dibujada
- **¿Cuánto cuesta?** €0.00 (COMPLETAMENTE GRATIS)

---

## 🎯 CONCLUSIÓN

De las 5 APIs:
- **Pagas:** 3 (Directions, Geocoding, Places)
- **Gratis:** 2 (Weather, Maps Embed)
- **Con cache:** Geocoding ahora gratis si se repite
- **Coste típico:** €0.08-€0.16 por viaje (8-15 céntimos)
