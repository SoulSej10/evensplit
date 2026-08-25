import { Text, View } from "react-native";
import type { User } from "@evensplit/shared";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { MoneyText } from "@/components/ui/MoneyText";
import { Button } from "@/components/ui/Button";
import { useGroupBalances, useGroupExpenses, useGroupSettlements } from "@/hooks/use-group-detail";

export function BalancesTabView({
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
  const { data: expenses } = useGroupExpenses(groupId);
  const { data: settlements } = useGroupSettlements(groupId);
  const memberIds = members.map((m) => m.user_id);
  const allShares = (expenses ?? []).flatMap((e) => e.expense_shares);
  const { balances, pairwiseDebts } = useGroupBalances(
    groupId,
    memberIds,
    expenses ?? [],
    allShares,
    settlements ?? []
  );

  function name(userId: string) {
    return members.find((m) => m.user_id === userId)?.users?.display_name ?? "Someone";
  }
  function avatarUri(userId: string) {
    return members.find((m) => m.user_id === userId)?.users?.avatar_url;
  }

  return (
    <View className="gap-6">
      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-500">Net balances</Text>
        {balances.map((b) => (
          <Card key={b.user_id} className="flex-row items-center gap-3 py-3">
            <Avatar name={name(b.user_id)} uri={avatarUri(b.user_id)} size={36} />
            <Text className="flex-1 font-medium text-neutral-900 dark:text-neutral-100">
              {b.user_id === currentUserId ? "You" : name(b.user_id)}
            </Text>
            <MoneyText amount={b.balance} currency={groupCurrency} tone="auto" className="text-sm" />
          </Card>
        ))}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-500">Who owes whom</Text>
        {pairwiseDebts.length === 0 ? (
          <Text className="rounded-2xl border border-dashed border-neutral-500/25 py-8 text-center text-sm text-neutral-500">
            Everyone's settled up 🎉
          </Text>
        ) : (
          pairwiseDebts.map((debt, i) => (
            <Card key={`${debt.from_user}-${debt.to_user}-${i}`} className="flex-row items-center gap-3 py-3">
              <Avatar name={name(debt.from_user)} uri={avatarUri(debt.from_user)} size={32} />
              <Text className="flex-1 text-sm text-neutral-900 dark:text-neutral-100">
                <Text className="font-semibold">
                  {debt.from_user === currentUserId ? "You" : name(debt.from_user)}
                </Text>{" "}
                owe{" "}
                <Text className="font-semibold">
                  {debt.to_user === currentUserId ? "you" : name(debt.to_user)}
                </Text>
              </Text>
              <MoneyText amount={debt.amount} currency={groupCurrency} tone="negative" className="mr-2 text-sm" />
              <Button size="sm" variant="secondary" onPress={() => onSettleUp(debt.from_user, debt.to_user, debt.amount)}>
                Settle
              </Button>
            </Card>
          ))
        )}
      </View>
    </View>
  );
}
