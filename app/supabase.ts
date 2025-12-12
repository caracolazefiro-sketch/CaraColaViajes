// app/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Supabase is optional - only create client if env vars are provided
const supabaseUrlPublic = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isValidHttpUrl(u: string | null | undefined): boolean {
  if (!u) return false;
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Server-side: prefer private URL and service role key when available
const supabaseUrlServer = process.env.SUPABASE_URL || supabaseUrlPublic || null;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

export const supabase = (isValidHttpUrl(supabaseUrlPublic) && !!supabaseAnonKey)
  ? createClient(supabaseUrlPublic as string, supabaseAnonKey as string)
  : null;

// Server-only client (bypasses RLS via service role). DO NOT expose to client.
export const supabaseServer = (isValidHttpUrl(supabaseUrlServer) && !!supabaseServiceRoleKey)
  ? createClient(supabaseUrlServer as string, supabaseServiceRoleKey as string)
  : null;