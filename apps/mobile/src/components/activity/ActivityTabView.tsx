import { Text, View } from "react-native";
import type { User } from "@evensplit/shared";
import { ArrowRightLeft, Receipt } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { useGroupActivity } from "@/hooks/use-group-detail";
import { formatDateTime, formatMoney } from "@/lib/format";

export function ActivityTabView({
  groupId,
  groupCurrency,
  members,
  currentUserId,
}: {
  groupId: string;
  groupCurrency: string;
  members: { user_id: string; users: User | null }[];
  currentUserId: string;
}) {
  const { data: activity, isLoading } = useGroupActivity(groupId);

  function name(userId: string) {
    if (userId === currentUserId) return "You";
    return members.find((m) => m.user_id === userId)?.users?.display_name ?? "Someone";
  }

  if (!isLoading && (activity?.length ?? 0) === 0) {
    return (
      <Text className="rounded-2xl border border-dashed border-neutral-500/25 py-14 text-center text-sm text-neutral-500">
        No activity yet.
      </Text>
    );
  }

  return (
    <View className="gap-2">
      {activity?.map((item) => (
        <Card key={`${item.type}-${item.id}`} className="flex-row items-center gap-3 py-3">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-light">
            {item.type === "expense_added" ? (
              <Receipt color="#2F6F5E" size={16} />
            ) : (
              <ArrowRightLeft color="#2F6F5E" size={16} />
            )}
          </View>
          <View className="flex-1">
            {item.type === "expense_added" ? (
              <Text className="text-sm text-neutral-900 dark:text-neutral-100">
                <Text className="font-semibold">{name(item.paid_by)}</Text> added{" "}
                <Text className="font-semibold">{item.description}</Text> ·{" "}
                {formatMoney(item.amount, item.currency)}
              </Text>
            ) : (
              <Text className="text-sm text-neutral-900 dark:text-neutral-100">
                <Text className="font-semibold">{name(item.from_user)}</Text> paid{" "}
                <Text className="font-semibold">{name(item.to_user)}</Text>{" "}
                {formatMoney(item.amount, groupCurrency)}
              </Text>
            )}
            <Text className="mt-0.5 text-xs text-neutral-500">{formatDateTime(item.at)}</Text>
          </View>
        </Card>
      ))}
    </View>
  );
}
