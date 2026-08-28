import { Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { formatMoney } from "@/lib/format";

export interface AccountActivity {
  accountId: string;
  name: string;
  icon?: string | null;
  expense: number;
  income: number;
  currency: string;
}

const BAR_WIDTH = 220;

/**
 * Per-account expense vs. income comparison for the selected month — one
 * account per row, an expense bar and an income bar sharing the same
 * scale. Mirrors MyMoney's "Account analysis" view, which this app had no
 * equivalent of before.
 */
export function AccountBarChart({ accounts }: { accounts: AccountActivity[] }) {
  if (accounts.length === 0) {
    return <Text className="py-6 text-center text-sm text-neutral-500">No account activity this month.</Text>;
  }

  const max = Math.max(...accounts.flatMap((a) => [a.expense, a.income]), 0.01);

  return (
    <View className="gap-5">
      <View className="flex-row items-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full bg-negative" />
          <Text className="text-xs text-neutral-500">Expense</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full bg-positive" />
          <Text className="text-xs text-neutral-500">Income</Text>
        </View>
      </View>

      {accounts.map((a) => {
        const expenseWidth = Math.max(3, (a.expense / max) * BAR_WIDTH);
        const incomeWidth = Math.max(3, (a.income / max) * BAR_WIDTH);
        return (
          <View key={a.accountId} className="gap-1.5">
            <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {a.icon ?? "💵"} {a.name}
            </Text>
            <View className="gap-1">
              <View className="flex-row items-center gap-2">
                <Svg width={BAR_WIDTH} height={8}>
                  <Rect x={0} y={0} width={BAR_WIDTH} height={8} rx={4} fill="#6B7169" opacity={0.12} />
                  <Rect x={0} y={0} width={expenseWidth} height={8} rx={4} fill="#D95F5F" />
                </Svg>
                <Text className="text-xs text-neutral-500">{formatMoney(a.expense, a.currency)}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Svg width={BAR_WIDTH} height={8}>
                  <Rect x={0} y={0} width={BAR_WIDTH} height={8} rx={4} fill="#6B7169" opacity={0.12} />
                  <Rect x={0} y={0} width={incomeWidth} height={8} rx={4} fill="#009B87" />
                </Svg>
                <Text className="text-xs text-neutral-500">{formatMoney(a.income, a.currency)}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
