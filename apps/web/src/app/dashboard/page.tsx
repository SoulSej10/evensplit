"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  computeAllAccountBalances,
  computeBudgetProgress,
  computeSharedBalancesSummary,
  filterTransactionsForCurrentMonth,
  type GroupBalanceInput,
} from "@evensplit/shared";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  Clock,
  PiggyBank,
  Users,
  Wallet,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/app-shell/top-nav";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupCard } from "@/components/groups/group-card";
import { AddTransactionDialog } from "@/components/personal/add-transaction-dialog";
import { SettlementReceiptBanner } from "@/components/personal/settlement-receipt-banner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard, MetricCardGrid } from "@/components/ui/metric-card";
import { useAuth } from "@/hooks/use-auth";
import { useAllActivity, useAllExpenses, useAllSettlements, useMyGroups } from "@/hooks/use-groups";
import { usePersonalAccounts, usePersonalBudgets, usePersonalCategories, usePersonalTransactions } from "@/hooks/use-personal";
import { formatMoney } from "@/lib/format";

const GROUPS_PREVIEW_COUNT = 3;
const ACTIVITY_PREVIEW_COUNT = 5;
const UPCOMING_PREVIEW_COUNT = 3;

/**
 * Home: the financial command center. Composes existing, real, data-driven
 * pieces rather than a fully custom layout - every number here comes from
 * data already being fetched elsewhere in the app, just aggregated for a
 * top-level view. Mirrors apps/mobile's Home.
 */
