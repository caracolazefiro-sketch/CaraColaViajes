-- Supabase cache tables for reducing paid API calls (server-side only)

-- 1) Reverse geocoding cache
CREATE TABLE IF NOT EXISTS public.api_cache_geocoding (
  key TEXT PRIMARY KEY,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  city_name TEXT NOT NULL,
  resolved_from TEXT,
  payload JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_cache_geocoding_expires ON public.api_cache_geocoding(expires_at);

ALTER TABLE public.api_cache_geocoding ENABLE ROW LEVEL SECURITY;

-- 2) Places supercat cache (nearbysearch aggregated response)
CREATE TABLE IF NOT EXISTS public.api_cache_places_supercat (
  key TEXT PRIMARY KEY,
  supercat INTEGER NOT NULL,
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  radius INTEGER NOT NULL,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_cache_places_expires ON public.api_cache_places_supercat(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_cache_places_supercat ON public.api_cache_places_supercat(supercat);

ALTER TABLE public.api_cache_places_supercat ENABLE ROW LEVEL SECURITY;
