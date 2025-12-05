# PROTOCOLO: Proyecto CARACOLA - Estado Actual y Arquitectura

**Fecha:** Diciembre 5, 2025 (Última actualización: 17:40 UTC)  
**Rama Activa:** `preview-1500` (desarrollo) / `testing` (documentación)  
**Estado:** 🚀 Arquitectura funcionando, ajuste manual de etapas OPERATIVO  

---

## 1. ¿QUÉ ES CARACOLA?

**CaraColaViajes** es una aplicación Next.js que calcula itinerarios de viajes por carretera.

### Flujo Principal:
1. Usuario ingresa: `origen` → `destino` + `waypoints obligatorios` (etapas)
2. App calcula: Ruta desde Google Directions API
3. App segmenta: Ruta en días (máx 300 km/día por defecto)
4. Usuario ajusta: Puede cambiar cualquier etapa intermedia
5. App recalcula: Ruta COMPLETA desde Google (nueva)

### APIs Utilizadas:
- **Google Maps:** Directions (ruta), Places (autocomplete), Geocoding (coords)
- **Open-Meteo:** Weather (sin API key)
- **Supabase:** Persistencia opcional (viajes guardados)

---

## 2. ARQUITECTURA ACTUAL (POST-FIX - DICIEMBRE 5)

### 🎯 Principio Fundamental
```
formData.etapas = Memoria persistente de waypoints obligatorios
updatedItinerary = Datos efímeros, regenerados cada ciclo
Paradas Tácticas = Output computado, NUNCA enviado a Google

CAMBIO CRÍTICO (Commit b99e333):
- NUNCA reemplazar waypoints
- SIEMPRE agregar nuevos waypoints a la lista existente
- Encadenamiento automático: Cada ajuste = formData.etapas se actualiza
```

### Flujo de Ajuste Actual (VALIDADO EN VERCEL):

```
ESTADO INICIAL:
  origen: Salamanca, España
  etapas: "Valencia, España"
  destino: Oporto, Portugal
  
Itinerario: 
  Día 1: Salamanca → (parada táctica Tarancón) → Valencia
  Día 2: Valencia → Oporto

USUARIO AJUSTA: Tarancón → Madrid

✅ NUEVO COMPORTAMIENTO (Commit b99e333):
  1. Extraer waypoints de formData.etapas → ["Valencia, España"]
  2. AGREGAR newDestination (Madrid) → ["Valencia, España", "Madrid"]
  3. Enviar a Google: Origin=Salamanca, WP=[Valencia, Madrid], Dest=Oporto
  4. Google retorna ruta optimizada:
     - Día 1: Salamanca → Valencia
     - Día 2: Valencia → Madrid
     - Día 3: Madrid → Oporto
  5. Actualizar formData.etapas = "Valencia, Espana|Madrid"

VENTAJA: Encadenamiento automático
  - Próximo ajuste tendrá formData.etapas = "Valencia, Espana|Madrid"
  - Si usuario ajusta de nuevo, ambas paradas se mantienen + nueva se agrega
  
⚠️ PROBLEMA ACTUAL (A RESOLVER):
  - Madrid aparece DESPUÉS de Valencia (no antes)
  - Google optimiza: Salamanca → Valencia → Madrid → Oporto
  - Pero conceptualmente: Madrid debería reemplazar Tarancón (parada táctica anterior)
  - Solución pendiente: Saber el ÍNDICE correcto de inserción en formData.etapas
```

### Estructura de Datos Crítica:

```typescript
// formData (origen del usuario, persistente)
{
  origen: "Salamanca, España",           // String
  destino: "Oporto, Portugal",           // String
  etapas: "Valencia|Madrid|Braga",       // String separado por | (solo waypoints reales)
  fechaInicio: "2025-12-10",             // String ISO
  kmMaximoDia: 300,                      // Number
  // ... otros campos
}

// DailyPlan (salida de Google, efímero)
{
  date: "2025-12-10",                    // String ISO
  day: 1,                                // Number
  from: "Salamanca",                     // String
  to: "Madrid",                          // String (puede ser parada táctica o destino real)
  distance: 450,                         // Number km
  isDriving: true,                       // Boolean
  isoDate: "2025-12-10T00:00:00Z",       // ISO date (requerido)
  type: 'overnight',                     // 'overnight' | 'tactical' | 'start' | 'end'
  coordinates?: { lat: number, lng: number },      // Para marcadores
  startCoordinates?: { lat: number, lng: number }, // Para clima
}
```

