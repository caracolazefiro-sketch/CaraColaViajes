'use client';

import React from 'react';

// Iconos locales
const IconCalendar = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const IconMap = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>);
const IconFuel = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>);
const IconWallet = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);

interface TripStatsProps {
    days: number | null;
    distance: number | null;
    cost: number | null;
    liters: number | null;
}

export default function TripStats({ days, distance, cost, liters }: TripStatsProps) {
    if (days === null) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
            <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-gray-100">
                <div className="p-2 bg-red-50 rounded-full"><IconCalendar /></div>
                <div><p className="text-xl font-extrabold text-gray-800">{days}</p><p className="text-[10px] text-gray-500 font-bold uppercase">Días</p></div>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-gray-100">
                <div className="p-2 bg-blue-50 rounded-full"><IconMap /></div>
                <div><p className="text-xl font-extrabold text-gray-800">{distance?.toFixed(0)}</p><p className="text-[10px] text-gray-500 font-bold uppercase">Km</p></div>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-gray-100">
                <div className="p-2 bg-purple-50 rounded-full"><IconFuel /></div>
                <div><p className="text-xl font-extrabold text-gray-800">{liters?.toFixed(0)}</p><p className="text-[10px] text-gray-500 font-bold uppercase">Litros</p></div>
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3 border border-gray-100">
                <div className="p-2 bg-green-50 rounded-full"><IconWallet /></div>
                <div><p className="text-xl font-extrabold text-green-600">{cost?.toFixed(0)} €</p><p className="text-[10px] text-gray-500 font-bold uppercase">Coste</p></div>
            </div>
        </div>
    );
}