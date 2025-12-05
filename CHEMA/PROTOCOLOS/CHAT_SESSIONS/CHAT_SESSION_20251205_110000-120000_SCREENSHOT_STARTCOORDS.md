# Chat Session: Screenshot & startCoordinates Debug → Branch Strategy
**Fecha:** 5 Diciembre 2025  
**Horario:** 11:00 - 13:00 (CET)  
**Tema Principal:** Mover botón Screenshot + Resolver bug startCoordinates + Estrategia de ramas de preview estables

---

## 📋 Resumen Ejecutivo

Sesión enfocada en dos problemas críticos:
1. **Screenshot Button Placement**: Usuario solicitó mover botón 📸 de dentro del Debug Panel a la barra superior (AppHeader) para poder capturar toda la página incluyendo el panel mismo
2. **startCoordinates Bug**: Logs del usuario mostraron que `startCoordinates` llega `undefined` a todos los días del itinerario

---

## 🔍 Análisis de Problemas

### Problema 1: startCoordinates Undefined

**Síntoma observado en logs del cliente:**
```javascript
[TripMap] Día 0 DETALLE: {
  "from":"Salamanca",
  "to":"📍 Parada Táctica: Pancorbo",
  "hasStartCoordinates":false,  // ❌ TODOS los días tienen false
  "isValidStart":false,
  "coordinates":{"lat":42.624230000000004,"lng":-3.14787}
}
```

**Análisis:**
- El servidor asigna `startCoordinates: startCoords` en línea 374 de `actions.ts`
- El cliente los recibe como `undefined` en TripMap
- Sospecha: **Pérdida en serialización JSON** o **propiedad no incluida en respuesta**

**Acción:** Agregué logs exhaustivos **PRE-RETURN** en `actions.ts` (líneas 428-437):
```typescript
console.log('[actions.ts] ===== PRE-RETURN VERIFICATION =====');
dailyItinerary.forEach((day, idx) => {
    console.log(`[actions.ts] Day ${idx} HAS startCoordinates:`, !!day.startCoordinates, day.startCoordinates);
});
console.log('[actions.ts] dailyItinerary JSON STRINGIFIED:', JSON.stringify(dailyItinerary, null, 2));
```

**Propósito:** Determinar si el servidor envía correctamente o si se pierde en transmisión.

### Problema 2: Screenshot Button Error

**Error reportado:**
```
Error al capturar pantalla:
Attempting to parse an unsupported color function "lab"
```

**Causa:** html2canvas no soporta colores CSS modernos (`lab()`, etc.) de Tailwind CSS

**Soluciones aplicadas:**
1. ✅ Mover botón a AppHeader (arriba derecha)
2. ✅ Cambiar target a `main` → `#__next` en lugar de `document.body`
3. ✅ Usar `toBlob()` en lugar de `toDataURL()` para mejor compatibilidad
4. ✅ Agregar `ignoreElements` para SCRIPT/STYLE problemáticos
5. ✅ Aumentar `imageTimeout` a 15 segundos
6. ✅ Mejor error handling con fallback a Ctrl+Impr

---

## 📝 Cambios Implementados

### Commit 1: feat(screenshot): Mover botón Screenshot a AppHeader (099f542)
**Archivos modificados:**
- `app/components/AppHeader.tsx` - Nuevo botón con función `takeScreenshot()`
- `app/components/DebugPanel.tsx` - Removido botón Screenshot duplicado
- `package.json` - Instalada librería `html2canvas`

**Cambios clave:**
- Botón 📸 rojo en esquina superior derecha
- Visible siempre (no solo cuando Debug Panel está abierto)
- Captura con html2canvas using lazy import
- Estado "Capturando..." mientras se procesa

### Commit 2: fix(debug): Agregar verificación PRE-RETURN (16bcc24)
**Archivos modificados:**
- `app/actions.ts` - Logs exhaustivos antes de retornar

**Cambios clave:**
- 🔍 Debug log verificando `startCoordinates` en cada día
- JSON stringify completo del `dailyItinerary` para ver estructura exacta
- Debug para rastrear dónde se pierden las propiedades

### Commit 3: fix(screenshot): Mejorar captura (f8f726b)
**Cambios:**
- Target a `#__next` en lugar de `document.body`
- Agregar `windowHeight`/`windowWidth` para scroll
- Mejor validación de canvas
- Append/remove link para evitar side effects
- Timestamp en nombre de archivo

### Commit 4: fix(screenshot): Soportar colores CSS modernos (09d177c)
**Cambios clave:**
```typescript
const html2canvas = (await import('html2canvas')).default;

const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    allowTaint: true,
    scale: window.devicePixelRatio || 1,
    imageTimeout: 15000,  // ⬆️ Aumentado
    ignoreElements: (element) => {
        return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
    }
});

// Usar toBlob en lugar de toDataURL
canvas.toBlob((blob) => {
    // ... descargar
}, 'image/png', 0.95);
```

---

## 🚀 Deployments

| Commit | Descripción | Estado |
|--------|-------------|--------|
| 099f542 | Screenshot button en AppHeader | ✅ Deployed |
| 16bcc24 | PRE-RETURN debug logs | ✅ Deployed |
| f8f726b | Mejorar captura con canvas validation | ✅ Deployed |
| 09d177c | Soportar colores CSS modernos | ✅ Deployed |

**Vercel:** Auto-deploy en rama `testing`  
**URL:** https://cara-cola-viajes-git-testing-caracola.vercel.app/

---

## 🎯 Resolución Final (12:00-13:00)