---

## 3. ESTADO DEL CÓDIGO (Commits Recientes)

### ✅ IMPLEMENTADO (Commit b99e333 - ACTUAL)
- `app/page.tsx` — `handleConfirmAdjust()` refactorizado (2a versión)
  - Extrae waypoints de `formData.etapas` (no de itinerario)
  - **AGREGA siempre** (nunca reemplaza) → `[...waypointsFromForm, newDestination]`
  - Envía SOLO waypoints obligatorios a Google
  - Regenera itinerario COMPLETO
  - **ACTUALIZA `formData.etapas` después de recalcular**
  - Logs detallados de cada paso

- `app/actions.ts` — Normalización mejorada + Types arreglados
  - Extrae ciudad+país ANTES de remover acentos
  - `"Salamanca, España"` → `"Salamanca, Espana"` ✅
  - Agregados campos `isoDate` y `type` a DailyPlan (requeridos en types.ts)
  - Commit e8d8dda + b99e333

- `app/types.ts` — DailyPlan interface actualizada
  - `isoDate: string` (requerido)
  - `type: 'overnight' | 'tactical' | 'start' | 'end'` (requerido)
  - Status: ✅ Sincronizado

### ✅ VALIDADO EN VERCEL (Test Case Real)
```
Test: Salamanca → Valencia + Oporto, ajustar Tarancón → Madrid

Resultado:
  ✅ formData.etapas inicial: ["Valencia, España"]
  ✅ Waypoints después ajuste: ["Valencia, España", "Madrid"]
  ✅ Google recibe ambos waypoints
  ✅ Itinerario regenerado: 3 días
  ✅ formData.etapas actualizado: ["Valencia, Espana", "Madrid"]
  ✅ Encadenamiento preparado para próximos ajustes
  ✅ Compile error: ARREGLADO (tipos de DailyPlan)
  ✅ ZERO_RESULTS: NO OCURRIÓ
  
URL usada: https://cara-cola-viajes-git-preview-1500-caracola.vercel.app/
Logs completos en: Console Debug Panel
```

---

## 4. PROBLEMAS IDENTIFICADOS Y ESTADO

### 🐛 Bug Resueltos (Diciembre 5)

1. **Pérdida de Valencia al ajustar Tarancón → Madrid**
   - Causa: Reemplazaba el waypoint en lugar de agregarlo
   - Fix: Cambiar lógica a SIEMPRE agregar (Commit b99e333)
   - Status: ✅ RESUELTO

2. **TypeScript Compilation Error**
   - Causa: DailyPlan en actions.ts no tenía campos `isoDate` y `type`
   - Fix: Agregar campos requeridos en interface + en objetos creados
   - Commits: e8d8dda
   - Status: ✅ RESUELTO

3. **ZERO_RESULTS en Google API**
   - Causa: Enviar paradas tácticas (Tarancón) en lugar de waypoints reales
   - Fix: Extraer SOLO de formData.etapas
   - Status: ✅ RESUELTO en sesión anterior

4. **181-day bug**
   - Causa: Pasar `fechaRegreso` en recálculos intermedios
   - Fix: Quitar `fechaRegreso` de llamadas intermedias
   - Status: ✅ RESUELTO en sesión anterior

### ⚠️ Problemas Pendientes (Priority: ALTA)

1. **Orden de waypoints incorrecto**
   - Descripción: Madrid se agrega DESPUÉS de Valencia, resultando en:
     `Salamanca → Valencia → Madrid → Oporto`
   - Esperado: `Salamanca → Madrid → Valencia → Oporto` (Madrid reemplaza Tarancón)
   - Causa: Agregar siempre al final vs insertar en índice correcto
   - Impacto: Afecta solo el ordenamiento; viaje es válido pero no óptimo
   - Solución: Determinar el ÍNDICE correcto en formData.etapas donde insertar
   - Estimado: 30-45 min implementación

