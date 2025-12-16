-- Supabase cache table for Google Directions responses (server-side only)

CREATE TABLE IF NOT EXISTS public.api_cache_directions (
  key TEXT PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  waypoints TEXT[] NOT NULL DEFAULT '{}',
  travel_mode TEXT NOT NULL,
  payload JSONB NOT NULL,
  summary JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_cache_directions_expires ON public.api_cache_directions(expires_at);

ALTER TABLE public.api_cache_directions ENABLE ROW LEVEL SECURITY;
