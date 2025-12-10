# 📚 Guía Para Dummies - Conceptos Clave del Proyecto

**¿No entiendes qué es GitHub, Vercel, VS Code o cómo funciona CaraCola? Aquí lo explico en palabras simples.**

---

## 1️⃣ GITHUB - El Almacén de Código

### ¿Qué es?
GitHub es como **Dropbox pero para código**. Guarda todos los archivos del proyecto y registra cada cambio que haces.

### Conceptos clave:

**📁 Repositorio (Repo)**
- Es el **proyecto completo** almacenado en GitHub
- Nombre: `CaraColaViajes`
- URL: `https://github.com/caracolazefiro-sketch/CaraColaViajes`
- **Analogía:** Es como tu carpeta "Mi Proyecto" pero en la nube con superpoderes

**🌿 Rama (Branch)**
- Es una **copia independiente** del código donde trabajas sin romper lo que funciona
- **Rama `main`** = Versión oficial, la que ven los usuarios en producción
- **Rama `testing`** = Versión de prueba, donde probamos antes de poner en vivo
- **Analogía:** Es como tener 2 versiones del proyecto en paralelo

**💾 Commit**
- Es un **"guardado con anotación"** de los cambios que hiciste
- Incluye: qué cambió, quién lo hizo, cuándo, y una descripción
- **Analogía:** Es como guardar un documento en Word con fecha y comentario

**🚀 Push**
- Es **enviar tus cambios a GitHub** desde tu computadora
- Comando: `git push origin testing`
- **Analogía:** Es como hacer "Subir a la nube" en Dropbox

**📊 Pull Request (PR)**
- Es una **solicitud** para **mezclar código** de una rama a otra
- Ejemplo: "Quiero pasar mis cambios de `testing` a `main`"
- Se revisa antes de aceptar (control de calidad)
- **Analogía:** Es como pedir permiso para fusionar dos versiones

---

## 2️⃣ VERCEL - El Servidor en la Nube

### ¿Qué es?
Vercel es **una plataforma que corre tu proyecto en internet** sin que tengas que ejecutar `npm run dev` en tu máquina.

### Conceptos clave:

**🌐 Deploy (Despliegue)**
- Es **poner tu proyecto en vivo en internet** para que otros lo usen
- Se hace automático: Haces push a GitHub → Vercel lo ve → Automáticamente lo compila y publica
- **Analogía:** Es como abrir una tienda física después de tenerla en tu garage

**🏠 URL de Producción**
- Es la dirección web que ven los usuarios reales
- Ejemplo: `https://caracolaviajes.vercel.app/`
- Esta versión viene de la rama `main` de GitHub

**👀 URL de Preview (Vista Previa)**
- Es una versión temporal para probar cambios antes de poner en vivo
- Ejemplo: `https://cara-cola-viajes-git-testing-caracola.vercel.app/`
- Esta versión viene de la rama `testing` de GitHub
- **Analogía:** Es como tener un "segundo mostrador" para probar antes de abrir al público

**⚙️ Build (Compilación)**
- Es el proceso donde Vercel **toma tu código** y lo prepara para funcionar en internet
- Compila TypeScript, agrupa archivos, optimiza
- Tarda ~30 segundos
- Si hay errores, el deploy falla y nadie lo ve

**🔄 Auto-deploy**
- Cada vez que haces `git push`, Vercel automáticamente:
  1. Detecta el cambio en GitHub
  2. Descarga tu código
  3. Lo compila
  4. Lo publica en vivo
- **Analogía:** Es como tener a alguien que automáticamente actualiza tu tienda cuando tú cambias las cosas

---

## 3️⃣ VS CODE - El Editor de Código

### ¿Qué es?
VS Code es **el programa donde escribes el código** del proyecto. Es como Word pero para programación.

### Conceptos clave:

**📝 Archivo**
- Cada `.tsx`, `.ts`, `.json`, `.md` es un archivo
- Los archivos se organizan en carpetas: `app/`, `components/`, `public/`, etc.

