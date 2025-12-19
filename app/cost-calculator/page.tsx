'use client';

import { useMemo, useState } from 'react';

type TravelScenarioKey = 'economico' | 'estandar' | 'caro' | 'custom';

type TravelScenario = {
  key: TravelScenarioKey;
  label: string;
  days: number;
  stopsUntilDestination: number;
  callsPerStop: number;
  extraCallsPerStop: number;
  destinationCallsModel6: number;
  destinationCallsModel4: number;
};

type CostParamsUsd = {
  placesUsdPerRequest: number;
  geocodingUsdPerRequest: number;
  directionsBaseUsd: number;
  directionsPerWaypointUsd: number;
  placesAutocompleteUsdPerSession: number;
};

type ApiUsageParams = {
  // Directions
  directionsCallsPerTrip: number;
  waypointsForDirections: number;

  // Geocoding
  geocodingCallsPerTrip: number;

  // Places autocomplete (user typing)
  placesAutocompleteSessionsPerTrip: number;

  // Weather (free) - tracked only for completeness
  weatherCallsPerTrip: number;
};

type CacheParams = {
  // Applied to paid APIs where cache exists
  placesHitRateStartPct: number;
  placesHitRateEndPct: number;
  geocodingHitRateStartPct: number;
  geocodingHitRateEndPct: number;
};

type ModelVariant = 'compare' | 'model4' | 'model6';

