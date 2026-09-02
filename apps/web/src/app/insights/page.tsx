"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { WarningCircle as AlertCircle, ArrowsLeftRight as ArrowRightLeft, Stack as Layers, ChartPie as PieChartIcon, Receipt, Wallet } from "@phosphor-icons/react";
import {
  computeCategoryBreakdown,
  computeDailyTotals,
  computeSharedFinanceSummary,
  filterTransactionsForCurrentMonth,
  type DailyTotal,
} from "@evensplit/shared";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/app-shell/top-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard, MetricCardGrid } from "@/components/ui/metric-card";
import { SegmentedTabs } from "@/components/personal/segmented-tabs";
import { MonthCalendar } from "@/components/personal/month-calendar";
import { useAuth } from "@/hooks/use-auth";
import { useMyGroups, useAllExpenses } from "@/hooks/use-groups";
import { usePersonalAccounts, usePersonalCategories, usePersonalTransactions } from "@/hooks/use-personal";
import { formatMoney } from "@/lib/format";

const CATEGORY_ALL = "__all__";

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  borderColor: "var(--border)",
  borderRadius: "0.75rem",
  fontSize: "0.75rem",
  color: "var(--card-foreground)",
};

function CategoryPieChart({
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
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-sm font-semibold">{formatMoney(total, currency)}</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories.map((c) => ({ name: c.label, value: c.amount }))}
              dataKey="value"
              nameKey="name"
              innerRadius={65}
              outerRadius={105}
            >
              {categories.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatMoney(Number(value), currency)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 space-y-3">
        {categories.map((c, i) => {
          const percent = total > 0 ? (c.amount / total) * 100 : 0;
          return (
            <li key={c.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 capitalize">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {c.label}
                </span>
                <span className="font-medium">{formatMoney(c.amount, currency)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, percent)}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-muted-foreground">{percent.toFixed(0)}%</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Top-level Insights: spending broken down by category, aggregated across
 * every group the user belongs to (not just one group at a time — that's
 * the per-group Insights tab inside a group's own page). Currencies are
 * never blended into one total; each currency gets its own section.
 * Mirrors apps/mobile's top-level Insights tab.
 */
function InsightsContent() {
  const { authUser } = useAuth();
  const { data: groups } = useMyGroups();
  const { data: expenses, isLoading, isError, refetch, isRefetching } = useAllExpenses();
  const { data: personalTransactions } = usePersonalTransactions();
  const { data: personalCategories } = usePersonalCategories();
  const { data: personalAccounts } = usePersonalAccounts();

  const personalCurrency = personalAccounts?.[0]?.currency ?? "PHP";

  const [view, setView] = useState<"charts" | "calendar">("charts");
  const [categoryFilter, setCategoryFilter] = useState<string>(CATEGORY_ALL);
  const [calendarDate, setCalendarDate] = useState(() => new Date());

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
    // Keyed and matched by the lowercased category (free text, not an
    // enum - "Food" and "food" must land in the same bucket); capitalized
    // only in the final label below, once, since this also feeds the
    // recharts Pie/Tooltip (SVG/portal content a CSS `capitalize` class on
    // a parent wouldn't reach).
    const byCat = new Map<string, Map<string, number>>();
    const totals = new Map<string, number>();
    for (const e of expenses ?? []) {
      totals.set(e.currency, (totals.get(e.currency) ?? 0) + e.amount);
      const key = e.category?.trim().toLowerCase() || "uncategorized";
      const categories = byCat.get(e.currency) ?? new Map<string, number>();
      categories.set(key, (categories.get(key) ?? 0) + e.amount);
      byCat.set(e.currency, categories);
    }
    return [...byCat.entries()]
      .map(([currency, categories]) => ({
        currency,
        total: totals.get(currency) ?? 0,
        categories: [...categories.entries()]
          .map(([key, amount]) => ({ label: key.charAt(0).toUpperCase() + key.slice(1), amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 6),
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  /** Total expense activity per group, for the "By group" comparison chart. */
  const byGroup = useMemo(() => {
    const groupById = new Map((groups ?? []).map((g) => [g.id, g]));
    const totals = new Map<string, number>();
    for (const e of expenses ?? []) {
      totals.set(e.group_id, (totals.get(e.group_id) ?? 0) + e.amount);
    }
    return [...totals.entries()]
      .map(([groupId, total]) => ({
        name: groupById.get(groupId)?.name ?? "Group",
        total,
        currency: groupById.get(groupId)?.currency ?? personalCurrency,
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenses, groups, personalCurrency]);

  /** All free-text group-expense category labels seen, for the calendar filter pills. */
  const groupCategoryLabels = useMemo(() => {
    const labels = new Set<string>();
    for (const e of expenses ?? []) labels.add(e.category?.trim().toLowerCase() || "other");
    return [...labels].sort();
  }, [expenses]);

  const calendarMonthKey = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}`;

  /** Group expenses (all currencies mixed — the calendar is a date-shape view, not a totals view) as daily totals. */
  const groupDailyTotals: DailyTotal[] = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of expenses ?? []) {
      if (e.expense_date.slice(0, 7) !== calendarMonthKey) continue;
      const label = e.category?.trim().toLowerCase() || "other";
      if (categoryFilter !== CATEGORY_ALL && label !== categoryFilter) continue;
      const day = e.expense_date.slice(0, 10);
      totals.set(day, (totals.get(day) ?? 0) + e.amount);
    }
    return [...totals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, expense]) => ({ date, expense, income: 0 }));
  }, [expenses, calendarMonthKey, categoryFilter]);

  const personalCalendarTransactions = useMemo(
    () => (personalTransactions ?? []).filter((t) => t.occurred_at.slice(0, 7) === calendarMonthKey),
    [personalTransactions, calendarMonthKey]
  );
  const personalDailyTotals = useMemo(
    () => computeDailyTotals(personalCalendarTransactions),
    [personalCalendarTransactions]
  );

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
          <p className="text-sm text-muted-foreground">Where your shared money is going</p>
        </div>
        {!isLoading && !isError && (
          <SegmentedTabs
            value={view}
            onChange={(v) => setView(v as "charts" | "calendar")}
            options={[
              { value: "charts", label: "Charts" },
              { value: "calendar", label: "Calendar" },
            ]}
          />
        )}
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-destructive/40 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </span>
          <p className="font-medium">Couldn&apos;t load insights</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            {isRefetching ? "Retrying…" : "Try again"}
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <MetricCardGrid className="mb-6">
          <MetricCard icon={Layers} label="Active groups" value={String(groups?.length ?? 0)} tone="muted" />
          <MetricCard icon={Receipt} label="Expenses logged" value={String(expenses?.length ?? 0)} tone="primary" />
          <MetricCard
            icon={Wallet}
            label="Spent this month"
            value={formatMoney(personalMonthTotal, personalCurrency)}
            tone="negative"
          />
          <MetricCard
            icon={ArrowRightLeft}
            label="Outstanding advances"
            value={formatMoney(sharedSummary.outstanding, personalCurrency)}
            tone="warning"
          />
        </MetricCardGrid>
      )}

      {!isLoading && !isError && view === "charts" && hasNarrative && (
        <Card className="mb-6 gap-1.5 p-4">
          <h2 className="text-sm font-semibold">This month</h2>
          {personalMonthTotal > 0.005 && (
            <p className="text-sm text-muted-foreground">
              You spent {formatMoney(personalMonthTotal, personalCurrency)} personally.
            </p>
          )}
          {sharedParticipationByCurrency.map(([currency, amount]) => (
            <p key={currency} className="text-sm text-muted-foreground">
              You were part of {formatMoney(amount, currency)} in shared group spending.
            </p>
          ))}
          {(sharedSummary.advanced > 0.005 || sharedSummary.recovered > 0.005) && (
            <p className="text-sm text-muted-foreground">
              You&apos;ve advanced {formatMoney(sharedSummary.advanced, personalCurrency)} for others and recovered{" "}
              {formatMoney(sharedSummary.recovered, personalCurrency)}
              {sharedSummary.outstanding > 0.005
                ? `, with ${formatMoney(sharedSummary.outstanding, personalCurrency)} still outstanding.`
                : "."}
            </p>
          )}
        </Card>
      )}

      {!isLoading && !isError && view === "charts" && personalBreakdown.length === 0 && byCurrency.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
            <PieChartIcon className="h-6 w-6" />
          </span>
          <p className="font-medium">No expenses yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Once you add some personal or group expenses, spending by category shows up here.
          </p>
        </div>
      )}

      {!isLoading && !isError && view === "charts" && (personalBreakdown.length > 0 || byCurrency.length > 0) && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {personalBreakdown.length > 0 && (
            <CategoryPieChart
              title="Personal spending by category"
              total={personalMonthTotal}
              currency={personalCurrency}
              categories={personalBreakdown.map((c) => ({ label: c.category_name, amount: c.amount }))}
            />
          )}
          {byCurrency.map(({ currency, total, categories }) => (
            <CategoryPieChart
              key={currency}
              title={`Spending by category · ${currency}`}
              total={total}
              currency={currency}
              categories={categories}
            />
          ))}
        </div>
      )}

      {view === "charts" && !isLoading && !isError && byGroup.length > 1 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-1 text-sm font-semibold">By group</h2>
          <p className="mb-3 text-[11px] text-muted-foreground">
            Total expenses logged per group — currencies aren&apos;t converted, so bars compare activity, not exact totals.
          </p>
          <ResponsiveContainer width="100%" height={Math.max(180, byGroup.length * 48)}>
            <BarChart data={byGroup} layout="vertical" margin={{ left: 24 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={140} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value, _name, item) => formatMoney(Number(value), item.payload.currency)}
              />
              <Bar dataKey="total" name="Total" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!isLoading && !isError && view === "calendar" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Personal</h2>
            <MonthCalendar
              year={calendarDate.getFullYear()}
              month={calendarDate.getMonth()}
              dailyTotals={personalDailyTotals}
              kind="expense"
              currency={personalCurrency}
              onPrevMonth={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              onNextMonth={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            />
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Group expenses</h2>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter(CATEGORY_ALL)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  categoryFilter === CATEGORY_ALL
                    ? "border-primary bg-primary-light text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                All categories
              </button>
              {groupCategoryLabels.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCategoryFilter(label)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${
                    categoryFilter === label
                      ? "border-primary bg-primary-light text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Amounts mix currencies across groups — use this view for activity shape, not totals.
            </p>
            <MonthCalendar
              year={calendarDate.getFullYear()}
              month={calendarDate.getMonth()}
              dailyTotals={groupDailyTotals}
              kind="expense"
              currency={byCurrency[0]?.currency ?? personalCurrency}
              onPrevMonth={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              onNextMonth={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function InsightsPage() {
  return (
    <AuthGuard>
      <InsightsContent />
    </AuthGuard>
  );
}
