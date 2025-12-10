# 📇 Índice de Proyecto - CaraColaViajes

**Última actualización:** 10/DIC/2025  
**Estado:** ✅ Reorganización completada

---

## 🗂️ Estructura Rápida del Proyecto

```
CaraColaViajes/
├── 📁 app/                           ← Next.js Application (Código PRINCIPAL)
│   ├── actions.ts                    ← Server actions (Google APIs, cálculos)
│   ├── components/                   ← React components
│   ├── layout.tsx                    ← Layout base
│   ├── page.tsx                      ← Página principal
│   └── api/                          ← API routes
│
├── 📁 lib/                           ← Shared utilities
├── 📁 public/                        ← Static assets
├── 📁 scripts/                       ← Automation scripts
│   └── test-motor-real-advanced-33.js ← Testing script PRINCIPAL
│
├── 📁 data/                          ← Data files
│   └── geocoding-cache.json          ← Caché de geocoding (50 ciudades)
│
├── 📁 docs/                          ← 📌 DOCUMENTACIÓN CENTRAL
│   ├── ROADMAP.md                    ← Hoja de ruta del proyecto
│   ├── PLAN_ACCION.html              ← Resumen sesiones
│   ├── README_root.md                ← README principal
│   └── MOTOR_DASHBOARD_FINAL.html    ← Dashboard de testing
│
├── 📁 CHEMA/                         ← 🏠 TU ESPACIO PERSONAL
│   ├── PROTOCOLOS/                  ← Guías operacionales
│   │   ├── PROTOCOLO_BUENOS_DIAS.md
│   │   ├── PROTOCOLO_BUENAS_NOCHES.md
│   │   └── PROTOCOLO_ANALISIS_Y_DECISION.md
│   │
│   ├── ANALISIS/                    ← 📊 ANÁLISIS TÉCNICOS
│   │   ├── ANALISIS_SERVICIOS_API.md (353 líneas)
│   │   ├── ANALISIS_OPTIMIZACION_APIS.md (460 líneas)
│   │   ├── ANALISIS_CACHE_STORAGE.md
│   │   ├── ANALISIS_MIGRACION_MOTOR.md
│   │   ├── ANALISIS_MOTOR_BUENO.md
│   │   └── ANALISIS_WEB_EN_PRODUCCION.md
│   │
│   ├── TESTING/                     ← Testing reports
│   │   ├── TEST_CHECKLIST.md
│   │   ├── RESUMEN_MEJORA_MOTOR_DEC8.md
│   │   └── TEST_SCRAPER/
│   │
│   ├── RECORDATORIOS/               ← Notas personales
│   └── README.md
│
├── 📁 .tests/                        ← 🧪 TESTING ARTIFACTS
│   ├── results/                      ← Test execution data
│   │   ├── motor-real-api-*.{json,csv,md}
│   │   └── test-results.log
│   │
│   ├── scripts/                      ← Testing scripts & runners
│   │   ├── ABRIR_RESULTADOS_TEST.bat
│   │   ├── ABRIR_RESULTADOS_TEST.ps1
│   │   ├── ABRIR_RESULTADOS_TEST.sh
│   │   └── test-motor-bueno-routes-api.js
│   │
│   └── dashboards/                   ← HTML dashboards
│       ├── TEST_RESULTS_INTERACTIVE.html
│       ├── TEST_OPTIMIZACIONES_API.html
│       ├── MOTOR_TEST.html
│       └── MOTOR_TEST_COMPARADOR.html
│
├── 📁 .archive/                      ← 📦 BACKUPS & DEPRECATED
│   ├── backups/
│   │   ├── PARA_CARMEN.zip
│   │   ├── backup-motor-bueno.bat
│   │   └── BACKUP_PRE_MIGRATION_09DEC2025.../
│   │
│   └── deprecated/                   ← Old files (reference only)
│       ├── LEEME_PRIMERO_CARMEN.md
│       ├── EMAIL_PARA_CARMEN.txt
│       ├── INSTRUCCIONES_PARA_CARMEN.txt
│       ├── COMO_ABRIR_RESULTADOS.md
│       ├── PLAN_MIGRACION_CSS_09DIC.md
│       ├── RESUMEN_SESION_09DIC_MOTOR_BUENO.md
│       ├── WEB_PRODUCCION_ESTADO_09DIC.md
│       ├── CHAT_SESSION_20251205_*.md
│       └── START.txt
│
├── 📁 .config/                       ← ⚙️ CONFIGURATION FILES
│   ├── eslint.config.mjs
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   ├── tsconfig.tsbuildinfo
│   ├── vercel.json
│   └── .env.local
│
├── 📁 supabase/                      ← Supabase setup
└── 📁 .github/                       ← GitHub workflows
```

---

## 🎯 Dónde Está Cada Cosa

