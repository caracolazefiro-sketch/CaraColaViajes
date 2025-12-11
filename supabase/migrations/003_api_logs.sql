-- API Logs table for server-side logging (production-ready with service role)
-- Run this in Supabase SQL editor or via migrations.

CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  env TEXT NOT NULL DEFAULT 'development', -- 'development' | 'production'
  trip_id TEXT,
  api TEXT NOT NULL, -- google-directions | google-geocoding | open-meteo | google-places | other
  method TEXT NOT NULL DEFAULT 'GET',
  url TEXT,
  status TEXT,
  duration_ms INTEGER,
  cost NUMERIC(10,3),
  cached BOOLEAN DEFAULT FALSE,
  request JSONB,
  response JSONB
);

-- Indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON public.api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_trip ON public.api_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_api ON public.api_logs(api);

-- Enable RLS. We rely on service role for inserts/reads from server.
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- (Optional) Read policy for authenticated users if you want a public viewer with user auth
-- CREATE POLICY "Authenticated can read api_logs"
--   ON public.api_logs FOR SELECT TO authenticated USING (true);

-- (Optional) Insert policy if you plan to insert with anon key (not recommended)
-- CREATE POLICY "Service inserts only" ON public.api_logs FOR INSERT TO service_role WITH CHECK (true);
