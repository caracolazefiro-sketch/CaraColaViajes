# 🌙 Protocolo "BUENAS NOCHES" - OPERATIVO v2.0

**Ejecutable cuando:** User escriba exactamente `BUENAS NOCHES`

**Versión:** 2.0 (Operativo + Integrado con ROADMAP)  
**Estado:** ✅ 90% Automático | 10% User aprobación

---

## 🎯 FLUJO OPERATIVO (FASE 1)

### PASO 1️⃣: DETECCIÓN AUTOMÁTICA
```bash
Agent automáticamente:
  ├─ Ejecuta: git status
  ├─ Detecta archivos modificados
  ├─ Extrae: últimos 5 commits (git log -1)
  └─ Calcula: LOC changes, tipos de cambio (feat/fix/docs)
```

### PASO 2️⃣: SNAPSHOT INTELIGENTE (NUEVO)
Agent crea archivo: `BUENAS_NOCHES_YYYYMMDD.md` con:

```markdown
# 🌙 BUENAS NOCHES - [FECHA Y HORA]

## 📊 SESIÓN METRICS
- Duración: [Detectada automáticamente]
- Commits realizados: N
- Archivos modificados: N
- Líneas cambiadas: +N -N

## 🎯 ROADMAP TRACKING (INTEGRACIÓN)
Agent pregunta al user:
"¿Qué ideas del ROADMAP completaste hoy?"
  - [ ] P1 🔴 Migrar PlaceAutocompleteElement
  - [ ] P2 🟠 Nominatim en Geocoding
  - [ ] P2 🟠 Option B: Caché Nominatim+localStorage
  - [ ] P3 🟡 Expandir caché Places
  - [ ] Otro (describir):

## 💡 CAMBIOS REALIZADOS
- [Auto-lista archivos modificados]
- [Auto-extrae commits]

## 💰 IMPACTO ESTIMADO
- API calls evitados: N
- $ ahorrado (estimado): $X.XX
- Bugs cerrados: N
- Features completadas: N

## 📍 PRÓXIMA PRIORIDAD (SUGERENCIA)
Agent sugiere (basado en ROADMAP.md):
"Mañana con BUENOS DÍAS, podría empezar con: [P1/P2]"

## 🔄 GIT SUMMARY
- Branch: testing
- Status: Clean/Cambios pendientes
- Último commit: [hash - mensaje]
```

### PASO 2.5️⃣: REVISIÓN DIARIA “PORTERO DE APIS” (OBLIGATORIO)

**Objetivo:** evitar “llamadas sorpresa” (cliente) y mantener coherencia de cachés/logs (server).

1) Abrir y leer el documento base:
- CHEMA/ANALISIS/OPTIMIZACION APIS Y PORTERO.md

2) Comprobar si en la sesión se han tocado archivos críticos (si hay cambios, hay que actualizar el documento):
```bash
git diff --name-only HEAD~20..HEAD

# Si aparece alguno de estos, revisar y actualizar el documento:
# - app/actions.ts
# - app/hooks/useTripCalculator.ts
# - app/hooks/useTripPlaces.ts
# - app/components/TripForm.tsx
# - app/utils/supabase-cache.ts
# - app/utils/server-logs.ts
# - app/api/**

# Ver el diff concreto (ejemplos):
git diff HEAD~20..HEAD -- app/actions.ts
git diff HEAD~20..HEAD -- app/hooks/useTripCalculator.ts
```

3) Consejos automáticos (si detectas cambios):
- Si hay cambios en cliente (`useTripCalculator` / `page.tsx`): revisar riesgo de Geocoder sin caché y proponer mitigación.
- Si hay cambios en server (`actions.ts` / `supabase-cache.ts`): confirmar que keys/TTL/logs siguen consistentes y que el visor muestra HIT/MISS.
- Si hay cambios en Places: confirmar límite duro (4 supercats, sin paginación) y caché vigente.

