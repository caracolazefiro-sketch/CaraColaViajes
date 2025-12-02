# CaraColaViajes - Roadmap & Ideas

## 🚀 PRÓXIMAS MEJORAS - Mapa y Servicios (Diciembre 2025)

### 🎨 Mejoras visuales e interacción con mapa
1. **✅ Filtros de servicios más visuales** (COMPLETADO)
   - ✅ Reemplazar checkboxes por iconos grandes con toggle (estilo botones)
   - ✅ Cada servicio con su icono característico y color
   - ✅ Estado activo/inactivo visualmente claro
   - ✅ Efecto hover y feedback táctil
   - ✅ Contador de resultados por servicio
   - ✅ Diseño responsivo y optimizado para escritorio

2. **Búsqueda por etapa específica**
   - Click en un día del itinerario → busca servicios cerca de ese punto
   - Indicador visual de "buscando en día X"
   - Centrar mapa automáticamente

3. **Radio de búsqueda ajustable**
   - Slider para cambiar cuántos km alrededor buscar (5km - 50km)
   - Círculo visual en el mapa mostrando el radio
   - Actualización en tiempo real

4. **Info window mejorado**
   - Foto del lugar prominente
   - Rating con estrellas visuales (ya implementado ✅)
   - Botón "Guardar" / "Añadir a favoritos"
   - Distancia desde punto de ruta

5. **Lista lateral de lugares encontrados**
   - Panel con scroll mostrando todos los resultados
   - Ordenable por distancia/rating
   - Click en item → centra mapa y abre info

6. **Filtro por rating mínimo**
   - Solo mostrar lugares con X estrellas o más
   - Slider o botones rápidos (3+, 4+, 4.5+)

7. **Mejoras en marcadores**
   - Diferenciar mejor saved vs search markers
   - Clusters para muchos resultados
   - Animación al añadir/quitar

8. **Persistencia de servicios encontrados**
   - Guardar qué servicios encontraste interesantes para cada viaje
   - Recuperar al reabrir el viaje

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

### Performance
- [ ] Cachear resultados de Places API en localStorage (reducir llamadas)
- [ ] Lazy loading de fotos (solo cargar cuando visible)
- [ ] Virtualización de listas largas (react-window)

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

### v0.5 - Sistema de Colaboración & Tooling (Dic 2025) 🆕
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
