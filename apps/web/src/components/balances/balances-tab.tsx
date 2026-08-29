"use client";

import { useState } from "react";
import type { User } from "@evensplit/shared";
import { simplifyDebts } from "@evensplit/shared";
import { AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SettleUpDialog } from "@/components/settle-up/settle-up-dialog";
import { useGroupExpenses, useGroupBalances, useGroupSettlements } from "@/hooks/use-group-detail";
import { formatMoney, initials } from "@/lib/format";

type DebtView = "all" | "simplified";

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
  const {
    data: expenses,
    isLoading: expensesLoading,
    isError: expensesError,
    refetch: refetchExpenses,
  } = useGroupExpenses(groupId);
  const {
    data: settlements,
    isLoading: settlementsLoading,
    isError: settlementsError,
    refetch: refetchSettlements,
  } = useGroupSettlements(groupId);
  const [view, setView] = useState<DebtView>("all");

  const memberIds = members.map((m) => m.user_id);
  const allShares = (expenses ?? []).flatMap((e) => e.expense_shares);
  const { balances, pairwiseDebts } = useGroupBalances(
    groupId,
    memberIds,
    expenses ?? [],
    allShares,
    settlements ?? []
  );
  const simplifiedDebts = simplifyDebts(balances);
  const debtsToShow = view === "simplified" ? simplifiedDebts : pairwiseDebts;

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

  if (expensesError || settlementsError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-destructive/40 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium">Couldn&apos;t load balances</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void refetchExpenses();
            void refetchSettlements();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Net balances</h3>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map((b) => {
                const isPositive = b.balance > 0.005;
                const isNegative = b.balance < -0.005;
                return (
                  <TableRow key={b.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={avatar(b.user_id)} />
                          <AvatarFallback className="bg-primary-light text-primary">
                            {initials(name(b.user_id))}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{b.user_id === currentUserId ? "You" : name(b.user_id)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          isPositive
                            ? "border-positive/30 bg-positive/10 text-positive"
                            : isNegative
                              ? "border-negative/30 bg-negative/10 text-negative"
                              : "text-muted-foreground"
                        }
                      >
                        {isPositive ? "Owed" : isNegative ? "Owes" : "Settled"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-semibold tabular-nums ${
                        isPositive ? "text-positive" : isNegative ? "text-negative" : "text-muted-foreground"
                      }`}
                    >
                      {isPositive ? "+" : isNegative ? "−" : ""}
                      {formatMoney(Math.abs(b.balance), groupCurrency)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Who owes whom</h3>
          <div className="inline-flex rounded-full border border-border bg-muted p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setView("all")}
              className={`rounded-full px-3 py-1 transition-colors ${
                view === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              All debts
            </button>
            <button
              type="button"
              onClick={() => setView("simplified")}
              className={`rounded-full px-3 py-1 transition-colors ${
                view === "simplified" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Simplified
            </button>
          </div>
        </div>

        {view === "simplified" && simplifiedDebts.length < pairwiseDebts.length && (
          <p className="mb-2 text-xs text-muted-foreground">
            Minimized to {simplifiedDebts.length} transaction{simplifiedDebts.length === 1 ? "" : "s"}
            {pairwiseDebts.length > 0 ? ` (from ${pairwiseDebts.length})` : ""}.
          </p>
        )}

        {debtsToShow.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Everyone&apos;s settled up 🎉
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {debtsToShow.map((debt, i) => (
                  <TableRow key={`${debt.from_user}-${debt.to_user}-${i}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={avatar(debt.from_user)} />
                          <AvatarFallback className="text-xs">{initials(name(debt.from_user))}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {debt.from_user === currentUserId ? "You" : name(debt.from_user)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={avatar(debt.to_user)} />
                          <AvatarFallback className="text-xs">{initials(name(debt.to_user))}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {debt.to_user === currentUserId ? "You" : name(debt.to_user)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums text-negative">
                      {formatMoney(debt.amount, groupCurrency)}
                    </TableCell>
                    <TableCell>
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
                        currentUserId={currentUserId}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
