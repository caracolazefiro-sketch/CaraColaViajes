-- Cache for Google Elevation API (encoded polyline + samples)

CREATE TABLE IF NOT EXISTS public.api_cache_elevation (
  key TEXT PRIMARY KEY,
  polyline TEXT NOT NULL,
  samples INTEGER NOT NULL,
  payload JSONB,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_cache_elevation_expires ON public.api_cache_elevation(expires_at);

ALTER TABLE public.api_cache_elevation ENABLE ROW LEVEL SECURITY;
