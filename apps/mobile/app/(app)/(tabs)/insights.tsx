import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect } from "react-native-svg";
import { Layers, Receipt } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { SkeletonCardRows } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useMyGroups, useAllExpenses } from "@/hooks/use-groups";
import { formatMoney } from "@/lib/format";

const BAR_COLORS = ["#16A88F", "#2E9E6B", "#E0A63A", "#6B7169", "#D95F5F", "#8AB9AC"];
const BAR_MAX_WIDTH = 220;

/**
 * Top-level Insights tab — spending broken down by category, per currency
 * (currencies are never blended into one total; a group's PHP expenses and
 * another group's USD expenses are shown as separate sections). Aggregates
 * across every group the user belongs to, unlike the per-group SpendingChart.
 */
export default function InsightsScreen() {
  const { data: groups } = useMyGroups();
  const { data: expenses, isLoading, isError, refetch } = useAllExpenses();

  const byCurrency = useMemo(() => {
    const groups = new Map<string, { label: string; amount: number }[]>();
    const totals = new Map<string, number>();
    for (const e of expenses ?? []) {
      totals.set(e.currency, (totals.get(e.currency) ?? 0) + e.amount);
      const key = e.category?.trim() || "other";
      const list = groups.get(e.currency) ?? [];
      const existing = list.find((l) => l.label === key);
      if (existing) existing.amount += e.amount;
      else list.push({ label: key, amount: e.amount });
      groups.set(e.currency, list);
    }
    return [...groups.entries()]
      .map(([currency, categories]) => ({
        currency,
        total: totals.get(currency) ?? 0,
        categories: categories.sort((a, b) => b.amount - a.amount).slice(0, 6),
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-neutral-900" edges={["top"]}>
      <View className="px-5 pb-2 pt-4">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Insights</Text>
        <Text className="text-neutral-500">Where your shared money is going</Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-5 pb-32 pt-2" showsVerticalScrollIndicator={false}>
        {isLoading && <SkeletonCardRows count={3} />}

        {!isLoading && isError && (
          <ErrorState message="Couldn't load insights." onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && (
          <View className="flex-row gap-3">
            <Card className="flex-1 items-start gap-1">
              <Layers color="#16A88F" size={18} />
              <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {groups?.length ?? 0}
              </Text>
              <Text className="text-xs text-neutral-500">Active groups</Text>
            </Card>
            <Card className="flex-1 items-start gap-1">
              <Receipt color="#16A88F" size={18} />
              <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {expenses?.length ?? 0}
              </Text>
              <Text className="text-xs text-neutral-500">Expenses logged</Text>
            </Card>
          </View>
        )}

        {!isLoading && !isError && byCurrency.length === 0 && (
          <Text className="mt-10 rounded-2xl border border-dashed border-neutral-500/25 py-14 text-center text-sm text-neutral-500">
            No expenses yet. Once you add some, spending by category shows up here.
          </Text>
        )}

        {!isLoading &&
          !isError &&
          byCurrency.map(({ currency, total, categories }) => {
            const max = Math.max(...categories.map((c) => c.amount), 0.01);
            return (
              <Card key={currency} className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Spending by category · {currency}
                  </Text>
                  <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatMoney(total, currency)}
                  </Text>
                </View>
                <View className="gap-2.5 pt-1">
                  {categories.map((c, i) => {
                    const width = Math.max(6, (c.amount / max) * BAR_MAX_WIDTH);
                    return (
                      <View key={c.label} className="gap-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs capitalize text-neutral-500" numberOfLines={1}>
                            {c.label}
                          </Text>
                          <Text className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                            {formatMoney(c.amount, currency)}
                          </Text>
                        </View>
                        <Svg width={BAR_MAX_WIDTH} height={8}>
                          <Rect x={0} y={0} width={BAR_MAX_WIDTH} height={8} rx={4} fill="#6B7169" opacity={0.12} />
                          <Rect x={0} y={0} width={width} height={8} rx={4} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                        </Svg>
                      </View>
                    );
                  })}
                </View>
              </Card>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}
