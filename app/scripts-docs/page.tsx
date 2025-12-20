import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export default function ScriptsDocsPage() {
  // Leer el README de scripts en build time
  const readmePath = path.join(process.cwd(), 'scripts', 'README.md');
  const content = fs.existsSync(readmePath) 
    ? fs.readFileSync(readmePath, 'utf-8')
    : '# Scripts\n\nNo se encontró documentación.';

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📜 Documentación de Scripts
              </h1>
              <p className="text-gray-600">
                Guías y comandos para automatización del proyecto
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              ← Volver
            </Link>
          </div>
        </div>

        {/* Contenido Markdown renderizado como HTML simple */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <article className="prose prose-slate max-w-none">
            {content.split('\n').map((line, i) => {
              // Headers
              if (line.startsWith('### ')) {
                return <h3 key={i} className="text-xl font-bold text-gray-800 mt-8 mb-3">{line.replace('### ', '')}</h3>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={i} className="text-2xl font-bold text-gray-900 mt-10 mb-4 border-b-2 border-gray-200 pb-2">{line.replace('## ', '')}</h2>;
              }
              if (line.startsWith('# ')) {
                return <h1 key={i} className="text-3xl font-bold text-gray-900 mb-6">{line.replace('# ', '')}</h1>;
              }

              // Code blocks
              if (line.startsWith('```')) {
                return <div key={i} className="my-2"></div>; // Inicio/fin de bloque, skip
              }
              if (line.startsWith('   ') || line.startsWith('\t')) {
                return <pre key={i} className="bg-gray-900 text-green-400 px-4 py-1 rounded font-mono text-sm overflow-x-auto">{line.trim()}</pre>;
              }

              // Lists
              if (line.startsWith('- ')) {
                return <li key={i} className="ml-6 text-gray-700 list-disc">{line.replace('- ', '')}</li>;
              }

              // Bold inline code
              const processedLine = line
                .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-0.5 rounded text-sm text-red-600 font-mono">$1</code>')
                .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');

              // Horizontal rule
              if (line === '---') {
                return <hr key={i} className="my-8 border-gray-300" />;
              }

              // Empty lines
              if (line.trim() === '') {
                return <div key={i} className="h-2"></div>;
              }

              // Normal paragraphs
              return <p key={i} className="text-gray-700 leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: processedLine }}></p>;
            })}
          </article>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>
            📂 Archivo fuente: <code className="bg-gray-200 px-2 py-1 rounded">scripts/README.md</code>
          </p>
          <p className="mt-2">
            Para editar este contenido, modifica el archivo README y redeploy
          </p>
        </div>
      </div>
    </main>
  );
}
