-- Supabase cache table for Google Places Details (server-side only)

CREATE TABLE IF NOT EXISTS public.api_cache_places_details (
  key TEXT PRIMARY KEY,
  place_id TEXT NOT NULL,
  fields TEXT NOT NULL,
  language TEXT,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_cache_places_details_expires ON public.api_cache_places_details(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_cache_places_details_place_id ON public.api_cache_places_details(place_id);

ALTER TABLE public.api_cache_places_details ENABLE ROW LEVEL SECURITY;