function DashboardContent() {
  const { authUser, profile } = useAuth();
  const { data: groups, isLoading } = useMyGroups();
  const { data: allExpenses } = useAllExpenses();
  const { data: allSettlements } = useAllSettlements();
  const { data: allActivity } = useAllActivity();
  const { data: accounts } = usePersonalAccounts();
  const { data: budgets } = usePersonalBudgets();
  const { data: categories } = usePersonalCategories();
  const { data: transactions } = usePersonalTransactions();

  const preview = (groups ?? []).slice(0, GROUPS_PREVIEW_COUNT);

  const sharedBalances = useMemo(() => {
    if (!authUser || !groups || !allExpenses || !allSettlements) return [];
    const inputs: GroupBalanceInput[] = groups.map((g) => ({
      group_id: g.id,
      currency: g.currency,
      member_ids: g.group_members.map((m) => m.user_id),
      expenses: allExpenses.filter((e) => e.group_id === g.id),
      expense_shares: allExpenses.filter((e) => e.group_id === g.id).flatMap((e) => e.expense_shares),
      settlements: allSettlements.filter((s) => s.group_id === g.id),
    }));
    return computeSharedBalancesSummary(inputs, authUser.id);
  }, [authUser, groups, allExpenses, allSettlements]);

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

  const personalTotals = useMemo(() => {
    if (!accounts || accounts.length === 0) return null;
    const balances = computeAllAccountBalances(accounts, transactions ?? []);
    const total = balances.reduce((sum, b) => sum + b.balance, 0);
    let monthExpense = 0;
    for (const tx of filterTransactionsForCurrentMonth(transactions ?? [])) {
      if (tx.kind === "expense") monthExpense += tx.amount;
    }
    return { total, currency: accounts[0].currency, monthExpense };
  }, [accounts, transactions]);

  const primaryShared = sharedBalances[0] ?? null;
  const sharedCurrency = primaryShared?.currency ?? profile?.default_currency ?? "PHP";

  const upcomingRecurring = useMemo(() => {
    return (allExpenses ?? [])
      .filter((e) => e.is_recurring && e.next_occurrence_date)
      .sort((a, b) => (a.next_occurrence_date! < b.next_occurrence_date! ? -1 : 1))
      .slice(0, UPCOMING_PREVIEW_COUNT);
  }, [allExpenses]);

  const recentActivity = (allActivity ?? []).slice(0, ACTIVITY_PREVIEW_COUNT);
  const groupById = new Map((groups ?? []).map((g) => [g.id, g]));

  const unconfirmedSettlements = (allSettlements ?? []).filter(
    (s) => s.to_user === authUser?.id && s.to_account_id === null
  );

  function memberName(groupId: string, userId: string) {
    if (userId === authUser?.id) return "You";
    const group = groupById.get(groupId);
    return group?.group_members.find((m) => m.user_id === userId)?.users?.display_name ?? "Someone";
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile?.display_name ? `Good to see you, ${profile.display_name.split(" ")[0]}` : "Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground">Your shared balances and personal finances, in one place.</p>
      </div>

      <SettlementReceiptBanner
        unconfirmed={unconfirmedSettlements}
        groupName={(id) => groupById.get(id)?.name ?? "a group"}
        groupCurrency={(id) => groupById.get(id)?.currency ?? "PHP"}
      />

      <MetricCardGrid className="mb-6">
        <MetricCard
          icon={ArrowDownLeft}
          label="Owed to you"
          value={formatMoney(primaryShared?.owedToYou ?? 0, sharedCurrency)}
          tone="positive"
        />
        <MetricCard
          icon={ArrowUpRight}
          label="You owe"
          value={formatMoney(primaryShared?.youOwe ?? 0, sharedCurrency)}
          tone="negative"
        />
        <MetricCard
          icon={Wallet}
          label="Personal balance"
          value={formatMoney(personalTotals?.total ?? 0, personalTotals?.currency ?? "PHP")}
          tone="primary"
          split={[
            { label: "Spent this mo.", value: formatMoney(personalTotals?.monthExpense ?? 0, personalTotals?.currency ?? "PHP") },
            { label: "Accounts", value: String(accounts?.length ?? 0) },
          ]}
        />
        <MetricCard icon={Users} label="Groups" value={String(groups?.length ?? 0)} tone="muted" />
      </MetricCardGrid>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <AddTransactionDialog
          initialKind="income"
          trigger={
            <button className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-border bg-card py-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted">
              <ArrowDownLeft className="h-4 w-4 text-positive" /> Income
            </button>
          }
        />
        <AddTransactionDialog
          initialKind="expense"
          trigger={
            <button className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-border bg-card py-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted">
              <ArrowUpRight className="h-4 w-4 text-negative" /> Expense
            </button>
          }
        />
        <AddTransactionDialog
          initialKind="transfer"
          trigger={
            <button className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-border bg-card py-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted">
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" /> Transfer
            </button>
          }
        />
      </div>

      {budgetHighlight && (
        <Link href="/personal/budgets">
          <Card className="mb-6 gap-2 p-4">
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

      {upcomingRecurring.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-base font-semibold">Upcoming</h2>
          <div className="grid gap-2">
            {upcomingRecurring.map((e) => (
              <Card key={e.id} className="flex-row items-center gap-3 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                  <p className="flex-1 truncate text-sm">{e.description}</p>
                  <p className="text-xs font-medium text-muted-foreground">{formatMoney(e.amount, e.currency)}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Your groups</h2>
        <div className="flex items-center gap-3">
          <CreateGroupDialog />
          <Link href="/groups" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      )}

      {!isLoading && preview.length === 0 && (
        <p className="text-sm text-muted-foreground">No groups yet — create one above.</p>
      )}

      {!isLoading && (
        <div className="grid gap-3">
          {preview.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      )}

      {recentActivity.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent activity</h2>
            <Link href="/groups" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {recentActivity.map((item, i) => (
              <div
                key={`${item.type}-${item.id}`}
                className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border/60" : ""}`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    item.type === "expense_added" ? "bg-primary" : "bg-positive"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  {item.type === "expense_added" ? (
                    <p className="truncate text-sm">
                      {memberName(item.group_id, item.paid_by)} added{" "}
                      <span className="font-semibold">{item.description}</span>
                    </p>
                  ) : (
                    <p className="truncate text-sm">
                      {memberName(item.group_id, item.from_user)} paid {memberName(item.group_id, item.to_user)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{groupById.get(item.group_id)?.name ?? "Group"}</p>
                </div>
                <Badge variant={item.type === "expense_added" ? "secondary" : "outline"} className="shrink-0">
                  {item.type === "expense_added" ? "Expense" : "Settlement"}
                </Badge>
                <span className="w-20 shrink-0 text-right font-mono text-sm font-semibold tabular-nums">
                  {formatMoney(
                    item.amount,
                    item.type === "expense_added" ? item.currency : (groupById.get(item.group_id)?.currency ?? "PHP")
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
