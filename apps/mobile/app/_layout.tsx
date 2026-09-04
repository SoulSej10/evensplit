import { useEffect } from "react";
import { Stack } from "expo-router";
import * as Sentry from "@sentry/react-native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { colorScheme } from "nativewind";
import { I18nManager } from "react-native";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import "../global.css";
import { Providers } from "@/components/Providers";

SplashScreen.preventAutoHideAsync().catch(() => {});

// No-ops entirely if EXPO_PUBLIC_SENTRY_DSN isn't set (e.g. local dev, or
// before a Sentry project exists) - drop a DSN in .env.local (or the EAS
// project's env vars) whenever a Sentry project exists to turn this on, no
// code change needed.
if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}

// This app has no RTL design at all - force LTR unconditionally so a
// stale forceRTL(true) from an earlier debugging session (persisted
// natively, survives JS reloads and even `adb install -r`) can't silently
// flip every `left`/`right`/absolute-positioned layout in the app (this is
// what caused the settings drawer to render pinned to the right instead of
// the left it's coded for).
if (I18nManager.isRTL) {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
}

// App now defaults to dark mode regardless of the device's system setting,
// per direct feedback. Set once at module load (not in an effect) so the
// very first frame renders dark instead of flashing light first. The
// Settings toggle still calls toggleColorScheme/setColorScheme normally —
// this only changes the starting point each cold launch.
colorScheme.set("dark");

function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Providers>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="invite/[code]" options={{ presentation: "modal", headerShown: true, title: "Join group" }} />
      </Stack>
    </Providers>
  );
}

// Only wrap when Sentry is actually initialized above - Sentry.wrap()
// unconditionally expects a prior Sentry.init() and warns ("App Start Span
// could not be finished") if it never ran, which is the normal case in dev
// without a DSN configured.
export default process.env.EXPO_PUBLIC_SENTRY_DSN ? Sentry.wrap(RootLayout) : RootLayout;
