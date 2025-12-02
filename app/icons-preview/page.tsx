'use client';

import { useState } from 'react';

// ESTILO 1: LUCIDE (Outline moderno)
const LucideIcons = {
    camping: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4v16"/>
            <path d="M2 8h18a2 2 0 0 1 2 2v10"/>
            <path d="M2 17h20"/>
            <path d="M6 8v9"/>
        </svg>
    ),
    water: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
    ),
    gas: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2h10v14H3z"/>
            <path d="M7 21v-7"/>
            <path d="M17 6h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-2"/>
            <path d="M17 10h3"/>
        </svg>
    ),
    restaurant: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
            <path d="M7 2v20"/>
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
        </svg>
    ),
    supermarket: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1"/>
            <circle cx="19" cy="21" r="1"/>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
        </svg>
    ),
    laundry: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h3"/>
            <path d="M17 6h.01"/>
            <rect width="18" height="20" x="3" y="2" rx="2"/>
            <circle cx="12" cy="13" r="5"/>
        </svg>
    ),
    tourism: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
            <circle cx="12" cy="13" r="3"/>
        </svg>
    ),
    custom: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
    ),
};

// ESTILO 2: HEROICONS (Solid)
const HeroiconsSolid = {
    camping: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.546 3.75 3.75 0 0 1 3.255 3.718Z" clipRule="evenodd"/>
        </svg>
    ),
    water: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path fillRule="evenodd" d="M10.5 3.798v5.02a3 3 0 0 1-.879 2.121l-2.377 2.377a9.845 9.845 0 0 1 5.091 1.013 8.315 8.315 0 0 0 5.713.636l.285-.071-3.954-3.955a3 3 0 0 1-.879-2.121v-5.02a23.614 23.614 0 0 0-3 0Zm4.5.138a.75.75 0 0 0 .093-1.495A24.837 24.837 0 0 0 12 2.25a25.048 25.048 0 0 0-3.093.191A.75.75 0 0 0 9 3.936v4.882a1.5 1.5 0 0 1-.44 1.06l-6.293 6.294c-1.62 1.621-.903 4.475 1.471 4.88 2.686.229 5.384.23 8.07.001 2.375-.405 3.092-3.259 1.472-4.88l-6.293-6.294A1.5 1.5 0 0 1 6.547 8.818V3.936Z" clipRule="evenodd"/>
        </svg>
    ),
    gas: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M4.08 5.227A3 3 0 0 1 6.979 3H17.02a3 3 0 0 1 2.9 2.227l2.113 7.926A5.228 5.228 0 0 0 18.75 12H5.25a5.228 5.228 0 0 0-3.284 1.153L4.08 5.227Z"/>
            <path fillRule="evenodd" d="M5.25 13.5a3.75 3.75 0 1 0 0 7.5h13.5a3.75 3.75 0 1 0 0-7.5H5.25Zm.75 3.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm12.75.75a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Z" clipRule="evenodd"/>
        </svg>
    ),
    restaurant: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M11.644 1.59a.75.75 0 0 1 .712 0l9.75 5.25a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.712 0l-9.75-5.25a.75.75 0 0 1 0-1.32l9.75-5.25Z"/>
            <path d="m3.265 10.602 7.668 4.129a2.25 2.25 0 0 0 2.134 0l7.668-4.13 1.37.739a.75.75 0 0 1 0 1.32l-9.75 5.25a.75.75 0 0 1-.71 0l-9.75-5.25a.75.75 0 0 1 0-1.32l1.37-.738Z"/>
            <path d="m10.933 19.231-7.668-4.13-1.37.739a.75.75 0 0 0 0 1.32l9.75 5.25c.221.12.489.12.71 0l9.75-5.25a.75.75 0 0 0 0-1.32l-1.37-.738-7.668 4.13a2.25 2.25 0 0 1-2.134-.001Z"/>
        </svg>
    ),
    supermarket: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 15h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"/>
        </svg>
    ),
    laundry: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM6.262 6.072a8.25 8.25 0 1 0 10.562-.766 4.5 4.5 0 0 1-1.318 1.357L14.25 7.5l.165.33a.809.809 0 0 1-1.086 1.085l-.604-.302a1.125 1.125 0 0 0-1.298.21l-.132.131c-.439.44-.439 1.152 0 1.591l.296.296c.256.257.622.374.98.314l1.17-.195c.323-.054.654.036.905.245l1.33 1.108c.32.267.46.694.358 1.1a8.7 8.7 0 0 1-2.288 4.04l-.723.724a1.125 1.125 0 0 1-1.298.21l-.153-.076a1.125 1.125 0 0 1-.622-1.006v-1.089c0-.298-.119-.585-.33-.796l-1.347-1.347a1.125 1.125 0 0 1-.21-1.298L9.75 12l-1.64-1.64a6 6 0 0 1-1.676-3.257l-.172-1.03Z" clipRule="evenodd"/>
        </svg>
    ),
    tourism: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z"/>
            <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd"/>
        </svg>
    ),
    custom: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd"/>
        </svg>
    ),
};

