# CaraColaViajes — ROADMAP Operativo

> **Última actualización:** 22 Diciembre 2025

## Principio rector (mutación / control absoluto de costes)
- El navegador **NO** llama APIs pagadas de Google (Directions/Geocoding/Elevation/Places).
- El navegador solo usa **Maps JS SDK** para render.
- Todo lo pagado va por **servidor** (`/api/google/*` + `app/actions.ts`) con **logs + caché + rate-limit + trazabilidad** (`clientId` + `user_id`).

## Estado actual
### Hecho (cerrado)
- Trial vs Login:
  - Trial: **máx 10 días**, **máx 2 waypoints**, **máx 2 supercat/día** por `clientId`.
  - Login: desbloqueo de límites + `username` en `user_metadata`.
- QA: `scripts/test-mutation-map.js` (Puppeteer) → asegura **0 llamadas directas** a Google paid APIs desde el browser.
- Elevation/Directions UI: `authToken` propagado a endpoints server-side.
- **Predictivos (Autocomplete)**: restaurado via endpoint server-side `GET /api/google/places-autocomplete` (solo logueados).

### En curso
- Cierre completo de “trial gasto cero” para cualquier UI que dispare `/api/google/*`.

## Próximo bloque (P1 — esta semana)
Objetivo: en trial, **ninguna acción** debe provocar llamadas server-side pagadas “extra” por UX.

Checklist:
- [ ] `AdjustStageModal`: pasar `trialMode` y bloquear `/api/google/geocode-address` en trial.
- [ ] `useStageNavigation`: evitar geocoding táctico en trial (o no-op con aviso).
- [ ] `useElevation`: confirmar bloqueo en trial (o gating equivalente) y que UI muestra aviso.
- [ ] `/share/[id]`: revisar llamadas a `/api/google/directions` y decidir política (p.ej. requerir login si no existe polyline/overview).

## Siguiente (P2 — 1-2 semanas)
- [ ] Sanitizar logs: redactar API keys (`key=...`) antes de persistir/mostrar.
- [ ] Endurecer rate-limit por endpoint (especialmente autocomplete, directions, geocode).
- [ ] Homogeneizar “Auth required” en endpoints sensibles y mensajes UX.

## Backlog (P3/P4)
- [ ] Mejorar UX del autocomplete (teclado/enter/highlight) sin cambiar el principio de costes.
- [ ] Auditoría/visor: agregados por `clientId`/`user_id`, top endpoints, coste por día.

## Cómo aplicar este ROADMAP al visor `/roadmap`
Este repo tiene scripts para Supabase:
- `node scripts/sync-roadmap.js` → sube este `ROADMAP.md` a la tabla `roadmap` (id=`main`).
- `node scripts/check-roadmap.js` → verifica que Supabase lo tiene.

Requiere en `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
