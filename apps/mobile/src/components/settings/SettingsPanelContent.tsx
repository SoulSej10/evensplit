import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import * as DocumentPicker from "expo-document-picker";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { CaretRight as ChevronRight, Download, Key as KeyRound, ListChecks, SignOut as LogOut, PiggyBank, ShieldCheck, Tag, Trash as Trash2, Upload, Wallet, X } from "phosphor-react-native";
import { CURRENCIES } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ensureNotificationPermission, registerForPushTokenAsync } from "@/lib/notifications";
import { hasShownNotificationNudge, setNotificationNudgeShown } from "@/lib/device-flags";
import { upsertProfile } from "@/lib/api/profile";
import { EditProfileSheet } from "./EditProfileSheet";
import {
  usePersonalAccounts,
  usePersonalCategories,
  usePersonalTransactions,
} from "@/hooks/use-personal";
import { importPersonalLedgerRows } from "@/lib/api/personal";
import {
  buildPersonalLedgerCsv,
  exportAndShareCsv,
  parsePersonalLedgerCsv,
  readCsvFile,
  summarizePersonalImport,
} from "@/lib/csv";
import { useQueryClient } from "@tanstack/react-query";

function goToFinancesTab(tab: string, onClose: () => void) {
  onClose();
  router.navigate({ pathname: "/(app)/(tabs)/finances", params: { tab } });
}

