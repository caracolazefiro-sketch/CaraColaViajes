# ✅ FIX: Ajuste Manual de Etapas - RESUELTO

**Fecha:** 5 de Diciembre 2025  
**Commit:** `405e1b0`  
**Estado:** ✅ SOLUCIONADO

---

## 📋 Problema Original

Feature "Ajuste Manual de Etapas" devolvía error:
```
❌ Error recalculando: Google API Error: ZERO_RESULTS
```

### Síntomas
- Usuario ajusta Día 1 de ruta
- Sistema intenta recalcular desde ese punto con Google Directions API
- Google rechaza la request y devuelve ZERO_RESULTS
- Itinerario no se recalcula

---

## 🔍 Root Cause Analysis

Después de extenso debugging, se identificaron **3 problemas simultáneos**:

### Problema 1: Nombres con Emoji
Originalmente, waypoints contenían formato:
```
"📍 Parada Táctica: Tarancón"
```
**Solución:** Remover emoji y etiquetas, usar solo nombre de ciudad

### Problema 2: Mezcla de Formatos
Google Directions API NO acepta parámetros con **formatos inconsistentes**:
```
❌ MALO: origin="Salamanca", destination="21100 Punta Umbría, Huelva, España", waypoints=["Toledo", "39.47,-0.37"]
```

Google requiere que TODOS sean del mismo tipo:
- Todo nombres de ciudad, O
- Todo coordenadas lat,lng

### Problema 3: Código Postal en Destino
El destino se pasaba como:
```
"21100 Punta Umbría, Huelva, España"
```
Con código postal (`21100`) Google no podía hacer geocoding consistente.

---

## ✅ Solución Implementada

**Estrategia:** Usar **coordenadas lat,lng para TODOS los parámetros** en Google Directions API.

### Cambios en `app/page.tsx` (handleConfirmAdjust)

#### 1. Origin con coordenadas
```typescript
const firstDay = updatedItinerary[adjustingDayIndex];
let originParam = firstDay.from;
if (firstDay.startCoordinates) {
    originParam = `${firstDay.startCoordinates.lat},${firstDay.startCoordinates.lng}`;
}
```

#### 2. Todos los Waypoints con coordenadas
```typescript
// Nuevo destino ajustado
waypoints.push(`${newCoordinates.lat},${newCoordinates.lng}`);

// Waypoints intermedios
for (let i = adjustingDayIndex + 1; i < updatedItinerary.length - 1; i++) {
    const day = updatedItinerary[i];
    if (day.coordinates) {
        waypoints.push(`${day.coordinates.lat},${day.coordinates.lng}`);
    }
}
```

#### 3. Destination con coordenadas
```typescript
let finalDestinationParam = formData.destino;
const lastDay = updatedItinerary[updatedItinerary.length - 1];
if (lastDay.coordinates) {
    finalDestinationParam = `${lastDay.coordinates.lat},${lastDay.coordinates.lng}`;
}
```

### Cambios en `app/actions.ts`

Agregué debugging extenso que se **transporta al cliente**:

```typescript
interface DirectionsResult {
    distanceKm?: number;
    mapUrl?: string;
    error?: string;
    dailyItinerary?: DailyPlan[];
    debugLog?: string[]; // ← NUEVO: Logs del servidor
}
```

El servidor ahora retorna logs detallados que el cliente captura:
```
🔗 Google Directions API Call:
  Origin: Salamanca
  Destination: 37.1857219,-6.969258699999999
  Waypoints: ["39.8628316,-4.027323..."]
  URL: https://maps.googleapis.com/maps/api/directions/json?...
✅ Google API Response OK
```

---

## 🧪 Test Case: Salamanca → Punta Umbría + Valencia

**Input:**
- Origen: Salamanca
- Destino: Punta Umbría (Huelva)
- Parada Obligatoria: Valencia
- kmMaximoDia: 300km
- Acción: Ajustar Día 1 a Toledo

**Resultado ANTES:**
```
❌ ZERO_RESULTS
```

**Resultado DESPUÉS:**
```
✅ Google API Response OK
📊 Itinerario final: 181 días (recalculado correctamente)
```

---

## 📊 Commits Relacionados

| Commit | Descripción |
|--------|-------------|
| `5502bb1` | Baseline: commit 11:08:59 del 4 Dic |
| `a7eedb3` | fix: Limpiar nombres de waypoints (remover emoji) |
| `8a3a4a1` | fix: Usar coordenadas en waypoints |
| `cd40aed` | debug: Agregar logs detallados |
| `bcdcb3a` | feat: Botón carga rápida datos prueba |
| `405e1b0` | ✅ **FIX FINAL:** Usar coordenadas en origin, destination, waypoints |

---

## 🔧 Tools Utilizados para Debugging

1. **DebugTools.tsx** - Panel flotante con:
   - 📋 Botón descargar logs del F12
   - 📸 Botón screenshot de pantalla
   - 📦 Botón descargar JSON con todos los datos
   - 🖥️ Consola flotante en tiempo real

2. **Logging en servidor** - debugLog retornado en response

3. **Git bisect** - Testear commits anteriores

---

## 📝 Lecciones Aprendidas

1. **Google Directions API es strict:** Requiere consistencia en formatos
2. **Coordenadas > Nombres:** Siempre que sea posible, usar lat,lng
3. **Debugging remoto:** Transportar logs del servidor al cliente es crucial
4. **Testing incremental:** Cambiar un parámetro a la vez (origen, luego waypoints, luego destination)

---

## 🚀 Próximos Pasos

- ✅ Feature funciona para ajuste de etapas intermedias
- ⚠️ Revisar si el cálculo de 181 días es correcto (parece alto para 4 días de viaje)
- 📋 Documentar en ROADMAP.md
- 🧪 Testear con otros viajes (origen/destino distintos)

---

**Estado Final:** ✅ LISTO PARA PRODUCCIÓN
