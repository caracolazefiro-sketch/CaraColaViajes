# RESUMEN SESIÓN 9 DICIEMBRE 2025 - MOTOR BUENO

**Branch:** testing
**Commit actual:** 992eb80 (revert de cambios incorrectos)
**Estado motor malo:** ✅ FUNCIONA (commit 514eb3c)
**Estado motor bueno:** ❌ TIENE 2 BUGS

---

## 1. ESTADO ACTUAL DE LOS MOTORES

### Motor Malo (✅ FUNCIONANDO)
- **Ubicación:** `app/page.tsx` + `app/actions.ts`
- **URL:** `/` (raíz)
- **Commit funcional:** `514eb3c` o `2d19060`
- **Funcionamiento:**
  - ✅ Segmentación ~300km con margen inteligente
  - ✅ Selector waypoints funciona (París, Bruselas, Ámsterdam)
  - ✅ Nombres de ciudad correctos
  - ✅ Fechas correctas

**Ejemplo itinerario Salamanca → París → Bruselas → Copenhague:**
```
Día 1: Salamanca → Pancorbo (300 km)
Día 5: Sainville → Paris (70 km)
Día 7: Beersel → Bruxelles (13 km)
Día 11: Greve → København (26 km)
```

### Motor Bueno (❌ 2 BUGS)
- **Ubicación:** `app/motor-bueno/page.tsx` + `app/motor-bueno/actions.ts`
- **URL:** `/motor-bueno`
- **Commit actual:** `992eb80`

**Bug #1: Segmentación 254km**
```
Día 2: Burgos → Parada Táctica (44.13, -2.46)
254 km  ← ❌ Debería ser ~300km
```

**Bug #2: Coordenadas en lugar de nombres**
```
Parada Táctica (44.13, -2.46)  ← ❌ Debería mostrar nombre ciudad
```

---

## 2. CAUSA DE LOS BUGS

### Bug #1: Distancia Hardcoded
**Archivo:** `app/motor-bueno/actions.ts`
**Línea:** ~310

```typescript
// ❌ INCORRECTO (estado actual)
allDrivingStops.push({
    from: currentLegStartName,
    to: stopName,
    distance: data.kmMaximoDia,  // ← Hardcoded 300km
    startCoords: currentLegStartCoords,
    endCoords: stopCoords
});

// ✅ CORRECTO (cómo debería ser)
allDrivingStops.push({
    from: currentLegStartName,
    to: stopName,
    distance: dayAccumulatorMeters / 1000,  // ← Distancia real acumulada
    startCoords: currentLegStartCoords,
    endCoords: stopCoords
});
```

### Bug #2: Falta Fallback en Geocoding
**Archivo:** `app/motor-bueno/actions.ts`
**Línea:** ~110 (función `getCityNameFromCoords`)

```typescript
// ❌ INCORRECTO (estado actual - falta admin3)
if (data.status === 'OK' && data.results?.[0]) {
    const comp = data.results[0].address_components;
    const locality = comp.find(c => c.types.includes('locality'))?.long_name;
    const admin2 = comp.find(c => c.types.includes('administrative_area_level_2'))?.long_name;
    return locality || admin2 || `Punto en Ruta (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
}

