# Configuración VS Code - CaraColaViajes

## 📦 Extensiones Recomendadas

Las siguientes extensiones se instalarán automáticamente cuando abras el proyecto:

### Esenciales
- **ESLint** - Linting de JavaScript/TypeScript
- **Prettier** - Formateo de código
- **Pretty TypeScript Errors** - Errores de TypeScript más legibles

### Tailwind CSS
- **Tailwind CSS IntelliSense** - Autocompletado de clases
- **Headwind** - Ordenador automático de clases Tailwind

### React/Next.js
- **ES7+ React Snippets** - Snippets de React

### Git
- **GitLens** - Superpoderes para Git

### Utilidades
- **Path Intellisense** - Autocompletado de rutas
- **Auto Rename Tag** - Renombra tags HTML/JSX automáticamente
- **Color Highlight** - Resalta colores en el código
- **Error Lens** - Muestra errores inline

## ⚙️ Configuraciones Principales

### Formateo Automático
- ✅ Formato al guardar activado
- ✅ ESLint auto-fix al guardar
- ✅ Prettier como formateador por defecto

### TypeScript
- Memoria máxima: 4GB
- Auto-imports activado
- Comillas simples preferidas
- Actualización automática de imports al mover archivos

### Editor
- Tab size: 4 espacios
- Word wrap activado
- Colorización de brackets
- Auto-save al cambiar de foco

## 🚀 Tareas Disponibles (Ctrl+Shift+P → "Tasks: Run Task")

- **🚀 Dev Server** - Inicia el servidor de desarrollo
- **🏗️ Build** - Construye para producción
- **🧪 Lint** - Ejecuta linter
- **🧹 Lint Fix** - Ejecuta linter con auto-fix
- **📦 Install Dependencies** - Instala dependencias
- **🔄 Clean & Reinstall** - Limpia y reinstala todo
- **🌐 Production Preview** - Build + start en modo producción

## 🐛 Debug Configurations

Presiona F5 o ve a Run → Start Debugging:

- **🌐 Next.js: debug server-side** - Debug del servidor
- **🔍 Next.js: debug client-side** - Debug del navegador
- **🎯 Next.js: debug full stack** - Debug completo

## ⌨️ Snippets Personalizados

### Componentes Next.js
- `npage` - Página de Next.js
- `nclient` - Componente cliente
- `naction` - Server action
- `rhook` - Custom hook

### Supabase
- `sbquery` - Query de Supabase
- `sbinsert` - Insert en Supabase

### Tailwind
- `twcontainer` - Container responsive
- `twgrid` - Grid responsive
- `twflex` - Flexbox

### Utilidades
- `tryc` - Try-catch block
- `cl` - Console.log
- `ce` - Console.error

## 🎯 Atajos de Teclado Recomendados

- `Ctrl+Shift+P` - Paleta de comandos
- `Ctrl+P` - Búsqueda rápida de archivos
- `Ctrl+Shift+F` - Buscar en todos los archivos
- `F2` - Renombrar símbolo
- `Alt+Click` - Multi-cursor
- `Ctrl+D` - Seleccionar siguiente coincidencia
- `Ctrl+/` - Comentar/descomentar
- `Shift+Alt+F` - Formatear documento
- `F12` - Ir a definición
- `Alt+F12` - Ver definición (peek)

## 📝 Notas para Desarrollo

### Estructura de Carpetas
```
app/          - Páginas y componentes Next.js
components/   - Componentes reutilizables
hooks/        - Custom hooks
lib/          - Utilidades
public/       - Assets estáticos
```

### Convenciones
- **Componentes**: PascalCase (ej: `TripMap.tsx`)
- **Hooks**: camelCase con prefijo "use" (ej: `useTripPlaces.ts`)
- **Archivos**: kebab-case para páginas dinámicas
- **CSS**: Tailwind preferido sobre CSS custom

### Variables de Entorno
Ver `.env.local` para las variables necesarias. Nunca commitees este archivo.

## 🤝 Colaboración

Para Carmen y otros desarrolladores:
1. Abre el proyecto en VS Code
2. Acepta instalar las extensiones recomendadas
3. Las configuraciones se aplicarán automáticamente
4. ¡Listo para desarrollar!

## 🔧 Solución de Problemas

### El formateo no funciona
1. Verifica que Prettier esté instalado
2. Recarga VS Code (Ctrl+Shift+P → "Reload Window")

### TypeScript lento
1. Aumenta la memoria en settings.json
2. Cierra archivos no necesarios
3. Reinicia el servidor TypeScript (Ctrl+Shift+P → "TypeScript: Restart TS Server")

### ESLint no detecta errores
1. Verifica que la extensión ESLint esté instalada
2. Ejecuta `npm install` para asegurar dependencias
3. Recarga VS Code
