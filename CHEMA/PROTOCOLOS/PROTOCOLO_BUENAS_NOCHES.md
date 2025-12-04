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

### 5️⃣ **Evaluación de Desempeño del Agente**
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

### 6️⃣ **Snapshot del Chat**
```bash
# Leer archivo de sesión actual
cat CHAT_SESSION_*.md

# Crear nuevo snapshot con:
# - Timestamp (fecha y hora)
# - Rama actual (git branch)
# - Status (git status)
# - Build status (npm run build)
# - Cambios realizados (git log --oneline -5)
```

### 7️⃣ **Archivo de Sesión**
- Archivo: `CHAT_SESSION_YYYYMMDD.md`
- Ubicación: Raíz del proyecto
- Contenido:
  - Resumen de conversación
  - Archivos modificados
  - Commits realizados
  - Estado final

### 8️⃣ **Git Cleanup**
```bash
# Ver status
git status

# Agregar archivo de sesión
git add CHAT_SESSION_*.md

# Commit (SIEMPRE solo en testing)
git commit -m "docs: Chat session snapshot - YYYYMMDD"

# Push SOLO a testing
git push origin testing

# ⚠️ NUNCA pushear a main ni previews
```

### 9️⃣ **Validación Final**
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
6. ✅ Leer último CHAT_SESSION_*.md
7. ✅ Crear snapshot si hay cambios nuevos
8. ✅ Hacer git add + commit + push testing
9. ✅ Validar status
10. ✅ **MOSTRAR RESUMEN COMPLETO EN CHAT** con todo lo realizado

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
