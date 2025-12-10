# 🔍 ANÁLISIS EXHAUSTIVO DEL MOTOR MALO (Motor de Producción Actual)

**Fecha de análisis**: 9 de diciembre de 2025
**Versión**: Commit 94299a1 (Next.js 16.0.7)
**Estado**: ✅ Funcional en producción
**URL**: cara-cola-viajes-git-testing-caracola.vercel.app

---

## 📍 UBICACIÓN Y ARQUITECTURA GENERAL

El **motor malo** NO existe como una carpeta dedicada. Es una **arquitectura dispersa integrada en la estructura principal de la app**. Los componentes están distribuidos en:

```
app/
├── page.tsx                    ← Página principal (Entry Point)
├── actions.ts                  ← Server Actions (Lógica del motor en servidor)
├── types.ts                    ← Interfaces TypeScript
├── constants.ts                ← Constantes (iconos, helpers)
├── hooks/                      ← Custom Hooks (Lógica de negocio)
│   ├── useTripCalculator.ts   ← Motor de cálculo de rutas
│   ├── useTripPersistence.ts  ← Persistencia en Supabase/LocalStorage
│   ├── useTripPlaces.ts       ← Búsqueda de servicios (Google Places)
│   ├── useLanguage.ts         ← Internacionalización
│   ├── useWeather.ts          ← Clima (Open-Meteo)
│   ├── useElevation.ts        ← Elevación (Google Elevation API)
│   └── useSearchFilters.ts    ← Filtros de búsqueda
└── components/                 ← Componentes de UI
    ├── TripForm.tsx           ← Formulario de entrada
    ├── TripMap.tsx            ← Mapa interactivo
    ├── ItineraryPanel.tsx     ← Panel de itinerario
    ├── StageSelector.tsx      ← Selector de etapas
    ├── DaySpotsList.tsx       ← Lista de sitios guardados
    └── ... (13 componentes más)
```

**Ruta de acceso**: La app funciona en la **ruta raíz `/`** (no existe `/motor`). Es el sitio web principal.

---

## 🏗️ FLUJO DE DATOS Y ARQUITECTURA

### 1. Punto de Entrada: `app/page.tsx`

**Líneas clave**: 1-534

```tsx
'use client';

export default function Home() {
  // Estado centralizado
  const [formData, setFormData] = useState({ origen, destino, etapas, consumo, ... });
  const [results, setResults] = useState({ dailyItinerary, totalCost, ... });
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Hooks de negocio
  const { calculateRoute, loading } = useTripCalculator(convert, units);
  const { searchPlaces, places, toggles } = useTripPlaces(map);
  const { handleSaveToCloud, isSaving } = useTripPersistence(...);

  // Cálculo de ruta
  const handleCalculateWrapper = (e) => {
    calculateRoute(formData); // ← Llama al hook useTripCalculator
  };

  return (
    <main>
      <TripForm formData={formData} onSubmit={handleCalculateWrapper} />
      <TripMap directionsResponse={directionsResponse} places={places} />
      <ItineraryPanel dailyItinerary={results.dailyItinerary} />
    </main>
  );
}
```

**Características**:
- **Arquitectura "client-side first"**: Todo el estado vive en `page.tsx`
- **Props drilling**: Los datos se pasan por props a todos los componentes
- **No existe routing interno**: Es una SPA (Single Page App) en la ruta `/`

---

### 2. Motor de Cálculo: `hooks/useTripCalculator.ts`

**Líneas clave**: 1-300

**⚠️ DOBLE MOTOR**: Este archivo contiene **DOS motores diferentes**:

#### Motor A: Client-Side (Google Directions API del navegador)

