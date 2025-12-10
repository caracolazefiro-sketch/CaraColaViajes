# ☀️ Protocolo "BUENOS DÍAS" - OPERATIVO v2.0

**Ejecutable cuando:** User escriba exactamente `BUENOS DÍAS`

**Versión:** 2.0 (Operativo + Integrado con ROADMAP)  
**Estado:** ✅ 95% Automático | 5% User decisión  
**Complemento:** PROTOCOLO_BUENAS_NOCHES.md (sistema circular)

---

## 🎯 FLUJO OPERATIVO (APERTURA DIARIA)

### PASO 1️⃣: VERIFICACIÓN AUTOMÁTICA DEL SISTEMA

**Agent automáticamente:**

```bash
# 1. Verificar rama y estado git
git branch --show-current          # Debe ser: testing
git status                         # Debe ser clean
git log --oneline -1               # Ver último commit

# 2. Verificar ambiente
npm list --depth=0 2>/dev/null | head -5  # Dependencias críticas

# 3. Limpiar cachés (automático)
Remove-Item ".\.next" -Recurse -Force -ErrorAction SilentlyContinue
npm cache verify --silent          # Verificar, no limpiar completo

# 4. Validar build sin breaking
npm run build --verbose 2>&1 | tail -20  # Ver solo errores
```

**Agent reporta:**
```
✅ Git status: testing, clean
✅ Último commit: [hash - mensaje] (X minutos ago)
✅ Build: ✅ Sin errores
✅ Dependencias: Actualizadas
```

---

### PASO 2️⃣: LECTURA DEL CONTEXTO (DE AYER)

**Agent automáticamente:**

```bash
# Leer último snapshot BUENAS NOCHES
cat CHEMA/PROTOCOLOS/BUENAS_NOCHES_*.md | tail -100

# Extraer: qué se completó, próximas prioridades, impacto
```

**Agent muestra resumen:**
```
📋 CONTEXTO DE AYER (10 DIC):
   • Archivos modificados: 2 (TripMap, useTripCalculator)
   • Commits: 1 feat (Optimization)
   • Impact: $0.002 ahorrado, 15% perf gain
   • Próxima recomendada: P1 PlaceAutocompleteElement
```

---

### PASO 3️⃣: LECTURA OPERATIVA DE ROADMAP

**Agent automáticamente:**

```bash
# Leer ROADMAP.md - secciones P1/P2
grep -A 5 "^## P1\|^## P2" ROADMAP.md

# Verificar última actualización
stat ROADMAP.md | grep Modify
```

**Agent genera PROPUESTA INTELIGENTE:**

```
🎯 OPCIONES HOY (basado en ROADMAP + contexto ayer):

┌─────────────────────────────────────────────────────────────┐
│ OPCIÓN A (RECOMENDADA): P1 🔴 PlaceAutocompleteElement    │
│ • Tiempo: 2-3h                                              │
│ • Impacto: 🔒 SECURITY (crítica)                           │
│ • Razón: Ayer hiciste prep en P2, hoy seguridad primero   │
│ • Status: Not started                                       │
│                                                              │
│ OPCIÓN B: Terminar P2 🟠 Nominatim en Geocoding           │
│ • Tiempo: 15 min (pequeño)                                 │
│ • Impacto: 💰 -$0.005 por call                             │
│ • Razón: Momentum de ayer (prep completada)                │
│ • Status: In progress                                       │
│                                                              │
│ OPCIÓN C: Comenzar P2 🟠 Option B Cache                    │
│ • Tiempo: 2-3 sem                                           │
│ • Impacto: 💰 $0.032→$0.00 (mayor ahorro)                 │
│ • Razón: Estratégico, gran impacto                         │
│ • Status: Planned                                           │
└─────────────────────────────────────────────────────────────┘

¿Cuál prefieres hoy?
(A / B / C / Otro)
```

---

### PASO 4️⃣: DIÁLOGO INTELIGENTE (USER ELIGE)

**Agent espera user response:**

```
User: "A" (o "B" o "C" o descripción libre)

Agent responde:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PLAN PARA HOY

🎯 Prioridad: P1 🔴 PlaceAutocompleteElement

📊 Contexto:
   • Esfuerzo: ⭐⭐ (2-3h estimado)
   • Impacto: Security (CVE mitigation)
   • ROADMAP status: Not started
   • Preparación: Ninguna necesaria (desde cero)

💡 Sugerencia de flujo:
   1. Leer código actual (PlaceAutocompleteElement)
   2. Analizar CVE/security issue
   3. Diseñar migración + tests
   4. Implementar
   5. Validar seguridad

🔗 Recurso: Ver ROADMAP.md línea 98 para detalles

Listo para empezar? (SÍ / Cambiar / Preguntas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### PASO 5️⃣: CONTEXTO OPERATIVO (SETUP FINAL)

**Si user dice "SÍ":**

```bash
# Agent prepara ambiente inteligente:

# 1. Si es feat/refactor, iniciar rama local
#    (opcional, depende de cambio)

# 2. Abrir archivos clave automáticamente
#    (si aplica)

# 3. Mostrar checklist inicial
```

**Agent muestra:**

```
🚀 SETUP COMPLETADO

