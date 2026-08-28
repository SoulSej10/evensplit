"use client";

import type { DailyTotal } from "@evensplit/shared";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Monthly calendar grid mirroring the mobile MonthCalendar - one cell per
 * day, showing that day's total for whichever `kind` is selected. Genuinely
 * new to the web app, same as mobile: no calendar view of spending/income
 * existed anywhere before this.
 */
export function MonthCalendar({
  year,
  month,
  dailyTotals,
  kind,
  currency,
  onPrevMonth,
  onNextMonth,
}: {
  year: number;
  month: number; // 0-11
  dailyTotals: DailyTotal[];
  kind: "expense" | "income";
  currency: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const byDate = new Map(dailyTotals.map((d) => [d.date, d]));
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthTotal = dailyTotals.reduce((sum, d) => sum + (kind === "expense" ? d.expense : d.income), 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold">
            {MONTH_NAMES[month]} {year}
          </span>
          <span className={cn("text-xs font-medium", kind === "expense" ? "text-negative" : "text-positive")}>
            {formatMoney(monthTotal, currency)}
          </span>
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w, i) => (
          <div key={`${w}-${i}`} className="text-center text-[10px] font-medium text-muted-foreground">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const total = byDate.get(dateKey);
          const amount = total ? (kind === "expense" ? total.expense : total.income) : 0;
          const isToday = isCurrentMonth && day === today.getDate();
          return (
            <div key={dateKey} className="flex flex-col items-center gap-0.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full",
                  isToday && "bg-primary-light"
                )}
              >
                <span className={cn("text-xs", isToday ? "font-bold text-primary" : "text-foreground")}>{day}</span>
              </div>
              {amount > 0 ? (
                <span className={cn("text-[9px] font-medium", kind === "expense" ? "text-negative" : "text-positive")}>
                  {amount >= 1000 ? `${(amount / 1000).toFixed(1)}k` : amount.toFixed(0)}
                </span>
              ) : (
                <span className="text-[9px] text-transparent">-</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
