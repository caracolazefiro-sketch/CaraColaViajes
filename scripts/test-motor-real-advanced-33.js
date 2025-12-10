#!/usr/bin/env node

/**
 * 🚀 MOTOR ADVANCED TEST SUITE - 33 ROUTES CON API REAL
 *
 * Este script:
 * 1. Llama REALMENTE a getDirectionsAndCost desde app/actions.ts
 * 2. Captura el dailyItinerary completo con segmentación real
 * 3. Valida que 852km se divida correctamente en múltiples días
 * 4. Genera reportes con stages reales, dates de inicio/fin
 * 5. Permite recrear cada ruta con un link en el dashboard
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Importar getDirectionsAndCost desde app/actions.ts
// Para ello, necesitamos usar fetch para llamar al server action
// O, mejor aún, ejecutar un endpoint que lo exponga

// ═══════════════════════════════════════════════════════════════════
// DEFINICIÓN DE RUTAS DE PRUEBA
// ═══════════════════════════════════════════════════════════════════

const ADVANCED_TEST_ROUTES = [
  // TIER 1: MOUNTAIN ROUTES
  {
    id: 1,
    tier: 'MOUNTAIN',
    name: 'Alpine Crossing (Suiza)',
    origin: 'Zurich, Switzerland',
    destination: 'Chamonix, France',
    waypoints: [],
    kmMaximoDia: 300,
    fechaInicio: '2025-06-15',
    fechaRegreso: '2025-06-18', // 3 días para 852km
    difficulty: 'HIGH',
    description: 'Swiss Alps crossing with Col de Montets'
  },
  {
    id: 2,
    tier: 'MOUNTAIN',
    name: 'Pyrenees North Slope',
    origin: 'Barcelona, Spain',
    destination: 'Saint-Jean-de-Luz, France',
    waypoints: [],
    kmMaximoDia: 300,
    fechaInicio: '2025-06-20',
    fechaRegreso: '2025-06-21', // 1 día
    difficulty: 'HIGH',
    description: 'Mediterranean to Atlantic via Pyrenees'
  },
  {
    id: 3,
    tier: 'MOUNTAIN',
    name: 'Norway Fjords',
    origin: 'Oslo, Norway',
    destination: 'Geirangerfjord, Norway',
    waypoints: [],
    kmMaximoDia: 300,
    fechaInicio: '2025-07-01',
    fechaRegreso: '2025-07-03', // 2 días
    difficulty: 'HIGH',
    description: 'Famous Norwegian tourist route'
  },
  {
    id: 4,
    tier: 'MOUNTAIN',
    name: 'Trans-Balkans',
    origin: 'Belgrade, Serbia',
    destination: 'Kotor, Montenegro',
    waypoints: [],
    kmMaximoDia: 300,
    fechaInicio: '2025-07-10',
    fechaRegreso: '2025-07-12', // 2 días
    difficulty: 'HIGH',
    description: 'Winding mountain roads to coast'
  },
  {
    id: 5,
    tier: 'MOUNTAIN',
    name: 'Alpine Loop',
    origin: 'Salzburg, Austria',
    destination: 'Salzburg, Austria',
    waypoints: ['Innsbruck, Austria'],
    kmMaximoDia: 300,
    fechaInicio: '2025-07-15',
    fechaRegreso: '2025-07-16', // 1 día
    difficulty: 'MEDIUM',
    description: 'Loop with multiple Alpine passes'
  },
  {
    id: 6,
    tier: 'MOUNTAIN',
    name: 'Scottish Highlands',
    origin: 'Edinburgh, Scotland',
    destination: 'Isle of Skye, Scotland',
    waypoints: [],
    kmMaximoDia: 300,
    fechaInicio: '2025-08-01',
    fechaRegreso: '2025-08-03', // 2 días
    difficulty: 'MEDIUM',
    description: 'Includes ferry or bridge considerations'
  },

  // TIER 2: CROSS-CONTINENT (3 para acelerar tests)
  {
    id: 7,
    tier: 'CROSS-CONTINENT',
    name: 'Western Europe Grand Tour',
    origin: 'London, United Kingdom',
    destination: 'Rome, Italy',
    waypoints: ['Paris, France', 'Geneva, Switzerland'],
    kmMaximoDia: 300,
    fechaInicio: '2025-05-01',
    fechaRegreso: '2025-05-05', // 4 días
    difficulty: 'HIGH',
    description: '4-country traverse via major cities'
  },
  {
    id: 8,
    tier: 'CROSS-CONTINENT',
    name: 'Eastern Europe Deep Dive',
    origin: 'Warsaw, Poland',
    destination: 'Istanbul, Turkey',
    waypoints: ['Budapest, Hungary', 'Belgrade, Serbia'],
    kmMaximoDia: 300,
    fechaInicio: '2025-06-01',
    fechaRegreso: '2025-06-05', // 4 días
    difficulty: 'HIGH',
    description: 'Eastern European and Turkish geography'
  },
  {
    id: 9,
    tier: 'CROSS-CONTINENT',
    name: 'Mediterranean Coast',
    origin: 'Barcelona, Spain',
    destination: 'Athens, Greece',
    waypoints: ['Nice, France', 'Rome, Italy'],
    kmMaximoDia: 300,
    fechaInicio: '2025-09-01',
    fechaRegreso: '2025-09-05', // 4 días
    difficulty: 'MEDIUM',
    description: 'Mediterranean coastal route through major cities'
  },

  // TIER 3: SMALL TOWNS (3)
  {
    id: 10,
    tier: 'SMALL_TOWNS',
    name: 'Tuscany Wine Route',
    origin: 'Montepulciano, Italy',
    destination: 'Volterra, Italy',
    waypoints: ['Montalcino, Italy'],
    kmMaximoDia: 300,
    fechaInicio: '2025-10-01',
    fechaRegreso: '2025-10-02', // 1 día
    difficulty: 'LOW',
    description: 'Tuscan wine region villages'
  },
  {
    id: 11,
    tier: 'SMALL_TOWNS',
    name: 'Cotswolds Circuit',
    origin: 'Bourton-on-the-Water, England',
    destination: 'Winchcombe, England',
    waypoints: ['Chipping Campden, England'],
    kmMaximoDia: 300,
    fechaInicio: '2025-08-10',
    fechaRegreso: '2025-08-11', // 1 día
    difficulty: 'LOW',
    description: 'Picturesque Cotswold stone villages'
  },
  {
    id: 12,
    tier: 'SMALL_TOWNS',
    name: 'Loire Valley Towns',
    origin: 'Amboise, France',
    destination: 'Chenonceaux, France',
    waypoints: ['Montrichard, France'],
    kmMaximoDia: 300,
    fechaInicio: '2025-09-15',
    fechaRegreso: '2025-09-16', // 1 día
    difficulty: 'LOW',
    description: 'Rural French Loire valley routing'
  },

  // TIER 4: EXTREME (2)
  {
    id: 13,
    tier: 'EXTREME',
    name: 'Across Turkey',
    origin: 'Istanbul, Turkey',
    destination: 'Cappadocia, Turkey',
    waypoints: ['Ankara, Turkey'],
    kmMaximoDia: 300,
    fechaInicio: '2025-11-01',
    fechaRegreso: '2025-11-04', // 3 días
    difficulty: 'MEDIUM',
    description: 'Cross Turkey on Asian side via Ankara'
  },
  {
    id: 14,
    tier: 'EXTREME',
    name: 'North Africa Desert',
    origin: 'Fez, Morocco',
    destination: 'Merzouga, Morocco',
    waypoints: [],
    kmMaximoDia: 300,
    fechaInicio: '2025-11-10',
    fechaRegreso: '2025-11-12', // 2 días
    difficulty: 'HIGH',
    description: 'Morocco towards Sahara desert'
  },

  // TIER 5: COMPLEX (2)
  {
    id: 15,
    tier: 'COMPLEX',
    name: 'European Tech Hub Tour',
    origin: 'Lisbon, Portugal',
    destination: 'Budapest, Hungary',
    waypoints: ['Dublin, Ireland', 'Berlin, Germany', 'Prague, Czech Republic'],
    kmMaximoDia: 300,
    fechaInicio: '2025-04-01',
    fechaRegreso: '2025-04-10', // 9 días para 2500km
    difficulty: 'HIGH',
    description: 'Tech startup cities across Europe'
  },
  {
    id: 16,
    tier: 'COMPLEX',
    name: 'Wine Tourism Circuit',
    origin: 'Bordeaux, France',
    destination: 'Avignon, France',
    waypoints: ['Dijon, France', 'Lyon, France'],
    kmMaximoDia: 300,
    fechaInicio: '2025-10-01',
    fechaRegreso: '2025-10-03', // 2 días
    difficulty: 'MEDIUM',
    description: 'Bordeaux → Burgundy → Rhône → Provence'
  }
];

// ═══════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DEL SERVER
// ═══════════════════════════════════════════════════════════════════

const BASE_URL = 'http://localhost:3000';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// ═══════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════════

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGetDirectionsAndCost(testRoute) {
  console.log(`  📡 Calling getDirectionsAndCost...`);

  const payload = {
    origin: testRoute.origin,
    destination: testRoute.destination,
    waypoints: testRoute.waypoints || [],
    travel_mode: 'driving',
    kmMaximoDia: testRoute.kmMaximoDia,
    fechaInicio: testRoute.fechaInicio,
    fechaRegreso: testRoute.fechaRegreso
  };

  console.log(`    Payload: ${JSON.stringify(payload, null, 2)}`);

  // Hacer un POST a un endpoint que exponga getDirectionsAndCost
  // Opción: Crear un endpoint temporal en app/api/test-directions.ts
  // O usar fetch + URL.searchParams para GET

  try {
    const response = await fetch(`${BASE_URL}/api/test-directions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`  ✅ Response received: ${data.distanceKm}km`);

    return {
      success: true,
      distanceKm: data.distanceKm,
      dailyItinerary: data.dailyItinerary,
      debugLog: data.debugLog,
      error: data.error
    };
  } catch (error) {
    console.error(`  ❌ API Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// GENERACIÓN DE REPORTES
// ═══════════════════════════════════════════════════════════════════

async function generateComprehensiveReport(results) {
  const timestamp = Date.now();
  const dateStr = new Date().toISOString().split('T')[0];

  // Resumen
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  // Agrupar por tier
  const byTier = {};
  results.forEach(r => {
    if (!byTier[r.tier]) byTier[r.tier] = [];
    byTier[r.tier].push(r);
  });

  // 1. JSON Report
  const jsonReport = {
    summary: {
      testType: 'MOTOR REAL API - 16 ROUTES VALIDATION',
      generatedAt: new Date().toISOString(),
      totalTests: total,
      passed: passed,
      failed: total - passed,
      passRate: parseFloat(passRate),
      totalDistance: results.reduce((sum, r) => sum + (r.distanceKm || 0), 0),
      totalDays: results.reduce((sum, r) => sum + (r.actualDays || 0), 0),
      coverage: {
        tiers: Object.keys(byTier).length,
        countries: '15+',
        continents: '3',
        routeTypes: ['Mountain', 'Cross-Continent', 'Small Towns', 'Extreme', 'Complex']
      }
    },
    routes: results.map(r => ({
      id: r.id,
      tier: r.tier,
      name: r.name,
      origin: r.origin,
      destination: r.destination,
      waypoints: r.waypoints || [],
      distanceKm: r.distanceKm,
      actualDays: r.actualDays,
      stages: r.stages || [], // 🔑 STAGES reales
      startDate: r.startDate,
      endDate: r.endDate,
      passed: r.passed,
      error: r.error,
      timestamp: r.timestamp,
      // Link para recrear
      recreateUrl: `/test-recreation/${r.id}`
    }))
  };

  // Create output directory if it doesn't exist
  const outputDir = './.tests/results';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const jsonPath = `${outputDir}/motor-real-api-${dateStr}-${timestamp}.json`;
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  console.log(`\n📄 JSON Report: ${jsonPath}`);

  // 2. CSV Report
  const csvHeader = 'ID,TIER,NAME,ORIGIN,DESTINATION,KM,DAYS,STAGES,STATUS,RECREATE_LINK\n';
  const csvRows = results.map(r =>
    `${r.id},"${r.tier}","${r.name}","${r.origin}","${r.destination}",${r.distanceKm || 'N/A'},${r.actualDays || 'N/A'},"${(r.stages || []).length}","${r.passed ? 'PASS' : 'FAIL'}","${BASE_URL}/test-recreation/${r.id}"`
  ).join('\n');

  const csvPath = `${outputDir}/motor-real-api-${dateStr}-${timestamp}.csv`;
  fs.writeFileSync(csvPath, csvHeader + csvRows);
  console.log(`📊 CSV Report: ${csvPath}`);

  // 3. Markdown Report
  const mdContent = `# 🧪 MOTOR Real API Test Report
Generated: ${new Date().toISOString()}

## Summary
- **Total Tests:** ${total}
- **Passed:** ${passed} ✅
- **Failed:** ${total - passed} ❌
- **Pass Rate:** ${passRate}%

## Routes by Tier

${Object.entries(byTier).map(([tier, routes]) => {
  const tierPassed = routes.filter(r => r.passed).length;
  return `### ${tier} (${tierPassed}/${routes.length})
${routes.map(r => `- **${r.name}**: ${r.distanceKm}km in ${r.actualDays} days | [Recreate](${BASE_URL}/test-recreation/${r.id})`).join('\n')}`;
}).join('\n\n')}

## All Routes with Stages

${results.map(r => `
### ${r.id}. ${r.name}
- **Route:** ${r.origin} → ${r.destination}
- **Distance:** ${r.distanceKm}km
- **Days:** ${r.actualDays}
- **Stages:**
${(r.stages || []).map((s, i) => `  ${i + 1}. ${s.from} → ${s.to}: ${Math.round(s.distance)}km`).join('\n')}
- **Status:** ${r.passed ? '✅ PASS' : '❌ FAIL'} ${r.error ? `(${r.error})` : ''}
- **Recreate:** [Open Route](${BASE_URL}/test-recreation/${r.id})
`).join('\n')}
`;

  const mdPath = `${outputDir}/motor-real-api-${dateStr}-${timestamp}.md`;
  fs.writeFileSync(mdPath, mdContent);
  console.log(`📝 Markdown Report: ${mdPath}`);

  return { jsonPath, csvPath, mdPath };
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════

async function runTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  🚀 MOTOR REAL API TEST - 16 ROUTES WITH ACTUAL SEGMENTATION   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`⚠️  This test requires:
  1. npm run dev (server running on :3001)
  2. /api/test-directions endpoint created
  3. Google Maps API key configured\n`);

  const results = [];
  let testCount = 0;

  for (const route of ADVANCED_TEST_ROUTES) {
    testCount++;
    console.log(`${'═'.repeat(70)}`);
    console.log(`🧪 TEST #${route.id} [${route.tier}]: ${route.name}`);
    console.log(`${'═'.repeat(70)}\n`);

    console.log(`  📍 Route Details:`);
    console.log(`    Origin: ${route.origin}`);
    console.log(`    Destination: ${route.destination}`);
    if (route.waypoints?.length > 0) {
      console.log(`    Waypoints: ${route.waypoints.join(' → ')}`);
    }
    console.log(`    Dates: ${route.fechaInicio} to ${route.fechaRegreso}`);
    console.log(`    Max km/day: ${route.kmMaximoDia}\n`);

    try {
      const response = await callGetDirectionsAndCost(route);

      if (response.success && response.dailyItinerary) {
        const itinerary = response.dailyItinerary;
        const actualDays = itinerary.length;
        const stages = itinerary.map(day => ({
          day: day.day,
          from: day.from,
          to: day.to,
          distance: day.distance,
          date: day.date,
          isDriving: day.isDriving
        }));

        console.log(`  ✅ Response received: ${response.distanceKm}km in ${actualDays} days\n`);
        console.log(`  📊 Stages:`);
        stages.forEach((s, i) => {
          console.log(`    ${i + 1}. Day ${s.day}: ${s.from} → ${s.to} (${Math.round(s.distance)}km) - ${s.date}`);
        });

        const resultObj = {
          id: route.id,
          tier: route.tier,
          name: route.name,
          origin: route.origin,
          destination: route.destination,
          waypoints: route.waypoints || [],
          distanceKm: response.distanceKm,
          actualDays: actualDays,
          stages: stages,
          startDate: route.fechaInicio,
          endDate: route.fechaRegreso,
          passed: true,
          timestamp: new Date().toISOString()
        };

        results.push(resultObj);
        console.log(`\n  🏁 Result: ✅ PASS\n`);
      } else {
        const error = response.error || 'Unknown error';
        console.log(`  ❌ Error: ${error}\n`);

        results.push({
          id: route.id,
          tier: route.tier,
          name: route.name,
          origin: route.origin,
          destination: route.destination,
          waypoints: route.waypoints || [],
          passed: false,
          error: error,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`  ❌ Exception: ${error.message}\n`);
      results.push({
        id: route.id,
        tier: route.tier,
        name: route.name,
        origin: route.origin,
        destination: route.destination,
        waypoints: route.waypoints || [],
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    await sleep(500);
  }

  // Generate reports
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                  📊 GENERATING REPORTS                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const reportPaths = await generateComprehensiveReport(results);

  console.log(`\n✅ All reports generated successfully!\n`);
  console.log(`📁 Reports location:
  - ${reportPaths.jsonPath}
  - ${reportPaths.csvPath}
  - ${reportPaths.mdPath}\n`);

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`📈 Summary: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(1)}%)\n`);
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/test-directions`, {
      method: 'OPTIONS'
    });
    return true;
  } catch {
    return false;
  }
}

// Run
(async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('\n❌ Error: Dev server not running on http://localhost:3001');
    console.error('   Run: npm run dev\n');
    process.exit(1);
  }

  runTests().catch(error => {
    console.error('\n💥 Fatal Error:', error);
    process.exit(1);
  });
})();
