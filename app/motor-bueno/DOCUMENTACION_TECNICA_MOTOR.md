# 📘 Documentación Técnica: Sistema MOTOR

**Versión:** 1.0 - MVP con Alternativas
**Fecha:** 7 diciembre 2025
**Autor:** Sistema CaraColaViajes

---

## 🎯 Objetivo del documento

Este documento explica **exhaustivamente** cómo funciona el sistema MOTOR desde que el usuario ingresa origen y destino hasta que se muestran los resultados en pantalla, incluyendo todos los componentes, hooks, APIs y flujos de datos involucrados.

---

## 📋 Tabla de contenidos

1. [Visión General](#1-visión-general)
2. [Arquitectura de Archivos](#2-arquitectura-de-archivos)
3. [Flujo Completo Paso a Paso](#3-flujo-completo-paso-a-paso)
4. [Estructuras de Datos](#4-estructuras-de-datos)
5. [Componentes y Responsabilidades](#5-componentes-y-responsabilidades)
6. [Hooks Personalizados](#6-hooks-personalizados)
7. [APIs Externas](#7-apis-externas)
8. [Casos Especiales y Edge Cases](#8-casos-especiales-y-edge-cases)

---

## 1. Visión General

### 🎬 Flujo de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USUARIO                                      │
│  Ingresa: "Barcelona, Spain" → "Valencia, Spain"                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPONENTE: page.tsx                              │
│  - Captura input del usuario                                         │
│  - Valida formato                                                    │
│  - Dispara cálculo con hook useMotor                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    HOOK: useMotor.ts                                 │
│  - Llama a calculateRoute() del server action                        │
│  - Recibe dailyItinerary del servidor                                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│               SERVER ACTION: actions.ts                              │
│  - Llama a Google Directions API (polyline + distancias)             │
│  - Segmenta la ruta cada 300 km                                      │
│  - Devuelve dailyItinerary (array de etapas)                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│          COMPONENTE: MotorComparisonMaps.tsx (CLIENTE)               │
│  - Recibe dailyItinerary                                             │
│  - Calcula ruta visual con Google Maps (motorDirections)             │
│  - Extrae puntos del polyline cada 300 km                            │
│  - Busca ciudades cercanas con Google Places                         │
│  - Calcula distancias reales con DirectionsService                   │
│  - Encuentra alternativas con scoring                                │
│  - Notifica a page.tsx mediante callback                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  RENDERIZADO: page.tsx                               │
│  - Muestra itinerario con ciudades reales                            │
│  - Muestra distancias reales (calculadas con DirectionsService)      │
│  - Muestra alternativas expandibles                                  │
│  - Renderiza 3 mapas (Nuestra ruta, Google, Motor)                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Arquitectura de Archivos

### 📁 Estructura del módulo MOTOR

```
app/motor/
│
├── page.tsx                              # 🎨 UI principal y orquestador
│   ├── Estado: useMotor hook
│   ├── Renderizado: Formulario + Itinerario + Mapas
│   └── Callback: onSegmentationPointsCalculated
│
├── hooks/
│   └── useMotor.ts                       # 🎣 Hook de lógica de negocio
│       ├── calculateRoute() → Server Action
│       ├── Estado: origen, destino, dailyItinerary, loading, error
│       └── Validaciones y transformaciones
│
├── components/
│   └── MotorComparisonMaps.tsx           # 🗺️ Componente de mapas y cálculos
│       ├── Renderiza 3 mapas (Google Maps JS API)
│       ├── Calcula puntos de segmentación del polyline
│       ├── Busca ciudades con Google Places
│       ├── Calcula distancias reales con DirectionsService
│       ├── Encuentra alternativas con scoring
│       └── Callback: onSegmentationPointsCalculated
│
└── (archivos de respaldo)
    └── ESTABLE_V1_06DEC25_0845/          # 💾 Backup versión estable

app/actions.ts                            # 🖥️ Server Actions (Node.js)
    └── calculateRoute()
        ├── Llama Google Directions API (servidor)
        ├── Procesa polyline
        ├── Segmenta ruta cada 300 km
        └── Devuelve dailyItinerary[]
```

---

## 3. Flujo Completo Paso a Paso

### 🚀 Fase 1: Usuario ingresa datos

**Archivo:** `app/motor/page.tsx`

```tsx
// Usuario escribe en inputs
<input
  value={origen}
  onChange={(e) => setOrigen(e.target.value)}
/>
<input
  value={destino}
  onChange={(e) => setDestino(e.target.value)}
/>

// Usuario hace click en "Calcular Ruta"
<button onClick={() => state.calculateRoute(origen, destino, kmMaximo)}>
  Calcular Ruta
</button>
```

**Estado inicial:**
- `origen = ""`
- `destino = ""`
- `dailyItinerary = undefined`
- `loading = false`

---

### ⚙️ Fase 2: Hook dispara cálculo

**Archivo:** `app/motor/hooks/useMotor.ts`

```typescript
const calculateRoute = async (from: string, to: string, maxKm: number) => {
  console.log('🚀 MOTOR: Calculando ruta');
  console.log('  Origen:', from);
  console.log('  Destino:', to);

  setLoading(true);
  setError(null);

  try {
    // LLAMADA AL SERVER ACTION
    const result = await getDirectionsAndCost(from, to, maxKm);

    if (!result.success || !result.dailyItinerary) {
      throw new Error(result.error || 'Error calculando ruta');
    }

    console.log('✅ MOTOR: Ruta calculada exitosamente');
    console.log('  Días:', result.dailyItinerary.length);

    setDailyItinerary(result.dailyItinerary);
    setDebugResponse(result);
  } catch (err) {
    console.error('❌ MOTOR: Error:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

**Estado después:**
- `loading = true`
- Se ejecuta `getDirectionsAndCost()` (server action)

---

### 🖥️ Fase 3: Server Action procesa solicitud

**Archivo:** `app/actions.ts` (ejecuta en servidor Node.js)

```typescript
export async function getDirectionsAndCost(
  from: string,
  to: string,
  kmMaximo: number = 300
) {
  console.log('🔗 MOTOR: Google Directions API Call');

  // 1. LLAMADA A GOOGLE DIRECTIONS API
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?` +
    `origin=${encodeURIComponent(from)}&` +
    `destination=${encodeURIComponent(to)}&` +
    `mode=driving&` +
    `key=${process.env.GOOGLE_MAPS_API_KEY_FIXED}`
  );

  const data = await response.json();

  if (data.status !== 'OK') {
    return { success: false, error: `Google API error: ${data.status}` };
  }

  const route = data.routes[0];
  const legs = route.legs;

  // 2. EXTRAER POLYLINE CODIFICADO
  const polyline = route.overview_polyline.points;

  // 3. DECODIFICAR POLYLINE (array de {lat, lng})
  const decodedPath = decodePolyline(polyline);

  // 4. CALCULAR DISTANCIA TOTAL
  let totalDistanceKm = 0;
  for (let i = 0; i < decodedPath.length - 1; i++) {
    totalDistanceKm += haversineDistance(
      decodedPath[i],
      decodedPath[i + 1]
    );
  }

  // 5. SEGMENTAR CADA 300 KM
  const segmentationPoints = [];
  let accumulatedDistance = 0;
  let dayCounter = 1;

  for (let i = 0; i < decodedPath.length - 1; i++) {
    const segmentDist = haversineDistance(
      decodedPath[i],
      decodedPath[i + 1]
    );

    accumulatedDistance += segmentDist;

    // ¿Superamos 300 km?
    if (accumulatedDistance >= kmMaximo) {
      segmentationPoints.push({
        day: dayCounter,
        distance: accumulatedDistance,
        coordinates: decodedPath[i + 1],
        from: dayCounter === 1 ? from : 'Punto anterior',
        to: `Parada Táctica (${decodedPath[i+1].lat.toFixed(2)}, ${decodedPath[i+1].lng.toFixed(2)})`
      });

      accumulatedDistance = 0;
      dayCounter++;
    }
  }

  // 6. CREAR dailyItinerary
  const dailyItinerary = segmentationPoints.map((point, idx) => ({
    date: new Date(Date.now() + idx * 86400000).toLocaleDateString(),
    day: point.day,
    from: point.from,
    to: point.to,
    distance: point.distance,
    coordinates: point.coordinates,
    startCoordinates: idx === 0 ? decodedPath[0] : segmentationPoints[idx-1].coordinates,
    isDriving: true
  }));

  console.log('📦 MOTOR: Devolviendo', dailyItinerary.length, 'días');

  return {
    success: true,
    dailyItinerary,
    totalDistanceKm
  };
}
```

**Resultado devuelto al cliente:**

```javascript
{
  success: true,
  dailyItinerary: [
    {
      date: "12/07/2025",
      day: 1,
      from: "Barcelona, Spain",
      to: "Parada Táctica (40.43, 0.90)",
      distance: 174.38,
      coordinates: { lat: 40.43, lng: 0.90 },
      startCoordinates: { lat: 41.38, lng: 2.16 },
      isDriving: true
    },
    {
      date: "13/07/2025",
      day: 2,
      from: "Parada Táctica (40.43, 0.90)",
      to: "valencia",
      distance: 174.51,
      coordinates: { lat: 39.47, lng: -0.37 },
      startCoordinates: { lat: 40.43, lng: 0.90 },
      isDriving: true
    }
  ],
  totalDistanceKm: 348.9
}
```

---

### 🗺️ Fase 4: Componente MotorComparisonMaps procesa datos

**Archivo:** `app/motor/components/MotorComparisonMaps.tsx`

Este componente ejecuta **4 useEffects en secuencia:**

#### 🔄 useEffect 1: Calcular ruta del MOTOR (origen → destino directo)

```typescript
useEffect(() => {
  if (!dailyItinerary || dailyItinerary.length === 0) {
    setMotorDirections(null);
    return;
  }

  const firstDay = dailyItinerary[0];
  const lastDay = dailyItinerary[dailyItinerary.length - 1];

  // Validar que tengamos strings válidos
  if (!firstDay.from || firstDay.from.length < 3) return;
  if (!lastDay.to || lastDay.to.length < 3) return;

  console.log('🗺️ Calculando ruta del MOTOR (origen → destino directo)');

  // PEQUEÑO DELAY PARA EVITAR LLAMADAS PREMATURAS
  const timeoutId = setTimeout(() => {
    const service = new google.maps.DirectionsService();

    service.route(
      {
        origin: firstDay.from,        // "Barcelona, Spain"
        destination: lastDay.to,       // "valencia"
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          console.log('✅ Ruta del MOTOR calculada');
          setMotorDirections(result);  // ← TRIGGER para useEffect 2
        }
      }
    );
  }, 300);

  return () => clearTimeout(timeoutId);
}, [dailyItinerary]);
```

**Resultado:**
- `motorDirections` = Objeto DirectionsResult con polyline completo

---

#### 🔄 useEffect 2: Extraer puntos del polyline y buscar ciudades

```typescript
useEffect(() => {
  console.log('🔄 useEffect segmentación - motorDirections:', motorDirections ? 'EXISTE' : 'NULL');

  if (!motorDirections || !dailyItinerary || dailyItinerary.length === 0) {
    console.log('❌ useEffect segmentación: Sin datos necesarios');
    setSegmentationPoints([]);
    return;
  }

  if (!motorMap) {
    console.log('⚠️ motorMap no disponible aún, esperando...');
    return;
  }

  console.log('✅ useEffect segmentación: Iniciando cálculo...');

  try {
    // 1. EXTRAER TODOS LOS PUNTOS DEL POLYLINE
    const allPoints: google.maps.LatLng[] = [];
    motorDirections.routes[0].legs.forEach(leg => {
      leg.steps.forEach(step => {
        if (step.path) {
          allPoints.push(...step.path);
        }
      });
    });

    console.log('📍 Polyline tiene', allPoints.length, 'puntos');
    // Ejemplo: 13738 puntos

    // 2. CALCULAR DISTANCIA TOTAL DEL POLYLINE
    let totalDistance = 0;
    for (let i = 0; i < allPoints.length - 1; i++) {
      totalDistance += getDistanceFromLatLonInM(
        allPoints[i].lat(), allPoints[i].lng(),
        allPoints[i+1].lat(), allPoints[i+1].lng()
      );
    }

    console.log('📏 Distancia total del polyline:', (totalDistance / 1000).toFixed(1), 'km');
    // Ejemplo: 348.9 km

    // 3. CALCULAR PUNTOS DE PARADA CADA 300 KM
    const maxMeters = kmMaximo * 1000; // 300000 metros
    console.log('🎯 Calculando paradas cada', kmMaximo, 'km');

    const points = [];
    let accumulatedDistance = 0;
    let dayCounter = 1;
    let lastStopDistance = 0;

    for (let i = 0; i < allPoints.length - 1; i++) {
      const segmentDist = getDistanceFromLatLonInM(
        allPoints[i].lat(), allPoints[i].lng(),
        allPoints[i+1].lat(), allPoints[i+1].lng()
      );

      accumulatedDistance += segmentDist;

      // ¿Hemos superado 300km desde la última parada?
      if (accumulatedDistance - lastStopDistance >= maxMeters) {
        points.push({
          lat: allPoints[i + 1].lat(),
          lng: allPoints[i + 1].lng(),
          day: dayCounter,
          distance: (accumulatedDistance - lastStopDistance) / 1000,
        });

        lastStopDistance = accumulatedDistance;
        dayCounter++;

        console.log('  🚩 Punto día', dayCounter - 1, ':',
          allPoints[i + 1].lat(), allPoints[i + 1].lng());
      }
    }

    console.log('✅ Calculados', points.length, 'puntos de parada');
    // Ejemplo: 1 punto para Barcelona → Valencia

    // 4. BUSCAR CIUDADES CERCANAS CON GOOGLE PLACES
    const service = new google.maps.places.PlacesService(motorMap);
    const searchRadius = calculateSearchRadius(kmMaximo); // 24 km

    console.log(`📏 Radio de búsqueda calculado: ${(searchRadius / 1000).toFixed(1)} km`);

    points.forEach((point, idx) => {
      console.log(`🔍 Buscando ciudad cercana a punto ${idx + 1}:`,
        point.lat.toFixed(6), point.lng.toFixed(6));

      // BÚSQUEDA CON GOOGLE PLACES (type: locality, rankBy: PROMINENCE)
      service.nearbySearch(
        {
          location: { lat: point.lat, lng: point.lng },
          radius: searchRadius,  // 24000 metros
          type: 'locality',
          rankBy: google.maps.places.RankBy.PROMINENCE,
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {

            console.log(`  📍 Encontradas ${results.length} localidades en ${(searchRadius/1000).toFixed(1)}km`);

            // La primera es la ciudad recomendada (PROMINENCE)
            const closestPlace = results[0];
            const cityName = closestPlace.name;  // "Castellón de la Plana"
            const cityLat = closestPlace.geometry?.location?.lat();
            const cityLng = closestPlace.geometry?.location?.lng();

            console.log(`  🏙️ Ciudad recomendada: "${cityName}" (${closestPlace.vicinity})`);

            // 5. PROCESAR ALTERNATIVAS CON SCORING
            const alternatives = results
              .slice(0, 10)
              .map((place) => {
                const lat = place.geometry?.location?.lat() || 0;
                const lng = place.geometry?.location?.lng() || 0;
                const distanceFromTactical = getDistanceFromLatLonInM(
                  point.lat, point.lng, lat, lng
                ) / 1000;
                const distanceFromOrigin = point.distance + distanceFromTactical;
                const rating = place.rating || 0;
                const userRatingsTotal = place.user_ratings_total || 0;

                // FÓRMULA DE SCORING
                const score = userRatingsTotal > 0
                  ? (rating * userRatingsTotal) / Math.max(distanceFromTactical, 0.1)
                  : 0;

                return {
                  name: place.name || 'Sin nombre',
                  lat, lng, rating, userRatingsTotal,
                  vicinity: place.vicinity,
                  distanceFromOrigin,
                  score
                };
              })
              .sort((a, b) => b.score - a.score)
              .slice(0, 5);

            console.log(`  🎯 Alternativas encontradas (ordenadas por score):`);
            alternatives.forEach((alt, i) => {
              console.log(`    ${i + 1}. ${alt.name} - ${alt.distanceFromOrigin.toFixed(0)}km - ⭐${alt.rating} (${alt.userRatingsTotal}) - Score: ${alt.score.toFixed(0)}`);
            });

            // Ejemplo salida:
            // 1. Castellón de la Plana - 321km - ⭐0 (0) - Score: 0
            // 2. Sagunto - 319km - ⭐0 (0) - Score: 0

            // 6. CALCULAR DISTANCIA REAL CON DIRECTIONS SERVICE
            if (cityLat !== undefined && cityLng !== undefined) {
              const desvioKm = getDistanceFromLatLonInM(
                point.lat, point.lng, cityLat, cityLng
              ) / 1000;

              console.log(`  📏 Distancia punto → ciudad: ${desvioKm.toFixed(1)} km`);
              console.log(`  🔄 Calculando distancia real por carretera...`);

              // Obtener origen desde dailyItinerary
              const firstDay = dailyItinerary?.[0];

              if (!firstDay || !firstDay.from || firstDay.from.length < 5 || !firstDay.from.includes(',')) {
                // FALLBACK: usar suma simple
                const fallbackDistance = point.distance + desvioKm;

                setSegmentationPoints(prev => {
                  const updated = [...prev];
                  if (updated[idx]) {
                    updated[idx].cityName = cityName;
                    updated[idx].cityCoordinates = { lat: cityLat, lng: cityLng };
                    updated[idx].realDistance = fallbackDistance;
                    updated[idx].alternatives = alternatives;
                  }
                  return updated;
                });
                return;
              }

              // CÁLCULO REAL CON DIRECTIONS SERVICE
              const directionsService = new google.maps.DirectionsService();
              directionsService.route(
                {
                  origin: firstDay.from,  // "Barcelona, Spain"
                  destination: { lat: cityLat, lng: cityLng },
                  travelMode: google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                  if (status === google.maps.DirectionsStatus.OK && result) {
                    const realDistanceMeters = result.routes[0].legs[0].distance?.value || 0;
                    const realDistance = realDistanceMeters / 1000;

                    console.log(`  ✅ Distancia real origen → ${cityName}: ${realDistance.toFixed(1)} km`);
                    // Ejemplo: 277.8 km

                    // ACTUALIZAR ESTADO CON DATOS COMPLETOS
                    setSegmentationPoints(prev => {
                      const updated = [...prev];
                      if (updated[idx]) {
                        updated[idx].cityName = cityName;
                        updated[idx].cityCoordinates = { lat: cityLat, lng: cityLng };
                        updated[idx].realDistance = realDistance;  // ← DISTANCIA REAL
                        updated[idx].alternatives = alternatives;
                      }
                      return updated;
                    });
                  } else {
                    // Error: usar fallback
                    const fallbackDistance = point.distance + desvioKm;

                    setSegmentationPoints(prev => {
                      const updated = [...prev];
                      if (updated[idx]) {
                        updated[idx].cityName = cityName;
                        updated[idx].cityCoordinates = { lat: cityLat, lng: cityLng };
                        updated[idx].realDistance = fallbackDistance;
                        updated[idx].alternatives = alternatives;
                      }
                      return updated;
                    });
                  }
                }
              );
            } else {
              // No hay coordenadas de ciudad: usar punto táctico
              const realDistance = point.distance;

              setSegmentationPoints(prev => {
                const updated = [...prev];
                if (updated[idx]) {
                  updated[idx].cityName = cityName;
                  updated[idx].realDistance = realDistance;
                  updated[idx].alternatives = alternatives;
                }
                return updated;
              });
            }
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            console.log(`  ⚠️ No hay localidades, buscando lugares con servicios...`);
            // FALLBACK: buscar lodging/restaurant/gas_station
            // (código adicional de fallback)
          }
        }
      );
    });

  } catch (error) {
    console.error('💥 ERROR en useEffect segmentación:', error);
  }
}, [motorDirections, dailyItinerary, motorMap, kmMaximo]);
```

**Resultado:**
- `segmentationPoints` = Array con datos completos de cada punto:

```javascript
[
  {
    lat: 39.818380,
    lng: -0.150720,
    day: 1,
    distance: 300,  // Distancia táctica desde origen
    cityName: "Castellón de la Plana",
    cityCoordinates: { lat: 39.986, lng: -0.051 },
    realDistance: 277.8,  // Distancia REAL por carretera
    alternatives: [
      {
        name: "Castellón de la Plana",
        lat: 39.986,
        lng: -0.051,
        rating: 0,
        userRatingsTotal: 0,
        vicinity: "Castellón de la Plana",
        distanceFromOrigin: 321,
        score: 0
      },
      {
        name: "Sagunto",
        lat: 39.677,
        lng: -0.279,
        rating: 0,
        userRatingsTotal: 0,
        vicinity: "Sagunto",
        distanceFromOrigin: 319,
        score: 0
      }
    ]
  }
]
```

---

#### 🔄 useEffect 3: Notificar al componente padre

```typescript
useEffect(() => {
  if (segmentationPoints.length > 0 && startCityName && endCityName && onSegmentationPointsCalculated) {
    console.log('📤 Notificando puntos calculados al padre');

    onSegmentationPointsCalculated(
      segmentationPoints,
      startCityName,  // "Barcelona, Spain"
      endCityName     // "Valencia, Spain"
    );
  }
}, [segmentationPoints, startCityName, endCityName, onSegmentationPointsCalculated]);
```

**Resultado:**
- Se ejecuta el callback en `page.tsx`
- `page.tsx` actualiza su estado con `segmentationPoints`

---

### 🎨 Fase 5: Renderizado en page.tsx

**Archivo:** `app/motor/page.tsx`

```tsx
// ITINERARIO: Primera etapa
{state.segmentationData && state.segmentationData.points.length > 0 && (
  <div>
    <h3>Día 1: {state.segmentationData.startCity} → {state.segmentationData.points[0].cityName}</h3>

    <div>
      {/* DISTANCIA MOSTRADA */}
      {state.segmentationData.points[0].realDistance
        ? `${state.segmentationData.points[0].realDistance.toFixed(0)} km`
        : `~${state.segmentationData.points[0].distance.toFixed(0)} km`
      }
    </div>

    {/* INFORMACIÓN DETALLADA */}
    {state.segmentationData.points[0].realDistance ? (
      <>
        📍 Distancia real por carretera hasta <strong>{state.segmentationData.points[0].cityName}</strong>:
        {state.segmentationData.points[0].realDistance.toFixed(0)} km<br/>
        <span style={{ fontSize: '0.75rem', color: '#999' }}>
          (Punto de corte cada 300 km, ciudad en ruta a 300 km del origen)
        </span>

        {/* ALTERNATIVAS EXPANDIBLES */}
        {state.segmentationData.points[0].alternatives &&
         state.segmentationData.points[0].alternatives.length > 1 && (
          <details>
            <summary>
              🔽 Ver otras opciones en esta zona ({state.segmentationData.points[0].alternatives.length - 1} alternativas)
            </summary>

            {state.segmentationData.points[0].alternatives.slice(1).map((alt, altIdx) => (
              <div key={altIdx}>
                <strong>{alt.name}</strong><br/>
                📍 {alt.distanceFromOrigin.toFixed(0)} km desde origen ·
                ⭐ {alt.rating.toFixed(1)} ({alt.userRatingsTotal} opiniones) ·
                Score: {alt.score.toFixed(0)}<br/>
                <small>{alt.vicinity}</small>
              </div>
            ))}
          </details>
        )}
      </>
    ) : null}
  </div>
)}

// ITINERARIO: Etapas intermedias
{state.segmentationData && state.segmentationData.points.length > 1 &&
  state.segmentationData.points.slice(1).map((point, idx) => {
    // idx = 0 para el segundo punto (day 2)
    const previousPoint = state.segmentationData.points[idx];  // Punto anterior

    return (
      <div key={point.day}>
        <h3>
          Día {point.day}: {previousPoint.cityName} → {point.cityName}
        </h3>

        <div>
          {/* DISTANCIA DEL TRAMO (NO ACUMULADA) */}
          {point.realDistance && previousPoint.realDistance
            ? `${(point.realDistance - previousPoint.realDistance).toFixed(0)} km`
            : point.realDistance
            ? `${point.realDistance.toFixed(0)} km`
            : `~${point.distance.toFixed(0)} km`
          }
        </div>

        {/* INFORMACIÓN DETALLADA */}
        {point.realDistance ? (
          <>
            📍 Distancia real por carretera hasta <strong>{point.cityName}</strong>:
            {point.realDistance.toFixed(0)} km<br/>
            <span style={{ fontSize: '0.75rem', color: '#999' }}>
              (Ciudad en ruta, a ~{point.distance.toFixed(0)} km del punto anterior)
            </span>

            {/* ALTERNATIVAS */}
            {point.alternatives && point.alternatives.length > 1 && (
              <details>
                <summary>
                  🔽 Ver otras opciones en esta zona ({point.alternatives.length - 1} alternativas)
                </summary>
                {/* ... renderizado de alternativas ... */}
              </details>
            )}
          </>
        ) : null}
      </div>
    );
  })
}

// ETAPA FINAL
<div>
  <h3>Día {lastDay}: {lastPoint.cityName} → {endCity}</h3>
  <div>{remainingDistance} km</div>
  🏁 Etapa final hasta destino: {endCity}
</div>
```

**Ejemplo de salida visual:**

```
🗓️ Itinerario por etapas

Distancia total del viaje
Barcelona → València
348.8 km

12/07/2025
Día 1: Barcelona → Castellón de la Plana
278 km
📍 Distancia real por carretera hasta Castellón de la Plana: 278 km
(Punto de corte cada 300 km, ciudad en ruta a 300 km del origen)

🔽 Ver otras opciones en esta zona (1 alternativas)
  Sagunto
  📍 319 km desde origen · ⭐ 0.0 (0 opiniones) · Score: 0
  Sagunto

13/07/2025
Día 2: Castellón de la Plana → València
49 km
🏁 Etapa final hasta destino: València
```

---

## 4. Estructuras de Datos

### 📦 Tipo: DailyPlan (Server → Cliente)

```typescript
interface DailyPlan {
  day: number;              // 1, 2, 3...
  date: string;             // "12/07/2025"
  from: string;             // "Barcelona, Spain" o "Parada Táctica (40.43, 0.90)"
  to: string;               // "Parada Táctica (40.43, 0.90)" o "valencia"
  distance: number;         // 174.38 (km, distancia táctica del tramo)
  isDriving: boolean;       // true
  coordinates?: {           // Coordenadas del destino de la etapa
    lat: number;
    lng: number;
  };
  startCoordinates?: {      // Coordenadas del origen de la etapa
    lat: number;
    lng: number;
  };
}
```

**Ejemplo real:**
```javascript
{
  day: 1,
  date: "12/07/2025",
  from: "Barcelona, Spain",
  to: "Parada Táctica (40.43, 0.90)",
  distance: 174.38,
  isDriving: true,
  coordinates: { lat: 40.43, lng: 0.90 },
  startCoordinates: { lat: 41.38, lng: 2.16 }
}
```

---

### 📦 Tipo: SegmentationPoint (Cliente)

```typescript
interface SegmentationPoint {
  lat: number;                    // 39.818380 (coordenadas del punto táctico)
  lng: number;                    // -0.150720
  day: number;                    // 1, 2, 3...
  distance: number;               // 300 (km desde origen, distancia táctica)
  cityName?: string;              // "Castellón de la Plana"
  cityCoordinates?: {             // Coordenadas de la ciudad real
    lat: number;                  // 39.986
    lng: number;                  // -0.051
  };
  realDistance?: number;          // 277.8 (km reales por carretera desde origen)
  alternatives?: Array<{          // Alternativas con scoring
    name: string;                 // "Sagunto"
    lat: number;
    lng: number;
    rating: number;               // 0.0
    userRatingsTotal: number;     // 0
    vicinity: string;             // "Sagunto"
    distanceFromOrigin: number;   // 319 (km)
    score: number;                // 0 (rating × votes / distance)
  }>;
}
```

**Ejemplo real:**
```javascript
{
  lat: 39.818380,
  lng: -0.150720,
  day: 1,
  distance: 300,
  cityName: "Castellón de la Plana",
  cityCoordinates: { lat: 39.986, lng: -0.051 },
  realDistance: 277.8,
  alternatives: [
    {
      name: "Castellón de la Plana",
      lat: 39.986,
      lng: -0.051,
      rating: 0,
      userRatingsTotal: 0,
      vicinity: "Castellón de la Plana",
      distanceFromOrigin: 321,
      score: 0
    },
    {
      name: "Sagunto",
      lat: 39.677,
      lng: -0.279,
      rating: 0,
      userRatingsTotal: 0,
      vicinity: "Sagunto",
      distanceFromOrigin: 319,
      score: 0
    }
  ]
}
```

---

## 5. Componentes y Responsabilidades

### 📄 page.tsx

**Responsabilidades:**
- ✅ Renderizar formulario de entrada
- ✅ Capturar origen, destino, km máximo
- ✅ Invocar hook `useMotor`
- ✅ Recibir callback `onSegmentationPointsCalculated`
- ✅ Renderizar itinerario con ciudades reales
- ✅ Mostrar distancias reales por tramo
- ✅ Renderizar alternativas expandibles
- ✅ Renderizar 3 mapas de comparación

**Estado principal:**
```typescript
const state = useMotor();
// state.dailyItinerary: DailyPlan[]
// state.loading: boolean
// state.error: string | null
// state.segmentationData: { points, startCity, endCity }
```

---

### 🗺️ MotorComparisonMaps.tsx

**Responsabilidades:**
- ✅ Recibir `dailyItinerary` del servidor
- ✅ Calcular ruta visual con Google Directions API (cliente)
- ✅ Extraer polyline y calcular puntos cada 300 km
- ✅ Buscar ciudades cercanas con Google Places API
- ✅ Calcular distancias reales con DirectionsService
- ✅ Procesar alternativas con scoring
- ✅ Renderizar 3 mapas interactivos
- ✅ Notificar al padre mediante callback

**Props:**
```typescript
interface MotorComparisonMapsProps {
  origen: string;                              // "Barcelona, Spain"
  destino: string;                             // "Valencia, Spain"
  kmMaximo?: number;                           // 300
  dailyItinerary?: DailyPlan[];               // Del servidor
  showOnlyOurRequest?: boolean;
  showOnlyGoogleMap?: boolean;
  showOnlyMotorMap?: boolean;
  onSegmentationPointsCalculated?: (          // Callback
    points: SegmentationPoint[],
    startCity: string,
    endCity: string
  ) => void;
}
```

---

## 6. Hooks Personalizados

### 🎣 useMotor.ts

**Ubicación:** `app/motor/hooks/useMotor.ts`

**Responsabilidades:**
- ✅ Gestionar estado de cálculo de ruta
- ✅ Llamar al server action `getDirectionsAndCost`
- ✅ Manejar loading y errores
- ✅ Proveer función `calculateRoute`
- ✅ Almacenar `dailyItinerary` y response completo

**Estado expuesto:**
```typescript
{
  origen: string;
  setOrigen: (value: string) => void;
  destino: string;
  setDestino: (value: string) => void;
  kmMaximo: number;
  setKmMaximo: (value: number) => void;
  dailyItinerary: DailyPlan[] | undefined;
  loading: boolean;
  error: string | null;
  debugResponse: any;
  segmentationData: {
    points: SegmentationPoint[];
    startCity: string;
    endCity: string;
  } | null;
  setSegmentationData: (data) => void;
  calculateRoute: (from: string, to: string, maxKm: number) => Promise<void>;
}
```

**Uso en page.tsx:**
```typescript
const state = useMotor();

// Llamar a calcular ruta
await state.calculateRoute(origen, destino, 300);

// Acceder a resultados
if (state.dailyItinerary) {
  // Renderizar itinerario
}
```

---

## 7. APIs Externas

### 🌍 Google Maps APIs utilizadas

#### 1️⃣ **Directions API** (Servidor)

**Endpoint:**
```
GET https://maps.googleapis.com/maps/api/directions/json
```

**Parámetros:**
- `origin`: "Barcelona, Spain"
- `destination`: "Valencia, Spain"
- `mode`: "driving"
- `key`: `process.env.GOOGLE_MAPS_API_KEY_FIXED`

**Respuesta relevante:**
```json
{
  "routes": [{
    "overview_polyline": {
      "points": "encoded_polyline_string..."
    },
    "legs": [{
      "distance": { "value": 348900, "text": "349 km" },
      "duration": { "value": 13080, "text": "3 hours 38 mins" }
    }]
  }]
}
```

**Uso:**
- Obtener polyline codificado
- Calcular distancia total
- Segmentar cada 300 km

---

#### 2️⃣ **DirectionsService** (Cliente JavaScript)

**Código:**
```javascript
const service = new google.maps.DirectionsService();

service.route(
  {
    origin: "Barcelona, Spain",
    destination: { lat: 39.986, lng: -0.051 },
    travelMode: google.maps.TravelMode.DRIVING,
  },
  (result, status) => {
    if (status === google.maps.DirectionsStatus.OK) {
      const distanceMeters = result.routes[0].legs[0].distance.value;
      const distanceKm = distanceMeters / 1000;  // 277.8 km
    }
  }
);
```

**Uso:**
- Calcular distancia real desde origen hasta cada ciudad
- Se ejecuta en el navegador (cliente)
- Permite coordenadas como destino

---

#### 3️⃣ **Places API - Nearby Search** (Cliente JavaScript)

**Código:**
```javascript
const service = new google.maps.places.PlacesService(map);

service.nearbySearch(
  {
    location: { lat: 39.818380, lng: -0.150720 },
    radius: 24000,  // 24 km
    type: 'locality',
    rankBy: google.maps.places.RankBy.PROMINENCE,
  },
  (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      // results[0] es la ciudad más prominente
      const cityName = results[0].name;  // "Castellón de la Plana"
      const rating = results[0].rating;
      const reviews = results[0].user_ratings_total;
    }
  }
);
```

**Uso:**
- Encontrar ciudades cercanas al punto táctico
- Ordenadas por PROMINENCE (importancia)
- Radio dinámico basado en km/día

---

## 8. Casos Especiales y Edge Cases

### ⚠️ Caso 1: Sin ciudades encontradas en radio

**Problema:** Google Places no encuentra localidades en 24 km.

**Solución implementada:**
```typescript
if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
  console.log('⚠️ No hay localidades, buscando lugares con servicios...');

  // Fallback: buscar lodging, restaurant, gas_station
  service.nearbySearch({
    location: { lat: point.lat, lng: point.lng },
    radius: searchRadius,
    type: ['lodging', 'restaurant', 'gas_station'],
  }, (fallbackResults, fallbackStatus) => {
    // Usar el primer resultado encontrado
  });
}
```

---

### ⚠️ Caso 2: DirectionsService falla al calcular distancia real

**Problema:** No se puede calcular ruta desde origen hasta ciudad.

**Solución implementada:**
```typescript
directionsService.route({ /* ... */ }, (result, status) => {
  if (status !== google.maps.DirectionsStatus.OK) {
    console.log('⚠️ Error calculando distancia real, usando estimación');

    // FALLBACK: usar distancia táctica + desvío
    const fallbackDistance = point.distance + desvioKm;

    setSegmentationPoints(prev => {
      const updated = [...prev];
      updated[idx].realDistance = fallbackDistance;
      return updated;
    });
  }
});
```

---

### ⚠️ Caso 3: Validación de origen/destino incompletos

**Problema:** Usuario escribe "barcelona" sin autocompletado.

**Solución implementada:**
```typescript
// En useEffect del motor
if (!originRequest || typeof originRequest !== 'string' ||
    originRequest.trim() === '' || originRequest.length < 3) {
  console.log('⚠️ Origen inválido o muy corto:', originRequest);
  return;  // No ejecutar DirectionsService
}

// En useEffect de comparación (formulario)
if (typeof origen !== 'string' || !origen.includes(',') || origen.length < 5) {
  console.log('⚠️ Origen incompleto (esperando "Ciudad, País"):', origen);
  return;
}
```

**Diferencia:**
- **useEffect del motor:** acepta nombres cortos ("valencia")
- **useEffect de comparación:** exige formato completo ("Valencia, Spain")

---

### ⚠️ Caso 4: Alternativas sin reviews

**Problema:** Localidades pequeñas no tienen opiniones en Google.

**Solución implementada:**
```typescript
// Quitar filtro de reviews mínimo
const alternatives = results
  .slice(0, 10)
  .map(/* ... calcular score ... */)
  // SIN FILTRO: .filter(alt => alt.userRatingsTotal >= 5)
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);
```

**Resultado:** Se muestran todas las alternativas, incluso con 0 reviews.

---

### ⚠️ Caso 5: Cálculo de distancia del tramo (etapas intermedias)

**Problema:** Mostrar distancia acumulada en lugar de distancia del tramo.

**Solución implementada:**
```tsx
// CORRECTO: restar distancia del punto anterior
{point.realDistance && previousPoint.realDistance
  ? `${(point.realDistance - previousPoint.realDistance).toFixed(0)} km`
  : `${point.realDistance.toFixed(0)} km`
}
```

**Ejemplo:**
- Punto 1: realDistance = 298 km (desde origen)
- Punto 2: realDistance = 620 km (desde origen)
- **Distancia del tramo:** 620 - 298 = **322 km** ✅

---

## 📊 Diagrama de Secuencia Temporal

```
Tiempo (ms)    Evento
────────────────────────────────────────────────────────────────────
    0          Usuario hace click "Calcular Ruta"
               └─> useMotor.calculateRoute()

   50          Llamada al server action
               └─> getDirectionsAndCost()

  500          Google Directions API (servidor)
               └─> Respuesta con polyline

  600          Procesamiento en servidor
               └─> Segmentación cada 300 km

  700          Respuesta al cliente
               └─> dailyItinerary[]

  750          MotorComparisonMaps recibe datos
               └─> useEffect 1: Calcular motorDirections

  800          setTimeout(300ms) se inicia
               └─> Evitar llamadas prematuras

 1100          DirectionsService ejecuta
               └─> Ruta origen → destino

 1800          motorDirections calculado
               └─> useEffect 2: TRIGGER

 1850          Extraer polyline (13738 puntos)
               └─> Calcular distancia total

 1900          Segmentar cada 300 km
               └─> 1 punto encontrado

 1950          Google Places nearbySearch
               └─> Buscar localidades

 2200          Places responde
               └─> 2 localidades encontradas

 2250          Procesar alternativas
               └─> Calcular scoring

 2300          DirectionsService (distancia real)
               └─> Origen → Ciudad

 2800          Distancia real calculada
               └─> 277.8 km

 2850          setSegmentationPoints actualizado
               └─> useEffect 3: TRIGGER

 2900          Callback onSegmentationPointsCalculated
               └─> Notificar a page.tsx

 2950          page.tsx actualiza estado
               └─> Re-render con datos completos

 3000          UI completa renderizada
               └─> Itinerario + Alternativas + Mapas
```

---

## 🔍 Debugging y Logs

### Logs importantes en consola

Para seguir el flujo completo, busca estos logs en la consola del navegador:

```javascript
// Fase 1: Inicio
"🚀 MOTOR: Calculando ruta"
"  Origen: Barcelona, Spain"
"  Destino: Valencia, Spain"

// Fase 2: Server Action
"🔗 MOTOR: Google Directions API Call"
"✅ MOTOR: Ruta calculada exitosamente"
"  Días: 2"

// Fase 3: Cálculo de motorDirections
"🚗 MotorComparisonMaps - dailyItinerary: Array [ {…}, {…} ]"
"🗺️ Calculando ruta del MOTOR (origen → destino directo)"
"✅ Ruta del MOTOR calculada"

// Fase 4: Segmentación
"🔄 useEffect segmentación - motorDirections: EXISTE"
"✅ useEffect segmentación: Iniciando cálculo..."
"📍 Polyline tiene 13738 puntos"
"📏 Distancia total del polyline: 348.9 km"
"🎯 Calculando paradas cada 300 km"
"  🚩 Punto día 1: 39.818380 -0.150720"
"✅ Calculados 1 puntos de parada"

// Fase 5: Búsqueda de ciudades
"📏 Radio de búsqueda calculado: 24.0 km"
"🔍 Buscando ciudad cercana a punto 1: 39.818380 -0.150720"
"  📍 Encontradas 2 localidades en 24.0km"
"  🏙️ Ciudad recomendada: "Castellón de la Plana""

// Fase 6: Alternativas
"  🎯 Alternativas encontradas (ordenadas por score):"
"    1. Castellón de la Plana - 321km - ⭐0 (0) - Score: 0"
"    2. Sagunto - 319km - ⭐0 (0) - Score: 0"

// Fase 7: Distancia real
"  📏 Distancia punto → ciudad: 20.5 km"
"  🔄 Calculando distancia real por carretera..."
"  ✅ Distancia real origen → Castellón de la Plana: 277.8 km"

// Fase 8: Callback
"📤 Notificando puntos calculados al padre"
```

---

## 🎓 Conceptos Clave

### 🔹 Distancia Táctica vs Distancia Real

**Distancia Táctica:**
- Calculada caminando el polyline cada 300 km
- Es la distancia en línea recta acumulada
- Ejemplo: 300 km, 600 km, 900 km...
- **NO es precisa** para mostrar al usuario

**Distancia Real:**
- Calculada con DirectionsService desde origen hasta ciudad
- Es la distancia por carretera siguiendo la ruta óptima
- Ejemplo: Barcelona → Castellón = 278 km (real) vs 300 km (táctica)
- **Es la que mostramos al usuario**

---

### 🔹 Radio de Búsqueda Dinámico

```typescript
function calculateSearchRadius(kmMaximo: number): number {
  return Math.min(Math.max(kmMaximo * 80, 15000), 50000);
}
```

**Fórmula:**
- Base: `kmMaximo * 80` metros
- Mínimo: 15 km
- Máximo: 50 km

**Ejemplos:**
- 200 km/día → 16 km de radio
- 300 km/día → 24 km de radio
- 400 km/día → 32 km de radio
- 600 km/día → 48 km de radio

---

### 🔹 Fórmula de Scoring para Alternativas

```typescript
const score = (rating * userRatingsTotal) / Math.max(distanceFromTactical, 0.1);
```

**Componentes:**
- `rating`: Calificación en Google (0-5 estrellas)
- `userRatingsTotal`: Número de opiniones
- `distanceFromTactical`: Distancia desde el punto táctico en km

**Lógica:**
- ⬆️ Mejor rating → ⬆️ Score
- ⬆️ Más opiniones → ⬆️ Score
- ⬆️ Más lejos del punto → ⬇️ Score

**Ejemplo:**
- Ciudad A: ⭐4.5, 1000 reviews, 5 km → Score = 900
- Ciudad B: ⭐4.8, 200 reviews, 20 km → Score = 48

**Resultado:** Ciudad A gana porque tiene más opiniones y está más cerca.

---

## 📚 Glosario Técnico

| Término | Definición |
|---------|------------|
| **Polyline** | Representación codificada de una ruta como secuencia de coordenadas lat/lng |
| **DirectionsService** | API de Google Maps para calcular rutas entre dos puntos |
| **PlacesService** | API de Google Maps para buscar lugares cercanos a coordenadas |
| **PROMINENCE** | Criterio de ordenación que prioriza lugares más importantes/populares |
| **Server Action** | Función que se ejecuta en el servidor (Node.js) en Next.js |
| **useEffect** | Hook de React que ejecuta código cuando cambian dependencias |
| **Segmentación** | Proceso de dividir ruta en puntos cada X kilómetros |
| **Punto Táctico** | Coordenada calculada en el polyline cada 300 km |
| **Ciudad Real** | Localidad cercana al punto táctico encontrada con Places API |
| **Distancia Acumulada** | Kilómetros desde origen hasta un punto |
| **Distancia del Tramo** | Kilómetros entre dos puntos consecutivos |
| **Callback** | Función pasada como prop que se ejecuta al terminar una operación |

---

## 🎯 Resumen Ejecutivo

### ¿Qué hace el Motor?

1. **Recibe:** Origen, destino, km/día
2. **Calcula:** Ruta óptima con Google Directions
3. **Segmenta:** Divide ruta en etapas cada 300 km
4. **Busca:** Ciudades cercanas a cada punto
5. **Calcula:** Distancias reales por carretera
6. **Encuentra:** Alternativas con scoring
7. **Muestra:** Itinerario visual con mapas

### Archivos clave

- `app/actions.ts` → Server Action (Google Directions)
- `app/motor/hooks/useMotor.ts` → Lógica de negocio
- `app/motor/components/MotorComparisonMaps.tsx` → Cálculos en cliente
- `app/motor/page.tsx` → UI y renderizado

### APIs utilizadas

- Google Directions API (servidor)
- Google DirectionsService (cliente)
- Google Places Nearby Search (cliente)

### Flujo de datos

```
Usuario Input
    ↓
useMotor Hook
    ↓
Server Action (Google Directions)
    ↓
dailyItinerary[]
    ↓
MotorComparisonMaps (Google Places + DirectionsService)
    ↓
segmentationPoints[]
    ↓
page.tsx (Renderizado)
```

---

## 📅 Historial de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 07/12/2025 | Versión inicial con sistema de alternativas completo |
| 0.9 | 06/12/2025 | Implementación de distancias reales con DirectionsService |
| 0.8 | 06/12/2025 | Sistema de scoring para alternativas |
| 0.7 | 06/12/2025 | Integración Google Places con PROMINENCE |

---

**Fin del documento técnico**

Para más información, consulta:
- Código fuente en `app/motor/`
- Logs en consola del navegador (F12)
- Tests en `app/motor/TEST_CHECKLIST_FASE1.md`
