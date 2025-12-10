# 🔍 APIs REALMENTE USADAS EN CARACOLAVIAJES

## VERIFICACIÓN DEL CÓDIGO ACTUAL (10 DIC 2025)

---

## 1️⃣ GOOGLE DIRECTIONS API
**Archivo:** `app/actions.ts` línea 237  
**Tipo:** Server-side (backend)

```typescript
const url = `https://maps.googleapis.com/maps/api/directions/json?
  origin=Madrid&
  destination=Barcelona&
  waypoints=Valencia|Sevilla|Bilbao&
  mode=driving&
  key=API_KEY`;

const response = await fetch(url);
```

**¿Qué hace?**
- Calcula ruta completa de A a B con waypoints
- Google devuelve: legs, steps, polylines con miles de coordenadas

**¿Cuántas llamadas?**
- **1 sola llamada por viaje** (sin importar waypoints)

**Coste:**
- Base: €0.005
- Por cada waypoint: €0.005
- Ejemplo: 13 waypoints = €0.005 + (€0.005 × 13) = **€0.070**

---

## 2️⃣ GOOGLE REVERSE GEOCODING API
**Archivo:** `app/actions.ts` línea 110  
**Tipo:** Server-side (backend)

```typescript
const url = `https://maps.googleapis.com/maps/api/geocode/json?
  latlng=40.123,-3.456&
  result_type=locality|administrative_area_level_2&
  language=es&
  key=API_KEY`;

const res = await fetch(url);
```

**¿Qué hace?**
- Convierte coordenadas (lat, lng) en nombres de ciudades
- Necesario para: paradas tácticas que creamos interpolando

**¿Cuántas llamadas?**
- **1 por cada parada táctica NUEVA**
- Con cache: 0 si ya la hemos visto

**Coste:**
- €0.005 por llamada
- Ejemplo: 15 paradas tácticas nuevas = 15 × €0.005 = **€0.075**

**¿Está implementado el cache?**
- ✅ SÍ (justo migré hoy)
- Cache file: `data/geocoding-cache.json` (52 ciudades)
- Importado en `app/actions.ts` línea 4

---

## 3️⃣ OPEN-METEO API (Weather)
**Archivo:** `app/hooks/useWeather.ts` línea 27  
**Tipo:** Client-side (frontend)

```typescript
const url = `https://api.open-meteo.com/v1/forecast?
  latitude=40.123&
  longitude=-3.456&
  daily=weather_code,temperature_2m_max,...&
  start_date=2025-12-15&
  end_date=2025-12-15`;

const res = await fetch(url);
```

**¿Qué hace?**
- Obtiene clima para cada día de la ruta
- Se ejecuta en el navegador del usuario

**¿Cuántas llamadas?**
- 1-2 por día de la ruta (start + end coords)
- Ejemplo: viaje 7 días = ~14 llamadas

**Coste:**
- **GRATIS** ✅ (API pública, sin clave)
- Sin límite de requests (generoso)

---

## 4️⃣ GOOGLE PLACES AUTOCOMPLETE (Implied)
**Archivo:** `app/components/TripForm.tsx` línea 4  
**Tipo:** Client-side (frontend)

```typescript
import { Autocomplete } from '@react-google-maps/api';

// Usado en el formulario de búsqueda de ciudades
<Autocomplete onPlaceChanged={handlePlaceChange} />
```

**¿Qué hace?**
- Autocomplete mientras escribes ciudades
- Google Maps JS API lo maneja automáticamente

**¿Cuántas llamadas?**
- Depende del usuario (keystrokes)
- 1 por cada carácter o por debounce (típicamente cada 300ms)

**Coste:**
- Places Autocomplete: €0.011 por sesión (unlimited queries)
- O: Text Search: €0.025 por búsqueda

**¿Está implementado?**
- ✅ SÍ (usamos Google Maps JS API loader)

---

## 5️⃣ GOOGLE MAPS EMBED (Map display)
**Archivo:** `app/actions.ts` línea 449  
**Tipo:** Server-side (backend)

```typescript
const mapUrl = `https://www.google.com/maps/embed/v1/directions?
  origin=Madrid&
  destination=Barcelona&
  mode=driving&
  key=API_KEY`;
```

**¿Qué hace?**
- Embeds el mapa interactivo de Google en la página
- PERO: es solo una URL, no hace llamadas adicionales

**¿Cuántas llamadas?**
- 0 (es solo una URL generada)

**Coste:**
- GRATIS si usas el embed (no se cobra por view)

---

## ❌ APIs NO USADAS (mencionadas pero no implementadas)

| API | Por qué NO | Alternativa |
|-----|-----------|------------|
| Nominatim | No en código actual | Fue propuesta como alternativa (gratuita) |
| Supabase | Creadas tablas pero no usado | Para persistencia futura |
| OpenWeatherMap | No usado | Usamos Open-Meteo (gratuito) |

---

## 📊 RESUMEN EXACTO

### **APIs realmente llamadas:**

| # | API | Dónde | Llamadas/Viaje | Coste |
|---|-----|-------|-----------------|-------|
| 1 | Google Directions | Backend | 1 | €0.005 + €0.005×waypoints |
| 2 | Google Reverse Geocoding | Backend | N (paradas tácticas nuevas) | €0.005 × N |
| 3 | Open-Meteo Weather | Frontend | ~2×días | **GRATIS** |
| 4 | Google Places Auto | Frontend | Variable (usuario) | €0.011/sesión |
| 5 | Google Maps Embed | Backend | 0 (URL solo) | **GRATIS** |

### **Coste típico de 1 viaje:**

**Mejor caso (todo en cache):**
```
Directions: €0.070 (1 llamada + 13 waypoints)
Geocoding: €0.000 (todo en cache)
Weather: GRATIS
Places: ~€0.011 (si usuario buscó ciudades)
────────────────────────
TOTAL: ~€0.081 (8.1 céntimos)
```

**Peor caso (nada en cache):**
```
Directions: €0.070
Geocoding: €0.075 (15 paradas tácticas nuevas)
Weather: GRATIS
Places: ~€0.011
────────────────────────
TOTAL: ~€0.156 (15.6 céntimos)
```

---

## ✅ RESPUESTA A TU PREGUNTA

**"5 APIs instaladas":**
- ✅ Google Directions
- ✅ Google Reverse Geocoding (con cache desde hoy)
- ✅ Open-Meteo Weather (gratis)
- ✅ Google Places Autocomplete
- ✅ Google Maps Embed

**Pero SOLO PAGAS por:**
1. Google Directions: €0.070/viaje
2. Google Geocoding: €0.005 × paradas nuevas
3. Google Places: €0.011/sesión (si busca ciudades)

**Gratis:**
- Open-Meteo: ✅
- Maps Embed: ✅

---

## 🎯 LA CONTRADICCIÓN QUE ENCONTRASTE

Tienes razón en cuestionarme. Dije "5 APIs" pero:

- **Realmente se usan:** 5
- **De pago:** 3
- **Gratis:** 2
- **Costo por viaje:** €0.08-€0.16 (no "1 llamada a €0.005")

La confusión vino de que no diferenciaba bien entre:
- Llamadas a una API (Directions = 1)
- Funciones dentro de API (Geocoding = múltiples)
- Sesiones vs querys

Ahora está claro. ¿Preguntas?
