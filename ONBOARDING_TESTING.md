# 🚗 CaraCola Viajes - Guía de Testing v1.0

**Hola CARMEN,**

Aquí tienes todo lo que necesitas para probar la nueva versión de CaraCola Viajes. **No necesitas acceso a Vercel ni GitHub** - todo está configurado y listo para usar.

---

## 🎯 Lo que vas a hacer

Probarás **la nueva interfaz y funcionalidades** de nuestra app de viajes en autocaravana. Tu trabajo es:

1. Explorar la aplicación
2. Probar los features (botones, formularios, mapas)
3. Reportar cualquier **bug, error o mejora** que encuentres
4. Decirnos qué te gusta y qué no te gusta

---

## 🌐 URL de Testing

```
https://cara-cola-viajes-git-testing-caracola.vercel.app
```

**Acceso:** Totalmente público. Solo abre el enlace en el navegador. No necesitas usuario ni contraseña.

---

## 📋 Instrucciones de Acceso

### Opción 1: Desde el Email
1. Haz clic en el botón/enlace que encontrarás en el email
2. Te llevará directamente a la app

### Opción 2: Manual
1. Copia el enlace: `https://cara-cola-viajes-git-testing-caracola.vercel.app`
2. Abre tu navegador (Chrome, Firefox, Safari, Edge)
3. Pega el enlace en la barra de direcciones
4. Presiona Enter

**Navegadores recomendados:** Chrome o Edge (versión reciente)

---

## 🧪 Guía de Testing - Paso a Paso

### **1️⃣ Interfaz Limpia (Primera Impresión)**
Cuando cargue la página, verás un formulario vacío. Esto es **correcto**.

**Qué deber ver:**
- ✅ Campo "Nombre del viaje" vacío (con placeholder "Origen → Destino")
- ✅ Fecha de inicio = **mañana** (no hoy)
- ✅ Campos "Origen" y "Destino" vacíos
- ✅ Campo "Regreso" en blanco
- ✅ Checkbox **"Vuelta a Casa"** en **color rojo** (no azul)
- ✅ Checkbox "Añadir Paradas Intermedias" marcado por defecto
- ✅ Valores por defecto en sliders:
  - Ritmo Máximo: **300 km/día**
  - Consumo: **12.5 L/100km**
  - Precio Diésel: **1.35 €/L**

**Tu reporte:** ¿Ves exactamente esto? Escribe "OK" o describe qué falta/está diferente.

---

### **2️⃣ Buscar un Lugar (Origen)**
1. Haz clic en el campo "Origen"
2. Escribe un lugar: `Madrid` (o tu ciudad favorita)
3. Presiona Enter o espera a que aparezcan sugerencias
4. Selecciona "Madrid, España" (o el que aparezca)

**Tu reporte:**
- ¿Aparecen sugerencias mientras escribes?
- ¿Se completa el campo correctamente?
- ¿Hay algún error?

---

### **3️⃣ Buscar Destino**
1. Haz clic en el campo "Destino Principal"
2. Escribe un lugar: `Barcelona` (o donde quieras ir)
3. Selecciona "Barcelona, España"

**Tu reporte:** ¿Funciona igual que el origen?

---

### **4️⃣ Añadir Paradas Intermedias (Opcional)**
Si quieres probar paradas intermedias:

1. El checkbox "Añadir Paradas Intermedias" ya está marcado
2. Verás un campo "Buscar parada..."
3. Escribe un lugar: `Valencia`
4. Haz clic en "Añadir"
5. Debería aparecer como un chip/etiqueta

**Tu reporte:**
- ¿Se añade correctamente?
- ¿Puedes eliminarla (busca una X o botón de eliminar)?

---

### **5️⃣ Calcular la Ruta**
1. Completa: Origen (Madrid), Destino (Barcelona)
2. Mira los sliders (parecen estar bien con los defaults)
3. Busca un botón azul grande que diga **"Calcular"** o similar
4. Haz clic

**Espera a que aparezcan los resultados...**

