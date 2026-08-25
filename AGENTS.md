# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project

GameCentral — a management dashboard for gaming lounges (hardware/PC tracking, session billing, memberships, game library, offers, leaderboards). Built as a Google AI Studio app; scaffolded with Vite + React 19 + TypeScript + Tailwind v4.

## Commands

- `npm run dev` — start Vite dev server on port 3000 (bound to `0.0.0.0`)
- `npm run build` — production build via `vite build`
- `npm run preview` — preview the production build
- `npm run lint` — type-check only (`tsc --noEmit`); there is no separate lint tool configured
- `npm run clean` — removes `dist` and `server.js`

There is no test runner configured in this repo.

## Architecture

This is a single-page React app with **no backend and no routing library** — everything lives in one component tree with in-memory state.

- `src/App.tsx` is the composition root: it owns *all* application state (`pcs`, `customers`, `sessions`, `games`, `offers`, `leaderboard`, `settings`, `logs`) via `useState`, seeded from `src/data/mockData.ts`. There is no persistence layer — a page refresh resets everything to the mock data.
- View components under `src/components/` (`DashboardView`, `LivePCsView`, `SessionsView`, `CustomersView`, `GameLibraryView`, `OffersView`, `LeaderboardsView`, `SettingsView`) are presentational/controlled — they receive state and mutation callbacks as props from `App.tsx` and contain no state of their own beyond local UI state. `activeTab` in `App.tsx` acts as the router, conditionally rendering one view at a time inside `<main>`.
- All state mutations flow through handlers defined in `App.tsx` (e.g. `handleUpdatePCStatus`, `handleStopSession`, `handleExtendSession`, `handleRegisterCustomer`, `handleAddBalance`, `handleCreateOffer`, etc.), each of which also appends to the `logs` activity feed via `addLog`. When adding a new mutation, follow this pattern: update the relevant `set*` state, and call `addLog` with an appropriate `type`/`severity`.
- Two `setInterval`-driven `useEffect`s in `App.tsx` simulate real-time behavior:
  - A 1s ticker decrements `timeRemaining` on in-use PCs and auto-stops the session (via `handleStopSession`) when it hits zero.
  - A 4s ticker advances `updateProgress` on games with `status === "Updating"` until they reach `"Ready"`.
  Because these effects close over `pcs`/`games`, use the functional `setState` form (`setPCs(prev => ...)`) when adding related logic to avoid stale closures.
- Domain types (`PC`, `PCStatus`, `PCGroup`, `Customer`, `Session`, `Game`, `Offer`, `LeaderboardEntry`, `SystemSettings`, `ActivityLog`) are centralized in `src/types.ts` — extend these first when adding a field, then update `mockData.ts` and the consuming view.
- Hourly billing rate is derived from `PCGroup` via `getHourlyRateForPC` in `App.tsx`, reading from `settings` (`vipRate`, `standardRate`, `consoleRate`, `streamingRate`) rather than being hardcoded per PC.
- `package.json` lists `@google/genai` and `express`/`dotenv` as dependencies and `metadata.json` declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`, but there is currently no Gemini API call or server code anywhere under `src/` — treat any AI-integration work as greenfield rather than assuming existing wiring.
- Path alias `@/*` resolves to the repo root (configured in both `tsconfig.json` and `vite.config.ts`).
