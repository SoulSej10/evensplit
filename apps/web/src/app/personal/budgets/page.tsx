"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { computeBudgetProgress, filterTransactionsForCurrentMonth } from "@evensplit/shared";
import { PiggyBank, Trash as Trash2 } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AddBudgetDialog } from "@/components/personal/add-budget-dialog";
import {
  useDeletePersonalBudget,
  usePersonalAccounts,
  usePersonalBudgets,
  usePersonalCategories,
  usePersonalTransactions,
} from "@/hooks/use-personal";
import { formatMoney } from "@/lib/format";

export default function PersonalBudgetsPage() {
  const { data: budgets, isLoading } = usePersonalBudgets();
  const { data: categories } = usePersonalCategories();
  const { data: transactions } = usePersonalTransactions();
  const { data: accounts } = usePersonalAccounts();
  const deleteBudget = useDeletePersonalBudget();
  const currency = accounts?.[0]?.currency ?? "USD";

  const thisMonthTransactions = useMemo(
    () => filterTransactionsForCurrentMonth(transactions ?? []),
    [transactions]
  );

  const progress = computeBudgetProgress(budgets ?? [], categories ?? [], thisMonthTransactions);

  async function onDelete(id: string) {
    try {
      await deleteBudget.mutateAsync(id);
      toast.success("Budget removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove budget");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground">This month&apos;s spending against your limits.</p>
        </div>
        <AddBudgetDialog />
      </div>

      {isLoading && (
        <div className="grid gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      )}

      {!isLoading && progress.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
            <PiggyBank className="h-6 w-6" />
          </span>
          <p className="font-medium">No budgets yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Set a monthly limit for a category to track your spending against it.
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {budgets?.map((budget) => {
          const p = progress.find((entry) => entry.category_id === budget.category_id);
          if (!p) return null;
          const overBudget = p.percent > 100;
          const approaching = !overBudget && p.percent >= 80;
          return (
            <Card key={budget.id} className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium">{p.category_name}</p>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm tabular-nums ${
                      overBudget ? "text-destructive" : approaching ? "text-accent" : "text-muted-foreground"
                    }`}
                  >
                    {formatMoney(p.spent, currency)} / {formatMoney(p.limit, currency)}
                  </p>
                  <button
                    onClick={() => onDelete(budget.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove budget"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <Progress
                value={Math.min(p.percent, 100)}
                className={overBudget ? "[&>div]:bg-destructive" : approaching ? "[&>div]:bg-accent" : undefined}
              />
              {overBudget && (
                <p className="mt-1 text-xs text-destructive">
                  {formatMoney(Math.abs(p.remaining), currency)} over budget
                </p>
              )}
              {approaching && (
                <p className="mt-1 text-xs text-accent">
                  Approaching limit — {formatMoney(p.remaining, currency)} left
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
