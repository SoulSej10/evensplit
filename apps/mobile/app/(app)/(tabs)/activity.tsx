import { useMemo } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowsLeftRight as ArrowRightLeft, Receipt } from "phosphor-react-native";
import { Card } from "@/components/ui/Card";
import { SkeletonCardRows } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/hooks/use-auth";
import { useMyGroups, useAllActivity } from "@/hooks/use-groups";
import { formatDateTime, formatMoney } from "@/lib/format";

/**
 * Top-level Activity tab — a merged feed of expenses/settlements across
 * every group the user belongs to, not just one group at a time. Reuses
 * the same visual language as the per-group ActivityTabView.
 */
export default function ActivityScreen() {
  const { authUser } = useAuth();
  const { data: groups } = useMyGroups();
  const { data: activity, isLoading, isError, refetch } = useAllActivity();

  const groupById = useMemo(() => new Map((groups ?? []).map((g) => [g.id, g])), [groups]);

  function memberName(groupId: string, userId: string) {
    if (userId === authUser?.id) return "You";
    const group = groupById.get(groupId);
    return group?.group_members.find((m) => m.user_id === userId)?.users?.display_name ?? "Someone";
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-neutral-900" edges={["top"]}>
      <View className="px-5 pb-2 pt-4">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Activity</Text>
        <Text className="text-neutral-500">Everything happening across your groups</Text>
      </View>

      <View className="flex-1 px-5 pt-2">
        {isLoading && <SkeletonCardRows count={5} />}

        {!isLoading && isError && (
          <ErrorState message="Couldn't load activity." onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && (activity?.length ?? 0) === 0 && (
          <Text className="mt-10 rounded-card border border-dashed border-neutral-500/25 py-14 text-center text-sm text-neutral-500">
            No activity yet. Add an expense in one of your groups to see it here.
          </Text>
        )}

        {!isLoading &&
          !isError &&
          activity?.map((item) => {
            const group = groupById.get(item.group_id);
            return (
              <Card key={`${item.type}-${item.id}`} className="mb-2 flex-row items-center gap-3 py-3">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-light">
                  {item.type === "expense_added" ? (
                    <Receipt color="#16A88F" size={16} />
                  ) : (
                    <ArrowRightLeft color="#16A88F" size={16} />
                  )}
                </View>
                <View className="flex-1">
                  {item.type === "expense_added" ? (
                    <Text className="text-sm text-neutral-900 dark:text-neutral-100">
                      <Text className="font-semibold">{memberName(item.group_id, item.paid_by)}</Text>{" "}
                      added <Text className="font-semibold">{item.description}</Text> ·{" "}
                      {formatMoney(item.amount, item.currency)}
                    </Text>
                  ) : (
                    <Text className="text-sm text-neutral-900 dark:text-neutral-100">
                      <Text className="font-semibold">{memberName(item.group_id, item.from_user)}</Text>{" "}
                      paid <Text className="font-semibold">{memberName(item.group_id, item.to_user)}</Text>{" "}
                      {formatMoney(item.amount, group?.currency ?? "USD")}
                    </Text>
                  )}
                  <Text className="mt-0.5 text-xs text-neutral-500">
                    {group?.icon ?? "👥"} {group?.name ?? "Group"} · {formatDateTime(item.at)}
                  </Text>
                </View>
              </Card>
            );
          })}
      </View>
    </SafeAreaView>
  );
}
