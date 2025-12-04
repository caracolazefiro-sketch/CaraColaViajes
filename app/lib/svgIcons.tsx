/**
 * SVG Icons Library - Reemplazos para Lucide React
 * Todos los iconos están implementados como componentes SVG inline
 */

import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

// ========== ICONOS BÁSICOS ==========

export const IconX: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const IconPlus: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 4v16m8-8H4" />
  </svg>
);

export const IconTrash2: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const IconPrinter: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

export const IconSearch: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

export const IconSettings: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.12 2.12l4.24 4.24M1 12h6m6 0h6m-17.78 7.78l4.24-4.24m2.12-2.12l4.24-4.24" />
  </svg>
);

export const IconCalendar: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

export const IconMapPin: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const IconTruck: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="1" y="6" width="15" height="12" rx="2" ry="2" />
    <path d="M16 6h3a2 2 0 0 1 2 2v6M6 17v1a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-1M18 17v1a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-1" />
    <circle cx="8" cy="19" r="2" />
    <circle cx="20" cy="19" r="2" />
  </svg>
);

export const IconInfo: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

export const IconAlertCircle: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

// ========== ICONOS DE ESTRELLAS ==========

export const IconStar: React.FC<IconProps & { filled?: boolean }> = ({ size = 24, className = '', filled = false, strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 10.26 24 10.27 17 16.14 19.09 24.41 12 18.54 4.91 24.41 7 16.14 0 10.27 8.91 10.26 12 2" />
  </svg>
);

export const IconStarHalf: React.FC<IconProps> = ({ size = 24, className = '', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 17.8v-6.26M12 2l3.09 8.26L24 10.27l-6 5.87L19.09 24 12 18.54 4.91 24.41 7 16.14 0 10.27 8.91 10.26 12 2" />
  </svg>
);

// ========== ICONOS DE CATEGORÍAS DE SERVICIOS ==========

export const IconMoon: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const IconDroplet: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

export const IconFuel: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 2h10v14H3zM7 21v-7M17 6h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-2M17 10h3" />
  </svg>
);

export const IconUtensilsCrossed: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

export const IconShoppingCart: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export const IconWashingMachine: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="2" width="18" height="20" rx="2" ry="2" />
    <circle cx="12" cy="13" r="5" />
    <path d="M8 5h8M8 9h8" />
  </svg>
);

export const IconCamera: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

export const IconCheckCircle: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="M22 4L12 14.01l-3-3" />
  </svg>
);

export const IconXCircle: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

// ========== ICONOS PARA CLASIFICACIÓN ==========

export const IconTrophy: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2M8 5a4 4 0 0 1 8 0M6 9h12M6 13h12" />
  </svg>
);

export const IconGem: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 3h12l4 6-10 14L2 9l4-6z" />
  </svg>
);

export const IconFlame: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 12 12.5a2.5 2.5 0 0 0 0-5c-1.396 0-2.573.5-3.5 1.47-.932.971-1.5 2.25-1.5 3.53 0 1.948.99 3.46 2.5 4.5M12 5v7m0 0a2.5 2.5 0 0 0 0-5M12 12a2 2 0 1 0 0-4" />
  </svg>
);

export const IconTrendingUp: React.FC<IconProps> = ({ size = 24, className = '', stroke = 'currentColor', strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
