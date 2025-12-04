'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// SVG Icons
const IconMenu = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const IconX = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const IconChevron = ({ isOpen }: { isOpen: boolean }) => <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;

interface NavItem {
  label: string;
  href: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navSections: NavSection[] = [
  {
    id: 'strategy',
    title: 'ESTRATEGIA',
    icon: '🐌',
    description: 'Visión, misión y propuesta de valor',
    defaultOpen: true,
    items: [
      {
        label: 'Manifiesto CaraCola',
        href: '/manifesto',
        description: 'Nuestra filosofía y principios de desarrollo',
      },
      {
        label: 'Análisis V0.8: Pernoctas vs Escalas',
        href: '/manifesto-analysis',
        description: 'Validación de alineación estratégica',
        badge: 'NUEVO',
        badgeColor: 'bg-green-500',
      },
      {
        label: 'Roadmap Producto',
        href: '/roadmap',
        description: 'Hitos, versiones y evolución planificada',
      },
    ],
  },
  {
    id: 'product',
    title: 'PRODUCTO',
    icon: '🚀',
    description: 'Funcionalidad y experiencia de usuario',
    defaultOpen: false,
    items: [
      {
        label: 'Onboarding / Tour Guiado',
        href: '/onboarding',
        description: 'Experiencia de primer uso',
      },
    ],
  },
  {
    id: 'qa',
    title: 'QUALITY ASSURANCE',
    icon: '🧪',
    description: 'Testing, validación y control de calidad',
    defaultOpen: false,
    items: [
      {
        label: 'Test Usabilidad Carmen V0.7',
        href: '/test-usabilidad-carmen',
        description: '27 casos de prueba documentados',
        badge: 'ACTIVO',
        badgeColor: 'bg-orange-500',
      },
      {
        label: 'Test Búsqueda de Spots',
        href: '/test-spots-search',
        description: 'Validación de búsqueda por tipo de servicio',
      },
      {
        label: 'Test Manual Checklist',
        href: '/test-manual-checklist',
        description: 'Lista de verificación de funcionalidades core',
        badge: '✓',
        badgeColor: 'bg-green-500',
      },
    ],
  },
  {
    id: 'engineering',
    title: 'INGENIERÍA',
    icon: '⚙️',
    description: 'Tests técnicos y validaciones de componentes',
    defaultOpen: false,
    items: [
      {
        label: 'Test Sliders Exhaustivo',
        href: '/test-sliders-exhaustive',
        description: 'Validación de controles deslizantes',
        badge: '✓',
        badgeColor: 'bg-green-500',
      },
      {
        label: 'Test Rating Filter',
        href: '/test-rating-filter',
        description: 'Sistema de filtrado por calificación',
        badge: '✓',
        badgeColor: 'bg-green-500',
      },
      {
        label: 'Test Integración Rating',
        href: '/test-rating-integration',
        description: 'Integración completa del sistema de rating',
        badge: '✓',
        badgeColor: 'bg-green-500',
      },
      {
        label: 'Test Iconografía SVG',
        href: '/testing-features',
        description: 'Validación de sistema de iconos',
        badge: '✓',
        badgeColor: 'bg-green-500',
      },
    ],
  },
];

export default function TestHamburgerNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(
    navSections.filter(s => s.defaultOpen).map(s => s.id)
  );

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const totalItems = navSections.reduce((sum, section) => sum + section.items.length, 0);
  const completedItems = navSections.reduce(
    (sum, section) => sum + section.items.filter(item => item.badge === '✓').length,
    0
  );

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-3 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-lg shadow-2xl hover:shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 border border-slate-700"
        title="Wiki CaraCola"
      >
        {isOpen ? <IconX /> : <IconMenu />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - WIKI Style */}
      <div
        className={`fixed top-0 right-0 h-screen w-[420px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 shadow-2xl z-40 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🐌</span>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">CaraCola Wiki</h2>
              <p className="text-blue-100 text-xs">Knowledge Base & Documentation</p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-slate-800/50 px-6 py-3 border-b border-slate-700">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-xl font-bold text-blue-400">{navSections.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Secciones</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-400">{totalItems}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Páginas</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-400">{completedItems}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Validados</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-400">V0.8</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Versión</div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {navSections.map((section) => {
            const isExpanded = openSections.includes(section.id);
            return (
              <div key={section.id} className="border border-slate-700 rounded-lg bg-slate-800/30 overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-slate-700/50 transition-colors"
                >
                  <span className="text-2xl">{section.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-sm text-slate-100 tracking-wide">{section.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{section.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">
                      {section.items.length}
                    </span>
                    <IconChevron isOpen={isExpanded} />
                  </div>
                </button>

                {/* Section Items */}
                {isExpanded && (
                  <div className="border-t border-slate-700 bg-slate-900/30">
                    {section.items.map((item, idx) => (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsOpen(false)}
                        className={`block p-3 pl-6 hover:bg-slate-700/50 transition-colors group ${
                          idx !== section.items.length - 1 ? 'border-b border-slate-700/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-slate-200 group-hover:text-blue-300 transition-colors">
                                {item.label}
                              </span>
                              {item.badge && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${item.badgeColor}`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-400 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <svg className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-900 border-t border-slate-700 p-4">
          <div className="text-xs text-slate-400 space-y-1">
            <p className="flex items-center gap-2">
              <span className="text-blue-400">💡</span>
              <span>Wiki corporativa para equipo y testers</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-purple-400">🔐</span>
              <span>Acceso interno - Testing environment</span>
            </p>
            <div className="pt-2 mt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
              <span>Branch: testing</span>
              <span>Build: {new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
