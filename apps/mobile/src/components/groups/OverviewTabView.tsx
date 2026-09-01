import { Text, View } from "react-native";
import type { User } from "@evensplit/shared";
import { simplifyDebts } from "@evensplit/shared";
import { Receipt } from "phosphor-react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MoneyText } from "@/components/ui/MoneyText";
import { SkeletonCardRows } from "@/components/ui/Skeleton";
import { formatMoney } from "@/lib/format";
import { useGroupBalances, useGroupExpenses, useGroupSettlements } from "@/hooks/use-group-detail";

/**
 * Group Overview - a snapshot composed entirely from data the screen
 * already fetches (useGroupExpenses/useGroupSettlements are the same
 * React Query keys BalancesTabView/ExpensesTabView use, so this adds no
 * new network calls). Shows total group spending, the top suggested
 * settlement, and the most recent expenses. "Your position" already has a
 * permanent home in this screen's header, so it isn't repeated here.
 */
export function OverviewTabView({
  groupId,
  groupCurrency,
  members,
  currentUserId,
  onSettleUp,
}: {
  groupId: string;
  groupCurrency: string;
  members: { user_id: string; users: User | null }[];
  currentUserId: string;
  onSettleUp: (fromUserId: string, toUserId: string, amount: number) => void;
}) {
  const { data: expenses, isLoading: expensesLoading } = useGroupExpenses(groupId);
  const { data: settlements, isLoading: settlementsLoading } = useGroupSettlements(groupId);

  const memberIds = members.map((m) => m.user_id);
  const allShares = (expenses ?? []).flatMap((e) => e.expense_shares);
  const { balances } = useGroupBalances(groupId, memberIds, expenses ?? [], allShares, settlements ?? []);
  const topSuggestion = simplifyDebts(balances)[0];
  const totalSpending = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0);
  const recentExpenses = (expenses ?? []).slice(0, 5);

  function name(userId: string) {
    if (userId === currentUserId) return "You";
    return members.find((m) => m.user_id === userId)?.users?.display_name ?? "Someone";
  }

  if (expensesLoading || settlementsLoading) {
    return <SkeletonCardRows count={3} />;
  }

  return (
    <View className="gap-5">
      <Card className="gap-1 py-4">
        <Text className="text-xs text-neutral-500">Total group spending</Text>
        <Text className="font-mono text-xl font-bold text-neutral-900 dark:text-neutral-100">
          {formatMoney(totalSpending, groupCurrency)}
        </Text>
      </Card>

      {topSuggestion && (
        <Card className="flex-row items-center gap-3 py-3">
          <Text className="flex-1 text-sm text-neutral-900 dark:text-neutral-100">
            <Text className="font-semibold">{name(topSuggestion.from_user)}</Text>{" "}
            {topSuggestion.from_user === currentUserId ? "owe" : "owes"}{" "}
            <Text className="font-semibold">{name(topSuggestion.to_user)}</Text>
          </Text>
          <MoneyText amount={topSuggestion.amount} currency={groupCurrency} tone="negative" className="mr-2 text-sm" />
          <Button
            size="sm"
            variant="secondary"
            onPress={() => onSettleUp(topSuggestion.from_user, topSuggestion.to_user, topSuggestion.amount)}
          >
            Settle
          </Button>
        </Card>
      )}

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-500">Recent expenses</Text>
        {recentExpenses.length === 0 ? (
          <View className="items-center gap-2 py-10">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-light">
              <Receipt color="#16A88F" size={20} />
            </View>
            <Text className="text-sm text-neutral-500">No expenses yet.</Text>
          </View>
        ) : (
          recentExpenses.map((e) => (
            <Card key={e.id} className="flex-row items-center gap-3 py-2.5">
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
                  {e.description}
                </Text>
                <Text className="text-xs text-neutral-500">Paid by {name(e.paid_by)}</Text>
              </View>
              <Text className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {formatMoney(e.amount, e.currency)}
              </Text>
            </Card>
          ))
        )}
      </View>
    </View>
  );
}
