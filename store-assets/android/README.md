# Play Store assets — SplitEven (Android)

Captured live off the Android emulator on 2026-09-04, matching commit `591f2ce`
(the build submitted to EAS as `faa45fec-1655-42a2-aa97-42c408e287ad`).

## Screenshots (`screenshots/`)

| File | Shows |
|---|---|
| `01-home.png` | Home dashboard — total balance, shared balances, quick actions |
| `02-group-balances.png` | A group's Balances tab — net balances + "who owes whom" with Settle buttons |
| `03-add-expense.png` | Add Expense sheet with the always-visible calculator keypad |
| `04-insights.png` | Insights tab — personal spending-by-category donut chart |
| `05-finances.png` | Finances (personal) tab — accounts, budget progress, recent transactions |

Re-capture whenever the UI changes meaningfully before a new store submission.

## Listing copy

**App name** (30 char max): `SplitEven - Split Expenses`

**Short description** (80 char max):
`Split group expenses, settle up fast, and track your personal finances.`

**Category:** Finance
**Tags:** expense splitting, roommate expenses, group expenses, bill splitting, budget tracker, personal finance

**Full description** (4000 char max):

```
SplitEven keeps every shared expense in one ledger and settles the math in real time — so nobody has to be the one who brings it up.

SPLIT EXPENSES YOUR WAY
Add an expense once and split it however it actually happened:
• Equal — divide evenly across everyone
• Exact — set each person's amount
• Percentage — divide by custom percentages
• Shares — weighted splits, like 2:1:1

SEE WHO OWES WHOM, INSTANTLY
Every group has a live balance. Add an expense and everyone sees the update immediately — no spreadsheet, no group chat math, no chasing anyone down.

SETTLE UP IN ONE TAP
SplitEven simplifies a group's tangled debts down to the fewest payments needed to get everyone back to even, instead of everyone paying everyone.

BUILT FOR REAL GROUPS
• Trips, roommates, couples — keep every group's expenses in its own ledger
• Invite people by link or code — they can view and settle their balance from a browser without installing anything
• Attach receipt photos and tag categories so you can find things later
• Each group can run in its own currency

YOUR PERSONAL FINANCES, SEPARATE FROM GROUP BALANCES
SplitEven isn't just for splitting bills. Track your own accounts, income, and expenses alongside your shared groups:
• Multiple accounts (cash, cards, bank)
• Monthly budgets by category, with progress tracking
• A built-in calculator right where you enter amounts — work out a split or a sum of receipts without leaving the field
• Spending breakdowns and trends over time
• Export your full ledger to CSV whenever you want your data out

PRIVACY FIRST
Your personal accounts, budgets, and transactions are never shared with anyone — including your own group members. Group data stays visible only to that group's members. Full details in our Privacy Policy.

Free to use, for any group size.
```

## Data Safety form pointers

Maps directly to `apps/web/src/app/privacy-policy/page.tsx` / `apps/mobile/src/components/legal/PrivacyPolicyContent.tsx`:
- Collects: account info (email, display name, avatar), financial info (expenses/transactions entered by the user)
- Encrypted in transit
- Not sold, not shared for advertising
- Users can request deletion in-app (Settings → Delete account)

## Still needed before submitting

- Google Play Developer account ($25 one-time)
- Feature graphic (1024×500) — not yet created
- Content rating questionnaire (answer in Play Console directly)
- Upload the production `.aab` from EAS build `faa45fec-1655-42a2-aa97-42c408e287ad`:
  https://expo.dev/artifacts/eas/ykrBscHQv_ld_fZi4EzJkLKeDS7UJTIXxEzHGcAb7cY.aab
