# ✅ TODO LISTO PARA PRUEBAS - RESUMEN DE PREPARACIÓN

> Nota: actualización menor para redeploy (Preview/testing) 11 DIC 2025.

**Fecha:** 10 DIC 2025
**Versión:** Logging System v1.0
**Estado:** ✅ DEPLOYADO EN TESTING

---

## 🎯 QUÉ SE HA PREPARADO

### **1️⃣ Sistema de Logging Centralizado**
**Archivo:** `app/utils/api-logger.ts` (280 líneas)

```typescript
// Funcionalidades:
✅ Singleton pattern (una instancia global)
✅ Tracking automático de sesiones
✅ Logging de cada API call:
   - Timestamp
   - URL/Request
   - Response data
   - Duration (ms)
   - Status
   - Coste (€)
   - Cache status (hit/miss)

✅ Almacenamiento en localStorage
✅ Métodos de análisis:
   - getReport() → JSON estructurado
   - printReport() → Consola con tablas bonitas
   - exportJSON() → Para análisis externo
```

### **2️⃣ Integración en Servidor (actions.ts)**

**Cambios realizados:**
- ✅ Importado `apiLogger`
- ✅ `startTrip()` al inicio de cada viaje
- ✅ Logging de Google Directions API (con timing)
- ✅ Logging de Google Geocoding (cache hit/miss)
- ✅ `endTrip()` al finalizar
- ✅ Mensajes en debugLog apuntando a consola

**Total:** +30 líneas de logging inteligente

### **3️⃣ Integración en Cliente (useWeather.ts)**

**Cambios realizados:**
- ✅ Importado `apiLogger`
- ✅ Timing de Open-Meteo API
- ✅ Logging de cada request Weather
- ✅ Captura de datos meteorológicos

**Total:** +15 líneas de logging

### **4️⃣ Plan de Pruebas (PLAN_PRUEBAS_3_VIAJES.md)**

**Documento completo con:**
- ✅ 3 casos de prueba (Corto, Mediano, Largo)
- ✅ Parámetros exactos para cada viaje
- ✅ APIs esperadas por viaje
- ✅ Costes estimados vs reales
- ✅ Instrucciones paso a paso
- ✅ Qué buscar en Network tab
- ✅ Scripts de análisis finales
- ✅ Tiempo estimado (10 minutos)

---

## 📊 ARQUITECTURA DE LOGGING

```
┌─────────────────────────────────────────┐
│      User hace viaje en Testing         │
│  (Madrid → Barcelona + waypoints)       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    getDirectionsAndCost() server         │
│  ├─ apiLogger.startTrip()              │
│  ├─ Google Directions API call          │
│  │  └─ apiLogger.logDirections()       │
│  ├─ Para cada parada táctica:          │
│  │  ├─ Google Geocoding API            │
│  │  └─ apiLogger.logGeocoding()        │
│  └─ apiLogger.endTrip()                │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      useWeather() hook (client)          │
│  ├─ Para cada día:                      │
│  │  ├─ Open-Meteo API call             │
│  │  └─ apiLogger.logWeather()           │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    localStorage: api-logger-session-v1  │
│  ├─ sessionId                           │
│  ├─ trips[]                             │
│  │  ├─ tripId, origin, destination      │
│  │  └─ calls[] (todas las API calls)    │
│  └─ Análisis: apiLogger.printReport()   │
└─────────────────────────────────────────┘
```

---

## 🔍 QUÉ DATOS CAPTURA

### **Por cada API Call:**
```json
{
  "id": "call-1733846400000-abc123",
  "timestamp": "2025-12-10T20:00:00Z",
  "api": "google-directions",
  "method": "GET",
  "url": "https://maps.googleapis.com/maps/api/directions/json?...",
  "requestSize": 125,
  "requestData": { "origin": "Madrid", "destination": "Barcelona", "waypoints": [...] },
  "responseSize": 45678,
  "responseData": { "status": "OK", "routesCount": 1, "legsCount": 2, "totalDistance": 600000 },
  "duration": 342,
  "status": "OK",
  "cost": 0.015,
  "cached": false,
  "notes": "1 llamada por viaje. Waypoints: 2"
}
```

### **Por cada Trip (Viaje):**
```json
{
  "tripId": "trip-1733846400000",
  "startTime": "2025-12-10T20:00:00Z",
  "endTime": "2025-12-10T20:00:15Z",
  "origin": "Madrid",
  "destination": "Barcelona",
  "waypoints": 2,
  "calls": [... array de calls ...],
  "totalCost": 0.045,
  "cacheHits": 2
}
```

