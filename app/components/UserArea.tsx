'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface UserAreaProps {
    onLoadTrip: (tripData: any, tripId: number) => void;
}

export default function UserArea({ onLoadTrip }: UserAreaProps) {
    const [user, setUser] = useState<any>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Nuevo campo password
    const [loading, setLoading] = useState(false);
    const [showTrips, setShowTrips] = useState(false);
    const [myTrips, setMyTrips] = useState<any[]>([]);
    
    // Estado para cambiar entre modos (magic vs password)
    const [authMode, setAuthMode] = useState<'magic' | 'password' | 'register'>('magic');

    // Comprobar si ya estamos logueados al arrancar
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        checkUser();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user || null);
        });

        return () => { authListener.subscription.unsubscribe(); };
    }, []);

    // 1. Login con Magic Link (El de antes)
    const handleMagicLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: window.location.origin },
        });
        setLoading(false);
        if (error) alert('Error: ' + error.message);
        else alert('¡Enlace enviado! Revisa tu correo.');
    };

    // 2. Login con Contraseña (NUEVO)
    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        setLoading(false);
        if (error) alert('Error: ' + error.message);
        // Si no hay error, el usuario se actualiza solo por el useEffect
    };

    // 3. Registro con Contraseña (NUEVO)
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        setLoading(false);
        if (error) alert('Error: ' + error.message);
        else alert('¡Registro correcto! Revisa tu email para confirmar tu cuenta.');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setShowTrips(false);
    };

    const loadMyTrips = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error cargando viajes:", error);
        } else {
            setMyTrips(data || []);
            setShowTrips(true);
        }
        setLoading(false);
    };

    const handleDeleteTrip = async (id: number) => {
        if (!confirm("¿Seguro que quieres borrar este viaje de la nube?")) return;
        const { error } = await supabase.from('trips').delete().eq('id', id);
        if (!error) {
            setMyTrips(prev => prev.filter(t => t.id !== id));
        }
    };

    // --- RENDERIZADO: PANEL DE LOGIN ---
    if (!user) {
        return (
            <div className="flex flex-col items-end gap-2">
                {/* Selector de Modo */}
                <div className="flex gap-2 text-[10px] text-gray-500 mb-1">
                    <button onClick={() => setAuthMode('magic')} className={`hover:text-red-600 ${authMode === 'magic' ? 'font-bold text-red-600 underline' : ''}`}>Magic Link</button>
                    <span>|</span>
                    <button onClick={() => setAuthMode('password')} className={`hover:text-red-600 ${authMode === 'password' ? 'font-bold text-red-600 underline' : ''}`}>Contraseña</button>
                    <span>|</span>
                    <button onClick={() => setAuthMode('register')} className={`hover:text-red-600 ${authMode === 'register' ? 'font-bold text-red-600 underline' : ''}`}>Registrarse</button>
                </div>

                {/* Formulario Dinámico */}
                <form onSubmit={authMode === 'magic' ? handleMagicLogin : (authMode === 'password' ? handlePasswordLogin : handleSignUp)} className="flex flex-col md:flex-row gap-2 items-center bg-white p-2 rounded border border-gray-200 shadow-sm">
                    <input 
                        type="email" 
                        placeholder="Tu email..." 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="px-2 py-1 rounded border border-gray-300 text-xs w-32 focus:outline-none focus:border-red-500"
                        required
                    />
                    
                    {authMode !== 'magic' && (
                        <input 
                            type="password" 
                            placeholder="Contraseña..." 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="px-2 py-1 rounded border border-gray-300 text-xs w-24 focus:outline-none focus:border-red-500"
                            required
                            minLength={6}
                        />
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-gray-800 text-white px-3 py-1 rounded text-xs font-bold hover:bg-black disabled:opacity-50 whitespace-nowrap"
                    >
                        {loading ? '...' : (authMode === 'magic' ? 'Enviar Link' : (authMode === 'register' ? 'Crear Cuenta' : 'Entrar'))}
                    </button>
                </form>
            </div>
        );
    }

    // --- RENDERIZADO: USUARIO LOGUEADO ---
    return (
        <div className="flex items-center gap-3 relative">
            <div className="text-right hidden md:block">
                <p className="text-[10px] text-gray-500">Hola,</p>
                <p className="text-xs font-bold text-gray-800">{user.email}</p>
            </div>
            
            <button 
                onClick={() => showTrips ? setShowTrips(false) : loadMyTrips()}
                className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200 flex items-center gap-1"
            >
                📂 Mis Viajes
            </button>

            <button 
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 text-xs underline"
            >
                Salir
            </button>

            {showTrips && (
                <div className="absolute top-10 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fadeIn text-left">
                    <div className="bg-red-600 px-4 py-2 flex justify-between items-center">
                        <h3 className="text-white font-bold text-sm">📂 Archivo de Rutas</h3>
                        <button onClick={() => setShowTrips(false)} className="text-white hover:text-gray-200">✕</button>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2 bg-gray-50">
                        {loading ? (
                            <p className="text-center text-xs text-gray-400 py-4">Cargando biblioteca...</p>
                        ) : myTrips.length === 0 ? (
                            <p className="text-center text-xs text-gray-400 py-4">Aún no has guardado ningún viaje.</p>
                        ) : (
                            <div className="space-y-2">
                                {myTrips.map((trip) => (
                                    <div key={trip.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm hover:border-red-300 transition">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-xs font-bold text-gray-800 line-clamp-2">{trip.name || 'Viaje sin nombre'}</h4>
                                            <button onClick={() => handleDeleteTrip(trip.id)} className="text-gray-300 hover:text-red-500">🗑️</button>
                                        </div>
                                        <p className="text-[9px] text-gray-400 mb-2">{new Date(trip.created_at).toLocaleDateString()}</p>
                                        <button 
                                            onClick={() => { onLoadTrip(trip.trip_data, trip.id); setShowTrips(false); }}
                                            className="w-full bg-red-600 text-white py-1 rounded text-[10px] font-bold hover:bg-red-700"
                                        >
                                            📥 Cargar este viaje
                                        </button>
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