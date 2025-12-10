/**
 * 🔍 API LOGGER - Tracking de todas las llamadas a APIs
 * Propósito: Registrar exactamente qué llamadas se hacen, cuándo, qué devuelven y coste
 * 
 * Uso:
 *   - Server: apiLogger.logDirections(...)
 *   - Client: apiLogger.logWeather(...) en hooks
 *   - Análisis: apiLogger.getReport() en consola
 */

interface APICall {
  id: string;
  timestamp: string;
  api: 'google-directions' | 'google-geocoding' | 'open-meteo' | 'google-places' | 'google-embed';
  method: 'GET' | 'POST';
  url?: string;
  requestSize?: number;
  requestData?: Record<string, any>;
  responseSize?: number;
  responseData?: Record<string, any>;
  duration?: number; // ms
  status?: string;
  cost?: number; // En €
  cached?: boolean;
  notes?: string;
}

interface APISession {
  sessionId: string;
  startTime: string;
  trips: Array<{
    tripId: string;
    startTime: string;
    endTime?: string;
    origin: string;
    destination: string;
    waypoints: number;
    calls: APICall[];
    totalCost: number;
    cacheHits: number;
  }>;
}

class APILogger {
  private session: APISession;
  private currentTrip: APISession['trips'][0] | null = null;
  private storageKey = 'api-logger-session-v1';

  constructor() {
    // Intentar recuperar sesión anterior
    const stored = this.getFromStorage();
    if (stored && this.isSessionRecent(stored)) {
      this.session = stored;
    } else {
      this.session = this.createNewSession();
    }
  }

  private createNewSession(): APISession {
    return {
      sessionId: `session-${Date.now()}`,
      startTime: new Date().toISOString(),
      trips: []
    };
  }

  private isSessionRecent(session: APISession): boolean {
    const sessionAge = Date.now() - new Date(session.startTime).getTime();
    return sessionAge < 24 * 60 * 60 * 1000; // 24 horas
  }

