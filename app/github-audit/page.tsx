'use client';

import { useState } from 'react';

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

const sections = [
  {
    title: '1. Estado de Cuenta',
    description: 'Ve a https://github.com/settings/profile y copia tu información básica',
    url: 'https://github.com/settings/profile',
    placeholder: 'Username, Plan, Created date, 2FA status, etc',
    key: 'accountStatus' as const
  },
  {
    title: '2. Billing y Plan',
    description: 'Ve a https://github.com/settings/billing/summary',
    url: 'https://github.com/settings/billing/summary',
    placeholder: 'Plan (Free/Pro/Teams), límites de uso, próxima fecha de pago',
    key: 'billingInfo' as const
  },
  {
    title: '3. API y Rate Limits',
    description: 'Ve a https://api.github.com/rate_limit en navegador',
    url: 'https://api.github.com/rate_limit',
    placeholder: 'JSON de rate_limit (limit, remaining, reset)',
    key: 'apiLimits' as const
  },
  {
    title: '4. Estado del Repo CaraColaViajes',
    description: 'Ve a https://github.com/caracolazefiro-sketch/CaraColaViajes',
    url: 'https://github.com/caracolazefiro-sketch/CaraColaViajes',
    placeholder: 'Stars, forks, último commit, rama default, storage usado',
    key: 'repoStatus' as const
  },
  {
    title: '5. Deployments y Actions',
    description: 'Ve a https://github.com/caracolazefiro-sketch/CaraColaViajes/deployments',
    url: 'https://github.com/caracolazefiro-sketch/CaraColaViajes/deployments',
    placeholder: 'Estado de último deployment, último action, errores si los hay',
    key: 'deploymentStatus' as const
  },
  {
    title: '6. Collaboradores y Acceso',
    description: 'Ve a https://github.com/caracolazefiro-sketch/CaraColaViajes/settings/access',
    url: 'https://github.com/caracolazefiro-sketch/CaraColaViajes/settings/access',
    placeholder: 'Lista de collaboradores, permisos, invitaciones pendientes',
    key: 'collaborators' as const
  },
  {
    title: '7. Seguridad',
    description: 'Ve a https://github.com/settings/security',
    url: 'https://github.com/settings/security',
    placeholder: '2FA status, SSH keys activas, personal access tokens, etc',
    key: 'securitySettings' as const
  },
  {
    title: '8. Notas Adicionales',
    description: 'Cualquier info extra, problemas, alertas, observaciones',
    url: '',
    placeholder: 'Notas libremente',
    key: 'notes' as const
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

  const [message, setMessage] = useState('');

  const handleChange = (key: keyof AuditData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleDownload = () => {
    // Generar Markdown con los datos
    const markdown = `# GitHub Account Audit Report
**Fecha:** ${new Date().toISOString()}
**Usuario:** caracolazefiro-sketch

---

## 1. Estado de Cuenta
\`\`\`
${data.accountStatus || '[Sin datos]'}
\`\`\`

## 2. Billing y Plan
\`\`\`
${data.billingInfo || '[Sin datos]'}
\`\`\`

## 3. API y Rate Limits
\`\`\`
${data.apiLimits || '[Sin datos]'}
\`\`\`

## 4. Estado del Repo
\`\`\`
${data.repoStatus || '[Sin datos]'}
\`\`\`

## 5. Deployments y Actions
\`\`\`
${data.deploymentStatus || '[Sin datos]'}
\`\`\`

## 6. Collaboradores
\`\`\`
${data.collaborators || '[Sin datos]'}
\`\`\`

## 7. Seguridad
\`\`\`
${data.securitySettings || '[Sin datos]'}
\`\`\`

## 8. Notas
\`\`\`
${data.notes || '[Sin datos]'}
\`\`\`

---
_Generado automáticamente por CaraColaViajes GitHub Audit_
`;

    // Crear blob y descargar
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GITHUB_AUDIT_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMessage('✅ Archivo descargado. Guárdalo en CHEMA/TESTING/');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage('📋 URL copiada al portapapeles');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔍 GitHub Account Audit</h1>
          <p className="text-gray-700 mb-4">
            Revisa cada sección, copia la información de GitHub y pégala aquí. Luego descarga como Markdown.
          </p>
          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
            💡 El archivo se guardará en tu carpeta CHEMA/TESTING/ con timestamp, igual que tus otros tests.
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
          {sections.map((section) => (
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
                      🔗 Abrir en otra pestaña
                      <span className="text-lg">↗</span>
                    </a>
                  )}
                </div>
                {section.url && (
                  <button
                    onClick={() => handleCopy(section.url)}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-semibold transition"
                  >
                    Copiar URL
                  </button>
                )}
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
            onClick={handleDownload}
            className="flex-1 py-4 rounded-lg font-bold text-lg transition bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            📥 Descargar Markdown
          </button>
          
          <button
            onClick={() => {
              setData({
                accountStatus: '',
                billingInfo: '',
                apiLimits: '',
                repoStatus: '',
                deploymentStatus: '',
                collaborators: '',
                securitySettings: '',
                notes: ''
              });
              setMessage('🔄 Formulario limpiado');
              setTimeout(() => setMessage(''), 2000);
            }}
            className="py-4 px-6 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold transition"
          >
            🔄 Limpiar
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 p-6 bg-indigo-50 rounded-lg border border-indigo-200">
          <h3 className="font-bold text-gray-900 mb-2">📝 Instrucciones:</h3>
          <ol className="space-y-1 text-gray-700 text-sm">
            <li>1. Haz clic en "Abrir en otra pestaña" para ver la página de GitHub</li>
            <li>2. Selecciona y copia la información relevante</li>
            <li>3. Vuelve aquí y pega en el textbox correspondiente</li>
            <li>4. Repite para todas las secciones</li>
            <li>5. Haz clic en "📥 Descargar Markdown" cuando termines</li>
            <li>6. Guarda el archivo en CHEMA/TESTING/ (mismo patrón que tus otros tests)</li>
            <li>7. Comparte el archivo conmigo para análisis</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

