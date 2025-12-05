'use client';

import Link from 'next/link';
import { useState } from 'react';

interface OnboardingStep {
  number: number;
  title: string;
  description: string;
  icon: string;
  details: string[];
}

const steps: OnboardingStep[] = [
  {
    number: 1,
    title: 'Crear un Viaje',
    description: 'Define tu punto de partida y destino',
    icon: '🗺️',
    details: [
      'Ingresa el lugar de salida (ej: Salamanca)',
      'Ingresa el destino final (ej: Barcelona)',
      'Elige la distancia diaria aproximada',
      'El sistema calcula automáticamente las etapas',
    ],
  },
  {
    number: 2,
    title: 'Buscar Servicios',
    description: 'Encuentra campings, gasolineras, restaurantes',
    icon: '🔍',
    details: [
      'Usa el selector de tipo de servicio (Camping, Gas, Restaurante, etc)',
      'Activa/desactiva con los toggles',
      'Ajusta el filtro de rating mínimo',
      'Los resultados se muestran en el mapa y en la lista',
    ],
  },
  {
    number: 3,
    title: 'Guardar Lugares',
    description: 'Agrega lugares a tu plan de viaje',
    icon: '⭐',
    details: [
      'Haz clic en un lugar de la búsqueda',
      'Se guarda automáticamente en tu itinerario',
      'Los lugares guardados NO se filtran por rating',
      'Puedes ver todos tus lugares en "Mi Plan"',
    ],
  },
  {
    number: 4,
    title: 'Gestionar Escalas',
    description: 'Ajusta paradas dentro de cada día',
    icon: '⏹️',
    details: [
      'Abre el modal de escalas para cada día',
      'Agrega paradas intermedias (sin pernocta)',
      'Las escalas aparecen en la ruta del mapa',
      'Se recalcula automáticamente la distancia',
    ],
  },
  {
    number: 5,
    title: 'Personalizar Itinerario',
    description: 'Ajusta días, pernoctas y detalles',
    icon: '✏️',
    details: [
      'Haz clic en "Ajustar Etapa" para modificar días',
      'Cambia las fechas de pernocta',
      'Añade notas personales a cada día',
      'El mapa se actualiza en tiempo real',
    ],
  },
  {
    number: 6,
    title: 'Compartir Viaje',
    description: 'Comparte tu itinerario con otros',
    icon: '🔗',
    details: [
      'Haz clic en "Compartir" en el panel de itinerario',
      'Se genera un enlace único',
      'Otros pueden ver tu viaje sin necesidad de cuenta',
      'El enlace permanece activo mientras guardes el viaje',
    ],
  },
];

export default function OnboardingPage() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 sm:py-16">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🚀</span>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-100">Guía de Inicio</h1>
              <p className="text-slate-400 mt-2">Aprende a usar CaraCola Viajes en 6 pasos</p>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <div className="text-2xl mb-2">💡</div>
            <h3 className="font-bold text-slate-100 mb-1">Tip 1: Distancia</h3>
            <p className="text-sm text-slate-400">Elige 400-450km para etapas cómodas</p>
          </div>
          <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
            <div className="text-2xl mb-2">⭐</div>
            <h3 className="font-bold text-slate-100 mb-1">Tip 2: Filtros</h3>
            <p className="text-sm text-slate-400">Los filtros NO aplican a lugares guardados</p>
          </div>
          <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
            <div className="text-2xl mb-2">🗺️</div>
            <h3 className="font-bold text-slate-100 mb-1">Tip 3: Mapa</h3>
            <p className="text-sm text-slate-400">El mapa actualiza en tiempo real</p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step) => (
            <button
              key={step.number}
              onClick={() => setActiveStep(activeStep === step.number ? null : step.number)}
              className="w-full text-left"
            >
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 sm:p-6 hover:border-slate-600 hover:bg-slate-800/50 transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex-shrink-0">
                    <span className="text-xl">{step.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-slate-100 font-bold text-sm">
                        {step.number}
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-100">{step.title}</h3>
                        <p className="text-sm text-slate-400 mt-1">{step.description}</p>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {activeStep === step.number && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-slate-300">
                              <span className="text-blue-400 font-bold mt-0.5">→</span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Chevron */}
                  <svg
                    className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform ${
                      activeStep === step.number ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-slate-700">
          <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-700/50 rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold text-slate-100 mb-2">¿Listo para comenzar?</h3>
            <p className="text-slate-400 mb-4">Crea tu primer viaje y explora CaraCola Viajes</p>
            <Link
              href="/"
              className="inline-block px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold"
            >
              Ir a la Aplicación
            </Link>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          <Link
            href="/manifesto"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Ver Manifiesto
          </Link>
          <span className="text-slate-600">•</span>
          <Link
            href="/roadmap"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Ver Roadmap
          </Link>
        </div>
      </div>
    </div>
  );
}
