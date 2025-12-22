// app/supabase.ts
// Client-side Supabase (anon key). Keep server-only service role client OUT of this module.
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

export const supabase = (isValidHttpUrl(supabaseUrlPublic) && !!supabaseAnonKey)
  ? createClient(supabaseUrlPublic as string, supabaseAnonKey as string)
  : null;