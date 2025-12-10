# 🔄 Análisis: Almacenamiento de Caché de Geocoding

**Fecha:** 09/DIC/2025
**Archivo analizado:** `data/geocoding-cache.json`
**Sistema:** Caché persistente de geocoding ilimitada

---

## 📊 ESTADO ACTUAL

### Archivo de Caché
- **Ubicación:** `data/geocoding-cache.json`
- **Tamaño actual:** 565 bytes (4 entradas)
- **Última modificación:** 08/12/2025 23:03
- **Estado en git:** ✅ Commiteado en rama `testing`
- **En .gitignore:** ❌ NO (se está trackeando)

### Formato
```json
{
  "lat,lng": {
    "cityName": "Ciudad",
    "timestamp": "ISO 8601",
    "lat": number,
    "lng": number
  }
}
```

### Características Técnicas
- **Precisión:** 4 decimales (~11 metros)
- **Expiración:** Ilimitada (`isEntryValid()` siempre retorna `true`)
- **Crecimiento estimado:** ~140 bytes/entrada
- **Proyección 1,000 entradas:** ~140 KB
- **Proyección 10,000 entradas:** ~1.4 MB

---

## 🎯 DECISIÓN: ¿GIT o .GITIGNORE?

### ✅ OPCIÓN A: Mantener en GIT (Recomendado para tu caso)

**Ventajas:**
1. **Efecto Red Inmediato** 💚
   - Todos los entornos (dev, staging, prod) comparten caché desde día 1
   - Nuevos deployments arrancan con caché precargada
   - Reducción de costes inmediata en producción

2. **Backup Automático** 💾
   - Caché respaldada en GitHub
   - Historial de cambios en git
   - Fácil recuperación si se corrompe

3. **Desarrollo más Rápido** ⚡
   - Desarrolladores nuevos obtienen caché poblada
   - Tests más rápidos (menos llamadas API reales)
   - Debugging simplificado

4. **Control de Versiones** 📝
   - Puedes hacer diff para ver qué ciudades se añadieron
   - Rollback posible si hay corrupciones
   - Auditoría de crecimiento

**Desventajas:**
1. **Commits frecuentes** ⚠️
   - Cada nueva ciudad genera cambio
   - Git history puede "ensuciarse"
   - Merge conflicts potenciales (raro con JSON bien formado)

2. **Tamaño del repo** 📦
   - Crece con cada entrada nueva
   - Con 10K entradas: ~1.4 MB (aceptable)
   - Con 100K entradas: ~14 MB (todavía manejable)

**Cuándo usar:**
- ✅ Proyecto pequeño/mediano (<100K entradas esperadas)
- ✅ Quieres máximo ahorro de costes desde día 1
- ✅ Team pequeño (pocos conflicts)
- ✅ Valoras backup y auditoría

---

### 🔧 OPCIÓN B: .GITIGNORE + Storage Externo

**Arquitectura:**
```
Local/Dev:     data/geocoding-cache.json (ignorado)
Staging/Prod:  Supabase Storage / S3 / Redis
```

**Ventajas:**
1. **Repo Limpio** 🧹
   - Git history sin cambios constantes de caché
   - No merge conflicts
   - Repo size estable

2. **Escalabilidad** 📈
   - Fácil crecer a millones de entradas
   - Storage dedicado con backups automáticos
   - Posible caché distribuida (Redis)

3. **Separación de Concerns** 🎯
   - Código en git, datos en storage
   - Diferentes políticas de backup
   - Más "profesional" en apps grandes

**Desventajas:**
1. **Complejidad** 🔴
   - Requiere configurar Supabase Storage / S3
   - Código adicional para sync
   - Costes adicionales de storage (~$0.02/GB/mes)

2. **Setup Inicial** ⏱️
   - Cada entorno necesita configuración
   - Caché empieza vacía en prod (más llamadas API al inicio)
   - Requiere estrategia de seeding

3. **Latencia** ⚠️
   - Network call para leer caché (vs. disco local)
   - Posible timeout si storage falla
   - Más complejo de debuggear

**Cuándo usar:**
- ✅ Proyecto grande (>100K entradas esperadas)
- ✅ Team grande (muchos devs = conflicts potenciales)
- ✅ Ya usas Supabase/S3 para otras cosas
- ✅ Priorizas repo limpio sobre simplicidad

---

### 🌐 OPCIÓN C: Híbrido (Git + Cloud Sync)

**Arquitectura:**
```
Dev:           data/geocoding-cache.json (en git, seed inicial)
Prod:          Redis / Supabase (runtime cache)
Sync diario:   Prod → Git (backup nocturno)
```

