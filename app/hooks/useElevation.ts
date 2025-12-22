import { useCallback, useRef, useState } from 'react';
import { Coordinates } from '../types';
import { getOrCreateClientId } from '../utils/client-id';

export type ElevationPoint = {
    // Cumulative distance along the sampled path (meters)
    distance: number;
    // Elevation at the sample (meters)
    elevation: number;
    // Optional raw metadata (useful for tooltips/metrics)
    lat?: number;
    lng?: number;
    resolution?: number;
};

type ElevationApiResult = {
    elevation?: number;
    location?: { lat?: number; lng?: number };
    resolution?: number;
};

export function useElevation(authToken?: string) {
    const [elevationData, setElevationData] = useState<ElevationPoint[] | null>(null);
    const [loadingElevation, setLoadingElevation] = useState(false);

    const requestSeq = useRef(0);

    const calculateElevation = useCallback((
        originLabel: string,
        originCoords: Coordinates | undefined,
        destinationCoords: Coordinates | undefined,
        expectedDistanceKm?: number
    ) => {
        if (!destinationCoords) {
            setElevationData(null);
            setLoadingElevation(false);
            return;
        }

        const requestId = ++requestSeq.current;
        setLoadingElevation(true);

        const cleanFrom = originLabel.split('|')[0]; // Limpiar nombre origen

        const haversineM = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
            const R = 6371e3;
            const toRad = (x: number) => (x * Math.PI) / 180;
            const dLat = toRad(b.lat - a.lat);
            const dLng = toRad(b.lng - a.lng);
            const lat1 = toRad(a.lat);
            const lat2 = toRad(b.lat);
            const s1 = Math.sin(dLat / 2);
            const s2 = Math.sin(dLng / 2);
            const aa = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
            const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
            return R * c;
        };

        void (async () => {
            try {
                const clientId = getOrCreateClientId();

                const directionsRes = await fetch('/api/google/directions', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        ...(clientId ? { 'x-caracola-client-id': clientId } : {}),
                        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
                    },
                    body: JSON.stringify({
                        origin: originCoords ? originCoords : cleanFrom,
                        destination: destinationCoords,
                        travelMode: 'driving',
                        language: 'es',
                    }),
                });

                if (requestId !== requestSeq.current) return;

                if (!directionsRes.ok) {
                    setLoadingElevation(false);
                    setElevationData(null);
                    return;
                }

                const directionsJson = await directionsRes.json();
                const polyline = typeof directionsJson?.overviewPolyline === 'string' ? directionsJson.overviewPolyline : null;
                if (!polyline) {
                    setLoadingElevation(false);
                    setElevationData(null);
                    return;
                }

                const elevationRes = await fetch('/api/google/elevation', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        ...(clientId ? { 'x-caracola-client-id': clientId } : {}),
                        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
                    },
                    body: JSON.stringify({ polyline, samples: 100 }),
                });

                if (requestId !== requestSeq.current) return;

                setLoadingElevation(false);
                if (!elevationRes.ok) {
                    setElevationData(null);
                    return;
                }

                const elevationJson = await elevationRes.json();
                const results: ElevationApiResult[] | null = Array.isArray(elevationJson?.results) ? (elevationJson.results as ElevationApiResult[]) : null;
                if (!results || results.length === 0) {
                    setElevationData(null);
                    return;
                }

                let cumulativeM = 0;
                const data: ElevationPoint[] = results.map((e: ElevationApiResult, i: number) => {
                    const loc = e.location;
                    const lat = typeof loc?.lat === 'number' ? loc.lat : undefined;
                    const lng = typeof loc?.lng === 'number' ? loc.lng : undefined;

                    const prev = i > 0 ? results[i - 1]?.location : null;
                    if (
                        i > 0 &&
                        prev &&
                        typeof prev.lat === 'number' &&
                        typeof prev.lng === 'number' &&
                        typeof lat === 'number' &&
                        typeof lng === 'number'
                    ) {
                        cumulativeM += haversineM({ lat: prev.lat, lng: prev.lng }, { lat, lng });
                    } else if (i > 0) {
                        cumulativeM += 1;
                    }

                    return {
                        distance: cumulativeM,
                        elevation: typeof e.elevation === 'number' ? e.elevation : 0,
                        lat,
                        lng,
                        resolution: typeof e.resolution === 'number' ? e.resolution : undefined,
                    };
                });

                const expectedM =
                    typeof expectedDistanceKm === 'number' && Number.isFinite(expectedDistanceKm) && expectedDistanceKm > 0
                        ? expectedDistanceKm * 1000
                        : null;
                const measuredM = data[data.length - 1]?.distance ?? 0;
                if (expectedM && measuredM > 0) {
                    const scale = expectedM / measuredM;
                    setElevationData(data.map((p) => ({ ...p, distance: p.distance * scale })));
                } else {
                    setElevationData(data);
                }
            } catch {
                if (requestId !== requestSeq.current) return;
                setLoadingElevation(false);
                setElevationData(null);
            }
        })();
    }, [authToken]);

    const clearElevation = useCallback(() => {
        requestSeq.current += 1; // invalidate in-flight requests
        setElevationData(null);
        setLoadingElevation(false);
    }, []);

    return { elevationData, loadingElevation, calculateElevation, clearElevation };
}