"use client";

import type { User } from "@evensplit/shared";
import { simplifyDebts } from "@evensplit/shared";
import { Receipt } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SettleUpDialog } from "@/components/settle-up/settle-up-dialog";
import { useGroupExpenses, useGroupBalances, useGroupSettlements } from "@/hooks/use-group-detail";
import { formatMoney } from "@/lib/format";

/**
 * Group Overview - a snapshot composed entirely from data the page already
 * fetches (useGroupExpenses/useGroupSettlements are the same React Query
 * keys BalancesTab/ExpensesTab use, so this adds no new network calls).
 * Shows total group spending, the user's position, the top suggested
 * settlement, and the most recent expenses.
 */
export function OverviewTab({
  groupId,
  groupCurrency,
  members,
  currentUserId,
}: {
  groupId: string;
  groupCurrency: string;
  members: { user_id: string; users: User | null }[];
  currentUserId: string;
}) {
  const { data: expenses, isLoading: expensesLoading } = useGroupExpenses(groupId);
  const { data: settlements, isLoading: settlementsLoading } = useGroupSettlements(groupId);

  const memberIds = members.map((m) => m.user_id);
  const allShares = (expenses ?? []).flatMap((e) => e.expense_shares);
  const { balances } = useGroupBalances(groupId, memberIds, expenses ?? [], allShares, settlements ?? []);
  const myBalance = balances.find((b) => b.user_id === currentUserId)?.balance ?? 0;
  const isPositive = myBalance > 0.005;
  const isNegative = myBalance < -0.005;

  const topSuggestion = simplifyDebts(balances)[0];
  const totalSpending = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0);
  const recentExpenses = (expenses ?? []).slice(0, 5);

  function name(userId: string) {
    if (userId === currentUserId) return "You";
    return members.find((m) => m.user_id === userId)?.users?.display_name ?? "Someone";
  }

  if (expensesLoading || settlementsLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total group spending</p>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
            {formatMoney(totalSpending, groupCurrency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Your position</p>
          <p
            className={`mt-1 font-mono text-xl font-semibold tabular-nums ${
              isPositive ? "text-positive" : isNegative ? "text-negative" : "text-muted-foreground"
            }`}
          >
            {isPositive ? "+" : isNegative ? "−" : ""}
            {formatMoney(Math.abs(myBalance), groupCurrency)}
          </p>
          <p className="text-xs text-muted-foreground">
            {isPositive ? "you're owed" : isNegative ? "you owe" : "you're settled up"}
          </p>
        </div>
      </div>

      {topSuggestion && (
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="min-w-0 flex-1 text-sm">
            <span className="font-medium">{name(topSuggestion.from_user)}</span>{" "}
            <span className="text-muted-foreground">
              {topSuggestion.from_user === currentUserId ? "owe" : "owes"}
            </span>{" "}
            <span className="font-medium">{name(topSuggestion.to_user)}</span>
          </div>
          <span className="font-mono text-sm font-semibold tabular-nums text-negative">
            {formatMoney(topSuggestion.amount, groupCurrency)}
          </span>
          <SettleUpDialog
            trigger={
              <Button size="sm" variant="outline" className="rounded-full">
                Settle up
              </Button>
            }
            groupId={groupId}
            groupCurrency={groupCurrency}
            fromUserId={topSuggestion.from_user}
            toUserId={topSuggestion.to_user}
            suggestedAmount={topSuggestion.amount}
            members={members}
            currentUserId={currentUserId}
          />
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Recent expenses</h3>
        {recentExpenses.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
              <Receipt className="h-5 w-5" />
            </span>
            <p className="text-sm text-muted-foreground">No expenses yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentExpenses.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.description}</p>
                  <p className="text-xs text-muted-foreground">Paid by {name(e.paid_by)}</p>
                </div>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {formatMoney(e.amount, e.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
