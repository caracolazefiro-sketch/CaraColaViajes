# 📁 CARPETA CHEMA

Organización personal de archivos relacionados con desarrollo, testing y mantenimiento de CaraColaViajes.

**Esta carpeta NO se sube a producción.** Solo contiene documentación interna.

---

## 📂 Estructura

### 📋 `PROTOCOLOS/`
Procedimientos automatizados para ejecutar en momentos específicos.

| Archivo | Comando | Descripción |
|---------|---------|-------------|
| `PROTOCOLO_BUENOS_DIAS.md` | `BUENOS DÍAS` | Verificación matutina de repo + build |
| `PROTOCOLO_BUENAS_NOCHES.md` | `BUENAS NOCHES` | Snapshot de sesión + push testing |
| `PROTOCOLO_OPTIMIZAR.md` | `OPTIMIZAR` | Limpiar sistema, VS Code, Chrome |
| `CHAT_SESSION_*.md` | - | Snapshots de sesiones completadas |

### 🧪 `TESTING/`
Archivos de testing, onboarding, y validación.

- `TESTING_SVG_*.md` - Documentación sobre testing SVG
- `ONBOARDING_*.md` - Setup para nuevos usuarios
- `SETUP_CARMEN.md` - Configuración específica
- `TEST_CHECKLIST.md` - Lista de verificación

### 📝 `RECORDATORIOS/`
Notas, diarios y checklist de seguimiento.

- `DIARIO_*.md` - Anotaciones diarias
- `RECORDATORIO_*.md` - Recordatorios de tareas
- `CHECKLIST_*.md` - Checklists de verificación

### 📊 `ANALISIS/`
Análisis estratégicos, pitches y documentación de negocio.

- `ANALISIS_*.md` - Análisis detallados
- `PITCH_*.md` - Presentaciones
- `.html` - Reportes visuales

### 🔧 `SCRIPTS/` (en raíz CHEMA)
Scripts de utilidad del sistema.

- `.chrome-low-memory.bat` - Limitar memoria de Chrome
- `optimize-system.ps1` - Optimizar Windows + npm

---

## 🚀 **Cómo Usar**

### Protocolo Matutino
```
User: "BUENOS DÍAS"
→ Agent ejecuta checklist de verificación
```

### Protocolo Nocturno
```
User: "BUENAS NOCHES"
→ Agent crea snapshot de sesión
→ Push a testing
→ Archivo guardado en PROTOCOLOS/
```

### Optimizar Sistema
```
User: "OPTIMIZAR"
→ Agent limpia sistema, VS Code, Chrome, npm
→ Verifica RAM y disco
```

---

## 📋 **Archivos en Raíz de Carpeta CHEMA**

```
CHEMA/
├── .chrome-low-memory.bat
├── optimize-system.ps1
├── PROTOCOLOS/
├── TESTING/
├── RECORDATORIOS/
└── ANALISIS/
```

---

## 🔐 **Notas Importantes**

✅ **Hacer cada día:**
- BUENOS DÍAS (verificar repo)
- BUENAS NOCHES (guardar snapshot)

✅ **Hacer cuando sea necesario:**
- OPTIMIZAR (si VS Code lento)

❌ **NUNCA:**
- Pushear estos archivos a main
- Incluir en preview deployments
- Compartir con prod

---

## 📆 **Registro de Sesiones**

Las sesiones completadas se guardan como:
```
PROTOCOLOS/CHAT_SESSION_YYYYMMDD.md
```

Ejemplo:
- `CHAT_SESSION_20241203.md` - Sesión del 3 diciembre 2025

---

## ⚙️ **Configuración**

La carpeta CHEMA está en `.gitignore` (si lo deseas):
```bash
# En .gitignore
CHEMA/
```

Actualmente se trackea en git. Si quieres ignorarla:
```bash
git rm -r --cached CHEMA/
echo "CHEMA/" >> .gitignore
git commit -m "chore: Ignore CHEMA folder"
```

---

_Última actualización: 3 Diciembre 2025_  
_Usuario: chema_  
_Proyecto: CaraColaViajes_