📁 Archivos clave para hoy:
   └─ Buscar: app/components/*PlaceAutocompleteElement*
   └─ Revisar: ROADMAP.md línea 98 (descripción)
   └─ Tests: app/test-* (si existen)

✅ Sistema listo:
   • VS Code configurado
   • Build: Verde (sin errores)
   • Git: testing branch, limpio
   • ROADMAP: Leído y alineado

⏰ Sesión abierta:
   • Hora inicio: [timestamp]
   • Prioridad: P1 PlaceAutocompleteElement
   • Próximo: BUENAS NOCHES recopilará resultados

💬 Durante el día:
   • Menciona "A ROADMAP [idea]" para actualizar ROADMAP
   • Avísame con "CHECK" si necesitas validación
   • Finalizamos con "BUENAS NOCHES"

¡Vamos! 🚀
```

---

## 🔗 INTEGRACIÓN CON ROADMAP

El protocolo BUENOS DÍAS **depende de ROADMAP:**

```
ROADMAP.md (Estado global)
    ↓
BUENOS DÍAS (Lee ROADMAP, sugiere prioridad)
    ↓
TRABAJO (User trabaja en tarea sugerida)
    ↓
"A ROADMAP" trigger (Durante trabajo, usuario menciona)
    ↓
BUENAS NOCHES (Cierra sesión, actualiza ROADMAP)
```

**Clave:** ROADMAP es el "director de orquesta" que coordina ambos protocolos.

---

## ⚡ RESOLUCIÓN DE PROBLEMAS

### ❌ Problema: Build Falla
```bash
Agent automáticamente:
  1. npm run lint --fix
  2. npm run build
  3. Si persiste: Remove-Item node_modules -Recurse; npm install
  4. Mostrar errores al user
```

### ❌ Problema: Rama Incorrecta
```bash
Agent automáticamente:
  1. Detecta rama ≠ testing
  2. Advierte: "⚠️ Rama no es testing, ¿switchear?"
  3. git checkout testing (si user aprueba)
```

### ❌ Problema: Cambios Pendientes
```bash
Agent automáticamente:
  1. Detecta archivos no commiteados de sesión anterior
  2. Advierte: "⚠️ Cambios pendientes: [lista]"
  3. Ofrece: stash / add / cancelar
```

---

## 📊 CHECKLIST RÁPIDO (POST-BUENOS DÍAS)

| Verificación | Status | Acción |
|---|---|---|
| Git rama | testing ✅ | Listo |
| Build | Sin errores ✅ | Listo |
| ROADMAP leído | ✅ | Prioridad sugerida |
| User elige prioridad | ✅ | Setup completado |
| Contexto claro | ✅ | Trabajo puede comenzar |

---

## 🎯 FLUJO VISUAL RESUMEN

```
┌──────────────────────────────────────────────────────┐
│          ☀️  BUENOS DÍAS (Protocolo Apertura)        │
├──────────────────────────────────────────────────────┤
│                                                       │
│ 1️⃣  VERIFICACIÓN AUTOMÁTICA (Sistema)               │
│     git status, build, dependencias                  │
│                                                       │
│ 2️⃣  CONTEXTO DE AYER (BUENAS NOCHES prev)          │
│     Qué se hizo, impacto, recomendación              │
│                                                       │
│ 3️⃣  LECTURA ROADMAP (P1/P2/P3)                     │
│     3 opciones inteligentes basadas en estrategia    │
│                                                       │
│ 4️⃣  USER ELIGE (A/B/C)                              │
│     Agent confirma y muestra plan detallado          │
│                                                       │
│ 5️⃣  SETUP FINAL (Contexto + checklist)              │
│     Listo para trabajar                              │
│                                                       │
│        ↓                                              │
│        💼 USER TRABAJA (con "A ROADMAP" triggers)    │
│        ↓                                              │
│        🌙 BUENAS NOCHES (cierre + actualización)     │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 📋 COMPARACIÓN: Antes vs Después

| Aspecto | v1.0 (Manual) | v2.0 (Operativo) |
|---------|---------------|------------------|
| **Automatización** | 20% | 95% |
| **Integración ROADMAP** | No | ✅ Lectura + sugerencia |
| **Contexto ayer** | Manual, olvidos | Automático (BUENAS NOCHES) |
| **Decisión inteligente** | User adivina | 3 opciones basadas en estrategia |
| **Tiempo** | 10-15 min | 2-3 min + decisión user |
| **Circular con BUENAS NOCHES** | No | ✅ Feedback loop |
| **Métrica de éxito** | Subjetiva | ROADMAP tracking |

---

## 🔄 SISTEMA CIRCULAR COMPLETO

```
BUENOS DÍAS (Apertura)
  ├─ Lee ROADMAP
  ├─ Lee BUENAS NOCHES ayer
  ├─ Sugiere 3 opciones P1/P2/P3
  └─ User elige → Setup listo

TRABAJO (Ejecución)
  ├─ User trabaja en tarea elegida
  ├─ Menciona "A ROADMAP [idea]" si hay actualizaciones
  ├─ Agent abre diálogo inteligente
  └─ Agent actualiza ROADMAP en tiempo real

BUENAS NOCHES (Cierre)
  ├─ Crea snapshot automático
  ├─ Mapea con ROADMAP (qué se completó)
  ├─ Calcula métricas ($, commits, features)
  ├─ Sugiere próxima prioridad
  └─ Updates ROADMAP para mañana

ROADMAP (Director de orquesta)
  ├─ Estado global de todas las prioridades
  ├─ Alimentado por ambos protocolos
  ├─ Source of truth para decisiones
  └─ Histórico de progreso
```

---

_Protocolo: BUENOS DÍAS_  
_Versión: 2.0 (Operativo + ROADMAP integrado)_  
_Duración: ~5 min (automático) + 1-2 min (user decisión)_  
_Frecuencia: Diaria (inicio de sesión)_  
_Complemento: PROTOCOLO_BUENAS_NOCHES.md_
