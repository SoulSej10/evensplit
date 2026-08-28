import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  computeCategoryBreakdown,
  computeDailyTotals,
  computeExpenseTrend,
} from "@evensplit/shared";
import { PieChart } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SkeletonCardRows } from "@/components/ui/Skeleton";
import { DonutChart } from "@/components/ui/DonutChart";
import { LineChart } from "@/components/ui/LineChart";
import { MonthCalendar } from "@/components/ui/MonthCalendar";
import { cn } from "@/lib/cn";
import { usePersonalAccounts, usePersonalCategories, usePersonalTransactions } from "@/hooks/use-personal";
import { formatMoney } from "@/lib/format";

const DONUT_COLORS = ["#16A88F", "#35D6B5", "#F5A524", "#009B87", "#D95F5F", "#726C7D"];
const CATEGORY_ALL = "__all__";

export function AnalysisTabView() {
  const { data: transactions, isLoading } = usePersonalTransactions();
  const { data: categories } = usePersonalCategories();
  const { data: accounts } = usePersonalAccounts();
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [view, setView] = useState<"charts" | "calendar">("charts");
  const [categoryFilter, setCategoryFilter] = useState<string>(CATEGORY_ALL);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const currency = accounts?.[0]?.currency ?? "USD";

  const breakdown = useMemo(
    () => computeCategoryBreakdown(transactions ?? [], categories ?? [], kind).slice(0, 6),
    [transactions, categories, kind]
  );
  const trend = useMemo(() => computeExpenseTrend(transactions ?? []).slice(-14), [transactions]);

  const monthKey = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}`;
  const calendarTransactions = useMemo(
    () => (transactions ?? []).filter((t) => t.occurred_at.slice(0, 7) === monthKey),
    [transactions, monthKey]
  );
  const dailyTotals = useMemo(
    () => computeDailyTotals(calendarTransactions, categoryFilter === CATEGORY_ALL ? null : categoryFilter),
    [calendarTransactions, categoryFilter]
  );
  const relevantCategories = (categories ?? []).filter((c) => c.kind === kind);

  if (isLoading) return <SkeletonCardRows count={2} />;

  if (!transactions || transactions.length === 0) {
    return (
      <View className="items-center gap-2 py-14">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-light">
          <PieChart color="#16A88F" size={22} />
        </View>
        <Text className="text-sm text-neutral-500">Log a few transactions to see your breakdown.</Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <SegmentedControl
        value={view}
        onChange={setView}
        options={[
          { label: "Charts", value: "charts" },
          { label: "Calendar", value: "calendar" },
        ]}
      />

      <SegmentedControl
        value={kind}
        onChange={setKind}
        options={[
          { label: "Expense", value: "expense" },
          { label: "Income", value: "income" },
        ]}
      />

      {view === "charts" ? (
        <>
          <Card className="gap-3">
            <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">By category</Text>
            {breakdown.length === 0 ? (
              <Text className="py-6 text-center text-sm text-neutral-500">No {kind} records yet.</Text>
            ) : (
              <DonutChart
                centerLabel={formatMoney(
                  breakdown.reduce((s, b) => s + b.amount, 0),
                  currency
                )}
                segments={breakdown.map((b, i) => ({
                  label: b.category_name,
                  value: b.amount,
                  color: DONUT_COLORS[i % DONUT_COLORS.length],
                }))}
              />
            )}
          </Card>

          <Card className="gap-3">
            <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Income vs. expense</Text>
            {trend.length === 0 ? (
              <Text className="py-6 text-center text-sm text-neutral-500">No records yet.</Text>
            ) : (
              <LineChart
                series={[
                  { label: "Income", color: "#009B87", points: trend.map((t) => t.income) },
                  { label: "Expense", color: "#D95F5F", points: trend.map((t) => t.expense) },
                ]}
                labels={trend.map((t) => t.date.slice(5))}
              />
            )}
          </Card>
        </>
      ) : (
        <Card className="gap-3">
          <View className="flex-row flex-wrap gap-2">
            <Pressable
              onPress={() => setCategoryFilter(CATEGORY_ALL)}
              className={cn(
                "rounded-pill border px-3 py-1.5",
                categoryFilter === CATEGORY_ALL ? "border-primary bg-primary-light" : "border-neutral-500/20"
              )}
            >
              <Text
                className={cn(
                  "text-xs font-medium",
                  categoryFilter === CATEGORY_ALL ? "text-primary" : "text-neutral-500"
                )}
              >
                All categories
              </Text>
            </Pressable>
            {relevantCategories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCategoryFilter(c.id)}
                className={cn(
                  "rounded-pill border px-3 py-1.5",
                  categoryFilter === c.id ? "border-primary bg-primary-light" : "border-neutral-500/20"
                )}
              >
                <Text className={cn("text-xs font-medium", categoryFilter === c.id ? "text-primary" : "text-neutral-500")}>
                  {c.icon ? `${c.icon} ` : ""}
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <MonthCalendar
            year={calendarDate.getFullYear()}
            month={calendarDate.getMonth()}
            dailyTotals={dailyTotals}
            kind={kind}
            currency={currency}
            onPrevMonth={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            onNextMonth={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          />
        </Card>
      )}
    </View>
  );
}