**🎯 Extensiones (Extensions)**
- Son **complementos** que agregan funcionalidad a VS Code
- Ejemplos útiles:
  - **ESLint** - Revisa errores en el código
  - **Prettier** - Formatea el código automáticamente
  - **Tailwind CSS** - Ayuda con estilos
  - **GitLens** - Muestra quién cambió cada línea

**⚙️ Terminal Integrada**
- Es la **línea de comandos dentro de VS Code**
- Aquí ejecutas:
  - `npm run dev` (arranca servidor local)
  - `npm run build` (compila para producción)
  - `git push` (envía cambios a GitHub)

**🚨 Problemas (Problems)**
- Muestra **errores y advertencias** en rojo/amarillo
- Si hay errores, el código no se compila
- Puedes hacer click en el error → te lleva a la línea exacta

**💡 IntelliSense**
- Es el **autocompletado inteligente** de VS Code
- Mientras escribes, sugiere nombres de funciones, variables, etc.
- Te ahorra tiempo y evita errores de tipeo

---

## 4️⃣ PROYECTO CARACOLA - La Aplicación

### ¿Qué es?
**CaraCola Viajes** es una **aplicación web para planificar viajes en autocaravana**.

### ¿Cómo funciona?

**🎯 Objetivo principal:**
Ayudar a autocaravanistas a planificar rutas, encontrar campings, gasolineras, restaurantes y generar un "libro de ruta" imprimible.

**📱 Tipos de archivos:**

| Tipo | Ejemplo | Función |
|------|---------|---------|
| **Componentes** | `TripMap.tsx` | Piezas reutilizables de la UI (botones, mapas, listas) |
| **Páginas** | `page.tsx` | Pantallas completas que ven los usuarios |
| **Hooks** | `useTripPersistence.ts` | Funciones reutilizables (guardar datos, obtener datos) |
| **Acciones** | `actions.ts` | Operaciones que hablan con Google Maps, APIs externas |
| **Estilos** | `globals.css` | Colores, tamaños, diseño visual |
| **Tipos** | `types.ts` | Define la "forma" de los datos (TypeScript) |

**🗺️ Tecnologías usadas:**
- **Next.js** - Framework para hacer la app rápida
- **React** - Librería para crear la interfaz
- **TypeScript** - Lenguaje que atrapa errores antes
- **Tailwind CSS** - Librería para estilos bonitos
- **Google Maps API** - Para mapas, direcciones, búsqueda de lugares
- **Supabase** - Base de datos en la nube (opcional)

**🔄 Flujo básico:**
```
Usuario escribe ruta (Madrid → Barcelona)
    ↓
Click "Calcular"
    ↓
Se llama a Google Maps API
    ↓
App calcula distancia, tiempo, paradas
    ↓
Muestra mapa con etapas de viaje
    ↓
Usuario busca campings/gasolineras
    ↓
App busca en Google Places cerca del punto
    ↓
Muestra resultados en el mapa
    ↓
Usuario guarda los favoritos
    ↓
Se guardan en el navegador (localStorage)
```

**📍 Componentes principales:**

| Componente | ¿Qué hace? |
|-----------|-----------|
| `TripForm` | Formulario donde escribes origen/destino |
| `TripMap` | Mapa interactivo que muestra la ruta |
| `ItineraryPanel` | Lista de días y paradas |
| `DaySpotsList` | Servicios encontrados (campings, gasolineras) |
| `AdjustStageModal` | Ventana para cambiar paradas |

**💾 Dónde se guardan datos:**
- **En tu navegador** (localStorage) - Se pierden si limpias caché
- **En Supabase** (opcional) - Base de datos en la nube, persistente

---

## 🎓 Flujo Completo: Del Código a Vercel

### 1. **Escribes código en VS Code**
```
Abres archivo → Escribes cambios → Guardas (Ctrl+S)
```

### 2. **Pruebas en tu máquina**
```
Terminal: npm run dev
Abres http://localhost:3000 en navegador
Ves si funciona o hay errores
```

