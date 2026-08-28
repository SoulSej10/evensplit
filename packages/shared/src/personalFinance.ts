import type { PersonalAccount, PersonalBudget, PersonalCategory, PersonalTransaction, UUID } from "./types";

/**
 * Pure, dependency-free derived-data helpers for the personal budgeting
 * ("My Money") feature, kept separate from balances.ts since this domain
 * has nothing to do with group splitting. Unit tested in isolation and
 * shared verbatim between apps/web and apps/mobile, same pattern as
 * balances.ts.
 */

const CENTS = 100;

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * CENTS) / CENTS;
}

/**
 * Current balance for one account: its starting balance, plus income paid
 * into it, minus expenses paid from it, plus/minus transfers in and out.
 */
export function computeAccountBalance(
  account: Pick<PersonalAccount, "id" | "starting_balance">,
  transactions: Pick<PersonalTransaction, "account_id" | "transfer_account_id" | "kind" | "amount">[]
): number {
  let balance = account.starting_balance;
  for (const tx of transactions) {
    // group_advance/group_reimbursement move real cash just like
    // expense/income do - they're excluded from *spending* aggregates
    // (computeCategoryBreakdown, computeExpenseTrend) because they're
    // neither personal spend nor personal income, but the account balance
    // itself must reflect them or it would silently disagree with the bank.
    if ((tx.kind === "income" || tx.kind === "group_reimbursement") && tx.account_id === account.id) {
      balance += tx.amount;
    } else if ((tx.kind === "expense" || tx.kind === "group_advance") && tx.account_id === account.id) {
      balance -= tx.amount;
    } else if (tx.kind === "transfer") {
      if (tx.account_id === account.id) balance -= tx.amount;
      if (tx.transfer_account_id === account.id) balance += tx.amount;
    }
  }
  return round2(balance);
}

export interface AccountBalance {
  account_id: UUID;
  balance: number;
}

/** Balances for every account in one pass over the transaction list. */
export function computeAllAccountBalances(
  accounts: Pick<PersonalAccount, "id" | "starting_balance">[],
  transactions: Pick<PersonalTransaction, "account_id" | "transfer_account_id" | "kind" | "amount">[]
): AccountBalance[] {
  return accounts.map((account) => ({
    account_id: account.id,
    balance: computeAccountBalance(account, transactions),
  }));
}

export interface CategoryBreakdownEntry {
  category_id: UUID | null;
  category_name: string;
  amount: number;
  percent: number;
}

/**
 * Spending (or income) grouped by category for a set of transactions
 * already filtered to the period of interest by the caller. Transactions
 * with no category land under "Uncategorized". Sorted by amount
 * descending, matching the donut-chart legend order.
 */
export function computeCategoryBreakdown(
  transactions: Pick<PersonalTransaction, "category_id" | "kind" | "amount">[],
  categories: Pick<PersonalCategory, "id" | "name">[],
  kind: "income" | "expense"
): CategoryBreakdownEntry[] {
  const totals = new Map<UUID | null, number>();
  for (const tx of transactions) {
    if (tx.kind !== kind) continue;
    totals.set(tx.category_id, (totals.get(tx.category_id) ?? 0) + tx.amount);
  }

  const grandTotal = [...totals.values()].reduce((a, b) => a + b, 0);

  const entries: CategoryBreakdownEntry[] = [...totals.entries()].map(([category_id, amount]) => ({
    category_id,
    category_name: categories.find((c) => c.id === category_id)?.name ?? "Uncategorized",
    amount: round2(amount),
    percent: grandTotal > 0 ? round2((amount / grandTotal) * 100) : 0,
  }));

  return entries.sort((a, b) => b.amount - a.amount);
}

export interface TrendPoint {
  date: string;
  income: number;
  expense: number;
}

/**
 * Daily income/expense totals for a set of transactions, for the trend
 * line chart. `dateKey` maps a transaction to its bucket key (the caller
 * decides the date-truncation, e.g. `occurred_at.slice(0, 10)` for
 * per-day); buckets are returned sorted ascending by key.
 */
export function computeExpenseTrend(
  transactions: Pick<PersonalTransaction, "occurred_at" | "kind" | "amount">[]
): TrendPoint[] {
  const buckets = new Map<string, { income: number; expense: number }>();
  for (const tx of transactions) {
    // Transfers move money between your own accounts (net zero); group_advance/
    // group_reimbursement are shared-money movements, not personal income or
    // spending (see computeSharedFinanceSummary) - none belong in this trend.
    if (tx.kind !== "income" && tx.kind !== "expense") continue;
    const key = tx.occurred_at.slice(0, 10);
    const entry = buckets.get(key) ?? { income: 0, expense: 0 };
    if (tx.kind === "income") entry.income += tx.amount;
    else entry.expense += tx.amount;
    buckets.set(key, entry);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { income, expense }]) => ({
      date,
      income: round2(income),
      expense: round2(expense),
    }));
}

