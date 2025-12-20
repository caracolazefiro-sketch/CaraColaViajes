# Estudio potencial CaraCola Viajes (visión CFO)

Fecha: 19/DIC/2025

Este documento responde a:
- Tamaño de mercado potencial en Europa (basado en datos ECF).
- Forecast de usuarios año 1–3 (con escenarios).
- Sostenibilidad económica (coste variable de APIs) usando **modelo Places de 6 llamadas**.

---

## 1) Fuente de datos (ECF)

Fuente: European Caravan Federation (ECF). Explicación de tipos de vehículos (Caravans vs Motor Caravans):
https://www.e-c-f.com/artikel/vehicles/

Datos usados (en el repo):
- Stock (vehículos “en uso”) 2020: `CHEMA/ANALISIS/DATOS USUARIOS EUR/europabestand_C-RM.pdf`
- Matriculaciones (nuevos) 2021–2024 y 2025 (ene–jun): PDFs en `CHEMA/ANALISIS/DATOS USUARIOS EUR/`

Parser y outputs generados:
- Script: `scripts/parse-ecf-vehicles.js`
- Outputs: `data/ecf/europe-stock-2020.json`, `data/ecf/europe-registrations.json`, `data/ecf/europe-summary.json`

---

## 2) Tamaño del mercado (TAM) — Europa

### 2.1 Stock 2020 (poseedores)

Total Europa (ECF, 2020):
- Caravanas: **3.470.250**
- Autocaravanas (Motor Caravans): **2.427.942**
- Total Leisure Vehicles: **5.898.192**

Países grandes por stock total (2020):
- Alemania: 1.397.213
- Francia: 1.098.800
- Reino Unido: 805.919
- Países Bajos: 569.998
- Suecia: 394.483
- España: 311.800

España representa aprox. **5,29%** del total (311.800 / 5.898.192).

### 2.2 Evolución por matriculaciones (2021–2024)

Totales ECF (Leisure Vehicles Total):
- 2021: 260.043
- 2022: 218.390
- 2023: 210.090
- 2024: 221.207
- 2025 (ene–jun): 125.925 (parcial)

Cumulado 2021–2024: **909.730** vehículos nuevos.

### 2.3 “Stock 2025” (estimación)

ECF da stock 2020 y matriculaciones anuales, pero NO da bajas/desguace.
Como CFO, doy rango:

- **Techo (sin bajas):** 5,90M + 0,91M (2021–24) + ~0,25M (2025 anualizado desde H1) ≈ **7,06M**
- **Suelo (con bajas):** si asumimos 3% de bajas anuales sobre stock (aprox) durante 5 años, el ajuste acumulado puede ser grande.

Recomendación práctica para forecasting: trabajar con **rango 6,2M – 7,1M** como “stock actual aproximado”.

---

## 3) Definición de mercado servible (SAM)

Tu nicho declarado:
- Usuarios **itinerantes** que planifican rutas con etapas y necesitan un “itinerario completo” sin usar muchas webs.
- Campistas fijos NO son target.

Como no tenemos una estadística ECF de “itinerantes”, SAM se modela con un porcentaje del TAM.
Propongo 3 valores para sensibilidad:
- Conservador: 25% del TAM
- Base: 35% del TAM
- Optimista: 50% del TAM

Con TAM 5,9M (stock 2020), SAM base ≈ **2,06M** potenciales.

---

## 4) SOM (usuarios reales) — forecast año 1–3

Tu realidad de go-to-market:
- Producto usable en toda Europa desde el inicio.
- Canal “fuerte” inicial: **España** (comunidades, foros, WhatsApp, influencers).
- En el resto: inicialmente orgánico (SEO/boca-oreja), sin canal fuerte confirmado.

### Escenarios de adopción (usuarios activos/año)

Para no inventar CAC ni tráfico, doy escenarios por penetración del SAM:

**Escenario Conservador**
- Año 1: 0,03% del SAM
- Año 2: 0,08% del SAM
- Año 3: 0,15% del SAM

**Escenario Base**
- Año 1: 0,07% del SAM
- Año 2: 0,20% del SAM
- Año 3: 0,45% del SAM

**Escenario Agresivo**
- Año 1: 0,15% del SAM
- Año 2: 0,45% del SAM
- Año 3: 1,00% del SAM

Con SAM base ≈ 2,06M:
- Conservador: 600 → 1.650 → 3.090
- Base: 1.440 → 4.120 → 9.270
- Agresivo: 3.090 → 9.270 → 20.600

Nota: estos “activos” pueden ser free o paid según modelo de monetización.

---

## 5) Monetización (2 modelos) y riesgo control

### Modelo A: Año 1 gratis total (con límites)

Pros:
- Acelera adopción y aprendizaje.
- Acelera crecimiento de caché (reduce coste unitario futuro).

Contras:
- Coste variable sin ingresos. Si despega rápido, necesitas límites o te come presupuesto.

Conclusión CFO:
- **Válido solo si imponemos límites claros** (p.ej. límites diarios/semanales de búsquedas) y monitorizamos coste semanal.

### Modelo B: 1 mes gratis + 20€/año

Pros:
- Ingreso temprano, riesgo controlado.
- Coste variable principalmente asociado a usuarios que pagan.

Contras:
- Menos adopción inicial → caché crece más lento.

Conclusión CFO:
- **Más sostenible y predecible** desde el día 1.

---

## 6) Coste variable de APIs (modelo 6 llamadas)

Decisión actual: **vamos con 6 llamadas** por mejor calidad.

### 6.1 Definición “caché madura” (para presupuestar)

