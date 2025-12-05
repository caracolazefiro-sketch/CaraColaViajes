# RESUMEN EJECUTIVO: Ajuste Manual de Etapas
**Sesión:** 5 de Diciembre 2025  
**Feature:** Ajuste Manual de Etapas con Recálculo Automático  
**Estado:** ✅ IMPLEMENTADO Y TESTEADO  
**Rama:** `preview-1500` → `testing`

---

## 🎯 EL PROBLEMA

Usuario ajusta un waypoint (ej: Tarancón → Madrid) → **Google API rechaza la ruta** (ZERO_RESULTS)

**Raíz:** Código enviaba paradas tácticas viejas + waypoints nuevos → Google confundido

---

## 💡 LA SOLUCIÓN

**Arquitectura correcta (separación de responsabilidades):**

| Componente | Responsabilidad |
|-----------|-----------------|
| **User Input** | Seleccionar Origin, Destination, Waypoints obligatorios |
| **formData.etapas** | Guardar lista actual de waypoints obligatorios (memoria persistente) |
| **Google API** | Devolver rutas crudas basadas SOLO en waypoints obligatorios |
| **Nuestro Segmentador** | Dividir ruta en 300 km → Generar paradas tácticas |
| **Itinerario** | Regenerarse DESDE CERO en cada ajuste |

---

## 📊 FLUJO DE AJUSTE (ANTES vs DESPUÉS)

### ❌ ANTES (Incorrecto)
```
Usuario: Cambiar Tarancón → Madrid
  ↓
Extraer destinos de itinerario viejo (contiene paradas tácticas)
  ↓
Enviar a Google: [Madrid, Valencia, Villarejo, Canillas, Nogueira]
  ↓
Google confundido: ZERO_RESULTS ❌
```

### ✅ DESPUÉS (Correcto)
```
Usuario: Cambiar Tarancón → Madrid
  ↓
Leer formData.etapas: ["Valencia"]
  ↓
Determinar: Reemplazar índice 0 → ["Madrid", "Valencia"]
  ↓
Enviar a Google: ["Madrid", "Valencia"] SOLO obligatorios
  ↓
Google OK: Devuelve ruta nueva ✅
  ↓
Nuestro segmentador: Genera paradas tácticas para ruta nueva
  ↓
Actualizar formData.etapas: ["Madrid", "Valencia"] (para próximos ajustes)
  ↓
Mostrar: Itinerario regenerado
```

---

## 🔑 CAMBIOS CRÍTICOS

### 1. **formData.etapas es fuente de verdad**
```
Inicial:           etapas = "Valencia"
Después ajuste 1:  etapas = "Madrid|Valencia"
Después ajuste 2:  etapas = "Madrid|Valencia|Braga"
```

### 2. **No reutilizar paradas tácticas viejas**
```
❌ NO HACER:
  updatedItinerary.map(day => day.to)  // Contiene tácticas

✅ HACER:
  formData.etapas.split('|')  // Solo obligatorios
```

### 3. **Regenerar itinerario siempre**
```
❌ NO HACER:
  preservedDays + newCalculatedDays  // Fusión

✅ HACER:
  recalcResult.dailyItinerary  // TODO desde cero
```

### 4. **Actualizar formData después**
```
setFormData(prev => ({
  ...prev,
  etapas: obligatoryWaypoints.join('|')  // ← CRÍTICO
}));
```

---

## 📈 RESULTADO

**Encadenamiento ilimitado de ajustes:**

```
Ajuste 1: formData.etapas: "Valencia" → "Madrid|Valencia"
Ajuste 2: formData.etapas: "Madrid|Valencia" → "Madrid|Valencia|Braga"
Ajuste 3: formData.etapas: "Madrid|Valencia|Braga" → [actualizado]
Ajuste N: formData.etapas siempre tiene estado correcto
```

**Google siempre recibe waypoints completos y actualizados** ✅

---

## 🧪 VALIDACIÓN

**Test case:** Salamanca → Valencia → Oporto (300 km/día)

| Operación | Resultado |
|-----------|-----------|
| Ajuste 1: Tarancón → Madrid | ✅ 3 días (Madrid, Valencia, Oporto) |
| Ajuste 2: Nogueira → Braga | ✅ Ruta recalculada con Braga |
| KM respetados | ✅ Respeta 300 km/día |
| formData.etapas | ✅ Actualizado tras cada ajuste |

---

## 🚀 PARA PROBAR

1. **Rama:** `testing`
2. **Test:** Salamanca → Valencia → Oporto
3. **Ajustes:**
   - Cambiar Tarancón por Madrid
   - Cambiar Nogueira por Braga
   - Verificar: formData.etapas se actualiza
4. **Esperado:** Cada ajuste regenera itinerario completo

---

## 📁 ARCHIVOS MODIFICADOS

- `app/page.tsx` - Lógica de recalculación (refactorizada)
- `app/actions.ts` - Normalización de ubicaciones
- `app/components/TripForm.tsx` - Input de waypoints
- `app/hooks/useTripCalculator.ts` - Normalización inicial

---

## ✨ COMPLEJIDAD

- **Técnica:** ⭐⭐⭐⭐⭐
- **Lógica:** ⭐⭐⭐⭐
- **Testing:** ⭐⭐⭐⭐⭐

---

## 📝 NOTA IMPORTANTE

**Este patrón es replicable para cualquier ajuste futuro:**

> 1. Mantener formData actualizado  
> 2. Enviar SOLO datos de usuario a APIs externas  
> 3. Regenerar TODO desde cero  
> 4. Actualizar memoria (formData) para próximas operaciones  

Sin esto, pierdes contexto entre operaciones.

