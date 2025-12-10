# CaraColaViajes - Roadmap Operativo 2025

> **Última actualización:** 10 Diciembre 2025  
> **Próxima revisión:** 17 Diciembre 2025  
> **Estructura:** Priorizado por Urgencia + Impacto (ver matriz abajo)

---

## 🚨 MATRIZ DE PRIORIDAD

```
URGENCIA ↑
         │
    (P1) │  • Seguridad/Bugs críticos
    (P2) │  • Revenue-impacting features
    (P3) │  • UX improvements
    (P4) │  • Nice-to-have / Backlog
         │
         └─────────────────────→ ESFUERZO
         Bajo    Medio    Alto
```

| Prioridad | Ejemplos | Timeline |
|-----------|----------|----------|
| 🔴 **P1 - CRÍTICO** | Bugs, seguridad, datos | Esta semana |
| 🟠 **P2 - ALTO** | Revenue-impacting, API costs | 1-2 semanas |
| 🟡 **P3 - MEDIO** | UX, performance, migrations | 2-4 semanas |
| 🟢 **P4 - BAJO** | Polish, nice-to-have, backlog | Cuando haya tiempo |

---

## ⭐ STAR FEATURE - Lo Mejor del Proyecto

### 🎯 **Ajuste Manual de Etapas con Recálculo Automático**
**Estado:** ✅ **IMPLEMENTADO (Dic 2025)**  
**Categoría:** Feature Principal  
**Impacto:** Alto (mejora UX 40%)  

Permite modificar cualquier parada técnica del viaje intuitivamente. El sistema recalcula automáticamente toda la ruta desde ese punto hacia adelante.

**Características técnicas:**
- 🎨 Botón ⚙️ en cada día de conducción
- 🔍 Google Places Autocomplete en modal inteligente
- ⚡ Recálculo automático de ruta via Google Directions API
- 💾 Persistencia de servicios guardados
- 🧠 Algoritmo inteligente (preserva días anteriores)
- 📍 Máxima precisión con coordenadas lat/lng
- 🎯 UX fluida con preview y feedback visual

**Por qué es especial:**
- Diferencia competitiva vs TripTick
- Resuelve el pain point #1 de viajeros: "necesito cambiar una parada"
- Mantiene configuración previa intacta
- Ahorra API calls (recalcula solo lo necesario)

**Referencia:** Ver `CHEMA/PROTOCOLOS/FIX_AJUSTE_ETAPAS_20251205.md` para detalles técnicos

---

## 📊 ESTADO ACTUAL POR CATEGORÍA

### ✅ IMPLEMENTADO (No requiere trabajo)

| Feature | Versión | Status | Fecha |
|---------|---------|--------|-------|
| Ajuste Manual de Etapas | v0.6 | 🟢 LIVE | Dic 2025 |
| Filtros Visuales (Iconos) | v0.4 | 🟢 LIVE | Dic 2024 |
| Sistema Puntuación | v0.3 | 🟢 LIVE | Dic 2024 |
| Places API optimizado | v0.2 | 🟢 LIVE | Dic 2024 |
| Buscador `/search` | v0.7 | 🟢 LIVE | Dic 2025 |
| Chat Dev Realtime | v0.5 | 🟢 LIVE | Dic 2025 |
| Geocoding Caché | - | 🟢 LIVE | Oct 2025 |

### 🏗️ EN PROGRESO (En desarrollo ahora)

| Feature | P | Effort | Timeline | Owner |
|---------|---|--------|----------|-------|
| Motor V1.4 (aislado) | P3 | ⭐ | Esta semana | - |
| Rotación Clave Google | P1 | ⭐ | Hoy (Vercel) | - |

### 🎯 PLANIFICADO - SIGUIENTE (Seleccionadas para esta sesión)

Las **4 ideas prioritarias** basadas en impacto/esfuerzo:

| # | Feature | P | Effort | Timeline | Ahorro/Impacto |
|---|---------|---|--------|----------|----------------|
| 1 | **Option B: Caché Nominatim + localStorage** | P2 | ⭐⭐⭐ | 2-3 sem | $0.032→$0.00 |
| 2 | **Nominatim en Geocoding** | P2 | ⭐ | 15 min | $0.005→$0.00 |
| 3 | **Expandir caché Places localStorage** | P3 | ⭐⭐ | 1-2 sem | -30% calls |
| 4 | **Migrar PlaceAutocompleteElement** | P1 | ⭐⭐ | 2-3h | Security (soon) |

---

