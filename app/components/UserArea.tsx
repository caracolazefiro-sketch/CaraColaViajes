'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { TripResult } from '../types';

// Iconos
const IconBug = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>);
const IconTrash = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);

// ✅ INTERFAZ ACTUALIZADA CON t
interface TripData {
    formData: Record<string, string | number | boolean>;
    results: {
        totalDays: number | null;
        distanceKm: number | null;
        totalCost: number | null;
        liters?: number | null;
        dailyItinerary: TripResult['dailyItinerary'];
        error: string | null;
    };
}

interface UserAreaProps {
    onLoadTrip: (tripData: TripData, tripId: number) => void;
    currentTripId: number | null;
    onOpenDashboard?: () => void;
    t: (key: string) => string;
    variant?: 'landing' | 'header';
}

export default function UserArea({ t, onLoadTrip, variant = 'header' }: UserAreaProps) {
    interface AppUser { id: string; email?: string }
    const [user, setUser] = useState<AppUser | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTrips, setShowTrips] = useState(false);
    const [myTrips, setMyTrips] = useState<Array<{ id: number; name: string; created_at: string; trip_data: TripData }>>([]);
    const [authMode, setAuthMode] = useState<'magic' | 'password' | 'register'>('magic');

    const isSupabaseEnabled = Boolean(supabase);

    useEffect(() => {
        if (!isSupabaseEnabled || !supabase) return;
        const supabaseClient = supabase; // TypeScript now knows this is not null
        const checkUser = async () => {
            const { data: { session } } = await supabaseClient.auth.getSession();
            setUser(session?.user || null);
        };
        checkUser();
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
            setUser(session?.user || null);
        });
        return () => subscription?.unsubscribe();
    }, [isSupabaseEnabled]);

    // If Supabase is not configured, don't render the auth UI
    if (!isSupabaseEnabled) {
        return null;
    }

    const handleMagicLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        const client = supabase;
        setLoading(true);
        const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
        setLoading(false);
        if (error) alert('Error: ' + error.message);
        else alert(t('ALERT_LINK_SENT'));
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        const client = supabase;
        setLoading(true);
        const { error } = await client.auth.signInWithPassword({ email, password });
        setLoading(false); if (error) alert('Error: ' + error.message);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        const client = supabase;
        setLoading(true);
        const { error } = await client.auth.signUp({ email, password });
        setLoading(false);
        if (error) alert('Error: ' + error.message);
        else alert(t('ALERT_REGISTRATION_SUCCESS'));
    };

    const handleLogout = async () => { if (!supabase) return; const client = supabase; await client.auth.signOut(); setShowTrips(false); };

    const loadMyTrips = async () => {
        if (!user || !supabase) return;
        const client = supabase;
        setLoading(true);
        const { data, error } = await client.from('trips').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (!error) { setMyTrips(data || []); setShowTrips(true); } setLoading(false);
    };

    const handleDeleteTrip = async (id: number) => {
        if (!confirm(t('CONFIRM_DELETE_TRIP')) || !supabase) return;
        const client = supabase;
        const { error } = await client.from('trips').delete().eq('id', id);
        if (!error) setMyTrips(prev => prev.filter(t => t.id !== id));
    };

    const handleCopyDebugData = (e: React.MouseEvent, trip: { trip_data: TripData; created_at: string; name: string; id: number }) => {
        e.stopPropagation();
        const debugData = JSON.stringify(trip.trip_data, null, 2);
        navigator.clipboard.writeText(debugData)
            .then(() => alert(t('ALERT_DEBUG_COPIED')))
            .catch(err => console.error("Error al copiar:", err));
    };

    if (!user) {
        const isLanding = variant === 'landing';
        return (
            <div className={isLanding ? 'flex flex-col items-end gap-1' : 'grid grid-cols-[auto_1fr] items-center gap-2 min-w-0'}>

                {/* selector modo */}
                {isLanding ? (
                    <div className="flex gap-2 text-[10px] text-gray-500 mb-1 whitespace-nowrap">
                        <button onClick={() => setAuthMode('magic')} className={`hover:text-red-600 ${authMode === 'magic' ? 'font-bold text-red-600 underline' : ''}`}>{t('AUTH_MAGIC_LINK')}</button>
                        <span>|</span>
                        <button onClick={() => setAuthMode('password')} className={`hover:text-red-600 ${authMode === 'password' ? 'font-bold text-red-600 underline' : ''}`}>{t('AUTH_PASSWORD')}</button>
                        <span>|</span>
                        <button onClick={() => setAuthMode('register')} className={`hover:text-red-600 ${authMode === 'register' ? 'font-bold text-red-600 underline' : ''}`}>{t('AUTH_REGISTER')}</button>
                    </div>
                ) : (
                    <div className="flex flex-col items-start gap-1 text-[10px] text-gray-500 whitespace-nowrap leading-none">
                        <button onClick={() => setAuthMode('magic')} className={`hover:text-red-600 text-left ${authMode === 'magic' ? 'font-bold text-red-600 underline' : ''}`}>{t('AUTH_MAGIC_LINK')}</button>
                        <button onClick={() => setAuthMode('password')} className={`hover:text-red-600 text-left ${authMode === 'password' ? 'font-bold text-red-600 underline' : ''}`}>{t('AUTH_PASSWORD')}</button>
                        <button onClick={() => setAuthMode('register')} className={`hover:text-red-600 text-left ${authMode === 'register' ? 'font-bold text-red-600 underline' : ''}`}>{t('AUTH_REGISTER')}</button>
                    </div>
                )}

                {/* formulario */}
                <form
                    onSubmit={authMode === 'magic' ? handleMagicLogin : (authMode === 'password' ? handlePasswordLogin : handleSignUp)}
                    className={
                        isLanding
                            ? 'flex items-center gap-2 flex-nowrap bg-white p-2 rounded border border-gray-200 shadow-sm'
                            : 'flex items-center gap-2 flex-nowrap bg-white p-2 rounded border border-gray-200 shadow-sm min-w-0'
                    }
                >
                    <input
                        type="email"
                        placeholder={t('AUTH_EMAIL_PLACEHOLDER')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={
                            isLanding
                                ? 'px-2 py-1 rounded border border-gray-300 text-xs w-44 focus:outline-none focus:border-red-500'
                                : 'px-2 py-1 rounded border border-gray-300 text-[11px] w-40 focus:outline-none focus:border-red-500 min-w-0'
                        }
                        required
                    />
                    {authMode !== 'magic' && (
                        <input
                            type="password"
                            placeholder={t('AUTH_PASSWORD_PLACEHOLDER')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={
                                isLanding
                                    ? 'px-2 py-1 rounded border border-gray-300 text-xs w-32 focus:outline-none focus:border-red-500'
                                    : 'px-2 py-1 rounded border border-gray-300 text-[11px] w-28 focus:outline-none focus:border-red-500 min-w-0'
                            }
                            required
                            minLength={6}
                        />
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className={
                            isLanding
                                ? 'bg-gray-800 text-white px-3 py-1 rounded text-xs font-bold hover:bg-black disabled:opacity-50 whitespace-nowrap'
                                : 'bg-gray-800 text-white px-2.5 py-1 rounded text-[11px] font-bold hover:bg-black disabled:opacity-50 whitespace-nowrap'
                        }
                    >
                        {loading ? '...' : (authMode === 'magic' ? t('AUTH_SEND_LINK') : (authMode === 'register' ? t('AUTH_CREATE_ACCOUNT') : t('AUTH_LOGIN')))}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 relative">
            <div className="text-right hidden md:block">
                <p className="text-[10px] text-gray-500">{t('HEADER_GREETING')}</p>
                <p className="text-xs font-bold text-gray-800">{user.email}</p>
            </div>
            <button onClick={() => showTrips ? setShowTrips(false) : loadMyTrips()} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200 flex items-center gap-1">
                {t('HEADER_MY_TRIPS')}
            </button>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 text-xs underline">{t('HEADER_LOGOUT')}</button>

            {showTrips && (
                <div className="absolute top-10 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fadeIn text-left">
                    <div className="bg-red-600 px-4 py-2 flex justify-between items-center"><h3 className="text-white font-bold text-sm">{t('HEADER_ARCHIVE_TITLE')}</h3><button onClick={() => setShowTrips(false)} className="text-white hover:text-gray-200">✕</button></div>
                    <div className="max-h-60 overflow-y-auto p-2 bg-gray-50">
                        {loading ? <p className="text-center text-xs text-gray-400 py-4">{t('LOADING_LIBRARY')}</p> : myTrips.length === 0 ? <p className="text-center text-xs text-gray-400 py-4">{t('NO_TRIPS_SAVED')}</p> : (
                            <div className="space-y-2">
                                {myTrips.map((trip) => (
                                    <div key={trip.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm hover:border-red-300 transition group">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-xs font-bold text-gray-800 line-clamp-2 flex-1">{trip.name || t('TRIP_UNNAMED')}</h4>
                                            <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => handleCopyDebugData(e, trip)} className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50" title={t('ACTION_COPY_DEBUG')}><IconBug /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteTrip(trip.id); }} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50" title={t('ACTION_DELETE_TRIP')}><IconTrash /></button>
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-gray-400 mb-2">{new Date(trip.created_at).toLocaleDateString()}</p>
                                        <button onClick={() => { onLoadTrip(trip.trip_data, trip.id); setShowTrips(false); }} className="w-full bg-red-600 text-white py-1 rounded text-[10px] font-bold hover:bg-red-700">📥 {t('ACTION_LOAD_TRIP')}</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}