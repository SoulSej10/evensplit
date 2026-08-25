import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { calculateUserBalances } from "@evensplit/shared";
import { ArrowLeft, MoreVertical, Plus, UserPlus } from "lucide-react-native";
import { Avatar } from "@/components/ui/Avatar";
import { MoneyText } from "@/components/ui/MoneyText";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ExpensesTabView } from "@/components/expenses/ExpensesTabView";
import { ExpenseFormSheet } from "@/components/expenses/ExpenseFormSheet";
import { ExpenseDetailSheet } from "@/components/expenses/ExpenseDetailSheet";
import { BalancesTabView } from "@/components/balances/BalancesTabView";
import { ActivityTabView } from "@/components/activity/ActivityTabView";
import { SettleUpSheet } from "@/components/settle-up/SettleUpSheet";
import { InviteSheet } from "@/components/groups/InviteSheet";
import { useAuth } from "@/hooks/use-auth";
import { useGroup, useGroupExpenses, useGroupRealtime, useGroupSettlements } from "@/hooks/use-group-detail";
import { archiveGroup, leaveGroup } from "@/lib/api/groups";
import type { ExpenseWithShares } from "@/lib/api/expenses";

type Tab = "expenses" | "balances" | "activity";

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: group, isLoading, isError, refetch } = useGroup(groupId);
  const { data: expenses } = useGroupExpenses(groupId);
  const { data: settlements } = useGroupSettlements(groupId);
  useGroupRealtime(groupId);

  const [tab, setTab] = useState<Tab>("expenses");
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithShares | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithShares | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settleUp, setSettleUp] = useState<{ from: string; to: string; amount: number } | null>(null);

  const members = group?.group_members ?? [];
  const memberIds = useMemo(() => members.map((m) => m.user_id), [members]);
  const isOwner = members.find((m) => m.user_id === authUser?.id)?.role === "owner";

  const myBalance = useMemo(() => {
    if (!expenses || !authUser) return 0;
    const allShares = expenses.flatMap((e) => e.expense_shares);
    const balances = calculateUserBalances(memberIds, expenses, allShares, settlements ?? []);
    return balances.find((b) => b.user_id === authUser.id)?.balance ?? 0;
  }, [expenses, settlements, memberIds, authUser]);

  function onLeave() {
    Alert.alert("Leave this group?", "You'll lose access to its expenses and balances.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          if (!authUser) return;
          await leaveGroup(groupId, authUser.id);
          await queryClient.invalidateQueries({ queryKey: ["groups"] });
          router.back();
        },
      },
    ]);
  }

  function onArchive() {
    Alert.alert("Archive this group?", "It'll be hidden from your groups list.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        onPress: async () => {
          await archiveGroup(groupId);
          await queryClient.invalidateQueries({ queryKey: ["groups"] });
          router.back();
        },
      },
    ]);
  }

  function onMore() {
    const options: { text: string; style?: "destructive" | "cancel"; onPress?: () => void }[] = [];
    if (isOwner) options.push({ text: "Archive group", onPress: onArchive });
    options.push({ text: "Leave group", style: "destructive", onPress: onLeave });
    options.push({ text: "Cancel", style: "cancel" });
    Alert.alert(group?.name ?? "Group", undefined, options);
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-neutral-100 px-8 dark:bg-neutral-900">
        <Text className="text-center text-neutral-500">Couldn't load this group.</Text>
        <Pressable
          onPress={() => refetch()}
          className="rounded-pill bg-primary px-5 py-2.5 active:opacity-90"
        >
          <Text className="font-semibold text-white">Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (isLoading || !group || !authUser) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <Text className="text-neutral-500">Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-neutral-900" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-white/10"
        >
          <ArrowLeft size={18} color="#1A1D1B" />
        </Pressable>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setInviteOpen(true)}
            className="h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-white/10"
          >
            <UserPlus size={18} color="#1A1D1B" />
          </Pressable>
          <Pressable
            onPress={onMore}
            className="h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-white/10"
          >
            <MoreVertical size={18} color="#1A1D1B" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-32 pt-3" showsVerticalScrollIndicator={false}>
        <View className="mb-5 items-center gap-2">
          <Text className="text-3xl">{group.icon || "👥"}</Text>
          <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{group.name}</Text>
          <View className="flex-row -space-x-2">
            {members.map((m) => (
              <Avatar key={m.id} name={m.users?.display_name} uri={m.users?.avatar_url} size={28} />
            ))}
          </View>
          <MoneyText amount={myBalance} currency={group.currency} tone="auto" className="mt-1 text-3xl" />
          <Text className="text-sm text-neutral-500">
            {myBalance > 0.005 ? "you're owed" : myBalance < -0.005 ? "you owe" : "you're settled up"}
          </Text>
        </View>

        <View className="mb-4">
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { label: "Expenses", value: "expenses" },
              { label: "Balances", value: "balances" },
              { label: "Activity", value: "activity" },
            ]}
          />
        </View>

        {tab === "expenses" && (
          <ExpensesTabView
            groupId={groupId}
            members={members}
            currentUserId={authUser.id}
            onSelectExpense={setSelectedExpense}
          />
        )}
        {tab === "balances" && (
          <BalancesTabView
            groupId={groupId}
            groupCurrency={group.currency}
            members={members}
            currentUserId={authUser.id}
            onSettleUp={(from, to, amount) => setSettleUp({ from, to, amount })}
          />
        )}
        {tab === "activity" && (
          <ActivityTabView
            groupId={groupId}
            groupCurrency={group.currency}
            members={members}
            currentUserId={authUser.id}
          />
        )}
      </ScrollView>

      {tab === "expenses" && (
        <Pressable
          onPress={() => setAddExpenseOpen(true)}
          className="absolute bottom-8 right-5 h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-90"
          style={{
            shadowColor: "#2F6F5E",
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
        >
          <Plus color="white" size={28} />
        </Pressable>
      )}

      <ExpenseFormSheet
        visible={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        groupId={groupId}
        groupCurrency={group.currency}
        members={members}
        currentUserId={authUser.id}
      />

      <ExpenseFormSheet
        visible={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        groupId={groupId}
        groupCurrency={group.currency}
        members={members}
        currentUserId={authUser.id}
        existingExpense={editingExpense ?? undefined}
      />

      <ExpenseDetailSheet
        visible={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        members={members}
        groupId={groupId}
        onEdit={() => {
          setEditingExpense(selectedExpense);
          setSelectedExpense(null);
        }}
      />

      <InviteSheet visible={inviteOpen} onClose={() => setInviteOpen(false)} groupId={groupId} />

      {settleUp && (
        <SettleUpSheet
          visible={!!settleUp}
          onClose={() => setSettleUp(null)}
          groupId={groupId}
          groupCurrency={group.currency}
          fromUserId={settleUp.from}
          toUserId={settleUp.to}
          suggestedAmount={settleUp.amount}
          members={members}
        />
      )}
    </SafeAreaView>
  );
}