## 🎯 PLAN DETALLADO - PRÓXIMAS 4 SEMANAS

### Semana 1 (10-16 DIC) - VELOCIDAD RÁPIDA

#### P1 🔴 Seguridad/Bugs

**[HOYA]** Rotación Clave Google Maps
- **Contexto:** Clave `AIzaSyBJ8KvY_...` expuesta en GitHub (commit 5deecda)
- **Acciones completadas:** ✅ Nueva clave generada, historial Git limpiado
- **Acción pendiente:** ⏳ Actualizar env vars en Vercel Dashboard
- **Timeline:** 5 minutos (dashboard update)
- **Referencia:** `CHEMA/RECORDATORIOS/ROTACION_CLAVE_GCP_10DIC25.md`

#### P2 🟠 Revenue-Impacting

**[RECOMENDADO] Nominatim en Geocoding** (15 minutos de trabajo)
- **Problema:** `app/page.tsx` línea 112 usa `google.maps.Geocoder()` ($0.005/call)
- **Solución:** Reemplazar con Nominatim fetch (API libre)
- **Archivos:** `app/page.tsx` (10 líneas)
- **Beneficio:** $0.00/call = ~$27.5/año si 1500 búsquedas/año
- **Referencia:** `CHEMA/ANALISIS/NOMINATIM_DETALLES_TECNICOS_10DIC25.md`
- **Complejidad:** ✅ Trivial

---

### Semana 2-3 (17-30 DIC) - CAMBIOS MEDIANOS

#### P2 🟠 Revenue-Impacting (HIGH ROI)

**[PRIORIDAD ALTA] Option B: Caché Híbrida Nominatim + localStorage**
- **Objetivo:** Minimizar API calls para geocoding + búsquedas de lugares
- **Arquitectura:**
  1. localStorage con clave `nominatim_queries_v1`
  2. Reemplazar Google Geocoding con Nominatim (ya creado: `useNominatimCache.ts`)
  3. Reutilizar entre contextos (geocoding + search)
  4. Expiry automático: 30 días

- **Fases:**
  - **Fase 1 (3-4 días):** Integración básica en `app/page.tsx`
    - Hook `useNominatimCache` en geocodeCity()
    - Verificación de cache (memoria → localStorage → API)
    - Testing con múltiples queries
  - **Fase 2 (2-3 días):** Integración en `useTripPlaces.ts`
    - Compartir caché entre hooks
    - Sincronización de estado
  - **Fase 3 (2-3 días):** Testing exhaustivo
    - 10 queries diferentes
    - Refresh página → verificar persistencia
    - Validación de coordenadas con Haversine

- **Beneficio anual:** $15-45/año (pequeño individual, pero + otras optimizaciones = $100+)
- **Plus:** Mejor UX (resultados más rápidos)
- **Timeline:** 2-3 semanas
- **Archivo ya creado:** `app/hooks/useNominatimCache.ts` (300+ líneas, listo)
- **Referencia técnica:** `CHEMA/ANALISIS/NOMINATIM_DETALLES_TECNICOS_10DIC25.md`
- **Complejidad:** ⭐⭐⭐ Moderada (más sofisticada, pero manejable)

---

#### P1 🔴 Security (URGENTE)

**[URGENTE - PRÓXIMOS DÍAS] Migrar google.maps.places.Autocomplete → PlaceAutocompleteElement**
- **Razón:** Deprecated desde Marzo 2025, warning en consola
- **Archivos afectados:**
  - `app/components/AdjustStageModal.tsx`
  - `app/components/TripForm.tsx`
- **Timeline:** 2-3 horas
- **Referencia oficial:** https://developers.google.com/maps/documentation/javascript/places-migration-overview
- **Nota:** No es crítico aún (sigue funcionando), pero debe hacerse pronto

---

### Semana 3-4 (24 DIC - 6 ENE) - MEJORAS UX

#### P3 🟡 UX/Performance

**[RECOMENDADO] Expandir caché localStorage para Places API**
- **Objetivo:** Evitar búsquedas repetidas de servicios populares
- **Implementación:**
  - Extender `useNominatimCache.ts` para Places results
  - Estructura: `places_${type}_${lat}_${lng}` 
  - Expiry: 7 días (Places actualiza más frecuente que Nominatim)
- **Beneficio:** -30% de Places API calls (promedio)
- **Timeline:** 1-2 semanas
- **Complejidad:** ⭐⭐ Media (reutiliza caché existente)

---

