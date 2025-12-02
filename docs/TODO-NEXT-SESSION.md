# 📋 TODO - Próxima Sesión

**Última actualización:** 2 Diciembre 2025, 19:52

---

## 🔴 ALTA PRIORIDAD (Tareas Iniciadas)

### Testing Fase 2 - Ajuste Manual de Etapas
**Estado:** Implementado pero no testeado exhaustivamente

**Casos pendientes:**
- [ ] **Ajustar última etapa:** Verificar que no rompe (no debería recalcular)
- [ ] **Ajustes múltiples:** Cambiar etapa 1, luego etapa 3, verificar consistencia
- [ ] **Persistencia:** Hacer ajuste, recargar página, verificar que se mantiene
- [ ] **SavedPlaces:** Guardar camping en etapa 2, ajustar etapa 1, verificar camping persiste

**Tiempo estimado:** 30-45 minutos

**Archivos involucrados:**
- `app/page.tsx` (handleConfirmAdjust)
- `app/hooks/useTripPersistence.ts`
- `app/components/AdjustStageModal.tsx`

---

## 🟡 MEDIA PRIORIDAD (Mencionado pero no iniciado)

### Drag & Drop de Etapas en Mapa
**Contexto:** Usuario mencionó como idea futura en ROADMAP

**Descripción:** Arrastrar pins directamente en mapa para ajustar paradas, recálculo en tiempo real.

**Alternativa visual al modal actual.**

**Complejidad:** ALTA (interacción Google Maps, gestión de estado)

**Tiempo estimado:** 4-6 horas

**Decisión:** Mantener en ROADMAP, NO priorizar ahora (modal funciona perfecto)

---

### Migrar a PlaceAutocompleteElement
**Contexto:** Advertencia en consola sobre `google.maps.places.Autocomplete` deprecated desde marzo 2025

**Warning actual:**
```
As of March 1st, 2025, google.maps.places.Autocomplete is not available 
to new customers. Please use google.maps.places.PlaceAutocompleteElement instead.
```

**Impacto:** NO crítico (seguirá funcionando con bug fixes)

**Acción recomendada:** Migrar cuando haya tiempo, no urgente

**Guía:** https://developers.google.com/maps/documentation/javascript/places-migration-overview

**Tiempo estimado:** 2-3 horas

**Archivos afectados:**
- `app/components/AdjustStageModal.tsx`
- `app/components/TripForm.tsx` (Autocomplete también usado aquí)

---

### Optimización de Imágenes en InfoWindows
**Contexto:** Fotos de lugares pueden tardar en cargar

**Ideas mencionadas en ROADMAP:**
- Lazy loading de fotos
- Placeholder mientras carga
- Cachear en localStorage

**Prioridad:** Baja (funciona, solo optimización)

**Tiempo estimado:** 1-2 horas

---

## 🟢 BAJA PRIORIDAD (Backlog)

### Cleanup de Logging de Debug
**Descripción:** Hay muchos console.log con emojis (🔧 🔄 📍 ✅ ❌) que ayudaron en debug pero podrían limpiarse

**Archivos:**
- `app/page.tsx` (handleConfirmAdjust tiene logging extenso)
- `app/hooks/useTripPersistence.ts` (logging de borrado)
- `app/roadmap/page.tsx` (logging de carga)

**Decisión sugerida:** 
- Mantener los importantes
- Envolver en `if (process.env.NODE_ENV === 'development')` 
- O usar librería de logging (winston, pino)

**Tiempo estimado:** 30 minutos

---

### Refactorizar handleConfirmAdjust
**Contexto:** Función tiene 80+ líneas, podría modularizarse

**Posible estructura:**
```typescript
const buildWaypoints = (days, startIndex, endIndex) => {...}
const mergeItineraries = (preserved, recalculated) => {...}
const handleConfirmAdjust = async (newDest, coords) => {
  // Lógica principal más limpia
  const waypoints = buildWaypoints(...)
  const result = await getDirectionsAndCost(...)
  const merged = mergeItineraries(...)
}
```

**Beneficio:** Mantenibilidad, testing unitario

**Prioridad:** Baja (funciona perfecto, solo refactor)

**Tiempo estimado:** 1 hora

---

## 💡 IDEAS NUEVAS (No discutidas hoy)

### Sistema de Notificaciones Toast
**Descripción:** Feedback visual cuando se completan acciones

**Casos de uso:**
- "✅ Etapa ajustada correctamente"
- "✅ Viaje guardado"
- "❌ Error al calcular ruta"

**Librería sugerida:** react-hot-toast, sonner

**Tiempo estimado:** 1 hora

---

### Historial de Cambios en Etapas
**Descripción:** Guardar histórico de ajustes (undo/redo)

**Implementación:** Stack de estados en localStorage

**Complejidad:** Media

**Tiempo estimado:** 2-3 horas

---

## 📝 DECISIONES PENDIENTES

### ¿Implementar Analytics?
**Pregunta:** ¿Queremos saber qué features usan más los usuarios?

**Opciones:**
- Google Analytics 4
- Plausible (privacy-focused)
- Custom con Supabase

**Requiere:** Decisión estratégica del usuario

---

### ¿Sistema de Usuarios Completo?
**Contexto:** Ahora hay userId pero no auth flow completo

**Pregunta:** ¿Queremos login/registro formal?

**Opciones:**
- Supabase Auth (email/password, OAuth)
- NextAuth.js
- Clerk

**Complejidad:** ALTA (3-5 días)

**Beneficios:** Sincronización cross-device, perfiles, viajes guardados en cloud

---

## 🎯 RECOMENDACIÓN PARA PRÓXIMA SESIÓN

**Prioridad #1:** Completar testing Fase 2 (45 min)

**Prioridad #2:** Decidir si continuar con features nuevas o consolidar lo existente

**Sugerencia:** Tomarse un día para USAR la app (viaje real o simulado) y detectar puntos de fricción antes de añadir más features.

---

## 📌 Notas de Contexto

**Rama actual:** main (producción)

**Último deploy exitoso:** 1bdcfd3

**Environment:** Vercel Production/Preview/Development configurados

**APIs:** Google Maps con key sin restricciones (problema resuelto)

**Base de datos:** Supabase configurado, ROADMAP sincronizado

---

**Este archivo se sobreescribe cada sesión con los nuevos pendientes.**
