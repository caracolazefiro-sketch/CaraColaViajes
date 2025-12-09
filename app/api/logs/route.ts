import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const logsDir = path.join(process.cwd(), 'logs', 'api-calls');
    
    // Verificar si existe el directorio
    if (!fs.existsSync(logsDir)) {
      return NextResponse.json({ 
        error: 'Logs directory not found',
        message: 'No logs available yet. Run trips in development mode to generate logs.'
      }, { status: 404 });
    }

    // Leer todos los archivos JSON
    const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.json') && f.startsWith('trip_'));
    
    const logs = files.map(file => {
      const filePath = path.join(logsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    });

    // Leer summary.csv si existe
    let summary = null;
    const summaryPath = path.join(logsDir, 'summary.csv');
    if (fs.existsSync(summaryPath)) {
      summary = fs.readFileSync(summaryPath, 'utf-8');
    }

    return NextResponse.json({
      totalTrips: logs.length,
      trips: logs,
      summary: summary
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to read logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
