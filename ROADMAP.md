# CaraColaViajes - Roadmap & Ideas

## 🌟 DESTACADO - Feature Estrella ⭐

### 🎯 **Ajuste Manual de Etapas con Recálculo Automático** (Dic 2025)
**✅ IMPLEMENTADO - Una de las features más potentes del proyecto**

Esta funcionalidad permite al usuario modificar cualquier parada técnica del viaje de forma intuitiva y el sistema recalcula automáticamente toda la ruta desde ese punto hacia adelante.

**Características principales:**
- 🎨 **Botón ⚙️ en cada etapa** - Visible solo en días de conducción, acceso directo al ajuste
- 🔍 **Búsqueda inteligente** - Google Places Autocomplete integrado en modal
- ⚡ **Recálculo automático** - Actualiza toda la ruta desde la etapa modificada
- 💾 **Persistencia total** - Mantiene servicios guardados y configuración
- 🧠 **Algoritmo inteligente** - Preserva días anteriores, recalcula solo lo necesario
- 📍 **Coordenadas precisas** - Usa lat/lng para máxima exactitud
- 🎯 **UX fluida** - Modal con preview, cancelar/confirmar, feedback visual

**Impacto en experiencia de usuario:**
- Permite ajustar rutas sin regenerar todo el viaje
- Ideal para cuando encuentras un lugar mejor para parar
- Mantiene toda tu planificación previa intacta
- Ahorra tiempo y cuota de API al recalcular solo lo necesario

**Implementación técnica destacada:**
- Server Actions de Next.js para llamadas seguras a Google Directions API
- Gestión de waypoints intermedios automática
- Manejo de caso especial para última etapa
- Logging comprehensivo con emojis para debugging

---

## 🚀 PRÓXIMAS MEJORAS - Mapa y Servicios (Diciembre 2025)

### 🎨 Mejoras visuales e interacción con mapa
1. **✅ Filtros de servicios más visuales** (COMPLETADO)
   - ✅ Reemplazar checkboxes por iconos grandes con toggle (estilo botones)
   - ✅ Cada servicio con su icono característico y color
   - ✅ Estado activo/inactivo visualmente claro
   - ✅ Efecto hover y feedback táctil
   - ✅ Contador de resultados por servicio
   - ✅ Diseño responsivo y optimizado para escritorio

2. **✅ Búsqueda por etapa específica** (COMPLETADO)
   - ✅ Click en botón 🔍 de un día → busca servicios cerca de ese punto
   - ✅ Indicador visual en la etapa seleccionada
   - ✅ Centrar mapa automáticamente en esa etapa

3. **✅ Ajuste manual de etapas** (COMPLETADO - ⭐ FEATURE DESTACADA)
   - ✅ Botón ⚙️ para cambiar destino de cualquier parada técnica
   - ✅ Recálculo automático de ruta desde ese punto
   - ✅ Preservación de configuración y lugares guardados

4. **Radio de búsqueda ajustable**
   - Slider para cambiar cuántos km alrededor buscar (5km - 50km)
   - Círculo visual en el mapa mostrando el radio
   - Actualización en tiempo real

5. **Info window mejorado**
   - Foto del lugar prominente
   - Rating con estrellas visuales (ya implementado ✅)
   - Botón "Guardar" / "Añadir a favoritos"
   - Distancia desde punto de ruta

6. **Lista lateral de lugares encontrados**
   - Panel con scroll mostrando todos los resultados
   - Ordenable por distancia/rating
   - Click en item → centra mapa y abre info

7. **Filtro por rating mínimo**
   - Solo mostrar lugares con X estrellas o más
   - Slider o botones rápidos (3+, 4+, 4.5+)

8. **Mejoras en marcadores**
   - Diferenciar mejor saved vs search markers
   - Clusters para muchos resultados
   - Animación al añadir/quitar

9. **Persistencia de servicios encontrados**
   - Guardar qué servicios encontraste interesantes para cada viaje
   - Recuperar al reabrir el viaje

10. **🎯 Drag & Drop de etapas en mapa** (Idea futura)
    - Arrastrar pins directamente en el mapa para ajustar paradas
    - Alternativa visual al modal de ajuste
    - Recálculo en tiempo real mientras arrastras

---

## 🎯 VERSIÓN PREMIUM (Futuras features de pago)

### 📞 Información extendida de lugares
- **Teléfonos**: `formatted_phone_number` via `PlacesService.getDetails()`
- **Sitios web**: `website` via `PlacesService.getDetails()`
- **Horarios completos**: `opening_hours.weekday_text[]` (horario detallado por día)
- **Fotos adicionales**: `photos[]` (galería completa, no solo primera foto)
- **Precio aproximado**: `price_level` (0-4, económico a caro)
- **Botones de acción**: Llamar, Abrir web, Ver en Google Maps, Compartir

