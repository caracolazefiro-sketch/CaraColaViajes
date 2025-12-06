# ✅ MOTOR MVP - Test Checklist Fase 1

## 🎯 Objetivo Fase 1
Validar flujo básico: Origen → Destino → Itinerario → Mapa

---

## 📋 Test Cases

### 1. Carga de Página
- [ ] Página `/motor` carga sin errores
- [ ] Google Maps carga correctamente
- [ ] Se ve panel de búsqueda + mapa

### 2. Inputs de Búsqueda
- [ ] Input Origen acepta texto
- [ ] Autocomplete Google aparece para Origen
- [ ] Input Destino acepta texto
- [ ] Autocomplete Google aparece para Destino
- [ ] Botón Calcular disponible

### 3. Validación
- [ ] Click Calcular sin llenar → Mostrar error
- [ ] Error desaparece cuando se llenan campos
- [ ] Mensaje error: "Por favor completa origen y destino"

### 4. Cálculo de Ruta (Simple)
**Ruta de test:** Madrid → Barcelona

- [ ] Click Calcular → `loading = true`
- [ ] Spinner/Loading visible
- [ ] Google Directions API llamada
- [ ] Respuesta OK (no errores)
- [ ] `loading = false`

### 5. Itinerario
- [ ] Tabla muestra días
- [ ] Columnas correctas: Día, Fecha, De, A, Distancia, Km
- [ ] Días > 1 (ruta es larga)
- [ ] Distancia por día ≤ 300km (si funciona segmentación)

### 6. Mapa
- [ ] Mapa actualiza cuando hay itinerario
- [ ] Markers visibles (origen verde, destino rojo)
- [ ] Markers intermedios azules
- [ ] Zoom correcto a bounds de ruta

### 7. Errores
- [ ] Si falla Google API → Mostrar error bonito
- [ ] Error desaparece si vuelves a intentar
- [ ] Console logs útiles (DEBUG)

---

## 🧪 Ruta de Test Recomendada

```
Test 1: Madrid → Barcelona
  - Distancia: ~620 km
  - Espera: 2 días
  - Verifica: markers en mapa, tabla con 2 días

Test 2: Salamanca → Valencia
  - Distancia: ~480 km  
  - Espera: 2 días
  - Verifica: segmentación correcta

Test 3: Error handling
  - Intenta: "xyzabcd" → "qwerty123"
  - Espera: Error de Google
  - Verifica: Mensaje error visible
```

---

## 📝 Logs a Verificar

En consola del navegador:
```
🚀 MOTOR: Calculando ruta
  Origen: Madrid
  Destino: Barcelona
✅ MOTOR: Ruta calculada exitosamente
  Días: 2
  Distancia total: 620 km
```

---

## ✨ Criterios de Aceptación Fase 1

| Criterio | ✅ / ❌ | Notas |
|----------|--------|-------|
| Página carga sin errores | | |
| Autocomplete funciona | | |
| Validación básica OK | | |
| Google API llamada correctamente | | |
| Itinerario se renderiza | | |
| Mapa se actualiza | | |
| Error handling visible | | |

---

## 🐛 Bugs Conocidos / A Verificar

- [ ] Autocomplete puede no mostrar si API key incorrecta
- [ ] Si Google API rate limit → Error "OVER_QUERY_LIMIT"
- [ ] Segmentación puede fallar en rutas muy largas (> 1000km)
- [ ] Markers pueden no aparecer si coordinates null

---

**Fecha de Test:** 2025-12-06
**Rama:** motor-mvp
**Vercel URL:** (pendiente - se creará automáticamente)

---

Actualizar este archivo conforme avanzan los tests.
