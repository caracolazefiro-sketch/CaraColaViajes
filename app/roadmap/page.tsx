'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const INITIAL_CONTENT = `# CaraColaViajes - Roadmap & Ideas

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
    - Nº de reseñas (user_ratings_total)
    - Abierto ahora / estado (opening_hours.open_now / business_status)
    - Tags útiles (types) y price_level (si viene)
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
- **Teléfonos**: \`formatted_phone_number\` via \`PlacesService.getDetails()\`
- **Sitios web**: \`website\` via \`PlacesService.getDetails()\`
- **Horarios completos**: \`opening_hours.weekday_text[]\` (horario detallado por día)
- **Fotos adicionales**: \`photos[]\` (galería completa, no solo primera foto)
- **Precio aproximado**: \`price_level\` (0-4, económico a caro)
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
- [ ] Actualizar \`baseline-browser-mapping\` (warning en build)
- [ ] Sanitizar logs: redacción de API keys (Google \`key=...\`) antes de guardar/mostrar en Supabase

---

## ✅ COMPLETADO (Últimas implementaciones)

### v0.5 - Sistema de Colaboración & Tooling (Dic 2025) 🆕
- ✅ **Chat de desarrollo en tiempo real** (Supabase Realtime)
  - Mensajes instantáneos entre desarrolladores
  - Avatares con colores únicos por usuario
  - Timestamps relativos
  - Accesible en \`/dev-chat\` (solo dev/preview)
- ✅ **Migraciones de base de datos**
  - Tabla \`dev_messages\` con RLS
  - Tabla \`roadmap_comments\` para colaboración futura
  - Realtime habilitado
- ✅ **Configuración completa de VS Code**
  - Extensiones recomendadas (ESLint, Prettier, Tailwind, GitLens)
  - Settings optimizados para Next.js/TypeScript
  - Tareas predefinidas (dev, build, lint, clean)
  - Configuraciones de debug (server, client, full-stack)
  - Snippets personalizados (Next.js, Supabase, Tailwind)
  - Documentación en \`.vscode/README.md\`
- ✅ **Onboarding para nuevos desarrolladores**
  - Guía interactiva HTML (\`SETUP_CARMEN.html\`)
  - Quick reference Markdown (\`SETUP_CARMEN.md\`)
  - Setup paso a paso con troubleshooting
- ✅ **Mejoras de código**
  - TypeScript: 0 errores
  - ESLint: Errores críticos resueltos
  - Hooks en orden correcto
  - Types de Supabase en lugar de \`any\`
  - Links de Next.js en lugar de \`<a>\`

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
`;