// ESTILO 3: CUSTOM TRAVEL (Temático más ilustrativo)
const CustomTravel = {
    camping: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 20H4V18L12 4L20 18V20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <rect x="10" y="14" width="4" height="6" stroke="currentColor" strokeWidth="2"/>
            <circle cx="8" cy="17" r="0.5" fill="currentColor"/>
            <circle cx="16" cy="17" r="0.5" fill="currentColor"/>
        </svg>
    ),
    water: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C12 2 6 8 6 13C6 16.31 8.69 19 12 19C15.31 19 18 16.31 18 13C18 8 12 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 21V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    ),
    gas: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4H14V16H4V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 20V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M14 7H17C17.5523 7 18 7.44772 18 8V16C18 16.5523 17.5523 17 17 17H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 10H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="17" cy="13.5" r="0.5" fill="currentColor"/>
            <path d="M7 20H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    ),
    restaurant: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 3V8C5 9.1 5.9 10 7 10H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 3V10C17 10 17 10 17 10V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 10C17 7.79 15.21 6 13 6C10.79 6 9 7.79 9 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="5" cy="3" r="0.5" fill="currentColor"/>
            <circle cx="7" cy="3" r="0.5" fill="currentColor"/>
            <circle cx="9" cy="3" r="0.5" fill="currentColor"/>
        </svg>
    ),
    supermarket: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 2H4L6.4 14.4C6.6 15.4 7.5 16 8.5 16H19.5C20.5 16 21.4 15.4 21.6 14.4L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="20" r="1" stroke="currentColor" strokeWidth="2"/>
            <circle cx="19" cy="20" r="1" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 9H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    ),
    laundry: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M7 5H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="17" cy="5" r="0.5" fill="currentColor"/>
            <circle cx="12" cy="13" r="5" stroke="currentColor" strokeWidth="2"/>
            <path d="M9.5 13C9.5 13 10.5 15 12 15C13.5 15 14.5 13 14.5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    ),
    tourism: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 8L13.5 4H10.5L9 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="14" r="3" stroke="currentColor" strokeWidth="2"/>
            <circle cx="17" cy="10.5" r="0.5" fill="currentColor"/>
            <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    ),
    custom: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.5 9H22L16 14L18.5 21L12 16L5.5 21L8 14L2 9H9.5L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>
    ),
};

