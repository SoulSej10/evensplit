import { useMemo } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { computeBudgetProgress, filterTransactionsForCurrentMonth } from "@evensplit/shared";
import { PiggyBank, Trash as Trash2 } from "phosphor-react-native";
import { Card } from "@/components/ui/Card";
import { SkeletonCardRows } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  useDeletePersonalBudget,
  usePersonalAccounts,
  usePersonalBudgets,
  usePersonalCategories,
  usePersonalTransactions,
} from "@/hooks/use-personal";
import { formatMoney } from "@/lib/format";

/** The "Set budget" action lives in finances.tsx's floating action button, not inline here. */
export function BudgetsTabView() {
  const { data: budgets, isLoading, isError, refetch } = usePersonalBudgets();
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

  function onDelete(id: string) {
    Alert.alert("Remove this budget?", "", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteBudget.mutate(id) },
    ]);
  }

  if (isLoading) return <SkeletonCardRows count={3} />;
  if (isError) return <ErrorState message="Couldn't load budgets." onRetry={() => refetch()} />;

  return (
    <View className="gap-3">
      {progress.length === 0 && (
        <View className="items-center gap-2 py-14">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-light">
            <PiggyBank color="#16A88F" size={22} />
          </View>
          <Text className="text-sm text-neutral-500">Set a monthly limit for a category to track it here.</Text>
        </View>
      )}

      {budgets?.map((budget) => {
        const p = progress.find((entry) => entry.category_id === budget.category_id);
        if (!p) return null;
        const overBudget = p.percent > 100;
        const approaching = !overBudget && p.percent >= 80;
        const barWidth = Math.min(p.percent, 100);
        const barColorClass = overBudget ? "bg-negative" : approaching ? "bg-accent" : "bg-primary";
        const amountColorClass = overBudget ? "text-negative" : approaching ? "text-accent-deep" : "text-neutral-500";
        return (
          <Card key={budget.id} className="gap-2 py-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-medium text-neutral-900 dark:text-neutral-100">{p.category_name}</Text>
              <View className="flex-row items-center gap-2">
                <Text className={`text-xs ${amountColorClass}`}>
                  {formatMoney(p.spent, currency)} / {formatMoney(p.limit, currency)}
                </Text>
                <Pressable onPress={() => onDelete(budget.id)} hitSlop={10}>
                  <Trash2 color="#D95F5F" size={14} />
                </Pressable>
              </View>
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
              <View className={`h-full ${barColorClass}`} style={{ width: `${barWidth}%` }} />
            </View>
            {overBudget && (
              <Text className="text-xs text-negative">{formatMoney(Math.abs(p.remaining), currency)} over budget</Text>
            )}
            {approaching && (
              <Text className="text-xs text-accent-deep">Approaching limit — {formatMoney(p.remaining, currency)} left</Text>
            )}
          </Card>
        );
      })}
    </View>
  );
}
