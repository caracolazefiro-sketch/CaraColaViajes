# 🌙 Protocolo "BUENAS NOCHES"

**Ejecutable cuando:** User escriba exactamente `BUENAS NOCHES`

## 📋 Checklist Automático

Cuando se ejecute este protocolo, realizar EN ORDEN:

### 1️⃣ **Informe de Hits y Problemas del Día**
```markdown
## 🎯 HITS (Logros del día)
- ✅ [Descripción del logro 1]
- ✅ [Descripción del logro 2]
- ✅ [Descripción del logro 3]

## 🐛 PROBLEMAS DETECTADOS
- ❌ [Problema 1]: Estado actual / impacto
- ❌ [Problema 2]: Estado actual / impacto
- ⚠️ [Problema menor]: Estado actual
```

### 2️⃣ **Temas No Resueltos**
```markdown
## 🔴 PENDIENTES CRÍTICOS
- [ ] [Tarea urgente 1]: Bloqueador / impacto
- [ ] [Tarea urgente 2]: Dependencias

## 🟡 PENDIENTES NORMALES
- [ ] [Tarea normal 1]: Contexto
- [ ] [Tarea normal 2]: Contexto
```

### 3️⃣ **Ideas Planteadas No Llevadas a Cabo**
```markdown
## 💡 IDEAS BACKLOG
| Idea | Prioridad | Esfuerzo | Valor | Razón No Implementada |
|------|-----------|----------|-------|-----------------------|
| [Idea 1] | Alta | 3h | Alto | Falta tiempo / bloqueo |
| [Idea 2] | Media | 5h | Medio | Pendiente decisión |
```

### 4️⃣ **Actualizar ROADMAP**
```bash
# Abrir ROADMAP.md
# Añadir nuevas ideas en sección correspondiente:
# - BACKLOG (nuevas ideas)
# - IN PROGRESS (si empezaron)
# - BLOCKED (si hay bloqueantes)

# Formato:
## [VERSIÓN] - [Fecha estimada]
- [ ] Feature: [Nueva idea del día]
  - Prioridad: Alta/Media/Baja
  - Esfuerzo: Xh
  - Valor: Alto/Medio/Bajo
  - Notas: [Contexto adicional]
```

### 5️⃣ **Revisar Sesión Anterior**
```bash
# Sistema de guardado del proyecto:
# 📂 CHAT_SESSIONS/ = Resúmenes manuales de sesiones importantes
# 📂 INFORMES_BUENAS_NOCHES/ = Informes auto-generados cada noche

# Ver último CHAT_SESSION_*.md (si existe)
ls CHEMA/PROTOCOLOS/CHAT_SESSIONS/

# Ver informe de ayer
cat CHEMA/PROTOCOLOS/INFORMES_BUENAS_NOCHES/INFORME_*.md

# Verificar pendientes del día anterior
# (Buscar sección "PRÓXIMAS ACCIONES" o "PENDIENTES")
```

### 6️⃣ **Evaluación de Desempeño del Agente**
```markdown
## 📊 AUTOEVALUACIÓN DEL AGENTE

### ✅ FORTALEZAS HOY
- [Aspecto positivo 1]: Ejemplo concreto
- [Aspecto positivo 2]: Ejemplo concreto

### ⚠️ ÁREAS DE MEJORA
- [Debilidad 1]: Qué falló / cómo mejorar
- [Debilidad 2]: Qué falló / cómo mejorar

### 📈 MÉTRICAS
- Commits: X
- Bugs resueltos: X
- Features implementados: X
- Tiempo de respuesta: Rápido/Medio/Lento
- Claridad de comunicación: 1-10

### 🎯 COMPROMISOS PARA MAÑANA
- Mejorar: [Aspecto específico]
- Priorizar: [Tipo de tarea]
- Evitar: [Error recurrente]
```

### 7️⃣ **Crear INFORME_BUENAS_NOCHES Automático**
```bash
# Crear archivo:
# INFORMES_BUENAS_NOCHES/INFORME_YYYYMMDD.md

# Contenido (estructura fija):
# 1️⃣ HITS DEL DÍA
# 2️⃣ PROBLEMAS DETECTADOS
# 3️⃣ PENDIENTES CRÍTICOS
# 4️⃣ PENDIENTES NORMALES
# 5️⃣ IDEAS BACKLOG
# 6️⃣ AUTOEVALUACIÓN DEL AGENTE
# 7️⃣ COMMITS DEL DÍA
# 8️⃣ ARCHIVOS MODIFICADOS
# 9️⃣ ESTADO FINAL
```

### 8️⃣ **Crear CHAT_SESSION si aplica**
```bash
# Crear CHAT_SESSIONS/CHAT_SESSION_YYYYMMDD.md SOLO si:
# - Debugging complejo que requiere documentar root cause
# - Arquitectura significativa de cambios
# - Algoritmo importante que necesita contexto

# Contenido:
# - Resumen ejecutivo
# - Objetivos de sesión
# - Resultados completados
# - Root causes identificadas
# - Próximas acciones prioritarias
# - Métricas y timeline
```

### 9️⃣ **Git Cleanup**
```bash
# Ver status
git status

# Agregar archivos generados
git add CHEMA/PROTOCOLOS/INFORMES_BUENAS_NOCHES/INFORME_*.md
git add CHEMA/PROTOCOLOS/CHAT_SESSIONS/CHAT_SESSION_*.md  # si aplica

# Commit (SIEMPRE solo en testing)
git commit -m "docs: Informe BUENAS NOCHES YYYYMMDD"

# Push SOLO a testing
git push origin testing

# ⚠️ NUNCA pushear a main ni previews
```

### 🔟 **Backup CaraColaViajes a Disco Externo (F:)**
```bash
# Copiar proyecto completo al externo como backup
Copy-Item "C:\Users\chema\CaraColaViajes" "F:\Backups\CaraColaViajes_YYYYMMDD" -Recurse -Force

# O usar robocopy para sync más rápido:
robocopy "C:\Users\chema\CaraColaViajes" "F:\Backups\CaraColaViajes" /MIR /Z /R:1 /W:1

# Resultado: Backup diario sincronizado en F:\Backups\
```

### 1️⃣1️⃣ **Validación Final**
```bash
# Verificar rama
git branch --show-current  # Debe ser: testing

# Verificar ultimo commit
git log -1 --oneline

# Verificar no hay cambios pendientes
git status  # clean working tree
```

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
1. ✅ Crear informe de Hits y Problemas del día
2. ✅ Listar temas no resueltos (pendientes)
3. ✅ Documentar ideas no implementadas
4. ✅ Actualizar ROADMAP.md con nuevas ideas
5. ✅ Evaluar desempeño del agente (mostrar en chat)
6. ✅ Leer último INFORME_BUENAS_NOCHES/INFORME_*.md
7. ✅ Crear INFORME_BUENAS_NOCHES automático
8. ✅ Crear CHAT_SESSION si aplica (debugging complejo, cambios arquitectura)
9. ✅ Hacer git add + commit + push testing
10. ✅ **BACKUP CaraColaViajes a F:\Backups\ (diario)**
11. ✅ Validar status
12. ✅ **MOSTRAR RESUMEN COMPLETO EN CHAT** con todo lo realizado

---

## 📢 **OUTPUT FINAL EN CHAT**

Al terminar, mostrar resumen ejecutivo con:
- 📊 Hits del día
- 🐛 Problemas detectados
- 📋 Pendientes críticos
- 💡 Ideas en backlog
- 📈 Evaluación del agente
- ✅ Commits realizados
- 🔗 Link al archivo de sesión
