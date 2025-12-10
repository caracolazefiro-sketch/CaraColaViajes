# ☀️ Protocolo "BUENOS DÍAS"

**Ejecutable cuando:** User escriba exactamente `BUENOS DÍAS`

## 📋 Checklist Matutino

Cuando se ejecute este protocolo, realizar EN ORDEN:

### 1️⃣ **Verificar Estado del Repositorio**
```bash
cd "c:\Users\chema\CaraColaViajes"

# Ver rama actual
git branch --show-current  # Debe ser: testing

# Ver últimos cambios
git log --oneline -3

# Verificar estado limpio
git status  # clean working tree
```

### 2️⃣ **Verificar Build**
```bash
# Compilar proyecto
npm run build

# Verificar sin errores
# Si hay errores, ejecutar inmediatamente:
npm run lint --fix
npm run build
```

### 3️⃣ **Limpiar y Cachés**
```bash
# Limpiar .next build cache
Remove-Item ".\.next" -Recurse -Force -ErrorAction SilentlyContinue

# Limpiar caché de npm si es necesario
npm cache clean --force  # Usar solo si hay problemas
```

### 4️⃣ **Verificar Dependencias**
```bash
# Ver si falta actualizar
npm outdated

# Si hay updates críticos: npm update
# (Pero NO sin revisar primero qué se actualiza)
```

### 5️⃣ **Revisar Protocolo Anterior**
```bash
# Ver último CHAT_SESSION_*.md
cat CHEMA/PROTOCOLOS/CHAT_SESSION_*.md

# Verificar si hay tareas pendientes
# (Buscar sección "TODO" o "PRÓXIMOS PASOS")
```

### 6️⃣ **Optimizar Sistema** (Ver PROTOCOLO_OPTIMIZAR)
```bash
# Si VS Code está lento:
& ".\CHEMA\optimize-system.ps1"

# Cerrar y reabrir VS Code
```

---

## 🎯 **Checklist Rápido (5 min)**

| Paso | Comando | Estado |
|------|---------|--------|
| Rama | `git branch` | Debe ser `testing` |
| Status | `git status` | Limpio |
| Build | `npm run build` | Sin errores |
| Logs | `git log --oneline -1` | Ver último commit |

---

## ⚠️ **Si Hay Problemas**

### Problema: Build Falla
```bash
# 1. Verificar TypeScript
npm run build

# 2. Si hay errores de tipo
npm run lint --fix

# 3. Si persiste, limpiar node_modules
Remove-Item "node_modules" -Recurse -Force
npm install
npm run build
```

### Problema: VS Code Lento
```bash
# 1. Cerrar VS Code
taskkill /IM code.exe /F

# 2. Ejecutar optimización
& ".\CHEMA\optimize-system.ps1"

# 3. Limpiar extensiones extra
# (Abrir VS Code → Extensions → Desinstalar no necesarias)

# 4. Reabrir
code .
```

### Problema: Git Conflictos
```bash
# Ver estado
git status

# Si hay conflictos
git diff

# Resolver manualmente en VS Code
# Luego:
git add .
git commit -m "fix: Resolver conflictos"
git push origin testing
```

---

## 📝 **Estado para Hoy**

- [ ] Rama verificada: testing
- [ ] Build exitoso
- [ ] Dependencias actualizadas
- [ ] Protocolo anterior revisado
- [ ] Sistema optimizado si fue necesario

---

## 🚀 **Comenzar a Trabajar**

Una vez completado este protocolo:

1. Abrir VS Code: `code .`
2. Esperar que cargue completamente
3. Revisar archivo de sesión anterior en `CHEMA/PROTOCOLOS/`
4. Continuar con el trabajo del día

---

_Protocolo: BUENOS DÍAS_
_Duración: ~5-10 minutos_
_Frecuencia: Diaria (al empezar sesión)_