export default function RoadmapPage() {
    const [content, setContent] = useState(INITIAL_CONTENT);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Cargar contenido desde Supabase al montar
    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        if (!supabase) {
            setMessage('⚠️ Supabase no configurado - usando contenido local');
            setLoading(false);
            return;
        }

        try {
            console.log('🔄 Cargando ROADMAP desde Supabase...');
            
            const { data, error } = await supabase
                .from('roadmap')
                .select('content, updated_at')
                .eq('id', 'main')
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No existe registro, se creará al guardar
                    setMessage('📝 Usando contenido inicial');
                    console.log('⚠️ No existe registro en Supabase');
                } else {
                    console.error('Error loading roadmap:', error);
                    setMessage('❌ Error al cargar: ' + error.message);
                }
            } else if (data?.content) {
                console.log(`✅ ROADMAP cargado: ${data.content.length} caracteres`);
                console.log(`📅 Actualizado: ${data.updated_at}`);
                console.log(`🔍 Preview: ${data.content.substring(0, 100)}...`);
                
                setContent(data.content);
                setMessage(`✅ Cargado desde Supabase (${new Date(data.updated_at).toLocaleString()})`);
            }
        } catch (err) {
            console.error('Error:', err);
            setMessage('❌ Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const saveContent = async () => {
        if (!supabase) {
            setMessage('⚠️ Supabase no configurado - guardado solo en sesión');
            setEditing(false);
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('roadmap')
                .upsert({ 
                    id: 'main', 
                    content,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error saving roadmap:', error);
                setMessage('❌ Error al guardar: ' + error.message);
            } else {
                setMessage('✅ Guardado correctamente');
                setEditing(false);
            }
        } catch (err) {
            console.error('Error:', err);
            setMessage('❌ Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
                <div className="text-xl text-gray-600">Cargando roadmap...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                🗺️ CaraColaViajes Roadmap
                            </h1>
                            <p className="text-sm text-gray-600">
                                Ideas, mejoras y features futuras
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {!editing && (
                                <button
                                    onClick={() => {
                                        setLoading(true);
                                        loadContent();
                                    }}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                >
                                    🔄 Recargar
                                </button>
                            )}
                            {editing ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setEditing(false);
                                            loadContent(); // Recargar para descartar cambios
                                        }}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={saveContent}
                                        disabled={saving}
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                                    >
                                        {saving ? '💾 Guardando...' : '💾 Guardar'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                                >
                                    ✏️ Editar
                                </button>
                            )}
                        </div>
                    </div>
                    {message && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                            {message}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {editing ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Editor Markdown
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-[600px] p-4 border-2 border-blue-300 rounded-lg font-mono text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 placeholder-gray-400"
                                placeholder="# Título

## Subtítulo

- [ ] Tarea pendiente
- [x] Tarea completada

**Texto en negrita**
`código`"
                            />
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs font-medium text-blue-900 mb-2">💡 Sintaxis Markdown:</p>
                                <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                                    <div><code className="bg-white px-2 py-0.5 rounded"># Título grande</code></div>
                                    <div><code className="bg-white px-2 py-0.5 rounded">## Subtítulo</code></div>
                                    <div><code className="bg-white px-2 py-0.5 rounded">**Negrita**</code></div>
                                    <div><code className="bg-white px-2 py-0.5 rounded">`código`</code></div>
                                    <div><code className="bg-white px-2 py-0.5 rounded">- Lista</code></div>
                                    <div><code className="bg-white px-2 py-0.5 rounded">- [ ] Checkbox</code></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="prose prose-blue max-w-none">
                            {/* Renderizado simple de markdown */}
                            {content.split('\n').map((line, idx) => {
                                // Títulos
                                if (line.startsWith('### ')) {
                                    return <h3 key={idx} className="text-xl font-bold mt-6 mb-3 text-gray-800">{line.replace('### ', '')}</h3>;
                                }
                                if (line.startsWith('## ')) {
                                    return <h2 key={idx} className="text-2xl font-bold mt-8 mb-4 text-blue-600">{line.replace('## ', '')}</h2>;
                                }
                                if (line.startsWith('# ')) {
                                    return <h1 key={idx} className="text-3xl font-bold mb-6 text-gray-900">{line.replace('# ', '')}</h1>;
                                }
                                // Separador
                                if (line === '---') {
                                    return <hr key={idx} className="my-8 border-gray-300" />;
                                }
                                // Listas
                                if (line.startsWith('- ')) {
                                    const htmlContent = line
                                        .replace('- ', '')
                                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                                        .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-blue-600">$1</code>');
                                    return <li key={idx} className="ml-6 my-1 text-gray-700" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
                                }
                                // Checkboxes
                                if (line.includes('[ ]') || line.includes('[x]') || line.includes('[X]')) {
                                    const checked = line.includes('[x]') || line.includes('[X]');
                                    const text = line.replace(/- \[([ xX])\] /, '');
                                    const htmlText = text
                                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                                        .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-blue-600">$1</code>');
                                    return (
                                        <div key={idx} className="flex items-start gap-2 ml-6 my-2">
                                            <input 
                                                type="checkbox" 
                                                checked={checked} 
                                                readOnly 
                                                className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500" 
                                            />
                                            <span 
                                                className={checked ? 'line-through text-gray-400' : 'text-gray-700'}
                                                dangerouslySetInnerHTML={{ __html: htmlText }}
                                            />
                                        </div>
                                    );
                                }
                                // Párrafos normales
                                if (line.trim()) {
                                    return <p key={idx} className="mb-2 text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{
                                        __html: line
                                            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                                            .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-blue-600">$1</code>')
                                    }} />;
                                }
                                return <br key={idx} />;
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