type Breakdown = {
  places: { calls: number; paidCalls: number; costUsd: number };
  directions: { calls: number; paidCalls: number; costUsd: number };
  geocoding: { calls: number; paidCalls: number; costUsd: number };
  autocomplete: { calls: number; paidCalls: number; costUsd: number };
  weather: { calls: number; paidCalls: number; costUsd: number };
  totalUsd: number;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const toNum = (v: string, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const formatUsd = (n: number) => {
  if (!Number.isFinite(n)) return '$0.00';
  return `$${n.toFixed(n < 1 ? 4 : 2)}`;
};

function avgHitRateOverYearPct(startPct: number, endPct: number): number {
  // Year-average assuming linear improvement from month 1 to month 12.
  const s = clamp(startPct, 0, 100);
  const e = clamp(endPct, 0, 100);
  return (s + e) / 2;
}

function calcPaidCalls(totalCalls: number, hitRatePct: number): number {
  const hr = clamp(hitRatePct, 0, 100) / 100;
  return totalCalls * (1 - hr);
}

function calcTripPlacesCalls(s: TravelScenario, variant: Exclude<ModelVariant, 'compare'>): number {
  const destinationCalls = variant === 'model6' ? s.destinationCallsModel6 : s.destinationCallsModel4;
  return s.stopsUntilDestination * (s.callsPerStop + s.extraCallsPerStop) + destinationCalls;
}

function calcTripBreakdownUsd(args: {
  scenario: TravelScenario;
  costs: CostParamsUsd;
  usage: ApiUsageParams;
  cacheAvg: { placesHitRatePct: number; geocodingHitRatePct: number };
  variant: Exclude<ModelVariant, 'compare'>;
}): Breakdown {
  const { scenario, costs, usage, cacheAvg, variant } = args;

  const placesCalls = calcTripPlacesCalls(scenario, variant);
  const placesPaidCalls = calcPaidCalls(placesCalls, cacheAvg.placesHitRatePct);
  const placesCostUsd = placesPaidCalls * costs.placesUsdPerRequest;

  // Directions: we assume no cache. Cost per call depends on waypoints.
  const directionsCalls = clamp(usage.directionsCallsPerTrip, 0, 1000);
  const directionsPaidCalls = directionsCalls;
  const directionsCostPerCall = costs.directionsBaseUsd + costs.directionsPerWaypointUsd * clamp(usage.waypointsForDirections, 0, 1000);
  const directionsCostUsd = directionsPaidCalls * directionsCostPerCall;

  const geocodingCalls = clamp(usage.geocodingCallsPerTrip, 0, 10000);
  const geocodingPaidCalls = calcPaidCalls(geocodingCalls, cacheAvg.geocodingHitRatePct);
  const geocodingCostUsd = geocodingPaidCalls * costs.geocodingUsdPerRequest;

  const autocompleteCalls = clamp(usage.placesAutocompleteSessionsPerTrip, 0, 1000);
  const autocompletePaidCalls = autocompleteCalls;
  const autocompleteCostUsd = autocompletePaidCalls * costs.placesAutocompleteUsdPerSession;

  const weatherCalls = clamp(usage.weatherCallsPerTrip, 0, 10000);
  const weatherCostUsd = 0;

  const totalUsd = placesCostUsd + directionsCostUsd + geocodingCostUsd + autocompleteCostUsd + weatherCostUsd;

  return {
    places: { calls: placesCalls, paidCalls: placesPaidCalls, costUsd: placesCostUsd },
    directions: { calls: directionsCalls, paidCalls: directionsPaidCalls, costUsd: directionsCostUsd },
    geocoding: { calls: geocodingCalls, paidCalls: geocodingPaidCalls, costUsd: geocodingCostUsd },
    autocomplete: { calls: autocompleteCalls, paidCalls: autocompletePaidCalls, costUsd: autocompleteCostUsd },
    weather: { calls: weatherCalls, paidCalls: weatherCalls, costUsd: weatherCostUsd },
    totalUsd,
  };
}

const DEFAULT_SCENARIOS: Record<Exclude<TravelScenarioKey, 'custom'>, TravelScenario> = {
  economico: {
    key: 'economico',
    label: '1) Económico (7 días, 1 parada)',
    days: 7,
    stopsUntilDestination: 1,
    callsPerStop: 2,
    extraCallsPerStop: 1,
    destinationCallsModel6: 6,
    destinationCallsModel4: 4,
  },
  estandar: {
    key: 'estandar',
    label: '2) Estándar (15 días, 6 paradas)',
    days: 15,
    stopsUntilDestination: 6,
    callsPerStop: 2,
    extraCallsPerStop: 0,
    destinationCallsModel6: 6,
    destinationCallsModel4: 4,
  },
  caro: {
    key: 'caro',
    label: '3) Caro (30 días, 12 paradas)',
    days: 30,
    stopsUntilDestination: 12,
    callsPerStop: 2,
    extraCallsPerStop: 0,
    destinationCallsModel6: 6,
    destinationCallsModel4: 4,
  },
};

export default function CostCalculatorPage() {
  const [scenarioKey, setScenarioKey] = useState<TravelScenarioKey>('economico');
  const [variant, setVariant] = useState<ModelVariant>('compare');

  const [scenarioCustom, setScenarioCustom] = useState<TravelScenario>({
    key: 'custom',
    label: 'Custom',
    days: 15,
    stopsUntilDestination: 6,
    callsPerStop: 2,
    extraCallsPerStop: 0,
    destinationCallsModel6: 6,
    destinationCallsModel4: 4,
  });

  const [costs, setCosts] = useState<CostParamsUsd>({
    placesUsdPerRequest: 0.032,
    geocodingUsdPerRequest: 0.005,
    directionsBaseUsd: 0.005,
    directionsPerWaypointUsd: 0.005,
    placesAutocompleteUsdPerSession: 0.011,
  });

  const [usage, setUsage] = useState<ApiUsageParams>({
    directionsCallsPerTrip: 1,
    waypointsForDirections: DEFAULT_SCENARIOS.economico.stopsUntilDestination,
    geocodingCallsPerTrip: 12,
    placesAutocompleteSessionsPerTrip: 2,
    weatherCallsPerTrip: DEFAULT_SCENARIOS.economico.days,
  });

  const [cache, setCache] = useState<CacheParams>({
    placesHitRateStartPct: 0,
    placesHitRateEndPct: 60,
    geocodingHitRateStartPct: 30,
    geocodingHitRateEndPct: 80,
  });

  const selectedScenario: TravelScenario = useMemo(() => {
    if (scenarioKey === 'custom') return scenarioCustom;
    return DEFAULT_SCENARIOS[scenarioKey];
  }, [scenarioKey, scenarioCustom]);

  // Keep usage aligned when scenario changes (minimal + predictable)
  const derivedUsage = useMemo(() => {
    return {
      ...usage,
      waypointsForDirections: selectedScenario.stopsUntilDestination,
      weatherCallsPerTrip: selectedScenario.days,
    } satisfies ApiUsageParams;
  }, [usage, selectedScenario.days, selectedScenario.stopsUntilDestination]);

  const cacheAvg = useMemo(() => {
    return {
      placesHitRatePct: avgHitRateOverYearPct(cache.placesHitRateStartPct, cache.placesHitRateEndPct),
      geocodingHitRatePct: avgHitRateOverYearPct(cache.geocodingHitRateStartPct, cache.geocodingHitRateEndPct),
    };
  }, [cache]);

  const breakdownModel6 = useMemo(() => {
    return calcTripBreakdownUsd({ scenario: selectedScenario, costs, usage: derivedUsage, cacheAvg, variant: 'model6' });
  }, [selectedScenario, costs, derivedUsage, cacheAvg]);

  const breakdownModel4 = useMemo(() => {
    return calcTripBreakdownUsd({ scenario: selectedScenario, costs, usage: derivedUsage, cacheAvg, variant: 'model4' });
  }, [selectedScenario, costs, derivedUsage, cacheAvg]);

  const annualVolumes = [10_000, 30_000, 60_000] as const;

  const compareDeltaPerTrip = breakdownModel6.totalUsd - breakdownModel4.totalUsd;

  const modelToShow: Array<{ key: 'model4' | 'model6'; label: string; breakdown: Breakdown }> =
    variant === 'compare'
      ? [
          { key: 'model4', label: 'Modelo 4 llamadas', breakdown: breakdownModel4 },
          { key: 'model6', label: 'Modelo 6 llamadas', breakdown: breakdownModel6 },
        ]
      : variant === 'model4'
        ? [{ key: 'model4', label: 'Modelo 4 llamadas', breakdown: breakdownModel4 }]
        : [{ key: 'model6', label: 'Modelo 6 llamadas', breakdown: breakdownModel6 }];

  const onPickScenario = (key: TravelScenarioKey) => {
    setScenarioKey(key);
    if (key !== 'custom') {
      const s = DEFAULT_SCENARIOS[key as Exclude<TravelScenarioKey, 'custom'>];
      setUsage((u) => ({
        ...u,
        waypointsForDirections: s.stopsUntilDestination,
        weatherCallsPerTrip: s.days,
      }));
    }
  };

  const card = 'bg-white rounded-lg shadow p-5 border border-gray-100';
  const label = 'text-sm font-semibold text-gray-700';
  const input =
    'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className={card}>
          <h1 className="text-3xl font-bold text-gray-900">📈 Calculadora de costes (APIs) — Modelo 4 vs 6</h1>
          <p className="text-gray-700 mt-2">
            Esta página estima coste anual en USD combinando: Places Nearby (Places API New <code className="font-mono">searchNearby</code> / legacy Nearby), Directions,
            Geocoding y Places Autocomplete.
            Weather (Open-Meteo) se muestra pero es $0.
          </p>
          <p className="text-gray-700 mt-2">
            Caché: aplico un hit-rate medio anual (lineal) desde “inicio de año” a “fin de año”.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={card}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Escenario</h2>
              <select
                className={input}
                value={scenarioKey}
                onChange={(e) => onPickScenario(e.target.value as TravelScenarioKey)}
              >
                <option value="economico">{DEFAULT_SCENARIOS.economico.label}</option>
                <option value="estandar">{DEFAULT_SCENARIOS.estandar.label}</option>
                <option value="caro">{DEFAULT_SCENARIOS.caro.label}</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className={label}>Comparación / modelo</div>
                <select className={input} value={variant} onChange={(e) => setVariant(e.target.value as ModelVariant)}>
                  <option value="compare">Comparar 4 vs 6</option>
                  <option value="model4">Solo modelo 4</option>
                  <option value="model6">Solo modelo 6</option>
                </select>
              </div>

              {scenarioKey === 'custom' && (
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <div className={label}>Días</div>
                    <input
                      className={input}
                      value={String(scenarioCustom.days)}
                      onChange={(e) => setScenarioCustom((s) => ({ ...s, days: clamp(toNum(e.target.value, s.days), 1, 365) }))}
                    />
                  </div>
                  <div>
                    <div className={label}>Paradas hasta destino</div>
                    <input
                      className={input}
                      value={String(scenarioCustom.stopsUntilDestination)}
                      onChange={(e) =>
                        setScenarioCustom((s) => ({ ...s, stopsUntilDestination: clamp(toNum(e.target.value, s.stopsUntilDestination), 0, 200) }))
                      }
                    />
                  </div>
                  <div>
                    <div className={label}>Llamadas por parada (categorías)</div>
                    <input
                      className={input}
                      value={String(scenarioCustom.callsPerStop)}
                      onChange={(e) => setScenarioCustom((s) => ({ ...s, callsPerStop: clamp(toNum(e.target.value, s.callsPerStop), 0, 50) }))}
                    />
                  </div>
                  <div>
                    <div className={label}>Extra calls por parada</div>
                    <input
                      className={input}
                      value={String(scenarioCustom.extraCallsPerStop)}
                      onChange={(e) =>
                        setScenarioCustom((s) => ({ ...s, extraCallsPerStop: clamp(toNum(e.target.value, s.extraCallsPerStop), 0, 50) }))
                      }
                    />
                  </div>
                  <div>
                    <div className={label}>Destino (modelo 6) calls</div>
                    <input
                      className={input}
                      value={String(scenarioCustom.destinationCallsModel6)}
                      onChange={(e) =>
                        setScenarioCustom((s) => ({ ...s, destinationCallsModel6: clamp(toNum(e.target.value, s.destinationCallsModel6), 0, 100) }))
                      }
                    />
                  </div>
                  <div>
                    <div className={label}>Destino (modelo 4) calls</div>
                    <input
                      className={input}
                      value={String(scenarioCustom.destinationCallsModel4)}
                      onChange={(e) =>
                        setScenarioCustom((s) => ({ ...s, destinationCallsModel4: clamp(toNum(e.target.value, s.destinationCallsModel4), 0, 100) }))
                      }
                    />
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600 mt-2">
                Places calls por viaje = paradas × (callsPorParada + extras) + callsDestino.
              </div>
            </div>
          </div>

          <div className={card}>
            <h2 className="text-xl font-bold text-gray-900">Caché (hit-rate)</h2>
            <p className="text-sm text-gray-600 mt-1">Se usa promedio anual: (inicio + fin) / 2.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className={label}>Places hit-rate inicio %</div>
                <input
                  className={input}
                  value={String(cache.placesHitRateStartPct)}
                  onChange={(e) => setCache((c) => ({ ...c, placesHitRateStartPct: clamp(toNum(e.target.value, c.placesHitRateStartPct), 0, 100) }))}
                />
              </div>
              <div>
                <div className={label}>Places hit-rate fin %</div>
                <input
                  className={input}
                  value={String(cache.placesHitRateEndPct)}
                  onChange={(e) => setCache((c) => ({ ...c, placesHitRateEndPct: clamp(toNum(e.target.value, c.placesHitRateEndPct), 0, 100) }))}
                />
              </div>
              <div>
                <div className={label}>Geocoding hit-rate inicio %</div>
                <input
                  className={input}
                  value={String(cache.geocodingHitRateStartPct)}
                  onChange={(e) =>
                    setCache((c) => ({ ...c, geocodingHitRateStartPct: clamp(toNum(e.target.value, c.geocodingHitRateStartPct), 0, 100) }))
                  }
                />
              </div>
              <div>
                <div className={label}>Geocoding hit-rate fin %</div>
                <input
                  className={input}
                  value={String(cache.geocodingHitRateEndPct)}
                  onChange={(e) =>
                    setCache((c) => ({ ...c, geocodingHitRateEndPct: clamp(toNum(e.target.value, c.geocodingHitRateEndPct), 0, 100) }))
                  }
                />
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-700">
              <div>
                <span className="font-semibold">Places hit-rate medio anual:</span> {cacheAvg.placesHitRatePct.toFixed(1)}%
              </div>
              <div>
                <span className="font-semibold">Geocoding hit-rate medio anual:</span> {cacheAvg.geocodingHitRatePct.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className={card}>
            <h2 className="text-xl font-bold text-gray-900">Costes unitarios (USD)</h2>
            <p className="text-sm text-gray-600 mt-1">Defaults basados en documentación del repo y logger; ajustables.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className={label}>Places Nearby (API New / legacy) $/request</div>
                <input
                  className={input}
                  value={String(costs.placesUsdPerRequest)}
                  onChange={(e) => setCosts((c) => ({ ...c, placesUsdPerRequest: clamp(toNum(e.target.value, c.placesUsdPerRequest), 0, 10) }))}
                />
              </div>
              <div>
                <div className={label}>Geocoding $/request</div>
                <input
                  className={input}
                  value={String(costs.geocodingUsdPerRequest)}
                  onChange={(e) => setCosts((c) => ({ ...c, geocodingUsdPerRequest: clamp(toNum(e.target.value, c.geocodingUsdPerRequest), 0, 10) }))}
                />
              </div>
              <div>
                <div className={label}>Directions base $/request</div>
                <input
                  className={input}
                  value={String(costs.directionsBaseUsd)}
                  onChange={(e) => setCosts((c) => ({ ...c, directionsBaseUsd: clamp(toNum(e.target.value, c.directionsBaseUsd), 0, 10) }))}
                />
              </div>
              <div>
                <div className={label}>Directions $/waypoint</div>
                <input
                  className={input}
                  value={String(costs.directionsPerWaypointUsd)}
                  onChange={(e) => setCosts((c) => ({ ...c, directionsPerWaypointUsd: clamp(toNum(e.target.value, c.directionsPerWaypointUsd), 0, 10) }))}
                />
              </div>
              <div className="col-span-2">
                <div className={label}>Places Autocomplete $/sesión (sugerencias al escribir)</div>
                <input
                  className={input}
                  value={String(costs.placesAutocompleteUsdPerSession)}
                  onChange={(e) =>
                    setCosts((c) => ({ ...c, placesAutocompleteUsdPerSession: clamp(toNum(e.target.value, c.placesAutocompleteUsdPerSession), 0, 10) }))
                  }
                />
                <div className="mt-1 text-xs text-gray-500">
                  Una “sesión” suele corresponder a una interacción de autocompletado (teclear → elegir sugerencia). Ajusta el coste y cuántas sesiones hay por viaje.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={card}>
          <h2 className="text-xl font-bold text-gray-900">Uso de APIs por viaje (contadores)</h2>
          <p className="text-sm text-gray-600 mt-1">Esto es lo más sensible: ajusta para reflejar tu uso real.</p>

          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <div className={label}>Directions calls/viaje</div>
              <input
                className={input}
                value={String(usage.directionsCallsPerTrip)}
                onChange={(e) => setUsage((u) => ({ ...u, directionsCallsPerTrip: clamp(toNum(e.target.value, u.directionsCallsPerTrip), 0, 50) }))}
              />
            </div>
            <div>
              <div className={label}>Waypoints (auto)</div>
              <input className={input} value={String(derivedUsage.waypointsForDirections)} readOnly />
            </div>
            <div>
              <div className={label}>Geocoding calls/viaje</div>
              <input
                className={input}
                value={String(usage.geocodingCallsPerTrip)}
                onChange={(e) => setUsage((u) => ({ ...u, geocodingCallsPerTrip: clamp(toNum(e.target.value, u.geocodingCallsPerTrip), 0, 10000) }))}
              />
            </div>
            <div>
              <div className={label}>Autocomplete sesiones/viaje</div>
              <input
                className={input}
                value={String(usage.placesAutocompleteSessionsPerTrip)}
                onChange={(e) =>
                  setUsage((u) => ({ ...u, placesAutocompleteSessionsPerTrip: clamp(toNum(e.target.value, u.placesAutocompleteSessionsPerTrip), 0, 50) }))
                }
              />
            </div>
            <div>
              <div className={label}>Weather calls/viaje (gratis)</div>
              <input className={input} value={String(derivedUsage.weatherCallsPerTrip)} readOnly />
            </div>
          </div>
        </div>

        <div className={card}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900">Resultados</h2>
            {variant === 'compare' && (
              <div className="text-sm text-gray-800">
                <span className="font-semibold">Delta por viaje (6 - 4):</span> {formatUsd(compareDeltaPerTrip)}
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {modelToShow.map((m) => (
              <div key={m.key} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{m.label}</h3>
                  <div className="text-lg font-extrabold text-indigo-700">{formatUsd(m.breakdown.totalUsd)} / viaje</div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded border border-gray-200 bg-gray-50 p-3">
                    <div className="font-semibold text-gray-800">Places</div>
                    <div className="text-gray-700">calls: {m.breakdown.places.calls}</div>
                    <div className="text-gray-700">paid (esperado): {m.breakdown.places.paidCalls.toFixed(2)}</div>
                    <div className="text-gray-900 font-semibold">cost: {formatUsd(m.breakdown.places.costUsd)}</div>
                    <div className="text-xs text-gray-500 mt-1">(Nearby Search / API New searchNearby)</div>
                  </div>

                  <div className="rounded border border-gray-200 bg-gray-50 p-3">
                    <div className="font-semibold text-gray-800">Directions</div>
                    <div className="text-gray-700">calls: {m.breakdown.directions.calls}</div>
                    <div className="text-gray-700">cost/call: {formatUsd(costs.directionsBaseUsd + costs.directionsPerWaypointUsd * derivedUsage.waypointsForDirections)}</div>
                    <div className="text-gray-900 font-semibold">cost: {formatUsd(m.breakdown.directions.costUsd)}</div>
                  </div>

                  <div className="rounded border border-gray-200 bg-gray-50 p-3">
                    <div className="font-semibold text-gray-800">Geocoding</div>
                    <div className="text-gray-700">calls: {m.breakdown.geocoding.calls}</div>
                    <div className="text-gray-700">paid (esperado): {m.breakdown.geocoding.paidCalls.toFixed(2)}</div>
                    <div className="text-gray-900 font-semibold">cost: {formatUsd(m.breakdown.geocoding.costUsd)}</div>
                  </div>

                  <div className="rounded border border-gray-200 bg-gray-50 p-3">
                    <div className="font-semibold text-gray-800">Autocomplete</div>
                    <div className="text-gray-700">sesiones: {m.breakdown.autocomplete.calls}</div>
                    <div className="text-gray-900 font-semibold">cost: {formatUsd(m.breakdown.autocomplete.costUsd)}</div>
                  </div>

                  <div className="rounded border border-gray-200 bg-gray-50 p-3">
                    <div className="font-semibold text-gray-800">Weather</div>
                    <div className="text-gray-700">calls: {m.breakdown.weather.calls}</div>
                    <div className="text-gray-900 font-semibold">cost: {formatUsd(m.breakdown.weather.costUsd)}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-semibold text-gray-800 mb-2">Coste anual</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600">
                          <th className="py-2 pr-4">Viajes/año</th>
                          <th className="py-2 pr-4">Coste anual</th>
                          <th className="py-2 pr-4">Places</th>
                          <th className="py-2 pr-4">Directions</th>
                          <th className="py-2 pr-4">Geocoding</th>
                        </tr>
                      </thead>
                      <tbody>
                        {annualVolumes.map((v) => {
                          const total = m.breakdown.totalUsd * v;
                          const places = m.breakdown.places.costUsd * v;
                          const directions = m.breakdown.directions.costUsd * v;
                          const geocoding = m.breakdown.geocoding.costUsd * v;
                          return (
                            <tr key={v} className="border-t border-gray-200 text-gray-800">
                              <td className="py-2 pr-4 font-semibold">{v.toLocaleString('es-ES')}</td>
                              <td className="py-2 pr-4 font-bold text-indigo-700">{formatUsd(total)}</td>
                              <td className="py-2 pr-4">{formatUsd(places)}</td>
                              <td className="py-2 pr-4">{formatUsd(directions)}</td>
                              <td className="py-2 pr-4">{formatUsd(geocoding)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {variant === 'compare' && (
            <div className="mt-4 rounded border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
              <div className="font-semibold">Lectura rápida</div>
              <div className="mt-1">
                - Solo por Places, la diferencia “6 vs 4” sin caché es exactamente 2×{formatUsd(costs.placesUsdPerRequest)} = {formatUsd(2 * costs.placesUsdPerRequest)} por bloque.
              </div>
              <div>
                - Con caché, esa diferencia se multiplica por (1 - hitRatePlaces).
              </div>
            </div>
          )}
        </div>

        <div className={card}>
          <h2 className="text-xl font-bold text-gray-900">Supuestos y límites (importante)</h2>
          <div className="mt-2 text-sm text-gray-700 space-y-1">
            <div>
              - Esto es una <span className="font-semibold">estimación esperada</span>: pago esperado = calls × (1 - hitRate).
            </div>
            <div>
              - Places: uso $/request de Nearby Search (0.032 por defecto) como en docs del repo.
            </div>
            <div>
              - Directions y Autocomplete: su pricing real puede variar según SKU/plan; aquí se dejan editables.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