**Tu reporte:**
- ¿Se calculan correctamente?
- ¿Aparece un mapa?
- ¿Se muestran los días del viaje?
- ¿Hay errores en la consola? (F12 > Consola)

---

### **6️⃣ Ajustar una Etapa (Nuevo Feature)**
Si los resultados aparecen correctamente:

1. Busca un botón con un **icono de engranaje ⚙️** en cada día
2. Haz clic en uno
3. Debería abrirse un modal/diálogo para ajustar ese día
4. Intenta cambiar el destino a otro lugar
5. Presiona "Confirmar"

**Tu reporte:**
- ¿Se abre el modal?
- ¿Puedes cambiar el lugar?
- ¿Se recalcula correctamente?
- ¿Hay algún error?

---

### **7️⃣ Probar "Vuelta a Casa"**
1. Vuelve al formulario inicial
2. Marca el checkbox **"Vuelta a Casa"** (debe cambiar a rojo)
3. Añade un destino
4. Calcula la ruta

**Tu reporte:**
- ¿El checkbox es rojo?
- ¿La ruta incluye el viaje de vuelta?

---

## 🐛 Si Encuentras Errores

### **Errores de Sitio Web**
Si algo no funciona (botón no responde, página se congela, etc.):

1. **Abre DevTools:** Presiona `F12`
2. **Ve a la pestaña "Console"**
3. **Copia cualquier mensaje rojo o error**
4. **Cuéntame:**
   - ¿Qué intentabas hacer?
   - ¿Qué error viste?
   - Pega el mensaje exacto de la consola

### **Errores de Google Maps**
Si ves mensajes como "DIRECTIONS_ROUTE: NOT_FOUND":
- Esto es normal si los campos están vacíos
- **OK** si desaparece cuando llenas los campos correctamente

---

## ✅ Checklist de Testing

Marca lo que hayas probado:

```
[ ] Interfaz limpia al cargar
[ ] Fecha = mañana
[ ] Búsqueda de lugares funciona
[ ] Cálculo de ruta funciona
[ ] Mapa aparece
[ ] Ajuste de etapas funciona
[ ] Color "Vuelta a Casa" es rojo
[ ] Sin errores críticos en consola
```

---

## 📧 Cómo Reportar

Envía un email a **[EMAIL]** con:

**Asunto:** `Testing CaraCola - Report [Tu Nombre]`

**Contenido:**
```
Hola,

Completé el testing de CaraCola Viajes.

✅ Lo que funciona bien:
- [Tu observación]
- [Tu observación]

⚠️ Lo que no funciona / Bugs:
- [Descripción del problema]
- [Qué pasos hiciste]
- [Qué esperabas vs qué pasó]

💡 Sugerencias:
- [Mejora 1]
- [Mejora 2]

Gracias,
[Tu Nombre]
```

---

## 🆘 Si Tienes Problemas

### **"No se carga la página"**
- Espera 30 segundos (puede estar iniciando)
- Recarga (F5 o Ctrl+R)
- Prueba en otro navegador (Chrome/Edge)

### **"Los campos no responden"**
- Abre DevTools (F12)
- Busca errores en la consola
- Reporta lo que veas

### **"No puedo añadir paradas"**
- Asegúrate de que el checkbox "Añadir Paradas" está marcado ✓
- Escribe el lugar correctamente
- Presiona Enter o espera sugerencias

### **"El mapa no aparece"**
- Esto puede ser un problema de API keys
- Reporta: "El mapa no carga"

---

## 📞 Contacto

Si algo no está claro o tienes preguntas:

**Email:** [EMAIL]
**Chat:** [Si disponible]

**Responsable:** Chema (Desarrollador)

---

## 🎉 ¡Gracias!

Tu feedback es **crucial** para mejorar CaraCola. Cada bug que reportes, cada sugerencia que hagas, nos ayuda a hacer una mejor app.

**Tiempo estimado de testing:** 30-45 minutos

¡A por ello! 🚀

---

**Última actualización:** 3 de Diciembre 2025
**Versión:** Testing v1.0
**Rama:** testing
**URL:** https://cara-cola-viajes-git-testing-caracola.vercel.app
