# ✅ COSTES NOMINATIM - DOCUMENTADO EN ROADMAP

## Resumen de lo anotado (10 DIC 2025)

Se han agregado al `CHEMA/RECORDATORIOS/ROADMAP.md` las siguientes secciones **CRÍTICAS**:

### 1️⃣ Nueva sección: "ANÁLISIS DE COSTES: GOOGLE MAPS API vs OPENSTREETMAP/NOMINATIM"

Ubicación en ROADMAP: **Línea 31-156** (justo después de la matriz de prioridad)

**Contenido:**

#### Tabla comparativa de costes:
```
Geocoding:        $0.005/call (Google) → $0.00/call (Nominatim) = $7.50 ahorro/año
Reverse Geocoding: $0.005/call (Google) → $0.00/call (Nominatim) = $2.50 ahorro/año
Places Search:    $0.032/call (Google) → $0.00/call (Nominatim caché) = $96.00 ahorro/año
Directions API:   $0.10/call (Google) → Sin alternativa = $10.00/año
─────────────────────────────────────────────────────────────────────
TOTAL ACTUAL:     ~$116.00/año
TOTAL OPTIMIZADO: ~$10.00/año
AHORRO TOTAL:     $106.00/año (91% reducción) ✅
```

#### Desglose de oportunidades P2:

**1. Nominatim Geocoding (URGENTE - 15 min)**
- Problema: `app/page.tsx` línea 112 usa `google.maps.Geocoder()` ($0.005/call)
- Solución: Reemplazar con Nominatim fetch
- Ahorro: $7.50/año
- Esfuerzo: ⭐ Trivial

**2. Option B: Caché Nominatim + localStorage (2-3 sem)**
- Problema: `google.places.textSearch()` sin caché persistente ($0.032/call)
- Solución: localStorage caché 30 días + Nominatim fallback
- Ahorro: $72-96/año (con 80% hit rate)
- Esfuerzo: ⭐⭐⭐ Moderado
- Archivo ya creado: `app/hooks/useNominatimCache.ts` (300+ líneas)

**3. Expandir caché Places (P3 - Futuro)**
- Ahorro: ~$70/año
- Esfuerzo: ⭐⭐ Media
- Timeline: Después de Option B

### 2️⃣ Nueva sección: "RESUMEN EJECUTIVO - ANÁLISIS DE COSTES"

Ubicación en ROADMAP: **Línea 624-656** (al final del documento)

**Contenido destacado:**

- **Descubrimiento clave:** Acceso a OpenStreetMap/Nominatim (50+ millones lugares) completamente gratuito
- **El problema:** Pagamos $116/año a Google por funciones que Nominatim hace sin costo
- **La solución:** P2 priority changes = 91% reducción de costes
- **Por qué es crítico:** Sostenibilidad a largo plazo, escalabilidad sin presupuesto

### 3️⃣ Referencias documentales

Todo está enlazado a:
- `CHEMA/ANALISIS/NOMINATIM_DETALLES_TECNICOS_10DIC25.md` (análisis completo)
- `app/hooks/useNominatimCache.ts` (implementación já lista)

---

## ¿Qué se actualizó exactamente?

| Archivo | Sección | Cambios |
|---------|---------|---------|
| `CHEMA/RECORDATORIOS/ROADMAP.md` | Línea 31-156 | ➕ Nueva sección completa de costes |
| `CHEMA/RECORDATORIOS/ROADMAP.md` | Línea 624-656 | ➕ Resumen ejecutivo final |
| `CHEMA/RECORDATORIOS/ROADMAP.md` | Línea 3 | ✏️ Actualizada fecha "COSTES NOMINATIM ADDED" |

---

## Próximas acciones recomendadas

1. **Hoy (15 min):** Implementar Nominatim Geocoding
2. **Esta semana (2-3 sem):** Iniciar Option B caché Nominatim + localStorage
3. **Después:** Expandir caché Places (P3)

---

**Documentado por:** GitHub Copilot  
**Fecha:** 10 Diciembre 2025  
**Sesión:** API Costs & Nominatim Analysis
