const fs = require('node:fs');
const path = require('node:path');
const { PDFParse } = require('pdf-parse');

function toIntFromEcfformat(raw) {
  // ECF uses dot as thousands separator in extracted text.
  // Examples: "1.397.213" -> 1397213, "39.820" -> 39820
  const s = String(raw).trim().replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function isPercentToken(tok) {
  return /[+-]?\d+,\d+/.test(tok);
}

function isCountToken(tok) {
  // Counts are integer-like, possibly with thousands dots (1.397.213)
  return /^\d+(?:\.\d+)*$/.test(tok);
}

function cleanTokens(tokens) {
  return tokens
    .map((t) => String(t).trim())
    .filter(Boolean)
    .filter((t) => t !== '*' && t !== '**' && t !== '*/**');
}

function removeFillerZeros(tokens) {
  // Some extracted PDFs inject standalone "0" tokens between count columns.
  // Remove "0" when it's sandwiched between two count tokens.
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = out.length ? out[out.length - 1] : null;
    const next = i + 1 < tokens.length ? tokens[i + 1] : null;
    if (t === '0' && prev && next && isCountToken(prev) && isCountToken(next)) {
      continue;
    }
    out.push(t);
  }
  return out;
}

function splitCountryAndRest(line) {
  const parts = line.split(/\s+/).filter(Boolean);
  const tokens = cleanTokens(parts);
  let idx = tokens.findIndex((t) => isCountToken(t) || isPercentToken(t));
  if (idx < 0) idx = tokens.length;
  const country = tokens.slice(0, idx).join(' ');
  const rest = tokens.slice(idx);
  return { country, rest };
}

function detectYearPair(text) {
  const matches = Array.from(String(text).matchAll(/\b(20\d{2})\s+(20\d{2})\b/g));
  if (!matches.length) return null;

  // Prefer the pair that looks like a "columns" header: increasing years (e.g. 2024 2025).
  // Some PDFs contain a title year first (e.g. "January - June 2025") which can invert the first match.
  const parsed = matches
    .map((m) => ({ yearA: Number(m[1]), yearB: Number(m[2]) }))
    .filter((p) => Number.isFinite(p.yearA) && Number.isFinite(p.yearB));

  const increasing = parsed.find((p) => p.yearA < p.yearB);
  if (increasing) return increasing;

  // Fallback: use the last detected pair.
  return parsed[parsed.length - 1] || null;
}

function parseStock2020(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rows = [];
  for (const line of lines) {
    if (line.startsWith('Europe:')) continue;
    if (line === '2020') continue;
    if (line.startsWith('Country ')) continue;
    if (line.startsWith('Source:')) break;
    if (line.startsWith('-- ')) continue;

    // Expect: Country Caravans MotorCaravans Total
    const { country, rest } = splitCountryAndRest(line);
    if (!country) continue;
    if (country === 'Country') continue;

    const countTokens = rest.filter((t) => isCountToken(t));
    if (countTokens.length < 3) continue;

    const caravans = toIntFromEcfformat(countTokens[0]);
    const motorCaravans = toIntFromEcfformat(countTokens[1]);
    const total = toIntFromEcfformat(countTokens[2]);

    if (caravans == null || motorCaravans == null || total == null) continue;

    rows.push({ country, caravans, motorCaravans, total });
  }

  return rows;
}