### 📚 **Quiero leer documentación**
- 📘 Hoja de ruta: `docs/ROADMAP.md`
- 📋 Resumen sesión: `docs/PLAN_ACCION.html` (abrir en browser)
- 📊 Análisis técnicos: `CHEMA/ANALISIS/*.md`

### 🔧 **Quiero ver cómo funciona**
- 🧠 Lógica principal: `app/actions.ts` (server actions, Google APIs)
- 🗺️ Mapa UI: `app/components/TripMap.tsx`
- 🔍 Búsqueda servicios: `app/hooks/useTripPlaces.ts`
- 📦 Caché geocoding: `data/geocoding-cache.json`

### 🧪 **Quiero correr tests**
- 🚀 Script testing: `scripts/test-motor-real-advanced-33.js`
- 📊 Ver resultados: `npm run test` o `.tests/scripts/ABRIR_RESULTADOS_TEST.bat`
- 📈 Últimos resultados: `.tests/results/motor-real-api-*.{json,csv,md}`

### ⚙️ **Quiero cambiar configuración**
- 🔨 Next.js config: `.config/next.config.ts`
- 🎨 Estilos: `.config/eslint.config.mjs`, `.config/postcss.config.mjs`
- 🔐 Variables env: `.config/.env.local`

### 📖 **Quiero ver protocolos operacionales**
- ☀️ Inicio de sesión: `CHEMA/PROTOCOLOS/PROTOCOLO_BUENOS_DIAS.md`
- 🌙 Cierre de sesión: `CHEMA/PROTOCOLOS/PROTOCOLO_BUENAS_NOCHES.md`
- 🔍 Análisis & decisión: `CHEMA/PROTOCOLOS/PROTOCOLO_ANALISIS_Y_DECISION.md`

### 🏕️ **Quiero entender servicios API (camping, gas, restaurantes)**
- 📊 Análisis completo: `CHEMA/ANALISIS/ANALISIS_SERVICIOS_API.md` ← **LEER MAÑANA**
- 🎯 Recomendaciones: Mismo archivo, sección "OPORTUNIDADES DE AHORRO"

### 🚀 **Quiero ejecutar optimizaciones**
- 📄 Análisis APIs: `CHEMA/ANALISIS/ANALISIS_OPTIMIZACION_APIS.md`
- 📄 Análisis servicios: `CHEMA/ANALISIS/ANALISIS_SERVICIOS_API.md`
- 🎯 Plan: Ver `docs/ROADMAP.md` sección "Optimización de APIs"

---

## 📊 Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Archivos en raíz antes** | 50+ 😅 |
| **Archivos en raíz ahora** | ~5 ✅ |
| **Carpetas temáticas** | 8 (organizadas) |
| **Líneas de documentación** | 1,000+ |
| **APIs integradas** | Google Maps, Google Places, Open-Meteo, Supabase |
| **Servicios** | 8 (camping, gas, restaurante, agua, etc.) |
| **Rutas testadas** | 16 (15+ países, 3 continentes) |
| **Caché hit rate** | 63.2% → 80% esperado |

---

## 🔄 Git Status

**Rama actual:** `refactor/reorganize-structure`  
**Estado:** Clean (todos los cambios commitados)  
**Último commit:** Reorganización de estructura  
**Próxima acción:** Merge a `testing`

---

## 🚀 Comandos Útiles

```bash
# Build del proyecto
npm run build

# Ejecutar tests
npm run dev
# Luego: npm run test (o .tests/scripts/ABRIR_RESULTADOS_TEST.bat en Windows)

# Ver logs
tail -f .tests/results/test-results.log

# Checar linting
npm run lint

# Ver cambios git
git status
git log --oneline -10
```

---

## 💡 Tips de Navegación

1. **Si necesitas analizar algo:** Busca en `CHEMA/ANALISIS/`
2. **Si necesitas una guía operacional:** Ve a `CHEMA/PROTOCOLOS/`
3. **Si necesitas documentación:** Abre `docs/PLAN_ACCION.html` en browser
4. **Si necesitas debugging:** Revisa `.tests/results/test-results.log`
5. **Si está deprecated:** Está en `.archive/deprecated/` (referencia solamente)

---

## ✅ Estado Actual (10/DIC/2025)

- ✅ Estructura organizada y clara
- ✅ Análisis técnicos completos
- ✅ Protocolos operacionales establecidos
- ✅ Testing infrastructure en lugar
- ✅ Documentación centralizada en `docs/`
- ⏳ Próxima sesión: Leer `CHEMA/ANALISIS/ANALISIS_SERVICIOS_API.md` y decidir optimizaciones

---

**Índice creado por:** AI Assistant  
**Última revisión:** 10/DIC/2025 23:30 UTC  
**Estado:** ✅ Proyecto organizado y listo para avanzar
