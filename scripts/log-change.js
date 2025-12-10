#!/usr/bin/env node
/**
 * Append a timestamped change entry to CHEMA/MANTENIMIENTO/aplica-forma-de-trabajar-de-CHEMA.md
 * Usage:
 *   node scripts/log-change.js "Cambio: ..." "Comandos: ..." "Reversion: ..."
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const cambio = args[0] || '';
const comandos = args[1] || '';
const reversion = args[2] || '';

const tz = 'Europe/Madrid';
const now = new Date();
const fmt = (d) => new Intl.DateTimeFormat('es-ES', {
  timeZone: tz,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit'
}).format(d);

const stamp = fmt(now);

const target = path.join(process.cwd(), 'CHEMA', 'MANTENIMIENTO', 'aplica-forma-de-trabajar-de-CHEMA.md');

if (!fs.existsSync(target)) {
  console.error('No existe el archivo de protocolo:', target);
  process.exit(1);
}

const entry = `\n- ${stamp} (Europa/Madrid)\n  - ${cambio}\n  - Comandos ejecutados:${comandos ? `\n    ${comandos.split('\n').map(l => l ? l : '').join('\n')}` : ' N/A'}\n  - Reversión rápida:${reversion ? `\n    ${reversion.split('\n').map(l => l ? l : '').join('\n')}` : ' N/A'}\n`;

const content = fs.readFileSync(target, 'utf8');
const marker = '## Registro de cambios (fecha y hora)';
let updated;
if (content.includes(marker)) {
  const idx = content.indexOf(marker) + marker.length;
  updated = content.slice(0, idx) + '\n' + entry + content.slice(idx);
} else {
  updated = content + '\n' + marker + '\n' + entry;
}

fs.writeFileSync(target, updated, 'utf8');
console.log('Registro actualizado con marca temporal:', stamp);
