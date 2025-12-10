# MIGRACIÓN MOTOR BUENO → MOTOR MALO

**Objetivo:** Consolidar motor bueno en ruta principal (`/`)
**Estado:** PENDIENTE (Step 3 plan usuario)
**Prioridad:** BAJA (después de arreglar bugs motor bueno)

---

## CONTEXTO

### Situación Actual
- **Motor Malo (`/`):** Funciona perfectamente pero CSS básico
- **Motor Bueno (`/motor-bueno`):** CSS mejorado pero tiene 2 bugs

### Objetivo Final
**Tener un solo motor en `/` que combine:**
- ✅ Funcionalidad perfecta de motor malo
- ✅ CSS/UI mejorado de motor bueno

---

## PLAN DE MIGRACIÓN (3 STEPS)

### Step 1: ✅ COMPLETADO
**Arreglar selector waypoints motor malo**
- Commit: 514eb3c
- Resultado: Selector funciona

### Step 2: ❌ PENDIENTE (CRÍTICO)
**Arreglar bugs motor bueno**
1. Fix 254km bug (línea ~310 actions.ts)
2. Fix coordenadas bug (línea ~110 actions.ts)
3. Testing completo
4. **BLOQUEANTE:** No continuar hasta que motor bueno funcione perfecto

### Step 3: ❌ PENDIENTE (DESPUÉS DE STEP 2)
**Migrar CSS motor bueno → motor malo**
- Solo cambios cosméticos
- NO tocar lógica funcional
- Preservar `app/actions.ts` (funcionamiento perfecto)

---

## ESTRATEGIA DE MIGRACIÓN

### Opción A: Migración CSS Selectiva (RECOMENDADA)
**Enfoque:** Copiar solo estilos, no lógica

**Archivos a migrar:**
1. `app/motor-bueno/styles/motor.css` → Integrar en `app/globals.css`
2. Clases CSS de componentes motor bueno → Aplicar a motor malo
3. Layout/diseño de itinerario

**Archivos NO TOCAR:**
- ❌ `app/page.tsx` (motor malo) - Solo cambiar clases CSS
- ❌ `app/actions.ts` (motor malo) - NO MODIFICAR
- ❌ `app/components/TripForm.tsx` - Ya funciona

**Procedimiento:**
```bash
# 1. Backup motor malo actual
git tag "backup-motor-malo-pre-css-migration"

# 2. Identificar clases CSS motor bueno
grep -r "className=" app/motor-bueno/page.tsx > motor-bueno-classes.txt

# 3. Copiar estilos relevantes
cat app/motor-bueno/styles/motor.css >> app/globals.css

# 4. Aplicar clases a motor malo (uno por uno)
# Editar app/page.tsx solo cambiando className="..."

# 5. Testing visual
npm run dev
# Verificar / se ve como /motor-bueno
# Verificar funcionalidad sigue igual

# 6. Commit
git commit -m "MOTOR MALO: integrar CSS de motor bueno (solo estilos)"
```

### Opción B: Migración Completa (NO RECOMENDADA)
**Riesgo:** Muy alto de romper funcionalidad

❌ NO usar esta opción sin autorización explícita

---

## COMPARACIÓN ARCHIVOS

### CSS/Estilos Motor Bueno
**Archivo:** `app/motor-bueno/styles/motor.css`
**Características:**
- Grid layout moderno
- Cards con sombras
- Colores marca
- Responsive design
- Animaciones suaves

### CSS Motor Malo
**Archivo:** `app/globals.css`
**Características:**
- Layout básico
- Estilos funcionales mínimos
- Sin animaciones
- CSS antiguo

### Diferencias Visuales Clave
| Elemento | Motor Malo | Motor Bueno |
|----------|------------|-------------|
| Formulario | Form básico | Card elevado |
| Itinerario | Lista simple | Cards con iconos |
| Mapa | Básico | Con controles custom |
| Colores | Genéricos | Palette marca |
| Espaciado | Compacto | Aireado |
| Tipografía | Default | Geist (Next.js) |

---

## ARCHIVOS INVOLUCRADOS

### Motor Malo (NO TOCAR LÓGICA)
```
app/
├── page.tsx                    ← Cambiar solo className
├── actions.ts                  ← NO MODIFICAR ⚠️
├── globals.css                 ← Agregar estilos motor bueno
└── components/
    └── TripForm.tsx           ← Cambiar solo className si necesario
```

### Motor Bueno (REFERENCIA)
```
app/motor-bueno/
├── page.tsx                    ← Ver estructura JSX
├── styles/motor.css           ← Copiar estilos de aquí
└── components/                 ← Ver componentes UI
    ├── MotorSearch.tsx
    ├── MotorItinerary.tsx
    └── MotorComparisonMaps.tsx
```

---

## CHECKLIST PRE-MIGRACIÓN

Antes de empezar Step 3, verificar:

