import 'server-only';

import { createClient } from '@supabase/supabase-js';

function isValidHttpUrl(u: string | null | undefined): boolean {
  if (!u) return false;
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Server-side: prefer SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Fallback to NEXT_PUBLIC_SUPABASE_URL if you only have one URL.
const supabaseUrlServer = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

export const supabaseServer = (isValidHttpUrl(supabaseUrlServer) && !!supabaseServiceRoleKey)
  ? createClient(supabaseUrlServer as string, supabaseServiceRoleKey as string)
  : null;