function parseRegistrations(text, yearA, yearB) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rows = [];

  for (const line of lines) {
    if (line.startsWith('EUROPE:')) continue;
    if (line.startsWith('Registrations')) continue;
    if (line.startsWith('Jan.') || line.startsWith('January') || line.startsWith('Caravans ')) continue;
    if (line.startsWith('Country')) continue;
    if (line.startsWith('Registered office:')) break;
    if (line.startsWith('*')) continue;
    if (line.startsWith('-- ')) continue;

    const { country, rest } = splitCountryAndRest(line);
    if (!country) continue;

    const normalized = removeFillerZeros(rest);

    // Extract counts in order by filtering count tokens and dropping percent tokens.
    const countTokens = normalized.filter((t) => isCountToken(t));
    // Typically 6: caravanA caravanB motorA motorB totalA totalB
    if (countTokens.length < 6) continue;

    const counts = countTokens.slice(0, 6).map(toIntFromEcfformat);
    if (counts.some((c) => c == null)) continue;

    const [caravansA, caravansB, motorA, motorB, totalA, totalB] = counts;

    rows.push({
      country,
      yearA,
      yearB,
      caravans: { [yearA]: caravansA, [yearB]: caravansB },
      motorCaravans: { [yearA]: motorA, [yearB]: motorB },
      total: { [yearA]: totalA, [yearB]: totalB },
    });
  }

  return rows;
}

async function extractText(pdfPath) {
  const buf = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buf });
  const data = await parser.getText();
  return String(data.text || '');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sumByCountry(rows, field) {
  const map = new Map();
  for (const r of rows) {
    const key = r.country;
    const val = Number(r[field] || 0);
    map.set(key, (map.get(key) || 0) + val);
  }
  return map;
}

async function main() {
  const baseDir = path.join('CHEMA', 'ANALISIS', 'DATOS USUARIOS EUR');
  const outDir = path.join('data', 'ecf');
  ensureDir(outDir);

  const files = fs.readdirSync(baseDir).filter((f) => f.toLowerCase().endsWith('.pdf'));

  const stockFile = files.find((f) => f.toLowerCase().includes('europabestand'));
  if (!stockFile) throw new Error('Stock PDF not found (europabestand_*.pdf)');

  const stockText = await extractText(path.join(baseDir, stockFile));
  const stock2020 = parseStock2020(stockText);
  fs.writeFileSync(path.join(outDir, 'europe-stock-2020.json'), JSON.stringify(stock2020, null, 2), 'utf8');

  const regFiles = files
    .filter((f) => f !== stockFile)
    .filter((f) => /CY|Jan|Jun|EU_/i.test(f));

  const registrations = [];

  for (const f of regFiles) {
    const pdfPath = path.join(baseDir, f);
    const text = await extractText(pdfPath);
    const years = detectYearPair(text);
    if (!years) {
      console.warn('WARN: could not detect year pair for', f);
      continue;
    }
    const rows = parseRegistrations(text, years.yearA, years.yearB);
    registrations.push({ file: f, ...years, rows });
  }

  fs.writeFileSync(path.join(outDir, 'europe-registrations.json'), JSON.stringify(registrations, null, 2), 'utf8');

  // Produce a compact totals series using the "Total" row from each registrations PDF.
  const totalsSeries = [];
  for (const block of registrations) {
    const totalRow = block.rows.find((r) => r.country.toLowerCase() === 'total');
    if (!totalRow) continue;
    totalsSeries.push({
      file: block.file,
      yearA: block.yearA,
      yearB: block.yearB,
      caravans: totalRow.caravans,
      motorCaravans: totalRow.motorCaravans,
      total: totalRow.total,
    });
  }

  const stockTotal = stock2020.find((r) => r.country.toLowerCase() === 'total');

  const summary = {
    source: {
      folder: baseDir,
      stockFile,
      registrationFiles: regFiles,
    },
    stock2020: {
      total: stockTotal || null,
      countries: stock2020.filter((r) => r.country.toLowerCase() !== 'total'),
    },
    registrationsTotalsSeries: totalsSeries,
  };

  fs.writeFileSync(path.join(outDir, 'europe-summary.json'), JSON.stringify(summary, null, 2), 'utf8');

  console.log('OK');
  console.log('Stock countries:', stock2020.length);
  console.log('Registration PDFs parsed:', registrations.length);
  console.log('Wrote:', path.join(outDir, 'europe-summary.json'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