---

## 5. ARCHIVOS CLAVE

| Archivo | Propósito | Estado | Última actualización |
|---------|-----------|--------|----------------------|
| `app/page.tsx` | Component principal, handleConfirmAdjust | ✅ Commit b99e333 | 2025-12-05 17:40 |
| `app/actions.ts` | Server action, Google API calls | ✅ Commit e8d8dda | 2025-12-05 17:18 |
| `app/types.ts` | TypeScript interfaces | ✅ Sincronizado | 2025-12-05 17:00 |
| `app/hooks/useTripCalculator.ts` | Cálculo inicial de ruta | ✅ Normalización OK | 2025-12-05 15:30 |
| `app/components/TripForm.tsx` | Input de origen/destino/waypoints | ✅ Dropdown + onChange | 2025-12-05 15:30 |
| `app/components/AdjustStageModal.tsx` | Modal para ajustar etapa | ✅ Llama handleConfirmAdjust | 2025-12-05 17:40 |
| `app/components/ItineraryPanel.tsx` | Muestra itinerario en sidebar | ✅ Lee updatedItinerary | 2025-12-05 17:40 |

---

## 6. FLUJO DE TESTING EN VERCEL

**Constrainte:** "Nunca dev server local, siempre pushea a Vercel"

**Rama `preview-1500`:**
- URL: `https://cara-cola-viajes-git-preview-1500-caracola.vercel.app/`
- Deploy automático al hacer push
- Estado: 🟢 OPERATIVO
- Último commit: b99e333 (17:40 UTC)

**Rama `testing`:**
- URL: `https://cara-cola-viajes.vercel.app/` (documentación)
- Estado: 🟢 ESTABLE
- Último update: PROTOCOLO actualizado

---

## 7. CHECKLIST PARA PRÓXIMO CHAT

Cuando reanudes el chat:

- [x] ¿Vercel desplegó commits correctamente?
- [x] ¿El test case funciona: Salamanca → Valencia → Oporto + Ajuste Tarancón→Madrid?
- [x] ¿Se actualiza `formData.etapas` después de cada ajuste?
- [ ] ¿Se pueden hacer ajustes encadenados (múltiples ajustes seguidos)? — Pendiente testear
- [x] ¿Los waypoints se mantienen (no desaparecen)?
- [x] ¿Google recibe todos los waypoints?
- [ ] ¿El orden de waypoints es el esperado? — **PROBLEMA CONOCIDO**
- [ ] ¿Los km/día se respetan?

---

## 8. PRÓXIMOS PASOS (Priority Order)

### INMEDIATO (Próximo chat)
1. **Resolver orden de waypoints** (30-45 min)
   - Problema: Madrid va después de Valencia (debería reemplazar Tarancón)
   - Solución: Calcular índice correcto de inserción
   - Test: Salamanca → Madrid → Valencia → Oporto

2. **Testear encadenamiento múltiple** (15-20 min)
   - Hacer 2-3 ajustes seguidos
   - Validar que todos se mantienen en formData.etapas
   - Validar que Google recibe lista completa

### SECONDARY (Si hay tiempo)
3. **Map redraw después de recalcular** (10-15 min)
   - Validar que marcadores se actualizan
   - Validar que línea de ruta se redibuija

4. **Verificar cálculo de fechas** (10-15 min)
   - ¿Cada día suma correctamente?
   - ¿Las fechas se incrementan bien?

### TERTIARY (Próximas sesiones)
5. Optimizaciones de UX
6. Migración de Google Autocomplete (deprecation warnings)
7. Performance para rutas muy largas

---

## 9. CONCLUSIÓN

El proyecto CARACOLA está en **estado funcional de arquitectura**. El cambio crítico de hoy fue reconocer que NUNCA debemos reemplazar waypoints, sino siempre agregarlos. Esto permite encadenamiento automático de ajustes.

