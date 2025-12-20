# Context pack — Chat CFO (CaraCola Viajes)

Fecha: 19/DIC/2025

## 1) Objetivo del chat CFO

Tomar decisiones de negocio con enfoque CFO:
- Tamaño de mercado Europa (TAM/SAM/SOM) usando datos ECF.
- Forecast de usuarios años 1–3.
- Sostenibilidad económica (costes variables de APIs) y riesgo.
- Comparación de monetización:
  - A) Año 1 gratis (con límites)
  - B) 1 mes gratis + 20€/año

## 2) Decisiones ya tomadas / supuestos “bloqueados”

- Se prioriza calidad: **modelo “6 llamadas”** (Places) frente a “4 llamadas”.
- Mix de viajes para presupuestar (input del usuario): **10% Económico / 40% Estándar / 50% Caro**.
- Conversión esperada a pago (modelo 1 mes + 20€/año): **5%**.
- Autocomplete se usa: típico **2 sesiones/viaje** (origen+destino); conservador 3.
- “Post-segmentación alta”: usuarios ajustan paradas → sube Geocoding/Places respecto a un uso “mínimo”.

## 3) Dónde está todo en el repo (links)

- Informe CFO principal (TAM/SAM/SOM + monetización + costes):
  - [CHEMA/ANALISIS/ESTUDIO_POTENCIAL_CARACOLA_VIAJES_CFO.md](ESTUDIO_POTENCIAL_CARACOLA_VIAJES_CFO.md)

- Datos ECF parseados a JSON:
  - [data/ecf/europe-summary.json](../../data/ecf/europe-summary.json)
  - [data/ecf/europe-stock-2020.json](../../data/ecf/europe-stock-2020.json)
  - [data/ecf/europe-registrations.json](../../data/ecf/europe-registrations.json)

- Script parser ECF (PDF → JSON):
  - [scripts/parse-ecf-vehicles.js](../../scripts/parse-ecf-vehicles.js)

- Calculadora de costes (staging):
  - Página: [app/cost-calculator/page.tsx](../../app/cost-calculator/page.tsx)
  - Ruta: `/cost-calculator`

- Server action (segmentación + logging + coste):
  - [app/actions.ts](../../app/actions.ts)

## 4) Números clave (ECF)

Fuente: European Caravan Federation (ECF). PDFs locales parseados (no commiteados) bajo `CHEMA/ANALISIS/DATOS USUARIOS EUR/`.

De [data/ecf/europe-summary.json](../../data/ecf/europe-summary.json):
- Stock Europa 2020 total: **5.898.192**
  - Caravanas: 3.470.250
  - Motor caravans: 2.427.942
- Matriculaciones totales (Leisure Vehicles Total):
  - 2021: 260.043
  - 2022: 218.390
  - 2023: 210.090
  - 2024: 221.207
  - 2025 H1: 125.925 (parcial)

Rango práctico de “stock actual” propuesto en el informe CFO (por falta de bajas): **6,2M – 7,1M**.

## 5) Costes unitarios (USD) usados en el modelo

Estos son los números que usa el modelo interno (ver informe y calculadora):
- Places Nearby / Places API (incl. “API New searchNearby”): **$0.032 / request**
- Geocoding: **$0.005 / request**
- Directions (aprox logger): **$0.005 + $0.005 × waypoints**
- Places Autocomplete: **$0.011 / sesión**
- Weather (Open-Meteo): **$0**

## 6) Modelado de caché (hit-rate)

En la calculadora se usa hit-rate start/end y promedio anual: `avg = (start + end)/2`.

Rangos operativos propuestos:
- Caché fría: Places 0–20%, Geocoding 0–40%
- Caché creciendo: Places 20–60%, Geocoding 40–80%
- Caché madura: Places 60–85%, Geocoding 80–95%

## 7) “Qué falta por cerrar” en el chat CFO

- Ajustar el rango de coste/viaje con medición real (logs) en un escenario hiper-realista.
- Conectar forecast de usuarios → volumen de viajes/año → presupuesto APIs → margen y sensibilidad.
- Definir límites/rate-limits si se elige Modelo A (año gratis) para evitar riesgo de runaway cost.

## 8) Preguntas para arrancar el chat CFO (copiar y responder)

1) ¿Cuántos viajes promedio/año por usuario activo? (el informe asume un orden de magnitud, conviene fijarlo)
2) ¿Qué % de usuarios hacen “búsqueda intensiva” (post-segmentación alta) vs “uso estándar”?
3) ¿Queremos límites por usuario (diario/semanal) en el plan gratuito? ¿Cuáles?
4) ¿Qué tasa de crecimiento de caché consideramos realista por país (España primero vs Europa)?
