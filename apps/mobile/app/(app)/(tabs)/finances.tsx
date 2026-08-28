import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Bell, LayoutGrid, ListChecks, PieChart, PiggyBank, Plus, Tag, Wallet } from "lucide-react-native";
import { Avatar } from "@/components/ui/Avatar";
import { EdgeFade } from "@/components/ui/EdgeFade";
import { PillTabs } from "@/components/personal/PillTabs";
import { FinancesSummaryCard } from "@/components/personal/FinancesSummaryCard";
import { OverviewTabView } from "@/components/personal/OverviewTabView";
import { RecordsTabView } from "@/components/personal/RecordsTabView";
import { AnalysisTabView } from "@/components/personal/AnalysisTabView";
import { BudgetsTabView } from "@/components/personal/BudgetsTabView";
import { AccountsTabView } from "@/components/personal/AccountsTabView";
import { CategoriesTabView } from "@/components/personal/CategoriesTabView";
import { AddTransactionSheet } from "@/components/personal/AddTransactionSheet";
import { AddAccountSheet } from "@/components/personal/AddAccountSheet";
import { AddBudgetSheet } from "@/components/personal/AddBudgetSheet";
import { AddCategorySheet } from "@/components/personal/AddCategorySheet";
import { useAuth } from "@/hooks/use-auth";
import { useSettingsDrawer } from "@/context/settings-drawer";
import { usePersonalAccounts } from "@/hooks/use-personal";

type Tab = "overview" | "records" | "analysis" | "budgets" | "accounts" | "categories";

const TABS: { label: string; value: Tab; icon: React.ComponentType<{ color: string; size: number }> }[] = [
  { label: "Overview", value: "overview", icon: LayoutGrid },
  { label: "Transactions", value: "records", icon: ListChecks },
  { label: "Analysis", value: "analysis", icon: PieChart },
  { label: "Budgets", value: "budgets", icon: PiggyBank },
  { label: "Accounts", value: "accounts", icon: Wallet },
  { label: "Categories", value: "categories", icon: Tag },
];

/** Which sheet the floating action button opens for each tab; tabs with no create action are omitted (FAB hides). */
const CREATE_LABEL: Partial<Record<Tab, string>> = {
  records: "Add transaction",
  accounts: "Add account",
  budgets: "Set budget",
  categories: "Add category",
};

/**
 * The "Finances" tab - a top-level bottom-tab destination now, not a
 * screen you navigate into from Home, so its header matches Home/Groups
 * (avatar -> Settings, bell -> Activity) instead of a back arrow.
 *
 * The create action for whichever sub-tab is active lives in one floating
 * action button here, not as an inline "+ Add" button duplicated inside
 * every *TabView - that button disappears entirely on tabs with nothing to
 * create (Overview, Analysis).
 */
export default function FinancesScreen() {
  const { profile } = useAuth();
  const { open: openSettings } = useSettingsDrawer();
  const { data: accounts } = usePersonalAccounts();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>("overview");
  const [sheet, setSheet] = useState<Tab | null>(null);

  // Lets the Settings drawer's "Manage" shortcuts (Accounts/Categories/
  // Budgets/Transactions) jump straight to the right sub-tab instead of
  // always landing on Overview.
  useEffect(() => {
    if (params.tab && TABS.some((t) => t.value === params.tab)) {
      setTab(params.tab as Tab);
    }
  }, [params.tab]);

  function onFabPress() {
    if (tab === "records" && (accounts?.length ?? 0) === 0) {
      Alert.alert("Add an account first", "You need at least one account before you can log a transaction.");
      return;
    }
    setSheet(tab);
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

      <Text className="px-5 pb-2 text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
        Finances
      </Text>

      <FinancesSummaryCard />

      <PillTabs options={TABS} value={tab} onChange={setTab} />

      <ScrollView contentContainerClassName="px-5 pb-4" showsVerticalScrollIndicator={false}>
        {tab === "overview" && <OverviewTabView onNavigateTab={setTab} />}
        {tab === "records" && <RecordsTabView />}
        {tab === "analysis" && <AnalysisTabView />}
        {tab === "budgets" && <BudgetsTabView />}
        {tab === "accounts" && <AccountsTabView />}
        {tab === "categories" && <CategoriesTabView />}
      </ScrollView>
      <EdgeFade edge="bottom" />

      {CREATE_LABEL[tab] && (
        <Pressable
          onPress={onFabPress}
          accessibilityLabel={CREATE_LABEL[tab]}
          className="absolute bottom-28 right-5 h-16 w-16 items-center justify-center rounded-full bg-primary active:opacity-90"
          style={{
            shadowColor: "#16A88F",
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
        >
          <Plus color="white" size={28} />
        </Pressable>
      )}

      <AddTransactionSheet visible={sheet === "records"} onClose={() => setSheet(null)} />
      <AddAccountSheet visible={sheet === "accounts"} onClose={() => setSheet(null)} />
      <AddBudgetSheet visible={sheet === "budgets"} onClose={() => setSheet(null)} />
      <AddCategorySheet visible={sheet === "categories"} onClose={() => setSheet(null)} defaultKind="expense" />
    </SafeAreaView>
  );
}