```typescript
const calculateRoute = async (formData: TripFormData) => {
  const directionsService = new google.maps.DirectionsService(); // ← API del navegador

  // Llamada directa a Google desde el cliente
  const result = await directionsService.route({
    origin: normalizeForGoogle(formData.origen),
    destination: normalizeForGoogle(formData.destino),
    waypoints: waypoints,
    travelMode: google.maps.TravelMode.DRIVING,
  });

  // Algoritmo "Slicing V2" (Interpolación de coordenadas)
  const route = result.routes[0];
  for (let i = 0; i < route.legs.length; i++) {
    const leg = route.legs[i];
    let legPoints: google.maps.LatLng[] = [];
    leg.steps.forEach(step => { if(step.path) legPoints = legPoints.concat(step.path); });

    // Buscar puntos de corte cada kmMaximoDia
    for (let j = 0; j < legPoints.length - 1; j++) {
      if (legAccumulator + segmentDist > maxMeters) {
        const stopTitle = `📍 Parada Táctica: ${locationString}`;
        itinerary.push({ from, to: stopTitle, distance, isDriving: true });
      }
    }
  }
};
```

**Características**:
- ✅ **Segmentación avanzada**: Usa `step.path` (array de LatLng) para interpolación precisa
- ✅ **Geocoding con reintentos**: `getCleanCityName()` con exponential backoff contra rate limits
- ✅ **Normalización de texto**: Elimina acentos para Google API
- ✅ **Manejo de vuelta a casa**: Lógica para viajes circulares
- ✅ **Días de estancia**: Calcula noches en destino final
- ⚠️ **Expone API key pública**: `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

---

### 3. Motor de Cálculo Server-Side: `app/actions.ts`

**Líneas clave**: 1-442

#### Motor B: Server-Side (Server Action con API key privada)

```typescript
'use server';

export async function getDirectionsAndCost(data: DirectionsRequest): Promise<DirectionsResult> {
  // Preferencia por clave privada del servidor
  const apiKey = process.env.GOOGLE_MAPS_API_KEY_FIXED ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Llamada directa a REST API de Google
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}...`;
  const response = await fetch(url);
  const directionsResult = await response.json();

  // Algoritmo de segmentación con polyline decoding
  const route = directionsResult.routes[0];
  for (let i = 0; i < route.legs.length; i++) {
    const leg = route.legs[i];
    for (const step of leg.steps) {
      const path = decodePolyline(step.polyline.points); // ← Decodifica polyline manualmente

      // Buscar puntos de corte
      let metersLeftInStep = stepDist;
      while (metersLeftInStep >= metersNeeded) {
        const stopCoords = path[p+1];
        await sleep(200); // ← Prevenir rate limits
        const stopNameRaw = await getCityNameFromCoords(stopCoords.lat, stopCoords.lng, apiKey);

        allDrivingStops.push({ from, to: stopName, distance, startCoords, endCoords });
      }
    }
  }

  // Post-segmentación: Dividir etapas > maxKmPerDay usando interpolación + reverse geocoding
  const segmented = await postSegmentItinerary(dailyItinerary, maxKmPerDay, apiKey);
  return { distanceKm, mapUrl, dailyItinerary: segmented };
}
```

**Características**:
- ✅ **API key segura en servidor**: Prioriza `GOOGLE_MAPS_API_KEY_FIXED`
- ✅ **Post-segmentación**: Divide etapas largas después del cálculo inicial
- ✅ **Geocoding robusto**: `getCityNameFromCoords()` con reintentos y rate limit handling
- ✅ **Debug logging**: Devuelve `debugLog` para troubleshooting
- ✅ **Decodificación de polyline**: Implementa algoritmo manual (`decodePolyline()`)
- ⚠️ **Redundancia con Motor A**: Lógica similar pero implementación diferente

---

## 🎯 TIPOS Y ESTRUCTURAS DE DATOS

### `app/types.ts` (Líneas 1-100)

