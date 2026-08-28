import { useMemo, useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  Bell,
  Clock,
  PiggyBank,
} from "lucide-react-native";
import {
  computeBudgetProgress,
  computeSharedBalancesSummary,
  filterTransactionsForCurrentMonth,
  type GroupBalanceInput,
} from "@evensplit/shared";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { GroupCard } from "@/components/groups/GroupCard";
import { QuickActions } from "@/components/groups/QuickActions";
import { FinancesSummaryCard } from "@/components/personal/FinancesSummaryCard";
import { AddTransactionSheet } from "@/components/personal/AddTransactionSheet";
import { SettlementReceiptBanner } from "@/components/personal/SettlementReceiptBanner";
import { SkeletonCardRows } from "@/components/ui/Skeleton";
import { EdgeFade } from "@/components/ui/EdgeFade";
import { useAuth } from "@/hooks/use-auth";
import { useSettingsDrawer } from "@/context/settings-drawer";
import { useAllActivity, useAllExpenses, useAllSettlements, useMyGroups } from "@/hooks/use-groups";
import { usePersonalAccounts, usePersonalBudgets, usePersonalCategories, usePersonalTransactions } from "@/hooks/use-personal";
import { formatMoney } from "@/lib/format";
import { CreateGroupSheet } from "@/components/groups/CreateGroupSheet";
import { JoinGroupSheet } from "@/components/groups/JoinGroupSheet";

const GROUPS_PREVIEW_COUNT = 3;
const ACTIVITY_PREVIEW_COUNT = 5;
const UPCOMING_PREVIEW_COUNT = 3;

/**
 * Home: the financial command center. Composes existing, real, data-driven
 * pieces rather than a fully custom layout - every number here comes from
 * data already being fetched elsewhere in the app (groups, expenses,
 * settlements, personal accounts/budgets), just aggregated for a top-level
 * view. Nothing on this screen is a placeholder or mock value.
 */
