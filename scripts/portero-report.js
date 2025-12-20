/*
  Portero report for google-places audits stored in Supabase api_logs.

  Usage:
    node scripts/portero-report.js --tripId "trip-..."
    node scripts/portero-report.js --tripId "trip-..." --limit 200

  Notes:
  - Loads env from .env.local if present.
  - Requires SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
  - Aggregates response.portero.* for api='google-places'.
*/

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2] ?? '';
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const k = a.slice(2);
    const v = argv[i + 1];
    if (v == null || v.startsWith('--')) {
      out[k] = true;
    } else {
      out[k] = v;
      i++;
    }
  }
  return out;
}

function safeNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function mergeCounts(target, src) {
  if (!src || typeof src !== 'object') return;
  for (const [k, v] of Object.entries(src)) {
    target[k] = (target[k] || 0) + safeNumber(v);
  }
}

function sortCounts(obj) {
  return Object.entries(obj)
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))
    .map(([k, v]) => ({ key: k, count: v }));
}

async function main() {
  loadDotEnv(path.join(process.cwd(), '.env.local'));

  const args = parseArgs(process.argv);
  const tripId = args.tripId;
  const limit = Math.min(500, Math.max(1, parseInt(String(args.limit || '200'), 10) || 200));

  if (!tripId) {
    throw new Error('Missing --tripId');
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY in env/.env.local');
  }

  const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: logs, error } = await sb
    .from('api_logs')
    .select('created_at, status, cached, cost, request, response')
    .eq('trip_id', tripId)
    .eq('api', 'google-places')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const perSupercat = {};
  const overall = {
    logs: 0,
    auditedLogs: 0,
    input: 0,
    kept: 0,
    discarded: 0,
    noPlaceId: 0,
    duplicatePlaceId: 0,
    reasonsCount: {},
    keptAsCount: {},
    auditModeCounts: {},
    auditSourceCounts: {},
    auditEnvCounts: {},
  };

  for (const row of logs || []) {
    overall.logs++;
    const req = row.request || {};
    const res = row.response || {};

    const supercat = String(req.supercat ?? res.supercat ?? 'unknown');

    if (!perSupercat[supercat]) {
      perSupercat[supercat] = {
        logs: 0,
        auditedLogs: 0,
        input: 0,
        kept: 0,
        discarded: 0,
        noPlaceId: 0,
        duplicatePlaceId: 0,
        reasonsCount: {},
        keptAsCount: {},
      };
    }

    perSupercat[supercat].logs++;

    const auditMode = String(req.porteroAuditMode ?? res.porteroAuditMode ?? 'unknown');
    const auditSource = String(req.porteroAuditSource ?? res.porteroAuditSource ?? 'unknown');
    const auditEnv = req.porteroAuditEnv == null ? 'null' : String(req.porteroAuditEnv);

    overall.auditModeCounts[auditMode] = (overall.auditModeCounts[auditMode] || 0) + 1;
    overall.auditSourceCounts[auditSource] = (overall.auditSourceCounts[auditSource] || 0) + 1;
    overall.auditEnvCounts[auditEnv] = (overall.auditEnvCounts[auditEnv] || 0) + 1;

    const portero = res.portero;
    if (!portero || typeof portero !== 'object') continue;

    overall.auditedLogs++;
    perSupercat[supercat].auditedLogs++;

    overall.input += safeNumber(portero.input);
    overall.kept += safeNumber(portero.kept);
    overall.discarded += safeNumber(portero.discarded);
    overall.noPlaceId += safeNumber(portero.noPlaceId);
    overall.duplicatePlaceId += safeNumber(portero.duplicatePlaceId);

    perSupercat[supercat].input += safeNumber(portero.input);
    perSupercat[supercat].kept += safeNumber(portero.kept);
    perSupercat[supercat].discarded += safeNumber(portero.discarded);
    perSupercat[supercat].noPlaceId += safeNumber(portero.noPlaceId);
    perSupercat[supercat].duplicatePlaceId += safeNumber(portero.duplicatePlaceId);

    mergeCounts(overall.reasonsCount, portero.reasonsCount);
    mergeCounts(overall.keptAsCount, portero.keptAsCount);

    mergeCounts(perSupercat[supercat].reasonsCount, portero.reasonsCount);
    mergeCounts(perSupercat[supercat].keptAsCount, portero.keptAsCount);
  }

  const newestAt = (logs && logs[0] && logs[0].created_at) ? logs[0].created_at : null;
  const oldestAt = (logs && logs[logs.length - 1] && logs[logs.length - 1].created_at) ? logs[logs.length - 1].created_at : null;

  console.log('\nPORTERO REPORT (google-places)');
  console.log('tripId:', tripId);
  console.log('logs fetched:', overall.logs, 'limit:', limit);
  console.log('time window:', oldestAt, '→', newestAt);
  console.log('audited logs (response.portero present):', overall.auditedLogs);

  console.log('\nAUDIT MODE COUNTS:', sortCounts(overall.auditModeCounts));
  console.log('AUDIT SOURCE COUNTS:', sortCounts(overall.auditSourceCounts));
  console.log('AUDIT ENV COUNTS:', sortCounts(overall.auditEnvCounts));

  console.log('\nTOTALS (sum across audited logs):', {
    input: overall.input,
    kept: overall.kept,
    discarded: overall.discarded,
    noPlaceId: overall.noPlaceId,
    duplicatePlaceId: overall.duplicatePlaceId,
  });

  console.log('\nTOP REASONS (overall):');
  for (const r of sortCounts(overall.reasonsCount).slice(0, 25)) {
    console.log('-', r.key, r.count);
  }

  console.log('\nKEPT AS (overall):');
  for (const r of sortCounts(overall.keptAsCount)) {
    console.log('-', r.key, r.count);
  }

  console.log('\nBY SUPERCAT:');
  for (const [supercat, stats] of Object.entries(perSupercat).sort((a, b) => String(a[0]).localeCompare(String(b[0])))) {
    console.log(`\n- supercat=${supercat}`);
    console.log('  logs:', stats.logs, 'audited:', stats.auditedLogs);
    if (stats.auditedLogs > 0) {
      console.log('  totals:', {
        input: stats.input,
        kept: stats.kept,
        discarded: stats.discarded,
        noPlaceId: stats.noPlaceId,
        duplicatePlaceId: stats.duplicatePlaceId,
      });
      const topReasons = sortCounts(stats.reasonsCount).slice(0, 10);
      if (topReasons.length) {
        console.log('  topReasons:', topReasons);
      }
    }
  }
}

main().catch((e) => {
  console.error('ERROR:', e && e.message ? e.message : String(e));
  process.exit(1);
});