### 3. **Subes a GitHub**
```
Terminal: git add .
Terminal: git commit -m "Descripción del cambio"
Terminal: git push origin testing
```

### 4. **Vercel automáticamente**
```
Ve el push → Descarga código → Compila → Publica
URL de preview: https://cara-cola-viajes-git-testing-caracola.vercel.app
```

### 5. **Pruebas en la nube**
```
Abres URL preview → Probas cambios en línea
Si funciona bien → PR a main
Si hay problemas → Arreglas y vuelves a push
```

### 6. **Pasa a Producción**
```
Aceptas PR de testing → main
Vercel compila main → Publica
URL producción: https://caracolaviajes.vercel.app
TODOS los usuarios ven los cambios
```

---

## 🔍 BUSCADOR (/search)

### ¿Qué es?
Es una herramienta para **buscar documentación y código** del proyecto.

### ¿Cómo funciona?
```
Escribes una palabra en /search
    ↓
Busca en todos los archivos de documentación
    ↓
Encuentra coincidencias en: ROADMAP, guías, código
    ↓
Muestra resultados con contexto
```

### ¿Qué busca?
- 📄 Documentos (ROADMAP.md, este archivo, guías)
- 💻 Código (componentes, funciones, tipos)
- 📊 Reportes (análisis, métricas)

### Ejemplo:
```
Escribes: "GitHub"
Encuentra: Esta sección completa (PARA_DUMMIES.md)
Resultado: Ver explicación de qué es GitHub
```

---

## 🚨 Problemas Comunes

### "npm run dev se congela mi máquina"
**Problema:** El servidor local consume demasiados recursos
**Solución:** No uses `npm run dev`. Usa Vercel (la URL de preview) en su lugar
**URL para probar:** `https://cara-cola-viajes-git-testing-caracola.vercel.app`

### "Hice cambios pero no aparecen en Vercel"
**Posibles causas:**
1. Olvidaste hacer `git push`
2. Olvidaste hacer `git add .`
3. El build falló (revisa en Vercel → Deployments)

**Solución:**
```
git status  (ver qué cambió)
git add .   (preparar cambios)
git commit -m "Descripción"
git push origin testing  (enviar)
Esperar 30 segundos → Vercel publica
```

### "¿Qué es la rama testing vs main?"
- **testing** = Versión de prueba, para experimentar sin romper
- **main** = Versión oficial, la que usan los usuarios reales

**Flujo recomendado:**
```
Cambios pequeños → testing → Pruebas en preview → main (producción)
```

---

## 📚 Resumen Rápido

| Concepto | Es... | Se usa para... |
|----------|-------|----------------|
| **GitHub** | Almacén de código | Guardar y versionear código |
| **Rama** | Copia independiente | Trabajar sin romper main |
| **Commit** | Guardado con mensaje | Registrar cambios |
| **Push** | Enviar a GitHub | Subir código a la nube |
| **Vercel** | Servidor en la nube | Publicar la app en internet |
| **Deploy** | Poner en vivo | Hacer accesible a usuarios |
| **VS Code** | Editor de código | Escribir y editar archivos |
| **Extensión** | Complemento | Mejorar VS Code |
| **Terminal** | Línea de comandos | Ejecutar comandos (git, npm) |
| **CaraCola** | Planificador de viajes | Calcular rutas y encontrar servicios |
| **Buscador** | Motor de búsqueda | Encontrar información del proyecto |

---

## ✅ Lo Principal

1. **GitHub** = Almacén versionate en la nube
2. **Vercel** = Tu app funcionando en internet (sin `npm run dev`)
3. **VS Code** = Dónde escribes código
4. **CaraCola** = App para planificar viajes en autocaravana
5. **Buscador** = Encuentra documentación del proyecto

**¿Lo entendiste? Perfecto. Ahora puedes entender el resto del proyecto sin perder la cabeza.** 🚀

---

**Última actualización:** 10 Diciembre 2025
**Nivel:** Para dummies (súper básico)
**Propósito:** Entender conceptos sin tecnicismos
