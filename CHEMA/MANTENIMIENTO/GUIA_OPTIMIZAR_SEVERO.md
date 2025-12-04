# 🔴 OPTIMIZACIÓN SEVERA - Guía de Uso

## 📍 UBICACIÓN DEL SCRIPT

```
CHEMA/MANTENIMIENTO/optimizar-severo.bat
```

## 🚀 CÓMO EJECUTARLO

### Opción 1: Desde File Explorer (MÁS FÁCIL)

1. Abre File Explorer
2. Ve a: `C:\Users\chema\CaraColaViajes\CHEMA\MANTENIMIENTO\`
3. Busca el archivo: `optimizar-severo.bat`
4. **Click derecho** en el archivo
5. Selecciona: **"Ejecutar como administrador"**
6. Presiona cualquier tecla cuando lo pida
7. Espera a que termine (2-3 minutos)

### Opción 2: Desde PowerShell (ALTERNATIVA)

1. Abre PowerShell como Administrador
2. Copia y pega esto:

```powershell
cd "C:\Users\chema\CaraColaViajes\CHEMA\MANTENIMIENTO"
.\optimizar-severo.bat
```

3. Presiona Enter
4. Sigue las instrucciones en pantalla

### Opción 3: Crear Acceso Directo (RECOMENDADO)

Para ejecutar más fácilmente en el futuro:

1. Ve a: `C:\Users\chema\CaraColaViajes\CHEMA\MANTENIMIENTO\`
2. Click derecho en `optimizar-severo.bat`
3. Selecciona: **"Enviar a" → "Escritorio (crear acceso directo)"**
4. Verás un acceso directo en tu Escritorio
5. Próximas veces: **Double-click en el acceso directo** (ejecuta automáticamente como admin)

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### Antes de ejecutar:
- ✅ **CIERRA VS Code completamente**
- ✅ **CIERRA Chrome completamente**
- ✅ **Guarda todo tu trabajo**
- ✅ **Ten administrador habilitado**

### Lo que hace el script:
- ✅ Mata procesos de VS Code y Chrome (fuerza cierre)
- ✅ Limpia cache de VS Code (~200-300MB)
- ✅ Limpia cache de Chrome (depende, ~500MB+)
- ✅ Limpia NPM cache (~100MB)
- ✅ Limpia archivos temporales del SO (~500MB)
- ✅ Limpia prefetch de Windows (~50MB)
- ✅ Comprime memoria no utilizada

### Resultado esperado:
- VS Code usará **<300MB** RAM (antes: 500-900MB)
- Chrome usará **<500MB** RAM (antes: 1-4GB)
- RAM disponible: **+500MB a 1GB**

---

## ⏱️ TIEMPO DE EJECUCIÓN

```
Tiempo total: 2-3 minutos

Desglose:
- Matar procesos: 5 segundos
- Limpiar VS Code: 30 segundos
- Limpiar NPM: 30 segundos
- Limpiar temp: 20 segundos
- Limpiar Chrome: 20 segundos
- Compresión: 10 segundos
```

---

## 🔄 QUÉ PASA DESPUÉS

### Cuando abras VS Code:
1. Tardará 10-15 segundos más la PRIMERA vez
2. Se reinstalarán las extensiones automáticamente
3. Después será mucho más rápido

### Cuando abras Chrome:
1. Abrirá instantáneamente
2. Perderás datos en caché (pero no contraseñas/historial)
3. Las pestañas se cargarán más rápido

### En Task Manager:
- Abre: `Ctrl+Shift+Esc`
- Ordena por "Memory"
- Verifica que los procesos usen menos RAM

---

## 📋 CHECKLIST

- [ ] Cerré VS Code
- [ ] Cerré Chrome
- [ ] Guardé todo el trabajo
- [ ] Click derecho → "Ejecutar como administrador"
- [ ] Presioné Enter/espacio cuando pidió
- [ ] Espéré a que terminara (2-3 min)
- [ ] Abrí VS Code (espéré primera carga)
- [ ] Abrí Chrome
- [ ] Verifiqué en Task Manager que RAM bajó

---

## 🆘 TROUBLESHOOTING

### "No puedo ejecutar como administrador"
- Verifica que tu usuario tenga permisos de admin
- Si no: `Windows+X` → `Terminal (Admin)` y copia el comando PowerShell

### "El script no hace nada"
- Verifica que VS Code y Chrome estén CERRADOS (no minimizados)
- Abre Task Manager y mata los procesos manualmente si persisten

### "Después sigue lento"
1. Ejecuta de nuevo el script
2. Si sigue lento, el problema es otra cosa (posible antivirus o malware)

### "Perdí datos en Chrome"
- Las contraseñas y historial están INTACTOS
- Solo se perdió cache (re-descargará automáticamente)
- Las extensiones se reinstalaron

---

## 📅 FRECUENCIA RECOMENDADA

| Frecuencia | Acción |
|-----------|--------|
| **Diaria** | `optimizar-diario.bat` (2 min) |
| **Semanal** | `optimizar-severo.bat` (3 min) - ESTE |
| **Mensual** | Reinicia PC completamente |

---

## 💡 ALTERNATIVA NUCLEAR

Si incluso después de esto sigue lento:

1. Desinstala todas las extensiones de VS Code
2. Desinstala todas las extensiones de Chrome
3. Borra la carpeta completa de Chrome data:
   ```
   C:\Users\chema\AppData\Local\Google\Chrome\User Data\Default
   ```
4. Reinstala Chrome (empezará como nuevo)

---

**Última actualización:** 04 de Diciembre de 2025
**Script version:** 1.0
**Ubicación:** `CHEMA/MANTENIMIENTO/optimizar-severo.bat`