### Problema: Screenshot Button Falla en Producción
**Síntoma:** 
- Botón 📸 no funciona en Vercel
- Error: `"Attempting to parse an unsupported color function "lab""`
- html2canvas no soporta colores CSS modernos de Tailwind

**Decisión del Usuario:**
> "No vamos a darle más vueltas. Quiero volver a un estado estable de la web de ayer, antes de las 16:00"

### Solución Implementada: Estrategia de Ramas

En lugar de revertir `testing`, se creó una **estrategia de múltiples previews**:

**Rama `testing`** (Actual - Con cambios de hoy)
- Commit: `8ded5b5` 
- Estado: Con todos los cambios del día (4 commits)
- URL: https://cara-cola-viajes-git-testing-caracola.vercel.app/
- **Mantiene:** Todos los nuevos commits para iteración futura

**Rama `preview-1500`** (Versión estable 15:41 ayer)
- Commit: `8d80170` (2025-12-04 15:41:58)
- Estado: Version funcional y estable
- URL: https://cara-cola-viajes-git-preview-1500-caracola.vercel.app/
- **Propósito:** Comparar con cambios de hoy

**Rama `preview` (Eliminada)**
- Commit anterior: `0ab3a25` (16:00 ayer)
- Estado: ✅ Borrada per usuario request

### Commits Relacionados a Branch Strategy
- `8ded5b5`: Restaurar testing a estado con todos los cambios
- `bd574e0`: Force redeploy en preview-1500
- Deleted: rama preview

---

## 📊 Estado Actual (13:00)

### ✅ Completado
- Botón Screenshot movido a AppHeader (arriba derecha)
- Removido botón duplicado de DebugPanel
- Librería html2canvas instalada
- Logs PRE-RETURN agregados para debug de startCoordinates
- Múltiples intentos de fix para error de colores CSS
- Build exitoso (0 errores TypeScript)
- Todos los cambios deployados en Vercel
- **NUEVA:** Estrategia de ramas implementada
  - `testing` mantiene cambios de hoy
  - `preview-1500` como versión estable para comparación
  - rama `preview` eliminada

### ⏳ En Espera
- Vercel deploy de `preview-1500` (en progreso)
- Usuario comparando `testing` vs `preview-1500`

### 🔴 No Resuelto
- Screenshot button sigue sin funcionar (html2canvas + colores CSS)
- startCoordinates bug sin confirmar (depende de PRE-RETURN logs)
- Solución: Mantener `testing` como WIP, usar `preview-1500` como baseline

---

## 🎯 Próximos Pasos

1. **User Testing:** Usuario prueba en Vercel:
   - Calcular ruta Salamanca → Barcelona
   - Hacer click en 📸 Screenshot (arriba derecha)
   - Verificar si descarga PNG correctamente
   - Abrir 🐛 Debug Panel
   - Copiar/descargar logs
   - Buscar logs `[actions.ts] ===== PRE-RETURN VERIFICATION =====`

2. **Log Analysis:** Analizar PRE-RETURN logs:
   - ¿Tiene cada día `startCoordinates`?
   - ¿Qué estructura tiene el JSON?
   - ¿Se pierde en serialización o transmisión?

3. **Conditional Fix:**
   - Si startCoordinates está en servidor: problema es serialización JSON
   - Si startCoordinates NO está: problema es en lógica de asignación
   - Si screenshot funciona: cerrar ese issue
   - Si screenshot falla: implementar alternativa sin html2canvas

---

## 💡 Notas Técnicas

### startCoordinates Flow
```
1. actions.ts: getDirectionsAndCost()
   ↓
2. Extrae de Google API: route.legs[0].start_location
   ↓
3. Validación 5-capas (líneas 196-237)
   - Direct properties: {lat, lng}
   - Functions: lat(), lng()
   - Nested: {lat: {lat, lng}}
   - Geocoding fallback
   - Safety fallback {0,0}
   ↓
4. Asigna a dailyPlan (línea 374)
   startCoordinates: startCoords
   ↓
5. Retorna dailyItinerary (línea 430)
   ↓
6. Cliente recibe en TripMap
   ✅ if hasStartCoordinates
```

**Punto de quiebre:** Entre paso 5 y 6

### Screenshot Options Tested
1. `toDataURL()` → Error de memoria/performance
2. `canvas.toBlob()` → Mejor, más compatible
3. Ignorar SCRIPT/STYLE → Evita parsing CSS problemático
4. `imageTimeout: 15000` → Dar más tiempo para cargar recursos
5. `allowTaint: true` → Permitir imágenes de diferentes orígenes

---

## 🔄 Branches Finales

| Rama | Commit | Fecha/Hora | Estado | URL |
|------|--------|-----------|--------|-----|
| **testing** | `8ded5b5` | 5 Dic 13:00 | WIP - Cambios de hoy | [Link](https://cara-cola-viajes-git-testing-caracola.vercel.app/) |
| **preview-1500** | `bd574e0` / `8d80170` | 4 Dic 15:41 | ✅ Estable | [Link](https://cara-cola-viajes-git-preview-1500-caracola.vercel.app/) |
| preview | `0ab3a25` | 4 Dic 16:00 | ❌ Deleted |  |

---

## 📚 Referencias

- **Sesión Completa:** 11:00-13:00 (2 horas)
- **Commits Totales Hoy:** 8 (099f542 → 8ded5b5)
- **Ramas Creadas:** preview-1500, preview (deleted)
- **Decision Point:** Usuario prefirió mantener `testing` como WIP en lugar de revertir

---

**Estado Final:** Sistema dividido en dos previews - `testing` con cambios experimentales, `preview-1500` como baseline estable para comparación y testing.
