import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { computeCategoryBreakdown, computeDailyTotals } from "@evensplit/shared";
import { ChevronDown, ChevronLeft, ChevronRight, PieChart } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SkeletonCardRows } from "@/components/ui/Skeleton";
import { DonutChart } from "@/components/ui/DonutChart";
import { LineChart } from "@/components/ui/LineChart";
import { MonthCalendar } from "@/components/ui/MonthCalendar";
import { CategoryBreakdownList } from "@/components/ui/CategoryBreakdownList";
import { AccountBarChart, type AccountActivity } from "@/components/ui/AccountBarChart";
import { cn } from "@/lib/cn";
import { usePersonalAccounts, usePersonalCategories, usePersonalTransactions } from "@/hooks/use-personal";
import { formatMoney } from "@/lib/format";

const DONUT_COLORS = ["#5B3A8E", "#9B7FD4", "#F5A524", "#009B87", "#D95F5F", "#726C7D"];
const CATEGORY_ALL = "__all__";
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type ViewType = "expense-overview" | "income-overview" | "expense-flow" | "income-flow" | "account-analysis";

const VIEW_OPTIONS: { value: ViewType; label: string }[] = [
  { value: "expense-overview", label: "Spending breakdown" },
  { value: "income-overview", label: "Earnings breakdown" },
  { value: "expense-flow", label: "Daily spending" },
  { value: "income-flow", label: "Daily earnings" },
  { value: "account-analysis", label: "By account" },
];

/** Every day of the given month, zero-filled where there's no data — so a flow chart reads as one continuous month, not a handful of scattered points. */
function fullMonthSeries(dailyTotals: { date: string; expense: number; income: number }[], year: number, month: number, kind: "expense" | "income") {
  const byDate = new Map(dailyTotals.map((d) => [d.date, d]));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const points: number[] = [];
  const labels: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const entry = byDate.get(key);
    points.push(entry ? (kind === "expense" ? entry.expense : entry.income) : 0);
    labels.push(String(day));
  }
  return { points, labels };
}

export function AnalysisTabView() {
  const { data: transactions, isLoading } = usePersonalTransactions();
  const { data: categories } = usePersonalCategories();
  const { data: accounts } = usePersonalAccounts();
  const [viewType, setViewType] = useState<ViewType>("expense-overview");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>(CATEGORY_ALL);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const currency = accounts?.[0]?.currency ?? "USD";

  const today = new Date();
  const isCurrentMonth = calendarDate.getFullYear() === today.getFullYear() && calendarDate.getMonth() === today.getMonth();
  const monthKey = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}`;
  const monthTransactions = useMemo(
    () => (transactions ?? []).filter((t) => t.occurred_at.slice(0, 7) === monthKey),
    [transactions, monthKey]
  );

  const kind: "expense" | "income" = viewType === "income-overview" || viewType === "income-flow" ? "income" : "expense";

  const breakdown = useMemo(
    () => computeCategoryBreakdown(monthTransactions, categories ?? [], kind).slice(0, 8),
    [monthTransactions, categories, kind]
  );

  const dailyTotals = useMemo(
    () => computeDailyTotals(monthTransactions, categoryFilter === CATEGORY_ALL ? null : categoryFilter),
    [monthTransactions, categoryFilter]
  );

  const flowSeries = useMemo(
    () => fullMonthSeries(dailyTotals, calendarDate.getFullYear(), calendarDate.getMonth(), kind),
    [dailyTotals, calendarDate, kind]
  );

  const accountActivity: AccountActivity[] = useMemo(() => {
    return (accounts ?? []).map((a) => {
      let expense = 0;
      let income = 0;
      for (const t of monthTransactions) {
        if (t.account_id !== a.id) continue;
        if (t.kind === "expense") expense += t.amount;
        else if (t.kind === "income") income += t.amount;
      }
      return { accountId: a.id, name: a.name, icon: a.icon, expense, income, currency: a.currency };
    });
  }, [accounts, monthTransactions]);

  const relevantCategories = (categories ?? []).filter((c) => c.kind === kind);
  const currentLabel = VIEW_OPTIONS.find((o) => o.value === viewType)?.label ?? "";

  if (isLoading) return <SkeletonCardRows count={2} />;

  if (!transactions || transactions.length === 0) {
    return (
      <View className="items-center gap-2 py-14">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-light">
          <PieChart color="#5B3A8E" size={22} />
        </View>
        <Text className="text-sm text-neutral-500">Log a few transactions to see your breakdown.</Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          hitSlop={10}
          className="h-8 w-8 items-center justify-center rounded-lg bg-neutral-500/10"
        >
          <ChevronLeft color="#6B7169" size={16} />
        </Pressable>
        <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {MONTH_NAMES[calendarDate.getMonth()]} {calendarDate.getFullYear()}
        </Text>
        <Pressable
          onPress={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          disabled={isCurrentMonth}
          hitSlop={10}
          className={cn("h-8 w-8 items-center justify-center rounded-lg bg-neutral-500/10", isCurrentMonth && "opacity-30")}
        >
          <ChevronRight color="#6B7169" size={16} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => setPickerOpen(true)}
        className="flex-row items-center justify-center gap-1.5 self-center rounded-pill border border-neutral-500/25 px-4 py-2"
      >
        <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{currentLabel}</Text>
        <ChevronDown color="#6B7169" size={16} />
      </Pressable>

      {(viewType === "expense-overview" || viewType === "income-overview") && (
        <Card className="gap-4">
          {breakdown.length === 0 ? (
            <Text className="py-6 text-center text-sm text-neutral-500">No {kind} records this month.</Text>
          ) : (
            <>
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
              <CategoryBreakdownList
                currency={currency}
                rows={breakdown.map((b, i) => ({
                  label: b.category_name,
                  icon: categories?.find((c) => c.id === b.category_id)?.icon,
                  amount: b.amount,
                  percent: b.percent,
                  color: DONUT_COLORS[i % DONUT_COLORS.length],
                }))}
              />
            </>
          )}
        </Card>
      )}

      {(viewType === "expense-flow" || viewType === "income-flow") && (
        <>
          <Card className="gap-3">
            <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Daily {kind === "expense" ? "spending" : "earnings"}
            </Text>
            <LineChart
              series={[
                {
                  label: kind === "expense" ? "Expense" : "Income",
                  color: kind === "expense" ? "#D95F5F" : "#009B87",
                  points: flowSeries.points,
                },
              ]}
              labels={flowSeries.labels}
            />
          </Card>

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
        </>
      )}

      {viewType === "account-analysis" && (
        <Card>
          <AccountBarChart accounts={accountActivity} />
        </Card>
      )}

      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Choose analysis">
        {VIEW_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => {
              setViewType(opt.value);
              setPickerOpen(false);
            }}
            className="flex-row items-center justify-between py-3"
          >
            <Text
              className={cn(
                "text-base",
                viewType === opt.value ? "font-semibold text-primary" : "text-neutral-900 dark:text-neutral-100"
              )}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  );
}
