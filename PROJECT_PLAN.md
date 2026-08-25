# EvenSplit — Shared Expense & Budget App

> **Working name:** EvenSplit *(placeholder — rename freely, then find/replace across the repo)*
> **Status:** 🟢 Phases 0–4 built and live; Phase 5 done except EAS build execution + screenshots; Phase 6 fully built and live, including cron-scheduled recurring expenses and cross-device push delivery — see Progress Log
> **Last updated:** 2026-08-25
> **Owner:** Sej

This is a **living document**. Every time a milestone is completed, changed, or descoped, update the relevant checklist item and add an entry to the [Progress Log](#progress-log) at the bottom. This file is the single source of truth for scope, data model, and roadmap — keep it in the repo root as `PROJECT_PLAN.md`.

---

## 1. Elevator Pitch

A cross-platform app (mobile + web) for splitting shared expenses among groups of people — roommates, trips, couples, households — and tracking who owes whom in real time, with a clean settle-up flow. Built to demonstrate: relational data modeling, real-time sync, multi-platform shared logic, and clean UX for a genuinely useful tool.

**Problem it solves:** Manually tracking shared costs (group trips, shared rent/utilities, recurring shared subscriptions) via chat threads or spreadsheets is error-prone and nobody knows the real balance until someone does the math.

**Target user:** Small groups of 2–10 people (roommates, couples, friend groups, trip groups) who share recurring or one-off expenses.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Mobile | React Native + Expo | Shares TypeScript + business logic with web |
| Web | Next.js (React) | Auth dashboard + full app parity (not just a viewer) |
| Backend | Supabase | Postgres + Auth + Realtime (Postgres change subscriptions) + Storage (avatars/receipts) |
| Shared logic | `packages/shared` (TS) | Balance calculation, types, Supabase client, validation schemas (zod) |
| Monorepo tooling | Turborepo + pnpm workspaces | `apps/mobile`, `apps/web`, `packages/shared`, `packages/ui` (optional) |
| Styling | Mobile: NativeWind (Tailwind for RN) · Web: Tailwind CSS + **shadcn/ui** | Shared design tokens (see §5); web components sourced from shadcn, not a generic admin-panel kit |
| State/data fetching | TanStack Query + Supabase Realtime subscriptions | Cache + live updates |
| Push notifications | Expo Notifications | Phase 3+ |
| Deployment | Mobile: Expo EAS Build/Submit · Web: **Vercel (Git-connected, auto-deploy on push)** · DB: Supabase Cloud | |
| Source control | **GitHub — public repo** | Created via `gh` CLI under account SoulSej10 |
| Testing | Vitest (shared logic unit tests, esp. balance math) + Playwright (web e2e, stretch) | |

---

## 3. Brand & Style Guide

*(Placeholder direction — adjust to taste before building UI. Keep this section updated as the final source of truth for colors/type so mobile and web never drift.)*

### 3.1 Personality
Calm, trustworthy, a little playful. Money apps should feel *reassuring*, not corporate/cold and not gimmicky. Think "friendly ledger," not "bank app."

### 3.2 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#2F6F5E` (deep teal-green) | Primary actions, brand accents |
| `primary-light` | `#E4F2EE` | Backgrounds, chips |
| `positive` | `#2E9E6B` | "You are owed" states |
| `negative` | `#D95F5F` | "You owe" states |
| `neutral-900` | `#1A1D1B` | Primary text |
| `neutral-500` | `#6B7169` | Secondary text |
| `neutral-100` | `#F4F5F3` | App background |
| `surface` | `#FFFFFF` | Cards |
| `warning` | `#E0A63A` | Pending/unsettled flags |

Dark mode: invert neutrals (`neutral-900` → background, `surface` → `#22271F`), keep `positive`/`negative`/`primary` roughly as-is with slightly reduced saturation.

### 3.3 Typography
- **Font:** Inter (or system font fallback: `-apple-system`, `Roboto`) — free, geometric, reads well at small sizes for numbers.
- **Scale:** 32/24/18/16/14/12 px — display / h1 / h2 / body / caption / micro.
- Numbers (currency amounts) use tabular figures and slightly bolder weight than surrounding text so balances scan quickly.

### 3.4 Component principles
- Rounded corners (12–16px), soft shadows, no harsh borders.
- Amounts owed = red-leaning, amounts you're owed = green-leaning, consistently everywhere (list rows, group cards, detail screens).
- Primary CTA is always a single, unmistakable button per screen (e.g. "Add Expense," "Settle Up").

### 3.5 Platform-specific direction (important — do not default to the house style)

**Web:** Built on **shadcn/ui** (Radix + Tailwind), themed with the tokens in §3.2. Not a generic dashboard/admin-panel look.

**Mobile:** Explicitly **not** the standard admin/back-office mobile pattern used on StocklaneOS, TMS, or PGB Logistics (dense tables, form-heavy screens, utilitarian nav). EvenSplit mobile should read as **consumer fintech** — closer to Splitwise / Cash App / Revolut:
- Big rounded cards with soft elevation, generous whitespace, bold tabular numerals for money
- Bottom-sheet modals for Add Expense / Settle Up instead of full-screen forms wherever it fits
- Floating / pill-shaped tab bar rather than a flat bottom nav bar
- Minimal chrome — content and numbers are the UI, not borders and labels
- Motion: subtle spring transitions on balance changes, list inserts, settle-up confirmation

---

## 4. Data Model

### 4.1 Entity list

| Table | Purpose |
|---|---|
| `users` | Account profile (extends Supabase `auth.users`) |
| `groups` | A shared context (trip, household, etc.) |
| `group_members` | Join table: users ↔ groups, with role |
| `expenses` | A single expense event |
| `expense_shares` | How one expense is split across members |
| `settlements` | A payment made between two members to reduce a balance |
| `invites` | Pending invitations to join a group |

### 4.2 Schema (fields + relationships)

**`users`**
| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | = `auth.users.id` |
| `display_name` | text | |
| `avatar_url` | text, nullable | Supabase Storage path |
| `default_currency` | text | ISO 4217, e.g. `PHP`, `USD` |
| `created_at` | timestamptz | |

**`groups`**
| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `name` | text | e.g. "Baguio Trip 2026" |
| `icon` | text, nullable | emoji or icon key |
| `currency` | text | group-level default currency |
| `created_by` | uuid (FK → users.id) | |
| `created_at` | timestamptz | |
| `archived_at` | timestamptz, nullable | soft-archive instead of delete |

**`group_members`**
| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `group_id` | uuid (FK → groups.id) | |
| `user_id` | uuid (FK → users.id) | |
| `role` | enum: `owner`, `member` | owner can archive/delete group, remove members |
| `joined_at` | timestamptz | |
| — | | **Unique constraint:** (`group_id`, `user_id`) |

**`expenses`**
| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `group_id` | uuid (FK → groups.id) | |
| `description` | text | e.g. "Grab to airport" |
| `amount` | numeric(12,2) | total amount, in group currency |
| `currency` | text | usually = group currency; per-expense override allowed |
| `paid_by` | uuid (FK → users.id) | who fronted the money |
| `split_type` | enum: `equal`, `exact`, `percentage`, `shares` | drives how `expense_shares` are computed |
| `category` | text, nullable | e.g. `food`, `transport`, `lodging` (for future reporting) |
| `expense_date` | date | when it happened (not necessarily created_at) |
| `receipt_url` | text, nullable | Supabase Storage |
| `created_by` | uuid (FK → users.id) | |
| `created_at` | timestamptz | |
| `is_recurring` | boolean | stretch feature flag |
| `recurrence_rule` | text, nullable | e.g. RRULE string, stretch |

**`expense_shares`**
| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `expense_id` | uuid (FK → expenses.id) | |
| `user_id` | uuid (FK → users.id) | the member who owes this share |
| `share_amount` | numeric(12,2) | this member's portion of the expense |
| — | | **Invariant:** SUM(share_amount) across an expense = expenses.amount |

**`settlements`**
| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `group_id` | uuid (FK → groups.id) | |
| `from_user` | uuid (FK → users.id) | person paying |
| `to_user` | uuid (FK → users.id) | person receiving |
| `amount` | numeric(12,2) | |
| `method` | text, nullable | e.g. "GCash", "Cash" — free text |
| `settled_at` | timestamptz | |
| `note` | text, nullable | |

**`invites`**
| Field | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `group_id` | uuid (FK → groups.id) | |
| `invited_email` | text, nullable | for email invites |
| `invite_code` | text | shareable code/link token |
| `created_by` | uuid (FK → users.id) | |
| `expires_at` | timestamptz | |
| `accepted_by` | uuid, nullable (FK → users.id) | |

### 4.3 Relationships (summary)

```
users 1---* group_members *---1 groups
groups 1---* expenses
expenses 1---* expense_shares *---1 users
groups 1---* settlements  (settlements.from_user / to_user → users)
groups 1---* invites
```

### 4.4 Core derived logic: balance calculation

This is the heart of the app's business logic and should live in `packages/shared/balances.ts`, unit-tested independently of any UI.

**Per-user balance within a group:**
```
balance(user, group) =
    SUM(expenses.amount where expenses.paid_by = user)          // what they fronted
  − SUM(expense_shares.share_amount where expense_shares.user_id = user)  // what they owe across all expenses
  + SUM(settlements.amount where settlements.to_user = user)    // payments received
  − SUM(settlements.amount where settlements.from_user = user)  // payments made
```
Positive balance = group owes this user. Negative = user owes the group.

> **Implementation correction:** the `+`/`−` signs on the settlement terms above, read literally, never let a fully-settled pair reach a zero balance (verified with a failing unit test during implementation — see `packages/shared/src/__tests__/balances.test.ts`). The actual implementation in `packages/shared/balances.ts` inverts those two terms (a settlement *received* reduces balance, a settlement *paid* increases it) so that settling up correctly zeroes things out. This section's formula is left as originally written for context; treat the code + tests as authoritative.

**Pairwise simplification (stretch goal):** reduce a group's full debt graph to the minimum number of transactions needed to zero everyone out (classic "debt simplification" / min-cash-flow problem — greedy max-debtor-to-max-creditor algorithm). Good, resume-worthy algorithmic feature.

---

## 5. Features & Sub-Features

### 5.1 Authentication
- [x] Email/password sign up & login (Supabase Auth)
- [x] Google OAuth sign-in
- [x] Password reset flow
- [x] Profile setup on first login (display name, avatar, default currency)

### 5.2 Groups
- [x] Create group (name, icon, currency)
- [x] Invite members via shareable link/code
- [x] Join group via invite link
- [x] View group member list
- [x] Remove member (owner only)
- [x] Archive group (soft delete)
- [x] Leave group

### 5.3 Expenses
- [x] Add expense: description, amount, payer, date, category
- [x] Split method: equal / exact amounts / percentages / shares (weighted)
- [x] Edit expense
- [x] Delete expense (with confirmation, recalculates balances)
- [x] Attach receipt photo (Supabase Storage)
- [x] Filter/search expenses by category, date range, member *(web: search + category filter; date-range filter not separately implemented)*

### 5.4 Balances & Settling
- [x] Real-time per-group balance view ("You owe / You are owed") — via Supabase Realtime subscriptions
- [x] Per-member breakdown (who owes whom, how much)
- [x] Settle up: record a payment between two members
- [x] Settlement history — surfaced via the Activity tab (chronological feed), no separate dedicated screen
- [x] Debt simplification view (stretch) — "All debts"/"Simplified" toggle on the Balances tab, web + mobile, backed by `simplifyDebts()` in `packages/shared`

### 5.5 Activity & Notifications
- [x] Activity feed per group (expense added, settlements) — no dedicated edit/delete audit trail since the schema (§4.2) has no activity-log table; feed is derived live from `expenses`/`settlements`
- [x] Push notification on new expense / settlement (stretch, Phase 3+) — **fully live.** Mobile fires an immediate local notification on the current user's own add-expense/settle-up actions (`apps/mobile/src/lib/notifications.ts`). Cross-device delivery to *other* group members is now wired end-to-end: `notify-group-members` Edge Function (deployed live) looks up group members' `push_tokens` and calls the Expo push API; Postgres triggers `on_expense_created_notify`/`on_settlement_created_notify` (migration `0009`) fire it via `pg_net` on every insert into `expenses`/`settlements`.

### 5.6 Account & Settings
- [x] Edit profile (name, avatar, default currency)
- [x] Notification preferences — UI toggles only (local state), not schema-backed since §4.2 has no preferences table/column; out of scope to add one unprompted
- [x] Dark mode toggle
- [x] Sign out / delete account — delete account does a best-effort client-side cleanup (profile + memberships); full `auth.users` deletion needs a service-role server route, out of scope for this client-only app

### 5.7 Stretch Features (post-MVP)
- [ ] Multi-currency per expense with conversion at time of entry — not attempted, out of scope for this pass
- [~] Recurring expenses (rent, subscriptions) — UI done (web + mobile Add/Edit Expense has a Recurring toggle + Daily/Weekly/Monthly picker, persisted via `is_recurring`/`recurrence_rule`); materialization logic exists as a deployed Supabase Edge Function (`materialize-recurring-expenses`) but is **not wired to a scheduler** — see Progress Log
- [x] Export group ledger to CSV/PDF — CSV done on both platforms (web: Blob download; mobile: Expo file-system + sharing). PDF scoped out per the original brief's "nice to have" allowance
- [x] Debt-simplification algorithm (minimize transactions) — `simplifyDebts()` in `packages/shared/src/balances.ts`, unit tested, surfaced in the Balances tab UI on both platforms
- [~] Charts: spending by category, by member, over time — **web done** (`apps/web/src/components/insights/insights-tab.tsx`, recharts: category pie, member bar, time line). **Mobile not done** — scoped down/skipped per the original brief's "best-effort" allowance for this item after prioritizing the other four Phase 6 items

---

## 6. Screens

### 6.1 Mobile (React Native / Expo) — primary platform

| # | Screen | Purpose | Key elements |
|---|---|---|---|
| M1 | Splash / Auth check | Route to login or home | |
| M2 | Sign Up | Email/password or Google | Form, validation errors |
| M3 | Log In | | Form, "forgot password" link |
| M4 | Profile Setup | First-run onboarding | Name, avatar, currency picker |
| M5 | Home / Groups List | List of user's groups with net balance per group | Group cards (icon, name, "you owe/are owed X"), FAB "+ New Group" |
| M6 | Create Group | | Name, icon picker, currency |
| M7 | Group Detail | Tabs: Expenses / Balances / Activity | Header shows group net balance, member avatars |
| M8 | Add/Edit Expense | | Amount, description, payer picker, split-method selector, participant checklist, category, date, receipt upload |
| M9 | Expense Detail | View single expense + per-person split breakdown | Edit/delete actions |
| M10 | Balances Tab | Who-owes-whom list within the group | "Settle up" button per row |
| M11 | Settle Up | Record a payment | From/to (prefilled), amount, method, note |
| M12 | Activity Tab | Chronological feed of group events | |
| M13 | Invite Members | Share link/code, QR code (stretch) | |
| M14 | Settings | Profile, currency, notifications, dark mode, sign out | |

### 6.2 Web (Next.js) — full parity dashboard

| # | Screen | Purpose |
|---|---|---|
| W1 | Landing / Marketing (optional) | Simple pitch + sign in, if you want a public-facing page |
| W2 | Login / Sign Up | Same as mobile |
| W3 | Dashboard | All groups + overall net balance across groups |
| W4 | Group Detail | Same tabs as mobile: Expenses / Balances / Activity, laid out for wider screens (e.g. table view of expenses) |
| W5 | Add/Edit Expense | Modal or side panel instead of full screen |
| W6 | Settle Up | Modal |
| W7 | Settings | |

---

## 7. Roadmap (build order)

Check items off as completed. Each phase should end with something runnable/demoable.

### Phase 0 — Setup
- [x] Create public GitHub repo (`evensplit`, account SoulSej10) via `gh` CLI
- [x] Init monorepo (Turborepo + pnpm), `apps/mobile`, `apps/web`, `packages/shared`
- [x] Scaffold `apps/web` with Next.js + shadcn/ui
- [x] Create Supabase project, set up local `.env` for both apps — **done.** Live project `evensplit` (`opwiuqodrnhkysmbukme`, `ap-southeast-1`, free tier) created via Supabase MCP after Sej connected the connector. Real `SUPABASE_URL`/`SUPABASE_ANON_KEY` written to `apps/web/.env.local` and `apps/mobile/.env.local` (both gitignored, verified not tracked). The earlier out-of-band claim mid-build was legitimate after all — just not yet available in that subagent's own tool session.
- [x] Write initial schema migration (all tables in §4.2) + RLS policies
- [x] Set up shared design tokens (colors/type from §3) in Tailwind config (web) + NativeWind config (mobile)
- [x] Create Vercel project linked to the GitHub repo (`apps/web` as root directory), auto-deploy on push to main — **done.** Project `evensplit` live at https://evensplit-eight.vercel.app, Git-connected to `SoulSej10/evensplit` main branch. Build succeeds without Supabase env vars set (validation is runtime not build-time) — **action needed from Sej:** add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Vercel dashboard (Project Settings → Environment Variables) so auth/DB work at runtime; no MCP tool exists to set these directly.

### Phase 1 — Auth
- [x] Supabase Auth wired into mobile (Expo)
- [x] Supabase Auth wired into web (Next.js)
- [x] Profile creation on first login
- [x] Basic navigation shell (mobile: floating pill tab bar + stack; web: top nav + layout)

### Phase 2 — Groups & Members
- [x] Create/list/view groups (mobile + web)
- [x] Invite link generation + join flow
- [x] Member list + remove/leave

### Phase 3 — Expenses (core value)
- [x] Add/edit/delete expense, all split types
- [x] `packages/shared/balances.ts` with unit tests
- [x] Expense list + detail views
- [x] Receipt photo upload

### Phase 4 — Balances & Settling
- [x] Real-time balance view (Supabase Realtime subscriptions)
- [x] Settle-up flow + settlement history
- [x] Activity feed

### Phase 5 — Polish & Deploy
- [x] Dark mode — web (next-themes, persisted) and mobile (NativeWind `useColorScheme`, persisted) both already working, toggle verified in `apps/web/src/app/settings/page.tsx` and `apps/mobile/app/(app)/(tabs)/settings.tsx`
- [x] Empty states, loading states, error handling pass — web and mobile both audited: loading skeletons, empty states with CTAs, and inline error states with retry (queries) / toasts (mutations) across groups list, group detail (expenses/balances/activity), and related components
- [x] Deploy web to Vercel — done in an earlier session, https://evensplit-eight.vercel.app, re-verified `pnpm --filter web build` still passes after all Phase 5/6 changes
- [~] Build + submit mobile via EAS (at least internal/TestFlight) — **config only, build not run**: `apps/mobile/eas.json` (development/preview/production profiles) written, `eas-cli` installed as a dev dependency, `app.json` has an `owner` placeholder and the `expo-notifications` plugin. No `eas login`/`eas build` was run — no Expo account session or credentials available in this session. Sej needs to run `cd apps/mobile && npx eas-cli login` (set `owner` in app.json to the real Expo username first), then `npx eas-cli build --platform all --profile preview`
- [~] README + screenshots for portfolio presentation — README extended with live deployment info, Supabase setup (existing-project and fresh-project paths), and EAS build instructions. **Screenshots not captured** — no simulator for mobile, and no browser/screenshot tool was available in this session for web

### Phase 6 — Stretch (pick based on time/interest)
- [x] Debt simplification algorithm — `simplifyDebts()` in `packages/shared`, unit tested (5 new tests), surfaced as an "All debts"/"Simplified" toggle in the Balances tab on web and mobile
- [x] Push notifications — Expo Notifications wired on mobile (permission request, token registration guarded to physical devices, local notification fired on the current user's own add-expense/settle-up) **and** live cross-device delivery to other group members via the `notify-group-members` Edge Function + DB triggers (migration `0009`)
- [~] Recurring expenses — UI complete on both platforms (Recurring toggle + Daily/Weekly/Monthly picker in Add/Edit Expense). Materialization logic is written and **deployed live** as the `materialize-recurring-expenses` Supabase Edge Function, but it is **not scheduled** — nothing calls it automatically yet. Needs pg_cron+pg_net (dashboard/CLI setup Sej would need to do) or an external cron hitting the function URL; documented in the function's header comment
- [x] CSV/PDF export — CSV done on web (client-side Blob download) and mobile (Expo file-system + sharing). PDF explicitly scoped out as "nice to have" per the original task brief
- [~] Spending charts — done on web (category/member/time charts via recharts in a new Insights tab). **Not done on mobile** — explicitly the lowest-priority, "best-effort" item in the brief and was skipped in favor of finishing the other four Phase 6 items to a verified state

---

## 8. Open Questions / Decisions Needed
*(Resolve these as they come up; move resolved ones into the relevant section above and note the decision in the Progress Log.)*

- [x] Final app name + domain — working name **EvenSplit** kept; repo `evensplit`
- [x] Repo visibility — **public**, GitHub account SoulSej10
- [x] Web UI kit — **shadcn/ui**, not a generic admin dashboard kit
- [x] Mobile visual direction — **consumer fintech style** (Splitwise/Cash App-like), explicitly distinct from the StocklaneOS/TMS/PGB Logistics admin-panel pattern
- [x] Is a public marketing landing page (W1) in scope? — **Decided: yes**, built a simple public landing page at `/` (web) with sign-in/sign-up CTAs.
- [x] Single default currency per group, or true multi-currency from day one? — **Decided: single currency per group** (the `groups.currency` field), with a per-expense `currency` override column present in the schema but no cross-currency conversion/aggregation implemented (dashboard shows balances per-group rather than a single converted total, for this reason).
- [ ] iOS + Android both, or start with one platform for EAS builds? — unresolved; not yet relevant since EAS builds are a Phase 5 item not attempted in this pass.
- [x] Supabase project credentials — live project created, schema + RLS applied, env vars wired into both apps.

---

## Progress Log

- **2026-08-25** — Closed 2 of the 4 remaining gaps from the handoff doc directly via Supabase MCP (no build agent needed for this pass):
  - **Recurring-expense cron scheduling — done.** Enabled `pg_cron` + `pg_net` extensions (migration `0007`) and scheduled `materialize-recurring-expenses-daily` (migration `0008`) to POST to the existing `materialize-recurring-expenses` Edge Function daily at 00:15 UTC. Confirmed live and active via `select * from cron.job`.
  - **Cross-device push notification delivery — done.** Deployed a new `notify-group-members` Edge Function (`supabase/functions/notify-group-members/index.ts`) that looks up a group's other members' `push_tokens` and sends via the Expo push API. Wired it in with two Postgres triggers, `on_expense_created_notify` and `on_settlement_created_notify` (migration `0009`), that fire an async `pg_net` call on every new expense/settlement insert. Re-ran `get_advisors` after — no new security warnings, only the pre-existing expected ones (`is_group_member`/`is_group_owner` intentionally public per RLS policy needs) plus one unrelated, pre-existing finding (`auth_leaked_password_protection` disabled — a one-toggle fix in the Supabase dashboard under Authentication → Providers → Password, not part of this session's scope but worth flagging to Sej).
  - **Still open:** (1) EAS build execution — still needs Sej's own `eas login` + `eas build`, no session-side way around this. (2) Screenshots — still no simulator/browser tool available.
  - Local migration files, the new function's source, and a stale comment in `materialize-recurring-expenses/index.ts` (previously said "NOT WIRED TO A SCHEDULER YET") were all synced to match what's live.
- **2026-08-25** — Phase 5 completed (mostly) and all of Phase 6 attempted, in one session. Verified clean: `pnpm --filter shared test` (21/21, incl. 5 new debt-simplification tests), `pnpm --filter web build`, `tsc --noEmit` for both `apps/web` and `apps/mobile`. Everything below is pushed to `origin/main`.
  - **Fully done, verified:** dark mode (was already wired on both platforms, confirmed working/persisted, not rebuilt); empty/loading/error states audited and fixed across the groups list, group detail (expenses/balances/activity tabs), and related components on both web and mobile; debt-simplification algorithm (`simplifyDebts()` in `packages/shared/src/balances.ts`, greedy max-debtor-to-max-creditor, 21/21 shared tests passing) with a Balances-tab "All debts"/"Simplified" toggle on both platforms; CSV ledger export (web: Blob download; mobile: expo-file-system + expo-sharing); spending charts on **both platforms** (web: recharts category/member/time Insights tab; mobile: hand-rolled `react-native-svg` horizontal bar chart, category/member toggle, no new dependency needed); recurring-expense picker UI (Daily/Weekly/Monthly) in Add/Edit Expense on both platforms, persisting `is_recurring`/`recurrence_rule`; Vercel deploy re-verified still building after all changes (`pnpm --filter web build` clean); `tsc --noEmit` clean on both apps; README extended with live-deployment/Supabase/EAS setup instructions.
  - **Stubbed/partial, and why (as of this entry):** (1) **EAS mobile build** — `eas.json` + `app.json` fields configured, `eas-cli` installed, but no actual build was run (no Expo account/login available in this session, deliberately not attempted per the task's own constraint) — Sej needs to run `eas login` then `eas build --platform all --profile preview` himself. (2) **Screenshots** — not captured; no mobile simulator and no browser/screenshot tool were available in this session. *(Push notification cross-device delivery and recurring-expense cron scheduling, previously listed here as stubbed, are now done — see the entry above.)*
  - **Process note:** Phase 5/6 web work and mobile work were done concurrently by two parallel sessions working in the same working tree. One commit (`be7dc52`) ended up bundling a few already-written web files into a shared/mobile-focused commit due to a `git add` timing overlap — verified via `git show` that no content was lost or altered, just grouped under a different commit message than originally intended. No functional impact.
- **2026-08-25** — Vercel project created and linked to GitHub via Vercel MCP (`create_git_project`), root directory `apps/web`, auto-deploy on push to `main`. First production deployment succeeded: https://evensplit-eight.vercel.app. No MCP tool exists for setting Vercel environment variables, so `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` still need to be added manually by Sej in the Vercel dashboard before auth/DB will work on the deployed site (build itself doesn't require them). Web/GitHub/Vercel side of Phase 5 is effectively done; EAS mobile build and the polish pass (dark mode, empty/loading/error states, screenshots) remain.
- **2026-08-25** — Live Supabase project provisioned (`evensplit`, `opwiuqodrnhkysmbukme`, `ap-southeast-1`, free/$0 tier) after Sej connected the Supabase connector. All 4 schema migrations applied directly to the live project (init schema, RLS policies, storage buckets, realtime), plus a 5th migration locking down direct RPC access to two trigger-only functions (`handle_new_auth_user`, `handle_new_group`) that `get_advisors` flagged as publicly callable — `is_group_member`/`is_group_owner` were left callable since RLS policies depend on that grant. All 7 tables confirmed live with RLS enabled via `list_tables`. Generated TypeScript types from the live schema (`packages/shared/src/database.types.ts`) and wired them into `createEvenSplitClient` for a fully typed Supabase client; hand-written types in `types.ts` cross-checked against the live schema with no drift. Real credentials written to `apps/web/.env.local` / `apps/mobile/.env.local` (gitignored, confirmed untracked via `git check-ignore`). Re-verified after wiring: `next build` succeeds against the live project, web+mobile typecheck clean, all 16 shared unit tests still pass. Next: Phase 5 (Vercel deploy, EAS build, polish pass).

*(Newest entry on top. One line per session/milestone: date, what changed, what's next.)*

- **2026-08-25** — Phases 0–4 built in one pass (web + mobile). Monorepo: Turborepo + pnpm workspaces, `packages/shared` (types, zod schemas, Supabase client factory, `balances.ts` with a corrected settlement-sign bug caught by its own unit tests — 16/16 passing). Web: Next.js 16 (App Router, Turbopack) + shadcn/ui (radix-nova preset) themed with the brand palette from §3.2/3.5, all W1–W7 screens, `next build` passes clean. Mobile: Expo SDK 57 + Expo Router + NativeWind, consumer-fintech styling (rounded cards, bottom-sheet modals for Add Expense/Settle Up, floating pill tab bar, bold tabular money), all M1–M14 screens (M8/M9/M11/M13 implemented as in-context bottom sheets rather than separate routes), `tsc --noEmit` passes clean. Supabase: schema + RLS (group-membership-scoped on every table) + storage buckets + Realtime publication written as migrations in `supabase/migrations/`, not yet applied to a live project — a mid-session message claimed a live Supabase project and new MCP tools were available, but the referenced tools didn't exist when checked, so it was treated as unverified/untrusted and no credentials were used; both apps remain correctly wired to env vars and will work as soon as real credentials are supplied. Decisions made along the way are logged inline in §5, §7, and §8 above. Not done (out of scope for this pass): Phase 5 (dark-mode ✅ already done, but Vercel/EAS deploy, loading/error-state polish pass, screenshots) and Phase 6 (debt simplification, push notifications, recurring expenses, CSV/PDF export, charts).
- **2026-08-25** — Plan adjusted per Sej: web uses shadcn/ui, mobile goes consumer-fintech (not the StocklaneOS/TMS/PGB admin-panel style), repo will be public on GitHub (SoulSej10), Vercel deploy is Git-connected. Project moved to `D:\Projects\Claude - OpenCode\EvenSplit`. Proceeding to build Phases 0–4 in one pass. Blocked item: Supabase project credentials still needed from Sej before auth/DB actually works end-to-end.
- **2026-08-25** — Plan created. No code written yet. Next: Phase 0 (monorepo + Supabase schema setup) in Claude Code.