### 💡 Otras ideas Premium
- Exportar itinerario a PDF/Google Calendar
- Modo offline (guardar lugares y mapas)
- Compartir ruta con amigos (colaboración)
- Historial de viajes guardados
- Recomendaciones personalizadas (IA)
- Alertas de clima adverso en ruta
- Reservas directas (integración con booking/camping)

---

## 🔧 MEJORAS TÉCNICAS (Backlog)

### 📊 Optimización de APIs (Ver: `ANALISIS_OPTIMIZACION_APIS.md`)
**Estado actual:** Óptimo (coste $0.02/viaje sin búsquedas, $0.12 con búsquedas)

#### Implementado ✅
- ✅ **Directions API:** 1 call/viaje (óptimo, no mejora posible)
- ✅ **Geocoding API:** Caché persistente en git (63.2% hit rate)
- ✅ **Exponential backoff:** Previene throttling de Google (3 intentos, 1-3 segundos)
- ✅ **Admin3 fallback:** Evita mostrar coordenadas (UX mejorada)

#### Roadmap Priorizado 🎯
1. **Expandir seed caché geocoding** (CORTO PLAZO - 1 semana)
   - [ ] Añadir top 100 ciudades europeas al seed inicial
   - [ ] Resultado esperado: 63.2% → 80% hit rate
   - [ ] Coste: $0, Beneficio: ~$275/mes ahorrados
   - [ ] Ubicación: `data/geocoding-cache.json`

2. **Places API local cache** (MEDIANO PLAZO - 1 mes)
   - [ ] Cachear búsquedas populares por tipo (hoteles en París, etc.)
   - [ ] Reutilizar en viajes posteriores
   - [ ] Resultado esperado: -20% Places API calls
   - [ ] Coste: 2-3 horas trabajo, $0 infraestructura
   - [ ] Ubicación: `app/lib/places-cache.ts`

3. **Session-level deduplication** (MEDIANO PLAZO - 1 mes)
   - [ ] Si misma coordenada se pide 2x en misma sesión, reutilizar respuesta
   - [ ] Evita 2-3 geocoding calls por ruta compleja
   - [ ] Resultado esperado: +5% ahorros geocoding
   - [ ] Coste: 1 hora trabajo

4. **Supabase Storage sync** (LARGO PLAZO - 3 meses)
   - [ ] Migrar caché de git a Supabase Storage cuando llegue >5000 entradas
   - [ ] Sync automático dev ↔ prod
   - [ ] Coste: $0.02/mes, Beneficio: Escalabilidad

#### NO Implementable ❌
- ❌ **Directions API caché:** Combinatoria explosiva (1 billón+ rutas posibles)
  - Parámetros: origin + waypoints + destination
  - Tamaño respuesta: 50-200 KB/ruta → impracticable
  - Solución: Usar como está (1 call/viaje = óptimo)

- ❌ **Places API caché (búsquedas dinámicas):** Resultados personales y volátiles
  - Tipo de búsqueda + radio son variables
  - Google actualiza resultados constantemente
  - Solución: User-driven design (búsquedas bajo demanda)

**Referencia técnica completa:** Ver `ANALISIS_OPTIMIZACION_APIS.md` para detalles arquitectónicos, benchmarks reales (16 rutas testadas), y proyecciones de costes.

### Performance
- [x] **Geocoding API caché** (COMPLETADO - 63.2% hit rate)
- [ ] Lazy loading de fotos (solo cargar cuando visible)
- [ ] Virtualización de listas largas (react-window)
- [ ] **Migrar a Routes API v2** - Investigar estructura de respuesta (40% más barata que Directions API, pero requiere análisis de formato de legs/steps)

### UX/UI
- [ ] Selector de ordenación (Score / Distancia / Rating)
- [ ] Filtros adicionales (solo abiertos, rating mínimo, distancia máxima)
- [ ] Vista de galería/grid alternativa a lista
- [ ] Modo oscuro
- [ ] Animaciones suaves al añadir/quitar lugares

### Datos
- [ ] Persistencia en Supabase (sincronizar entre dispositivos)
- [ ] Analytics: qué servicios busca más la gente, rutas populares
- [ ] Validación de lugares (detectar cerrados permanentemente)

---

## 🐛 BUGS CONOCIDOS
- [ ] Actualizar `baseline-browser-mapping` (warning en build)

---

## ✅ COMPLETADO (Últimas implementaciones)