/**
 * Filters transactions down to the current calendar month, by `occurred_at`.
 * Extracted here because the same "this month" scoping was previously
 * copy-pasted identically in the mobile and web budget views (and would
 * have become a third copy in the Home budget snapshot) - one definition
 * of "this month" everyone shares.
 */
export function filterTransactionsForCurrentMonth<T extends Pick<PersonalTransaction, "occurred_at">>(
  transactions: T[]
): T[] {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return transactions.filter((tx) => tx.occurred_at.slice(0, 7) === monthKey);
}

export interface BudgetProgress {
  category_id: UUID;
  category_name: string;
  limit: number;
  spent: number;
  percent: number;
  remaining: number;
}

/**
 * Progress toward each budget's monthly limit, given the current month's
 * expense transactions (the caller filters transactions to the period).
 * `percent` is not clamped to 100 so callers can visually flag overspend.
 */
export function computeBudgetProgress(
  budgets: PersonalBudget[],
  categories: Pick<PersonalCategory, "id" | "name">[],
  monthTransactions: Pick<PersonalTransaction, "category_id" | "kind" | "amount">[]
): BudgetProgress[] {
  const spentByCategory = new Map<UUID, number>();
  for (const tx of monthTransactions) {
    if (tx.kind !== "expense" || !tx.category_id) continue;
    spentByCategory.set(tx.category_id, (spentByCategory.get(tx.category_id) ?? 0) + tx.amount);
  }

  return budgets.map((budget) => {
    const spent = round2(spentByCategory.get(budget.category_id) ?? 0);
    return {
      category_id: budget.category_id,
      category_name: categories.find((c) => c.id === budget.category_id)?.name ?? "Uncategorized",
      limit: budget.monthly_limit,
      spent,
      percent: budget.monthly_limit > 0 ? round2((spent / budget.monthly_limit) * 100) : 0,
      remaining: round2(budget.monthly_limit - spent),
    };
  });
}

export interface DailyTotal {
  /** YYYY-MM-DD */
  date: string;
  expense: number;
  income: number;
}

/**
 * Per-day expense/income totals, for a monthly calendar view (one cell per
 * day). The caller passes already-month-filtered transactions (same
 * convention as computeCategoryBreakdown/computeExpenseTrend); an optional
 * `categoryId` narrows to a single category so the calendar works "for any
 * category," not just an all-categories total. group_advance/
 * group_reimbursement are excluded for the same reason they're excluded
 * from computeExpenseTrend - they're shared-money movements, not personal
 * income or spending.
 */
export function computeDailyTotals(
  transactions: Pick<PersonalTransaction, "occurred_at" | "kind" | "amount" | "category_id">[],
  categoryId?: UUID | null
): DailyTotal[] {
  const totals = new Map<string, { expense: number; income: number }>();
  for (const tx of transactions) {
    if (tx.kind !== "income" && tx.kind !== "expense") continue;
    if (categoryId && tx.category_id !== categoryId) continue;
    const key = tx.occurred_at.slice(0, 10);
    const entry = totals.get(key) ?? { expense: 0, income: 0 };
    if (tx.kind === "income") entry.income += tx.amount;
    else entry.expense += tx.amount;
    totals.set(key, entry);
  }
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { expense, income }]) => ({ date, expense: round2(expense), income: round2(income) }));
}

export interface SharedFinanceSummary {
  /** Cash advanced for other group members' shares (a receivable, not spend). */
  advanced: number;
  /** Cash recovered as that receivable gets repaid (not income). */
  recovered: number;
  /** advanced minus recovered - still owed back to you, for the given period. */
  outstanding: number;
}

/**
 * Rolls up the group_advance/group_reimbursement transactions (already
 * filtered to the period of interest by the caller, same convention as
 * computeCategoryBreakdown) into the combined "shared spending" narrative:
 * how much you fronted for others, how much came back, and what's still
 * outstanding. This is the one number personal-only tools can't produce,
 * since it depends on group activity mirrored via create_group_expense/
 * record_settlement/confirm_settlement_receipt.
 */
export function computeSharedFinanceSummary(
  transactions: Pick<PersonalTransaction, "kind" | "amount">[]
): SharedFinanceSummary {
  let advanced = 0;
  let recovered = 0;
  for (const tx of transactions) {
    if (tx.kind === "group_advance") advanced += tx.amount;
    else if (tx.kind === "group_reimbursement") recovered += tx.amount;
  }
  return {
    advanced: round2(advanced),
    recovered: round2(recovered),
    outstanding: round2(advanced - recovered),
  };
}
