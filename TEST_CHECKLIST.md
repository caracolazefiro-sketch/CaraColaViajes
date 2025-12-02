# 🧪 Checklist de Testing - Deploy Parte 1

**Fecha:** 2 Diciembre 2025
**Branch:** pruebas
**Commit:** 03c32a1

---

## ✅ Funcionalidades Nuevas a Probar

### 1️⃣ **Regla de Escala en el Mapa**

-   [ y] Abrir la app
-   [ y] Calcular una ruta
-   [ x] Verificar que aparece la **regla de escala** (km/mi) en la esquina inferior izquierda del mapa
-   [ ] Hacer zoom in/out → La escala debe ajustarse automáticamente

**Ubicación:** Mapa principal
**Resultado esperado:** Regla visible, dinámica según zoom

---

### 2️⃣ **Botón 🔍 Buscar por Etapa**

-   [ ] Calcular un viaje de varios días
-   [ ] En la vista de resumen del itinerario, verificar que cada día de conducción tiene un **botón 🔍**
-   [ ] Los días de descanso NO deben tener el botón 🔍

**Ubicación:** Panel izquierdo, cada tarjeta de día
**Resultado esperado:** Botón azul con 🔍 visible en días de conducción

---

### 3️⃣ **Búsqueda de Servicios por Etapa**

-   [ ] Click en el botón 🔍 de un día específico (ej: Día 2)
-   [ ] El mapa debe **centrarse en esa etapa**
-   [ ] Debe buscar servicios automáticamente:
    -   Si hay botones de servicio activos (azules) → busca esos servicios
    -   Si NO hay ninguno activo → busca "Spots" (camping) por defecto
-   [ ] Verificar que aparecen marcadores en el mapa cerca del punto final de esa etapa

**Ubicación:** Click 🔍 en cualquier día
**Resultado esperado:** Mapa centrado + servicios mostrados

---

### 4️⃣ **Flujo Completo de Usuario**

**Escenario:** Planifico parada para dormir en Día 3

1. [ ] Calculo ruta: Madrid → Barcelona (3 días, 400km/día)
2. [ ] Click en 🔍 del **Día 3**
3. [ ] Mapa se centra en punto final del Día 3
4. [ ] Click en botón **Spots** (si no está activo)
5. [ ] Veo lista de campings cerca del punto final
6. [ ] Hago hover en un camping → Se resalta en el mapa
7. [ ] Click en un camping → Se abre InfoWindow con foto, rating, etc.
8. [ ] Click en "Guardar" → Se añade a mi plan
9. [ ] Vuelvo a vista de resumen → El camping aparece en "Plan" del Día 3

**Resultado esperado:** Flujo fluido sin errores

---

### 5️⃣ **Casos Edge (Posibles problemas)**

-   [ ] **Día sin coordenadas:** ¿Funciona el botón 🔍 si la etapa no tiene coordenadas? (debería geocodificar)
-   [ ] **Día de descanso:** ¿El botón 🔍 NO aparece en días de descanso? (correcto)
-   [ ] **Sin servicios activos:** ¿Busca "Spots" por defecto si no hay ningún botón activo? (correcto)
-   [ ] **Múltiples clicks:** ¿Puedo hacer click en 🔍 de varios días seguidos sin problemas?

---

## 🐛 Errores Conocidos (Pre-Deploy)

Ninguno detectado en TypeScript. ESLint tiene warnings menores en archivos demo (no críticos).

---

## ✅ Funcionalidades Previas a Verificar

### Regresión (Que no se hayan roto)

-   [ ] Botones de servicios siguen funcionando (toggle on/off)
-   [ ] Botón "Añadir Sitio" sigue con estilo gris consistente
-   [ ] Chat de desarrollo funciona (`/dev-chat` en preview)
-   [ ] ROADMAP visible en `/roadmap`

---

## 📝 Notas de Testing

**Encontraste un bug?** Anota aquí:

1. ...
2. ...
3. ...

---

**Estado:** ⏳ Pendiente de testing
**Tester:** Chema
**Deploy URL:** https://cara-cola-viajes-{hash}.vercel.app (auto-deploy desde `pruebas`)
