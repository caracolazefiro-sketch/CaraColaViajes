import { useCallback, useRef, useState } from 'react';
import { Coordinates } from '../types';

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

export function useElevation() {
    const [elevationData, setElevationData] = useState<ElevationPoint[] | null>(null);
    const [loadingElevation, setLoadingElevation] = useState(false);

    const requestSeq = useRef(0);

    const calculateElevation = useCallback((
        originLabel: string,
        originCoords: Coordinates | undefined,
        destinationCoords: Coordinates | undefined,
        expectedDistanceKm?: number
    ) => {
        if (typeof google === 'undefined' || !destinationCoords) {
            setElevationData(null);
            setLoadingElevation(false);
            return;
        }

        const requestId = ++requestSeq.current;
        setLoadingElevation(true);

        const cleanFrom = originLabel.split('|')[0]; // Limpiar nombre origen
        const ds = new google.maps.DirectionsService();
        const dest = new google.maps.LatLng(destinationCoords.lat, destinationCoords.lng);
        const origin = originCoords
            ? new google.maps.LatLng(originCoords.lat, originCoords.lng)
            : cleanFrom;

        ds.route(
            {
                origin,
                destination: dest,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (requestId !== requestSeq.current) return;

                if (status === 'OK' && result) {
                    const path = result.routes[0].overview_path;
                    const es = new google.maps.ElevationService();

                    es.getElevationAlongPath({ path: path, samples: 100 }, (elevations, statusElev) => {
                        if (requestId !== requestSeq.current) return;

                        setLoadingElevation(false);
                        if (statusElev !== 'OK' || !elevations || elevations.length === 0) {
                            setElevationData(null);
                            return;
                        }

                        // Compute cumulative distance (meters) from sample locations.
                        // Requires Maps JS API `geometry` library.
                        let cumulativeM = 0;
                        const data: ElevationPoint[] = elevations.map((e, i) => {
                            const loc = e.location;
                            const prevLoc = i > 0 ? elevations[i - 1]?.location : null;
                            if (
                                i > 0 &&
                                loc &&
                                prevLoc &&
                                google.maps.geometry?.spherical?.computeDistanceBetween
                            ) {
                                cumulativeM += google.maps.geometry.spherical.computeDistanceBetween(
                                    prevLoc,
                                    loc
                                );
                            } else if (i > 0 && !google.maps.geometry?.spherical?.computeDistanceBetween) {
                                // Fallback: keep a monotonic x-axis even if geometry isn't available.
                                cumulativeM += 1;
                            }

                            return {
                                distance: cumulativeM,
                                elevation: e.elevation,
                                lat: loc?.lat?.(),
                                lng: loc?.lng?.(),
                                resolution: e.resolution,
                            };
                        });

                        // Align the x-axis to the itinerary distance to avoid small mismatches caused by
                        // overview_path simplification and sampling.
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
                    });
                } else {
                    setLoadingElevation(false);
                    setElevationData(null);
                }
            }
        );
    }, []);

    const clearElevation = useCallback(() => {
        requestSeq.current += 1; // invalidate in-flight requests
        setElevationData(null);
        setLoadingElevation(false);
    }, []);

    return { elevationData, loadingElevation, calculateElevation, clearElevation };
}