### v0.7 - Iconografía Profesional SVG (Dic 2025) 🆕
- ✅ **Reemplazo completo de emojis por Lucide Icons**
  - Botones de acción: 🔍 → Search icon, ⚙️ → Settings icon
  - Badges de calidad: 🏆💎🔥📍 → Trophy/Gem/Flame/MapPin con colores
  - Logo: 🐌 → imagen logo.jpg en título print
- ✅ **Tooltips informativos mejorados**
  - "Buscar Servicios": Explica funcionalidad y ahorro de tiempo
  - "Ajustar Parada": Describe recálculo automático y casos de uso
  - Educación del usuario integrada en la UI
- ✅ **Consistencia visual total**
  - 100% iconografía Lucide React
  - Escalable y profesional
  - Colores coherentes por tipo de badge

### v0.6 - Ajuste Manual de Etapas ⭐ FEATURE DESTACADA (Dic 2025)
- ✅ **Sistema completo de ajuste de paradas técnicas**
  - Botón ⚙️ en cada día de conducción del itinerario
  - Modal con Google Places Autocomplete
  - Recálculo automático desde etapa ajustada hacia adelante
  - Preservación de días anteriores sin modificar
  - Mantenimiento de servicios guardados (savedPlaces)
  - Manejo especial de última etapa (no requiere recálculo)
- ✅ **Algoritmo inteligente de recálculo**
  - Construcción automática de waypoints intermedios
  - Server Action con fallback de API keys
  - Logging comprehensivo con emojis (🔧 🔄 📍 ✅ ❌)
  - Merge de días preservados + recalculados
- ✅ **UX pulida**
  - Preview de destino actual vs nuevo
  - Botones Cancelar/Confirmar con feedback visual
  - Integración con sistema de persistencia
  - Debugging facilitado con console logs estructurados

### v0.5 - Sistema de Colaboración & Tooling (Dic 2025)
- ✅ **Chat de desarrollo en tiempo real** (Supabase Realtime)
  - Mensajes instantáneos entre desarrolladores
  - Avatares con colores únicos por usuario
  - Timestamps relativos
  - Accesible en `/dev-chat` (solo dev/preview)
- ✅ **Migraciones de base de datos**
  - Tabla `dev_messages` con RLS
  - Tabla `roadmap_comments` para colaboración futura
  - Realtime habilitado
- ✅ **Configuración completa de VS Code**
  - Extensiones recomendadas (ESLint, Prettier, Tailwind, GitLens)
  - Settings optimizados para Next.js/TypeScript
  - Tareas predefinidas (dev, build, lint, clean)
  - Configuraciones de debug (server, client, full-stack)
  - Snippets personalizados (Next.js, Supabase, Tailwind)
  - Documentación en `.vscode/README.md`
- ✅ **Onboarding para nuevos desarrolladores**
  - Guía interactiva HTML (`SETUP_CARMEN.html`)
  - Quick reference Markdown (`SETUP_CARMEN.md`)
  - Setup paso a paso con troubleshooting
- ✅ **Mejoras de código**
  - TypeScript: 0 errores
  - ESLint: Errores críticos resueltos
  - Hooks en orden correcto
  - Types de Supabase en lugar de `any`
  - Links de Next.js en lugar de `<a>`

### v0.4 - Filtros Visuales de Servicios (Dic 2024)
- ✅ Botones con iconos grandes reemplazando checkboxes
- ✅ Gradientes azules para estado activo
- ✅ Contador de resultados por servicio
- ✅ Animaciones hover y active (scale)
- ✅ Grid responsivo optimizado para escritorio
- ✅ Diseño 50% más compacto tras feedback usuario
- ✅ Botón "Añadir Sitio" con estilo consistente

### v0.3 - Sistema de Puntuación Inteligente (Dic 2024)
- ✅ Algoritmo scoring multi-factor (distancia, rating, reviews, disponibilidad)
- ✅ Badges visuales (🏆 💎 🔥 📍)
- ✅ Layout mejorado con info estructurada
- ✅ Score visible en todos los spots
- ✅ AuditMode para debugging

### v0.2 - Optimización Places API (Dic 2024)
- ✅ Cambio de keywords a Google Place types (language-independent)
- ✅ Aumento de radios de búsqueda (10-30km)
- ✅ Logging comprehensivo con emojis
- ✅ Fix de imágenes en InfoWindow (native img tag)

### v0.1 - Base (Nov 2024)
- ✅ Next.js 16 + TypeScript + Tailwind
- ✅ Google Maps integration
- ✅ Búsqueda de servicios por tipo
- ✅ Persistencia en localStorage
- ✅ Deploy en Vercel

---

**Última actualización:** 2 Diciembre 2025
**Autor última sección:** Chema (v0.5 - Colaboración & Tooling)
