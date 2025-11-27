# 🐌 CaraCola Viajes - Planificador de Rutas Camper

Una aplicación web progresiva (PWA) diseñada para autocaravanistas que permite calcular rutas, segmentar etapas, encontrar servicios específicos (pernocta, aguas, gasolineras...) y generar un libro de ruta imprimible.

## 🚀 Tecnologías

* **Framework:** Next.js (React) + TypeScript
* **Mapas:** Google Maps JavaScript API + React Google Maps
* **Servicios y Geocoding:** Google Places API & Directions API
* **Altimetría:** Google Elevation Service
* **Clima:** Open-Meteo API (Gratuita, no requiere Key)
* **Estilos:** Tailwind CSS

---

## ⚙️ Configuración Inicial

Para arrancar el proyecto en local:

1.  **Clonar el repositorio**
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Variables de Entorno:**
    Crear un archivo `.env.local` en la raíz con:
    ```env
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=TU_API_KEY_AQUI
    NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY=TU_API_KEY_AQUI (Opcional si volvemos a CSE)
    NEXT_PUBLIC_GOOGLE_SEARCH_CX=TU_CX_ID (Opcional si volvemos a CSE)
    ```
4.  **Arrancar:**
    ```bash
    npm run dev
    ```

---

## 🧠 Lógica del Núcleo (Decisiones de Arquitectura)

### 1. Estrategia de Búsqueda de Servicios (El cambio de Paradigma)
Inicialmente usamos *Google Custom Search (CSE)* para buscar enlaces de texto en Park4Night.
**Problema:** Resultados imprecisos en pueblos pequeños (Tébar) o coincidencias por nombre en otras provincias (Vinaròs).
**Solución Actual (Fase 6+):** Usamos **Google Places API (`nearbySearch`)**.
* Buscamos por **Radio GPS (20km)** desde el punto de parada.
* Es infalible geográficamente: solo muestra lo que está físicamente allí.

### 2. El Algoritmo "Portero de Discoteca" (Filtros de Calidad)
Para evitar que Google nos cuele "basura" en los resultados, aplicamos un filtrado estricto en el cliente (`searchPlaces`):

* **🚐 Campings:**
    * **Aceptamos:** `campground`, `rv_park`.
    * **Excepción:** Aceptamos `parking` **SOLO SI** el nombre contiene "Área", "Autocaravana" o "Camper" (Vital para áreas municipales que Google etiqueta mal).
* **⛽ Gasolineras:**
    * **Obligatorio:** Debe tener el tag `gas_station`.
    * **Bloqueo:** Filtramos `point_of_interest` genéricos para evitar cargadores Tesla o oficinas.
* **🧺 Lavanderías:**
    * **Bloqueo:** Si tiene el tag `lodging` (Alojamiento), lo descartamos. (Evita que salgan Hoteles que dicen tener servicio de lavandería).
* **📷 Turismo:**
    * **Estrategia:** Aquí somos permisivos. Aceptamos museos, parques, atracciones y puntos de interés para fomentar la exploración.

### 3. Sistema de Persistencia (LocalStorage)
La aplicación guarda automáticamente el estado en `caracola_trip_v1` dentro del navegador.
* **Ventaja:** Si el usuario cierra la pestaña, no pierde el viaje.
* **Reset:** Hay un botón de "Borrar Viaje" en la cabecera para limpiar la memoria.

### 4. Renderizado Híbrido en el Mapa
El mapa gestiona dos tipos de marcadores simultáneamente:
1.  **Marcadores "Mi Plan" (Permanentes):** Los sitios que el usuario ha guardado (botón `+`). Se muestran SIEMPRE, aunque apagues los botones de búsqueda. Tienen un icono de "check" o color específico.
2.  **Marcadores "Búsqueda" (Temporales):** Los resultados de la API (Campings, Restaurantes...). Solo se muestran si el botón de la categoría está activo.

---

## 🛠️ Estructura de Datos Clave

### `DailyPlan`
Representa un día de viaje.
* `isDriving`: `true` (Ruta) o `false` (Estancia).
* `savedPlaces`: Array con los POIs (Puntos de Interés) elegidos por el usuario.
* `coordinates`: **CRUCIAL**. Guardamos lat/lng exactas de la parada para poder pedir el clima y buscar servicios con precisión.

---

## 🌤️ Meteorología
Usamos **Open-Meteo**.
* Lógica: Si la fecha del viaje es dentro de los próximos **14 días**, mostramos previsión real.
* Si es >14 días: Mostramos aviso de "Previsión no disponible" para no dar datos falsos.

---

## 🖨️ Impresión (Roadbook)
No usamos una librería de PDF pesada. Usamos **CSS nativo (`@media print`)**.
Al dar a imprimir:
1.  Ocultamos el Mapa, el Formulario y los Botones (`.no-print`).
2.  Re-estilizamos la lista de tarjetas para que quede limpia en papel A4 (`.print-only`).
3.  Forzamos la impresión de colores de fondo (`print-color-adjust: exact`).

---

## 🔮 Próximos Pasos (Roadmap)

1.  **Backend:** Migrar a Supabase para guardar viajes en la nube (Login).
2.  **Mobile UI:** Adaptar la vista de mapa/lista para móviles (actualmente es denso).
3.  **Social:** Poder compartir el enlace del viaje con amigos.