### PASO 3️⃣: DIÁLOGO INTELIGENTE CON ROADMAP
```
Agent pregunta al user:
"Quieres incluir algo de esto en ROADMAP?"

Si user dice "A ROADMAP [idea]":
  ├─ Agent: "¿Bajo qué prioridad? (P1/P2/P3/P4)"
  ├─ Agent: "¿Estado? (En progreso/Completada)"
  ├─ Agent: "¿Dónde agregar exactamente?"
  └─ Agent: [Actualiza ROADMAP.md automáticamente]

Si user dice "SÍ" (aprobación general):
  ├─ Agent: [Usa detección automática]
  ├─ Agent: [Mapea con ROADMAP]
  └─ Agent: [Sugiere ubicación]
```

### PASO 4️⃣: GIT AUTOMÁTICO (CON APROBACIÓN)
```bash
Agent prepara:
  ├─ git add [Archivos snapshot]
  ├─ git commit -m "[auto] Sesión [FECHA]: [Resumen]"
  └─ Muestra preview al user

User aprueba con:
  "✅" → git push origin testing
  "❌" → Cancela (sin pushear)
```

### PASO 5️⃣: CONFIRMACIÓN FINAL
```
Agent muestra:
  ├─ Snapshot creado: ✅ BUENAS_NOCHES_[FECHA].md
  ├─ ROADMAP actualizado: [Sí/No]
  ├─ Git status: Branch testing, clean
  └─ Próxima: "Mañana BUENOS DÍAS te sugiero..."
```

---

## 🔗 INTEGRACIÓN CON ROADMAP

Cuando user dice **"A ROADMAP"**, el protocolo:

1. **Abre diálogo inteligente:**
   ```
   User: "A ROADMAP - agregamos la idea de caché"
   Agent: "¿Es una nueva idea o completa una existente?
           ¿Bajo qué prioridad? ¿Estado?"
   ```

2. **Mapea automáticamente:**
   ```
   Agent lee ROADMAP.md
   Agent identifica P1-P4 existentes
   Agent sugiere ubicación ideal
   ```

3. **Actualiza ROADMAP:**
   ```
   Agent modifica ROADMAP.md
   Agent registra fecha/hora de actualización
   Agent comitea cambios
   ```

---

## 🚨 RESTRICCIONES CRÍTICAS

| Acción | ❌ NUNCA | ✅ SIEMPRE |
|--------|---------|----------|
| **Push** | main, previews | testing |
| **Commit msg** | Vago | [auto] Sesión [FECHA]: [resumen] |
| **Build check** | Ignorar | Validar npm run build primero |
| **ROADMAP update** | Sin confirmar | Con user approval |

---

## 📝 EJEMPLO: Flujo Completo

---

## 🔒 **Restricciones CRÍTICAS**

| Acción | ❌ NUNCA | ✅ SIEMPRE |
|--------|---------|----------|
| **Push** | main, previews | testing |
| **Commit msg** | Vago, sin emoji | Descriptivo, con emoji |
| **Build** | Ignorar errores | Fijar primero |
| **Deploy** | Automático | Manual + approval |

---

## 📝 **Estructura Snapshot**

```markdown
# Chat Session - [FECHA]

## Resumen
- Problema identificado
- Solución implementada
- Resultado final

## Archivos Modificados
| Archivo | Cambios | Status |

## Commits
- Hash - Mensaje

## Estado Final
- Build: ✅/❌
- Tests: ✅/❌
- Git: rama + status
```

---

## ⏰ **Última Ejecución**

| Fecha | Status | Rama | Commits |
|-------|--------|------|---------|
| 3 Dic 2025 | ✅ | testing | 2 commits |

---

## 🎯 **Próxima Ejecución**

Cuando user escriba `BUENAS NOCHES`:
1. ✅ Leer último CHAT_SESSION_*.md
2. ✅ Crear snapshot si hay cambios nuevos
3. ✅ Hacer git add + commit + push testing
4. ✅ Validar status
5. ✅ Responder con confirmación
