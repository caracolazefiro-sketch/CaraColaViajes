const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { PDFParse } = require('pdf-parse');

function toNumber(raw) {
  const normalized = String(raw).trim().replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function scoreSpainLatLng(lat, lng) {
  let score = 0;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    if (lat >= 35 && lat <= 45) score += 3;
    if (lng >= -10.5 && lng <= 5.5) score += 3;
    if (lat >= -90 && lat <= 90) score += 1;
    if (lng >= -180 && lng <= 180) score += 1;
  }
  return score;
}

function normalizeCoordinates(aRaw, bRaw) {
  const a = toNumber(aRaw);
  const b = toNumber(bRaw);
  if (a == null || b == null) return null;

  // In the PDF the common pattern is: lng lat (e.g. -8,05 43,42)
  const option1 = { lng: a, lat: b };
  const option2 = { lng: b, lat: a };

  const s1 = scoreSpainLatLng(option1.lat, option1.lng);
  const s2 = scoreSpainLatLng(option2.lat, option2.lng);

  const chosen = s2 > s1 ? option2 : option1;
  if (chosen.lat < -90 || chosen.lat > 90) return null;
  if (chosen.lng < -180 || chosen.lng > 180) return null;

  return chosen;
}

function normalizeCode(code) {
  return String(code).trim().replace(/\s+/g, '').toUpperCase();
}

function parseTags(rawTags) {
  const tagsText = String(rawTags).trim();
  const typeMatch = tagsText.match(/\(([^)]+)\)/);
  const type = typeMatch ? normalizeCode(typeMatch[1]) : null;

  let remainder = tagsText;
  if (typeMatch) remainder = remainder.replace(typeMatch[0], '');

  const flagsFound = new Set((remainder.match(/[@€#!]/g) || []).map(String));
  remainder = remainder.replace(/[@€#!]/g, '');

  const parts = remainder
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => normalizeCode(s));

  const flagObj = {
    openAllYear: flagsFound.has('@'),
    paid: flagsFound.has('€'),
    free: flagsFound.has('#'),
    warning: flagsFound.has('!'),
  };

  return {
    type,
    flags: flagObj,
    codes: parts,
  };
}

function stableId(province, municipality, name, lat, lng) {
  const base = `${province}|${municipality}|${name}|${lat.toFixed(5)}|${lng.toFixed(5)}`;
  return crypto.createHash('sha1').update(base).digest('hex').slice(0, 16);
}

function toCsvValue(v) {
  const s = v == null ? '' : String(v);
  if (/[\n\r,\"]/g.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function main() {
  const inputPath = 'CHEMA/BASES DE DATOS/_AreasAc-Espana_2021063063.pdf';
  const outDir = 'data';
  const outJson = path.join(outDir, 'areasac-espana-20210630.json');
  const outCsv = path.join(outDir, 'areasac-espana-20210630.csv');
  const outReport = path.join(outDir, 'areasac-espana-20210630.report.json');

  fs.mkdirSync(outDir, { recursive: true });

  const buf = fs.readFileSync(inputPath);
  const parser = new PDFParse({ data: buf });
  const parsed = await parser.getText();

  const lines = parsed.text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const entries = [];
  const unparsed = [];

  const coordRegex = /(-?\d+[\.,]\d+)\s+(-?\d+[\.,]\d+)\s*$/;

  for (const line of lines) {
    if (line.startsWith('-- ') && line.includes(' of ')) continue;
    if (line === 'www.areasAc.es') continue;
    if (line.startsWith('Áreas / Parkings')) continue;
    if (line === 'LEYENDA DE SÍMBOLOS') continue;

    const coordMatch = line.match(coordRegex);
    if (!coordMatch) continue;

    const coords = normalizeCoordinates(coordMatch[1], coordMatch[2]);
    if (!coords) {
      unparsed.push({ reason: 'bad-coordinates', line });
      continue;
    }

    const withoutCoords = line.slice(0, coordMatch.index).trim();
    const parts = withoutCoords.split(' - ').map((p) => p.trim()).filter(Boolean);

    if (parts.length < 4) {
      unparsed.push({ reason: 'not-enough-parts', line });
      continue;
    }

    const province = parts[0];
    const municipality = parts[1];
    const rawTags = parts[parts.length - 1];
    const name = parts.slice(2, -1).join(' - ');

    const tags = parseTags(rawTags);
    const id = stableId(province, municipality, name, coords.lat, coords.lng);

    entries.push({
      id,
      province,
      municipality,
      name,
      rawTags,
      tags,
      coordinates: coords,
      source: {
        file: inputPath,
        line,
      },
    });
  }

  // Write JSON
  fs.writeFileSync(outJson, JSON.stringify(entries, null, 2), 'utf8');

  // Write CSV
  const header = [
    'id',
    'province',
    'municipality',
    'name',
    'lat',
    'lng',
    'type',
    'openAllYear',
    'paid',
    'free',
    'warning',
    'codes',
    'rawTags',
  ];

  const csvLines = [header.join(',')];
  for (const e of entries) {
    csvLines.push(
      [
        e.id,
        e.province,
        e.municipality,
        e.name,
        e.coordinates.lat,
        e.coordinates.lng,
        e.tags.type || '',
        e.tags.flags.openAllYear ? '1' : '0',
        e.tags.flags.paid ? '1' : '0',
        e.tags.flags.free ? '1' : '0',
        e.tags.flags.warning ? '1' : '0',
        (e.tags.codes || []).join('|'),
        e.rawTags,
      ].map(toCsvValue).join(',')
    );
  }
  fs.writeFileSync(outCsv, csvLines.join('\n'), 'utf8');

  const report = {
    inputPath,
    totalLines: lines.length,
    parsedEntries: entries.length,
    unparsedCount: unparsed.length,
    unparsedSample: unparsed.slice(0, 50),
    notes: {
      coordinateFixes: [
        'Detects decimal comma and converts to dot.',
        'Auto-detects and normalizes to {lat,lng}. PDF usually provides lng lat.',
      ],
    },
  };
  fs.writeFileSync(outReport, JSON.stringify(report, null, 2), 'utf8');

  // Basic sanity output
  const latStats = entries.map((e) => e.coordinates.lat);
  const lngStats = entries.map((e) => e.coordinates.lng);
  const min = (arr) => Math.min(...arr);
  const max = (arr) => Math.max(...arr);

  console.log('OK');
  console.log('entries', entries.length);
  console.log('lat range', min(latStats).toFixed(5), max(latStats).toFixed(5));
  console.log('lng range', min(lngStats).toFixed(5), max(lngStats).toFixed(5));
  console.log('wrote', outJson);
  console.log('wrote', outCsv);
  console.log('wrote', outReport);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