En términos de costes (medible por hit-rate):
- Caché fría: Places 0–20%, Geocoding 0–40%
- Caché creciendo: Places 20–60%, Geocoding 40–80%
- Caché madura: Places 60–85%, Geocoding 80–95%

Regla: el ahorro real escala con $(1 - hitRate)$.

### 6.2 Supuestos de coste unitario (USD)

Basado en docs del repo:
- Places Nearby: $0.032 / request
- Geocoding: $0.005 / request
- Directions: aproximación usada en el logger: $0.005 + $0.005 × waypoints
- Places Autocomplete: $0.011 / “sesión”

Autocomplete: confirmas que **sí se usa** en origen/destino.
- Uso típico: **2 sesiones/viaje** (origen + destino)
- Conservador: **3 sesiones/viaje** (si el usuario corrige 1 vez)

### 6.3 3 tipos estándar de viaje (tu definición)

- Económico: 7 días, 1 parada, 2 categorías + GAS en parada, 6 en destino
  - Places calls = 1×(2+1) + 6 = 9
- Estándar: 15 días, 6 paradas, 2 categorías/parada, 6 en destino
  - Places calls = 6×2 + 6 = 18
- Caro: 30 días, 12 paradas, 2 categorías/parada, 6 en destino
  - Places calls = 12×2 + 6 = 30

Reparto realista (tu input) para presupuestar:
- Económico / Estándar / Caro = **10% / 40% / 50%**

Con ese mix, Places calls medios por viaje ≈ 0,10×9 + 0,40×18 + 0,50×30 = **23,1 calls/viaje**.

### 6.4 Coste Places por viaje (solo Places)

Sin caché (peor caso):
- Económico: 9×0.032 = **$0.288**
- Estándar: 18×0.032 = **$0.576**
- Caro: 30×0.032 = **$0.960**

Con caché madura (ejemplo Places hit 70%):
- Económico: $0.288×0.30 = **$0.086**
- Estándar: $0.576×0.30 = **$0.173**
- Caro: $0.960×0.30 = **$0.288**

Coste Places medio (con tu mix):
- Sin caché: 23,1×0.032 = **$0.739/viaje**
- Con caché madura (hit 70%): $0.739×0.30 = **$0.222/viaje**

### 6.5 Coste total por viaje (todas las APIs) — rango

Esto depende mucho de Geocoding.
Tu observación (“post-segmentación alta” porque el usuario ajusta paradas) sugiere que Geocoding puede subir de forma material.

Rango CFO (mezcla 10/40/50):
- **Escenario caché madura** (Places hit ~70%, Geocoding hit alto): **~$0.30/viaje** (orden de magnitud)
- **Escenario caché fría / uso intenso** (Places hit bajo + muchas re-paradas): **~$0.90/viaje**

Nota: Directions y Autocomplete suelen ser secundarios vs Places, pero se mantienen en el modelo.

La calculadora está en `/cost-calculator` para ajustar contadores e hit-rates.

---

## 7) Presupuesto anual de APIs por volumen (10k / 30k / 60k viajes)

Como CFO, uso un rango por viaje (porque la caché mejora en el tiempo) alineado con lo anterior:
- Bajo (caché madura): **$0.30/viaje**
- Alto (caché fría / uso intenso): **$0.90/viaje**

Coste anual (USD):
- 10.000 viajes: **$3.000 – $9.000**
- 30.000 viajes: **$9.000 – $27.000**
- 60.000 viajes: **$18.000 – $54.000**

Interpretación:
- Aun en el extremo alto, el coste variable por viaje es bajo comparado con una suscripción anual de 20€.

---

## 8) Ingresos (modelo suscripción 20€/año) y margen bruto

Supuesto que nos das: **4 viajes por usuario/año**.

Conversión objetivo (modelo “1 mes gratis + 20€/año”): **5%**.

Relación viajes ↔ usuarios activos (si 4 viajes/año):
- 10.000 viajes/año → 2.500 usuarios activos
- 30.000 viajes/año → 7.500 usuarios activos
- 60.000 viajes/año → 15.000 usuarios activos

Si esos usuarios activos fueran **de pago** (tras convertir al 5%), el número de usuarios en trial requerido sería aprox. 20× más:
- 2.500 paid → ~50.000 trials/año
- 7.500 paid → ~150.000 trials/año
- 15.000 paid → ~300.000 trials/año

Ingresos brutos (si todos esos activos fueran de pago):
- 2.500 → 50.000 €/año
- 7.500 → 150.000 €/año
- 15.000 → 300.000 €/año

Con coste variable de APIs (rango alto/bajo):
- 10k viajes: $3k–$9k
- 30k viajes: $9k–$27k
- 60k viajes: $18k–$54k

Conclusión CFO:
- Con suscripción anual, **el coste de APIs no parece el cuello de botella**, incluso en 60k viajes/año.
- El riesgo grande es el **año gratis** si no limitas uso.

---

## 9) Dato pendiente para cerrar el presupuesto con precisión

Solo queda 1 dato para convertir el rango en “presupuesto cerrado”:

- En un viaje estándar (15 días), ¿cuántas **llamadas reales** de Geocoding observas hoy en logs cuando el usuario ajusta paradas “mucho”?
  - Con un número (ej. 15, 25, 40) cierro el presupuesto anual con muchísima más precisión.

---

## 10) Recomendación inicial (sin esperas)

- Mantener **modelo 6 llamadas** (mejora calidad) y controlar coste con caché y límites.
- Si quieres certeza financiera desde el día 1: **Modelo B (1 mes gratis + 20€/año)**.
- Si haces “año gratis”: obligatorio un **cap** de uso (por usuario/día/mes) + alertas de gasto.
