import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { ChevronRight, LogOut, Trash2 } from "lucide-react-native";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ensureNotificationPermission } from "@/lib/notifications";

export default function SettingsScreen() {
  const { authUser, profile, signOut } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const [notifExpenses, setNotifExpenses] = useState(true);
  const [notifSettlements, setNotifSettlements] = useState(true);

  // Request notification permission once, the first time the user visits
  // Settings — not on app load, so it isn't intrusive on first launch.
  useEffect(() => {
    void ensureNotificationPermission();
  }, []);

  async function onSignOut() {
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
    <SafeAreaView className="flex-1 bg-neutral-100 dark:bg-neutral-900" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 px-5 pb-32 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="mb-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100">Settings</Text>

        <Card className="flex-row items-center gap-4">
          <Avatar name={profile?.display_name} uri={profile?.avatar_url} size={56} />
          <View className="flex-1">
            <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {profile?.display_name ?? "—"}
            </Text>
            <Text className="text-sm text-neutral-500">{authUser?.email}</Text>
          </View>
          <Pressable onPress={() => router.push("/(app)/profile-edit")}>
            <ChevronRight color="#6B7169" size={20} />
          </Pressable>
        </Card>

        <Card>
          <Text className="mb-3 font-semibold text-neutral-900 dark:text-neutral-100">Appearance</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-neutral-900 dark:text-neutral-100">Dark mode</Text>
            <Switch
              value={colorScheme === "dark"}
              onValueChange={toggleColorScheme}
              trackColor={{ true: "#2F6F5E", false: "#D9DCD6" }}
            />
          </View>
        </Card>

        <Card>
          <Text className="mb-3 font-semibold text-neutral-900 dark:text-neutral-100">
            Notifications
          </Text>
          <Text className="mb-3 text-xs text-neutral-500">
            You'll get a local notification when you add an expense or settle up.
            Notifying other members needs a backend push service (not yet built).
          </Text>
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-neutral-900 dark:text-neutral-100">New expenses</Text>
              <Switch
                value={notifExpenses}
                onValueChange={setNotifExpenses}
                trackColor={{ true: "#2F6F5E", false: "#D9DCD6" }}
              />
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-neutral-900 dark:text-neutral-100">Settlements</Text>
              <Switch
                value={notifSettlements}
                onValueChange={setNotifSettlements}
                trackColor={{ true: "#2F6F5E", false: "#D9DCD6" }}
              />
            </View>
          </View>
        </Card>

        <Button variant="outline" size="lg" onPress={onSignOut}>
          <View className="flex-row items-center gap-2">
            <LogOut size={18} color="#1A1D1B" />
            <Text className="font-semibold text-neutral-900 dark:text-neutral-100">Sign out</Text>
          </View>
        </Button>

        <Button variant="destructive" size="lg" onPress={onDeleteAccount}>
          <View className="flex-row items-center gap-2">
            <Trash2 size={18} color="white" />
            <Text className="font-semibold text-white">Delete account</Text>
          </View>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