```typescript
export interface DailyPlan {
    day: number;
    date: string;           // Formato: "05/12/2025" (DD/MM/YYYY)
    isoDate: string;        // Formato: "2025-12-05" (ISO 8601)
    from: string;           // Nombre de ciudad origen
    to: string;             // Nombre de ciudad destino
    distance: number;       // Distancia en km
    isDriving: boolean;     // true = día de conducción, false = estancia

    // Coordenadas para clima y servicios
    startCoordinates?: Coordinates; // ✅ NUEVO: Coordenadas de inicio
    coordinates?: Coordinates;      // Coordenadas de destino

    // Tipo de día
    type: 'overnight' | 'tactical' | 'start' | 'end';
    // overnight: Pernocta en waypoint obligatorio
    // tactical: Parada táctica creada por segmentación automática
    // start: Día de inicio
    // end: Día final

    // Lugares guardados por el usuario
    savedPlaces?: PlaceWithDistance[];
}

export interface PlaceWithDistance {
    name?: string;
    rating?: number;
    user_ratings_total?: number;
    vicinity?: string;
    place_id?: string;
    geometry?: { location?: Coordinates; };
    distanceFromCenter?: number;
    type?: ServiceType; // camping, restaurant, water, gas, supermarket, laundry, tourism, custom, search, found
    photoUrl?: string;
    types?: string[]; // Tags de Google Places (para filtrado)
    opening_hours?: { isOpen?: () => boolean; open_now?: boolean };
    link?: string;
    isPublic?: boolean; // true = visible a otros usuarios, false = privado
    note?: string;      // Nota personal del usuario
    score?: number;     // Score combinado (distancia + rating + reviews)
}

export interface TripResult {
    totalDays: number | null;
    distanceKm: number | null;
    totalCost: number | null;
    liters?: number | null;
    dailyItinerary: DailyPlan[] | null;
    error: string | null;
}
```

**Campo crítico: `isoDate`**: Necesario para compatibilidad con `motor bueno` y cálculo de fechas precisas.

---

## 🗺️ BÚSQUEDA DE SERVICIOS: `hooks/useTripPlaces.ts`

**Líneas clave**: 1-325

```typescript
export function useTripPlaces(map: google.maps.Map | null) {
  const [places, setPlaces] = useState<Record<ServiceType, PlaceWithDistance[]>>({
    camping: [], restaurant: [], water: [], gas: [], supermarket: [], laundry: [], tourism: [],
    custom: [], search: [], found: [] // ← 'search' y 'found' son marcadores especiales
  });

  // 💰 CACHÉ EN MEMORIA (Ahorro de API Calls)
  const placesCache = useRef<Record<string, PlaceWithDistance[]>>({});

  const searchPlaces = useCallback((location: Coordinates, type: ServiceType) => {
    // Generar clave de caché (Redondeando coords para evitar duplicados innecesarios)
    const cacheKey = `${type}_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}`;

    // Verificar caché antes de llamar a Google
    if (placesCache.current[cacheKey]) {
      setPlaces(prev => ({...prev, [type]: placesCache.current[cacheKey]}));
      return;
    }

    const service = new google.maps.places.PlacesService(map);

    // Búsqueda específica por tipo
    switch(type) {
      case 'camping':
        // Búsqueda ampliada con keyword
        searchKeyword = 'camping OR "área de autocaravanas" OR "RV park" OR pernocta';
        break;
      // ... otros tipos
    }

    service.nearbySearch(searchRequest, (res, status) => {
      let spots = res.map(spot => {
        // Calcular distancia desde punto central
        let dist = google.maps.geometry.spherical.computeDistanceBetween(centerPoint, spot.geometry.location);

        // Calcular score combinado (distancia + rating + reviews)
        const distanceScore = Math.max(0, 100 * Math.exp(-dist / 5000));
        const ratingScore = (spot.rating / 5) * 100;
        const reviewsScore = Math.log10(spot.user_ratings_total + 1) * 50;
        const totalScore = distanceScore * 0.4 + ratingScore * 0.3 + reviewsScore * 0.2;

        return { ...spot, distanceFromCenter: dist, type, score: totalScore };
      });

      // 🚫 FILTRO DEL PORTERO (Eliminar falsos positivos)
      spots = spots.filter(spot => {
        const tags = spot.types || [];
        if (type === 'camping') {
          // Debe ser campground/rv_park Y NO ser tienda/ferretería
          const esCamping = tags.includes('campground') || tags.includes('rv_park');
          const esTienda = tags.includes('hardware_store') || tags.includes('store');
          return esCamping && !esTienda;
        }
        // ... filtros para otros tipos
      });

      // Ordenar por score
      const finalSpots = spots.sort((a, b) => (b.score || 0) - (a.score || 0));

      // Guardar en caché
      placesCache.current[cacheKey] = finalSpots;
      setPlaces(prev => ({...prev, [type]: finalSpots}));
    });
  });
}
```

