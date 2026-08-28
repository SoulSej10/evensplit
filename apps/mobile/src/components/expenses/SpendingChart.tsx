import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import type { User } from "@evensplit/shared";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { DonutChart } from "@/components/ui/DonutChart";
import { formatMoney } from "@/lib/format";
import type { ExpenseWithShares } from "@/lib/api/expenses";

type ChartMode = "category" | "member";

const BAR_COLORS = ["#5B3A8E", "#009B87", "#E0A63A", "#6B7169", "#D95F5F", "#8AB9AC"];
const DONUT_COLORS = ["#5B3A8E", "#9B7FD4", "#F5A524", "#009B87", "#D95F5F", "#726C7D"];

/**
 * Lightweight spending breakdown chart (Phase 6 stretch, best-effort) —
 * hand-rolled horizontal bar chart on react-native-svg (already a
 * dependency) rather than pulling in a charting library, per
 * PROJECT_PLAN §6 guidance to prefer that when it's "enough."
 *
 * Two views: spending by category, and spending by member (who paid).
 * Both are simple totals over the group's expenses — no time-bucketing,
 * kept intentionally small in scope.
 */
export function SpendingChart({
  expenses,
  groupCurrency,
  members,
}: {
  expenses: ExpenseWithShares[];
  groupCurrency: string;
  members: { user_id: string; users: User | null }[];
}) {
  const [mode, setMode] = useState<ChartMode>("category");

  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      // category is free text, not an enum - lowercase it for grouping so
      // "Food" and "food" don't split into two bars; the `capitalize` text
      // style below still displays it with a leading capital either way.
      const key =
        mode === "category"
          ? e.category?.trim().toLowerCase() || "other"
          : members.find((m) => m.user_id === e.paid_by)?.users?.display_name || "Someone";
      map.set(key, (map.get(key) ?? 0) + e.amount);
    }
    return [...map.entries()]
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [expenses, mode, members]);

  if (expenses.length === 0) return null;

  const max = Math.max(...totals.map((t) => t.amount), 0.01);
  const barMaxWidth = 220;

  return (
    <Card className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Spending breakdown
        </Text>
      </View>

      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { label: "By category", value: "category" },
          { label: "By member", value: "member" },
        ]}
      />

      {mode === "category" ? (
        <DonutChart
          centerLabel={formatMoney(
            totals.reduce((s, t) => s + t.amount, 0),
            groupCurrency
          )}
          segments={totals.map((t, i) => ({
            label: t.label,
            value: t.amount,
            color: DONUT_COLORS[i % DONUT_COLORS.length],
          }))}
        />
      ) : (
        <View className="gap-2.5 pt-1">
          {totals.map((t, i) => {
            const width = Math.max(6, (t.amount / max) * barMaxWidth);
            return (
              <View key={t.label} className="gap-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs capitalize text-neutral-500" numberOfLines={1}>
                    {t.label}
                  </Text>
                  <Text className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatMoney(t.amount, groupCurrency)}
                  </Text>
                </View>
                <Svg width={barMaxWidth} height={8}>
                  <Rect x={0} y={0} width={barMaxWidth} height={8} rx={4} fill="#6B7169" opacity={0.12} />
                  <Rect
                    x={0}
                    y={0}
                    width={width}
                    height={8}
                    rx={4}
                    fill={BAR_COLORS[i % BAR_COLORS.length]}
                  />
                </Svg>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}
