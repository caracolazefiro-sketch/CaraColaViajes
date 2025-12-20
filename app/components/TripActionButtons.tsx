'use client';

import React from 'react';
import type { TripResult } from '../types';

// Iconos Acciones
const IconAudit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>
);
const IconCloud = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);
const IconReset = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);
const IconShare = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  </svg>
);
const IconClearCache = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

export interface TripActionButtonsProps {
  auditMode: boolean;
  setAuditMode: (v: boolean) => void;
  results: TripResult;
  currentTripId: number | null;
  isSaving: boolean;
  onSave: () => void;
  onShare: () => void;
  onReset: () => void;
  t: (key: string) => string;
}

export default function TripActionButtons({
  auditMode,
  setAuditMode,
  results,
  currentTripId,
  isSaving,
  onSave,
  onShare,
  onReset,
  t,
}: TripActionButtonsProps) {
  const handleClearCache = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;

    const keysToRemove = Object.keys(localStorage).filter((k) => k.startsWith('caracola_trip_v1'));
    keysToRemove.forEach((key) => {
      console.log(`🗑️ Eliminando: ${key}`);
      localStorage.removeItem(key);
    });
    alert('Viaje limpiado ✓');
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setAuditMode(!auditMode);
        }}
        className={`p-1.5 rounded transition ${auditMode ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
        title={t('HEADER_AUDIT')}
      >
        <IconAudit />
      </button>
      {results.totalDays && (
        <>
          {currentTripId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="p-1.5 rounded text-green-600 hover:bg-green-50 transition"
              title={t('ACTION_SHARE')}
            >
              <IconShare />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            disabled={isSaving}
            className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
            title={t('ACTION_SAVE')}
          >
            <IconCloud />
          </button>
          <button
            onClick={(e) => {
              console.log('🗑️ Botón Reset clickeado');
              e.preventDefault();
              e.stopPropagation();
              onReset();
            }}
            className="p-1.5 rounded text-red-500 hover:bg-red-50 transition"
            title={t('ACTION_DELETE')}
          >
            <IconReset />
          </button>
          <button
            onClick={handleClearCache}
            className="p-1 rounded text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition text-xs"
            title="Limpiar caché local"
          >
            <IconClearCache />
          </button>
        </>
      )}
    </div>
  );
}
