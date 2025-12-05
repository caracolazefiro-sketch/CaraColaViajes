import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Crear directorio si no existe
    const auditDir = join(process.cwd(), 'data', 'audits');
    if (!existsSync(auditDir)) {
      mkdirSync(auditDir, { recursive: true });
    }

    // Guardar con timestamp
    const filename = `audit_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = join(auditDir, filename);

    writeFileSync(filepath, JSON.stringify(body, null, 2), 'utf-8');

    return Response.json({
      success: true,
      message: `✅ Audit guardado en: ${filename}`,
      filename
    }, { status: 200 });
  } catch (error) {
    console.error('Error saving audit:', error);
    return Response.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
