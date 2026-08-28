import { Pressable, Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import type { DailyTotal } from "@evensplit/shared";
import { formatMoney } from "@/lib/format";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Monthly calendar grid - one cell per day, showing that day's total for
 * whichever `kind` is selected (the caller already filtered `dailyTotals`
 * to one category if desired, via computeDailyTotals's categoryId param).
 * Genuinely new to the app - a calendar view of spending/income by day,
 * not present anywhere before this.
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

  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthTotal = dailyTotals.reduce((sum, d) => sum + (kind === "expense" ? d.expense : d.income), 0);

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={onPrevMonth} hitSlop={10} className="h-8 w-8 items-center justify-center rounded-lg bg-neutral-500/10">
          <ChevronLeft color="#726C7D" size={16} />
        </Pressable>
        <View className="items-center">
          <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {MONTH_NAMES[month]} {year}
          </Text>
          <Text className={`text-xs font-medium ${kind === "expense" ? "text-negative" : "text-positive"}`}>
            {formatMoney(monthTotal, currency)}
          </Text>
        </View>
        <Pressable onPress={onNextMonth} hitSlop={10} className="h-8 w-8 items-center justify-center rounded-lg bg-neutral-500/10">
          <ChevronRight color="#726C7D" size={16} />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAYS.map((w, i) => (
          <View key={`${w}-${i}`} className="flex-1 items-center">
            <Text className="text-[10px] font-medium text-neutral-500">{w}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {cells.map((day, i) => {
          if (day === null) return <View key={`empty-${i}`} style={{ width: `${100 / 7}%` }} className="py-1" />;
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const total = byDate.get(dateKey);
          const amount = total ? (kind === "expense" ? total.expense : total.income) : 0;
          const isToday = isCurrentMonth && day === today.getDate();
          return (
            <View key={dateKey} style={{ width: `${100 / 7}%` }} className="items-center gap-0.5 py-1.5">
              <View
                className={`h-7 w-7 items-center justify-center rounded-full ${isToday ? "bg-primary-light" : ""}`}
              >
                <Text
                  className={`text-xs ${isToday ? "font-bold text-primary" : "text-neutral-900 dark:text-neutral-100"}`}
                >
                  {day}
                </Text>
              </View>
              {amount > 0 ? (
                <Text
                  numberOfLines={1}
                  className={`text-[8px] font-medium ${kind === "expense" ? "text-negative" : "text-positive"}`}
                >
                  {amount >= 1000 ? `${(amount / 1000).toFixed(1)}k` : amount.toFixed(0)}
                </Text>
              ) : (
                <Text className="text-[8px] text-transparent">-</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
