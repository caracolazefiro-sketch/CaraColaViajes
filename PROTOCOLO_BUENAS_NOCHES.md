# 🌙 Protocolo "BUENAS NOCHES"

**Ejecutable cuando:** User escriba exactamente `BUENAS NOCHES`

## 📋 Checklist Automático

Cuando se ejecute este protocolo, realizar EN ORDEN:

### 1️⃣ **Snapshot del Chat**
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

### 2️⃣ **Archivo de Sesión**
- Archivo: `CHAT_SESSION_YYYYMMDD.md`
- Ubicación: Raíz del proyecto
- Contenido:
  - Resumen de conversación
  - Archivos modificados
  - Commits realizados
  - Estado final

### 3️⃣ **Git Cleanup**
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

### 4️⃣ **Validación Final**
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
1. ✅ Leer último CHAT_SESSION_*.md
2. ✅ Crear snapshot si hay cambios nuevos
3. ✅ Hacer git add + commit + push testing
4. ✅ Validar status
5. ✅ Responder con confirmación
