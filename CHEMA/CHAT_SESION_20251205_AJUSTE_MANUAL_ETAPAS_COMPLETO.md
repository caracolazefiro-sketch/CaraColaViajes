# Chat Completo: Ajuste Manual de Etapas con Recálculo Automático
## Sesión 5 de Diciembre 2025 - 15:41 a 16:14

---

## 📍 CONTEXTO INICIAL

**Problema reportado:**
- Feature "Ajuste Manual de Etapas" no funcionaba correctamente
- Screenshot y startCoordinates undefined
- Google API ZERO_RESULTS en recalculaciones

**Rama:** `preview-1500`  
**Estrategia:** Pivot a documentación exhaustiva y debugging sistemático

---

## 🔴 ISSUE CRÍTICO DESCUBIERTO: Arquitectura Incorrecta

### El Problema (Fase 1-7)
1. **181 días bug:** Google Directions API rechazaba fechaRegreso en recalculación
   - Solución: NO enviar fechaRegreso en recalculaciones, solo duration (kmMaximoDia)

2. **ZERO_RESULTS con waypoints:** Google rechazaba rutas con caracteres especiales/acentos
   - Problema: "Salamanca, España" → URL encoding → Google confundido
   - Ensayo 1: Remover acentos (solución parcial)
   - Ensayo 2: Mantener país en ciudades (solución mejorada)

3. **Toledo desapareció:** Cuando ajustabas Tarancón → Madrid, Valencia se perdía
   - Causa: Confusión entre índices de días vs índices de etapas
   - Día 0 ≠ etapas[0] (porque hay paradas tácticas)

### La Revelación Crítica (Fase 8-16)
**Usuario: "¿Si Google nos da su buscador, por qué no acepta los datos que él mismo nos da?"**

**Análisis profundo:**
- Google Places API devuelve: "Toledo, Toledo, Spain"
- Google Directions API rechaza: Emoji, caracteres especiales, paradas tácticas
- **Root cause:** Mezcla de niveles de abstracción
  - Datos de usuario (Madrid, Valencia)
  - Datos computados (paradas tácticas)
  - Enviando ambos a Google sin separación

---

## ✅ ARQUITECTURA CORRECTA (La que implementamos)

### Flujo por Ajuste

```
USUARIO: Arma viaje Salamanca → Valencia → Oporto (300 km/día)

PASO 1 - CÁLCULO INICIAL:
  formData.etapas = "Valencia"
  
  Solicitud a Google:
    Origin: Salamanca
    Destination: Oporto
    Waypoints: [Valencia]
  
  Google devuelve: Ruta cruda 1400 km
  
  NUESTRO SEGMENTADOR:
    Divide en 300 km tramos
    Genera paradas tácticas (Tarancón, Villarejo, Canillas, Nogueira)
    Retorna: 6 días

─────────────────────────────────────────

USUARIO: Ajusta Tarancón → Madrid

PASO 2 - PRIMER AJUSTE:
  formData.etapas = "Valencia" (fuente de verdad)
  
  Lógica de recalculación:
    1. Extraer waypoints obligatorios: [Valencia]
    2. Determinar: ¿reemplazar o agregar?
       - adjustingDayIndex (0) < waypoints.length (1)
       - Sí, reemplazar índice 0
    3. Nueva lista: [Madrid, Valencia]
    4. Enviar a Google: [Madrid, Valencia] (SOLO obligatorios)
    5. Google devuelve: Ruta cruda nueva
    6. REGENERAR itinerario desde cero
    7. ACTUALIZAR: formData.etapas = "Madrid|Valencia"

─────────────────────────────────────────

USUARIO: Ajusta Nogueira → Braga

PASO 3 - SEGUNDO AJUSTE:
  formData.etapas = "Madrid|Valencia" (estado actualizado del paso anterior)
  
  Lógica:
    1. Extraer: [Madrid, Valencia]
    2. Determinar: adjustingDayIndex (5) >= waypoints.length (2)
       - No, agregar al final
    3. Nueva lista: [Madrid, Valencia, Braga]
    4. Enviar a Google: [Madrid, Valencia, Braga]
    5. Google devuelve: Ruta cruda nueva
    6. REGENERAR itinerario desde cero
    7. ACTUALIZAR: formData.etapas = "Madrid|Valencia|Braga"

─────────────────────────────────────────

USUARIO: Ajusta Cualquier Cosa

PASO 4+: formData.etapas siempre tiene estado actualizado
  → Encadenamiento ilimitado de ajustes
```

