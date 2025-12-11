# 🌙 BUENAS NOCHES - 11 Dic 2025

## 📊 SESIÓN METRICS
- Duración: N/A (sesión asistida)
- Commits efectivos en rama: 0 (se hizo reset a commit estable)
- Archivos modificados (working tree): 1 tracked modificado, varios untracked (ver abajo)
- Líneas cambiadas (tracked): 58 inserciones (según `git diff --shortstat`)

## 🎯 ROADMAP TRACKING (INTEGRACIÓN)
Hoy no se cerró ninguna idea del ROADMAP. Se añadió planificación para organizar entornos y flujos (Prod/Staging/Sandbox) y se incorporó un mapa de despliegues al ROADMAP.

- [ ] P1 🔴 Migrar PlaceAutocompleteElement
- [ ] P2 🟠 Nominatim en Geocoding
- [ ] P2 🟠 Option B: Caché Nominatim+localStorage
- [ ] P3 🟡 Expandir caché Places
- [x] Organización de entornos y flujo de publicación (nuevo apartado en ROADMAP)

## 💡 CAMBIOS REALIZADOS
- Reversión de la rama `testing` al commit estable:
  - Último commit ahora: `de8d5bb` - feat: add Server Calculate button that calls getDirectionsAndCost and logs to Supabase (hace ~9h)
- Redacción y añadido (en working tree) del mapa de entornos (Vercel/GitHub) y plan de limpieza en `CHEMA/RECORDATORIOS/ROADMAP.md`.
- Diagnóstico de fallos en Preview: falta de `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` en el proyecto Vercel de pruebas.

### Archivos con cambios locales
```
$ git status -s
 M CHEMA/RECORDATORIOS/ROADMAP.md
?? CHEMA/ANALISIS/ANALISIS_PROFUNDO_5_APIS.md
?? CHEMA/ANALISIS/ANALISIS_PROTOCOLO_BUENAS_NOCHES.md
?? CHEMA/ANALISIS/APIS_USADAS_COMPLETO.md
?? CHEMA/ANALISIS/capture-network.js
?? CHEMA/ANALISIS/capture-simple.js
?? CHEMA/ANALISIS/directions.js
?? CHEMA/ANALISIS/google-apis-capture-1765433055400.json
?? CHEMA/ANALISIS/network-capture-1765392364468.json
?? CHEMA/ANALISIS/network-capture-1765392368211.json
?? CHEMA/ANALISIS/network-capture-1765392368482.json
?? CHEMA/ANALISIS/network-capture-1765392368758.json
?? CHEMA/ANALISIS/network-capture-1765392369013.json
?? CHEMA/ANALISIS/network-capture-1765392369269.json
?? CHEMA/RECORDATORIOS/BUENOS_DIAS_11DIC25.md
?? CHEMA/RECORDATORIOS/BUENOS_NOCHES_10DIC25.md
?? supabase/.temp/
```

## 💰 IMPACTO ESTIMADO
- Logs y visor: temporalmente inactivos en Preview de pruebas por envs faltantes. Sin impacto en producción.
- Plan de entornos reduce errores futuros y acelera validación (riesgo operativo ↓).

## 📍 PRÓXIMA PRIORIDAD (SUGERENCIA)
- Mañana: ejecutar plan simple de entornos
  - Crear/ajustar 3 proyectos Vercel: `caracola-prod` (main), `caracola-staging` (staging), `caracola-sandbox` (testing)
  - Configurar envs por entorno (Preview/Production): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - Validar salud/logs en cada entorno (`/api/supabase-health`, `/api/logs-supabase-test`, visor)
  - Documentar dominios en ROADMAP

## 🔄 GIT SUMMARY
- Branch: testing
- Status: cambios locales sin commit (ver listado)
- Último commit: de8d5bb (feat: add Server Calculate button…) – referencia estable

---

> Nota: Al finalizar la organización de entornos, retomaremos los cambios de “Google-only search” y costes en una rama `feature/*`, validando primero en Sandbox y luego Staging.
