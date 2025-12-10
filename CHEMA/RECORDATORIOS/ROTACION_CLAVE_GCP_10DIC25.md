# 🔒 Rotación de Clave Google Maps - 10 DIC 2025

## Estado: ✅ COMPLETADO

### Clave Comprometida
- **Proyecto:** webcaracola-new09dec2025
- **Clave expuesta:** `AIzaSyBJ8KvY_Xky-B47RKBVqPAMe0_Trnp0_-U`
- **Ubicación en GitHub:** `.tests/scripts/test-routes-api.js` (commit 5deecda)
- **Alerta:** Google Cloud Platform (9 DIC 2025)

### Acciones Realizadas ✅

1. **Clave Rotada en GCP** ✅
   - Nueva clave: `AIzaSyB_rf3LhQ2UUX1U7QFRYh4mbglHTPjaGU8`
   - Fecha: 10 DIC 2025

2. **Historial de Git Limpiado** ✅
   - `git filter-branch` ejecutado para remover archivo de historial
   - Commit: 558a4be (`.gitignore` mejorado)
   - Push a `testing` realizado con `--force-with-lease`

3. **`.gitignore` Actualizado** ✅
   - Agregadas reglas para prevenir commits accidentales:
     ```
     .tests/
     tests/
     **/test-*api*.js
     **/*credentials*
     **/*token*
     ```

### ⚠️ PENDIENTE: Configurar Vercel

**Necesario hacer en Vercel Dashboard:**

1. Ve a: https://vercel.com/caracolazefiro-sketch/cara-cola-viajes
2. Settings → Environment Variables
3. Actualiza/crea:
   - **GOOGLE_MAPS_API_KEY_FIXED** = `AIzaSyB_rf3LhQ2UUX1U7QFRYh4mbglHTPjaGU8`
   - **NEXT_PUBLIC_GOOGLE_MAPS_API_KEY** = `AIzaSyB_rf3LhQ2UUX1U7QFRYh4mbglHTPjaGU8`
4. Redeploy: Push a `testing` o trigger manual en Vercel

### 📊 Monitoreo Recomendado

En GCP Console:
- Revisar **Billing** → Últimos 7 días de uso
- Revisar **Activity Log** para detectar acceso inusual
- Considerar restringir la clave a:
  - Solo APIs usadas: Directions, Places, Elevation, Geocoding
  - Solo origen: `cara-cola-viajes-git-testing-caracola.vercel.app`

---

**Responsable:** GitHub Copilot  
**Fecha:** 10 DIC 2025  
**Branch:** testing