**Ventajas:**
1. Mejor de ambos mundos
2. Dev simple, prod escalable
3. Backup en git como fallback

**Desventajas:**
1. Más complejo de implementar
2. Requiere job de sync
3. Posible desincronización

---

## 💡 RECOMENDACIÓN PARA CARACOLAVIAJES

### 📌 **OPCIÓN A: Mantener en Git**

**Razones:**
1. **Tamaño proyectado manejable**
   - Con 50K viajes/mes × 0.87 geocoding/viaje = ~43,500 calls/mes
   - Asumiendo 50% son únicas = ~21,750 nuevas ciudades/mes
   - En 1 año: ~260K entradas = ~36 MB (perfectamente aceptable)

2. **ROI inmediato**
   - Cada deploy de prod arranca con caché llena
   - Staging tiene misma caché que prod
   - Desarrolladores ahorran tiempo en testing

3. **Simplicidad operacional**
   - Cero configuración adicional
   - Cero costes extras
   - Cero complejidad de infraestructura

4. **Tu contexto específico**
   - Team pequeño (bajo riesgo de conflicts)
   - Proyecto en fase de crecimiento (no millones de usuarios aún)
   - Ya tienes el sistema funcionando en testing

**Ajustes recomendados:**

1. **Añadir al commit message**
   ```bash
   git commit -m "chore: update geocoding cache (+15 cities)"
   ```
   - Usar prefijo `chore:` para no contaminar changelog de features
   - Commits de caché separados de código

2. **Git LFS (opcional, para futuro)**
   Si llegas a >10 MB, considera Git LFS:
   ```bash
   git lfs track "data/geocoding-cache.json"
   ```

3. **Documentar en README**
   Explicar que `data/geocoding-cache.json` es parte del repo y por qué

---

## 🚀 PLAN DE MIGRACIÓN (Si eliges otra opción más adelante)

### Migración a Supabase Storage (Ejemplo)

**Paso 1: Crear tabla en Supabase**
```sql
CREATE TABLE geocoding_cache (
  key TEXT PRIMARY KEY,
  city_name TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coords ON geocoding_cache(lat, lng);
```

**Paso 2: Modificar `geocoding-cache.ts`**
```typescript
import { createClient } from '@/app/supabase';

async function getCachedCityName(lat, lng) {
  const supabase = createClient();
  const key = getCacheKey(lat, lng);

  const { data } = await supabase
    .from('geocoding_cache')
    .select('city_name')
    .eq('key', key)
    .single();

  return data?.city_name || null;
}
```

**Paso 3: Seed inicial**
```bash
# Importar JSON actual a Supabase
node scripts/seed-cache-to-supabase.js
```

**Paso 4: Añadir a .gitignore**
```bash
echo "data/geocoding-cache.json" >> .gitignore
git rm --cached data/geocoding-cache.json
```

**Coste estimado:** ~$0.02/mes por 1 GB (prácticamente gratis)

---

## 📋 DECISIÓN FINAL

### ✅ Recomendación: **MANTENER EN GIT**

**Acción inmediata:** Ninguna (ya está funcionando correctamente)

**Documentar:**
```markdown
# README.md (añadir sección)

## Caché de Geocoding

El archivo `data/geocoding-cache.json` contiene una caché persistente de
coordenadas → nombres de ciudades para reducir llamadas a Google Geocoding API.

- **Ubicación:** En git (compartida entre entornos)
- **Expiración:** Ilimitada (nombres de ciudades no cambian)
- **Crecimiento:** ~140 bytes/entrada
- **Beneficio:** 63-86% reducción en llamadas API

Este archivo DEBE estar en git para maximizar ahorro de costes en producción.
```

**Monitorear:**
- Tamaño del archivo (alerta si >10 MB)
- Commits de caché (separar de features)
- Merge conflicts (si aparecen, considerar migración)

**Migrar solo si:**
- Archivo supera 50 MB
- Merge conflicts frecuentes (>1/semana)
- Necesitas caché distribuida (múltiples servidores)

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **Decisión tomada:** Mantener en git
2. 📝 **Documentar:** Añadir sección al README
3. 🔍 **Monitorear:** Tamaño y crecimiento mensual
4. 🚀 **Continuar:** Con siguiente prioridad del día

---

**Conclusión:** Para CaraColaViajes en su estado actual, mantener la caché en git
es la opción más simple, efectiva y con mejor ROI. La migración a storage externo
puede considerarse en el futuro si el tamaño se vuelve problemático (>50 MB).
