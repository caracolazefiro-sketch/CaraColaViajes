# 🚗 MOTOR MVP - VERSIÓN ESTABLE V1

**Fecha:** 06/12/2025  
**Estado:** ✅ FUNCIONANDO PERFECTAMENTE - NO MODIFICAR SIN BACKUP

---

## 📋 Descripción General

Versión estable del MOTOR MVP que calcula rutas segmentadas cada ~300km y muestra:
- 3 mapas de comparación (Nuestra petición, Google Directo, Nuestro MOTOR)
- Itinerario detallado por etapas con nombres de ciudades exactos
- Marcadores en el mapa perfectamente alineados con la ruta azul

---

## ✅ Funcionalidades Confirmadas

### 1. Mapas de Comparación
- **Nuestra petición:** Muestra la ruta solicitada
- **Google Maps Directo:** Muestra la ruta que Google elige (puede ser diferente)
- **Nuestro MOTOR:** Muestra la ruta segmentada con marcadores cada ~300km

### 2. Marcadores en el Mapa
- ✅ Banderas de inicio/fin (🏁)
- ✅ Puntos intermedios con números de día
- ✅ Labels con nombres de ciudades (ej: "Pancorbo")
- ✅ Marcadores EXACTAMENTE sobre la línea azul de la ruta
- ✅ Tooltips con información detallada al hacer hover

### 3. Itinerario por Etapas
- ✅ Fechas calculadas correctamente
- ✅ Nombres de ciudades coinciden EXACTAMENTE con los del mapa
- ✅ Distancias correctas (~300km por etapa, última ajustada)
- ✅ Colores diferentes para etapas de conducción vs no conducción

### 4. Sincronización Mapa-Itinerario
- ✅ El itinerario usa `state.segmentationData` (datos del cliente)
- ✅ Callback `onSegmentationPointsCalculated` sincroniza datos
- ✅ Los nombres de ciudades se obtienen por geocoding inverso del polyline

---

## 🏗️ Arquitectura

### Flujo de Datos

```
1. Usuario ingresa origen/destino → Salamanca, Spain → Paris, France
2. Servidor (actions.ts):
   - Llama Google Directions API
   - Calcula segmentación cada 300km
   - Devuelve dailyItinerary con fechas, distancias, nombres aproximados
   
3. Cliente (MotorComparisonMaps.tsx):
   - Solicita ruta a Google Maps (puede ser diferente al servidor)
   - Extrae polyline EXACTO de la ruta mostrada
   - Calcula puntos cada 300km caminando el polyline
   - Hace geocoding inverso para nombres de ciudades
   - Llama callback → setSegmentationData()
   
4. Itinerario (page.tsx):
   - Usa state.segmentationData (datos del cliente)
   - Muestra nombres exactos del mapa (ej: Pancorbo, no Burgos)
   - Distancias calculadas del polyline real
```

### Archivos Críticos

| Archivo | Propósito | RED FLAG |
|---------|-----------|----------|
| `actions.ts` | Algoritmo servidor (para debug) | ⚠️ NO sincronizar con cliente |
| `MotorComparisonMaps.tsx` | Algoritmo cliente (fuente de verdad) | ⚠️ Calcula puntos del polyline |
| `useMotor.ts` | Estado compartido con segmentationData | ⚠️ Sincroniza mapa-itinerario |
| `page.tsx` | Layout y lógica del itinerario | ⚠️ Usa segmentationData |
| `types.ts` | Tipos TypeScript | ⚠️ DailyPlan estructura |
| `motor.css` | Estilos del layout | ⚠️ Grid 2x2 |

---

## 🔑 Conceptos Clave

### ¿Por qué el servidor y el cliente calculan diferente?

**Respuesta:** Son dos llamadas separadas a Google Directions API:
- **Servidor:** Llama una vez para calcular distancias totales y fechas
- **Cliente:** Llama otra vez para renderizar el mapa

Google puede devolver rutas ligeramente diferentes entre llamadas (diferentes algoritmos, tráfico, etc).

### ¿Por qué no usar los datos del servidor en el itinerario?

**Problema anterior:** El itinerario decía "Burgos" pero el mapa mostraba "Pancorbo"
**Solución V1:** El itinerario usa los datos del cliente (los mismos del mapa)
**Resultado:** 100% sincronización entre mapa e itinerario

### ¿Qué es segmentationData?