- [ ] Motor bueno funciona perfectamente (Step 2 completo)
- [ ] Testing exhaustivo motor bueno
- [ ] Commit de backup creado (`git tag backup-...`)
- [ ] Motor malo sigue funcionando en producción
- [ ] Identificados estilos a migrar
- [ ] Plan de rollback claro

---

## TESTING POST-MIGRACIÓN

### Testing Funcional (CRÍTICO)
Después de aplicar CSS, verificar motor malo:

1. ✅ Cálculo ruta Salamanca → Copenhague
2. ✅ Waypoints París, Bruselas funcionan
3. ✅ Segmentación ~300km
4. ✅ Nombres ciudad correctos
5. ✅ Fechas correctas
6. ✅ Mapa renderiza
7. ✅ PDF genera

### Testing Visual
1. ✅ Layout como motor bueno
2. ✅ Colores consistentes
3. ✅ Responsive (mobile, tablet, desktop)
4. ✅ Animaciones suaves
5. ✅ Sin errores console

---

## ROLLBACK PLAN

Si algo sale mal durante migración CSS:

```bash
# Opción 1: Revert último commit
git revert HEAD --no-edit
git push

# Opción 2: Volver a tag backup
git reset --hard backup-motor-malo-pre-css-migration
git push --force

# Opción 3: Restaurar archivo específico
git checkout HEAD~1 -- app/page.tsx
git commit -m "ROLLBACK: restaurar page.tsx motor malo"
git push
```

---

## COMPONENTES A MIGRAR (VISUAL)

### 1. Header/Formulario de Búsqueda
**Motor Bueno:**
```tsx
<div className="motor-search-card">
  <h2 className="motor-title">Planifica tu ruta</h2>
  <form className="motor-form">
    {/* ... */}
  </form>
</div>
```

**Aplicar a Motor Malo:**
- Mantener lógica de estado
- Cambiar solo classes CSS

### 2. Itinerario
**Motor Bueno:**
```tsx
<div className="itinerary-card">
  <div className="day-item">
    <div className="day-badge">{day.day}</div>
    <div className="day-content">
      <h3>{day.from} → {day.to}</h3>
      <p>{day.distance} km</p>
    </div>
  </div>
</div>
```

**Aplicar a Motor Malo:**
- Preservar datos de `dailyItinerary`
- Cambiar solo estructura HTML + classes

### 3. Mapa
**Motor Bueno:**
```tsx
<div className="map-container">
  <GoogleMap {...mapProps} />
</div>
```

**CSS a copiar:**
```css
.map-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  height: 600px;
}
```

---

## ESTILOS ESPECÍFICOS A MIGRAR

### Palette de Colores
```css
/* Motor Bueno - Copiar a globals.css */
:root {
  --color-primary: #4F46E5;
  --color-secondary: #10B981;
  --color-accent: #F59E0B;
  --color-background: #F9FAFB;
  --color-card: #FFFFFF;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
}
```

### Cards/Elevation
```css
.card {
  background: var(--color-card);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  padding: 24px;
}
```

### Typography
```css
.title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 1rem;
}
```

---

## ERRORES A EVITAR

### ❌ NO HACER
1. Copiar `app/motor-bueno/actions.ts` → `app/actions.ts`
2. Reemplazar `app/page.tsx` completamente
3. Modificar lógica de cálculo de rutas
4. Cambiar estructura de datos `DailyPlan`
5. Tocar `TripForm.tsx` sin necesidad

### ✅ SÍ HACER
1. Copiar solo CSS de `motor.css` → `globals.css`
2. Cambiar `className` en JSX motor malo
3. Mantener toda la lógica funcional
4. Testing exhaustivo después de cada cambio
5. Commits pequeños e incrementales

---

## CRONOGRAMA ESTIMADO

| Fase | Duración | Descripción |
|------|----------|-------------|
| **Preparación** | 15 min | Backup, identificar estilos |
| **Migración CSS** | 30 min | Copiar estilos a globals.css |
| **Aplicar clases** | 45 min | Cambiar className en page.tsx |
| **Testing funcional** | 20 min | Verificar todo funciona |
| **Testing visual** | 15 min | Comprobar diseño |
| **Ajustes finales** | 20 min | Fixes pequeños |
| **Total** | ~2.5h | Con testing exhaustivo |

---

## DOCUMENTACIÓN RELACIONADA

- `RESUMEN_SESION_09DIC_MOTOR_BUENO.md` - Estado actual y bugs
- `WEB_PRODUCCION_ESTADO_09DIC.md` - Deploy actual
- `app/motor-bueno/DOCUMENTACION/` - Docs motor bueno antiguo (referencia)

---

## RESUMEN EJECUTIVO

**Estado actual:** Step 2 pendiente (arreglar bugs motor bueno)
**Próximo paso:** NO empezar Step 3 hasta que motor bueno funcione perfecto
**Estrategia:** Migración CSS selectiva (solo estilos, no lógica)
**Duración estimada:** 2.5h con testing
**Riesgo:** Bajo si se sigue procedimiento
**Rollback:** Tag backup + revert disponible
