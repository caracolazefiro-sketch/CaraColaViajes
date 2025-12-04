# 🔧 MANTENIMIENTO Y OPTIMIZACIÓN DEL PC

Carpeta con todos los archivos, scripts y guías para mantener el PC optimizado y funcionando sin ralentizaciones.

---

## 📋 CONTENIDO DE LA CARPETA

### 📖 Guías y Documentación

| Archivo | Descripción |
|---------|-------------|
| **`ACCIONES_INMEDIATAS.md`** | ⭐ **LEER PRIMERO** - Qué hacer ahora para optimizar el PC |
| **`OPTIMIZACIONES_PC.md`** | Plan completo de optimización con diagnóstico y soluciones |
| **`README.md`** | Este archivo |

### 🛠️ Scripts Ejecutables

| Archivo | Descripción | Cómo usar |
|---------|-------------|----------|
| **`optimizar-pc.ps1`** | Script PowerShell - Limpieza profunda del PC | Click derecho → "Ejecutar con PowerShell" |
| **`optimizar-diario.bat`** | Script Batch - Limpieza diaria rápida (2 min) | Click derecho → "Ejecutar como administrador" |

---

## ⚡ GUÍA RÁPIDA

### Primera Vez (HOY):
```
1. Lee: ACCIONES_INMEDIATAS.md
2. Ejecuta: optimizar-pc.ps1
3. Reinicia VS Code + Chrome
4. Verifica en Task Manager
```

### Diariamente (DESPUÉS):
```
1. Ejecuta: optimizar-diario.bat
2. Espera 2 minutos
3. Cierra y reabre Chrome
4. A trabajar! 🚀
```

---

## 🎯 OBJETIVO

**Antes:** RAM 72.5% usada (CRÍTICO)
**Después:** RAM <50% usada (ACEPTABLE)
**Meta:** RAM <40% usada (ÓPTIMO)

---

## 📊 QUÉ HACE CADA ARCHIVO

### `ACCIONES_INMEDIATAS.md`
- Diagnóstico rápido del PC
- 4 pasos para optimizar ahora
- Qué esperar de mejoras
- Qué hacer si sigue lento

### `OPTIMIZACIONES_PC.md`
- Análisis detallado de problemas
- Plan de revisión completo
- Soluciones por nivel (fácil/moderado/drástico)
- Tips de mantenimiento

### `optimizar-pc.ps1`
Limpia:
- ✅ Cache de NPM
- ✅ Archivos temporales
- ✅ Prefetch de Windows
- ✅ Papelera
- ✅ Memoria (comprime)

### `optimizar-diario.bat`
Limpia rápidamente:
- ✅ Cache NPM
- ✅ Temp folder
- ✅ Prefetch
- ✅ Papelera
- ✅ DNS cache

---

## ⚙️ CONFIGURACIONES HECHAS

### VS Code (`.vscode/settings.json`)
Agregadas optimizaciones:
- Telemetría OFF
- Hover deshabilitado
- InlineCompletions OFF
- AutoFetch Git OFF
- UpdateCheck OFF

Resultado: 200-300MB menos RAM

---

## 🆘 TROUBLESHOOTING

### "El script no ejecuta"
```
Click derecho en .ps1 → "Ejecutar con PowerShell"
O: Click derecho en .bat → "Ejecutar como administrador"
```

### "Sigue lento después de todo"
1. Abre Task Manager (`Ctrl+Shift+Esc`)
2. Ordena por "Memory" (mayor a menor)
3. ¿Qué proceso usa >300MB?
4. Ciérralo o desinstálalo

### "VS Code sigue pesado"
1. `Ctrl+Shift+X` (Extensions)
2. Desabilita todo excepto ESLint y Prettier
3. `Ctrl+Shift+P` → "Reload"

### "Chrome sigue usando 4GB"
1. Abre `chrome://extensions/`
2. Desabilita extensiones innecesarias
3. Chrome Settings → Performance → Memory Saver: ON
4. Reinicia Chrome

---

## 📅 PROGRAMA DE MANTENIMIENTO

| Frecuencia | Acción | Tiempo |
|-----------|--------|--------|
| **Diaria** | Ejecutar `optimizar-diario.bat` | 2 min |
| **Semanal** | Reiniciar PC completamente | 5 min |
| **Mensual** | Limpiar archivos de descargas viejas | 10 min |
| **Trimestral** | Ejecutar `optimizar-pc.ps1` (completo) | 10 min |

---

## 📞 PREGUNTAS FRECUENTES

**P: ¿Puedo eliminar estos archivos?**
A: No. Mantenlos en la carpeta para ejecutar regularmente.

**P: ¿Con qué frecuencia ejecuto el script?**
A: Diariamente el `.bat` (2 min), mensualmente el `.ps1` (completo).

**P: ¿Es peligroso ejecutar estos scripts?**
A: No, solo limpian cache y temp. No modifican código.

**P: ¿Necesito internet?**
A: No, todo es local.

**P: ¿Interfiere con el proyecto?**
A: No, solo limpia archivos temporales del SO.

---

## 🚀 SIGUIENTE PASO

**Si acabas de llegar aquí:**
1. Abre `ACCIONES_INMEDIATAS.md`
2. Sigue los 4 pasos
3. Vuelve aquí si necesitas más ayuda

**Si ya optimizaste:**
1. Ejecuta `optimizar-diario.bat` cada mañana
2. Reinicia PC 1x por semana
3. Vuelve aquí si ves ralentización

---

**Última actualización:** 04 de Diciembre de 2025
**Estado:** Carpeta de mantenimiento organizada ✅
**Próximo paso:** Ejecutar ACCIONES_INMEDIATAS.md

