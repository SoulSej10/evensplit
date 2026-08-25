# EvenSplit — Handoff for remaining configuration

Paste this into a new Claude Code session opened at `D:\Projects\Claude - OpenCode\EvenSplit` to continue the work.

## What this project is

EvenSplit — a cross-platform shared-expense/budget app (Splitwise-style). Monorepo: Next.js + shadcn/ui web app, Expo React Native mobile app (consumer-fintech visual style, not admin-panel style), shared TypeScript package, Supabase backend. Full spec, data model, and a running Progress Log live in `PROJECT_PLAN.md` at the repo root — **read that file first**, it's the single source of truth and stays up to date after every session.

## Current state (as of 2026-08-25)

- **GitHub:** https://github.com/SoulSej10/evensplit (public), pushed and up to date on `main`.
- **Vercel:** deployed at https://evensplit-eight.vercel.app, Git-connected (auto-deploys on push to `main`), root directory `apps/web`. Env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are already set in the Vercel dashboard.
- **Supabase:** live project `evensplit` (ref `opwiuqodrnhkysmbukme`, region `ap-southeast-1`, free tier). Schema, RLS policies, storage buckets, and realtime are all applied via migrations in `supabase/migrations/`. Local credentials are in `apps/web/.env.local` and `apps/mobile/.env.local` (gitignored — copy `.env.example` in each app if you need to regenerate them from the Supabase dashboard: Project Settings → API).
- **Phases 0–4** (setup, auth, groups, expenses, balances/settling) and **Phase 5/6** (polish + all stretch features) are built. Verified: 21/21 shared unit tests pass, `pnpm --filter web build` clean, `tsc --noEmit` clean on both apps.

## What's left — 2 items (2 more were closed out after this doc was first written)

### 1. Run the actual EAS mobile build
Config is ready (`apps/mobile/eas.json`, `app.json`, `eas-cli` installed as a dev dependency) but no build has ever been run — that needs an interactive Expo login this session couldn't do.
```bash
cd apps/mobile
eas login
eas build --platform all --profile preview
```
You'll need an Expo account (free). Ask Claude to help troubleshoot if the build fails on native config.

### 2. Screenshots for the README / portfolio presentation
Nobody captured any yet — no simulator or browser tool was available in the sessions that built this. Run the web app locally (`pnpm --filter web dev`) or the deployed Vercel URL, and the Expo app in a simulator/device, and grab a handful of screenshots for `docs/screenshots/` (referenced from `README.md`).

## Useful references for the next session
- Supabase project ref: `opwiuqodrnhkysmbukme` — if Claude has Supabase MCP access connected (same connector you used with me), it can query/migrate directly.
- Vercel project: `evensplit` under team `jessanthonytahil10-gmailcoms-projects`.
- Git identity used for commits so far: `SoulSej10` / `jesstahil10@gmail.com`.
- `PROJECT_PLAN.md` §7 (Roadmap) and the Progress Log at the bottom are the authoritative "what's done" record — keep both updated as you go, that's the standing convention for this project.