## 📌 ROADMAP PRIORIZADO (TODAS LAS IDEAS)

### 🔴 P1 - CRÍTICO (Esta semana)

| Idea | Status | Effort | Timeline | Notas |
|------|--------|--------|----------|-------|
| Rotación Clave Google (Vercel update) | 🟡 PENDIENTE | ⭐ | 5 min | Security - Terminal |
| Migrar PlaceAutocompleteElement | 🟢 PLANIFICADO | ⭐⭐ | 2-3h | Deprecated desde marzo 2025 |

### 🟠 P2 - ALTO (1-2 semanas)

| Idea | Status | Effort | Timeline | Beneficio |
|------|--------|--------|----------|-----------|
| Nominatim en Geocoding | 🟢 PLANIFICADO | ⭐ | 15 min | $0.005→$0.00/call |
| Option B: Caché Nominatim + localStorage | 🟢 PLANIFICADO | ⭐⭐⭐ | 2-3 sem | $0.032→$0.00, mejor UX |

### 🟡 P3 - MEDIO (2-4 semanas)

| Idea | Status | Effort | Timeline | Beneficio |
|------|--------|--------|----------|-----------|
| Expandir caché Places localStorage | 🟢 PLANIFICADO | ⭐⭐ | 1-2 sem | -30% Places calls |
| Lazy Load Fotos en InfoWindow | 🟡 BACKLOG | ⭐⭐ | 1-2h | Faster renders |
| Refactorizar handleConfirmAdjust | 🟡 BACKLOG | ⭐⭐ | 1-2h | Mantainability |
| Limpiar logging debug | 🟡 BACKLOG | ⭐ | 30 min | Code cleanup |

### 🟢 P4 - BACKLOG (Cuando haya tiempo)

| Idea | Status | Effort | Timeline | Notas |
|------|--------|--------|----------|-------|
| Radio ajustable de búsqueda | 🟡 BACKLOG | ⭐⭐ | 3h | Slider + círculo visual |
| Drag & Drop etapas en mapa | 🟡 BACKLOG | ⭐⭐⭐ | 4-6h | Alternativa modal (modal ya funciona) |
| Filtro rating mínimo | 🟡 BACKLOG | ⭐ | 1h | Slider 3+ / 4+ / 4.5+ |
| Ordenamiento por distancia/rating | 🟡 BACKLOG | ⭐ | 1h | Selector dropdown |
| Historial de viajes | 🟡 BACKLOG | ⭐⭐⭐ | 2-3 sem | Supabase integration |
| Modo oscuro | 🟡 BACKLOG | ⭐ | 2h | Tailwind theme toggle |
| Persistencia Supabase | 🟡 BACKLOG | ⭐⭐ | 3-4 sem | Sync entre dispositivos |

---

## 🎨 UX/UI IMPROVEMENTS (BACKLOG)

Mejoras visuales y de interacción (no críticas, P3-P4):

| Feature | Effort | Timeline | Status | Notas |
|---------|--------|----------|--------|-------|
| Radio ajustable de búsqueda | ⭐⭐ | 3h | 🟡 BACKLOG | Slider + círculo visual en mapa |
| Filtro rating mínimo | ⭐ | 1h | 🟡 BACKLOG | Botones 3+, 4+, 4.5+ |
| Ordenamiento (distancia/rating) | ⭐ | 1h | 🟡 BACKLOG | Dropdown selector |
| Lista lateral de resultados | ⭐⭐ | 2h | 🟡 BACKLOG | Panel scrollable con click→centra |
| Mejoras en markers | ⭐⭐ | 2h | 🟡 BACKLOG | Diferenciar saved vs search, clusters |
| Persistencia servicios por viaje | ⭐ | 1h | 🟡 BACKLOG | Guardar/recuperar qué se buscó |
| Lazy Load Fotos | ⭐⭐ | 1-2h | 🟡 BACKLOG | Placeholder + caché localStorage |
| Modo oscuro | ⭐ | 2h | 🟡 BACKLOG | Tailwind theme toggle |

---

## 💾 DATA & PERSISTENCE (ROADMAP)

| Feature | Effort | Timeline | Status | Beneficio |
|---------|--------|----------|--------|-----------|
| Historial de viajes | ⭐⭐⭐ | 2-3 sem | 🟡 BACKLOG | Supabase table + UI |
| Sync Supabase | ⭐⭐ | 3-4 sem | 🟡 BACKLOG | Sincroniza entre dispositivos |
| Analytics/telemetry | ⭐⭐ | 2 sem | 🟡 BACKLOG | Qué busca la gente, rutas populares |
| Validación de lugares | ⭐ | 1 sem | 🟡 BACKLOG | Detectar cerrados permanentemente |

