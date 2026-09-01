"use client";

import { useMemo, useState } from "react";
import { computeCategoryBreakdown, computeDailyTotals } from "@evensplit/shared";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CaretLeft as ChevronLeft, CaretRight as ChevronRight, ChartPie as PieChartIcon } from "@phosphor-icons/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthCalendar } from "@/components/personal/month-calendar";
import { usePersonalAccounts, usePersonalCategories, usePersonalTransactions } from "@/hooks/use-personal";
import { formatMoney } from "@/lib/format";

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

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  borderColor: "var(--border)",
  borderRadius: "0.75rem",
  fontSize: "0.75rem",
  color: "var(--card-foreground)",
};

/** Every day of the given month, zero-filled where there's no data — one continuous month, not a handful of scattered points. */
function fullMonthSeries(
  dailyTotals: { date: string; expense: number; income: number }[],
  year: number,
  month: number,
  kind: "expense" | "income"
) {
  const byDate = new Map(dailyTotals.map((d) => [d.date, d]));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const entry = byDate.get(key);
    return { day, value: entry ? (kind === "expense" ? entry.expense : entry.income) : 0 };
  });
}

export default function PersonalAnalysisPage() {
  const { data: transactions, isLoading } = usePersonalTransactions();
  const { data: categories } = usePersonalCategories();
  const { data: accounts } = usePersonalAccounts();
  const [viewType, setViewType] = useState<ViewType>("expense-overview");
  const [categoryFilter, setCategoryFilter] = useState<string>(CATEGORY_ALL);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const currency = accounts?.[0]?.currency ?? "USD";

  const kind: "expense" | "income" = viewType === "income-overview" || viewType === "income-flow" ? "income" : "expense";

  const today = new Date();
  const isCurrentMonth = calendarDate.getFullYear() === today.getFullYear() && calendarDate.getMonth() === today.getMonth();
  const monthKey = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}`;
  const monthTransactions = useMemo(
    () => (transactions ?? []).filter((t) => t.occurred_at.slice(0, 7) === monthKey),
    [transactions, monthKey]
  );

  const breakdown = useMemo(
    () => computeCategoryBreakdown(monthTransactions, categories ?? [], kind),
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

  const accountActivity = useMemo(() => {
    return (accounts ?? []).map((a) => {
      let expense = 0;
      let income = 0;
      for (const t of monthTransactions) {
        if (t.account_id !== a.id) continue;
        if (t.kind === "expense") expense += t.amount;
        else if (t.kind === "income") income += t.amount;
      }
      return { name: `${a.icon ?? "💵"} ${a.name}`, expense, income };
    });
  }, [accounts, monthTransactions]);

  const relevantCategories = (categories ?? []).filter((c) => c.kind === kind);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl sm:col-span-2" />
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
          <PieChartIcon className="h-6 w-6" />
        </span>
        <p className="font-medium">No transactions to chart yet</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Log a few records and your spending breakdown will show up here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Analysis</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border px-1">
            <button
              type="button"
              onClick={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-32 text-center text-sm font-medium">
              {MONTH_NAMES[calendarDate.getMonth()]} {calendarDate.getFullYear()}
            </span>
            <button
              type="button"
              disabled={isCurrentMonth}
              onClick={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Select value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIEW_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(viewType === "expense-overview" || viewType === "income-overview") && (
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          {breakdown.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No {kind} records this month.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={breakdown} dataKey="amount" nameKey="category_name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {breakdown.map((entry, i) => (
                      <Cell key={entry.category_id ?? "none"} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatMoney(Number(value), currency)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col justify-center gap-3">
                {breakdown.map((c, i) => (
                  <div key={c.category_id ?? "none"} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 capitalize">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        {c.category_name}
                      </span>
                      <span className="font-medium">{formatMoney(c.amount, currency)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, c.percent)}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(viewType === "expense-flow" || viewType === "income-flow") && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Daily {kind === "expense" ? "spending" : "earnings"}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={flowSeries}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} width={48} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatMoney(Number(value), currency)} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={kind === "expense" ? "var(--negative)" : "var(--positive)"}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap gap-2">
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
              {relevantCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryFilter(c.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    categoryFilter === c.id
                      ? "border-primary bg-primary-light text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {c.icon ? `${c.icon} ` : ""}
                  {c.name}
                </button>
              ))}
            </div>
            <MonthCalendar
              year={calendarDate.getFullYear()}
              month={calendarDate.getMonth()}
              dailyTotals={dailyTotals}
              kind={kind}
              currency={currency}
              onPrevMonth={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              onNextMonth={() => setCalendarDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            />
          </div>
        </div>
      )}

      {viewType === "account-analysis" && (
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          {accountActivity.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No accounts yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, accountActivity.length * 60)}>
              <BarChart data={accountActivity} layout="vertical" margin={{ left: 24 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={140} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatMoney(Number(value), currency)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="expense" name="Expense" fill="var(--negative)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="income" name="Income" fill="var(--positive)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
