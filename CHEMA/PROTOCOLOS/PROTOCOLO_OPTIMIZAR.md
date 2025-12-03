# ⚡ Protocolo "OPTIMIZAR"

**Ejecutable cuando:** VS Code esté lento O user escriba `OPTIMIZAR`

Protocolo para optimizar:
- Windows PowerShell
- Visual Studio Code
- Google Chrome
- Node.js / npm

---

## 🖥️ **PARTE 1: Optimizar Windows + PowerShell**

### 1.1 Limpiar Caché del Sistema
```powershell
# EJECUTAR COMO ADMINISTRADOR
# Limpiar archivos temporales
Remove-Item "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\$env:USERNAME\AppData\Local\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
```

### 1.2 Limpiar Disco
```powershell
# Ver espacio en disco
Get-Volume -DriveLetter C | Select-Object SizeRemaining

# Si < 5GB libre, ejecutar Liberador de Espacio:
# Settings → System → Storage → Cleanup recommendations
```

### 1.3 Procesos Innecesarios
```powershell
# Ver procesos que consumen RAM
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10

# Cerrar Chrome si está abierto (consume ~500MB)
taskkill /IM chrome.exe /F -ErrorAction SilentlyContinue
```

---

## 💻 **PARTE 2: Optimizar Visual Studio Code**

### 2.1 Resetear VS Code (Ya está hecho)
```powershell
# Cerrar VS Code
taskkill /IM code.exe /F -ErrorAction SilentlyContinue

# Eliminar datos de configuración
Remove-Item "$env:APPDATA\Code" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:LOCALAPPDATA\Programs\Microsoft VS Code\data" -Recurse -Force -ErrorAction SilentlyContinue

# Reabrir
code .
```

### 2.2 Limpiar Extensiones
```
Dentro de VS Code:
1. Ctrl+Shift+X → Extensions
2. Ver instaladas
3. Desinstalar TODAS excepto:
   - ESLint
   - Prettier
   - TypeScript Vue Plugin
   - (Nada más)
```

### 2.3 Limpiar Configuración de VS Code
```
Archivo → Preferences → Settings
Buscar y resetear:
- "editor.formatOnSave": false (temporalmente)
- "editor.codeActionsOnSave": desactivar si es lento
- "extensions.autoUpdate": false
- "workbench.colorTheme": "Default Dark"
```

### 2.4 Desactivar Autocomplete Pesado
```json
// En .vscode/settings.json
{
  "editor.suggest.maxVisibleSuggestions": 10,
  "editor.suggest.showWords": false,
  "editor.quickSuggestionsDelay": 500,
  "typescript.tsserver.maxTsServerMemory": 2048
}
```

### 2.5 Deshabilitar Minimap
```
View → Toggle Minimap
(Desactivar - consume GPU)
```

---

## 📦 **PARTE 3: Optimizar Node.js / npm**

### 3.1 Limpiar npm
```bash
cd "c:\Users\chema\CaraColaViajes"

# Limpiar caché de npm
npm cache clean --force

# Verificar instalaciones innecesarias
npm list --depth=0

# Si hay modules rotos:
Remove-Item "node_modules" -Recurse -Force
Remove-Item "package-lock.json" -Force
npm install
```

### 3.2 Verificar Dependencias Problemáticas
```bash
# Ver paquetes problemáticos
npm audit

# Si hay vulnerabilidades:
npm audit fix  # ⚠️ Usar con cuidado

# Verificar que build aún funcione:
npm run build
```

### 3.3 Optimizar Build
```bash
# Ver qué tarda más en build
npm run build 2>&1 | grep -i "warning\|error"

# Limpiar Turbopack caché
Remove-Item ".\.turbopack" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item ".\.next" -Recurse -Force -ErrorAction SilentlyContinue

# Rebuild
npm run build
```

---

## 🌐 **PARTE 4: Optimizar Chrome**

### 4.1 Limpiar Caché de Chrome
```
Chrome → Settings → Privacy and security → Clear browsing data
- Cookies
- Cached images and files
- All time
```

### 4.2 Desactivar Extensiones Innecesarias
```
Chrome → Extensions → Manage extensions
Desactivar TODAS excepto:
- Pasword manager si usas
- Ad blocker (opcional)
```

### 4.3 Limpiar Carpeta de Datos
```powershell
# Cerrar Chrome
taskkill /IM chrome.exe /F

# Limpiar caché local
Remove-Item "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Code Cache" -Recurse -Force -ErrorAction SilentlyContinue

# Reabrir
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

### 4.4 Memoria de Chrome
```
Si Chrome sigue consumiendo mucho:
- Ejecutar: .\CHEMA\.chrome-low-memory.bat
- (Script personalizado que limita memoria de Chrome)
```

---

## 🎯 **Checklist Rápido (15 min)**

| Componente | Acción | Status |
|------------|--------|--------|
| Windows | Limpiar Temp | ✅ |
| PowerShell | Reiniciar terminal | ✅ |
| VS Code | Resetear + mín extensiones | ✅ |
| npm | npm cache clean + build | ✅ |
| Chrome | Limpiar caché | ✅ |

---

## 📊 **Monitoreo Post-Optimización**

Después de optimizar, verificar:

```powershell
# RAM disponible (debe ser > 50% libre)
Get-PhysicalMemory | Select-Object MemoryFree

# Disco libre (debe ser > 5GB)
Get-Volume -DriveLetter C

# Procesos pesados (must be < 500MB each)
Get-Process | Sort-Object WorkingSet | Select-Object -Last 5
```

---

## ⏰ **Cuándo Ejecutar Este Protocolo**

- 🔴 **CRÍTICO**: VS Code freezes constantemente
- 🟡 **IMPORTANTE**: Build tarda > 10 segundos
- 🟢 **MANTENIMIENTO**: Una vez a la semana (recomendado)

---

## 🛠️ **Troubleshooting**

### Problema: VS Code aún lento después de optimizar
```bash
# Ver qué extensión causa problema
code --list-extensions

# Desactivar una por una
code --disable-extensions

# Identificada, desinstalar completamente
code --uninstall-extension <nombre>
```

### Problema: npm ci da error
```bash
# Reinstalar completamente
Remove-Item "node_modules" -Recurse -Force
Remove-Item "package-lock.json" -Force
npm install
npm run build
```

### Problema: Chrome sigue lento
```powershell
# Nuclear option:
Remove-Item "$env:LOCALAPPDATA\Google\Chrome\User Data" -Recurse -Force

# Chrome se reiniciará limpio (perderá datos)
# USAR SOLO si todo lo demás falló
```

---

## 📝 **Registro de Optimizaciones**

Cada vez que ejecutes, documentar:
```
Fecha: 2025-12-03
Causa: VS Code lento
Acciones: Resetear VS Code, limpiar npm cache
Resultado: ✅ Mejoró significativamente
RAM antes: XXX MB
RAM después: XXX MB
```

---

_Protocolo: OPTIMIZAR_  
_Duración: 15-30 minutos (depende de situación)_  
_Urgencia: Baja si es preventivo, Alta si hay lag_
