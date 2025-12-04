# 📧 EMAIL PARA CARMEN - Testing en iPhone

---

**Asunto:** 🧪 Testing CaraColaViajes - Validación iPhone necesaria

---

**Hola Carmen,**

Te necesito para hacer un testing rápido de **CaraColaViajes** en tu iPhone. Son solo **5-10 minutos**.

---

## 🎯 **QUÉ NECESITO QUE TESTES**

### **Test 1: UI Responsive en iPhone**
**Objetivo:** Verificar que los sliders se ven bien en tu pantalla y no causan scroll horizontal.

**Pasos:**
1. Abre Safari (o Chrome) en tu iPhone
2. Ve a esta URL: **`https://caracolaviajes.vercel.app/test-manual-checklist`** *(o la URL de testing que te pase)*
3. Scroll hasta el **Test 3: UI responsive en móvil**
4. Abre otra pestaña y ve a: **`https://caracolaviajes.vercel.app`** *(la web principal)*
5. Crea un viaje rápido (origen: Madrid, destino: Barcelona, 2 etapas)
6. En el mapa, busca los **3 sliders rojos** (parte inferior del mapa)
7. **Verifica:**
   - ✅ Los 3 sliders son visibles sin scroll horizontal
   - ✅ El texto es legible (Rating, Radio, Sort)
   - ✅ Puedes mover los sliders con el dedo
   - ✅ El tooltip (texto explicativo) es legible

---

### **Test 2: Toggle de Servicios (Camping)**
**Objetivo:** Verificar que el botón de "Spots" (camping) permite guardar múltiples lugares.

**Pasos:**
1. En el viaje que creaste, selecciona la **Etapa 1**
2. Click en el botón **"Spots"** (primer botón de la fila)
3. Aparecerán campings en el mapa
4. **Añade 2 campings diferentes** (click en los pins → botón "Añadir")
5. **Verifica:**
   - ✅ Ambos campings se guardan en la lista
   - ✅ Aparecen con un ✓ verde en el mapa
   - ✅ Si desactivas el toggle "Spots", los guardados siguen visibles

---

## 📝 **CÓMO REPORTAR RESULTADOS**

**Opción A (Rápida):**
Envíame un WhatsApp/Email con:
- ✅ PASS o ❌ FAIL para cada test
- Si es FAIL, una captura de pantalla + descripción breve del problema

**Opción B (Completa):**
Usa la página de testing (`/test-manual-checklist`):
- Marca cada test como ✅ PASS o ❌ FAIL
- Escribe notas si encuentras algo raro
- Hazme una captura de la página completa y envíamela

---

## ⏱️ **TIEMPO ESTIMADO**
- Test 1: **3 minutos**
- Test 2: **3 minutos**
- **Total: ~6 minutos**

---

## 🔗 **URLs IMPORTANTES**

### **URL de Testing (checklist):**
```
https://caracolaviajes.vercel.app/test-manual-checklist
```

### **URL Principal (app):**
```
https://caracolaviajes.vercel.app
```

*(Si estás en rama `testing`, usa la URL del preview de Vercel que te pase)*

---

## 📱 **CAPTURAS QUE NECESITO (si hay problemas)**

Si encuentras algún fallo, hazme capturas de:
1. Los sliders en el mapa (parte inferior)
2. La lista de campings guardados
3. Cualquier mensaje de error

---

## ❓ **¿DUDAS?**

- **¿Qué es un slider?** Los 3 controles rojos horizontales en la parte de abajo del mapa (para Rating, Radio, Sort)
- **¿Qué es un toggle?** Los botones de servicios (Spots, Agua, Gas, etc.) que se activan/desactivan
- **¿Qué es "guardado"?** Un lugar que añadiste a tu viaje (aparece con ✓ verde)

---

## 🙏 **GRACIAS POR TU AYUDA**

Este testing es crucial para asegurar que la app funciona perfectamente en iPhone antes de subirla a producción.

Cualquier duda, escríbeme.

**Chema**

---

## 🔧 **NOTAS TÉCNICAS (para mí)**

**Cambios implementados:**
1. ✅ Responsive fix: Sliders `w-24` en móvil, `md:w-32` en desktop
2. ✅ Gap reducido: `gap-4` en móvil, `md:gap-6` en desktop
3. ✅ Toggles iniciales: Todos en `false` (incluyendo camping y custom)
4. ✅ Lógica de camping: Permite múltiples guardados (igual que otros servicios)

**Commits:**
- Pendiente de commit después de este fix

**Rama:** `testing`

**Preview URL:** *(actualizar cuando esté disponible)*
