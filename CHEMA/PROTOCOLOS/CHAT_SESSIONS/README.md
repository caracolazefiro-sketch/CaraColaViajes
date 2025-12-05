# 📁 Sistema de Guardado de Sesiones

## 📂 Estructura

```
CHEMA/PROTOCOLOS/
├── PROTOCOLO_BUENOS_DIAS.md          ← Checklist matutino
├── PROTOCOLO_BUENAS_NOCHES.md        ← Protocolo noche (actualizado)
├── PROTOCOLO_OPTIMIZAR.md             ← Optimización sistema
├── CHAT_SESSIONS/                     ← 📝 NUEVO
│   ├── CHAT_SESSION_20251203.md       ← Solo si hay debugging complejo
│   ├── CHAT_SESSION_20251204.md       ← Conversación importante
│   └── README.md                       ← Este archivo
├── INFORMES_BUENAS_NOCHES/            ← 📊 Diarios
│   ├── INFORME_20251203.md            ← Auto-generado cada noche
│   ├── INFORME_20251204.md
│   └── INFORME_20251205.md
```

## 📋 Tipos de Archivos

### `INFORME_BUENAS_NOCHES/INFORME_YYYYMMDD.md`
**Generación:** Automática cada noche (protocolo BUENAS NOCHES)  
**Contenido:** Siempre los mismos 9 apartados
```
1️⃣ HITS DEL DÍA (successes, features, bug fixes)
2️⃣ PROBLEMAS DETECTADOS (bugs, issues, errors)
3️⃣ PENDIENTES CRÍTICOS (high priority tasks)
4️⃣ PENDIENTES NORMALES (normal priority tasks)
5️⃣ IDEAS BACKLOG (ideas no implementadas)
6️⃣ AUTOEVALUACIÓN DEL AGENTE (self-eval + metrics)
7️⃣ COMMITS DEL DÍA (list all commits)
8️⃣ ARCHIVOS MODIFICADOS (table of changed files)
9️⃣ ESTADO FINAL (branch, build status, metrics)
```
**Ubicación:** `CHEMA/PROTOCOLOS/INFORMES_BUENAS_NOCHES/`  
**Nombrado:** `INFORME_YYYYMMDD.md` (una por día)

### `CHAT_SESSIONS/CHAT_SESSION_YYYYMMDD.md`
**Generación:** Manual, SOLO CUANDO APLICA  
**Casos de uso:**
- ✅ Debugging extenso con root cause analysis
- ✅ Refactoring arquitectónico significativo
- ✅ Algoritmo complejo que requiere explicación detallada
- ✅ Conversación técnica importante para continuidad

**Contenido flexible:** Adaptar al tipo de sesión
```
- Resumen ejecutivo
- Objetivos de la sesión
- Resultados completados / no completados
- Root causes identificadas (si aplica)
- Cambios técnicos (código, arquitectura)
- Próximas acciones prioritarias
- Métricas (commits, bugs, features)
- Timeline y duración
```
**Ubicación:** `CHEMA/PROTOCOLOS/CHAT_SESSIONS/`  
**Nombrado:** `CHAT_SESSION_YYYYMMDD.md`  
**Frecuencia:** ~2-3 veces por semana (si hay sesiones complejas)

## 🔄 Flujo Diario

### Inicio de Sesión (BUENOS DÍAS)
1. Leer INFORME de ayer: `INFORMES_BUENAS_NOCHES/INFORME_*.md`
2. Revisar CHAT_SESSION si existe: `CHAT_SESSIONS/CHAT_SESSION_*.md`
3. Verificar pendientes del día anterior
4. Comenzar trabajo

### Fin de Sesión (BUENAS NOCHES)
1. Generar `INFORME_BUENAS_NOCHES` automático (9 secciones fijas)
2. Crear `CHAT_SESSION` si aplica (sesión compleja)
3. Git commit + push testing
4. Mostrar resumen en chat

## 📊 Ejemplo de Flujo Completo

**04/12/2025 Sesión:**
- Debugging extenso → Genera CHAT_SESSION_20251204.md + INFORME_20251204.md
- Commits: 12
- Status: Bugs encontrados pero no todos resueltos

**05/12/2025 (Hoy):**
- Leer INFORME_20251204.md (hits, bugs, pendientes)
- Leer CHAT_SESSION_20251204.md (entender root causes)
- Continuar donde se dejó (fijar marcadores A, B, C, D)
- Al terminar: Generar INFORME_20251205.md

## ✅ Ventajas del Sistema

| Aspecto | Ventaja |
|---------|---------|
| **Consistencia** | Informes siempre tienen misma estructura |
| **Continuidad** | Cada día sabe dónde se quedó ayer |
| **Documentación** | Root causes guardados para referencia futura |
| **Git clean** | Solo archivos relevantes en repo |
| **Escalabilidad** | Fácil buscar sesiones antiguas por fecha |

## 📝 Ejemplo: Crear CHAT_SESSION

```markdown
# 💬 CHAT SESSION - 04/12/2025

## 📌 Resumen Ejecutivo
[Párrafo de 2-3 líneas sobre qué se hizo]

## 🎯 Objetivos Sesión
1. [Objetivo 1]
2. [Objetivo 2]
3. [Objetivo 3]

## 📊 Resultados
### ✅ COMPLETADO
- Punto 1
- Punto 2

### ❌ NO RESUELTO
- Punto 1 (razón)
- Punto 2 (razón)

## 🔧 Cambios Técnicos
[Detalles de código modificado, arquitectura, etc.]

## 🚀 Próximas Acciones (Prioridad)
1. [CRÍTICO]: [Tarea]
2. [ALTO]: [Tarea]
3. [NORMAL]: [Tarea]

---
**Documentado para continuidad de próxima sesión**
```

## 🎯 Reglas Clave

1. ✅ **INFORME_BUENAS_NOCHES:** Crear SIEMPRE cada noche (estructura fija)
2. ⚠️ **CHAT_SESSION:** Crear SOLO si hay debugging complejo o cambios arquitectónicos
3. 🔒 **Ubicación:** Respetar carpetas (CHAT_SESSIONS/ e INFORMES_BUENAS_NOCHES/)
4. 📅 **Nombres:** Usar formato `YYYYMMDD` consistentemente
5. 📋 **Git:** Incluir en commits de protocolo BUENAS NOCHES

---

_Última actualización: 05/12/2025_
