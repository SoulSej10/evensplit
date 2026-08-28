"use client";

import { useMemo, useState } from "react";
import { computeCategoryBreakdown, computeDailyTotals, computeExpenseTrend } from "@evensplit/shared";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedTabs } from "@/components/personal/segmented-tabs";
import { MonthCalendar } from "@/components/personal/month-calendar";
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

export default function PersonalAnalysisPage() {
  const { data: transactions, isLoading } = usePersonalTransactions();
  const { data: categories } = usePersonalCategories();
  const { data: accounts } = usePersonalAccounts();
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [view, setView] = useState<"charts" | "calendar">("charts");
  const [categoryFilter, setCategoryFilter] = useState<string>(CATEGORY_ALL);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const currency = accounts?.[0]?.currency ?? "USD";

  const breakdown = useMemo(
    () => computeCategoryBreakdown(transactions ?? [], categories ?? [], kind),
    [transactions, categories, kind]
  );
  const trend = useMemo(() => computeExpenseTrend(transactions ?? []), [transactions]);

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Analysis</h1>
        <SegmentedTabs
          value={view}
          onChange={(v) => setView(v as "charts" | "calendar")}
          options={[
            { value: "charts", label: "Charts" },
            { value: "calendar", label: "Calendar" },
          ]}
        />
      </div>

      {view === "charts" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">By category</h3>
              <SegmentedTabs
                value={kind}
                onChange={(v) => setKind(v as "expense" | "income")}
                options={[
                  { value: "expense", label: "Expense" },
                  { value: "income", label: "Income" },
                ]}
              />
            </div>
            {breakdown.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No {kind} records yet.</p>
            ) : (
              <>
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
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {breakdown.map((c, i) => (
                    <span key={c.category_id ?? "none"} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {c.category_name} ({c.percent.toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:col-span-2">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">Income vs. expense over time</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={48} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatMoney(Number(value), currency)} />
                <Line type="monotone" dataKey="income" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <SegmentedTabs
              value={kind}
              onChange={(v) => setKind(v as "expense" | "income")}
              options={[
                { value: "expense", label: "Expense" },
                { value: "income", label: "Income" },
              ]}
            />
          </div>
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
      )}
    </div>
  );
}
