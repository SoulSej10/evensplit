import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {
  computeAllAccountBalances,
  computeBudgetProgress,
  filterTransactionsForCurrentMonth,
} from "@evensplit/shared";
import { ArrowDownLeft, ArrowsLeftRight as ArrowLeftRight, ArrowUpRight, PiggyBank } from "phosphor-react-native";
import { Card } from "@/components/ui/Card";
import {
  usePersonalAccounts,
  usePersonalBudgets,
  usePersonalCategories,
  usePersonalTransactions,
} from "@/hooks/use-personal";
import { formatDate, formatMoney } from "@/lib/format";
import type { PersonalTransaction } from "@evensplit/shared";

const RECENT_COUNT = 5;

function TransactionIcon({ kind }: { kind: PersonalTransaction["kind"] }) {
  const isCredit = kind === "income" || kind === "group_reimbursement";
  const isDebit = kind === "expense" || kind === "group_advance";
  const tint = isCredit ? "bg-positive/10" : isDebit ? "bg-negative/10" : "bg-neutral-500/10";
  return (
    <View className={`h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
      {isCredit && <ArrowDownLeft color="#009B87" size={16} />}
      {isDebit && <ArrowUpRight color="#D95F5F" size={16} />}
      {kind === "transfer" && <ArrowLeftRight color="#6B7169" size={16} />}
    </View>
  );
}

/**
 * Finance Overview - composes existing data (accounts, transactions,
 * budgets) that's already fetched elsewhere in Finances, rather than
 * duplicating the always-visible FinancesSummaryCard above these tabs.
 */
export function OverviewTabView({ onNavigateTab }: { onNavigateTab: (tab: "accounts" | "records" | "budgets") => void }) {
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
    <View className="gap-5">
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-neutral-500">Accounts</Text>
          <Pressable onPress={() => onNavigateTab("accounts")}>
            <Text className="text-sm font-semibold text-primary">See all</Text>
          </Pressable>
        </View>
        {!accountsLoading && (accounts ?? []).length === 0 && (
          <Text className="text-sm text-neutral-500">No accounts yet.</Text>
        )}
        {(accounts ?? []).map((account) => {
          const balance = balances.find((b) => b.account_id === account.id)?.balance ?? 0;
          return (
            <Card key={account.id} className="flex-row items-center gap-3 py-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-light">
                <Text className="text-base">{account.icon ?? "💵"}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{account.name}</Text>
                <Text className="text-xs capitalize text-neutral-500">{account.type}</Text>
              </View>
              <Text className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {formatMoney(balance, account.currency)}
              </Text>
            </Card>
          );
        })}
      </View>

      {budgetHighlight && (
        <Pressable onPress={() => onNavigateTab("budgets")}>
          <Card className="gap-2">
            <View className="flex-row items-center gap-2">
              <PiggyBank color="#16A88F" size={16} />
              <Text className="flex-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {budgetHighlight.category_name} budget
              </Text>
              <Text className="text-xs text-neutral-500">
                {formatMoney(budgetHighlight.spent, accounts?.[0]?.currency ?? "PHP")} /{" "}
                {formatMoney(budgetHighlight.limit, accounts?.[0]?.currency ?? "PHP")}
              </Text>
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
              <View
                className={`h-full ${
                  budgetHighlight.percent > 100 ? "bg-negative" : budgetHighlight.percent >= 80 ? "bg-accent" : "bg-primary"
                }`}
                style={{ width: `${Math.min(budgetHighlight.percent, 100)}%` }}
              />
            </View>
          </Card>
        </Pressable>
      )}

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-neutral-500">Recent transactions</Text>
          <Pressable onPress={() => onNavigateTab("records")}>
            <Text className="text-sm font-semibold text-primary">See all</Text>
          </Pressable>
        </View>
        {!transactionsLoading && recentTransactions.length === 0 && (
          <Text className="text-sm text-neutral-500">No transactions yet.</Text>
        )}
        {recentTransactions.map((tx) => (
          <Card key={tx.id} className="flex-row items-center gap-3 py-2.5">
            <TransactionIcon kind={tx.kind} />
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
                {tx.kind === "transfer"
                  ? `${accountName(tx.account_id)} → ${accountName(tx.transfer_account_id ?? "")}`
                  : tx.kind === "group_advance"
                    ? "Advanced for others"
                    : tx.kind === "group_reimbursement"
                      ? "Reimbursement received"
                      : tx.kind === "income"
                        ? "Income"
                        : "Expense"}
              </Text>
              <Text className="text-xs text-neutral-500" numberOfLines={1}>
                {formatDate(tx.occurred_at)} · {accountName(tx.account_id)}
              </Text>
            </View>
            <Text className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {formatMoney(tx.amount, accounts?.find((a) => a.id === tx.account_id)?.currency ?? "PHP")}
            </Text>
          </Card>
        ))}
      </View>
    </View>
  );
}
