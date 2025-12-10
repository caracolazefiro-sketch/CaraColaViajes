# 🧪 PLAN DE PRUEBAS - ANÁLISIS DE APIs

## 📋 RESUMEN EJECUTIVO

Vamos a hacer **3 viajes diferentes** para ver cómo cambian las llamadas a APIs según:
- Distancia y número de waypoints
- Si usamos cache (segundo viaje reutiliza datos del primero)
- Tipos de paradas (tácticas vs waypoints)

Cada viaje será **monitorizado en tiempo real** con:
- Network tab (F12)
- Console logs (debugLog)
- localStorage (apiLogger)

---

## 🎯 VIAJE 1: Corto con pocos waypoints (Sin cache previo)

### Parámetros:
```
Origen:        Madrid
Destino:       Barcelona
Waypoints:     Valencia, Tarragona
kmMaximoDia:   400 km
Distancia est: ~600 km
Días est:      2-3 días
```

### ¿Por qué?
- Viaje **corto** = pocas paradas tácticas
- **Sin cache previo** = todas las llamadas a Geocoding pagarán
- Pocos waypoints = Directions API simple

### APIs Esperadas:
| API | Llamadas | Coste esperado |
|-----|----------|----------------|
| Google Directions | 1 | €0.015 (1 + 2 waypoints) |
| Google Geocoding | 2-4 | €0.010-€0.020 |
| Open-Meteo | 4-6 | €0.00 ✅ |
| Google Maps Embed | 1 | €0.00 ✅ |
| **Total** | **8-12 calls** | **€0.025-€0.035** |

### Resultados a observar:
```javascript
// En consola después de viaje:
apiLogger.printReport()

// Debería mostrar:
// - 1 Directions call
// - 2-4 Geocoding calls (todas MISS, 0% cache hit)
// - 4-6 Weather calls
// - Coste: €0.025-€0.035
```

---

## 🎯 VIAJE 2: Largo con muchos waypoints (CON cache del viaje 1)

### Parámetros:
```
Origen:        Madrid
Destino:       Barcelona
Waypoints:     Valencia, Tarragona, Girona, Manresa
kmMaximoDia:   300 km
Distancia est: ~600 km
Días est:      3 días
```

### ¿Por qué?
- **Reutiliza algunas ciudades del viaje 1** (Valencia, Tarragona, Barcelona)
- Más waypoints = ruta más compleja
- **Con cache** = veremos cache hits en acción

### APIs Esperadas:
| API | Llamadas | Coste esperado |
|-----|----------|----------------|
| Google Directions | 1 | €0.025 (1 + 4 waypoints) |
| Google Geocoding | 4-6 | €0.000-€0.015 (mixto cache) |
| Open-Meteo | 6-8 | €0.00 ✅ |
| Google Maps Embed | 1 | €0.00 ✅ |
| **Total** | **12-16 calls** | **€0.025-€0.040** |

### Resultados a observar:
```javascript
// En consola:
apiLogger.printReport()

// Debería mostrar:
// - 1 Directions call
// - 4-6 Geocoding calls
//   - Barcelona: CACHE HIT ✅ (del viaje anterior)
//   - Valencia: CACHE HIT ✅ (del viaje anterior)
//   - Tarragona: CACHE HIT ✅ (del viaje anterior)
//   - Nuevas ciudades: MISS ❌ (pagan €0.005)
// - Cache hit rate: ~50%
// - Coste total: €0.025-€0.040 (menos que viaje 1 sin cache)
```

---

## 🎯 VIAJE 3: Muy largo con muchos waypoints (MÁXIMO stress test)

### Parámetros:
```
Origen:        Madrid
Destino:       Bilbao
Waypoints:     Valencia, Sevilla, Córdoba, Jaén, Úbeda, Baeza, Linares, Ciudadreal, Toledo, Cuenca, Guadalajara, Soria, Aranda, Burgos
kmMaximoDia:   250 km
Distancia est: ~1400 km
Días est:      6-7 días
```

