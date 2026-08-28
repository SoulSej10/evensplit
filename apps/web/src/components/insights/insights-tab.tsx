"use client";

import { useMemo } from "react";
import type { User } from "@evensplit/shared";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, PieChart as PieChartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroupExpenses } from "@/hooks/use-group-detail";
import { formatMoney } from "@/lib/format";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  borderColor: "var(--border)",
  borderRadius: "0.75rem",
  fontSize: "0.75rem",
  color: "var(--card-foreground)",
};

export function InsightsTab({
  groupId,
  groupCurrency,
  members,
}: {
  groupId: string;
  groupCurrency: string;
  members: { user_id: string; users: User | null }[];
}) {
  const { data: expenses, isLoading, isError, refetch, isRefetching } = useGroupExpenses(groupId);

  function memberName(userId: string) {
    return members.find((m) => m.user_id === userId)?.users?.display_name ?? "Someone";
  }

  const byCategory = useMemo(() => {
    // category is free text, not an enum - group by a lowercased key so
    // "Food" and "food" don't split into two slices, then capitalize once
    // for display (recharts renders inside SVG/a portal tooltip, so a CSS
    // `capitalize` class on the legend wouldn't reach the chart itself).
    const totals = new Map<string, number>();
    for (const e of expenses ?? []) {
      const key = e.category?.trim().toLowerCase() || "uncategorized";
      totals.set(key, (totals.get(key) ?? 0) + e.amount);
    }
    return Array.from(totals, ([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
    })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const byMember = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of expenses ?? []) {
      totals.set(e.paid_by, (totals.get(e.paid_by) ?? 0) + e.amount);
    }
    return Array.from(totals, ([userId, value]) => ({ name: memberName(userId), value })).sort(
      (a, b) => b.value - a.value
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, members]);

  const overTime = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    const dates = expenses.map((e) => new Date(e.expense_date).getTime()).filter((t) => !Number.isNaN(t));
    if (dates.length === 0) return [];
    const rangeDays = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24);
    const bucketByWeek = rangeDays <= 60;

    function bucketKey(dateStr: string): { key: string; sort: number } {
      const d = new Date(dateStr);
      if (bucketByWeek) {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        return { key, sort: weekStart.getTime() };
      }
      const key = d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
      const sort = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      return { key, sort };
    }

    const totals = new Map<string, { total: number; sort: number }>();
    for (const e of expenses) {
      const { key, sort } = bucketKey(e.expense_date);
      const existing = totals.get(key);
      totals.set(key, { total: (existing?.total ?? 0) + e.amount, sort });
    }

    return Array.from(totals, ([label, v]) => ({ label, total: v.total, sort: v.sort })).sort(
      (a, b) => a.sort - b.sort
    );
  }, [expenses]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl sm:col-span-2" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-destructive/40 py-14 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm font-medium">Couldn&apos;t load insights</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          {isRefetching ? "Retrying…" : "Try again"}
        </Button>
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
          <PieChartIcon className="h-6 w-6" />
        </span>
        <p className="font-medium">No spending to chart yet</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Add a few expenses and charts will show up here — by category, by member, and over time.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Spending by category</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={byCategory}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {byCategory.map((entry, i) => (
                <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => formatMoney(Number(value), groupCurrency)}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {byCategory.map((c, i) => (
            <span key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              {c.name}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Spending by member</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byMember}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "var(--muted)" }}
              formatter={(value) => formatMoney(Number(value), groupCurrency)}
            />
            <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:col-span-2">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Spending over time</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={overTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => formatMoney(Number(value), groupCurrency)}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ fill: "var(--chart-2)", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
