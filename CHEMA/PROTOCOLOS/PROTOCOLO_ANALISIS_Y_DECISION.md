# 🔍 Protocolo "ANÁLISIS Y DECISIÓN"

**Ejecutable cuando:** User lance una pregunta técnica/de decisión sobre el proyecto

## 📋 Flujo de Respuesta

Cuando user haga una pregunta, SIEMPRE responder en este orden:

### 1️⃣ **🔍 ANALIZAR A FONDO**
- Investigar la pregunta desde múltiples ángulos
- Revisar código relevante si es necesario
- Considerar implicaciones técnicas y de arquitectura
- No asumir, verificar

**Tipo de análisis:**
- ¿Qué afecta esto?
- ¿Qué riesgos hay?
- ¿Hay dependencias?
- ¿Hay precedentes en el codebase?

### 2️⃣ **📋 RESPONDER CLARO Y DIRECTO**
- Resumen ejecutivo primero (1-2 líneas)
- Explicación técnica clara
- Evitar vaguedades
- Ir al punto

**Estructura:**
```
RESPUESTA DIRECTA:
[Tu respuesta concisa]

DETALLES TÉCNICOS:
[Explicación profunda si es necesario]

CÓDIGO/REFERENCIAS:
[Si aplica, mostrar ejemplos]
```

### 3️⃣ **⚠️ SEÑALAR RIESGOS/CONSIDERACIONES**
- Listar todos los riesgos identificados
- Indicar nivel de riesgo: 🟢 BAJO | 🟡 MEDIO | 🔴 ALTO
- Explicar mitigación si la hay
- Si no hay riesgos, indicarlo explícitamente

**Formato:**
```
⚠️ RIESGOS:
- Risk 1: [Descripción] (NIVEL)
- Risk 2: [Descripción] (NIVEL)

MITIGACIÓN:
- Acción 1
- Acción 2
```

### 4️⃣ **✅ PROPONER MEJORAS (si aplica)**
- Si veo una forma mejor de hacerlo, sugerir
- Comparar opciones si hay varias
- Incluir tabla comparativa si es complejo
- Ser honesto: "así está bien, no hay mejoras necesarias"

**Formato:**
```
OPCIONES:
A) Opción 1
   ✅ Ventajas: ...
   ❌ Desventajas: ...
   ⏱️ Esfuerzo: ...

B) Opción 2
   ✅ Ventajas: ...
   ❌ Desventajas: ...
   ⏱️ Esfuerzo: ...

RECOMENDACIÓN: Opción X por...
```

### 5️⃣ **🚀 DEJAR TODO LISTO PARA IMPLEMENTAR**
- Resumen de lo que haremos
- Confirmación de pasos a seguir
- Esperar tu OK antes de ejecutar
- Mostrar qué cambios se harán

**Formato:**
```
PLAN DE IMPLEMENTACIÓN:
1. [Paso 1] - Archivo: X
2. [Paso 2] - Archivo: Y
3. [Paso 3] - Testing: Z

⏳ TIEMPO ESTIMADO: Xh
🔄 COMMIT: [Descripción del commit]

✋ ESPERA TU OK ANTES DE EJECUTAR
```

---

## 📊 Tabla de Decisión

| Aspecto | Cómo Actuar |
|---------|------------|
| **Usuario pregunta algo vago** | Pedir aclaraciones, no asumir |
| **Hay múltiples caminos** | Listar todos con pros/cons |
| **Es de bajo riesgo** | Proponer directamente |
| **Es de alto riesgo** | Señalar warnings claros, dar opciones |
| **No hay mejoras posibles** | Decirlo explícitamente: "Está bien tal como está" |
| **Hay tradeoffs** | Mostrar tabla comparativa |

---

## 🎯 Ejemplos de Respuestas

### Ejemplo 1: Pregunta Técnica Simple
```
USER: "¿Debería agregar un índice a la tabla de usuarios?"

🔍 ANALIZAR:
- Revisar queries actuales sobre tabla usuarios
- Ver si hay N+1 queries
- Revisar performance metrics

📋 RESPUESTA:
Sí, agregar índice en email mejoraría queries de login en 40%.

⚠️ RIESGOS:
- Índice ocupa 5MB (BAJO) - mitigado con cleanup mensual

✅ MEJORA:
También sugerir índice compuesto (email, active_status) para filtros comunes.

🚀 PLAN:
1. Agregar índice email
2. Agregar índice compuesto
3. Test de performance

⏳ 30 min | ✋ OK?
```

### Ejemplo 2: Pregunta Compleja
```
USER: "¿Cómo optimizamos la búsqueda de lugares?"

🔍 ANALIZAR:
- Revisar useTripPlaces.ts
- Ver API calls actuales (Places, Overpass, OSM)
- Analizar caché session + hit rate

📋 RESPUESTA:
Hay 3 caminos. Recomendamos el A.

OPCIONES:
A) Mejorar cache + radios (3h, bajo riesgo)
B) Agregar Overpass hybrid (8h, medio riesgo)
C) Backend custom API (20h, alto riesgo)

⚠️ RIESGOS:
A) Ninguno (BAJO)
B) Nuevo vendor, testing extra (MEDIO)
C) Arquitectura mayor (ALTO)

✅ MEJORA:
Hacer A ahora + preparar B para mes 2.

🚀 PLAN:
[Detalles específicos de A]

✋ OK implementar A?
```

---

## ⏰ Última Ejecución

| Fecha | Status | Decisión |
|-------|--------|----------|
| 10 Dic 2025 | ✅ Creado | Protocolo de análisis activo |

---

## 🎯 Próxima Ejecución

User lanza pregunta → Agent sigue estos 5 pasos → User da OK → Implementación