**El único problema pendiente es el orden** de inserción en formData.etapas, que es un refinamiento de lógica, no un bug arquitectónico.

**Próximo chat:** Resolver orden + testear encadenamiento múltiple.

---

**Documento creado:** 2025-12-05 11:00 UTC  
**Última actualización:** 2025-12-05 17:40 UTC  
**Para:** Referencia rápida en próximo chat  
**Mantenedor:** Agente IA  

---

## 1. ¿QUÉ ES CARACOLA?

**CaraColaViajes** es una aplicación Next.js que calcula itinerarios de viajes por carretera.

### Flujo Principal:
1. Usuario ingresa: `origen` → `destino` + `waypoints obligatorios` (etapas)
2. App calcula: Ruta desde Google Directions API
3. App segmenta: Ruta en días (máx 300 km/día por defecto)
4. Usuario ajusta: Puede cambiar cualquier etapa intermedia
5. App recalcula: Ruta COMPLETA desde Google (nueva)

### APIs Utilizadas:
- **Google Maps:** Directions (ruta), Places (autocomplete), Geocoding (coords)
- **Open-Meteo:** Weather (sin API key)
- **Supabase:** Persistencia opcional (viajes guardados)

---

## 2. ARQUITECTURA ACTUAL (POST-FIX)

### 🎯 Principio Fundamental
```
formData.etapas = Memoria persistente de waypoints obligatorios
updatedItinerary = Datos efímeros, regenerados cada ciclo
Paradas Tácticas = Output computado, NUNCA enviado a Google
```

### Flujo de Ajuste Correcto:

```
ESTADO INICIAL:
  formData.etapas = "Valencia"
  Ruta: Salamanca → (parada táctica Tarancón) → Valencia → Oporto

USUARIO AJUSTA: Tarancón → Madrid
  ✅ CORRECTO (implementado):
    1. Extraer waypoints de formData.etapas → ["Valencia"]
    2. Reemplazar índice 0 → ["Madrid"]
    3. Enviar a Google: Origin=Salamanca, WP=[Madrid], Dest=Oporto
    4. Regenerar itinerario COMPLETO desde respuesta de Google
    5. Actualizar formData.etapas = "Madrid"
  
  ❌ INCORRECTO (problema anterior):
    1. Extraer waypoints de updatedItinerary (contiene Tarancón, parada táctica)
    2. Enviar a Google: Origin=Salamanca, WP=[Tarancón, Valencia], Dest=Oporto
    3. Google rechaza: "Tarancón" no es ubicación real / ubicaciones duplicadas
    4. Error ZERO_RESULTS
```

### Estructura de Datos Crítica:

```typescript
// formData (origen del usuario, persistente)
{
  origen: "Salamanca, España",           // String
  destino: "Oporto, Portugal",           // String
  etapas: "Valencia|Braga",              // String separado por |
  fechaInicio: "2025-12-10",             // String ISO
  kmMaximoDia: 300,                      // Number
  // ... otros campos
}

// DailyPlan (salida de Google, efímero)
{
  date: "2025-12-10",                    // String ISO
  day: 1,                                // Number
  from: "Salamanca",                     // String
  to: "Madrid",                          // String (puede ser parada táctica o destino real)
  distance: 450,                         // Number km
  isDriving: true,                       // Boolean
  coordinates?: { lat: number, lng: number },      // Para marcadores
  startCoordinates?: { lat: number, lng: number }, // Para clima
}
```

---

## 3. ESTADO DEL CÓDIGO (Commits Recientes)

### ✅ IMPLEMENTADO (Commit f6f62ae)
- `app/page.tsx` — `handleConfirmAdjust()` refactorizado
  - Extrae waypoints de `formData.etapas` (no de itinerario)
  - Reemplaza/agrega waypoint según índice
  - Envía SOLO waypoints obligatorios a Google
  - Regenera itinerario COMPLETO
  - **ACTUALIZA `formData.etapas` después de recalcular**

- `app/actions.ts` — Normalización mejorada
  - Extrae ciudad+país ANTES de remover acentos
  - `"Salamanca, España"` → `"Salamanca, Espana"` ✅
  - NO `"salamanca Espana"` ❌

