/**
 * Script para verificar contenido del ROADMAP en Supabase
 */

const fs = require('fs');
const path = require('path');

// Leer variables de entorno
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
  process.exit(1);
}

async function checkRoadmap() {
  try {
    console.log('🔍 Consultando Supabase...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/roadmap?id=eq.main`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error ${response.status}: ${error}`);
    }
    
    const result = await response.json();
    
    if (!result || result.length === 0) {
      console.log('❌ No se encontró registro en Supabase');
    } else {
      const record = result[0];
      const preview = record.content.substring(0, 500);
      
      console.log('✅ Registro encontrado:');
      console.log(`   ID: ${record.id}`);
      console.log(`   Longitud: ${record.content.length} caracteres`);
      console.log(`   Actualizado: ${record.updated_at}`);
      console.log('\n📄 Preview (primeros 500 caracteres):');
      console.log('─'.repeat(60));
      console.log(preview);
      console.log('─'.repeat(60));
      
      // Buscar keywords específicas
      const hasStarFeature = record.content.includes('DESTACADO - Feature Estrella');
      const hasV06 = record.content.includes('v0.6');
      const hasAdjustStage = record.content.includes('Ajuste Manual de Etapas');
      
      console.log('\n🔍 Verificación de contenido actualizado:');
      console.log(`   ⭐ Sección "DESTACADO - Feature Estrella": ${hasStarFeature ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   📦 Versión "v0.6": ${hasV06 ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   🎯 "Ajuste Manual de Etapas": ${hasAdjustStage ? '✅ SÍ' : '❌ NO'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkRoadmap();
