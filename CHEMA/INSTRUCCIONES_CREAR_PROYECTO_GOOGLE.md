# Crear Nuevo Proyecto Google Cloud (15 minutos)

## Paso 1: Crear proyecto
1. Ve a: https://console.cloud.google.com/projectcreate
2. **Asegúrate de estar logueado con:** caracola.zefiro@gmail.com
3. **Nombre del proyecto:** CaraColaViajes-Production
4. Click **"Create"**

## Paso 2: Habilitar APIs (todas necesarias)
Ve a: https://console.cloud.google.com/apis/library

Busca y habilita (click en "ENABLE") cada una:
- ✅ Maps JavaScript API
- ✅ Routes API
- ✅ Directions API (para motor malo)
- ✅ Geocoding API
- ✅ Places API (New)
- ✅ Custom Search JSON API (para buscador)

## Paso 3: Crear API Key
1. Ve a: https://console.cloud.google.com/apis/credentials
2. Click **"+ CREATE CREDENTIALS"** → **"API key"**
3. Copia la key (formato: AIzaSy...)
4. Click en **"RESTRICT KEY"**

## Paso 4: Configurar restricciones (IMPORTANTE)
En la página de la API key:

### Application restrictions:
- Tipo: **HTTP referrers (websites)**
- Añade estos referrers:
  ```
  https://*.vercel.app/*
  http://localhost:*/*
  ```

### API restrictions:
- Selecciona: **Restrict key**
- Marca estas APIs:
  - ✅ Maps JavaScript API
  - ✅ Routes API
  - ✅ Directions API
  - ✅ Geocoding API
  - ✅ Places API (New)
  - ✅ Custom Search JSON API

Click **"SAVE"**

## Paso 5: Habilitar billing
1. Ve a: https://console.cloud.google.com/billing
2. Link el proyecto con tu cuenta de billing (tienes $200 de crédito)

## Paso 6: Actualizar claves en proyecto
1. Copia tu nueva API key
2. Actualiza Vercel:
   - Ve a: https://vercel.com/caracola/cara-cola-viajes-pruebas/settings/environment-variables
   - Actualiza `GOOGLE_MAPS_API_KEY_FIXED` y `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - Marca: Production, Preview, Development
3. Actualiza `.env.local` en tu PC
4. Trigger redeploy en Vercel

¡Listo! Ambos motores deberían funcionar.
