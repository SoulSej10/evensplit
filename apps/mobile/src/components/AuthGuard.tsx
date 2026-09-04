import { type ReactNode, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/hooks/use-auth";
import { registerForPushTokenAsync, savePushToken } from "@/lib/notifications";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) router.replace("/(auth)/login");
  }, [loading, session]);

  // Re-registers the push token on every authenticated app launch for users
  // who already granted permission previously (e.g. a reinstall or new
  // device gets a new Expo token) - never prompts, since that's the
  // Settings-panel nudge's job (src/components/settings/SettingsPanelContent.tsx).
  useEffect(() => {
    if (!session?.user.id) return;
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") return;
      const token = await registerForPushTokenAsync();
      if (token) await savePushToken(session.user.id, token);
    })();
  }, [session?.user.id]);

  if (loading || !session) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <ActivityIndicator color="#16A88F" size="large" />
      </View>
    );
  }

  return <>{children}</>;
}
