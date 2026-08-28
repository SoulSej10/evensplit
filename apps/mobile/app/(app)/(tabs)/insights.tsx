import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Bell, Layers, Receipt } from "lucide-react-native";
import {
  computeCategoryBreakdown,
  computeDailyTotals,
  computeSharedFinanceSummary,
  filterTransactionsForCurrentMonth,
  type DailyTotal,
} from "@evensplit/shared";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SkeletonCardRows } from "@/components/ui/Skeleton";
import { EdgeFade } from "@/components/ui/EdgeFade";
import { ErrorState } from "@/components/ui/ErrorState";
import { DonutChart } from "@/components/ui/DonutChart";
import { MonthCalendar } from "@/components/ui/MonthCalendar";
import { useAuth } from "@/hooks/use-auth";
import { useSettingsDrawer } from "@/context/settings-drawer";
import { useMyGroups, useAllExpenses } from "@/hooks/use-groups";
import { usePersonalAccounts, usePersonalCategories, usePersonalTransactions } from "@/hooks/use-personal";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

const DONUT_COLORS = ["#16A88F", "#35D6B5", "#F5A524", "#009B87", "#D95F5F", "#726C7D"];
const CATEGORY_ALL = "__all__";

function CategoryDonut({
  title,
  total,
  currency,
  categories,
}: {
  title: string;
  total: number;
  currency: string;
  categories: { label: string; amount: number }[];
}) {
  return (
    <Card className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</Text>
        <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {formatMoney(total, currency)}
        </Text>
      </View>
      <DonutChart
        centerLabel={formatMoney(total, currency)}
        segments={categories.map((c, i) => ({
          label: c.label,
          value: c.amount,
          color: DONUT_COLORS[i % DONUT_COLORS.length],
        }))}
      />
    </Card>
  );
}

/**
 * Top-level Insights tab — spending broken down by category, per currency
 * (currencies are never blended into one total; a group's PHP expenses and
 * another group's USD expenses are shown as separate sections). Aggregates
 * across every group the user belongs to, unlike the per-group SpendingChart.
 */
