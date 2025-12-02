/**
 * Script para sincronizar ROADMAP.md con Supabase
 * 
 * Uso:
 *   node scripts/sync-roadmap.js
 * 
 * Requiere variables de entorno:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

const fs = require('fs');
const path = require('path');

// Leer variables de entorno desde .env.local si existe
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('   Necesitas NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('   Crear archivo .env.local en la raíz del proyecto');
  process.exit(1);
}

async function syncRoadmap() {
  try {
    console.log('📖 Leyendo ROADMAP.md...');
    const roadmapPath = path.join(__dirname, '..', 'ROADMAP.md');
    
    if (!fs.existsSync(roadmapPath)) {
      throw new Error('No se encontró ROADMAP.md');
    }
    
    const content = fs.readFileSync(roadmapPath, 'utf-8');
    console.log(`✅ ROADMAP.md leído (${content.length} caracteres)`);
    
    console.log('📤 Sincronizando con Supabase...');
    
    // Usar upsert para asegurar que actualiza o crea
    const response = await fetch(`${SUPABASE_URL}/rest/v1/roadmap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({
        id: 'main',
        content: content,
        updated_at: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error ${response.status}: ${error}`);
    }
    
    const result = await response.json();
    
    console.log('✅ ROADMAP actualizado en Supabase');
    console.log('');
    console.log('🎉 Sincronización completada con éxito');
    console.log(`📊 ${content.length} caracteres sincronizados`);
    console.log(`🕐 ${new Date().toLocaleString()}`);
    console.log('');
    console.log('🔍 Verificación:');
    console.log(`   ID: ${result[0]?.id || result.id}`);
    console.log(`   Longitud en DB: ${result[0]?.content?.length || result.content?.length} chars`);
    console.log(`   Updated at: ${result[0]?.updated_at || result.updated_at}`);
    
  } catch (error) {
    console.error('❌ Error durante la sincronización:');
    console.error(error.message);
    process.exit(1);
  }
}

// Ejecutar
syncRoadmap();
