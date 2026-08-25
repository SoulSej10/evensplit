# EvenSplit — Shared Expense & Budget App

> **Working name:** EvenSplit *(placeholder — rename freely, then find/replace across the repo)*
> **Status:** 🟡 Planning complete, build not started
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

**Pairwise simplification (stretch goal):** reduce a group's full debt graph to the minimum number of transactions needed to zero everyone out (classic "debt simplification" / min-cash-flow problem — greedy max-debtor-to-max-creditor algorithm). Good, resume-worthy algorithmic feature.

---

## 5. Features & Sub-Features

### 5.1 Authentication
- [ ] Email/password sign up & login (Supabase Auth)
- [ ] Google OAuth sign-in
- [ ] Password reset flow
- [ ] Profile setup on first login (display name, avatar, default currency)

### 5.2 Groups
- [ ] Create group (name, icon, currency)
- [ ] Invite members via shareable link/code
- [ ] Join group via invite link
- [ ] View group member list
- [ ] Remove member (owner only)
- [ ] Archive group (soft delete)
- [ ] Leave group

### 5.3 Expenses
- [ ] Add expense: description, amount, payer, date, category
- [ ] Split method: equal / exact amounts / percentages / shares (weighted)
- [ ] Edit expense
- [ ] Delete expense (with confirmation, recalculates balances)
- [ ] Attach receipt photo (Supabase Storage)
- [ ] Filter/search expenses by category, date range, member

### 5.4 Balances & Settling
- [ ] Real-time per-group balance view ("You owe / You are owed")
- [ ] Per-member breakdown (who owes whom, how much)
- [ ] Settle up: record a payment between two members
- [ ] Settlement history
- [ ] Debt simplification view (stretch)

### 5.5 Activity & Notifications
- [ ] Activity feed per group (expense added/edited/deleted, settlements)
- [ ] Push notification on new expense / settlement (stretch, Phase 3+)

### 5.6 Account & Settings
- [ ] Edit profile (name, avatar, default currency)
- [ ] Notification preferences
- [ ] Dark mode toggle
- [ ] Sign out / delete account

### 5.7 Stretch Features (post-MVP)
- [ ] Multi-currency per expense with conversion at time of entry
- [ ] Recurring expenses (rent, subscriptions)
- [ ] Export group ledger to CSV/PDF
- [ ] Debt-simplification algorithm (minimize transactions)
- [ ] Charts: spending by category, by member, over time

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
- [ ] Create public GitHub repo (`evensplit`, account SoulSej10) via `gh` CLI
- [ ] Init monorepo (Turborepo + pnpm), `apps/mobile`, `apps/web`, `packages/shared`
- [ ] Scaffold `apps/web` with Next.js + shadcn/ui
- [ ] Create Supabase project, set up local `.env` for both apps — **requires manual Supabase project creation + credentials from Sej (no Supabase MCP access)**
- [ ] Write initial schema migration (all tables in §4.2) + RLS policies
- [ ] Set up shared design tokens (colors/type from §3) in Tailwind config (web) + NativeWind config (mobile)
- [ ] Create Vercel project linked to the GitHub repo (`apps/web` as root directory), auto-deploy on push to main

### Phase 1 — Auth
- [ ] Supabase Auth wired into mobile (Expo)
- [ ] Supabase Auth wired into web (Next.js)
- [ ] Profile creation on first login
- [ ] Basic navigation shell (mobile tab nav, web layout/sidebar)

### Phase 2 — Groups & Members
- [ ] Create/list/view groups (mobile + web)
- [ ] Invite link generation + join flow
- [ ] Member list + remove/leave

### Phase 3 — Expenses (core value)
- [ ] Add/edit/delete expense, all split types
- [ ] `packages/shared/balances.ts` with unit tests
- [ ] Expense list + detail views
- [ ] Receipt photo upload

### Phase 4 — Balances & Settling
- [ ] Real-time balance view (Supabase Realtime subscriptions)
- [ ] Settle-up flow + settlement history
- [ ] Activity feed

### Phase 5 — Polish & Deploy
- [ ] Dark mode
- [ ] Empty states, loading states, error handling pass
- [ ] Deploy web to Vercel
- [ ] Build + submit mobile via EAS (at least internal/TestFlight)
- [ ] README + screenshots for portfolio presentation

### Phase 6 — Stretch (pick based on time/interest)
- [ ] Debt simplification algorithm
- [ ] Push notifications
- [ ] Recurring expenses
- [ ] CSV/PDF export
- [ ] Spending charts

---

## 8. Open Questions / Decisions Needed
*(Resolve these as they come up; move resolved ones into the relevant section above and note the decision in the Progress Log.)*

- [x] Final app name + domain — working name **EvenSplit** kept; repo `evensplit`
- [x] Repo visibility — **public**, GitHub account SoulSej10
- [x] Web UI kit — **shadcn/ui**, not a generic admin dashboard kit
- [x] Mobile visual direction — **consumer fintech style** (Splitwise/Cash App-like), explicitly distinct from the StocklaneOS/TMS/PGB Logistics admin-panel pattern
- [ ] Is a public marketing landing page (W1) in scope, or is web purely an authenticated dashboard?
- [ ] Single default currency per group, or true multi-currency from day one?
- [ ] iOS + Android both, or start with one platform for EAS builds?
- [ ] Supabase project credentials — pending, needed before Phase 1 (Auth) can actually run end-to-end

---

## Progress Log

*(Newest entry on top. One line per session/milestone: date, what changed, what's next.)*

- **2026-08-25** — Plan adjusted per Sej: web uses shadcn/ui, mobile goes consumer-fintech (not the StocklaneOS/TMS/PGB admin-panel style), repo will be public on GitHub (SoulSej10), Vercel deploy is Git-connected. Project moved to `D:\Projects\Claude - OpenCode\EvenSplit`. Proceeding to build Phases 0–4 in one pass. Blocked item: Supabase project credentials still needed from Sej before auth/DB actually works end-to-end.
- **2026-08-25** — Plan created. No code written yet. Next: Phase 0 (monorepo + Supabase schema setup) in Claude Code.
