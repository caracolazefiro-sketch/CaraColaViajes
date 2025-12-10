import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface TripLog {
    tripId: string;
    startTime: string;
    endTime?: string;
    origin: string;
    destination: string;
    kmMaximo: number;
    totalDistance?: number;
    daysCount?: number;
    apiCalls: Array<{
        timestamp: string;
        type: 'DIRECTIONS' | 'GEOCODING';
        cached?: boolean;
        duration?: number;
    }>;
    summary?: {
        directionsAPICalls: number;
        geocodingAPICalls: number;
        geocodingCached: number;
        totalDuration: number;
    };
}

function generateReport() {
    const logsDir = join(process.cwd(), 'logs', 'api-calls');

    if (!existsSync(logsDir)) {
        console.log('❌ No se encontró el directorio de logs');
        return;
    }

    const files = readdirSync(logsDir)
        .filter(f => f.endsWith('.json'))
        .sort();

    if (files.length === 0) {
        console.log('❌ No hay viajes registrados aún');
        return;
    }

    const trips: TripLog[] = files.map(file => {
        const content = readFileSync(join(logsDir, file), 'utf-8');
        return JSON.parse(content);
    });

    console.log('\n📊 INFORME COMPLETO DE APIS - CaraColaViajes\n');
    console.log('='.repeat(80));

    // Resumen General
    const totalTrips = trips.length;
    const totalDirections = trips.reduce((sum, t) => sum + (t.summary?.directionsAPICalls || 0), 0);
    const totalGeocoding = trips.reduce((sum, t) => sum + (t.summary?.geocodingAPICalls || 0), 0);
    const totalCached = trips.reduce((sum, t) => sum + (t.summary?.geocodingCached || 0), 0);
    const totalDuration = trips.reduce((sum, t) => sum + (t.summary?.totalDuration || 0), 0);
    const avgGeocoding = totalTrips > 0 ? (totalGeocoding / totalTrips).toFixed(1) : 0;
    const cacheEfficiency = totalGeocoding + totalCached > 0
        ? ((totalCached / (totalGeocoding + totalCached)) * 100).toFixed(1)
        : 0;

    console.log('\n📈 RESUMEN GENERAL');
    console.log('-'.repeat(80));
    console.log(`Total de viajes analizados:     ${totalTrips}`);
    console.log(`Periodo:                         ${new Date(trips[0].startTime).toLocaleDateString('es-ES')} - ${new Date(trips[trips.length - 1].startTime).toLocaleDateString('es-ES')}`);
    console.log(`\n🗺️  Directions API:`);
    console.log(`   - Total llamadas:             ${totalDirections}`);
    console.log(`   - Promedio por viaje:         ${(totalDirections / totalTrips).toFixed(1)}`);
    console.log(`\n📍 Geocoding API:`);
    console.log(`   - Total llamadas (reales):    ${totalGeocoding}`);
    console.log(`   - Total desde caché:          ${totalCached} ✅`);
    console.log(`   - Promedio por viaje:         ${avgGeocoding}`);
    console.log(`   - Eficiencia de caché:        ${cacheEfficiency}% 🎯`);
    console.log(`\n⏱️  Rendimiento:`);
    console.log(`   - Duración total:             ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`   - Duración promedio:          ${(totalDuration / totalTrips).toFixed(0)}ms`);

    // Top 5 viajes más largos
    console.log('\n\n🏆 TOP 5 VIAJES MÁS LARGOS');
    console.log('-'.repeat(80));
    const topLong = [...trips]
        .filter(t => t.totalDistance)
        .sort((a, b) => (b.totalDistance || 0) - (a.totalDistance || 0))
        .slice(0, 5);

    topLong.forEach((trip, i) => {
        console.log(`${i + 1}. ${trip.origin} → ${trip.destination}`);
        console.log(`   ${trip.totalDistance?.toFixed(0)} km | ${trip.daysCount} días | ${trip.summary?.geocodingAPICalls} geocoding calls`);
    });

    // Top 5 viajes con más API calls
    console.log('\n\n🔥 TOP 5 VIAJES CON MÁS LLAMADAS API');
    console.log('-'.repeat(80));
    const topCalls = [...trips]
        .sort((a, b) => (b.summary?.geocodingAPICalls || 0) - (a.summary?.geocodingAPICalls || 0))
        .slice(0, 5);

    topCalls.forEach((trip, i) => {
        console.log(`${i + 1}. ${trip.origin} → ${trip.destination}`);
        console.log(`   ${trip.summary?.geocodingAPICalls} geocoding | ${trip.summary?.geocodingCached} cached | ${new Date(trip.startTime).toLocaleDateString('es-ES')}`);
    });

    // Distribución por distancia
    console.log('\n\n📊 DISTRIBUCIÓN POR DISTANCIA');
    console.log('-'.repeat(80));
    const ranges = [
        { name: 'Corta (< 500km)', min: 0, max: 500, trips: [] as TripLog[] },
        { name: 'Media (500-1500km)', min: 500, max: 1500, trips: [] as TripLog[] },
        { name: 'Larga (1500-3000km)', min: 1500, max: 3000, trips: [] as TripLog[] },
        { name: 'Muy Larga (> 3000km)', min: 3000, max: Infinity, trips: [] as TripLog[] }
    ];

    trips.forEach(trip => {
        const dist = trip.totalDistance || 0;
        const range = ranges.find(r => dist >= r.min && dist < r.max);
        if (range) range.trips.push(trip);
    });

    ranges.forEach(range => {
        if (range.trips.length === 0) return;
        const avgGeo = range.trips.reduce((sum, t) => sum + (t.summary?.geocodingAPICalls || 0), 0) / range.trips.length;
        const avgCached = range.trips.reduce((sum, t) => sum + (t.summary?.geocodingCached || 0), 0) / range.trips.length;

        console.log(`\n${range.name}: ${range.trips.length} viajes`);
        console.log(`   - Promedio geocoding:   ${avgGeo.toFixed(1)} llamadas`);
        console.log(`   - Promedio cached:      ${avgCached.toFixed(1)} llamadas`);
        console.log(`   - Eficiencia:           ${((avgCached / (avgGeo + avgCached)) * 100).toFixed(1)}%`);
    });

    // Timeline de uso
    console.log('\n\n📅 LÍNEA DE TIEMPO (Últimos 10 viajes)');
    console.log('-'.repeat(80));
    trips.slice(-10).forEach(trip => {
        const date = new Date(trip.startTime).toLocaleString('es-ES');
        const bar = '█'.repeat(Math.min(trip.summary?.geocodingAPICalls || 0, 40));
        console.log(`${date} | ${bar} ${trip.summary?.geocodingAPICalls} calls`);
        console.log(`   ${trip.origin} → ${trip.destination}`);
    });

    // Ahorro estimado
    console.log('\n\n💰 AHORRO ESTIMADO CON OPTIMIZACIÓN');
    console.log('-'.repeat(80));
    const estimatedWithoutCache = totalGeocoding + totalCached;
    const savedCalls = totalCached;
    const savedPercentage = ((savedCalls / estimatedWithoutCache) * 100).toFixed(1);

    console.log(`Sin optimización (estimado):    ${estimatedWithoutCache} llamadas`);
    console.log(`Con optimización (actual):      ${totalGeocoding} llamadas`);
    console.log(`Llamadas ahorradas:             ${savedCalls} ✅`);
    console.log(`Porcentaje de ahorro:           ${savedPercentage}%`);
    console.log(`\nEstimación de costo ahorrado:`);
    console.log(`   ($0.005 por 1000 requests después de cuota gratuita)`);
    console.log(`   Ahorro mensual (100 viajes):  ~$${((savedCalls / 1000) * 0.005 * 100 / totalTrips).toFixed(2)} USD`);

    // Generar CSV detallado
    const csvPath = join(logsDir, `informe-completo-${Date.now()}.csv`);
    let csv = 'fecha,origen,destino,distancia_km,dias,directions_calls,geocoding_calls,cached_calls,duracion_ms,eficiencia_cache\n';

    trips.forEach(trip => {
        const efficiency = trip.summary?.geocodingCached && trip.summary?.geocodingAPICalls
            ? ((trip.summary.geocodingCached / (trip.summary.geocodingAPICalls + trip.summary.geocodingCached)) * 100).toFixed(1)
            : '0';

        csv += [
            new Date(trip.startTime).toISOString(),
            `"${trip.origin}"`,
            `"${trip.destination}"`,
            trip.totalDistance || 0,
            trip.daysCount || 0,
            trip.summary?.directionsAPICalls || 0,
            trip.summary?.geocodingAPICalls || 0,
            trip.summary?.geocodingCached || 0,
            trip.summary?.totalDuration || 0,
            efficiency
        ].join(',') + '\n';
    });

    writeFileSync(csvPath, csv, 'utf-8');

    console.log('\n\n📄 ARCHIVOS GENERADOS');
    console.log('-'.repeat(80));
    console.log(`CSV detallado: ${csvPath}`);
    console.log(`JSON individual: ${files.length} archivos en ${logsDir}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ Informe completado\n');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    generateReport();
}

export { generateReport };
