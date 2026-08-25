import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/use-auth";

/** M1 — Splash / auth check: routes to login or the app shell. */
export default function SplashGate() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <ActivityIndicator color="#2F6F5E" size="large" />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!profile) return <Redirect href="/(auth)/profile-setup" />;
  return <Redirect href="/(app)/(tabs)" />;
}
