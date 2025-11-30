'use client';

import React from 'react';
import UserArea from './UserArea';

interface AppHeaderProps {
    onLoadTrip: (data: any, id: number) => void;
}

export default function AppHeader({ onLoadTrip }: AppHeaderProps) {
    return (
        <div className="relative mb-4 no-print w-full bg-white shadow-sm border-b border-gray-100 py-2">
            <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
                
                {/* 1. LOGO */}
                <div className="flex items-center gap-3">
                    <img src="/logo.jpg" alt="CaraCola Viajes" className="h-10 w-auto object-contain" />
                    <div>
                        <h1 className="text-lg font-bold text-red-600 leading-tight tracking-tight">CaraCola Viajes</h1>
                        <p className="text-gray-400 text-[10px] font-medium tracking-wider">Tu ruta en autocaravana</p>
                    </div>
                </div>

                {/* 2. ZONA USUARIO (Login / Mis Viajes) */}
                <UserArea onLoadTrip={onLoadTrip} />
            </div>
        </div>
    );
}