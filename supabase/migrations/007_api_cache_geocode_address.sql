-- Supabase cache table for Google Geocoding (forward: address -> lat/lng + formatted)

CREATE TABLE IF NOT EXISTS public.api_cache_geocode_address (
  key TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  language TEXT,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_cache_geocode_address_expires ON public.api_cache_geocode_address(expires_at);

ALTER TABLE public.api_cache_geocode_address ENABLE ROW LEVEL SECURITY;