export function SettingsPanelContent({ onClose }: { onClose: () => void }) {
  const { authUser, profile, signOut, refreshProfile } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [notifExpenses, setNotifExpenses] = useState(true);
  const [notifSettlements, setNotifSettlements] = useState(true);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);

  const { data: transactions } = usePersonalTransactions();
  const { data: accounts } = usePersonalAccounts();
  const { data: categories } = usePersonalCategories();
  const queryClient = useQueryClient();

  // A one-time, friendly nudge instead of silently firing the raw OS
  // permission dialog on every Settings visit - only shown once ever
  // (persisted per-device), and only when notifications genuinely haven't
  // been decided on yet (not if the user already granted or denied them).
  useEffect(() => {
    (async () => {
      if (await hasShownNotificationNudge()) return;
      const { status } = await Notifications.getPermissionsAsync();
      await setNotificationNudgeShown();
      if (status !== "undetermined") return;

      Alert.alert("Enable notifications?", "Get notified on this device when you add an expense or settle up.", [
        { text: "Not now", style: "cancel" },
        {
          text: "Enable",
          onPress: async () => {
            const granted = await ensureNotificationPermission();
            if (!granted) return;
            const token = await registerForPushTokenAsync();
            if (token) console.log("EvenSplit: Expo push token (not yet persisted):", token);
          },
        },
      ]);
    })();
  }, []);

  async function onChangeCurrency(currency: string) {
    if (!authUser || !profile || currency === profile.default_currency) return;
    setSavingCurrency(true);
    try {
      await upsertProfile(authUser.id, { display_name: profile.display_name, default_currency: currency });
      await refreshProfile();
    } catch (err) {
      Alert.alert("Could not update currency", err instanceof Error ? err.message : "Try again");
    } finally {
      setSavingCurrency(false);
    }
  }

  async function onSubmitPassword() {
    if (newPassword.length < 8) {
      Alert.alert("Password too short", "Use at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords don't match", "Re-enter your new password.");
      return;
    }
    setChangingPassword(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      Alert.alert("Password updated");
    } catch (err) {
      Alert.alert("Could not update password", err instanceof Error ? err.message : "Try again");
    } finally {
      setChangingPassword(false);
    }
  }

  async function onExport() {
    if (!transactions || transactions.length === 0) {
      Alert.alert("Nothing to export", "Log a few transactions first.");
      return;
    }
    setExporting(true);
    try {
      const csv = buildPersonalLedgerCsv(transactions, accounts ?? [], categories ?? []);
      const shared = await exportAndShareCsv(`evensplit-personal-${Date.now()}.csv`, csv);
      if (!shared) Alert.alert("Sharing isn't available", "Couldn't open the share sheet on this device.");
    } catch (err) {
      Alert.alert("Export failed", err instanceof Error ? err.message : "Try again");
    } finally {
      setExporting(false);
    }
  }

  async function onImport() {
    if (!authUser) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "text/csv" });
      if (result.canceled || !result.assets?.[0]) return;
      setImporting(true);
      const csvText = await readCsvFile(result.assets[0].uri);
      const { rows, errors } = parsePersonalLedgerCsv(csvText);
      if (rows.length === 0) {
        Alert.alert("No rows found", errors[0] ?? "Couldn't read any valid rows from that file.");
        return;
      }
      const summary = summarizePersonalImport(rows, accounts ?? [], categories ?? []);
      const details = [
        `${summary.rowCount} transaction${summary.rowCount === 1 ? "" : "s"} found.`,
        summary.newAccounts.length > 0 ? `New accounts: ${summary.newAccounts.join(", ")}` : null,
        summary.newCategories.length > 0 ? `New categories: ${summary.newCategories.join(", ")}` : null,
        errors.length > 0 ? `${errors.length} row(s) will be skipped.` : null,
      ]
        .filter(Boolean)
        .join("\n");

      Alert.alert("Import this file?", details, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          onPress: async () => {
            try {
              const { imported } = await importPersonalLedgerRows(
                authUser.id,
                rows,
                accounts ?? [],
                categories ?? [],
                profile?.default_currency ?? "PHP"
              );
              await queryClient.invalidateQueries({ queryKey: ["personal-transactions", authUser.id] });
              await queryClient.invalidateQueries({ queryKey: ["personal-accounts", authUser.id] });
              await queryClient.invalidateQueries({ queryKey: ["personal-categories", authUser.id] });
              Alert.alert("Import complete", `${imported} transaction${imported === 1 ? "" : "s"} added.`);
            } catch (err) {
              Alert.alert("Import failed", err instanceof Error ? err.message : "Try again");
            }
          },
        },
      ]);
    } catch (err) {
      Alert.alert("Could not read file", err instanceof Error ? err.message : "Try again");
    } finally {
      setImporting(false);
    }
  }

  async function onSignOut() {
    onClose();
    await signOut();
    router.replace("/(auth)/login");
  }

  function onDeleteAccount() {
    Alert.alert(
      "Delete your account?",
      "This removes your profile and group memberships. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!authUser) return;
            try {
              const supabase = getSupabaseClient();
              await supabase.from("group_members").delete().eq("user_id", authUser.id);
              await supabase.from("users").delete().eq("id", authUser.id);
              onClose();
              await signOut();
              router.replace("/(auth)/login");
            } catch (err) {
              Alert.alert("Could not delete account", err instanceof Error ? err.message : "Try again");
            }
          },
        },
      ]
    );
  }

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Settings</Text>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10"
          accessibilityLabel="Close settings"
        >
          <X size={16} color="#6B7169" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="gap-4 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Card className="flex-row items-center gap-4">
          <Avatar name={profile?.display_name} uri={profile?.avatar_url} size={52} logoFallback />
          <View className="flex-1">
            <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
              {profile?.display_name ?? "—"}
            </Text>
            <Text className="text-xs text-neutral-500" numberOfLines={1}>
              {authUser?.email}
            </Text>
          </View>
          <Pressable onPress={() => setEditProfileVisible(true)}>
            <ChevronRight color="#6B7169" size={20} />
          </Pressable>
        </Card>

        <Card>
          <Text className="mb-3 font-semibold text-neutral-900 dark:text-neutral-100">Default currency</Text>
          <View className="flex-row flex-wrap gap-2">
            {CURRENCIES.map((c) => (
              <Pressable
                key={c}
                disabled={savingCurrency}
                onPress={() => onChangeCurrency(c)}
                className={cn(
                  "rounded-pill border px-3 py-1.5",
                  c === profile?.default_currency ? "border-primary bg-primary-light" : "border-neutral-500/20"
                )}
              >
                <Text
                  className={cn(
                    "text-xs font-medium",
                    c === profile?.default_currency ? "text-primary" : "text-neutral-500"
                  )}
                >
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <Text className="mb-3 font-semibold text-neutral-900 dark:text-neutral-100">Manage</Text>
          <View className="gap-1">
            <Pressable
              onPress={() => goToFinancesTab("accounts", onClose)}
              className="flex-row items-center justify-between py-2"
            >
              <View className="flex-row items-center gap-2.5">
                <Wallet size={17} color="#16A88F" />
                <Text className="text-neutral-900 dark:text-neutral-100">Accounts</Text>
              </View>
              <ChevronRight color="#6B7169" size={17} />
            </Pressable>
            <Pressable
              onPress={() => goToFinancesTab("categories", onClose)}
              className="flex-row items-center justify-between py-2"
            >
              <View className="flex-row items-center gap-2.5">
                <Tag size={17} color="#16A88F" />
                <Text className="text-neutral-900 dark:text-neutral-100">Categories</Text>
              </View>
              <ChevronRight color="#6B7169" size={17} />
            </Pressable>
            <Pressable
              onPress={() => goToFinancesTab("budgets", onClose)}
              className="flex-row items-center justify-between py-2"
            >
              <View className="flex-row items-center gap-2.5">
                <PiggyBank size={17} color="#16A88F" />
                <Text className="text-neutral-900 dark:text-neutral-100">Budgets</Text>
              </View>
              <ChevronRight color="#6B7169" size={17} />
            </Pressable>
            <Pressable
              onPress={() => goToFinancesTab("records", onClose)}
              className="flex-row items-center justify-between py-2"
            >
              <View className="flex-row items-center gap-2.5">
                <ListChecks size={17} color="#16A88F" />
                <Text className="text-neutral-900 dark:text-neutral-100">Transactions</Text>
              </View>
              <ChevronRight color="#6B7169" size={17} />
            </Pressable>
          </View>
        </Card>

        <Card>
          <Text className="mb-3 font-semibold text-neutral-900 dark:text-neutral-100">Security</Text>
          <Pressable
            onPress={() => setShowPasswordForm((v) => !v)}
            className="flex-row items-center justify-between py-1"
          >
            <View className="flex-row items-center gap-2.5">
              <KeyRound size={17} color="#16A88F" />
              <Text className="text-neutral-900 dark:text-neutral-100">Change password</Text>
            </View>
            <ChevronRight color="#6B7169" size={17} />
          </Pressable>
          {showPasswordForm && (
            <View className="mt-3 gap-2.5">
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                secureTextEntry
                className="rounded-xl border border-neutral-500/20 px-3 py-2.5 text-neutral-900 dark:text-neutral-100"
                placeholderTextColor="#6B7169"
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
                className="rounded-xl border border-neutral-500/20 px-3 py-2.5 text-neutral-900 dark:text-neutral-100"
                placeholderTextColor="#6B7169"
              />
              <Button onPress={onSubmitPassword} loading={changingPassword}>
                <Text className="font-semibold text-white">Update password</Text>
              </Button>
            </View>
          )}
        </Card>

        <Card>
          <Text className="mb-3 font-semibold text-neutral-900 dark:text-neutral-100">Data</Text>
          <Pressable onPress={onExport} disabled={exporting} className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-2.5">
              <Download size={17} color="#16A88F" />
              <Text className="text-neutral-900 dark:text-neutral-100">Export data (CSV)</Text>
            </View>
            <ChevronRight color="#6B7169" size={17} />
          </Pressable>
          <Pressable onPress={onImport} disabled={importing} className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-2.5">
              <Upload size={17} color="#16A88F" />
              <Text className="text-neutral-900 dark:text-neutral-100">Import data (CSV)</Text>
            </View>
            <ChevronRight color="#6B7169" size={17} />
          </Pressable>
        </Card>

        <Card>
          <Text className="mb-3 font-semibold text-neutral-900 dark:text-neutral-100">Appearance</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-neutral-900 dark:text-neutral-100">Dark mode</Text>
            <Switch
              value={colorScheme === "dark"}
              onValueChange={toggleColorScheme}
              trackColor={{ true: "#16A88F", false: "#D9DCD6" }}
            />
          </View>
        </Card>

        <Card>
          <Text className="mb-3 font-semibold text-neutral-900 dark:text-neutral-100">Notifications</Text>
          <Text className="mb-3 text-xs text-neutral-500">
            You'll get a local notification when you add an expense or settle up. Notifying other members needs a
            backend push service (not yet built).
          </Text>
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-neutral-900 dark:text-neutral-100">New expenses</Text>
              <Switch
                value={notifExpenses}
                onValueChange={setNotifExpenses}
                trackColor={{ true: "#16A88F", false: "#D9DCD6" }}
              />
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-neutral-900 dark:text-neutral-100">Settlements</Text>
              <Switch
                value={notifSettlements}
                onValueChange={setNotifSettlements}
                trackColor={{ true: "#16A88F", false: "#D9DCD6" }}
              />
            </View>
          </View>
        </Card>

        <Card>
          <Pressable
            onPress={() => {
              onClose();
              router.push("/(app)/privacy-policy");
            }}
            className="flex-row items-center justify-between py-1"
          >
            <View className="flex-row items-center gap-2.5">
              <ShieldCheck size={17} color="#16A88F" />
              <Text className="text-neutral-900 dark:text-neutral-100">Privacy policy</Text>
            </View>
            <ChevronRight color="#6B7169" size={17} />
          </Pressable>
        </Card>

        <Card className="items-center gap-1 py-5">
          <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {Constants.expoConfig?.name ?? "SplitEven"}
          </Text>
          <Text className="text-xs text-neutral-500">Version {Constants.expoConfig?.version ?? "1.0.0"}</Text>
          <Text className="mt-2 text-xs text-neutral-500">Developed solo by Jess Anthony Tahil</Text>
          <Text className="text-xs text-neutral-500">A Peniko product</Text>
        </Card>

        <View className="flex-row gap-3">
          <Button variant="outline" size="sm" className="flex-1" onPress={onSignOut}>
            <View className="flex-row items-center gap-1.5">
              <LogOut size={15} color="#0A0A0A" />
              <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Sign out</Text>
            </View>
          </Button>

          <Button variant="outline" size="sm" className="flex-1 border-negative/40" onPress={onDeleteAccount}>
            <View className="flex-row items-center gap-1.5">
              <Trash2 size={15} color="#D95F5F" />
              <Text className="text-sm font-semibold text-negative">Delete account</Text>
            </View>
          </Button>
        </View>
      </ScrollView>

      <EditProfileSheet visible={editProfileVisible} onClose={() => setEditProfileVisible(false)} />
    </View>
  );
}
