"use client";

import type { User } from "@evensplit/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SettleUpDialog } from "@/components/settle-up/settle-up-dialog";
import { useGroupExpenses, useGroupBalances, useGroupSettlements } from "@/hooks/use-group-detail";
import { formatMoney, initials } from "@/lib/format";

export function BalancesTab({
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
  const { balances, pairwiseDebts } = useGroupBalances(
    groupId,
    memberIds,
    expenses ?? [],
    allShares,
    settlements ?? []
  );

  function name(userId: string) {
    return members.find((m) => m.user_id === userId)?.users?.display_name ?? "Someone";
  }
  function avatar(userId: string) {
    return members.find((m) => m.user_id === userId)?.users?.avatar_url ?? undefined;
  }

  if (expensesLoading || settlementsLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Net balances</h3>
        <div className="space-y-2">
          {balances.map((b) => {
            const isPositive = b.balance > 0.005;
            const isNegative = b.balance < -0.005;
            return (
              <div
                key={b.user_id}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatar(b.user_id)} />
                  <AvatarFallback className="bg-primary-light text-primary">
                    {initials(name(b.user_id))}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm font-medium">
                  {b.user_id === currentUserId ? "You" : name(b.user_id)}
                </span>
                <span
                  className={`font-mono text-sm font-semibold tabular-nums ${
                    isPositive ? "text-positive" : isNegative ? "text-negative" : "text-muted-foreground"
                  }`}
                >
                  {isPositive ? "+" : isNegative ? "−" : ""}
                  {formatMoney(Math.abs(b.balance), groupCurrency)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Who owes whom</h3>
        {pairwiseDebts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Everyone's settled up 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {pairwiseDebts.map((debt, i) => (
              <div
                key={`${debt.from_user}-${debt.to_user}-${i}`}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatar(debt.from_user)} />
                  <AvatarFallback className="text-xs">{initials(name(debt.from_user))}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">
                    {debt.from_user === currentUserId ? "You" : name(debt.from_user)}
                  </span>{" "}
                  <span className="text-muted-foreground">owe</span>{" "}
                  <span className="font-medium">
                    {debt.to_user === currentUserId ? "you" : name(debt.to_user)}
                  </span>
                </div>
                <span className="font-mono text-sm font-semibold tabular-nums text-negative">
                  {formatMoney(debt.amount, groupCurrency)}
                </span>
                <SettleUpDialog
                  trigger={
                    <Button size="sm" variant="outline" className="rounded-full">
                      Settle up
                    </Button>
                  }
                  groupId={groupId}
                  groupCurrency={groupCurrency}
                  fromUserId={debt.from_user}
                  toUserId={debt.to_user}
                  suggestedAmount={debt.amount}
                  members={members}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