// ESTILO 4: EMOJI-INSPIRED (Colorido y amigable)
const EmojiInspired = {
    camping: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 20H4V18L12 4L20 18V20Z" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5"/>
            <rect x="10" y="14" width="4" height="6" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1"/>
            <circle cx="8" cy="17" r="1" fill="#EAB308"/>
            <circle cx="16" cy="17" r="1" fill="#EAB308"/>
        </svg>
    ),
    water: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C12 2 6 8 6 13C6 16.31 8.69 19 12 19C15.31 19 18 16.31 18 13C18 8 12 2 12 2Z" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.5"/>
            <path d="M9 12C9 12 10 13.5 12 13.5C14 13.5 15 12 15 12" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    ),
    gas: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4H14V16H4V4Z" fill="#F97316" stroke="#C2410C" strokeWidth="1.5"/>
            <rect x="6" y="7" width="6" height="3" fill="#FED7AA" rx="0.5"/>
            <path d="M14 7H17C17.5523 7 18 7.44772 18 8V16C18 16.5523 17.5523 17 17 17H14" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5"/>
            <circle cx="17" cy="13" r="1" fill="#FDE68A"/>
        </svg>
    ),
    restaurant: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 3V8C5 9.1 5.9 10 7 10V21" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
            <path d="M17 3V10V21" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
            <path d="M17 10C17 7.79 15.21 6 13 6C10.79 6 9 7.79 9 10" fill="#DBEAFE" stroke="#0EA5E9" strokeWidth="1.5"/>
            <circle cx="5" cy="3" r="1" fill="#F59E0B"/>
            <circle cx="7" cy="3" r="1" fill="#F59E0B"/>
            <circle cx="9" cy="3" r="1" fill="#F59E0B"/>
        </svg>
    ),
    supermarket: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 2H4L6.4 14.4C6.6 15.4 7.5 16 8.5 16H19.5C20.5 16 21.4 15.4 21.6 14.4L23 6H6" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="10" y="8" width="9" height="6" fill="#D1FAE5" stroke="#10B981" strokeWidth="1"/>
            <circle cx="9" cy="20" r="1.5" fill="#10B981"/>
            <circle cx="19" cy="20" r="1.5" fill="#10B981"/>
        </svg>
    ),
    laundry: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="2" width="16" height="20" rx="2" fill="#E0E7FF" stroke="#6366F1" strokeWidth="2"/>
            <circle cx="12" cy="13" r="5" fill="#fff" stroke="#6366F1" strokeWidth="2"/>
            <path d="M9.5 13C9.5 13 10.5 15 12 15C13.5 15 14.5 13 14.5 13" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="7" cy="5" r="1" fill="#6366F1"/>
            <circle cx="17" cy="5" r="1" fill="#10B981"/>
        </svg>
    ),
    tourism: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="8" width="18" height="12" rx="2" fill="#FBBF24" stroke="#D97706" strokeWidth="2"/>
            <path d="M15 8L13.5 4H10.5L9 8" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5"/>
            <circle cx="12" cy="14" r="3" fill="#1F2937" stroke="#374151" strokeWidth="2"/>
            <circle cx="12" cy="14" r="1.5" fill="#6B7280"/>
            <circle cx="17" cy="10.5" r="1" fill="#EF4444"/>
        </svg>
    ),
    custom: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.5 9H22L16 14L18.5 21L12 16L5.5 21L8 14L2 9H9.5L12 2Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="2" fill="#FEF3C7"/>
        </svg>
    ),
};

const services = [
    { key: 'camping', label: 'Camping', emoji: '🚐', color: 'text-red-600' },
    { key: 'water', label: 'Agua', emoji: '💧', color: 'text-cyan-600' },
    { key: 'gas', label: 'Gas', emoji: '⛽', color: 'text-orange-600' },
    { key: 'restaurant', label: 'Comer', emoji: '🍳', color: 'text-blue-600' },
    { key: 'supermarket', label: 'Super', emoji: '🛒', color: 'text-green-600' },
    { key: 'laundry', label: 'Lavar', emoji: '🧺', color: 'text-purple-600' },
    { key: 'tourism', label: 'Turismo', emoji: '📷', color: 'text-yellow-600' },
    { key: 'custom', label: 'Propios', emoji: '⭐', color: 'text-gray-600' },
];

