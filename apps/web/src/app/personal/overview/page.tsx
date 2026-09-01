"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  computeAllAccountBalances,
  computeBudgetProgress,
  filterTransactionsForCurrentMonth,
} from "@evensplit/shared";
import { ArrowDownLeft, ArrowsLeftRight as ArrowLeftRight, ArrowUpRight, PiggyBank } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePersonalAccounts,
  usePersonalBudgets,
  usePersonalCategories,
  usePersonalTransactions,
} from "@/hooks/use-personal";
import { formatDate, formatMoney } from "@/lib/format";
import type { PersonalTransaction } from "@evensplit/shared";

function TransactionIcon({ kind }: { kind: PersonalTransaction["kind"] }) {
  if (kind === "income" || kind === "group_reimbursement") return <ArrowDownLeft className="h-4 w-4 text-positive" />;
  if (kind === "transfer") return <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />;
  return <ArrowUpRight className="h-4 w-4 text-negative" />;
}

const RECENT_COUNT = 5;

/**
 * Finance Overview - composes existing data (accounts, transactions,
 * budgets) that's already fetched elsewhere in Finances, rather than
 * duplicating the always-visible FinancesSummaryCard above these tabs.
 */
export default function PersonalOverviewPage() {
  const { data: accounts, isLoading: accountsLoading } = usePersonalAccounts();
  const { data: transactions, isLoading: transactionsLoading } = usePersonalTransactions();
  const { data: budgets } = usePersonalBudgets();
  const { data: categories } = usePersonalCategories();

  const balances = computeAllAccountBalances(accounts ?? [], transactions ?? []);

  const budgetHighlight = useMemo(() => {
    if (!budgets || budgets.length === 0) return null;
    const progress = computeBudgetProgress(
      budgets,
      categories ?? [],
      filterTransactionsForCurrentMonth(transactions ?? [])
    );
    if (progress.length === 0) return null;
    return progress.reduce((max, p) => (p.percent > max.percent ? p : max), progress[0]);
  }, [budgets, categories, transactions]);

  const recentTransactions = (transactions ?? []).slice(0, RECENT_COUNT);

  function accountName(id: string) {
    return accounts?.find((a) => a.id === id)?.name ?? "Account";
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Accounts</h2>
          <Link href="/personal/accounts" className="text-sm font-medium text-primary hover:underline">
            See all
          </Link>
        </div>
        {accountsLoading && <Skeleton className="h-16 rounded-2xl" />}
        {!accountsLoading && (accounts ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No accounts yet.</p>
        )}
        <div className="grid gap-2">
          {(accounts ?? []).map((account) => {
            const balance = balances.find((b) => b.account_id === account.id)?.balance ?? 0;
            return (
              <Card key={account.id} className="flex items-center gap-3 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm">
                  {account.icon ?? "💵"}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{account.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{account.type}</p>
                </div>
                <p className="font-semibold tabular-nums">{formatMoney(balance, account.currency)}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {budgetHighlight && (
        <Link href="/personal/budgets">
          <Card className="gap-2 p-4">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-primary" />
              <p className="flex-1 text-sm font-semibold">{budgetHighlight.category_name} budget</p>
              <p className="text-xs text-muted-foreground">
                {formatMoney(budgetHighlight.spent, accounts?.[0]?.currency ?? "PHP")} /{" "}
                {formatMoney(budgetHighlight.limit, accounts?.[0]?.currency ?? "PHP")}
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${
                  budgetHighlight.percent > 100
                    ? "bg-destructive"
                    : budgetHighlight.percent >= 80
                      ? "bg-accent"
                      : "bg-primary"
                }`}
                style={{ width: `${Math.min(budgetHighlight.percent, 100)}%` }}
              />
            </div>
          </Card>
        </Link>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Recent transactions</h2>
          <Link href="/personal" className="text-sm font-medium text-primary hover:underline">
            See all
          </Link>
        </div>
        {transactionsLoading && <Skeleton className="h-16 rounded-2xl" />}
        {!transactionsLoading && recentTransactions.length === 0 && (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        )}
        <div className="grid gap-2">
          {recentTransactions.map((tx) => {
            const account = accounts?.find((a) => a.id === tx.account_id);
            return (
              <Card key={tx.id} className="flex items-center gap-3 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <TransactionIcon kind={tx.kind} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {tx.kind === "transfer"
                      ? `${accountName(tx.account_id)} → ${accountName(tx.transfer_account_id ?? "")}`
                      : tx.kind === "group_advance"
                        ? "Advanced for others"
                        : tx.kind === "group_reimbursement"
                          ? "Reimbursement received"
                          : tx.kind === "income"
                            ? "Income"
                            : "Expense"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDate(tx.occurred_at)} · {accountName(tx.account_id)}
                  </p>
                </div>
                <p
                  className={`text-sm font-semibold tabular-nums ${
                    tx.kind === "income" || tx.kind === "group_reimbursement"
                      ? "text-positive"
                      : tx.kind === "transfer"
                        ? ""
                        : "text-negative"
                  }`}
                >
                  {formatMoney(tx.amount, account?.currency ?? "PHP")}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
