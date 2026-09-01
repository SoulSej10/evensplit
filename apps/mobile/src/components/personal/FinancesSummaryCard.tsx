import { useMemo } from "react";
import { Text, View } from "react-native";
import { ArrowDownLeft, ArrowUpRight } from "phosphor-react-native";
import { computeAllAccountBalances, filterTransactionsForCurrentMonth } from "@evensplit/shared";
import { formatMoney } from "@/lib/format";
import { usePersonalAccounts, usePersonalTransactions } from "@/hooks/use-personal";

/**
 * Always-visible hero summary at the top of Finances - total balance across
 * every account plus this month's income/expense, so the section reads as
 * a real financial overview rather than just a list of CRUD tabs.
 */
export function FinancesSummaryCard() {
  const { data: accounts } = usePersonalAccounts();
  const { data: transactions } = usePersonalTransactions();

  const { total, currency, monthIncome, monthExpense } = useMemo(() => {
    const balances = computeAllAccountBalances(accounts ?? [], transactions ?? []);
    const total = balances.reduce((sum, b) => sum + b.balance, 0);

    let monthIncome = 0;
    let monthExpense = 0;
    for (const tx of filterTransactionsForCurrentMonth(transactions ?? [])) {
      if (tx.kind === "income") monthIncome += tx.amount;
      if (tx.kind === "expense") monthExpense += tx.amount;
    }

    return { total, currency: accounts?.[0]?.currency ?? "PHP", monthIncome, monthExpense };
  }, [accounts, transactions]);

  if (!accounts || accounts.length === 0) return null;

  return (
    <View className="mx-5 mb-4 overflow-hidden rounded-card bg-primary-deep">
      <View className="gap-4 bg-primary/95 px-5 py-5">
        <View>
          <Text className="text-xs font-medium text-white/70">Total balance</Text>
          <Text className="mt-1 text-3xl font-extrabold text-white">{formatMoney(total, currency)}</Text>
        </View>
        <View className="flex-row gap-4">
          <View className="flex-1 flex-row items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5">
            <View className="h-7 w-7 items-center justify-center rounded-lg bg-white/15">
              <ArrowDownLeft color="white" size={14} />
            </View>
            <View>
              <Text className="text-[10px] text-white/70">Income (mo.)</Text>
              <Text className="text-sm font-bold text-white">{formatMoney(monthIncome, currency)}</Text>
            </View>
          </View>
          <View className="flex-1 flex-row items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5">
            <View className="h-7 w-7 items-center justify-center rounded-lg bg-white/15">
              <ArrowUpRight color="white" size={14} />
            </View>
            <View>
              <Text className="text-[10px] text-white/70">Expense (mo.)</Text>
              <Text className="text-sm font-bold text-white">{formatMoney(monthExpense, currency)}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