### **Por cada Session:**
```json
{
  "sessionId": "session-1733846400000",
  "startTime": "2025-12-10T20:00:00Z",
  "trips": [
    { trip 1 },
    { trip 2 },
    { trip 3 }
  ]
}
```

---

## 🚀 CÓMO USAR DESPUÉS DE CADA VIAJE

### **En la consola del navegador (F12):**

```javascript
// 1. Ver reporte formateado (RECOMENDADO)
apiLogger.printReport();

// 2. Obtener datos JSON para análisis
const report = apiLogger.getReport();
console.log(report);

// 3. Exportar completo para guardar
const json = apiLogger.exportJSON();
copy(json);  // Copiar al clipboard
// Pega en archivo .json

// 4. Acceder a datos específicos
// Trips del viaje actual
const trips = apiLogger.session.trips;

// Total de llamadas en sesión
const totalCalls = apiLogger.session.trips.reduce((s, t) => s + t.calls.length, 0);

// Total de coste
const totalCost = apiLogger.session.trips.reduce((s, t) => s + t.totalCost, 0);

// Cache hit rate
const cacheHits = apiLogger.session.trips.flatMap(t => t.calls).filter(c => c.cached).length;
const hitRate = (cacheHits / totalCalls * 100).toFixed(1) + '%';
```

---

## 📋 CHECKLIST ANTES DE EMPEZAR

Cuando vuelvas, antes de hacer los viajes:

- [ ] Abre https://cara-cola-viajes-pruebas-git-testing-caracola.vercel.app/
- [ ] Abre F12 (DevTools)
- [ ] Ve a tab "Application" → localStorage
- [ ] Ejecuta: `localStorage.clear()` en consola
- [ ] Recarga la página (Ctrl+R)
- [ ] Abre Network tab
- [ ] Listo para viaje 1

---

## 📖 DOCUMENTOS DISPONIBLES

| Archivo | Propósito |
|---------|-----------|
| `PLAN_PRUEBAS_3_VIAJES.md` | Instrucciones paso a paso |
| `ANALISIS_PROFUNDO_5_APIS.md` | Análisis técnico de cada API |
| `APIS_USADAS_COMPLETO.md` | Verificación del código |
| `app/utils/api-logger.ts` | Sistema de logging |

---

## ⏱️ TIMELINE ESTIMADO

**Cuando regreses:**
1. Abre testing + DevTools (1 min)
2. Viaje 1 (Corto) (2 min)
3. Viaje 2 (Mediano) (2 min)
4. Viaje 3 (Largo) (3 min)
5. Análisis y conclusiones (2 min)

**Total:** ~10 minutos

---

## 🎯 OBJETIVO

Al terminar estas pruebas, tendrás:

✅ **Número exacto de llamadas a cada API** (Network tab + logs)
✅ **Datos exactos que obtiene cada API** (request/response)
✅ **Coste real de cada viaje** (apiLogger.getReport())
✅ **Funcionamiento del cache** (cache hits vs misses)
✅ **Validación de predicciones teóricas** (vs realidad)

---

## 💡 NOTAS TÉCNICAS

1. **Performance**: El logging es mínimo, no afecta UX
2. **Storage**: Usa ~50KB de localStorage por viaje (no es problema)
3. **Precisión**: Las métricas están en milisegundos y euros
4. **Múltiples viajes**: Puedes hacer 10+ viajes sin limpiar (acumula)
5. **Exportable**: Todos los datos se pueden exportar como JSON

---

## ✅ COMMIT INFO

```
Hash: 5bd1f0b
Mensaje: [feat] Sistema de logging automático de APIs para testing
Archivos: 6 modificados, 1805 líneas
Branch: testing
Deploy: Vercel en progreso
```

---

## 🚀 LISTA PARA PRUEBAS

El sistema está **100% listo**.

Cuando regreses:
1. Abre el documento `PLAN_PRUEBAS_3_VIAJES.md`
2. Sigue los pasos
3. Ejecuta los 3 viajes
4. Usa `apiLogger.printReport()` después de cada uno

**Tendremos respuesta concluyente a tu pregunta:**
> "¿Cuántas llamadas se hacen y a qué API? ¿Qué datos obtenemos?"

🎉 **¡A la espera de que regreses!**
