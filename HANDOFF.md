# SplitEven — Handoff for remaining configuration

Paste this into a new Claude Code session opened at `D:\Projects\Claude - OpenCode\EvenSplit` to continue the work.

## What this project is

SplitEven (renamed from the working name "EvenSplit" on 2026-08-25) — a cross-platform shared-expense/budget app (Splitwise-style). Monorepo: Next.js + shadcn/ui web app, Expo React Native mobile app (consumer-fintech visual style, not admin-panel style), shared TypeScript package, Supabase backend. Full spec, data model, and a running Progress Log live in `PROJECT_PLAN.md` at the repo root — **read that file first**, it's the single source of truth and stays up to date after every session.

## Current state (as of 2026-08-25)

- **GitHub:** https://github.com/SoulSej10/evensplit (public), pushed and up to date on `main`. Repo slug/package names stayed `evensplit` internally (npm workspace package `@evensplit/shared`, Supabase project name, EAS project slug) to avoid a large mechanical refactor with no user-visible benefit — only user-facing branding (name, logo, colors) was renamed to SplitEven.
- **Vercel:** deployed at https://evensplit-eight.vercel.app, Git-connected (auto-deploys on push to `main`), root directory `apps/web`. Env vars already set.
- **Supabase:** live project (ref `opwiuqodrnhkysmbukme`, region `ap-southeast-1`, free tier). Schema, RLS, storage, realtime, cron-scheduled recurring expenses, and cross-device push delivery are all live.
- **Mobile EAS:** Android preview builds work end-to-end (`@jessanthonytahil10/evensplit` EAS project, credentials auto-generated). iOS not attempted — needs an Apple Developer account.
- **Branding:** renamed to SplitEven, new S/E monogram logo (`apps/web/public/logo.svg`, also the web favicon at `apps/web/src/app/icon.svg`, and rasterized into all mobile app icon slots in `apps/mobile/assets/`), new color palette (`#35D6B5` primary family, `#0A0A0A` dark background) applied to both web (`globals.css`) and mobile (`tailwind.config.js`).
- All of Phases 0–6 are built. Verified: shared unit tests pass, `pnpm --filter web build` clean, `tsc --noEmit` clean on both apps.

## What's left

### Screenshots for the README / portfolio presentation
Still not captured — no simulator or browser screenshot tool has been available in any session so far. Run the web app locally (`pnpm --filter web dev`) or hit the deployed Vercel URL, and the Expo app in a simulator/device, and grab a handful of screenshots for `docs/screenshots/` (referenced from `README.md`).

## Useful references for the next session
- Supabase project ref: `opwiuqodrnhkysmbukme` — if Claude has Supabase MCP access connected, it can query/migrate directly.
- Vercel project: `evensplit` under team `jessanthonytahil10-gmailcoms-projects`.
- EAS/Expo account: `jessanthonytahil10`.
- Git identity used for commits so far: `SoulSej10` / `jesstahil10@gmail.com`.
- `PROJECT_PLAN.md` §7 (Roadmap) and the Progress Log at the bottom are the authoritative "what's done" record — keep both updated as you go, that's the standing convention for this project.
