'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const INITIAL_CONTENT = `# CaraColaViajes — Roadmap Operativo

> **Última actualización:** 22 Diciembre 2025

## Principio rector: “Mutación / Control absoluto de costes”
- El navegador **NO** llama APIs pagadas de Google (Directions/Geocoding/Elevation/Places).
- El navegador solo usa **Maps JS SDK** para render.
- Todo lo pagado va por **servidor** (server actions + \`/api/google/*\`) con **logs + caché + rate-limit + trazabilidad** (\`clientId\` + \`user_id\`).

## Estado actual
### ✅ Hecho
- Trial vs Login:
  - Trial: **máx 10 días**, **máx 2 waypoints**, **máx 2 supercat/día** por \`clientId\`.
  - Login: desbloqueo de límites + \`username\` en \`user_metadata\`.
- QA: \`scripts/test-mutation-map.js\` (Puppeteer) → asegura **0 llamadas directas** a Google paid APIs desde el browser.
- Elevation/Directions UI: \`authToken\` propagado a endpoints server-side.
- Predictivos (Autocomplete): restaurado vía endpoint interno **server-side** \`GET /api/google/places-autocomplete\` (solo logueados).

### 🟠 En curso
- Cierre completo de “trial gasto cero” para cualquier UI que dispare \`/api/google/*\`.

## Próximo bloque (P1 — esta semana)
Objetivo: en trial, **ninguna acción** debe provocar llamadas server-side pagadas “extra” por UX.

Checklist:
- [ ] \`AdjustStageModal\`: pasar \`trialMode\` y bloquear \`/api/google/geocode-address\` en trial.
- [ ] \`useStageNavigation\`: evitar geocoding táctico en trial (o no-op con aviso).
- [ ] \`useElevation\`: confirmar bloqueo en trial (o gating equivalente) y que UI muestra aviso.
- [ ] \`/share/[id]\`: revisar llamadas a \`/api/google/directions\` y decidir política (p.ej. requerir login si no existe polyline/overview).

## Siguiente (P2 — 1-2 semanas)
- [ ] Sanitizar logs: redactar API keys (\`key=...\`) antes de persistir/mostrar.
- [ ] Endurecer rate-limit por endpoint (especialmente autocomplete, directions, geocode).
- [ ] Homogeneizar “Auth required” en endpoints sensibles y mensajes UX.

## Backlog (P3/P4)
- [ ] Mejorar UX del autocomplete (teclado/enter/highlight) sin cambiar el principio de costes.
- [ ] Auditoría/visor: agregados por \`clientId\`/\`user_id\`, top endpoints, coste por día.

## Sincronización con Supabase
Este repo tiene scripts:
- \`node scripts/sync-roadmap.js\` → sube \`ROADMAP.md\` a la tabla \`roadmap\` (id=\`main\`).
- \`node scripts/check-roadmap.js\` → verifica que Supabase lo tiene.

Requiere en \`.env.local\`:
- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
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
