import { Pressable, Text, View } from "react-native";
import type { User } from "@evensplit/shared";
import { Receipt, Repeat } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { MoneyText } from "@/components/ui/MoneyText";
import { SkeletonCardRows } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { SpendingChart } from "@/components/expenses/SpendingChart";
import { useGroupExpenses } from "@/hooks/use-group-detail";
import { formatDate } from "@/lib/format";
import type { ExpenseWithShares } from "@/lib/api/expenses";

export function ExpensesTabView({
  groupId,
  groupCurrency,
  members,
  currentUserId,
  onSelectExpense,
}: {
  groupId: string;
  groupCurrency: string;
  members: { user_id: string; users: User | null }[];
  currentUserId: string;
  onSelectExpense: (expense: ExpenseWithShares) => void;
}) {
  const { data: expenses, isLoading, isError, refetch } = useGroupExpenses(groupId);

  function name(userId: string) {
    return members.find((m) => m.user_id === userId)?.users?.display_name ?? "Someone";
  }

  if (isLoading) {
    return <SkeletonCardRows count={4} />;
  }

  if (isError) {
    return <ErrorState message="Couldn't load expenses." onRetry={() => refetch()} />;
  }

  if ((expenses?.length ?? 0) === 0) {
    return (
      <View className="items-center gap-2 py-14">
        <Receipt color="#6B7169" size={22} />
        <Text className="text-sm text-neutral-500">No expenses yet. Add the first one.</Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {expenses && expenses.length > 1 && (
        <SpendingChart expenses={expenses} groupCurrency={groupCurrency} members={members} />
      )}
      {expenses?.map((expense) => {
        const payer = members.find((m) => m.user_id === expense.paid_by)?.users;
        const myShare = expense.expense_shares.find((s) => s.user_id === currentUserId)?.share_amount ?? 0;
        return (
          <Pressable key={expense.id} onPress={() => onSelectExpense(expense)}>
            <Card className="flex-row items-center gap-3 py-3">
              <Avatar name={payer?.display_name} uri={payer?.avatar_url} size={40} />
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="shrink font-medium text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
                    {expense.description}
                  </Text>
                  {expense.is_recurring && (
                    <View className="flex-row items-center gap-0.5 rounded-pill bg-primary-light px-1.5 py-0.5">
                      <Repeat color="#5B3A8E" size={10} />
                    </View>
                  )}
                </View>
                <Text className="text-xs text-neutral-500">
                  {name(expense.paid_by)} paid · {formatDate(expense.expense_date)}
                  {expense.category ? ` · ${expense.category}` : ""}
                </Text>
              </View>
              <View className="items-end">
                <MoneyText amount={expense.amount} currency={expense.currency} tone="neutral" className="text-sm" />
                <Text className="mt-0.5 text-[11px] text-neutral-500">
                  your share {myShare.toFixed(2)}
                </Text>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}