### ¿Por qué?
- Distancia **larga** = muchas paradas tácticas
- **Muchos waypoints** = máxima carga de Directions
- **Cache mixto** = veremos alto porcentaje de cache hits
- **Máximas paradas tácticas** = máximo geocoding

### APIs Esperadas:
| API | Llamadas | Coste esperado |
|-----|----------|----------------|
| Google Directions | 1 | €0.075 (1 + 14 waypoints) |
| Google Geocoding | 15-25 | €0.000-€0.075 (con cache) |
| Open-Meteo | 12-16 | €0.00 ✅ |
| Google Maps Embed | 1 | €0.00 ✅ |
| **Total** | **29-43 calls** | **€0.075-€0.150** |

### Resultados a observar:
```javascript
// En consola:
apiLogger.printReport()

// Debería mostrar:
// - 1 Directions call = €0.075
// - 15-25 Geocoding calls
//   - Muchas ciudades: CACHE HIT ✅ (de viajes anteriores)
//   - Pocas nuevas: MISS ❌
// - Cache hit rate: ~80-90%
// - Coste geocoding: bajo (muchos hits)
// - Coste total: €0.075-€0.150
```

---

## 📊 INSTRUCCIONES PARA EJECUTAR

### **ANTES DE EMPEZAR:**

1. **Abre la página de testing:**
   ```
   https://cara-cola-viajes-pruebas-git-testing-caracola.vercel.app/
   ```

2. **Abre DevTools (F12):**
   - Tab: Network
   - Tab: Console
   - Tab: Application → localStorage

3. **Limpia los datos previos:**
   ```javascript
   // En consola:
   localStorage.clear();
   ```

---

### **VIAJE 1 (Corto):**

1. **Llenar formulario:**
   - Origen: `Madrid`
   - Destino: `Barcelona`
   - Waypoints: `Valencia`, `Tarragona`
   - kmMaximoDia: `400`

2. **Click "Calcular viaje"**

3. **Observar en Network tab:**
   - Filtrar por `maps.googleapis.com`
   - Filtrar por `open-meteo.com`
   - Anotar número de requests

4. **Cuando termine, ejecutar en consola:**
   ```javascript
   // Mostrar reporte
   apiLogger.printReport();
   
   // Exportar JSON para análisis
   const report = apiLogger.exportJSON();
   console.log(report);
   ```

5. **Guardar resultado:**
   - Screenshot de console
   - O copy/paste del JSON

---

### **VIAJE 2 (Mediano con cache):**

1. **NO limpiar localStorage** (mantener cache del viaje 1)

2. **Llenar formulario:**
   - Origen: `Madrid`
   - Destino: `Barcelona`
   - Waypoints: `Valencia`, `Tarragona`, `Girona`, `Manresa`
   - kmMaximoDia: `300`

3. **Repetir pasos 2-5 del viaje 1**

4. **Comparar:**
   - Cache hit rate debería ser **mayor que viaje 1**
   - Coste geocoding debería ser **menor**

---

### **VIAJE 3 (Largo - stress test):**

1. **NO limpiar localStorage**

2. **Llenar formulario:**
   - Origen: `Madrid`
   - Destino: `Bilbao`
   - Waypoints: `Valencia`, `Sevilla`, `Córdoba`, `Jaén`, `Úbeda`, `Baeza`, `Linares`, `Ciudadreal`, `Toledo`, `Cuenca`, `Guadalajara`, `Soria`, `Aranda`, `Burgos`
   - kmMaximoDia: `250`

3. **Repetir pasos 2-5 del viaje 1**

4. **Comparar:**
   - Total de calls debería ser **mucho mayor** que viajes 1 y 2
   - Cache hit rate debería ser **más alto** (~80-90%)
   - Coste total debería ser **intermedio** (Directions más caro, Geocoding compensado por cache)

---

## 🔍 QUÉ BUSCAR EN LOS RESULTADOS

