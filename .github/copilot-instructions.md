# Copilot / AI agent instructions for CaraColaViajes

This file contains the minimal, actionable knowledge an AI coding agent needs to be productive in this repository.

- **Project type:** Next.js (app directory) + TypeScript. Main app lives under `app/`.
- **Run locally:** `npm install` then `npm run dev` (uses `next dev`).
- **Build / Start:** `npm run build` then `npm run start`.
- **Lint:** `npm run lint` (uses `eslint`).

- **Environment variables (important):**
  - `GOOGLE_MAPS_API_KEY_FIXED` — preferred server-side Google Maps key for server actions (set this in production).
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — public key used by the browser; allowed as a fallback but less secure.
  - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — used by `app/supabase.ts` when Supabase is enabled.

- **Key files to inspect for architecture & data flow:**
  - `app/actions.ts` — server action that calls Google Directions API and returns `dailyItinerary`. Important: this file contains the route segmentation algorithm and the shape of `DailyPlan` objects (dates, `isDriving`, `coordinates`, `startCoordinates`).
  - `app/supabase.ts` — creates Supabase client from env vars.
  - `app/layout.tsx` and `app/globals.css` — global layout, fonts and print-related CSS (`@media print` rules live in CSS files).
  - `hooks/` — many repo-specific hooks (`useTripPersistence.ts`, `useTripPlaces.ts`, `useTripCalculator.ts`) that show how the UI persists state and reads POIs.
  - `components/TripMap.tsx` — map marker patterns: **saved markers** (user-chosen, persistent) vs **search markers** (temporary results from Google Places).

- **Data & conventions discovered in codebase:**
  - Persistence key in browser localStorage: `caracola_trip_v1` (see `useTripPersistence`).
  - `DailyPlan` structure returned from `getDirectionsAndCost` in `app/actions.ts`. Example excerpt:
    - `date: string`, `day: number`, `from: string`, `to: string`, `distance: number`, `isDriving: boolean`, `coordinates?: {lat,lng}`, `startCoordinates?: {lat,lng}`.
  - Map markers: prefer lat/lng coordinates for lookups. Many flows rely on exact coordinates for Open-Meteo and Places nearby searches.

- **APIs & 3rd-party services:**
  - Google Maps JS API + Places + Directions + Elevation — the app expects a single Maps API key with the necessary APIs enabled.
  - Open-Meteo — used for weather lookups (no API key required).
  - Supabase — optional for future backend persistence; client constructed in `app/supabase.ts`.

- **TypeScript & build rules:**
  - `tsconfig.json` is `strict: true` and the repo intentionally fails builds on type or lint errors (see `next.config.ts` comment). Do not add `ignoreBuildErrors` — prefer fixing types.

- **Patterns for changes and PRs (what reviewers expect):**
  - Keep server-side secrets in env variables and reference them via `process.env.*` only in server contexts (e.g., `app/actions.ts` uses `process.env.GOOGLE_MAPS_API_KEY_FIXED`).
  - When touching route calculation, preserve the `DailyPlan` fields and coordinate fields — UI components expect `coordinates` and `startCoordinates` to render markers and fetch weather.
  - For UI/state work, prefer modifying hooks in `hooks/` rather than components directly; hooks centralize persistence and side-effects.

- **Debugging tips (repo-specific):**
  - To trace itinerary generation: run `getDirectionsAndCost` flow (server action). Check console logs and Google API responses (`app/actions.ts`).
  - API rate limits: `app/actions.ts` implements exponential backoff for geocoding; respect that pattern when adding more geocoding calls.
  - If map markers don't appear, confirm `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set and that the browser console shows no Maps API errors.
  - Quick env check: run `node scripts/check-env.js` to validate required keys and get actionable messages.

- **Small examples to follow**
  - Add a server-side helper: follow the pattern in `app/actions.ts` (no DOM access, use `fetch`, return structured results).
  - Create Supabase usage: import `supabase` from `app/supabase.ts` and follow client usage patterns.

If anything here is unclear or you want additional examples (more code snippets or a proposed PR template), tell me which sections to expand. I'll iterate.
