import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface APICallLog {
    timestamp: string;
    type: 'DIRECTIONS' | 'GEOCODING';
    endpoint: string;
    params: Record<string, any>;
    response?: any;
    cached?: boolean;
    error?: string;
    duration?: number;
}

interface TripLog {
    tripId: string;
    startTime: string;
    endTime?: string;
    origin: string;
    destination: string;
    waypoints?: string[];
    kmMaximo: number;
    totalDistance?: number;
    daysCount?: number;
    apiCalls: APICallLog[];
    summary?: {
        directionsAPICalls: number;
        geocodingAPICalls: number;
        geocodingCached: number;
        totalDuration: number;
    };
}

class APILogger {
    private currentTrip: TripLog | null = null;
    private logsDir = join(process.cwd(), 'logs', 'api-calls');

    constructor() {
        // Crear directorio de logs si no existe
        if (!existsSync(this.logsDir)) {
            mkdirSync(this.logsDir, { recursive: true });
        }
    }

    startTrip(origin: string, destination: string, kmMaximo: number, waypoints?: string[]): string {
        const tripId = `trip_${Date.now()}`;
        this.currentTrip = {
            tripId,
            startTime: new Date().toISOString(),
            origin,
            destination,
            waypoints,
            kmMaximo,
            apiCalls: []
        };
        return tripId;
    }

    logAPICall(call: Omit<APICallLog, 'timestamp'>) {
        if (!this.currentTrip) return;

        const logEntry: APICallLog = {
            ...call,
            timestamp: new Date().toISOString()
        };

        this.currentTrip.apiCalls.push(logEntry);
    }

    endTrip(totalDistance?: number, daysCount?: number) {
        if (!this.currentTrip) return;

        this.currentTrip.endTime = new Date().toISOString();
        this.currentTrip.totalDistance = totalDistance;
        this.currentTrip.daysCount = daysCount;

        // Calcular resumen
        const directionsAPICalls = this.currentTrip.apiCalls.filter(c => c.type === 'DIRECTIONS').length;
        const geocodingAPICalls = this.currentTrip.apiCalls.filter(c => c.type === 'GEOCODING' && !c.cached).length;
        const geocodingCached = this.currentTrip.apiCalls.filter(c => c.type === 'GEOCODING' && c.cached).length;
        const totalDuration = this.currentTrip.apiCalls.reduce((sum, c) => sum + (c.duration || 0), 0);

        this.currentTrip.summary = {
            directionsAPICalls,
            geocodingAPICalls,
            geocodingCached,
            totalDuration
        };

        // Guardar logs
        this.saveLogs();
    }

    private saveLogs() {
        if (!this.currentTrip) return;

        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const filename = `${this.currentTrip.tripId}_${timestamp}.json`;
        const filepath = join(this.logsDir, filename);

        // Guardar JSON detallado
        writeFileSync(filepath, JSON.stringify(this.currentTrip, null, 2), 'utf-8');

        // Agregar resumen al archivo consolidado
        const summaryFile = join(this.logsDir, 'summary.csv');
        const summaryLine = [
            this.currentTrip.tripId,
            this.currentTrip.startTime,
            this.currentTrip.origin,
            this.currentTrip.destination,
            this.currentTrip.totalDistance || 0,
            this.currentTrip.daysCount || 0,
            this.currentTrip.summary?.directionsAPICalls || 0,
            this.currentTrip.summary?.geocodingAPICalls || 0,
            this.currentTrip.summary?.geocodingCached || 0,
            this.currentTrip.summary?.totalDuration || 0
        ].join(',');

        // Crear header si no existe
        if (!existsSync(summaryFile)) {
            const header = 'tripId,timestamp,origin,destination,distance_km,days,directions_calls,geocoding_calls,geocoding_cached,duration_ms\n';
            writeFileSync(summaryFile, header, 'utf-8');
        }

        appendFileSync(summaryFile, summaryLine + '\n', 'utf-8');

        console.log(`📊 API logs guardados en: ${filepath}`);
        console.log(`📈 Resumen: ${this.currentTrip.summary?.geocodingAPICalls} geocoding calls (${this.currentTrip.summary?.geocodingCached} cached)`);
    }
}

// Singleton
export const apiLogger = new APILogger();
