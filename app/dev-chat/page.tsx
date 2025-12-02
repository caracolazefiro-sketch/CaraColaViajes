'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../supabase';
import type { RealtimeChannel, User } from '@supabase/supabase-js';

interface DevMessage {
    id: string;
    user_email: string;
    user_name: string | null;
    message: string;
    file_url: string | null;
    file_name: string | null;
    created_at: string;
}

export default function DevChatPage() {
    const [messages, setMessages] = useState<DevMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const checkUser = async () => {
            if (!supabase) {
                setLoading(false);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                loadMessages();
                subscribeToMessages();
            }
            setLoading(false);
        };

        checkUser();

        return () => {
            if (channelRef.current) {
                supabase?.removeChannel(channelRef.current);
            }
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        if (!supabase) return;

        try {
            const { data, error } = await supabase
                .from('dev_messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(100);

            if (error) {
                console.error('Error loading messages:', error);
            } else {
                setMessages(data || []);
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const subscribeToMessages = () => {
        if (!supabase) return;

        const channel = supabase
            .channel('dev_messages_channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'dev_messages'
                },
                (payload) => {
                    const newMsg = payload.new as DevMessage;
                    setMessages((current) => [...current, newMsg]);
                }
            )
            .subscribe();

        channelRef.current = channel;
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newMessage.trim() || !user || !supabase) return;

        setSending(true);
        try {
            const { error } = await supabase
                .from('dev_messages')
                .insert({
                    user_id: user.id,
                    user_email: user.email,
                    user_name: user.user_metadata?.name || user.email?.split('@')[0],
                    message: newMessage.trim()
                });

            if (error) {
                console.error('Error sending message:', error);
                alert('Error al enviar mensaje');
            } else {
                setNewMessage('');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error de conexión');
        } finally {
            setSending(false);
        }
    };

    const getUserColor = (email: string) => {
        const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-orange-500',
            'bg-teal-500',
            'bg-indigo-500',
            'bg-red-500'
        ];
        return colors[hash % colors.length];
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'ahora';
        if (diffMins < 60) return `hace ${diffMins}m`;
        if (diffMins < 1440) return `hace ${Math.floor(diffMins / 60)}h`;
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Cargando chat...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">💬 Chat de Desarrollo</h1>
                    <p className="text-gray-300 mb-6">
                        Necesitas iniciar sesión para acceder al chat del equipo.
                    </p>
                    <Link 
                        href="/"
                        className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    if (!supabase) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">⚙️ Supabase no configurado</h1>
                    <p className="text-gray-300">
                        El chat requiere configuración de Supabase.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4 shadow-lg">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            💬 Chat de Desarrollo
                        </h1>
                        <p className="text-sm text-gray-400">
                            Comunicación interna del equipo
                        </p>
                    </div>
                    <Link 
                        href="/"
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                    >
                        ← Volver
                    </Link>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg mb-2">📭 No hay mensajes aún</p>
                            <p className="text-sm">Sé el primero en escribir</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.user_email === user.email;
                            return (
                                <div 
                                    key={msg.id} 
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            {!isMe && (
                                                <div className={`w-8 h-8 rounded-full ${getUserColor(msg.user_email)} flex items-center justify-center text-white text-sm font-bold`}>
                                                    {(msg.user_name || msg.user_email)[0].toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-xs text-gray-400">
                                                {isMe ? 'Tú' : (msg.user_name || msg.user_email.split('@')[0])}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatTime(msg.created_at)}
                                            </span>
                                        </div>
                                        <div className={`rounded-lg p-3 ${
                                            isMe 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-gray-800 text-gray-100'
                                        }`}>
                                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                            {msg.file_url && (
                                                <a 
                                                    href={msg.file_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-xs underline mt-2 block"
                                                >
                                                    📎 {msg.file_name || 'Archivo adjunto'}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
                <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escribe un mensaje..."
                            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                            disabled={sending}
                        />
                        <button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {sending ? '⏳ Enviando...' : '📤 Enviar'}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        💡 Tip: Este chat es en tiempo real - los mensajes aparecen automáticamente
                    </p>
                </form>
            </div>
        </div>
    );
}
