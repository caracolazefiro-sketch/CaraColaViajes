# 📊 Cómo Ver Logs de APIs en Google Cloud Console

## 🌩️ Acceso Directo a Google Cloud Logging

Google registra automáticamente TODAS las llamadas a sus APIs. Para verlas:

### 1. Ir al Dashboard de APIs
```
https://console.cloud.google.com/apis/dashboard
```

### 2. Ver Métricas por API

#### Directions API:
```
https://console.cloud.google.com/apis/api/directions-backend.googleapis.com/metrics
```

#### Geocoding API:
```
https://console.cloud.google.com/apis/api/geocoding-backend.googleapis.com/metrics
```

#### Places API:
```
https://console.cloud.google.com/apis/api/places-backend.googleapis.com/metrics
```

#### Maps JavaScript API:
```
https://console.cloud.google.com/apis/api/maps-backend.googleapis.com/metrics
```

---

## 📈 Qué Métricas Puedes Ver:

### En el Dashboard de cada API verás:

1. **Tráfico (Traffic)**
   - Requests por minuto/hora/día
   - Gráficas de uso en tiempo real

2. **Errores (Errors)**
   - Requests fallidos
   - Códigos de error
   - Tasas de error

3. **Latencia (Latency)**
   - Tiempo de respuesta promedio
   - Percentiles (p50, p95, p99)

4. **Cuotas (Quotas)**
   - Uso actual vs límite
   - Porcentaje consumido
   - Alertas de límite

---

## 📊 Crear Informe Completo en Google Cloud

### Paso 1: Ir a Monitoring
```
https://console.cloud.google.com/monitoring
```

### Paso 2: Crear Dashboard Personalizado

1. Click en "Dashboards" → "Create Dashboard"
2. Nombre: "CaraColaViajes - APIs Usage"
3. Agregar widgets:

#### Widget 1: Directions API - Requests
```
Metric: serviceruntime.googleapis.com/api/request_count
Filter: service_name="directions-backend.googleapis.com"
```

#### Widget 2: Geocoding API - Requests
```
Metric: serviceruntime.googleapis.com/api/request_count
Filter: service_name="geocoding-backend.googleapis.com"
```

#### Widget 3: Total Latency
```
Metric: serviceruntime.googleapis.com/api/request_latencies
Aggregation: mean
```

#### Widget 4: Error Rate
```
Metric: serviceruntime.googleapis.com/api/request_count
Filter: response_code_class="4xx" OR response_code_class="5xx"
```

### Paso 3: Configurar Alertas

En "Monitoring" → "Alerting":

```yaml
Alerta 1: Uso excesivo
  Condición: request_count > 1000 por hora
  Notificación: Email

Alerta 2: Errores
  Condición: error_rate > 5%
  Notificación: Email

Alerta 3: Cuota
  Condición: quota_usage > 80%
  Notificación: Email
```

---

## 📥 Exportar Datos Históricos

### Opción A: Exportar a BigQuery (Gratis hasta 10GB)

1. Ir a: https://console.cloud.google.com/logs/exports
2. Create Sink
3. Sink name: "api-logs-bigquery"
4. Sink service: BigQuery
5. Crear dataset: "api_logs"
6. Filtros:
```
resource.type="api"
protoPayload.serviceName=("directions-backend.googleapis.com" OR "geocoding-backend.googleapis.com")
```

**Consultas SQL en BigQuery:**

```sql
-- Total de llamadas por API (último mes)
SELECT
  protoPayload.serviceName,
  COUNT(*) as total_calls,
  DATE(timestamp) as date
FROM `proyecto.api_logs.cloudaudit_googleapis_com_data_access_*`
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY protoPayload.serviceName, date
ORDER BY date DESC;

-- Llamadas por día con duración promedio
SELECT
  DATE(timestamp) as date,
  protoPayload.serviceName,
  COUNT(*) as calls,
  AVG(protoPayload.latency) as avg_latency_ms
FROM `proyecto.api_logs.cloudaudit_googleapis_com_data_access_*`
GROUP BY date, protoPayload.serviceName
ORDER BY date DESC;

-- Top errores
SELECT
  protoPayload.status.code,
  protoPayload.status.message,
  COUNT(*) as error_count
FROM `proyecto.api_logs.cloudaudit_googleapis_com_data_access_*`
WHERE protoPayload.status.code != 0
GROUP BY protoPayload.status.code, protoPayload.status.message
ORDER BY error_count DESC;
```

### Opción B: Exportar a CSV

1. Ir a: https://console.cloud.google.com/logs/query
2. Query:
```
resource.type="api"
protoPayload.serviceName=~"directions|geocoding"
```
3. Click en "Actions" → "Download logs"
4. Formato: CSV o JSON

---

## 🎯 Dashboard Recomendado (Simple)

Para empezar, crea un dashboard con estos 4 widgets:

```
┌─────────────────────────────────────────────┐
│  📊 CaraColaViajes - API Usage Dashboard   │
├─────────────────────┬───────────────────────┤
│  Directions API     │  Geocoding API        │
│  [Gráfica líneas]   │  [Gráfica líneas]     │
│  Requests/hora      │  Requests/hora        │
├─────────────────────┼───────────────────────┤
│  Latencia Promedio  │  Tasa de Errores      │
│  [Gauge]            │  [Número grande]      │
│  ~1500ms            │  0.2%                 │
└─────────────────────┴───────────────────────┘
```

---

## 💰 Costos y Límites

### Logging (Gratis):
- Primeros 50GB/mes: GRATIS
- Tu uso estimado: < 1GB/mes ✅

### BigQuery (Gratis):
- Primeros 10GB almacenamiento: GRATIS
- Primeros 1TB queries: GRATIS
- Tu uso estimado: < 100MB ✅

### Cloud Monitoring (Gratis):
- Hasta 150 métricas: GRATIS
- Dashboards ilimitados: GRATIS
- Tu uso: ~4 métricas ✅

**Conclusión:** TODO GRATIS para tu volumen de uso 🎉

---

## 📱 App Móvil

Descarga "Google Cloud Console" app:
- iOS: https://apps.apple.com/app/google-cloud-console/id1005120814
- Android: https://play.google.com/store/apps/details?id=com.google.android.apps.cloudconsole

Verás notificaciones push de alertas en tiempo real.

---

## 🔔 Configurar Email de Alertas

1. Ir a: https://console.cloud.google.com/monitoring/alerting/notifications
2. Add Notification Channel
3. Type: Email
4. Email: tu-email@ejemplo.com
5. Usar en las alertas configuradas arriba
