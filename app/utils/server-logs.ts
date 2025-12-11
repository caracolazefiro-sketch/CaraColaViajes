import { supabaseServer } from '../supabase';

export type ApiLogEntry = {
  trip_id?: string;
  api: 'google-directions' | 'google-geocoding' | 'open-meteo' | 'google-places' | 'other';
  method?: 'GET' | 'POST';
  url?: string;
  status?: string;
  duration_ms?: number;
  cost?: number;
  cached?: boolean;
  request?: Record<string, any>;
  response?: Record<string, any>;
  env?: 'development' | 'production';
};

export async function logApiToSupabase(entry: ApiLogEntry) {
  try {
    if (!supabaseServer) {
      // Graceful no-op when service role is not configured
      return { ok: false, reason: 'no-supabase-server' };
    }
    const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
    const payload = { ...entry, env };
    const { error } = await supabaseServer.from('api_logs').insert(payload);
    if (error) {
      return { ok: false, reason: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'unknown' };
  }
}
