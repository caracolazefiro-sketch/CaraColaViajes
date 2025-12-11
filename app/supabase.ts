// app/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Supabase is optional - only create client if env vars are provided
const supabaseUrlPublic = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-side: prefer private URL and service role key when available
const supabaseUrlServer = process.env.SUPABASE_URL || supabaseUrlPublic || null;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

export const supabase = (supabaseUrlPublic && supabaseAnonKey)
  ? createClient(supabaseUrlPublic, supabaseAnonKey)
  : null;

// Server-only client (bypasses RLS via service role). DO NOT expose to client.
export const supabaseServer = (supabaseUrlServer && supabaseServiceRoleKey)
  ? createClient(supabaseUrlServer, supabaseServiceRoleKey)
  : null;