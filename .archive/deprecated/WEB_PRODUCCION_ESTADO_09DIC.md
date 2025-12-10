# WEB EN PRODUCCIÓN - ESTADO ACTUAL

**Fecha:** 9 diciembre 2025
**URL Producción:** cara-cola-viajes-pruebas-git-testing-caracola.vercel.app
**Branch:** testing
**Commit:** 992eb80

---

## ESTADO ACTUAL VERCEL

### Motor Malo (/) - ✅ OPERATIVO
- **Estado:** FUNCIONA PERFECTAMENTE
- **Commit:** 514eb3c
- **Características:**
  - Segmentación inteligente ~300km/día
  - Waypoints funcionales (París, Bruselas, Ámsterdam)
  - Nombres de ciudad correctos
  - Fechas correctas
  - Google Directions API funcionando

### Motor Bueno (/motor-bueno) - ❌ BUGS CONOCIDOS
- **Estado:** DESPLEGADO pero con errores
- **Commit:** 992eb80 (revert)
- **Bugs activos:**
  1. Segmenta a 254km en lugar de ~300km
  2. Muestra coordenadas "Parada Táctica (44.13, -2.46)" en lugar de nombres

---

## CONFIGURACIÓN VERCEL

### Environment Variables
```
GOOGLE_MAPS_API_KEY_FIXED=AIza...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Build Settings
- **Framework:** Next.js 16.0.7
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node Version:** 18.x

### Deploy Configuration
- **Branch:** testing (auto-deploy enabled)
- **Root Directory:** ./
- **Build Mode:** Turbopack
- **TypeScript:** Strict mode (fails on errors)

---

## GOOGLE CLOUD PROJECT

### Proyecto Actual
**Nombre:** WEBCARACOLAVIAJES09DEC25
**Project ID:** webcaracolaviajes09dec25

### APIs Habilitadas
1. ✅ **Directions API** - Motor malo usa esto
2. ✅ **Routes API** - Habilitada pero no usada (falló migración)
3. ✅ **Geocoding API** - Para reverse geocoding (coordenadas → ciudad)
4. ✅ **Places API (New)** - Para Autocomplete waypoints
5. ✅ **Maps JavaScript API** - Para renderizar mapas

### API Keys
**Restricciones aplicadas:**
- HTTP referrers: `*.vercel.app/*`, `localhost:*`
- APIs permitidas: Las 5 listadas arriba

---

## RUTAS DESPLEGADAS

| Ruta | Motor | Estado | Funcionalidad |
|------|-------|--------|---------------|
| `/` | Malo | ✅ OK | Cálculo rutas, waypoints, 300km |
| `/motor-bueno` | Bueno | ❌ BUGS | 254km, coordenadas |
| `/roadmap` | - | ✅ OK | Roadmap público |
| `/blog` | - | ✅ OK | Blog |
| `/share/[id]` | - | ❓ ? | Share trips (no testado) |

---

## ÚLTIMOS DEPLOYS

### Deploy #1 - 514eb3c (✅ Exitoso)
**Commit:** "DEBUG: agregar console.log en onPlaceChanged para waypoints"
- Build: ✅ Success
- Tiempo: ~2 min
- Motor malo: ✅ Funcionando
- Motor bueno: ❌ Bugs preexistentes

### Deploy #2 - d92d1ff (❌ Rompió motor malo)
**Commit:** "MOTOR BUENO: fix 254km bug (usar distancia real) + mejorar geocoding"
- Build: ✅ Success
- Problema: Editó archivo equivocado, rompió motor malo
- Acción: Revertido inmediatamente

### Deploy #3 - 992eb80 (✅ Revert exitoso)
**Commit:** "Revert 'MOTOR BUENO: fix 254km bug...'"
- Build: ✅ Success
- Motor malo: ✅ Restaurado
- Motor bueno: ❌ Bugs siguen presentes

---

## ARQUITECTURA DESPLEGADA

### Frontend (Next.js App Router)
```
app/
├── page.tsx                    ← Motor malo (/)
├── actions.ts                  ← Server action motor malo
├── motor-bueno/
│   ├── page.tsx               ← Motor bueno (/motor-bueno)
│   └── actions.ts             ← Server action motor bueno
├── components/
│   └── TripForm.tsx           ← Compartido por ambos
├── roadmap/page.tsx
├── blog/page.tsx
└── share/[id]/page.tsx
```

### API Routes
- `app/actions.ts` - Server action motor malo
- `app/motor-bueno/actions.ts` - Server action motor bueno
- Ambos usan Google Directions API

---

## TESTING EN PRODUCCIÓN

### Última Prueba Exitosa (Motor Malo)
**Ruta:** Salamanca → París → Bruselas → Copenhague
**Fecha:** 9 dic 2025, 17:30
**Resultado:**
```
✅ 11 días total
✅ Waypoints en París (70km desde Sainville)
✅ Waypoints en Bruselas (13km desde Beersel)
✅ Segmentación ~300km por día
✅ Nombres ciudad correctos
```

### Última Prueba Motor Bueno
**Misma ruta**
**Resultado:**
```
❌ Día 2: 254km (debería ~300km)
❌ "Parada Táctica (44.13, -2.46)" (debería nombre ciudad)
```

---

## MÉTRICAS DE USO

### Google APIs (últimas 24h)
- Directions API: ~50 requests
- Geocoding API: ~200 requests
- Places API: ~30 requests
- Maps JS: ~100 loads

### Vercel Analytics
- Build time: ~2 min promedio
- Deploy frequency: 10+ deploys hoy
- Success rate: 90% (2 reverts)

---

## PROBLEMAS CONOCIDOS

### 1. Motor Bueno - 254km Bug
**Severidad:** Alta
**Impacto:** Itinerarios incorrectos
**Estado:** Identificado, solución documentada

### 2. Motor Bueno - Coordenadas
**Severidad:** Media
**Impacto:** UX pobre (muestra lat/lng)
**Estado:** Identificado, solución documentada

### 3. Confusión entre Motores
**Severidad:** Crítica (desarrollo)
**Impacto:** Riesgo romper motor malo
**Estado:** Documentado protocolo seguridad

---

## RECOMENDACIONES

### Para Desarrollo
1. ✅ Siempre verificar archivo antes de editar
2. ✅ Commits con prefijo "MOTOR MALO:" o "MOTOR BUENO:"
3. ✅ Testing en local antes de push
4. ❌ NO copiar archivos entre motores

### Para Deploy
1. ✅ Verificar build local con `npm run build`
2. ✅ Comprobar TypeScript errors con `npm run lint`
3. ✅ Revisar Vercel preview antes de merge
4. ✅ Tener commit de rollback identificado

### Para Testing
1. ✅ Ruta estándar: Salamanca → París → Bruselas → Copenhague
2. ✅ Verificar waypoints aparecen en itinerario
3. ✅ Comprobar ~300km por día
4. ✅ Verificar nombres ciudad (no coordenadas)

---

## PRÓXIMOS PASOS

### Inmediato (Próxima Sesión)
1. Arreglar motor bueno (2 fixes en actions.ts)
2. Testing completo motor bueno
3. Verificar motor malo sigue funcionando

### Corto Plazo
1. Integrar CSS motor bueno → motor malo
2. Deprecar motor bueno (migrar todo a `/`)
3. Limpieza código duplicado

### Largo Plazo
1. Consolidar en un solo motor
2. Optimizar llamadas API (caché)
3. Implementar persistencia Supabase

---

## CONTACTOS Y RECURSOS

**Repositorio:** github.com/caracolazefiro-sketch/CaraColaViajes
**Vercel Dashboard:** vercel.com/caracola
**Google Cloud Console:** console.cloud.google.com/apis
**Documentación:** Ver RESUMEN_SESION_09DIC_MOTOR_BUENO.md
