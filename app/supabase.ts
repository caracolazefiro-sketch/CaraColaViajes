// app/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { requireEnv } from './utils/requireEnv';

// Use requireEnv to provide a clear error when env vars are missing instead of
// relying on non-null assertions which throw at module import time.
const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);