export default function HomeScreen() {
  const { authUser, profile } = useAuth();
  const { open: openSettings } = useSettingsDrawer();
  const { data: groups, isLoading: groupsLoading } = useMyGroups();
  const { data: allExpenses } = useAllExpenses();
  const { data: allSettlements } = useAllSettlements();
  const { data: allActivity } = useAllActivity();
  const { data: accounts } = usePersonalAccounts();
  const { data: budgets } = usePersonalBudgets();
  const { data: categories } = usePersonalCategories();
  const { data: transactions } = usePersonalTransactions();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [joinSheetOpen, setJoinSheetOpen] = useState(false);
  const [quickAddKind, setQuickAddKind] = useState<"income" | "expense" | "transfer" | null>(null);

  const preview = (groups ?? []).slice(0, GROUPS_PREVIEW_COUNT);

  const sharedBalances = useMemo(() => {
    if (!authUser || !groups || !allExpenses || !allSettlements) return [];
    const inputs: GroupBalanceInput[] = groups.map((g) => ({
      group_id: g.id,
      currency: g.currency,
      member_ids: g.group_members.map((m) => m.user_id),
      expenses: allExpenses.filter((e) => e.group_id === g.id),
      expense_shares: allExpenses.filter((e) => e.group_id === g.id).flatMap((e) => e.expense_shares),
      settlements: allSettlements.filter((s) => s.group_id === g.id),
    }));
    return computeSharedBalancesSummary(inputs, authUser.id);
  }, [authUser, groups, allExpenses, allSettlements]);

  const budgetHighlight = useMemo(() => {
    if (!budgets || budgets.length === 0) return null;
    const progress = computeBudgetProgress(
      budgets,
      categories ?? [],
      filterTransactionsForCurrentMonth(transactions ?? [])
    );
    if (progress.length === 0) return null;
    return progress.reduce((max, p) => (p.percent > max.percent ? p : max), progress[0]);
  }, [budgets, categories, transactions]);

  const upcomingRecurring = useMemo(() => {
    return (allExpenses ?? [])
      .filter((e) => e.is_recurring && e.next_occurrence_date)
      .sort((a, b) => (a.next_occurrence_date! < b.next_occurrence_date! ? -1 : 1))
      .slice(0, UPCOMING_PREVIEW_COUNT);
  }, [allExpenses]);

  const recentActivity = (allActivity ?? []).slice(0, ACTIVITY_PREVIEW_COUNT);
  const groupById = new Map((groups ?? []).map((g) => [g.id, g]));

  const unconfirmedSettlements = (allSettlements ?? []).filter(
    (s) => s.to_user === authUser?.id && s.to_account_id === null
  );

  function memberName(groupId: string, userId: string) {
    if (userId === authUser?.id) return "You";
    const group = groupById.get(groupId);
    return group?.group_members.find((m) => m.user_id === userId)?.users?.display_name ?? "Someone";
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-neutral-900" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 pb-1 pt-3">
        <Pressable
          onPress={openSettings}
          className="flex-row items-center gap-2.5 active:opacity-70"
          accessibilityLabel="Settings"
        >
          <Avatar name={profile?.display_name} uri={profile?.avatar_url} size={38} />
        </Pressable>
        <Pressable
          onPress={() => router.navigate("/(app)/(tabs)/activity")}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70 dark:bg-surface-dark"
          accessibilityLabel="Activity"
        >
          <Bell color="#0A0A0A" size={18} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-32 pt-3" showsVerticalScrollIndicator={false}>
        <Text className="mb-5 text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
          {profile?.display_name ? `Good to see you, ${profile.display_name.split(" ")[0]}` : "Home"}
        </Text>

        <FinancesSummaryCard />

        <SettlementReceiptBanner
          unconfirmed={unconfirmedSettlements}
          groupName={(id) => groupById.get(id)?.name ?? "a group"}
          groupCurrency={(id) => groupById.get(id)?.currency ?? "PHP"}
        />

        {sharedBalances.length > 0 && (
          <View className="mb-4 gap-2 rounded-card border border-neutral-500/15 bg-surface p-4 dark:bg-surface-dark">
            <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Shared balances
            </Text>
            {sharedBalances.map((s) => (
              <View key={s.currency} className="flex-row items-center justify-between">
                <View className="flex-row gap-4">
                  <View>
                    <Text className="text-[10px] text-neutral-500">People owe you</Text>
                    <Text className="text-sm font-bold text-positive">{formatMoney(s.owedToYou, s.currency)}</Text>
                  </View>
                  <View>
                    <Text className="text-[10px] text-neutral-500">You owe</Text>
                    <Text className="text-sm font-bold text-negative">{formatMoney(s.youOwe, s.currency)}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-[10px] text-neutral-500">Net</Text>
                  <Text className={`text-sm font-bold ${s.net >= 0 ? "text-positive" : "text-negative"}`}>
                    {formatMoney(s.net, s.currency)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <QuickActions onCreateGroup={() => setSheetOpen(true)} onJoinGroup={() => setJoinSheetOpen(true)} />

        <View className="mb-6 flex-row gap-3">
          <Pressable
            onPress={() => setQuickAddKind("income")}
            className="flex-1 items-center gap-1.5 rounded-card bg-surface py-3 active:opacity-80 dark:bg-surface-dark"
          >
            <ArrowDownLeft color="#009B87" size={18} />
            <Text className="text-xs font-medium text-neutral-900 dark:text-neutral-100">Income</Text>
          </Pressable>
          <Pressable
            onPress={() => setQuickAddKind("expense")}
            className="flex-1 items-center gap-1.5 rounded-card bg-surface py-3 active:opacity-80 dark:bg-surface-dark"
          >
            <ArrowUpRight color="#D95F5F" size={18} />
            <Text className="text-xs font-medium text-neutral-900 dark:text-neutral-100">Expense</Text>
          </Pressable>
          <Pressable
            onPress={() => setQuickAddKind("transfer")}
            className="flex-1 items-center gap-1.5 rounded-card bg-surface py-3 active:opacity-80 dark:bg-surface-dark"
          >
            <ArrowRightLeft color="#6B7169" size={18} />
            <Text className="text-xs font-medium text-neutral-900 dark:text-neutral-100">Transfer</Text>
          </Pressable>
        </View>

        {budgetHighlight && (
          <Pressable onPress={() => router.navigate("/(app)/(tabs)/finances")}>
            <Card className="mb-4 gap-2">
              <View className="flex-row items-center gap-2">
                <PiggyBank color="#5B3A8E" size={16} />
                <Text className="flex-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {budgetHighlight.category_name} budget
                </Text>
                <Text className="text-xs text-neutral-500">
                  {formatMoney(budgetHighlight.spent, accounts?.[0]?.currency ?? "PHP")} /{" "}
                  {formatMoney(budgetHighlight.limit, accounts?.[0]?.currency ?? "PHP")}
                </Text>
              </View>
              <View className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                <View
                  className={`h-full ${
                    budgetHighlight.percent > 100 ? "bg-negative" : budgetHighlight.percent >= 80 ? "bg-accent" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(budgetHighlight.percent, 100)}%` }}
                />
              </View>
            </Card>
          </Pressable>
        )}

        {upcomingRecurring.length > 0 && (
          <View className="mb-4 gap-2">
            <Text className="text-base font-bold text-neutral-900 dark:text-neutral-100">Upcoming</Text>
            {upcomingRecurring.map((e) => (
              <Card key={e.id} className="flex-row items-center gap-3 py-2.5">
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-neutral-500/10">
                  <Clock color="#6B7169" size={14} />
                </View>
                <Text className="flex-1 text-sm text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
                  {e.description}
                </Text>
                <Text className="text-xs font-medium text-neutral-500">
                  {formatMoney(e.amount, e.currency)}
                </Text>
              </Card>
            ))}
          </View>
        )}

        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-base font-bold text-neutral-900 dark:text-neutral-100">Your groups</Text>
          <Pressable
            onPress={() => router.navigate("/(app)/(tabs)/groups")}
            className="flex-row items-center gap-1 active:opacity-70"
          >
            <Text className="text-sm font-semibold text-primary">See all</Text>
            <ArrowRight color="#5B3A8E" size={14} />
          </Pressable>
        </View>

        {groupsLoading && <SkeletonCardRows count={2} />}

        {!groupsLoading && preview.length === 0 && (
          <Text className="mb-4 text-sm text-neutral-500">
            No groups yet — start one with the button above.
          </Text>
        )}

        {!groupsLoading && preview.map((g) => <GroupCard key={g.id} group={g} />)}

        {recentActivity.length > 0 && (
          <View className="mt-2 gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-neutral-900 dark:text-neutral-100">Recent activity</Text>
              <Pressable
                onPress={() => router.navigate("/(app)/(tabs)/activity")}
                className="flex-row items-center gap-1 active:opacity-70"
              >
                <Text className="text-sm font-semibold text-primary">See all</Text>
                <ArrowRight color="#5B3A8E" size={14} />
              </Pressable>
            </View>
            {recentActivity.map((item) => (
              <Card key={`${item.type}-${item.id}`} className="py-2.5">
                {item.type === "expense_added" ? (
                  <Text className="text-sm text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
                    {memberName(item.group_id, item.paid_by)} added{" "}
                    <Text className="font-semibold">{item.description}</Text> ·{" "}
                    {formatMoney(item.amount, item.currency)}
                  </Text>
                ) : (
                  <Text className="text-sm text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
                    {memberName(item.group_id, item.from_user)} paid {memberName(item.group_id, item.to_user)} ·{" "}
                    {formatMoney(item.amount, groupById.get(item.group_id)?.currency ?? "PHP")}
                  </Text>
                )}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
      <EdgeFade edge="bottom" />

      <CreateGroupSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
      <JoinGroupSheet visible={joinSheetOpen} onClose={() => setJoinSheetOpen(false)} />
      <AddTransactionSheet
        visible={quickAddKind !== null}
        onClose={() => setQuickAddKind(null)}
        initialKind={quickAddKind ?? "expense"}
      />
    </SafeAreaView>
  );
}
