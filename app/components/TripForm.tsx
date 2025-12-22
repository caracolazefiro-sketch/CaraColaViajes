'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TripResult } from '../types';
import { IconTruck } from '../lib/svgIcons';
import TripActionButtons from './TripActionButtons';
import { getOrCreateClientId } from '../utils/client-id';
import { emitCenteredNotice } from '../utils/centered-notice';

type AutocompletePrediction = { description: string; place_id?: string };

function useServerAutocomplete(params: { enabled: boolean; authToken?: string }) {
    const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]);
    const [open, setOpen] = useState(false);
    const [loadingAutocomplete, setLoadingAutocomplete] = useState(false);
    const seq = useRef(0);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const close = useCallback(() => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
        closeTimer.current = setTimeout(() => setOpen(false), 120);
    }, []);

    const keepOpen = useCallback(() => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
        setOpen(true);
    }, []);

    const clear = useCallback(() => {
        seq.current += 1;
        setSuggestions([]);
        setLoadingAutocomplete(false);
        setOpen(false);
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }
    }, []);

    const onInputChange = useCallback((rawValue: string) => {
        if (!params.enabled) {
            clear();
            return;
        }

        const q = String(rawValue || '').trim();
        if (q.length < 3) {
            clear();
            return;
        }

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }

        const requestId = ++seq.current;
        setLoadingAutocomplete(true);

        debounceTimer.current = setTimeout(() => {
            const clientId = getOrCreateClientId();

            fetch(`/api/google/places-autocomplete?input=${encodeURIComponent(q)}&language=es`, {
                method: 'GET',
                headers: {
                    ...(clientId ? { 'x-caracola-client-id': clientId } : {}),
                    ...(params.authToken ? { authorization: `Bearer ${params.authToken}` } : {}),
                },
            })
                .then(async (res) => {
                    const json = await res.json().catch(() => null);
                    return { ok: res.ok, json };
                })
                .then(({ ok, json }) => {
                    if (requestId !== seq.current) return;
                    setLoadingAutocomplete(false);
                    if (!ok) {
                        setSuggestions([]);
                        return;
                    }
                    const preds: unknown[] = Array.isArray(json?.predictions) ? (json.predictions as unknown[]) : [];
                    const mapped: AutocompletePrediction[] = preds
                        .map((p: unknown): AutocompletePrediction | null => {
                            if (!p || typeof p !== 'object') return null;
                            const r = p as Record<string, unknown>;
                            const description = typeof r.description === 'string' ? r.description : '';
                            const place_id = typeof r.place_id === 'string' ? r.place_id : undefined;
                            if (!description.trim()) return null;
                            return place_id ? { description, place_id } : { description };
                        })
                        .filter((p): p is AutocompletePrediction => Boolean(p));
                    setSuggestions(mapped.slice(0, 8));
                    setOpen(true);
                })
                .catch(() => {
                    if (requestId !== seq.current) return;
                    setLoadingAutocomplete(false);
                    setSuggestions([]);
                });
        }, 240);
    }, [clear, params.authToken, params.enabled]);

    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }
            if (closeTimer.current) {
                clearTimeout(closeTimer.current);
                closeTimer.current = null;
            }
        };
    }, []);

    return { suggestions, open, loadingAutocomplete, close, keepOpen, setOpen, clear, onInputChange };
}

// Iconos
const IconSearchLoc = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
const IconPlusCircle = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const IconTrash = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const IconEdit = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>);
const IconChevronUp = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>);

// Iconos Stats
const IconCalendar = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const IconMap = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>);
const IconWallet = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);


interface FormData {
    tripName: string;
    fechaInicio: string;
    fechaRegreso: string;
    origen: string;
    destino: string;
    etapas: string;
    precioGasoil: number;
    consumo: number;
    kmMaximoDia: number;
    evitarPeajes: boolean;
    vueltaACasa: boolean;
}

interface TripFormProps {
    formData: FormData;
    setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
    loading: boolean;
    results: TripResult;
    onSubmit: (e: React.FormEvent) => void;
    showWaypoints: boolean;
    setShowWaypoints: (show: boolean) => void;
    // Props de Acciones
    auditMode: boolean;
    setAuditMode: (v: boolean) => void;
    isSaving: boolean;
    onSave: () => void;
    onShare: () => void;
    onReset: () => void;
    currentTripId: number | null;
    t: (key: string) => string; // Traducción
    convert: (value: number, unit: 'km' | 'liter' | 'currency' | 'kph') => number; // Conversión
    isExpanded?: boolean;
    setIsExpanded?: (expanded: boolean) => void;
    renderCollapsedSummary?: boolean;
    trialMode?: boolean;
    authToken?: string;
}

