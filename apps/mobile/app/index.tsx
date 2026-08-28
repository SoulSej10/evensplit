import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { hasAcceptedPrivacyPolicy } from "@/lib/device-flags";

/** M1 — Splash / auth check: routes to the privacy gate, login, or the app shell. */
export default function SplashGate() {
  const { session, profile, loading } = useAuth();
  const [checkingPolicy, setCheckingPolicy] = useState(true);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  useEffect(() => {
    void hasAcceptedPrivacyPolicy().then((accepted) => {
      setPolicyAccepted(accepted);
      setCheckingPolicy(false);
    });
  }, []);

  if (loading || checkingPolicy) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <ActivityIndicator color="#16A88F" size="large" />
      </View>
    );
  }

  // Shown once per device, before login/signup are ever reachable - a
  // returning, already-authenticated device (policy already accepted in an
  // earlier session) skips straight past this regardless of session state.
  if (!policyAccepted && !session) return <Redirect href="/(auth)/privacy-policy" />;
  if (!session) return <Redirect href="/(auth)/login" />;
  if (!profile) return <Redirect href="/(auth)/profile-setup" />;
  return <Redirect href="/(app)/(tabs)" />;
}
