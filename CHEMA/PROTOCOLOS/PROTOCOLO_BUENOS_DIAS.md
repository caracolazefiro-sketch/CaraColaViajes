# ☀️ Protocolo "BUENOS DÍAS"

**Ejecutable cuando:** User escriba exactamente `BUENOS DÍAS`

## 📋 Checklist Matutino (SIMPLIFICADO)

Cuando se ejecute este protocolo, realizar EN ORDEN:

### 1️⃣ **Verificar Estado del Repositorio** ⭐ DIARIO
```bash
cd "c:\Users\chema\CaraColaViajes"

# Ver rama actual
git branch --show-current  # Debe ser: testing

# Ver últimos cambios
git log --oneline -3

# Verificar estado limpio
git status  # clean working tree
```

### 2️⃣ **Revisar Sesión Anterior** ⭐ DIARIO
```bash
# Ver último CHAT_SESSION_*.md
ls CHEMA/PROTOCOLOS/CHAT_SESSIONS/ | head -1

# Ver INFORME de ayer
ls CHEMA/PROTOCOLOS/INFORMES_BUENAS_NOCHES/ | tail -1

# Verificar pendientes críticos en INFORME (sección "PRÓXIMAS ACCIONES")
```

### 3️⃣ **Verificar Build** (OPCIONAL - 3 veces/semana o antes de push críticos)
```bash
# Compilar proyecto
npm run build

# Si hay errores:
npm run lint --fix
npm run build
```

### 4️⃣ **Verificar Dependencias** (OPCIONAL - Semanal máximo)
```bash
# Ver si hay updates
npm outdated

# Solo actualizar si son críticos de seguridad
npm update
```

---

## ⏱️ **Duración**

- **DIARIO (Pasos 1️⃣-2️⃣):** ~2 minutos ⚡
- **CON PASO 3️⃣:** +2-3 minutos (compilar)
- **CON PASO 4️⃣:** +1 minuto (check dependencias)

---

## 🎯 **Checklist Rápido (5 min)**

| Paso | Comando | Estado |
|------|---------|--------|
| Rama | `git branch` | Debe ser `testing` |
| Status | `git status` | Limpio |
| Build | `npm run build` | Sin errores |
| Logs | `git log --oneline -1` | Ver último commit |

---

## 📋 **TAREAS CRÍTICAS PENDIENTES**

Después de completar el protocolo, **ESTAS SON LAS PRIORIDADES DE HOY:**

### 🔴 CRÍTICOS (Hacer primero)
1. **Fijar marcadores A, B, C, D en mapa** 
   - Bug: Marcadores no aparecen después de refactor de escalas
   - Archivo: `app/components/TripMap.tsx` (líneas 230-275)
   - Causa probable: `startCoordinates` undefined o lógica condicional incorrecta
   - Time: ~1-2h debugging

2. **Geocodificar escalas para pintar chinchetas rojas**
   - Status: Escalas funcionan pero sin marcadores visuales
   - Requerimiento: Google Geocoding API → lat/lng → render Marker
   - Time: ~2-3h implementación

### 🟠 ALTOS (Segunda prioridad)
3. **Botón "Nuevo Viaje" (C4 - Critical Error)**
   - Falta reset completo del formulario
   - Archivo: `app/page.tsx`
   - Time: ~30-45 min

4. **Validar "Fecha de Vuelta" (C5 - Critical Error)**
   - Campo inconsistente (opcional/requerido)
   - Archivo: `app/components/TripForm.tsx`
   - Time: ~30 min

### 🟡 NORMALES (Tercera prioridad)
5. **Test completo Salamanca → Barcelona**
   - Escenario de estrés con múltiples escalas y pernoctas
   - Validar todo el flujo end-to-end
   - Time: ~45 min

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

1. Revisar archivo de sesión anterior (`CHAT_SESSIONS/`)
2. Leer informe de ayer (`INFORMES_BUENAS_NOCHES/`)
3. Comenzar con **TAREA CRÍTICA #1** (marcadores en mapa)
4. Al terminar: ejecutar `BUENAS NOCHES`

---

_Protocolo: BUENOS DÍAS (SIMPLIFICADO)_  
_Duración: ~2 minutos (diario) | ~5 minutos (con compilación)_  
_Última actualización: 05/12/2025_