  private getFromStorage(): APISession | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.session));
    } catch (e) {
      console.warn('Failed to save API logger to localStorage:', e);
    }
  }

  /**
   * Iniciar tracking de un nuevo viaje
   */
  startTrip(origin: string, destination: string, waypoints: string[]) {
    this.currentTrip = {
      tripId: `trip-${Date.now()}`,
      startTime: new Date().toISOString(),
      origin,
      destination,
      waypoints: waypoints.length,
      calls: [],
      totalCost: 0,
      cacheHits: 0
    };
    this.session.trips.push(this.currentTrip);
    this.saveToStorage();
    return this.currentTrip.tripId;
  }

  /**
   * Finalizar tracking de viaje actual
   */
  endTrip() {
    if (this.currentTrip) {
      this.currentTrip.endTime = new Date().toISOString();
      this.currentTrip.totalCost = this.currentTrip.calls.reduce((sum, c) => sum + (c.cost || 0), 0);
      this.currentTrip.cacheHits = this.currentTrip.calls.filter(c => c.cached).length;
      this.saveToStorage();
    }
    this.currentTrip = null;
  }

  /**
   * Log de Google Directions API
   */
  logDirections(request: {
    origin: string;
    destination: string;
    waypoints: string[];
  }, response: any, duration: number) {
    const call: APICall = {
      id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      api: 'google-directions',
      method: 'GET',
      url: `https://maps.googleapis.com/maps/api/directions/json?origin=${request.origin}&destination=${request.destination}&waypoints=${request.waypoints.join('|')}`,
      requestData: request,
      requestSize: JSON.stringify(request).length,
      responseSize: JSON.stringify(response).length,
      responseData: {
        status: response.status,
        routesCount: response.routes?.length || 0,
        legsCount: response.routes?.[0]?.legs?.length || 0,
        totalDistance: response.routes?.[0]?.legs?.reduce((sum: number, leg: any) => sum + leg.distance.value, 0)
      },
      duration,
      status: response.status,
      cost: 0.005 + (0.005 * request.waypoints.length),
      cached: false,
      notes: `1 llamada por viaje. Waypoints: ${request.waypoints.length}`
    };

    if (this.currentTrip) {
      this.currentTrip.calls.push(call);
    }
    this.saveToStorage();
    return call;
  }

  /**
   * Log de Google Reverse Geocoding API
   */
  logGeocoding(request: { lat: number; lng: number }, response: any, duration: number, cached: boolean = false) {
    const call: APICall = {
      id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      api: 'google-geocoding',
      method: 'GET',
      url: `https://maps.googleapis.com/maps/api/geocode/json?latlng=${request.lat},${request.lng}`,
      requestData: { ...request },
      requestSize: JSON.stringify(request).length,
      responseSize: JSON.stringify(response).length,
      responseData: {
        status: response.status,
        resultsCount: response.results?.length || 0,
        cityName: response.results?.[0]?.address_components?.find((c: any) => c.types.includes('locality'))?.long_name || 'N/A'
      },
      duration,
      status: response.status,
      cost: cached ? 0 : 0.005,
      cached,
      notes: cached ? '✅ CACHE HIT - Sin coste' : '❌ CACHE MISS - Llamada a API'
    };

    if (this.currentTrip) {
      this.currentTrip.calls.push(call);
      if (cached) this.currentTrip.cacheHits++;
    }
    this.saveToStorage();
    return call;
  }

  /**
   * Log de Open-Meteo Weather API
   */
  logWeather(request: { lat: number; lng: number; date: string }, response: any, duration: number) {
    const call: APICall = {
      id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      api: 'open-meteo',
      method: 'GET',
      url: `https://api.open-meteo.com/v1/forecast?latitude=${request.lat}&longitude=${request.lng}&daily=...&start_date=${request.date}`,
      requestData: request,
      requestSize: JSON.stringify(request).length,
      responseSize: JSON.stringify(response).length,
      responseData: {
        latitude: response.latitude,
        longitude: response.longitude,
        daily: response.daily ? {
          weatherCode: response.daily.weather_code?.[0],
          tempMax: response.daily.temperature_2m_max?.[0],
          tempMin: response.daily.temperature_2m_min?.[0],
          rainProb: response.daily.precipitation_probability_max?.[0],
          windSpeed: response.daily.wind_speed_10m_max?.[0]
        } : null
      },
      duration,
      status: response.latitude ? 'OK' : 'FAIL',
      cost: 0, // ✅ Completamente gratis
      cached: false,
      notes: '✅ GRATIS - Sin límite de requests'
    };

    if (this.currentTrip) {
      this.currentTrip.calls.push(call);
    }
    this.saveToStorage();
    return call;
  }

  /**
   * Log de Google Places Autocomplete
   */
  logPlaces(request: { query: string }, response: any, duration: number) {
    const call: APICall = {
      id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      api: 'google-places',
      method: 'GET',
      url: `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${request.query}`,
      requestData: request,
      requestSize: JSON.stringify(request).length,
      responseSize: JSON.stringify(response).length,
      responseData: {
        predictionsCount: response.predictions?.length || 0,
        predictions: response.predictions?.slice(0, 3).map((p: any) => p.description)
      },
      duration,
      status: response.status || 'OK',
      cost: 0.011, // €0.011 por sesión (aproximado)
      cached: false,
      notes: 'Google Places Autocomplete'
    };

    if (this.currentTrip) {
      this.currentTrip.calls.push(call);
    }
    this.saveToStorage();
    return call;
  }

  /**
   * Obtener reporte formateado
   */
  getReport() {
    return {
      sessionId: this.session.sessionId,
      startTime: this.session.startTime,
      totalTrips: this.session.trips.length,
      trips: this.session.trips.map(trip => ({
        tripId: trip.tripId,
        origin: trip.origin,
        destination: trip.destination,
        waypoints: trip.waypoints,
        duration: trip.endTime ? `${(new Date(trip.endTime).getTime() - new Date(trip.startTime).getTime()) / 1000}s` : 'ongoing',
        callsCount: trip.calls.length,
        cacheHits: trip.cacheHits,
        totalCost: `€${trip.totalCost.toFixed(3)}`,
        callsByAPI: this.getCallsByAPI(trip.calls),
        calls: trip.calls
      })),
      grandTotal: {
        allCalls: this.session.trips.reduce((sum, t) => sum + t.calls.length, 0),
        totalCost: `€${this.session.trips.reduce((sum, t) => sum + t.totalCost, 0).toFixed(3)}`,
        cacheHitRate: `${this.getCacheHitRate().toFixed(1)}%`
      }
    };
  }

  /**
   * Contar llamadas por API
   */
  private getCallsByAPI(calls: APICall[]) {
    const counts: Record<string, number> = {};
    calls.forEach(call => {
      counts[call.api] = (counts[call.api] || 0) + 1;
    });
    return counts;
  }

  /**
   * Calcular tasa de cache hits
   */
  private getCacheHitRate(): number {
    const allCalls = this.session.trips.flatMap(t => t.calls);
    if (allCalls.length === 0) return 0;
    const hits = allCalls.filter(c => c.cached).length;
    return (hits / allCalls.length) * 100;
  }

  /**
   * Exportar como JSON para análisis externo
   */
  exportJSON() {
    return JSON.stringify(this.session, null, 2);
  }

  /**
   * Limpiar logs
   */
  clear() {
    this.session = this.createNewSession();
    this.currentTrip = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Imprimir reporte en consola (bonito)
   */
  printReport() {
    const report = this.getReport();
    console.log('%c🔍 API LOGGER REPORT', 'font-size: 16px; font-weight: bold; color: #2563eb;');
    console.log(`Session: ${report.sessionId}`);
    console.log(`Trips: ${report.totalTrips}`);
    console.log(`Total Calls: ${report.grandTotal.allCalls}`);
    console.log(`Total Cost: ${report.grandTotal.totalCost}`);
    console.log(`Cache Hit Rate: ${report.grandTotal.cacheHitRate}`);
    console.log('\n%c📊 Trips:', 'font-weight: bold; color: #16a34a;');
    console.table(report.trips.map(t => ({
      Trip: t.tripId.slice(0, 8),
      From: t.origin,
      To: t.destination,
      Waypoints: t.waypoints,
      Calls: t.callsCount,
      'Cache Hits': t.cacheHits,
      Cost: t.totalCost
    })));
    console.log('\n%c🔗 All Calls:', 'font-weight: bold; color: #dc2626;');
    console.table(report.trips.flatMap(t => t.calls).map(c => ({
      API: c.api,
      Status: c.status,
      Duration: `${c.duration}ms`,
      Cost: `€${c.cost?.toFixed(3)}`,
      Cached: c.cached ? '✅' : '❌',
      Notes: c.notes
    })));
  }
}

// Singleton
export const apiLogger = new APILogger();
