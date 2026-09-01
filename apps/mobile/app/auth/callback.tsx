import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { applyAuthCallbackUrl } from "@/lib/supabase/authDeepLink";

/**
 * Landing target for Supabase email-confirmation and OAuth redirect links
 * (evensplit://auth/callback#access_token=...). Establishes the session
 * from the URL's token fragment, then hands off to the root SplashGate
 * (app/index.tsx) to route based on the now-authenticated state. Handles
 * both a cold start (link tapped while the app wasn't running) and a warm
 * one (app already running/backgrounded).
 */
export default function AuthCallbackScreen() {
  useEffect(() => {
    let handled = false;
    async function handle(url: string) {
      if (handled) return;
      handled = true;
      await applyAuthCallbackUrl(url);
      router.replace("/");
    }

    void Linking.getInitialURL().then((url) => {
      if (url) void handle(url);
    });
    const subscription = Linking.addEventListener("url", (event) => void handle(event.url));
    return () => subscription.remove();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-neutral-100 dark:bg-neutral-900">
      <ActivityIndicator color="#16A88F" size="large" />
    </View>
  );
}