**Características**:
- ✅ **Caché inteligente**: Evita llamadas repetidas a Google Places API
- ✅ **Score combinado**: Pondera distancia, rating y reviews
- ✅ **Filtro de calidad**: Elimina resultados irrelevantes (ferreterías en campings, hoteles en restaurantes)
- ✅ **Búsqueda ampliada para campings**: Incluye "área de autocaravanas" y "RV park"

---

## 💾 PERSISTENCIA: `hooks/useTripPersistence.ts`

**Líneas clave**: 1-252

```typescript
export function useTripPersistence(formData, setFormData, results, setResults, ...) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initializeUser = async () => {
      if (!supabase) {
        // Sin Supabase, limpiar todo
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user?.id) {
        const currentUserId = session.user.id;
        setUserId(currentUserId);

        // Cargar datos del localStorage (específico del usuario)
        const storageKey = `caracola_trip_v1_${currentUserId}`;
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setFormData(parsed.formData);
          setResults(parsed.results);
          setCurrentTripId(parsed.tripId);
        }
      } else {
        // Sin sesión: pantalla virgen
        setResults({ totalDays: null, ... });
      }
    };

    initializeUser();
  }, []);

  const handleSaveToCloud = async () => {
    if (!supabase || !userId) return;

    const tripData = { formData, results };

    if (currentTripId) {
      // UPDATE: Viaje existente
      await supabase.from('trips').update({ trip_data: tripData }).eq('id', currentTripId);
    } else {
      // INSERT: Nuevo viaje
      const { data } = await supabase.from('trips').insert({ user_id: userId, trip_data: tripData }).select();
      setCurrentTripId(data[0].id);
    }

    // Guardar también en localStorage
    const storageKey = `caracola_trip_v1_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify({ formData, results, tripId: currentTripId }));
  };
}
```

**Características**:
- ✅ **Dual storage**: LocalStorage + Supabase
- ✅ **Key específica por usuario**: `caracola_trip_v1_${userId}`
- ✅ **Auto-carga en login**: Restaura el último viaje guardado
- ✅ **Manejo de cambio de usuario**: Limpia estado al cambiar de sesión

---

## 🎨 COMPONENTES DE UI

### 1. `components/TripForm.tsx` (Líneas 1-439)

**Función**: Formulario de entrada de parámetros del viaje

```tsx
export default function TripForm({ formData, setFormData, onSubmit, loading, ... }) {
  return (
    <form onSubmit={onSubmit}>
      <Autocomplete onLoad={ref => originRef.current = ref}>
        <input
          value={formData.origen}
          onChange={(e) => setFormData({...formData, origen: e.target.value})}
        />
      </Autocomplete>

      <input type="date" value={formData.fechaInicio} />
      <input type="number" value={formData.kmMaximoDia} />
      <input type="number" value={formData.consumo} />
      <input type="number" value={formData.precioGasoil} />

      <button type="submit" disabled={loading}>
        {loading ? '🔄 Calculando...' : '🚀 Calcular Itinerario'}
      </button>

      <ActionButtons auditMode={auditMode} onSave={onSave} onReset={onReset} />
    </form>
  );
}
```

**Características**:
- ✅ **Google Autocomplete**: Para origen, destino y waypoints
- ✅ **Validación de campos**: Fechas, consumo, precio
- ✅ **Botones de acción**: Guardar, compartir, resetear, modo auditoría
- ✅ **Waypoints colapsables**: `showWaypoints` toggle

---

### 2. `components/ItineraryPanel.tsx` (Líneas 1-240)

**Función**: Panel lateral con lista de días y lugares guardados

```tsx
export default function ItineraryPanel({
  dailyItinerary, selectedDayIndex, places, onSelectDay, onAddPlace, onRemovePlace, ...
}) {
  if (selectedDayIndex === null) {
    // VISTA RESUMEN: Lista de todos los días
    return (
      <div>
        {dailyItinerary.map((day, index) => (
          <div onClick={() => onSelectDay(index)}>
            <span>{day.isDriving ? '🚐' : '🏖️'} Día {day.day}</span>
            <span>{day.from} ➝ {day.to}</span>
            <span>{day.distance} km</span>

            {/* Botones de acción */}
            <button onClick={() => onSearchNearDay(index)}>🔍 Buscar Servicios</button>
            <button onClick={() => onAdjustDay(index)}>⚙️ Ajustar Parada</button>
            <button onClick={() => onAddDay(index)}>➕ Añadir Día</button>
            <button onClick={() => onRemoveDay(index)}>🗑️ Borrar Día</button>

            {/* Lugares guardados en este día */}
            {day.savedPlaces?.map(place => (
              <div>{place.name}</div>
            ))}
          </div>
        ))}
      </div>
    );
  } else {
    // VISTA DETALLE: Día seleccionado con búsqueda de servicios
    return (
      <div>
        <h3>Día {dailyItinerary[selectedDayIndex].day}</h3>

        {/* Toggles de servicios */}
        <ServiceIcons camping restaurant gas ... onToggle={onToggle} />

        {/* Resultados de búsqueda */}
        <DaySpotsList places={places} onAddPlace={onAddPlace} onRemovePlace={onRemovePlace} />
      </div>
    );
  }
}
```

**Características**:
- ✅ **Doble vista**: Resumen (lista) vs Detalle (día seleccionado)
- ✅ **Gestión de días**: Añadir/borrar días de estancia
- ✅ **Ajuste de parada**: Cambiar destino de etapa y recalcular ruta
- ✅ **Búsqueda de servicios cerca de etapa**: Botón para buscar campings/gas/restaurantes
- ✅ **Filtros avanzados**: Rating mínimo, radio de búsqueda, ordenamiento

---

### 3. `components/TripMap.tsx` (Líneas 1-424)

**Función**: Mapa interactivo con ruta y marcadores

```tsx
export default function TripMap({
  directionsResponse, dailyItinerary, places, toggles, hoveredPlace, onAddPlace, ...
}) {
  return (
    <GoogleMap
      onLoad={handleMapLoad}
      onClick={handleMapClick}
      center={center}
      zoom={6}
    >
      {/* Ruta de Google Directions */}
      {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}

      {/* Marcadores de etapas */}
      {dailyItinerary?.map((day, i) => (
        day.coordinates && (
          <Marker
            position={day.coordinates}
            icon={day.type === 'tactical' ? ICONS_ITINERARY.tactical : ICONS_ITINERARY.startEnd}
            label={`${day.day}`}
          />
        )
      ))}

      {/* Marcadores de servicios (camping, restaurant, gas, ...) */}
      {Object.entries(places).map(([type, spots]) =>
        toggles[type] && spots.map(spot => (
          <Marker
            position={spot.geometry?.location}
            icon={MARKER_ICONS[type]}
            onClick={() => onAddPlace(spot)}
          />
        ))
      )}

      {/* InfoWindow al hacer click en POI de Google Maps */}
      {clickedGooglePlace && (
        <InfoWindow position={clickedGooglePlace.geometry?.location} onCloseClick={...}>
          <div>
            <img src={clickedGooglePlace.photoUrl} />
            <h3>{clickedGooglePlace.name}</h3>
            <StarRating rating={clickedGooglePlace.rating} />
            <button onClick={() => onAddPlace(clickedGooglePlace)}>➕ Añadir a Día</button>
          </div>
        </InfoWindow>
      )}

      {/* Buscador libre en el mapa */}
      <div className="map-search-bar">
        <input placeholder="Buscar en el mapa..." onKeyDown={handleSearch} />
        <button onClick={onClearSearch}>✖️ Limpiar</button>
      </div>
    </GoogleMap>
  );
}
```

**Características**:
- ✅ **Tres tipos de marcadores**:
  - **Etapas**: Puntos rojos/azules del itinerario
  - **Servicios**: Iconos de camping, gas, restaurante (de búsquedas predefinidas)
  - **POIs de Google**: Al hacer click en lugares del mapa (restaurantes, gasolineras, etc.)
- ✅ **InfoWindow dinámico**: Muestra info del lugar y botón para añadir
- ✅ **Buscador libre**: Buscar cualquier lugar en el mapa (`onSearch`)
- ✅ **Control de zoom/pan**: Detecta interacción humana vs programática

---

## ⚙️ FUNCIONALIDADES AVANZADAS

### 1. Ajuste de Parada (Recálculo dinámico)

**Ubicación**: `app/page.tsx` líneas 200-400

```typescript
const handleConfirmAdjust = async (newDestination: string, newCoordinates: Coordinates) => {
  // 1. Actualizar etapa ajustada
  const updatedItinerary = [...results.dailyItinerary];
  updatedItinerary[adjustingDayIndex] = { ...day, to: newDestination, coordinates: newCoordinates };

  // 2. Si es última etapa, solo actualizar destino
  if (adjustingDayIndex === updatedItinerary.length - 1) {
    setResults({ ...results, dailyItinerary: updatedItinerary });
    return;
  }

  // 3. Si es etapa intermedia, RECALCULAR RUTA COMPLETA
  const waypointsFromForm = formData.etapas.split('|').filter(s => s.length > 0);

  // Insertar nuevo destino en el índice correcto
  const nextDayDestination = updatedItinerary[adjustingDayIndex + 1].to;
  const nextWaypointIndex = waypointsFromForm.findIndex(wp => wp.includes(nextDayDestination));

  let updatedMandatoryWaypoints = [
    ...waypointsFromForm.slice(0, nextWaypointIndex),
    newDestination,
    ...waypointsFromForm.slice(nextWaypointIndex)
  ];

  // 4. Llamar al server action con waypoints actualizados
  const { getDirectionsAndCost } = await import('./actions');
  const recalcResult = await getDirectionsAndCost({
    origin: formData.origen,
    destination: formData.destino,
    waypoints: updatedMandatoryWaypoints,
    kmMaximoDia: formData.kmMaximoDia,
    ...
  });

  // 5. Actualizar itinerario con resultado nuevo (ya segmentado en servidor)
  setResults({ ...results, dailyItinerary: recalcResult.dailyItinerary });

  // 6. Actualizar formData.etapas con waypoints obligatorios nuevos
  setFormData({ ...formData, etapas: updatedMandatoryWaypoints.join('|') });
};
```

**Características**:
- ✅ **Recálculo inteligente**: Solo recalcula si es etapa intermedia
- ✅ **Preserva waypoints obligatorios**: Inserta nuevo destino sin perder los existentes
- ✅ **Actualiza formData**: Sincroniza waypoints con el formulario
- ✅ **Llamada al server action**: Usa Motor B (server-side) para recálculo

---

### 2. Búsqueda de Servicios Cerca de Etapa

**Ubicación**: `app/page.tsx` líneas 147-165

```typescript
const handleSearchNearDay = async (dayIndex: number) => {
  if (!results.dailyItinerary) return;
  const dailyPlan = results.dailyItinerary[dayIndex];
  if (!dailyPlan || !dailyPlan.isDriving) return;

  // 1. Seleccionar etapa y centrar mapa
  setSelectedDayIndex(dayIndex);

  // 2. Limpiar filtros y marcadores anteriores
  clearSearch();

  // 3. Obtener coordenadas de destino
  const centerCoords = dailyPlan.coordinates;

  // 4. Buscar servicios en un radio de 50km
  searchPlaces(centerCoords, 'camping');
  searchPlaces(centerCoords, 'gas');
  searchPlaces(centerCoords, 'restaurant');

  // 5. Ajustar vista del mapa
  const bounds = new google.maps.LatLngBounds();
  bounds.extend({ lat: centerCoords.lat + 0.4, lng: centerCoords.lng + 0.4 });
  bounds.extend({ lat: centerCoords.lat - 0.4, lng: centerCoords.lng - 0.4 });
  setMapBounds(bounds);
};
```

**Características**:
- ✅ **Búsqueda multi-servicio**: Campings + gasolineras + restaurantes
- ✅ **Centrado automático**: Enfoca el mapa en la etapa seleccionada
- ✅ **Limpieza de estado**: Borra búsquedas anteriores antes de buscar

---

## 🔄 INTERNACIONALIZACIÓN

**Ubicación**: `hooks/useLanguage.ts`

```typescript
export function useLanguage() {
  const [language, setLang] = useState<'es' | 'en'>('es');
  const [settings, setSettings] = useState({ units: 'metric' as 'metric' | 'imperial' });

  const translations = {
    es: {
      'APP_TITLE': 'CaraCola Viajes',
      'FORM_ORIGIN': 'Origen',
      'FORM_DESTINATION': 'Destino',
      'FORM_DAILY_RHYTHM': 'Ritmo Diario Máximo (km/día)',
      'STATS_DAYS': 'días',
      'STATS_KM': 'km',
      // ... 100+ traducciones
    },
    en: {
      'APP_TITLE': 'CaraCola Trips',
      'FORM_ORIGIN': 'Origin',
      'FORM_DESTINATION': 'Destination',
      'FORM_DAILY_RHYTHM': 'Max Daily Rhythm (mi/day)',
      'STATS_DAYS': 'days',
      'STATS_KM': 'mi',
      // ...
    }
  };

  const t = (key: string) => translations[language][key] || key;

  const convert = (value: number, unit: 'km' | 'liter' | 'currency' | 'kph') => {
    if (settings.units === 'imperial') {
      if (unit === 'km') return value * 0.621371; // km → millas
      if (unit === 'liter') return value * 0.264172; // litros → galones
      if (unit === 'kph') return value * 0.621371; // km/h → mph
    }
    return value;
  };

  return { language, setLang, settings, t, convert };
}
```

**Características**:
- ✅ **Dos idiomas**: Español e Inglés
- ✅ **Conversión de unidades**: Métrico (km, litros) ↔ Imperial (millas, galones)
- ✅ **100+ traducciones**: Toda la UI está traducida

---

## 📊 RESUMEN TÉCNICO

| **Aspecto** | **Motor Malo (Producción Actual)** |
|-------------|-------------------------------------|
| **Arquitectura** | Dispersa, integrada en estructura principal |
| **Ruta** | `/` (Raíz del sitio) |
| **Motores de cálculo** | **DOS**: Client-side (`useTripCalculator`) + Server-side (`actions.ts`) |
| **Segmentación** | ✅ Avanzada con interpolación de polyline |
| **API Keys** | ⚠️ Mezcla pública y privada (fallback) |
| **Geocoding** | ✅ Robusto con reintentos y rate limit handling |
| **Persistencia** | ✅ Dual: LocalStorage + Supabase |
| **Búsqueda de servicios** | ✅ Con caché, score combinado y filtro de calidad |
| **UI** | ✅ Completa: Form, Mapa, Itinerario, 13 componentes |
| **Internacionalización** | ✅ Español/Inglés + Métrico/Imperial |
| **Funcionalidades avanzadas** | ✅ Ajuste de parada con recálculo, búsqueda cerca de etapa |

---

## ⚠️ PROBLEMAS IDENTIFICADOS

1. **Duplicación de motores**: `useTripCalculator` (client) y `actions.ts` (server) implementan lógica similar pero diferente
2. **Mezcla de API keys**: Usa pública como fallback, expone clave en navegador
3. **Arquitectura dispersa**: Difícil de mantener, componentes acoplados por props drilling
4. **Sin routing interno**: Todo en `/`, no hay rutas separadas para diferentes funcionalidades
5. **Post-segmentación reactiva**: Divide etapas después de calcular, no durante

---

## ✅ FORTALEZAS

1. **Geocoding robusto**: Manejo excepcional de rate limits y errores
2. **Caché inteligente**: Ahorra llamadas a Google Places API
3. **Score combinado**: Pondera distancia, rating y reviews para mejores resultados
4. **Filtro de calidad**: Elimina falsos positivos en búsquedas
5. **Persistencia dual**: LocalStorage + Supabase para resiliencia
6. **UI completa**: 13 componentes bien integrados
7. **Internacionalización**: Soporte real para español/inglés y unidades

---

## 🎯 CONCLUSIÓN

Este es el **motor malo** completo: una arquitectura funcional pero dispersa, con lógica duplicada entre cliente y servidor, pero con funcionalidades avanzadas y robustas que funcionan en producción.

**Estado actual**: ✅ Desplegado y funcionando correctamente en Vercel (commit 94299a1, Next.js 16.0.7).

**Recomendación**: Preservar las fortalezas (geocoding robusto, caché, filtros) al migrar al motor bueno. La arquitectura aislada del motor bueno facilitará el mantenimiento futuro.

---

*Documento generado el 9 de diciembre de 2025*