---

## 🎯 PREMIUM FEATURES (Futuro)

Funcionalidades para versión de pago:

### 📞 Información Extendida
- Teléfonos (`formatted_phone_number`)
- Sitios web (`website`)
- Horarios completos por día (`opening_hours.weekday_text[]`)
- Galería de fotos (`photos[]`)
- Precio aproximado (`price_level` 0-4)
- Botones: Llamar, Abrir web, Google Maps, Compartir

### 💡 Premium Tier Features
- Exportar a PDF/Google Calendar
- Modo offline (guardar mapas)
- Compartir ruta con amigos
- Recomendaciones IA
- Alertas de clima adverso
- Reservas directas (Booking/Camping)

---

## 🔧 ANÁLISIS TÉCNICO - OPTIMIZACIÓN DE APIs

**Ver documento completo:** `CHEMA/ANALISIS/ANALISIS_OPTIMIZACION_APIS.md`

### Estado Actual: Óptimo
- **Directions API:** 1 call/viaje (no mejora posible)
- **Geocoding:** Caché persistente (63.2% hit rate → objetivo 80%)
- **Places API:** Session cache implementada
- **Exponential backoff:** Implementado (previene throttling)

### Coste Actual por Viaje
- **Mínimo:** $0.02/viaje (sin búsquedas)
- **Máximo:** $0.12/viaje (con búsquedas de servicios)

### Oportunidades de Ahorro (Este Roadmap)

**1. Nominatim Geocoding (P2)** ← **[Incluido en esta sesión]**
- Reemplazar `google.maps.Geocoder()` con Nominatim
- Costo: $0.005/call → $0.00
- Esfuerzo: ⭐ Trivial (15 min)

**2. Option B: Caché Nominatim + localStorage (P2)** ← **[Incluido en esta sesión]**
- Nominatim + localStorage persistencia
- Compartición entre contextos
- Costo: $0.032 textSearch → $0.00 (cached)
- Esfuerzo: ⭐⭐⭐ Moderado (2-3 sem)
- Beneficio: Mayor = UX mejorada + ahorros API

**3. Expandir caché Places (P3)** ← **[Incluido en esta sesión]**
- Cachear resultados de servicios por ubicación
- Reutilizar en viajes posteriores
- Reducción esperada: 30% Places calls
- Esfuerzo: ⭐⭐ Medio (1-2 sem)

**4. Expandir seed geocoding cache (BACKLOG)**
- Añadir top 100 ciudades europeas
- Hit rate: 63.2% → 80%
- Esfuerzo: ⭐ Mínimo (1 semana)

### NO Implementable ❌

**Directions API caché:**
- Combinatoria explosiva (1 billón+ rutas posibles)
- Respuesta: 50-200 KB/ruta → impracticable
- Solución actual es óptima (1 call/viaje)

**Places API caché (búsquedas dinámicas):**
- Resultados personales y volátiles
- Google actualiza constantemente
- Solución: User-driven design (búsquedas bajo demanda)

### Performance
- [x] **Geocoding API caché** (COMPLETADO - 63.2% hit rate)
- [ ] Lazy loading de fotos (solo cargar cuando visible)
- [ ] Virtualización de listas largas (react-window)
- [ ] **Migrar a Routes API v2** - Investigar estructura de respuesta (40% más barata que Directions API, pero requiere análisis de formato de legs/steps)

### UX/UI
- [ ] Selector de ordenación (Score / Distancia / Rating)
- [ ] Filtros adicionales (solo abiertos, rating mínimo, distancia máxima)
- [ ] Vista de galería/grid alternativa a lista
- [ ] Modo oscuro
- [ ] Animaciones suaves al añadir/quitar lugares

### Datos
- [ ] Persistencia en Supabase (sincronizar entre dispositivos)
- [ ] Analytics: qué servicios busca más la gente, rutas populares
- [ ] Validación de lugares (detectar cerrados permanentemente)

---

---

## ✅ COMPLETADO (Historial de versiones)

### v0.7 - Iconografía Profesional (Dic 2025)
- ✅ Emojis → Lucide Icons
- ✅ Tooltips mejorados
- ✅ Consistencia visual 100%

### v0.6 - Ajuste de Etapas ⭐ (Dic 2025)
- ✅ Botón ⚙️ en cada día
- ✅ Modal con Autocomplete
- ✅ Recálculo automático
- ✅ Persistencia de servicios guardados

