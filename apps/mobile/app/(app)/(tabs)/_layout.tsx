import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import { BarChart3, Home, Users, Wallet } from "lucide-react-native";
import { SettingsDrawerProvider } from "@/context/settings-drawer";
import { SettingsDrawer } from "@/components/settings/SettingsDrawer";

/**
 * A standard fixed, full-width bottom tab bar — not floating with side
 * margins/rounded corners, per direct feedback ("fixed position, no edges
 * on it whatsoever"). Not `position: absolute`, so React Navigation
 * reserves its actual height (including the safe-area inset) as part of
 * screen layout automatically, which also fixes the previous floating
 * version not adapting cleanly to 3-button vs gesture navigation.
 *
 * Four primary destinations, matching the four jobs users actually do here:
 * Home ("how am I doing"), Groups ("shared money"), Finances ("my money"),
 * Insights ("what can I learn"). Settings is reached only via a slide-in
 * panel opened from the avatar in each screen's header - not a route, so
 * one SettingsDrawerProvider mounted here lets every screen open the same
 * panel without owning its own open state.
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SettingsDrawerProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#16A88F",
          tabBarInactiveTintColor: isDark ? "#8A8F8C" : "#6B7169",
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
          tabBarStyle: {
            height: 56 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom || 8,
            backgroundColor: isDark ? "#15251C" : "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(10,10,10,0.08)",
            elevation: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="groups"
          options={{
            title: "Groups",
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="finances"
          options={{
            title: "Finances",
            tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: "Insights",
            tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
          }}
        />
        <Tabs.Screen name="activity" options={{ href: null }} />
      </Tabs>
      <SettingsDrawer />
    </SettingsDrawerProvider>
  );
}
