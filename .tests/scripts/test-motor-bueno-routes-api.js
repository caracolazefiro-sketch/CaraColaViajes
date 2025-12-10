/**
 * Test Motor Bueno con Routes API v2
 * Prueba ruta compleja: Salamanca → Estocolmo con múltiples waypoints
 */

const API_URL = 'https://cara-cola-viajes-pruebas-git-testing-caracola.vercel.app/motor-bueno';

console.log('🧪 TEST MOTOR BUENO - ROUTES API V2\n');
console.log('📍 Ruta: Salamanca → París → Bruselas → Ámsterdam → Hamburgo → Copenhague → Estocolmo');
console.log('⚙️  Config: 300 km/día, 10 días de viaje\n');

const testData = {
    origin: 'Salamanca, España',
    destination: 'Estocolmo, Suecia',
    waypoints: [
        'París, Francia',
        'Bruselas, Bélgica',
        'Ámsterdam, Países Bajos',
        'Hamburgo, Alemania',
        'Copenhague, Dinamarca'
    ],
    kmMaximoDia: 300,
    fechaInicio: '2025-12-15',
    fechaRegreso: '2025-12-25',
    travel_mode: 'driving'
};

console.log('📦 Datos de prueba:', JSON.stringify(testData, null, 2));
console.log('\n⏳ Abre el navegador en:', API_URL);
console.log('\n✅ Prueba manualmente:');
console.log('   1. Introduce los datos en el formulario');
console.log('   2. Verifica que la segmentación funcione');
console.log('   3. Comprueba que el mapa cargue correctamente');
console.log('   4. Revisa la consola del navegador para errores');
console.log('   5. Verifica que los días extra se generen correctamente\n');
console.log('📊 Resultados esperados:');
console.log('   - Etapas de ~300 km cada una');
console.log('   - Waypoints insertados automáticamente');
console.log('   - Días de conducción + días de estancia');
console.log('   - Mapa con ruta completa visible');
console.log('   - Sin errores en consola\n');