### **Network tab:**
```
✅ Buscar:
- Número de requests a maps.googleapis.com (Directions + Geocoding)
- Número de requests a open-meteo.com (Weather)
- Tamaño de responses

Anotar:
- ¿Cuántas llamadas reales ves?
- ¿Coinciden con nuestras predicciones?
```

### **Console logs:**
```
✅ Buscar en debugLog:
- "🆔 Trip ID: ..." al inicio
- "✅ Google API Response OK" después de Directions
- "⏱️ Directions API took XXXms"
- Líneas de cada parada táctica creada
- "🔍 API Logger Report" al final

Anotar:
- Duración exacta de Directions API
- Número de paradas tácticas creadas
```

### **localStorage (Application tab):**
```
✅ Buscar:
Key: "api-logger-session-v1"

Debería contener JSON con:
{
  "sessionId": "session-...",
  "trips": [
    {
      "tripId": "trip-...",
      "calls": [
        {
          "api": "google-directions",
          "cost": 0.015,
          ...
        },
        {
          "api": "google-geocoding",
          "cached": true/false,
          "cost": 0 o 0.005,
          ...
        }
      ]
    }
  ]
}
```

---

## 📈 ANÁLISIS FINAL

Después de los 3 viajes, deberías tener:

1. **Datos concretos:**
   - Número exacto de calls a cada API
   - Duración exacta de cada call
   - Coste exacto por viaje

2. **Validación de cache:**
   - Hits vs Misses en Geocoding
   - Ahorros progresivos con reutilización

3. **Comparativa de APIs:**
   - Coste real vs estimado
   - Frecuencia real vs predicha
   - Optimizaciones confirmadas

4. **Conclusiones:**
   - ¿El cache funciona como se esperaba?
   - ¿Las predicciones de coste fueron correctas?
   - ¿Hay optimizaciones adicionales posibles?

---

## 🚀 SCRIPT DE ANÁLISIS FINAL

Después de terminar los 3 viajes, ejecutar:

```javascript
// En consola:

// 1. Obtener reporte completo
const fullReport = apiLogger.getReport();

// 2. Análisis por viaje
console.log("=== VIAJE 1 ===");
console.table(fullReport.trips[0]);

console.log("=== VIAJE 2 ===");
console.table(fullReport.trips[1]);

console.log("=== VIAJE 3 ===");
console.table(fullReport.trips[2]);

// 3. Totales
console.log("=== TOTALES ===");
console.log(`Total calls: ${fullReport.grandTotal.allCalls}`);
console.log(`Total cost: ${fullReport.grandTotal.totalCost}`);
console.log(`Cache hit rate: ${fullReport.grandTotal.cacheHitRate}`);

// 4. Exportar para guardar
copy(apiLogger.exportJSON());
// Pega en archivo .json
```

---

## ⏰ TIEMPO ESTIMADO

- Viaje 1: ~2 minutos
- Viaje 2: ~2 minutos
- Viaje 3: ~3 minutos
- Análisis: ~2 minutos

**Total: ~10 minutos de pruebas**

---

## 📝 NOTAS IMPORTANTES

1. **Los costes que veas en apiLogger son ESTIMACIONES** basadas en precios de Google
2. **Vercel + Testing** ejecuta en servidor real, pero API keys son compartidas (no afecta)
3. **Cache persiste en localStorage** entre viajes (es intencional para ver el efecto)
4. **Weather API es gratis**, así que no afecta coste total
5. **Maps Embed no hace llamadas** (solo URL), así que dicha cero costo

---

## 🎯 OBJETIVO FINAL

Al terminar estas pruebas, tendremos **prueba concluyente** de:

✅ Cuántas APIs reales se llaman  
✅ Qué datos obtiene cada una  
✅ Cuánto cuesta cada viaje  
✅ Cómo funciona el cache  
✅ Si las predicciones teóricas coinciden con lo real  

Esto responde completamente a tu pregunta original:
> "Quiero saber CON EXACTITUD:
> 1. Cuántas llamadas se hacen y a qué API
> 2. Qué datos obtenemos de cada llamada"
