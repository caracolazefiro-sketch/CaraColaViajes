# OPTIMIZACION APIS Y PORTERO

Fecha: 18 Dic 2025

## Objetivo
Tener una única “fuente de verdad” sobre:
1) qué APIs se llaman en CaraColaViajes,
2) con qué queries/rutas,
3) qué reglas (el “portero de discoteca”) deciden si se llama o se sirve desde caché,
4) dónde quedan puntos débiles (coste/variabilidad) y cómo mitigarlos.

---

## 1) Ejemplo real: el fallback de Geocoder en cliente (coste “sorpresa”)

En la home, cuando pulsas un botón de búsqueda por categoría (restaurantes/campings/etc.), se necesita un centro (lat/lng) para hacer la búsqueda “nearby”.

### Flujo normal (sin coste extra)
1) Calculas un viaje.
2) Seleccionas un día.
3) Ese día trae `coordinates` o `startCoordinates`.
4) Al pulsar “🍽️ comida” (o similar), el sistema usa esas coordenadas y no necesita geocodificar nada “por texto”.

### Flujo real donde aparece el coste sorpresa
1) Calculas un viaje largo con paradas tácticas.
2) Ajustas una etapa o el sistema crea un día que, por cualquier motivo, **no tiene `coordinates`/`startCoordinates`** (por ejemplo: un nombre raro en `to`, un día manual, o una etapa que quedó sin coords tras cambios/recálculos).
3) Seleccionas ese día y pulsas un toggle (ej. “comida” / “camping” / “servicios”).
4) Como faltan coords, el cliente intenta salvar el botón (para que no quede “muerto”) haciendo:
   - `new google.maps.Geocoder().geocode({ address: cleanTo })`
   - donde `cleanTo` se deriva de `day.to` (limpiando prefijos tipo “📍 Parada Táctica: ...”).

**Resultado:**
- Esa llamada del geocoder ocurre **en el navegador**, no pasa por el server action.
- No pasa por Supabase cache (`api_cache_geocoding`) ni por logs server.
- Puede repetir llamadas en sesiones distintas, y puede variar en resultados (Google a veces devuelve una geometría distinta para una misma string).

---

## 2) APIs que usamos y “queries” (lo que sale a internet)

### A) Google Directions API (server)
- Endpoint:
  - `GET https://maps.googleapis.com/maps/api/directions/json`
- Parámetros:
  - `origin`, `destination`, `mode=driving`, `waypoints=...`, `key=...`
- Comportamiento:
  - 1 request por viaje (o 0 si HIT en caché).

### B) Google Geocoding API (server, reverse geocoding)
- Endpoint:
  - `GET https://maps.googleapis.com/maps/api/geocode/json?latlng=LAT,LNG&result_type=locality|administrative_area_level_2&language=es&key=...`
- Uso:
  - Nombrar “paradas tácticas” y algunos puntos intermedios.

### C) Google Places (Nearby Search “supercat”, coste controlado)
- En cliente suele ser vía `google.maps.places.PlacesService().nearbySearch(...)`.
- El motor aplica 4 “supercats” deterministas y evita paginación.

### D) Open-Meteo (weather)
- Endpoint:
  - `GET https://api.open-meteo.com/v1/forecast?...`
- Coste:
  - Gratis.

### E) Google Maps JS en cliente (no pasa por Supabase)
- `new google.maps.DirectionsService().route(...)` (para dibujar/calcular ruta en el navegador).
- `new google.maps.Geocoder().geocode(...)` (para:
  - convertir texto a coords,
  - convertir coords a nombre de ciudad en UI,
  - resolver fallbacks cuando faltan coordenadas).

---

## 3) El “Portero de discoteca” (reglas de control de llamadas)

### 3.1 Directions (server)
Regla:
1) Construye una key estable por parámetros: `travelMode|origin|destination|waypoints`.
2) Busca primero en Supabase cache `api_cache_directions`.
3) Si HIT: coste 0 y no hay llamada a Google.
4) Si MISS: llama a Google, guarda en caché (TTL) y registra log.

### 3.2 Reverse geocoding (server)
Regla:
1) Si el punto es “tactical-stop”, usa namespace `geocode-tactical` + redondeo más agresivo (más HIT).
2) Busca en Supabase cache `api_cache_geocoding`.
3) Si no hay Supabase o falla, usa caché local (archivo).
4) Si MISS: llama a Google, guarda y loguea.
5) Si `OVER_QUERY_LIMIT`: backoff y reintenta preservando el propósito.

### 3.3 Places (supercat)
Regla:
1) Limitar a 4 requests por “bloque” (supercat 1..4).
2) Sin paginación.
3) Caché por centro/radio/supercat.

### 3.4 Cliente (punto débil)
Regla actual:
- Hay throttling/retry en algunas rutas (sleep/backoff), pero **no hay caché persistente compartida** para `google.maps.Geocoder()`.

Consecuencia:
- Puede haber coste/variabilidad “invisible” en el visor de logs.

---

## 4) Ejemplo real de “Maps JS cliente no pasa por Supabase”

Ejemplo:
1) En la home, rellenas origen/destino/etapas.
2) Pulsas “Calcular”.
3) El itinerario visible (y el PDF) se construyen con `DirectionsService.route(...)` y la segmentación del hook cliente.

Ese cálculo:
- NO crea registros en `api_logs`.
- NO usa `api_cache_directions` de Supabase.
- Es “otra ruta” en paralelo al server action, que se usa para caché/logs.

Es decir: el sistema tiene dos motores:
- Motor cliente: para UI/PDF (rápido, pero menos observable y sin caché Supabase).
- Motor server: para logs/costes/cachés (observable y cacheado).

---

## 5) Propuesta: “portero cliente” mínimo para Geocoder (sin cambiar UX)

### Beneficios (sencillo)
- **Menos coste sorpresa:** si el usuario repite la acción, muchas geocodes se resuelven desde `localStorage`.
- **Más estabilidad:** si la string “cleanTo” cambia poco, el resultado se mantiene.
- **Más velocidad:** un HIT local es instantáneo.
- **Menos riesgo de rate limit en el navegador:** menos peticiones seguidas.

### Coste de implementarlo (sencillo)
- Implementación: 1–2 horas típicamente.
  - Crear util/hook de caché en `localStorage` con TTL (p.ej. 7–30 días).
  - Dos índices:
    - `address -> {lat,lng}`
    - `lat,lng -> cityName`
  - Integrar en:
    - fallback de `handleToggleWrapper` (geocode por address)
    - `getCleanCityName` si se quiere (reverse geocode)
- Riesgos:
  - Si TTL es muy largo, puede “congelar” un resultado malo; por eso conviene TTL y versión de clave.

---

## 6) Checklist de revisión (para BUENAS NOCHES)

Cada noche, revisar si en la sesión se tocaron piezas del portero:
- `app/actions.ts` (server: directions/geocoding/segmentación)
- `app/hooks/useTripCalculator.ts` (cliente: segmentación + geocoder)
- `app/hooks/useTripPlaces.ts` / `app/components/TripForm.tsx` (places)
- `app/utils/supabase-cache.ts` y `app/utils/server-logs.ts`

Si alguno cambió, actualizar este documento con:
- Qué API cambia
- Qué regla cambió
- Impacto: coste / caché / estabilidad
- Acción recomendada