export default function IconsPreviewPage() {
    const [selectedStyle, setSelectedStyle] = useState<'lucide' | 'heroicons' | 'custom' | 'emoji'>('lucide');

    const getIconSet = () => {
        switch (selectedStyle) {
            case 'lucide': return LucideIcons;
            case 'heroicons': return HeroiconsSolid;
            case 'custom': return CustomTravel;
            case 'emoji': return EmojiInspired;
        }
    };

    const IconSet = getIconSet();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">🎨 Preview de Estilos SVG</h1>
                    <p className="text-sm text-gray-600 mb-6">Selecciona un estilo para ver cómo quedarían los iconos en tu app</p>

                    {/* Selector de estilo */}
                    <div className="grid grid-cols-4 gap-3 mb-8">
                        <button
                            onClick={() => setSelectedStyle('lucide')}
                            className={`p-4 rounded-lg border-2 transition-all ${selectedStyle === 'lucide' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                        >
                            <h3 className="font-bold text-sm mb-1">LUCIDE</h3>
                            <p className="text-xs text-gray-600">Outline moderno</p>
                        </button>
                        <button
                            onClick={() => setSelectedStyle('heroicons')}
                            className={`p-4 rounded-lg border-2 transition-all ${selectedStyle === 'heroicons' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                        >
                            <h3 className="font-bold text-sm mb-1">HEROICONS</h3>
                            <p className="text-xs text-gray-600">Solid + Tailwind</p>
                        </button>
                        <button
                            onClick={() => setSelectedStyle('custom')}
                            className={`p-4 rounded-lg border-2 transition-all ${selectedStyle === 'custom' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                        >
                            <h3 className="font-bold text-sm mb-1">CUSTOM</h3>
                            <p className="text-xs text-gray-600">Temático viajes</p>
                        </button>
                        <button
                            onClick={() => setSelectedStyle('emoji')}
                            className={`p-4 rounded-lg border-2 transition-all ${selectedStyle === 'emoji' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                        >
                            <h3 className="font-bold text-sm mb-1">EMOJI-STYLE</h3>
                            <p className="text-xs text-gray-600">Colorido</p>
                        </button>
                    </div>

                    {/* Info del estilo seleccionado */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        {selectedStyle === 'lucide' && (
                            <>
                                <h4 className="font-bold text-blue-900 mb-1">✨ LUCIDE - Outline Moderno</h4>
                                <p className="text-sm text-blue-800"><strong>Ventajas:</strong> Minimalista, líneas finas, muy limpio. Usado por Notion, Linear.</p>
                                <p className="text-sm text-blue-800"><strong>Peso:</strong> ~1KB por icono</p>
                            </>
                        )}
                        {selectedStyle === 'heroicons' && (
                            <>
                                <h4 className="font-bold text-blue-900 mb-1">⚡ HEROICONS - Solid</h4>
                                <p className="text-sm text-blue-800"><strong>Ventajas:</strong> Diseñado por Tailwind Labs, perfecto para tu stack. Más visibles en tamaño pequeño.</p>
                                <p className="text-sm text-blue-800"><strong>Peso:</strong> ~1KB por icono</p>
                            </>
                        )}
                        {selectedStyle === 'custom' && (
                            <>
                                <h4 className="font-bold text-blue-900 mb-1">🚐 CUSTOM TRAVEL - Temático</h4>
                                <p className="text-sm text-blue-800"><strong>Ventajas:</strong> Específicos de viajes, más descriptivos. Incluyen detalles como ventanas, ruedas, etc.</p>
                                <p className="text-sm text-blue-800"><strong>Peso:</strong> ~2KB por icono</p>
                            </>
                        )}
                        {selectedStyle === 'emoji' && (
                            <>
                                <h4 className="font-bold text-blue-900 mb-1">🎨 EMOJI-INSPIRED - Colorido</h4>
                                <p className="text-sm text-blue-800"><strong>Ventajas:</strong> Mantiene personalidad de emojis pero vectorial. Colores llamativos, amigable.</p>
                                <p className="text-sm text-blue-800"><strong>Peso:</strong> ~2KB por icono</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Preview en botones (como en tu app) */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Vista en Botones de Servicio</h2>
                    <div className="flex flex-wrap gap-2">
                        {services.map(service => {
                            const Icon = IconSet[service.key as keyof typeof IconSet];
                            return (
                                <button key={service.key} className={`px-3 py-2 rounded-lg text-xs font-bold border bg-white text-gray-700 border-gray-300 flex items-center gap-1.5 shadow-sm hover:bg-gray-50`}>
                                    <span className={service.color}><Icon /></span>
                                    {service.label}
                                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700">12</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Preview en mapa */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Vista en Marcadores del Mapa</h2>
                    <div className="bg-gray-100 rounded-lg p-8 flex flex-wrap gap-6 justify-center">
                        {services.map(service => {
                            const Icon = IconSet[service.key as keyof typeof IconSet];
                            return (
                                <div key={service.key} className="flex flex-col items-center gap-2">
                                    <div className={`w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center ${service.color}`}>
                                        <Icon />
                                    </div>
                                    <span className="text-xs text-gray-600">{service.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Preview en lista */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Vista en Lista de Lugares</h2>
                    <div className="space-y-2">
                        {services.slice(0, 3).map((service, idx) => {
                            const Icon = IconSet[service.key as keyof typeof IconSet];
                            return (
                                <div key={service.key} className="bg-white p-3 rounded border border-gray-200 hover:border-blue-400 transition-all flex gap-3 items-center shadow-sm">
                                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white bg-${service.color.replace('text-', '')}-500`}>{idx + 1}</div>
                                    <div className="flex-1">
                                        <div className="flex items-start gap-2 mb-1">
                                            <h6 className="text-sm font-bold text-gray-800 flex-1">Ejemplo de {service.label}</h6>
                                            <div className={`${service.color}`}>
                                                <Icon />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <span>★ 4.5</span>
                                            <span>(123)</span>
                                            <span>2.5km</span>
                                            <span className="text-green-700 font-bold">score: 85/100</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
