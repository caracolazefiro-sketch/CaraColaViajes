# CaraColaViajes - Roadmap & Ideas

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

**Última actualización:** 1 Diciembre 2025
