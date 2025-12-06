# 🔍 INVESTIGACIÓN: Bug "Ajuste Manual de Etapas" - 5 Diciembre 2025

## 📋 Resumen Ejecutivo

**Problema:** Cuando usuario ajusta una etapa (ej: Tarancón → Toledo), sistema devuelve error: `Google API Error: ZERO_RESULTS`

**Gravedad:** 🔴 CRÍTICO - Feature completamente no funcional

**Estado:** Investigado, causa identificada parcialmente, solución pendiente

---

## 🧪 Tests Realizados

### Test 1: Viaje con Parada Obligatoria
**Configuración:**
- Origen: Salamanca
- Destino: Punta Umbría
- Parada Obligatoria: Valencia
- kmMaximoDia: 300km
- Acción: Ajustar Día 1 (Tarancón → Toledo)

**Resultado:** ❌ ZERO_RESULTS ERROR

**Log:**
```
🔧 Ajustando día 0 a: Toledo
🔄 Recalculando desde día 0
📍 Origen: Salamanca | Destino: 21100 Punta Umbría, Huelva, España | Waypoints: Array(4)
❌ Error recalculando: Google API Error: ZERO_RESULTS
```

---

## 🔎 Análisis de Commits

### Commits Investigados

| Commit | Fecha | Descripción | Feature Existe | Funciona |
|--------|-------|-------------|-----------------|----------|
| `c9332d9` | 5 Dec 16:30 | fix: Pasar etapas al recalcular | ✅ Sí | ❌ NO |
| `3565f05` | 4 Dec 11:54 | fix: Final coherence | ✅ Sí | ❌ NO |
| `ce976f6` | 4 Dec 15:22 | fix: myFindings | ✅ Sí | ❌ NO |
| `8d2c8d5` | 2 Dec 20:00 | fix: Bugs en búsqueda | ✅ Sí | ❌ NO |
| `d208122` | 2 Dec 16:00 | feat: Ajuste manual | ✅ Sí | ? NO TESTEADO |

**Conclusión:** El error ZERO_RESULTS aparece en TODOS los commits testeados, incluso ANTES de que el feature fuera implementado.

---

## 🎯 Causa Probable

**El problema NO es específico del feature de ajuste**, sino en cómo se construyen los **waypoints** cuando se llama a Google Directions API:

```typescript
const waypoints: string[] = [newDestination];
for (let i = adjustingDayIndex + 1; i < updatedItinerary.length - 1; i++) {
    waypoints.push(updatedItinerary[i].to);
}
```

**Posibles razones para ZERO_RESULTS:**

1. ❌ **Waypoints contienen "📍 Parada Táctica: Tarancón"** (etiqueta con emoji)
   - Google API no entiende este formato
   - Necesita solo nombre de ciudad o coordenadas

2. ❌ **Waypoints mezclan nombres de ciudades incompletos**
   - Google recibe: `["Toledo", "Manzanares", "La Campana", "Punta Umbría"]`
   - Pero algunos pueden no existir o ser ambiguos

3. ❌ **Valencia obligatoria NO está en waypoints**
   - Sistema ignora paradas obligatorias al recalcular
   - `formData.etapas` nunca se procesa en `getDirectionsAndCost`

4. ❌ **Ruta imposible matemáticamente**
   - Toledo → Punta Umbría → Valencia puede no tener ruta válida
   - Google no encuentra solución

---

## 🔧 Cambios Intentados

### Intento 1: Pasar `etapas` a getDirectionsAndCost
**Archivo:** `app/page.tsx` línea 241  
**Cambio:** Agregar `etapas: formData.etapas || ''`

**Resultado:** ❌ Sigue dando ZERO_RESULTS (etapas NO se procesan en servidor)

---

## 📌 Recomendaciones

### Opción A: Investigación Profunda (3-4 horas)
1. Loguear exactamente qué waypoints se envían a Google
2. Verificar si el problema es con los nombres o con coordenadas
3. Implementar `etapas` correctamente en `getDirectionsAndCost`
4. Testear con diferentes ciudades/rutas

### Opción B: Desactivar Feature Temporalmente
1. Ocultar botón ⚙️ de ajuste manual
2. Documentar como "En desarrollo"
3. Continuar con otras features

### Opción C: Simplificar Feature
1. Permitir solo ajustar última etapa (sin recalcular)
2. O permitir solo cambiar dentro de misma ciudad (sin cambiar ruta)

---

## 📊 Archivos Afectados

```
app/page.tsx
├─ handleAdjustDay() - Abre modal
└─ handleConfirmAdjust() - Recalcula (AQUÍ ESTÁ EL ERROR)

app/actions.ts
├─ getDirectionsAndCost() - NO procesa etapas/waypoints correctamente
└─ Interfaz DirectionsRequest - Incluye etapas pero no se usan

app/components/
├─ AdjustStageModal.tsx - Modal funciona correctamente
├─ ItineraryPanel.tsx - Botón ⚙️ funciona correctamente
└─ TripMap.tsx - Muestra UI correctamente
```

---

## 🕐 Línea de Tiempo Hoy

| Hora | Acción |
|------|--------|
| 11:00 | Sesión comienza, investigar bugs screenshot + startCoordinates |
| 12:00 | Cambio a investigar "Ajuste Manual de Etapas" con Carmen |
| 14:30 | Crear análisis detallado de feature |
| 15:00 | Testear ajuste de etapas → Error ZERO_RESULTS |
| 15:30 | Intentar arreglos rápidos → No funciona |
| 16:00 | Resetear a commits anteriores → Error persiste |
| 16:30 | Identificar causa: waypoints mal formados |

---

**Documento preparado para:**
- Compartir con Carmen (QA)
- Decidir siguiente estrategia
- Documentar hallazgos técnicos
