-- Create user_trips table for Trip Persistence
-- Execute this in Supabase SQL Editor (https://app.supabase.com/project/[PROJECT_ID]/sql)

CREATE TABLE IF NOT EXISTS public.user_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  trip_name TEXT NOT NULL,
  trip_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS user_trips_user_id_created_at_idx ON public.user_trips(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_trips_user_id_idx ON public.user_trips(user_id);

-- Enable RLS (Row Level Security) if needed
ALTER TABLE public.user_trips ENABLE ROW LEVEL SECURITY;

-- Optional: Create a policy to allow users to see only their own trips
-- This requires authentication - for now, we'll skip it for demo purposes
-- CREATE POLICY "Users can see their own trips"
--   ON public.user_trips
--   FOR SELECT
--   USING (auth.uid()::text = user_id);
