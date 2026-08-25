# EvenSplit

A cross-platform (mobile + web) shared-expense and budget app for splitting costs among groups — roommates, trips, couples, households — and tracking who owes whom in real time, with a clean settle-up flow.

See [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) for the full spec: data model, brand/style guide, screens, and roadmap. That file is the living source of truth for scope and progress.

## Stack

| Layer | Choice |
|---|---|
| Mobile | Expo (React Native) + Expo Router + NativeWind, TypeScript |
| Web | Next.js 16 (App Router) + shadcn/ui + Tailwind CSS v4, TypeScript |
| Backend | Supabase (Postgres + Auth + Realtime + Storage) |
| Shared logic | `packages/shared` — Supabase client factory, zod schemas, types, balance-calculation business logic (unit tested with Vitest) |
| Monorepo | Turborepo + pnpm workspaces |
| Data fetching | TanStack Query + Supabase Realtime subscriptions |

## Repo structure

```
apps/
  web/       Next.js 16 app (App Router, shadcn/ui)
  mobile/    Expo app (Expo Router, NativeWind)
packages/
  shared/    Supabase client, zod schemas, types, balances.ts (+ tests)
supabase/
  migrations/  SQL schema, RLS policies, storage buckets, realtime config
```

## Live deployment

- **Web:** https://evensplit-eight.vercel.app — Git-connected to this repo's `main` branch on Vercel, auto-deploys on every push.
- **Database:** live Supabase project (`evensplit`, `ap-southeast-1`), schema/RLS/Realtime/storage all applied.
- **Mobile:** not yet built/submitted via EAS — see [Mobile builds (EAS)](#mobile-builds-eas) below.

## Prerequisites

- Node.js 20.9+ and pnpm (`npm install -g pnpm`)
- A Supabase project (see [Supabase setup](#supabase-setup) below) — **required before auth, groups, expenses, or anything data-backed will work**. Until it's configured, the apps build and typecheck fine, but any Supabase call will throw a clear "missing Supabase credentials" error.
- For mobile: the Expo Go app on your phone, or an iOS/Android simulator

## Getting started

```bash
pnpm install
```

### Web

```bash
cp apps/web/.env.example apps/web/.env.local
# fill in NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
pnpm --filter web dev
```

### Mobile

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
# fill in EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
pnpm --filter mobile start
```

Scan the QR code with Expo Go, or press `i` / `a` for a simulator.

### Shared package tests

```bash
pnpm --filter @evensplit/shared test
```

## Supabase setup

**If you're Sej working on the existing live project:** the schema is already applied — just grab the credentials.
1. Open the `evensplit` project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to Project Settings → API and copy the Project URL and anon/public key.
3. `cp apps/web/.env.example apps/web/.env.local` and `cp apps/mobile/.env.example apps/mobile/.env.local`, then paste the values in (never commit `.env.local` — both are gitignored).
4. For the deployed web app, the same two values are already set in Vercel → Project Settings → Environment Variables; no action needed there unless they rotate.

**If you're setting up a fresh Supabase project from scratch:**
1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL files in `supabase/migrations/` **in order** against your project (via the SQL editor, or the Supabase CLI: `supabase db push`). They create every table in the data model, row-level security policies scoped by group membership, storage buckets for avatars/receipts, Realtime on the relevant tables, and (migration `0006`) the recurring-expense materialization columns + `push_tokens` table for Phase 6 stretch features.
3. In your Supabase project's Authentication settings, enable the Google OAuth provider if you want Google sign-in to work (email/password works out of the box).
4. Copy the Project URL and anon/public key from Project Settings → API into `apps/web/.env.local` and `apps/mobile/.env.local` (see `.env.example` in each app — never commit `.env.local`).
5. (Optional, Phase 6) Deploy `supabase/functions/materialize-recurring-expenses` (`supabase functions deploy materialize-recurring-expenses`) if you want recurring expenses to actually materialize — see that function's header comment for the still-open scheduling TODO.

No credentials are hardcoded anywhere in the codebase; both apps read them from environment variables at runtime.

## Mobile builds (EAS)

`apps/mobile/eas.json` defines `development`/`preview`/`production` build profiles. EAS builds were **not** run as part of this pass (no `eas-cli` login/Expo account session was available). To produce an actual build:

```bash
cd apps/mobile
npx eas-cli login                                   # log in with Sej's Expo account
# then set app.json's "owner" field to that Expo username (currently a placeholder)
npx eas-cli build --platform all --profile preview   # internal/TestFlight-style build
```

`eas-cli` is already installed as a dev dependency (`pnpm --filter mobile add -D eas-cli` was run so it's available via `npx`/workspace scripts without a global install).

## Screenshots

Not included in this pass — capturing them needs either a running iOS/Android simulator (mobile) or a browser automation tool pointed at a running `next dev` server (web), neither of which was available in this session. See the Progress Log in `PROJECT_PLAN.md`.

## Scripts

| Command | Does |
|---|---|
| `pnpm --filter web dev` | Run the web app locally |
| `pnpm --filter web build` | Production build (also typechecks) |
| `pnpm --filter mobile start` | Start the Expo dev server |
| `pnpm --filter @evensplit/shared test` | Run balance-math unit tests |
| `pnpm --filter <app> typecheck` | `tsc --noEmit` for a given app/package |

## Status

Phases 0–4 (setup, auth, groups, expenses, balances/settling) are built and live for both web and mobile. Phase 5 (dark mode, empty/loading/error states, Vercel deploy, EAS config) and Phase 6 (debt simplification, push notification stub, recurring expenses, CSV export, spending charts) are largely built — see the Progress Log in `PROJECT_PLAN.md` for exactly what's done vs stubbed/blocked.
