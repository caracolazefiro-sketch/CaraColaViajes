#!/usr/bin/env node
// scripts/check-env.js
// Simple environment-check script. Exits with 0 when required vars are set,
// exits 1 and prints helpful messages when missing.

const requiredEither = ['GOOGLE_MAPS_API_KEY_FIXED', 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'];
const supabaseVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];

function ok(msg) { console.log('\x1b[32m%s\x1b[0m', msg); }
function warn(msg) { console.log('\x1b[33m%s\x1b[0m', msg); }
function err(msg) { console.error('\x1b[31m%s\x1b[0m', msg); }

let hasError = false;

// Check alternative requirement: at least one Maps key
if (!process.env[requiredEither[0]] && !process.env[requiredEither[1]]) {
  err("Missing Google Maps API key. Set either 'GOOGLE_MAPS_API_KEY_FIXED' (server) or 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'.");
  hasError = true;
} else {
  ok('Google Maps API key: OK (server key preferred)');
  if (process.env[requiredEither[1]] && !process.env[requiredEither[0]]) {
    warn("Note: Using public Maps key only. It's recommended to set 'GOOGLE_MAPS_API_KEY_FIXED' for server requests.");
  }
}

// Supabase variables are optional if you don't use Supabase, but warn if one is missing
if (process.env[supabaseVars[0]] && process.env[supabaseVars[1]]) {
  ok('Supabase env vars: OK');
} else if (process.env[supabaseVars[0]] || process.env[supabaseVars[1]]) {
  warn('Partial Supabase configuration detected. Both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are recommended.');
}

if (hasError) {
  if (process.env.CI) {
    // If the repository provided secrets to the workflow (they will appear
    // in process.env), treat this run as strict and fail when missing vars.
    const secretKeys = [
      'GOOGLE_MAPS_API_KEY_FIXED',
      'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];
    const hasSecrets = secretKeys.some((k) => !!process.env[k]);

    if (hasSecrets) {
      err('CI: required environment variables appear to be configured but some are missing — failing.');
      process.exit(1);
    }

    // No secrets provided in CI: warn but don't fail (keeps PRs green for forks).
    warn("CI detected but no secrets provided; skipping failure. To enforce checks, add required secrets to repository settings.");
    process.exit(0);
  }

  process.exit(1);
}

process.exit(0);
