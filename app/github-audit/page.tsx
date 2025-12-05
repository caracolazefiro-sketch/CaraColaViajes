'use client';

import { useState } from 'react';

interface AuditSection {
  title: string;
  description: string;
  url: string;
  placeholder: string;
  key: keyof AuditData;
}

interface AuditData {
  accountStatus: string;
  billingInfo: string;
  apiLimits: string;
  repoStatus: string;
  deploymentStatus: string;
  collaborators: string;
  securitySettings: string;
  notes: string;
}

const sections: AuditSection[] = [
  {
    title: '1. Estado de Cuenta',
    description: 'Ve a https://github.com/settings/profile y copia tu información básica',
    url: 'https://github.com/settings/profile',
    placeholder: 'Pega aquí tu estado de cuenta (usuario, plan, fecha creación, etc)',
    key: 'accountStatus'
  },
  {
    title: '2. Billing y Plan',
    description: 'Ve a https://github.com/settings/billing/summary y copia el plan actual',
    url: 'https://github.com/settings/billing/summary',
    placeholder: 'Pega aquí tu plan (Free, Pro, Teams, etc) y límites de uso',
    key: 'billingInfo'
  },
  {
    title: '3. API y Rate Limits',
    description: 'Ve a https://api.github.com/rate_limit (en navegador) y copia los límites',
    url: 'https://api.github.com/rate_limit',
    placeholder: 'Pega aquí el JSON de rate_limit',
    key: 'apiLimits'
  },
  {
    title: '4. Estado del Repo',
    description: 'Ve a https://github.com/caracolazefiro-sketch/CaraColaViajes y copia info del repo',
    url: 'https://github.com/caracolazefiro-sketch/CaraColaViajes',
    placeholder: 'Pega aquí: stars, forks, último commit, rama default, etc',
    key: 'repoStatus'
  },
  {
    title: '5. Deployments y Actions',
    description: 'Ve a https://github.com/caracolazefiro-sketch/CaraColaViajes/deployments',
    url: 'https://github.com/caracolazefiro-sketch/CaraColaViajes/deployments',
    placeholder: 'Pega aquí el estado de deployments y últimas acciones',
    key: 'deploymentStatus'
  },
  {
    title: '6. Collaboradores',
    description: 'Ve a https://github.com/caracolazefiro-sketch/CaraColaViajes/settings/access',
    url: 'https://github.com/caracolazefiro-sketch/CaraColaViajes/settings/access',
    placeholder: 'Pega aquí lista de collaboradores y permisos',
    key: 'collaborators'
  },
  {
    title: '7. Seguridad',
    description: 'Ve a https://github.com/settings/security y copia estado de 2FA, SSH keys, etc',
    url: 'https://github.com/settings/security',
    placeholder: 'Pega aquí: 2FA status, SSH keys, tokens activos, etc',
    key: 'securitySettings'
  },
  {
    title: '8. Notas Adicionales',
    description: 'Cualquier info extra que consideres importante',
    url: '',
    placeholder: 'Notas, problemas, alertas que hayas notado, etc',
    key: 'notes'
  }
];

export default function GitHubAudit() {
  const [data, setData] = useState<AuditData>({
    accountStatus: '',
    billingInfo: '',
    apiLimits: '',
    repoStatus: '',
    deploymentStatus: '',
    collaborators: '',
    securitySettings: '',
    notes: ''
  });

  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (key: keyof AuditData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/audit/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          data
        })
      });

      if (response.ok) {
        setSaved(true);
        setMessage('✅ Audit guardado correctamente. Tu agent puede verlo ahora.');
        setTimeout(() => setSaved(false), 3000);
      } else {
        setMessage('❌ Error al guardar. Intenta de nuevo.');
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage('📋 Copiado al portapapeles');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔍 GitHub Account Audit</h1>
          <p className="text-gray-700">
            Revisa cada sección, copia la información de GitHub y pégala aquí. Luego guarda para que tu agent lo analice.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 text-center font-semibold ${
            message.includes('✅') ? 'bg-green-100 text-green-800' :
            message.includes('❌') ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div key={section.key} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{section.title}</h2>
                  <p className="text-gray-600 mb-2">{section.description}</p>
                  {section.url && (
                    <a
                      href={section.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-2"
                    >
                      🔗 Ir a {section.url.split('/').slice(-1)[0] || 'página'}
                      <span className="text-lg">↗</span>
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleCopy(section.url)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-semibold transition"
                >
                  Copiar URL
                </button>
              </div>

              <textarea
                value={data[section.key]}
                onChange={(e) => handleChange(section.key, e.target.value)}
                placeholder={section.placeholder}
                className="w-full h-32 p-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none resize-none font-mono text-sm"
              />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4 sticky bottom-6">
          <button
            onClick={handleSave}
            disabled={saved}
            className={`flex-1 py-4 rounded-lg font-bold text-lg transition ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {saved ? '✅ Guardado' : '💾 Guardar Audit'}
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="py-4 px-6 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold transition"
          >
            🔄 Limpiar
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 p-6 bg-indigo-50 rounded-lg border border-indigo-200">
          <h3 className="font-bold text-gray-900 mb-2">📝 Instrucciones:</h3>
          <ol className="space-y-1 text-gray-700 text-sm">
            <li>1. Haz clic en cada "Ir a página" para abrir la sección de GitHub en otra pestaña</li>
            <li>2. Selecciona y copia la información relevante (puedes copiar texto, JSON, etc)</li>
            <li>3. Vuelve aquí y pega en el textbox correspondiente</li>
            <li>4. Repite para todas las secciones</li>
            <li>5. Haz clic en "💾 Guardar Audit" cuando termines</li>
            <li>6. Tu agent analizará los datos y te dará recomendaciones</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
