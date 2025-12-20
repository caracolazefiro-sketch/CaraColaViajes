# Resumen imprimible — Costes API (Google Places) para “1 mes por Europa”

**Fecha:** 17/DIC/2025  
**Objetivo:** comparar escenarios de diseño del buscador de servicios (POIs) y su impacto en **número de llamadas** y **coste estimado**.

---

## Supuestos (para todos los escenarios)

- Viaje de **30 días / 30 paradas** (1 parada por día).
- En cada parada el usuario usa los servicios (pulsando los toggles), por lo que las búsquedas son **user-driven**.
- **Cambio de ruta/sitios:** el 50% de paradas cambian → **15 días nuevos**.
- **Sin caché** (peor caso). Con caché (Supabase) el coste puede bajar mucho si hay repetición de coordenadas/radio.
- **Precio de referencia Places Nearby Search:** $32.00 por 1000 requests ⇒ **$0.032 por request**.
  - Confirmación: pricing list oficial de Google Maps Platform (Nearby Search Pro / legacy Nearby Search).

> Nota: el número real de requests por día depende de si existe `next_page_token` (paginación). Aquí lo tratamos como escenarios explícitos.

---

## Cómo leer los cálculos

- Requests por día = suma de requests que hacemos en cada “bloque” de servicios.
- Coste = requests × 0.032 USD.

---

## Escenario A — Config anterior (2 combos, con paginación)

**Bloques**
- Combo 1: Dormir + Comer + Super (3 categorías)
- Combo 2: Gas + Lavar + Turismo (3 categorías)

**Requests por día (sin caché)**
- Combo 1: 3 a 6 requests (3 búsquedas × 1–2 páginas)
- Combo 2: 1 a 3 requests (1 búsqueda × 1–3 páginas)
- **Total por día:** 4 a 9 requests

**Coste “mes Europa” (30 días)**
- Requests: 30 × (4 a 9) = **120 a 270**
- Coste: 120×0.032 a 270×0.032 = **$3.84 a $8.64**

**Coste extra por cambios (15 días nuevos)**
- Requests: 15 × (4 a 9) = **60 a 135**
- Coste: 60×0.032 a 135×0.032 = **$1.92 a $4.32**

**Total (30 días + cambios 50%)**
- Requests: **180 a 405**
- Coste: **$5.76 a $12.96**

---

## Escenario B — Estrategia agresiva (4 bloques, 1 página cada uno)

**Bloques (tal y como se quiere implementar ahora)**
1) **Spots (Dormir):** 1 request → 20 resultados exclusivos
2) **Comer + Super:** 1 request → 20 resultados totales a repartir (restaurant/supermarket)
3) **Gas + Lavar:** 1 request → 20 resultados totales a repartir (gas/laundry)
4) **Turismo:** 1 request → 20 resultados exclusivos

**Requests por día (sin caché)**
- 1 por bloque × 4 bloques = **4 requests/día**

**Coste “mes Europa” (30 días)**
- Requests: 30 × 4 = **120**
- Coste: 120×0.032 = **$3.84**

**Coste extra por cambios (15 días nuevos)**
- Requests: 15 × 4 = **60**
- Coste: 60×0.032 = **$1.92**

**Total (30 días + cambios 50%)**
- Requests: **180**
- Coste: **$5.76**

**Observación de calidad**
- Ventaja: coste “determinista” y controlado.
- Riesgo: al haber solo 20 resultados por bloque, en zonas densas puede quedarse corto (sobre todo Comer).

---

## Escenario C — Híbrido recomendado (prioridad dormir)

**Idea**
- Dormir (Spots): permitir 2 páginas (hasta 40) para asegurar cobertura.
- Resto de bloques: 1 página.

**Requests por día (sin caché)**
- Spots: 2
- Comer+Super: 1
- Gas+Lavar: 1
- Turismo: 1
- **Total:** 5 requests/día

**Coste “mes Europa” (30 días)**
- Requests: 30 × 5 = **150**
- Coste: 150×0.032 = **$4.80**

**Coste extra por cambios (15 días nuevos)**
- Requests: 15 × 5 = **75**
- Coste: 75×0.032 = **$2.40**

**Total (30 días + cambios 50%)**
- Requests: **225**
- Coste: **$7.20**

---

## Tabla resumen

| Escenario | Requests/día | Requests (30d) | Coste (30d) | +Cambios (15d) | Total (30d+15d) |
|---|---:|---:|---:|---:|---:|
| A) 2 combos con paginación | 4–9 | 120–270 | $3.84–$8.64 | $1.92–$4.32 | $5.76–$12.96 |
| B) 4 bloques, 1 página | 4 | 120 | $3.84 | $1.92 | $5.76 |
| C) Híbrido (dormir 2 páginas) | 5 | 150 | $4.80 | $2.40 | $7.20 |

---

## Nota sobre caché

Con caché (Supabase), si el usuario repite búsquedas en la misma parada (misma coordenada y radio), el coste se reduce a **0 requests** para esos hits. En un uso realista (volver atrás, reabrir, reintentar), la caché puede bajar el coste notablemente.