export default function InsightsScreen() {
  const { profile, authUser } = useAuth();
  const { open: openSettings } = useSettingsDrawer();
  const { data: groups } = useMyGroups();
  const { data: expenses, isLoading, isError, refetch } = useAllExpenses();
  const { data: personalTransactions } = usePersonalTransactions();
  const { data: personalCategories } = usePersonalCategories();
  const { data: personalAccounts } = usePersonalAccounts();

  const [view, setView] = useState<"charts" | "calendar">("charts");
  const [categoryFilter, setCategoryFilter] = useState<string>(CATEGORY_ALL);
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const personalCurrency = personalAccounts?.[0]?.currency ?? "PHP";

  const monthTransactions = useMemo(
    () => filterTransactionsForCurrentMonth(personalTransactions ?? []),
    [personalTransactions]
  );

  const personalBreakdown = useMemo(
    () => computeCategoryBreakdown(monthTransactions, personalCategories ?? [], "expense"),
    [monthTransactions, personalCategories]
  );
  const personalMonthTotal = personalBreakdown.reduce((sum, c) => sum + c.amount, 0);

  const sharedSummary = useMemo(() => computeSharedFinanceSummary(monthTransactions), [monthTransactions]);

  /** This user's own share of every group expense this month, per currency — never blended. */
  const sharedParticipationByCurrency = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const totals = new Map<string, number>();
    for (const e of expenses ?? []) {
      if (e.expense_date.slice(0, 7) !== monthKey) continue;
      const myShare = e.expense_shares.find((s) => s.user_id === authUser?.id)?.share_amount ?? 0;
      totals.set(e.currency, (totals.get(e.currency) ?? 0) + myShare);
    }
    return [...totals.entries()].filter(([, amount]) => amount > 0.005);
  }, [expenses, authUser]);

  const hasNarrative =
    personalMonthTotal > 0.005 ||
    sharedParticipationByCurrency.length > 0 ||
    sharedSummary.advanced > 0.005 ||
    sharedSummary.recovered > 0.005;

  const byCurrency = useMemo(() => {
    const groups = new Map<string, { label: string; amount: number }[]>();
    const totals = new Map<string, number>();
    for (const e of expenses ?? []) {
      totals.set(e.currency, (totals.get(e.currency) ?? 0) + e.amount);
      // category is free text, not an enum - lowercase it for grouping so
      // "Food" and "food" don't split into two entries.
      const key = e.category?.trim().toLowerCase() || "other";
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

  /** All free-text group-expense category labels seen, for the calendar filter pills. */
  const groupCategoryLabels = useMemo(() => {
    const labels = new Set<string>();
    for (const e of expenses ?? []) labels.add(e.category?.trim().toLowerCase() || "other");
    return [...labels].sort();
  }, [expenses]);

  const monthKey = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}`;

  /** Group expenses (all currencies mixed — the calendar is a date-shape view, not a totals view) as daily totals. */
  const groupDailyTotals: DailyTotal[] = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of expenses ?? []) {
      if (e.expense_date.slice(0, 7) !== monthKey) continue;
      const label = e.category?.trim().toLowerCase() || "other";
      if (categoryFilter !== CATEGORY_ALL && label !== categoryFilter) continue;
      const day = e.expense_date.slice(0, 10);
      totals.set(day, (totals.get(day) ?? 0) + e.amount);
    }
    return [...totals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, expense]) => ({ date, expense, income: 0 }));
  }, [expenses, monthKey, categoryFilter]);

  const personalCalendarTransactions = useMemo(
    () => (personalTransactions ?? []).filter((t) => t.occurred_at.slice(0, 7) === monthKey),
    [personalTransactions, monthKey]
  );
  const personalDailyTotals = useMemo(
    () => computeDailyTotals(personalCalendarTransactions),
    [personalCalendarTransactions]
  );

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-neutral-900" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pb-1 pt-3">
        <Pressable
          onPress={openSettings}
          className="flex-row items-center gap-2.5 active:opacity-70"
          accessibilityLabel="Settings"
        >
          <Avatar name={profile?.display_name} uri={profile?.avatar_url} size={38} />
        </Pressable>
        <Pressable
          onPress={() => router.navigate("/(app)/(tabs)/activity")}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70 dark:bg-surface-dark"
          accessibilityLabel="Activity"
        >
          <Bell color="#0A0A0A" size={18} />
        </Pressable>
      </View>

      <View className="px-5 pb-2 pt-1">
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

        {!isLoading && !isError && (
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { label: "Charts", value: "charts" },
              { label: "Calendar", value: "calendar" },
            ]}
          />
        )}

        {!isLoading && !isError && view === "charts" && hasNarrative && (
          <Card className="gap-1.5">
            <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">This month</Text>
            {personalMonthTotal > 0.005 && (
              <Text className="text-sm text-neutral-700 dark:text-neutral-300">
                You spent {formatMoney(personalMonthTotal, personalCurrency)} personally.
              </Text>
            )}
            {sharedParticipationByCurrency.map(([currency, amount]) => (
              <Text key={currency} className="text-sm text-neutral-700 dark:text-neutral-300">
                You were part of {formatMoney(amount, currency)} in shared group spending.
              </Text>
            ))}
            {(sharedSummary.advanced > 0.005 || sharedSummary.recovered > 0.005) && (
              <Text className="text-sm text-neutral-700 dark:text-neutral-300">
                You've advanced {formatMoney(sharedSummary.advanced, personalCurrency)} for others and recovered{" "}
                {formatMoney(sharedSummary.recovered, personalCurrency)}
                {sharedSummary.outstanding > 0.005
                  ? `, with ${formatMoney(sharedSummary.outstanding, personalCurrency)} still outstanding.`
                  : "."}
              </Text>
            )}
          </Card>
        )}

        {!isLoading && !isError && view === "charts" && personalBreakdown.length > 0 && (
          <CategoryDonut
            title="Personal spending by category"
            total={personalMonthTotal}
            currency={personalCurrency}
            categories={personalBreakdown.map((c) => ({ label: c.category_name, amount: c.amount }))}
          />
        )}

        {!isLoading && !isError && view === "charts" && byCurrency.length === 0 && (
          <Text className="mt-10 rounded-card border border-dashed border-neutral-500/25 py-14 text-center text-sm text-neutral-500">
            No expenses yet. Once you add some, spending by category shows up here.
          </Text>
        )}

        {!isLoading &&
          !isError &&
          view === "charts" &&
          byCurrency.map(({ currency, total, categories }) => (
            <CategoryDonut
              key={currency}
              title={`Spending by category · ${currency}`}
              total={total}
              currency={currency}
              categories={categories}
            />
          ))}

        {!isLoading && !isError && view === "calendar" && (
          <>
            <Card className="gap-3">
              <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Personal</Text>
              <MonthCalendar
                year={calendarDate.getFullYear()}
                month={calendarDate.getMonth()}
                dailyTotals={personalDailyTotals}
                kind="expense"
                currency={personalCurrency}
                onPrevMonth={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                onNextMonth={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              />
            </Card>

            <Card className="gap-3">
              <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Group expenses</Text>
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
                {groupCategoryLabels.map((label) => (
                  <Pressable
                    key={label}
                    onPress={() => setCategoryFilter(label)}
                    className={cn(
                      "rounded-pill border px-3 py-1.5",
                      categoryFilter === label ? "border-primary bg-primary-light" : "border-neutral-500/20"
                    )}
                  >
                    <Text
                      className={cn(
                        "text-xs font-medium capitalize",
                        categoryFilter === label ? "text-primary" : "text-neutral-500"
                      )}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text className="text-[10px] text-neutral-500">
                Amounts mix currencies across groups — use this view for activity shape, not totals.
              </Text>
              <MonthCalendar
                year={calendarDate.getFullYear()}
                month={calendarDate.getMonth()}
                dailyTotals={groupDailyTotals}
                kind="expense"
                currency={byCurrency[0]?.currency ?? personalCurrency}
                onPrevMonth={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                onNextMonth={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              />
            </Card>
          </>
        )}
      </ScrollView>
      <EdgeFade edge="bottom" />
    </SafeAreaView>
  );
}
