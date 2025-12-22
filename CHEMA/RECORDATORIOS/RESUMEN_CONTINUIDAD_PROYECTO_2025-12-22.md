# Resumen de continuidad — CaraColaViajes (2025-12-22)

Este documento existe para **recuperar el contexto** si se pierde el historial del chat o se reinstala VS Code.

## 1) Objetivo del producto ("CaraCola Viajes")

- App web (Next.js App Router + TypeScript strict) para **planificar rutas camper/autocaravana**.
- El usuario introduce:
  - origen/destino, fechas inicio/fin
  - parámetros de coste (precio gasoil, consumo)
  - preferencia de peajes y vuelta a casa
  - opcional: waypoints (etapas)
- La app calcula:
  - itinerario por días (`dailyItinerary`)
  - distancia/coste total
  - mapa con ruta y marcadores
  - servicios cerca (campings/gasolineras/restaurantes/agua/etc) por día

## 2) Principio clave: “Mutación / Control absoluto de costes”

**Regla:** El navegador **NO** debe llamar directamente a APIs pagadas de Google (Directions/Geocoding/Elevation/Places). Solo puede cargar el **Maps JS SDK** para render.

- Cliente:
  - Solo render y UI (Google Maps JS SDK).
- Servidor:
  - Llamadas a APIs pagadas mediante **server actions** y **route handlers** (`/api/google/*`).
  - Logging + caché + rate-limit + trazabilidad.

## 3) Reglas del “modo prueba” (trial) vs login

### Trial (sin login)
- Límite **máx 10 días** de duración.
- Límite **máx 2 waypoints**.
- Límite **máx 2 supercat/día** por `clientId` en `/api/places-supercat`.
- UX: funcionalidades avanzadas visibles pero **inertes** (no-op) y muestran aviso.
  - PDF
  - buscar servicios
  - ajustar parada
  - búsqueda en mapa
  - guardar/compartir/borrar/limpiar caché/auditar

### Login (Supabase Auth)
- Desbloquea límites del trial (bypass).
- Registro mejorado con **username** guardado en `user_metadata`.
- Saludo por username (fallback a email/id).

## 4) Identidad estable del usuario anónimo (clientId)

- `clientId` persistente en `localStorage` (clave: `caracola_client_id_v1`).
- Se envía al servidor en header `x-caracola-client-id`.
- Sirve para:
  - trazabilidad en logs
  - límite diario de trial en `places-supercat`

## 5) Dónde está la lógica importante (archivos clave)

### Core
- `app/actions.ts`
  - Server action `getDirectionsAndCost`.
  - Segmentación de ruta/días y shape de `DailyPlan`.
  - Enforced trial server-side (10 días / 2 waypoints) si no logueado.
  - Trazabilidad: `clientId` + `user_id` en logs.

### API routes
- `app/api/google/*` — proxy/control de llamadas Google (paid APIs).
- `app/api/places-supercat/route.ts`
  - Trial daily cap: 2/día por `clientId` si no logueado.
  - Detección de login por `Authorization: Bearer <token>`.

### Auth
- `app/components/UserArea.tsx`
  - Login/registro Supabase.
  - Registro incluye `username` en `user_metadata`.

### UI principal
- `app/page.tsx`
  - Página principal; monta el motor y pasa `trialMode = !auth.isLoggedIn`.
- Componentes (inventario actual en `app/components/`):
  - `TripForm.tsx` — formulario de origen/destino/fechas/waypoints
  - `TripMap.tsx` — mapa, markers, búsqueda local (disabled en trial)
  - `ItineraryPanel.tsx` — panel de días, PDF, buscar servicios, ajustar parada
  - `TripActionButtons.tsx` — guardar/compartir/borrar/auditar/limpiar caché
  - `ToastContainer.tsx` — sistema de toasts
  - `AdjustStageModal.tsx` — ajustar destino de una etapa (pendiente de gating trial)

### Hooks (inventario actual en `app/hooks/`)
- `useTripPersistence.ts` — persistencia local del viaje + auth token expuesto
- `useTripCompute.ts` — calcula ruta (server action) y maneja toasts
- `useTripPlaces.ts` — servicios por día (calls a `/api/places-supercat`, con bearer si logueado)
- `useStageNavigation.ts` — geocode táctico (pendiente de gating trial)
- `useStageAdjust.ts` — ajustar etapa y recalcular
- `useElevation.ts` — directions/elevation (decidir gating trial)
- `useToast.ts` — cola de toasts
- `useWeather.ts` — Open-Meteo

## 6) Estado del trabajo (lo hecho)

### Enforcements server-side (hecho)
- Trial:
  - directions: max 2 waypoints, max 10 días (si no logueado)
  - places-supercat: max 2/día por `clientId` (si no logueado)
- Auth:
  - Bearer token enviado desde UI a endpoints relevantes
  - username en registro + saludo

### UI gating (hecho)
- Botones visibles pero no-op en trial en:
  - `ItineraryPanel.tsx`
  - `TripMap.tsx`
  - `TripActionButtons.tsx`
  - `TripForm.tsx`

### Mensajes visibles (hecho)
- Se implementó un **aviso centrado** para acciones bloqueadas:
  - `app/components/CenteredNoticeProvider.tsx`
  - `app/utils/centered-notice.ts`
  - `app/layout.tsx` envuelve la app con el provider.
- Además, el **ToastContainer** se movió a **centrado** (antes estaba arriba-derecha):
  - `app/components/ToastContainer.tsx`

### QA automatizada (hecho)
- `scripts/test-mutation-map.js` (Puppeteer)
  - Abre la app, rellena formulario, calcula ruta.
  - Falla si el navegador llama directamente endpoints de Google pagados.
  - PASS en localhost.

## 7) Pendiente / siguiente bloque (prioridad)

Objetivo: **cerrar todos los puntos restantes** donde el UI pueda disparar `/api/google/*` en trial (gasto extra), especialmente geocoding.

Pendientes detectados:
- `app/components/AdjustStageModal.tsx`
  - llama `/api/google/geocode-address` → falta pasar `trialMode` y bloquear.
- `app/hooks/useStageNavigation.ts`
  - geocode táctico `/api/google/geocode-address` cuando faltan coords → bloquear o evitar en trial.
- `app/hooks/useElevation.ts`
  - decide si se permite o bloquea en trial (probable bloquear por coste).
- `app/share/[id]/page.tsx`
  - usa `/api/google/directions` → revisar si debe estar restringido por login/trial.

## 8) Cómo correr local

- `npm install`
- `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`

## 9) Variables de entorno relevantes

- `GOOGLE_MAPS_API_KEY_FIXED` (server-side preferida)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (fallback cliente, menos seguro)
- Supabase (si aplica): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 10) Notas de git / checkpoints

- Rama de trabajo usada: `testing`.
- Se hicieron checkpoints frecuentes con commit+push a `origin/testing`.

---

### Qué pegar en un chat si se pierde el historial

- “Estamos implementando **control absoluto**: Google paid APIs solo server-side.
- Hay **modo prueba** sin login (10 días, 2 waypoints, 2 supercat/día por clientId).
- UI trial: botones visibles pero bloqueados.
- Falta cerrar gating en: `AdjustStageModal`, `useStageNavigation`, `useElevation`, share.
- Hay test Puppeteer `scripts/test-mutation-map.js` que asegura no llamadas directas desde navegador.”
