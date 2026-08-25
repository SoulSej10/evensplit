import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { calculateUserBalances } from "@evensplit/shared";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { MoneyText } from "@/components/ui/MoneyText";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { GroupWithMembers } from "@/lib/api/groups";

export function GroupCard({ group }: { group: GroupWithMembers }) {
  const { authUser } = useAuth();
  const memberIds = group.group_members.map((m) => m.user_id);

  const { data: balance, isLoading: balanceLoading, isError: balanceError } = useQuery({
    queryKey: ["group-card-balance", group.id, authUser?.id],
    enabled: !!authUser?.id,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const [{ data: expenses }, { data: shares }, { data: settlements }] = await Promise.all([
        supabase.from("expenses").select("id, amount, paid_by").eq("group_id", group.id),
        supabase
          .from("expense_shares")
          .select("expense_id, user_id, share_amount, expenses!inner(group_id)")
          .eq("expenses.group_id", group.id),
        supabase.from("settlements").select("from_user, to_user, amount").eq("group_id", group.id),
      ]);
      const balances = calculateUserBalances(memberIds, expenses ?? [], shares ?? [], settlements ?? []);
      return balances.find((b) => b.user_id === authUser!.id)?.balance ?? 0;
    },
  });

  const amount = balance ?? 0;
  const label = balanceError
    ? "balance unavailable"
    : balanceLoading
      ? "loading…"
      : amount > 0.005
        ? "you're owed"
        : amount < -0.005
          ? "you owe"
          : "settled up";

  return (
    <Pressable onPress={() => router.push(`/(app)/groups/${group.id}`)}>
      <Card className="mb-3 flex-row items-center gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary-light">
          <Text className="text-2xl">{group.icon || "👥"}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {group.name}
          </Text>
          <View className="mt-1.5 flex-row" style={{ marginLeft: 0 }}>
            {group.group_members.slice(0, 4).map((m, i) => (
              <View key={m.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                <Avatar name={m.users?.display_name} uri={m.users?.avatar_url} size={22} />
              </View>
            ))}
          </View>
        </View>
        <View className="items-end">
          <MoneyText amount={amount} currency={group.currency} tone="auto" />
          <Text className="mt-0.5 text-xs text-neutral-500">{label}</Text>
        </View>
      </Card>
    </Pressable>
  );
}