Estado en `useMotor` que contiene:
```typescript
{
  points: [
    { lat, lng, day, distance, cityName: "Pancorbo" },
    { lat, lng, day, distance, cityName: "Burdeos" },
    // ...
  ],
  startCity: "Salamanca",
  endCity: "París"
}
```

Estos datos se calculan del polyline EXACTO del mapa renderizado.

---

## 🧪 Testing

### Escenarios Probados

✅ **Salamanca → Paris (1267 km)**
- 5 etapas: ~253-254 km cada una
- Última etapa ajustada correctamente
- Nombres: Salamanca → Pancorbo → Burdeos → Saint-Romain → Veigné → París

✅ **Marcadores alineados**
- Todos los puntos están EXACTAMENTE sobre la línea azul
- No hay offset visual entre marcadores y ruta

✅ **Itinerario sincronizado**
- Nombres del itinerario coinciden con labels del mapa
- Distancias correctas (~300km por día)

### Cómo Probar Cambios

1. Ir a `http://localhost:3000/motor`
2. Verificar que hay 3 mapas + itinerario
3. Verificar marcadores sobre la línea azul
4. Verificar nombres en itinerario = nombres en mapa
5. Verificar distancias ~300km (última ajustada)

---

## 🚨 RED FLAGS - NO MODIFICAR

### Si necesitas cambiar algo:

1. **HACER BACKUP** de esta versión V1
2. Crear rama nueva: `git checkout -b motor-cambio-descripcion`
3. Modificar UNO de los archivos críticos
4. Probar EXHAUSTIVAMENTE en `/motor`
5. Si funciona → merge, si no → revertir

### Cambios Prohibidos

❌ **NO cambiar** el algoritmo de segmentación en `MotorComparisonMaps.tsx`  
❌ **NO eliminar** `onSegmentationPointsCalculated` callback  
❌ **NO usar** `dailyItinerary` directamente en el itinerario  
❌ **NO sincronizar** servidor y cliente (son intencionalmente diferentes)  

---

## 📊 Datos de Prueba

### Ejemplo: Salamanca → Paris

**Servidor devuelve (debugResponse):**
```json
{
  "dailyItinerary": [
    { "day": 1, "from": "Salamanca", "to": "Burgos", "distance": 253.7 },
    { "day": 2, "from": "Burgos", "to": "Parada Táctica", "distance": 253.7 },
    // ... (puede no coincidir con mapa)
  ]
}
```

**Cliente calcula (segmentationData):**
```json
{
  "points": [
    { "day": 1, "distance": 253.7, "cityName": "Pancorbo" },
    { "day": 2, "distance": 253.7, "cityName": "Burdeos" },
    // ... (coincide 100% con mapa)
  ],
  "startCity": "Salamanca",
  "endCity": "París"
}
```

**Itinerario muestra:** datos del cliente (segmentationData)

---

## 📝 Notas de Implementación

### Geocoding Inverso

Se usa para obtener nombres de ciudades desde coordenadas:
```javascript
geocoder.geocode({ location: { lat, lng } }, (results, status) => {
  const cityName = results[0].address_components
    .find(comp => comp.types.includes('locality'))
    .long_name;
});
```

### Callback Pattern

```javascript
// MotorComparisonMaps.tsx (hijo)
useEffect(() => {
  if (segmentationPoints.length > 0 && startCityName && endCityName) {
    onSegmentationPointsCalculated(segmentationPoints, startCityName, endCityName);
  }
}, [segmentationPoints, startCityName, endCityName]);

// page.tsx (padre)
onSegmentationPointsCalculated={(points, startCity, endCity) => {
  setSegmentationData({ points, startCity, endCity });
}}
```

---

## 🎯 Próximos Pasos (Futuros)

Si en el futuro necesitas extender funcionalidad:

1. ✅ Añadir waypoints → Modificar `actions.ts` y probar
2. ✅ Cambiar distancia máxima (300km) → Constante en ambos archivos
3. ✅ Añadir más mapas → Modificar layout en `page.tsx`
4. ✅ Exportar itinerario → Leer `state.segmentationData`

---

## 🔒 Backup

Si algo sale mal, restaurar estos archivos desde este commit:
```bash
git log --oneline | grep "MOTOR V1 ESTABLE"
git checkout <commit-hash> -- app/motor/
```

---

**Mantenedor:** GitHub Copilot + Usuario  
**Última actualización:** 06/12/2025  
**Estado:** ✅ PRODUCCIÓN - VERSIÓN ESTABLE