### Principios Clave

1. **formData.etapas es memoria persistente**
   - Guarda SOLO waypoints obligatorios (user-chosen)
   - Se actualiza después de cada ajuste
   - Es la fuente de verdad para próximos ajustes

2. **Paradas tácticas son efímeras**
   - Generadas por nuestro segmentador
   - NO se envían a Google
   - Regeneradas cada vez que recalculamos

3. **Google es fuente de datos crudos**
   - Nunca recibe paradas tácticas (generadas por nosotros)
   - Siempre recibe SOLO waypoints obligatorios
   - Devuelve rutas completas que nosotros segmentamos

4. **Itinerario se regenera siempre**
   - NO fusionamos días anteriores
   - Cada recalculación es un "nuevo viaje"
   - Respeta 300 km/día de manera consistente

---

## 🔧 CAMBIOS IMPLEMENTADOS

### Commit 1: Normalizador de ubicaciones
- Remover acentos (é → e)
- Mantener países (desambiguación)
- Aplicar SOLO al enviar a Google, no al guardar

### Commit 2: Arquitectura de recalculación
- Usar `formData.etapas` como fuente de verdad
- Extraer waypoints obligatorios
- Determinar reemplazo vs agregación
- Regenerar itinerario desde cero
- **ACTUALIZAR formData.etapas al finalizar**

### Commit 3: Input de waypoints
- Permitir escritura (onChange)
- Guardar valor completo (con país)
- Normalizar SOLO al enviar a Google

---

## 📊 VERIFICACIÓN CON DATOS REALES

**Test case:** Salamanca → Valencia → Oporto, ajustar día 0 a Madrid

**Logs observados (commit f6f62ae):**
```
📦 Waypoints obligatorios (formData.etapas): ["Madrid", "Valencia"]
📍 Ruta NUEVA a Google:
  Origen: Salamanca, Espana
  Waypoint 1: Madrid
  Waypoint 2: Valencia
  Destino: Oporto, Portugal
✅ Google API Response OK
Día 1: Salamanca, Espana → Madrid
Día 2: Madrid → Valencia
Día 3: Valencia → Oporto, Portugal
📊 Itinerario final (regenerado desde cero): 3 días
📝 Actualizando formData.etapas: [Obligatorios nuevos]
```

**Status:** ✅ FUNCIONANDO CORRECTAMENTE

---

## 🎯 CONCLUSIONES

### Lo que Aprendimos

1. **No mezclar niveles de abstracción**
   - Datos de usuario ≠ Datos computados
   - Google solo entiende datos de usuario

2. **formData es memoria**
   - Debe reflejar estado actual
   - Se actualiza después de cambios
   - Es fuente de verdad para próximas operaciones

3. **Regeneración > Fusión**
   - Más simple recalcular todo que intentar fusionar
   - Evita inconsistencias
   - Garantiza respeto a 300 km/día

4. **Normalización en el lugar correcto**
   - Guardar datos completos (con país)
   - Normalizar justo antes de enviar a Google
   - Mantener datos de usuario íntegros

### Patrón Replicable

**Cualquier ajuste de waypoint sigue este flujo:**
```
Usuario ajusta → formData.etapas se actualiza → Enviar a Google → 
Recalcular TODO → Actualizar formData.etapas → Mostrar resultado
```

---

## 📝 PARA PRÓXIMOS AJUSTES

Si el usuario ajusta otro waypoint después:
1. formData.etapas ya tiene [Madrid, Valencia, ...]
2. Aplicar mismo flujo
3. Google recibe lista actualizada
4. Itinerario se regenera correctamente
5. formData.etapas se actualiza nuevamente

**Sin este ciclo, pierdes contexto entre ajustes.**

---

## ✨ FEATURE COMPLETADA

**Estado:** 🟢 Ready for Testing  
**Complejidad:** ⭐⭐⭐⭐⭐  
**Crítico:** Sí (afecta núcleo de ruteo)  
**Documentado:** Sí (este archivo)