- `app/hooks/useTripCalculator.ts` — Normalización consistente
  - Usa misma función que actions.ts

- `app/components/TripForm.tsx` — Input con dropdown
  - Permite escribir pero preserva selección del dropdown
  - `onChange` activo + `onPlaceChanged` para actualizar con país

### 🧪 PROBADO EN VERCEL
- Rama `preview-1500` deployada
- Test case: Salamanca → Valencia → Oporto (300 km/día)
  - Primera vez: ✅ 3 días
  - Ajuste: Tarancón → Madrid ✅ Itinerario regenerado

### 📊 DOCUMENTACIÓN CREADA
- `CHEMA/CHAT_SESSIONS/CHAT_SESION_20251205_AJUSTE_MANUAL_ETAPAS_COMPLETO.md`
  - Chat completo con análisis de fases
- `CHEMA/CHAT_SESSIONS/RESUMEN_EJECUTIVO_AJUSTE_MANUAL_ETAPAS.md`
  - Resumen ejecutivo, antes/después, testing guide

---

## 4. PROBLEMAS RESUELTOS

### 🐛 Bug: "181 Days" en recalculación
**Causa:** Enviar `fechaRegreso` (para volver a casa) en recálculo intermedio  
**Fix:** Quitar `fechaRegreso` de calls intermedios, usar solo duración por km/día  
**Línea:** `app/page.tsx` line ~282 → `fechaRegreso: ''`

### 🐛 Bug: ZERO_RESULTS en Google API
**Causa:** Enviar paradas tácticas (computed) en lugar de waypoints reales  
**Fix:** Extraer waypoints SOLO de `formData.etapas`, nunca de itinerario  
**Línea:** `app/page.tsx` lines ~249-252 (PASO 1: extraer de formData)

### 🐛 Bug: Pérdida de waypoints en ajustes encadenados
**Causa:** No actualizar `formData.etapas` después del primer ajuste  
**Fix:** Actualizar `formData.etapas` con waypoints finales después de cada recalc  
**Línea:** `app/page.tsx` lines ~310-318 (PASO 5: actualizar formData.etapas)

### 🐛 Bug: Acentos rompiendo búsquedas en Google
**Causa:** Normalización eliminando commas → `"Salamanca, España"` → `"salamanca Espana"`  
**Fix:** Extraer `ciudad, país` ANTES de remover acentos  
**Línea:** `app/actions.ts` → `normalizeForGoogle()` function

---

## 5. ARCHIVOS CLAVE

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `app/page.tsx` | Component principal, lógica de recálculo | ✅ Refactorizado |
| `app/actions.ts` | Server action, Google API calls | ✅ Normalización arreglada |
| `app/types.ts` | TypeScript interfaces (DailyPlan, etc) | ✅ Actualizado |
| `app/hooks/useTripCalculator.ts` | Cálculo inicial de ruta | ✅ Normalización sincronizada |
| `app/hooks/useTripPersistence.ts` | Persistencia localStorage | ✅ Usa formData.etapas |
| `app/components/TripForm.tsx` | Input de origen/destino/waypoints | ✅ Dropdown + onChange |
| `app/components/TripMap.tsx` | Mapa con marcadores | ✅ Lee coordinates de itinerario |
| `app/components/AdjustStageModal.tsx` | Modal para ajustar etapa | ✅ Llama handleConfirmAdjust |
| `app/components/ItineraryPanel.tsx` | Muestra itinerario en sidebar | ✅ Lee updatedItinerary |

---

## 6. VARIABLES DE ENTORNO

```bash
# REQUERIDAS (servidor)
GOOGLE_MAPS_API_KEY_FIXED=<key-con-todas-apis>

# RECOMENDADAS (cliente, fallback)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key-publica>

# OPCIONALES (Supabase)
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
```

**Script para verificar:** `npm run check-env`  
**Archivo:** `scripts/check-env.js`

---

## 7. COMANDOS PRINCIPALES

