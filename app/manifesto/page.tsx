'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ManifestoPage() {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    const fetchManifesto = async () => {
      try {
        const response = await fetch('/api/manifesto');
        const data = await response.json();
        setContent(data.content);
      } catch (error) {
        console.error('Error loading manifesto:', error);
        setContent('Error al cargar el manifiesto');
      }
    };

    fetchManifesto();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 sm:py-16">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-5xl">🐌</span>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-100">Manifiesto CaraCola</h1>
              <p className="text-slate-400 mt-2">Visión estratégica y propuesta de valor</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6 sm:p-8">
            {content ? (
              <div className="text-slate-100 space-y-6">
                <p className="text-lg text-slate-300">
                  CaraCola no es un mapa, ni un directorio. <span className="font-bold text-blue-400">CaraCola es un Asistente Logístico.</span>
                </p>

                <section>
                  <h2 className="text-2xl font-bold text-blue-400 mb-3">🎯 La Misión</h2>
                  <p>Transformar la incertidumbre de un viaje en autocaravana en un plan sólido, seguro y visual.</p>
                  <ul className="mt-3 space-y-2 text-slate-300">
                    <li>✅ <span className="text-slate-200">Google Maps</span> te lleva</li>
                    <li>✅ <span className="text-slate-200">Park4Night</span> te dice qué es el sitio</li>
                    <li>✅ <span className="text-blue-400 font-bold">CaraCola</span> te organiza la vida</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-purple-400 mb-3">💎 Nuestro Poder</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-200">1. Algoritmo de Corte (Slicing)</h3>
                      <p className="text-slate-400">Automatizar la decisión de "¿dónde cae el km 400?" ahorra horas de cálculo mental.</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-200">2. Portero de Discoteca (Data Curation)</h3>
                      <p className="text-slate-400">Filtramos activamente el ruido. Calidad &gt; Cantidad.</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-200">3. Contexto Híbrido</h3>
                      <p className="text-slate-400">El usuario puede meter su propio link. La app se adapta al usuario, no al revés.</p>
                    </div>
                  </div>
                </section>

                <div className="bg-blue-900/20 border border-blue-700/50 rounded p-4">
                  <p className="text-sm text-slate-300">
                    💡 <span className="font-bold">Principio:</span> Nosotros damos ESTRATEGIA. Segmentamos el viaje en trozos digeribles y mostramos lo relevante en ese contexto.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-slate-400">Cargando manifiesto...</div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-slate-700 flex gap-4 justify-between">
          <Link
            href="/manifesto-analysis"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 hover:text-slate-100"
          >
            <span>→</span>
            Ver Análisis V0.8
          </Link>
          <Link
            href="/roadmap"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 hover:text-slate-100"
          >
            Ver Roadmap
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