// ✅ CORRECTO (agregar admin3 como fallback intermedio)
if (data.status === 'OK' && data.results?.[0]) {
    const comp = data.results[0].address_components;
    const locality = comp.find(c => c.types.includes('locality'))?.long_name;
    const admin3 = comp.find(c => c.types.includes('administrative_area_level_3'))?.long_name;
    const admin2 = comp.find(c => c.types.includes('administrative_area_level_2'))?.long_name;
    return locality || admin3 || admin2 || `Punto en Ruta (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
}
```

---

## 3. PLAN DE ACCIÓN (USUARIO)

### Step 1: ✅ COMPLETADO
- Arreglar selector waypoints en motor malo
- Commit: `514eb3c` - "DEBUG: agregar console.log en onPlaceChanged para waypoints"
- Resultado: Selector funciona, se pueden agregar París, Bruselas, Ámsterdam

### Step 2: ❌ PENDIENTE
**Arreglar bugs motor bueno:**
1. Cambiar `data.kmMaximoDia` → `dayAccumulatorMeters / 1000` (línea ~310)
2. Agregar `admin3` fallback en `getCityNameFromCoords` (línea ~110)

### Step 3: ❌ PENDIENTE
- Integrar CSS de motor bueno a motor malo
- Solo cosmético, no funcional

---

## 4. INSTRUCCIONES PARA PRÓXIMA SESIÓN

### REGLAS CRÍTICAS
1. ❌ **NO COPIAR archivos entre motores** (riesgo confusión)
2. ✅ **Editar SOLO** `app/motor-bueno/actions.ts` en este estado actual.
3. ✅ **Verificar archivo correcto** antes de cada edit
4. ✅ **Commits con prefijo:** "MOTOR MALO:" o "MOTOR BUENO:"

### EDICIÓN SEGURA

**ANTES de editar, confirmar:**
```powershell
Get-Content "app\motor-bueno\actions.ts" | Select-Object -First 3
# Debe mostrar: 'use server';
```

**Aplicar Fix #1 (distancia):**
```typescript
// Buscar línea ~310
distance: data.kmMaximoDia,
// Cambiar a:
distance: dayAccumulatorMeters / 1000,
```

**Aplicar Fix #2 (geocoding):**
```typescript
// Buscar línea ~110, agregar después de locality:
const admin3 = comp.find((c: { types: string[]; long_name?: string }) => c.types.includes('administrative_area_level_3'))?.long_name;
// Y cambiar return a:
return locality || admin3 || admin2 || `Punto en Ruta (...)`;
```

**Commit:**
```bash
git add app/motor-bueno/actions.ts
git commit -m "MOTOR BUENO: fix 254km + coordenadas (distancia real + admin3 fallback)"
git push
```

---

## 5. HISTORIAL COMMITS RELEVANTES

### Funcionales
- `94299a1` - Motor malo GREEN (último estado perfecto)
- `2d19060` - Motor malo restore actions.ts from 94299a1
- `514eb3c` - Motor malo waypoints selector fix (ACTUAL)

### Problemáticos / Reverts
- `d92d1ff` - **INCORRECTO** (editó archivo equivocado)
- `992eb80` - **REVERT** (restaurar motor malo) (ACTUAL)

### Fallidos
- `c39bf3f` - Routes API v2 migration (falló, revertido en e19fd67)

---

## 6. TESTING

**Ruta de prueba:**
```
Origen: Salamanca
Waypoints: París, Bruselas
Destino: Copenhague
Fecha: 15/12/2025
Km/día: 300
```

**Resultado esperado motor bueno (después del fix):**
- Todas las etapas ~300km (no 254km)
- Nombres de ciudad (no coordenadas)
- Total ~11 días

---

## 7. ARCHIVOS CRÍTICOS

| Motor | Archivo Principal | Server Action | Estado |
|-------|------------------|---------------|--------|
| Malo | `app/page.tsx` | `app/actions.ts` | ✅ NO TOCAR |
| Bueno | `app/motor-bueno/page.tsx` | `app/motor-bueno/actions.ts` | ❌ ARREGLAR |

**Compartido:** `app/components/TripForm.tsx` (selector waypoints - ya funciona)

---

## 8. CONFIGURACIÓN

**Google Cloud Project:** WEBCARACOLAVIAJES09DEC25
- Directions API ✅
- Geocoding API ✅
- Places API (New) ✅
- Maps JavaScript API ✅

**Vercel:**
- URL: cara-cola-viajes-pruebas-git-testing-caracola.vercel.app
- Branch: testing
- Env vars: GOOGLE_MAPS_API_KEY_FIXED, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

**Next.js:** 16.0.7 (Turbopack, strict TypeScript)

---

## RESUMEN EJECUTIVO

**Motor Malo:** ✅ Funciona perfectamente (commit 514eb3c) - NO TOCAR
**Motor Bueno:** ❌ Necesita 2 fixes en `app/motor-bueno/actions.ts`:
1. Línea ~310: `distance: dayAccumulatorMeters / 1000`
2. Línea ~110: Agregar `admin3` en getCityNameFromCoords

**Próxima acción:** Aplicar fixes directamente en motor bueno, sin tocar motor malo.
