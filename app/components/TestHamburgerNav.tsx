'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// SVG Icons - TODO SOLO SVG
const IconMenu = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const IconX = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const IconCompass = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm-3.5-6l-4 6.5H12l3 4h2l-4-6 2-4.5z"/></svg>;
const IconFile = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/></svg>;
const IconCheck = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>;

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  category: 'test' | 'docs';
  completed?: boolean;
}

const navItems: NavItem[] = [
  // TEST PAGES
  {
    label: 'Test Rating Filter',
    href: '/test-rating-filter',
    icon: <span>🎚️</span>,
    category: 'test',
    completed: false,
  },
  {
    label: 'Test Integration',
    href: '/test-rating-integration',
    icon: <span>🧪</span>,
    category: 'test',
    completed: false,
  },
  {
    label: 'Test SVG Icons',
    href: '/testing-features',
    icon: <span>🎨</span>,
    category: 'test',
    completed: true,
  },

  // DOCS
  {
    label: 'Onboarding',
    href: '/onboarding',
    icon: <IconCompass />,
    category: 'docs',
  },
  {
    label: 'Manifiesto',
    href: '/manifesto',
    icon: <IconFile />,
    category: 'docs',
  },
  {
    label: 'Roadmap',
    href: '/roadmap',
    icon: <IconCheck />,
    category: 'docs',
  },
];

export default function TestHamburgerNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [deletedTests, setDeletedTests] = useState<string[]>([]);

  const deleteTest = (href: string) => {
    setDeletedTests([...deletedTests, href]);
    setTimeout(() => {
      // Aquí iría la lógica para eliminar la página en producción
      console.log(`Marcar para eliminación: ${href}`);
    }, 300);
  };

  const visibleItems = navItems.filter(item => !deletedTests.includes(item.href));
  const testItems = visibleItems.filter(item => item.category === 'test');
  const docItems = visibleItems.filter(item => item.category === 'docs');
  const completedTests = testItems.filter(item => item.completed).length;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95"
        title="Menú de navegación"
      >
        {isOpen ? <IconX /> : <IconMenu />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <div
        className={`fixed top-0 right-0 h-screen w-80 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl z-40 transform transition-transform duration-300 ease-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 sticky top-0 z-10">
          <h2 className="text-2xl font-bold mb-2">🚀 CaraCola</h2>
          <p className="text-blue-100 text-sm">Navigation & Tools</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Test Pages Section */}
          {testItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-300 flex items-center gap-2">
                  <span>🧪</span> TEST PAGES
                </h3>
                {completedTests > 0 && (
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                    {completedTests} hecho
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {testItems.map((item) => (
                  <div key={item.href} className="group">
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-blue-600/50 transition-all group/link"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="flex-1 font-medium text-sm">{item.label}</span>
                      {item.completed && (
                        <span className="text-green-400"><IconCheck /></span>
                      )}
                    </a>
                    {!item.completed && (
                      <button
                        onClick={() => deleteTest(item.href)}
                        className="ml-3 mt-1 text-xs text-red-300 hover:text-red-200 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                        title="Marcar para eliminación"
                      >
                        🗑️ Eliminar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documentation Section */}
          {docItems.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-purple-300 flex items-center gap-2 mb-4">
                <span>📚</span> DOCUMENTATION
              </h3>
              <div className="space-y-2">
                {docItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-purple-600/50 transition-all"
                  >
                    <span>{item.icon}</span>
                    <span className="font-medium text-sm">{item.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="pt-6 border-t border-slate-700">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-300">{testItems.length}</div>
                <div className="text-xs text-blue-200">Test Pages</div>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                <div className="text-2xl font-bold text-purple-300">{docItems.length}</div>
                <div className="text-xs text-purple-200">Docs</div>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="pt-6 border-t border-slate-700 text-xs text-slate-400">
            <p className="mb-2">💡 <span className="text-slate-300 font-semibold">Tip:</span> Hover sobre tests para ver opción de eliminar</p>
            <p>🔐 Solo tests sin completar pueden eliminarse</p>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900/50 border-t border-slate-700 text-center text-xs text-slate-400">
          <p>v0.8 - Rating Filter</p>
        </div>
      </div>
    </>
  );
}
