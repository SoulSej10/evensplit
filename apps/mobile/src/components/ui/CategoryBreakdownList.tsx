import { Text, View } from "react-native";
import { formatMoney } from "@/lib/format";

export interface BreakdownRow {
  label: string;
  icon?: string | null;
  amount: number;
  percent: number;
  color: string;
}

/**
 * Detailed per-category list under a donut chart — icon, name, amount, a
 * thin progress bar, and the percentage of the total, one row per category.
 * The donut's own legend only shows a color dot + name; this is the
 * "actual data" view per direct feedback ("showcasing of the actual data
 * of those graphical analysis"), matching MyMoney's category list under
 * its donut.
 */
export function CategoryBreakdownList({ rows, currency }: { rows: BreakdownRow[]; currency: string }) {
  if (rows.length === 0) return null;

  return (
    <View className="gap-3">
      {rows.map((r) => (
        <View key={r.label} className="gap-1.5">
          <View className="flex-row items-center gap-2.5">
            <Text className="text-base">{r.icon ?? "🏷️"}</Text>
            <Text className="flex-1 text-sm font-medium capitalize text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
              {r.label}
            </Text>
            <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {formatMoney(r.amount, currency)}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-500/15">
              <View
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, r.percent)}%`, backgroundColor: r.color }}
              />
            </View>
            <Text className="w-10 text-right text-xs text-neutral-500">{r.percent.toFixed(0)}%</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