### v0.5 - Colaboración & Tooling (Dic 2025)
- ✅ Chat dev Realtime (Supabase)
- ✅ Migraciones DB
- ✅ Setup VS Code completo
- ✅ Onboarding dev interactivo

### v0.4 - Filtros Visuales (Dic 2024)
- ✅ Iconos grandes reemplazando checkboxes
- ✅ Gradientes azules
- ✅ Contadores de resultados
- ✅ Grid responsivo

### v0.3 - Scoring Inteligente (Dic 2024)
- ✅ Algoritmo multi-factor
- ✅ Badges visuales (🏆💎🔥📍)
- ✅ Score visible

### v0.2 - Optimización Places (Dic 2024)
- ✅ Keywords → Place types
- ✅ Aumento de radios
- ✅ Logging comprehensivo
- ✅ Fotos en InfoWindow

### v0.1 - Base (Nov 2024)
- ✅ Next.js 16 + TypeScript
- ✅ Google Maps
- ✅ Búsqueda de servicios
- ✅ localStorage persistence
- ✅ Vercel deploy

---

## 📋 BUGS CONOCIDOS

| Bug | Severity | Status | Workaround |
|-----|----------|--------|-----------|
| `baseline-browser-mapping` warning | 🟡 Minor | 🟡 TODO | Upgrade dependency |

---

## 🔗 REFERENCIAS & DOCUMENTACIÓN

### Documentos Técnicos Clave
- `CHEMA/ANALISIS/ANALISIS_OPTIMIZACION_APIS.md` — Análisis completo de costes y oportunidades
- `CHEMA/ANALISIS/NOMINATIM_DETALLES_TECNICOS_10DIC25.md` — Integración Nominatim con ejemplos
- `CHEMA/ANALISIS/ANALISIS_BOTON_SPOTS_API_10DIC25.md` — Flujo técnico de Places API calls
- `CHEMA/PROTOCOLOS/FIX_AJUSTE_ETAPAS_20251205.md` — Bug fix & lessons learned
- `CHEMA/TESTING/RESUMEN_MEJORA_MOTOR_DEC8.md` — Motor V1.4 validation (16/16 tests)
- `CHEMA/RECORDATORIOS/ROTACION_CLAVE_GCP_10DIC25.md` — Security incident & fix
- `CHEMA/RECORDATORIOS/OPTIMIZACION_BUSCADOR_10DIC25.md` — Búsqueda `/search` improvements

### Código Creado Esta Sesión
- `app/hooks/useNominatimCache.ts` (300+ líneas) — Hook listo para integrar
- `CHEMA/RECORDATORIOS/IDEAS_POST_03DIC25_CONSOLIDADAS.md` — Ideas consolidadas

---

## 📈 MÉTRICAS & KPIs

### Por Semana
- **Semana 1:** 1-2 features pequeñas (Security + Nominatim quick win)
- **Semana 2-3:** 1 feature mediana (Option B - Caché Nominatim)
- **Semana 3-4:** UX improvements & polish

### Por Mes
- **Diciembre:** Seguridad + 2 optimizaciones API + migration
- **Enero:** Caché persistente + Places improvements
- **Febrero-Marzo:** Premium features (si hay tiempo)

---

## 🎬 PRÓXIMAS ACCIONES (PARA ESTA SEMANA)

```
[ ] 1. HOYA: Actualizar env vars en Vercel (Clave Google)
         Timeline: 5 minutos
         Prioridad: 🔴 CRÍTICO

[ ] 2. HOY: Implementar Nominatim en Geocoding
         Timeline: 15 minutos
         Prioridad: 🟠 ALTO
         Archivo: app/page.tsx línea 112

[ ] 3. ESTA SEMANA: Iniciar Option B - Caché Nominatim
         Timeline: 2-3 semanas (start design)
         Prioridad: 🟠 ALTO
         Archivos: app/page.tsx, useTripPlaces.ts

[ ] 4. PRÓXIMOS DÍAS: Research PlaceAutocompleteElement migration
         Timeline: 2-3 horas (cuando llegue el momento)
         Prioridad: 🔴 SECURITY
         Archivos: AdjustStageModal.tsx, TripForm.tsx
```

---

**Última actualización:** 10 Diciembre 2025  
**Próxima revisión:** 17 Diciembre 2025  
**Autor:** Chema + GitHub Copilot (sesión 10/DIC/2025)