```bash
# Desarrollo local
npm run dev                    # Next.js dev server (localhost:3000)

# Build/Production
npm run build                  # Compilar para prod
npm run start                  # Servir prod (requiere npm run build)

# Linting
npm run lint                   # ESLint check
npm run lint -- --fix          # ESLint fix automático

# Control de dependencias
npm install                    # Instalar deps
npm audit                      # Verificar vulnerabilidades
```

---

## 8. FLUJO DE TESTING EN VERCEL

**Constrainte:** "Nunca dev server local, siempre pushea a Vercel"

**Rama `preview-1500`:**
- URL: `https://cara-cola-viajes-pruebas.vercel.app/`
- Deploy automático al hacer push
- Ambiente de testing, puede estar "roto"

**Rama `testing`:**
- URL: `https://cara-cola-viajes.vercel.app/`
- Documentación y análisis
- Rama de referencia

**Rama `preview-stable`:**
- URL: Stable deployment
- Versión confiable antes de empezar a debuggear

---

## 9. PATRÓN PARA CAMBIOS

Cuando modifiques el flujo de recalculación:

1. **Identifica el tipo de cambio:**
   - ¿Es en `formData.etapas`? → Modifica en `page.tsx` líneas ~310-318
   - ¿Es en Google API call? → Modifica en `page.tsx` líneas ~280-295 + `actions.ts`
   - ¿Es en normalización? → Modifica en `actions.ts` + `useTripCalculator.ts`

2. **Mantén la invariante:**
   ```
   formData.etapas = solo waypoints REALES (nunca paradas tácticas)
   Google input = normalized(formData.etapas)
   itinerary output = regenerado COMPLETO desde Google
   ```

3. **Agrega logs:**
   - Antes: `console.log('📦 Waypoints:', waypoints)`
   - Después: `console.log('✅ Itinerario nuevo:', finalItinerary.length, 'días')`

4. **Pushea a preview-1500:**
   ```bash
   git add -A
   git commit -m "feat(descrip): Mensaje claro"
   git push origin preview-1500
   ```

5. **Testa en Vercel, NO local**

---

## 10. ISSUES CONOCIDOS (Future Work)

1. **Map redraw:** A veces no se redibujan los marcadores después de recalcular
   - Solución: Posible listener en `directionsResponse` cambio
   - Archivo: `app/components/TripMap.tsx`

2. **Missing dates:** Algunos días no muestran fecha en el panel
   - Causa posible: `date` field no inicializado en todos los casos
   - Archivo: `app/actions.ts` → `dailyItinerary` generation

3. **Google Autocomplete warnings:** Deprecation notices en console
   - No-breaking, deprecated API still works
   - Future: Migrar a Places API v2 (not urgent)

4. **Performance:** Recalcular ruta COMPLETA puede ser lento para rutas muy largas
   - Considerar: Caché, recálculo parcial (future optimization)

---

## 11. CHECKLIST PARA PRÓXIMO CHAT

Cuando reanudes el chat, verifica:

- [ ] ¿Vercel desplegó `f6f62ae` en `preview-1500`?
- [ ] ¿El test case funciona: Salamanca → Valencia → Oporto → Ajuste?
- [ ] ¿Se actualiza `formData.etapas` después de cada ajuste?
- [ ] ¿Se pueden hacer ajustes encadenados (múltiples ajustes seguidos)?
- [ ] ¿Los 300 km/día se respetan?
- [ ] ¿Las fechas se calculan correctamente?

Si todo ✅ pasar a "Phase 2: Edge Cases & Optimization"

---

## 12. CONCLUSIÓN

El proyecto CARACOLA está en **estado de arquitectura correcta validada**. El cambio crítico fue reconocer que `formData.etapas` debe ser la única fuente de verdad para waypoints obligatorios, y cada ajuste debe regenerar la ruta COMPLETA desde Google.

**Próximo paso:** Testing exhaustivo en Vercel, luego optimizaciones de UX/performance.

---

**Documento creado:** 2025-12-05 23:45 UTC  
**Para:** Referencia rápida en próximo chat  
**Mantenedor:** Agente IA