export default function TripForm({
    formData, setFormData, loading, results, onSubmit, showWaypoints, setShowWaypoints,
    auditMode, setAuditMode, isSaving, onSave, onShare, onReset, currentTripId,
    t, convert,
    isExpanded: isExpandedProp,
    setIsExpanded: setIsExpandedProp,
    renderCollapsedSummary = true,
    trialMode,
    authToken,
}: TripFormProps) {

    const trialTooltip = t('TRIAL_TOOLTIP_LOGIN');

    const [internalExpanded, setInternalExpanded] = useState(true);
    const isExpanded = isExpandedProp ?? internalExpanded;
    const setIsExpanded = setIsExpandedProp ?? setInternalExpanded;
    const [tempStop, setTempStop] = useState('');

    const canUseAutocomplete = Boolean(!trialMode && authToken);

    const originAuto = useServerAutocomplete({ enabled: canUseAutocomplete, authToken });
    const destinationAuto = useServerAutocomplete({ enabled: canUseAutocomplete, authToken });
    const waypointAuto = useServerAutocomplete({ enabled: canUseAutocomplete, authToken });

    // Auto-colapsar cuando se completen los resultados (solo en modo NO controlado)
    useEffect(() => {
        if (isExpandedProp !== undefined) return;
        if (!loading && results.totalDays !== null) {
            const t = window.setTimeout(() => setIsExpanded(false), 0);
            return () => window.clearTimeout(t);
        }
    }, [isExpandedProp, loading, results.totalDays, setIsExpanded]);

    const currentStops = formData.etapas ? formData.etapas.split('|').filter((s: string) => s.trim().length > 0) : [];
    const isAddWaypointBlocked = Boolean(trialMode && currentStops.length >= 2);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type, checked } = e.target;
        const finalValue: string | number | boolean = type === 'checkbox'
            ? checked
            : (['precioGasoil', 'consumo', 'kmMaximoDia'].includes(id) ? parseFloat(value) : value);

        // NO normalizar al guardar - solo guardar valores tal como vienen
        // La normalización se hace solo cuando se envía a Google Directions

        setFormData({ ...formData, [id]: finalValue } as FormData);
    };

    const handleToggleWaypoints = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setShowWaypoints(isChecked);
        if (!isChecked) setFormData({ ...formData, etapas: '' });
    };

    const handleManualGeocode = async (field: 'origen' | 'destino') => {
        if (trialMode) return;
        const value = formData[field];
        if (!value) return;

        try {
            const clientId = getOrCreateClientId();
            const res = await fetch('/api/google/geocode-address', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    ...(clientId ? { 'x-caracola-client-id': clientId } : {}),
                    ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
                },
                body: JSON.stringify({ query: value, language: 'es' }),
            });

            if (!res.ok) {
                alert(`❌ ${t('LOCATION_NOT_FOUND')}`);
                return;
            }

            const json = await res.json();
            const formatted = json?.ok ? json?.result?.formatted_address : null;
            if (typeof formatted === 'string' && formatted.trim()) {
                const cleanAddress = formatted.trim();
                setFormData((prev: FormData) => ({ ...prev, [field]: cleanAddress }));
                alert(`✅ ${t('LOCATION_VALIDATED')}:\n"${cleanAddress}"`);
            } else {
                alert(`❌ ${t('LOCATION_NOT_FOUND')}`);
            }
        } catch {
            alert(`❌ ${t('LOCATION_NOT_FOUND')}`);
        }
    };

    const addWaypoint = () => {
        if (!tempStop) return;
        if (trialMode && currentStops.length >= 2) return;
        console.log(`➕ Agregando waypoint:`, tempStop);
        const newStops = [...currentStops, tempStop];
        setFormData({ ...formData, etapas: newStops.join('|') });
        setTempStop('');
    };

    const removeWaypoint = (indexToRemove: number) => {
        const newStops = currentStops.filter((_: string, index: number) => index !== indexToRemove);
        setFormData({ ...formData, etapas: newStops.join('|') });
    };

    // --- CÁLCULOS PARA RENDERIZADO BILINGÜE ---
    const unitKm = convert(1, 'km') === 1 ? 'km' : 'mi';
    const unitLiter = convert(1, 'liter') === 1 ? 'L' : 'gal';
    const unitCurrency = convert(1, 'currency') === 1 ? '€' : '$';

    // Calcular distancia total sumando días del itinerario (igual que ItineraryPanel para consistencia)
    const totalDistance = results.dailyItinerary?.reduce((sum, day) => sum + day.distance, 0) || results.distanceKm || 0;
    const displayKm = totalDistance ? convert(totalDistance, 'km').toFixed(0) : '0';
    const displayCost = results.totalCost ? convert(results.totalCost, 'currency').toFixed(0) : '0';
    const displayDays = results.totalDays || '0';

    // Rango de KM MÁXIMO (Ajustado a la conversión)
    const maxKmValue = formData.kmMaximoDia ? convert(formData.kmMaximoDia, 'km').toFixed(0) : '400';
    const maxRangeValue = convert(1000, 'km').toFixed(0);
    const minRangeValue = convert(100, 'km').toFixed(0);

    // --- MODO RESUMEN (DASHBOARD ULTRA-COMPACTO) ---
    if (!isExpanded && results.totalDays) {
        if (!renderCollapsedSummary) return null;
        const displayTripName = formData.tripName || `${formData.origen?.split(',')[0] || 'Origen'} → ${formData.destino?.split(',')[0] || 'Destino'}`;

        return (
            <div
                className="bg-white rounded-xl shadow-md border border-gray-200 no-print cursor-pointer hover:shadow-lg hover:border-red-300 transition-all duration-300 flex flex-col md:flex-row items-center justify-between p-2 gap-2 md:gap-4"
                onClick={() => setIsExpanded(true)}
            >
                {/* 1. NOMBRE DEL VIAJE / RUTA (Izquierda) */}
                <div className="flex items-center gap-2 overflow-hidden w-full md:w-auto px-2">
                    <IconTruck size={18} className="text-red-600 flex-shrink-0" />
                    <div className="flex flex-col overflow-hidden">
                        <div className="text-sm text-gray-800 font-bold truncate">
                            {displayTripName}
                        </div>
                        {formData.tripName && (
                            <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                <span>{formData.origen?.split(',')[0] || 'Origen'}</span>
                                <span className="text-gray-400">➝</span>
                                <span>{formData.destino?.split(',')[0] || 'Destino'}</span>
                            </div>
                        )}
                    </div>
                    {formData.vueltaACasa && <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">{t('FORM_ROUND_TRIP_SHORT')}</span>}
                </div>

                {/* 2. DATOS (Centro - Integrados) */}
                <div className="flex items-center gap-3 md:gap-6 bg-gray-50 rounded-lg px-3 py-1.5 w-full md:w-auto justify-center">
                    <div className="flex items-center gap-1" title={t('STATS_DAYS_LONG')}>
                        <IconCalendar />
                        <span className="text-xs font-bold text-gray-700">{displayDays} <span className="font-normal text-gray-500">{t('STATS_DAYS')}</span></span>
                    </div>
                    <div className="w-px h-3 bg-gray-300"></div>
                    <div className="flex items-center gap-1" title={t('STATS_KM_LONG')}>
                        <IconMap />
                        <span className="text-xs font-bold text-gray-700">{displayKm} <span className="font-normal text-gray-500">{unitKm}</span></span>
                    </div>
                    <div className="w-px h-3 bg-gray-300 hidden sm:block"></div>
                    <div className="flex items-center gap-1 hidden sm:flex" title={t('STATS_COST_LONG')}>
                        <IconWallet />
                        <span className="text-xs font-bold text-green-600">{displayCost} {unitCurrency}</span>
                    </div>
                </div>

                {/* 3. ACCIONES + EDITAR (Derecha) */}
                <div className="hidden md:flex items-center gap-2">
                    <TripActionButtons auditMode={auditMode} setAuditMode={setAuditMode} results={results} currentTripId={currentTripId} isSaving={isSaving} onSave={onSave} onShare={onShare} onReset={onReset} t={t} trialMode={trialMode} />
                    <div className="w-px h-6 bg-gray-200"></div>
                    <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                        <span>{t('DASHBOARD_EDIT')}</span>
                        <IconEdit />
                    </div>
                </div>
            </div>
        );
    }

    // --- MODO EDICIÓN (FORMULARIO COMPLETO) ---
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-red-100 no-print transition-all duration-500 ease-in-out">
            <div className="bg-gray-100 px-4 py-2 flex justify-between items-center border-b border-gray-200 cursor-pointer hover:bg-gray-200" onClick={() => setIsExpanded(false)}>
                <h2 className="text-gray-600 font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                    {t('FORM_TITLE')}
                </h2>
                <div className="flex items-center gap-4">
                    <TripActionButtons auditMode={auditMode} setAuditMode={setAuditMode} results={results} currentTripId={currentTripId} isSaving={isSaving} onSave={onSave} onShare={onShare} onReset={onReset} t={t} trialMode={trialMode} />
                    {results.totalDays && <IconChevronUp />}
                </div>
            </div>

            <form onSubmit={onSubmit} className="p-5 text-sm">
                {/* NOMBRE DEL VIAJE */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('FORM_TRIP_NAME')}</label>
                    <input
                        type="text"
                        id="tripName"
                        value={formData.tripName ?? ''}
                        onChange={handleChange}
                        placeholder={`${formData.origen?.split(',')[0] || 'Origen'} → ${formData.destino?.split(',')[0] || 'Destino'} ${formData.fechaInicio ? `(${new Date(formData.fechaInicio).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })})` : ''}`}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-2 focus:ring-red-500 outline-none text-base font-semibold text-gray-800 placeholder:text-gray-400 placeholder:font-normal"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">💡 Dale un nombre memorable a tu viaje (opcional)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* FECHAS */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('FORM_START_DATE')}</label>
                        <input type="date" id="fechaInicio" value={formData.fechaInicio ?? ''} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none" required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('FORM_END_DATE')}</label>
                        <input type="date" id="fechaRegreso" value={formData.fechaRegreso ?? ''} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none" />
                    </div>

                    {/* ORIGEN */}
                    <div className="space-y-1 relative">
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('FORM_ORIGIN')}</label>
                        <div className="flex gap-1">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    id="origen"
                                    value={formData.origen ?? ''}
                                    onChange={(e) => {
                                        handleChange(e);
                                        originAuto.onInputChange(e.target.value);
                                    }}
                                    onFocus={() => {
                                        if (!canUseAutocomplete) {
                                            if (trialMode) emitCenteredNotice(trialTooltip);
                                            return;
                                        }
                                        originAuto.keepOpen();
                                    }}
                                    onBlur={originAuto.close}
                                    placeholder={t('FORM_CITY_PLACEHOLDER')}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none placeholder-gray-400"
                                    required
                                />
                                {originAuto.open && originAuto.suggestions.length > 0 && (
                                    <div className="absolute z-40 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                                        {originAuto.suggestions.map((p, idx) => (
                                            <button
                                                key={`${p.place_id || p.description}-${idx}`}
                                                type="button"
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    setFormData((prev: FormData) => ({ ...prev, origen: p.description }));
                                                    originAuto.setOpen(false);
                                                    originAuto.clear();
                                                }}
                                            >
                                                {p.description}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button type="button" onClick={() => { if (trialMode) { emitCenteredNotice(trialTooltip); return; } handleManualGeocode('origen'); }} className="bg-gray-100 border border-gray-300 text-gray-600 px-3 rounded hover:bg-gray-200" title={trialMode ? undefined : t('FORM_VALIDATE')}><IconSearchLoc /></button>
                        </div>
                    </div>

                    {/* DESTINO */}
                    <div className="space-y-1 relative">
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('FORM_DESTINATION')}</label>
                        <div className="flex gap-1">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    id="destino"
                                    value={formData.destino ?? ''}
                                    onChange={(e) => {
                                        handleChange(e);
                                        destinationAuto.onInputChange(e.target.value);
                                    }}
                                    onFocus={() => {
                                        if (!canUseAutocomplete) {
                                            if (trialMode) emitCenteredNotice(trialTooltip);
                                            return;
                                        }
                                        destinationAuto.keepOpen();
                                    }}
                                    onBlur={destinationAuto.close}
                                    placeholder={t('FORM_CABO_NORTE_PLACEHOLDER')}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-red-500 outline-none placeholder-gray-400"
                                    required
                                />
                                {destinationAuto.open && destinationAuto.suggestions.length > 0 && (
                                    <div className="absolute z-40 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                                        {destinationAuto.suggestions.map((p, idx) => (
                                            <button
                                                key={`${p.place_id || p.description}-${idx}`}
                                                type="button"
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    setFormData((prev: FormData) => ({ ...prev, destino: p.description }));
                                                    destinationAuto.setOpen(false);
                                                    destinationAuto.clear();
                                                }}
                                            >
                                                {p.description}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button type="button" onClick={() => { if (trialMode) { emitCenteredNotice(trialTooltip); return; } handleManualGeocode('destino'); }} className="bg-gray-100 border border-gray-300 text-gray-600 px-3 rounded hover:bg-gray-200" title={trialMode ? undefined : t('FORM_VALIDATE')}><IconSearchLoc /></button>
                        </div>
                    </div>

                    {/* CHECKBOXES */}
                    <div className="md:col-span-2 lg:col-span-4 bg-red-50 p-3 rounded border border-red-100 flex flex-col md:flex-row gap-6 items-center">
                        <label className="flex items-center gap-2 cursor-pointer text-red-800 font-bold text-xs select-none">
                            <input type="checkbox" className="text-red-600 rounded focus:ring-red-500" checked={showWaypoints} onChange={handleToggleWaypoints} />
                            {t('FORM_WAYPOINTS_TITLE')}
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-red-800 font-bold text-xs select-none border-l pl-6 border-red-200">
                            <input type="checkbox" id="vueltaACasa" checked={formData.vueltaACasa || false} onChange={handleChange} className="text-red-600 rounded focus:ring-red-500" />
                            {t('FORM_ROUND_TRIP')}
                        </label>
                    </div>

                    {/* ZONA DE PARADAS (CHIPS) */}
                    {showWaypoints && (
                        <div className="md:col-span-2 lg:col-span-4 -mt-2 space-y-3 p-3 bg-gray-50 rounded border border-gray-200">
                            <div className="flex gap-2 items-center">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={tempStop}
                                        onChange={(e) => {
                                            setTempStop(e.target.value);
                                            waypointAuto.onInputChange(e.target.value);
                                        }}
                                        onFocus={() => {
                                            if (!canUseAutocomplete) {
                                                if (trialMode) emitCenteredNotice(trialTooltip);
                                                return;
                                            }
                                            waypointAuto.keepOpen();
                                        }}
                                        onBlur={waypointAuto.close}
                                        placeholder={t('FORM_WAYPOINT_SEARCH_PLACEHOLDER')}
                                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500 shadow-sm"
                                    />
                                    {waypointAuto.open && waypointAuto.suggestions.length > 0 && (
                                        <div className="absolute z-40 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                                            {waypointAuto.suggestions.map((p, idx) => (
                                                <button
                                                    key={`${p.place_id || p.description}-${idx}`}
                                                    type="button"
                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => {
                                                        setTempStop(p.description);
                                                        waypointAuto.setOpen(false);
                                                        waypointAuto.clear();
                                                    }}
                                                >
                                                    {p.description}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button type="button" onClick={() => { if (isAddWaypointBlocked) { emitCenteredNotice(trialTooltip); return; } addWaypoint(); }} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-700 flex items-center gap-1 shadow-sm" title={isAddWaypointBlocked ? undefined : t('MAP_ADD')}>
                                    <IconPlusCircle /> {t('MAP_ADD')}
                                </button>
                            </div>

                            {currentStops.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {currentStops.map((stop: string, index: number) => (
                                        <div key={index} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-full text-xs shadow-sm animate-fadeIn">
                                            <span className="font-medium">📍 {stop}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeWaypoint(index)}
                                                className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-full p-0.5 transition-colors"
                                            >
                                                <IconTrash />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[10px] text-gray-400 italic text-center">{t('FORM_NO_WAYPOINTS')}</p>
                            )}
                        </div>
                    )}

                    {/* SLIDERS Y BOTÓN FINAL */}
                    <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center"><label className="text-xs font-bold text-gray-700">{t('FORM_DAILY_RHYTHM')}</label><span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded">{maxKmValue} {unitKm}</span></div>
                            <input type="range" id="kmMaximoDia" min={minRangeValue} max={maxRangeValue} step={unitKm === 'mi' ? 30 : 50} value={formData.kmMaximoDia} onChange={handleChange} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center"><label className="text-xs font-bold text-gray-700">{t('FORM_FUEL_CONSUMPTION')}</label><span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded">{formData.consumo} {unitLiter}/100{unitKm}</span></div>
                            <input type="range" id="consumo" min="5" max="25" step="0.1" value={formData.consumo} onChange={handleChange} className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-600" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center"><label className="text-xs font-bold text-gray-700">{t('FORM_FUEL_PRICE')}</label><span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded">{formData.precioGasoil} {unitCurrency}/{unitLiter}</span></div>
                            <input type="range" id="precioGasoil" min="1.00" max="2.50" step="0.01" value={formData.precioGasoil} onChange={handleChange} className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-green-600" />
                        </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col md:flex-row items-center gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-600 font-bold text-xs bg-gray-50 px-4 py-3 rounded border border-gray-200 w-full md:w-auto justify-center h-full">
                            <input type="checkbox" id="evitarPeajes" checked={formData.evitarPeajes} onChange={handleChange} className="text-red-600 rounded focus:ring-red-500" />
                            {t('FORM_NO_TOLLS')}
                        </label>
                        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded font-bold text-sm hover:from-red-700 hover:shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50">
                            {loading ? t('FORM_LOADING') : t('FORM_CALCULATE')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
