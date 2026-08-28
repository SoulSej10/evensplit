import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import { BarChart3, Home, Users, Wallet } from "lucide-react-native";
import { SettingsDrawerProvider } from "@/context/settings-drawer";
import { SettingsDrawer } from "@/components/settings/SettingsDrawer";

/**
 * Floating, pill-shaped tab bar — explicitly not a flat bottom nav bar, per
 * PROJECT_PLAN §3.5 (consumer-fintech direction).
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

  // insets.bottom is 0 on 3-button nav (no gesture home indicator to clear)
  // and >0 on gesture nav - respecting it either way keeps the floating bar
  // from crowding the system nav bar on 3-button devices, and from
  // overlapping the home indicator on gesture ones, instead of the old
  // fixed 20/28 that only worked for one navigation mode.
  const barBottom = insets.bottom + (Platform.OS === "ios" ? 8 : 12);

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
            position: "absolute",
            left: 20,
            right: 20,
            bottom: barBottom,
            height: 64,
            borderRadius: 20,
            backgroundColor: isDark ? "#15251C" : "#FFFFFF",
            borderTopWidth: 0,
            shadowColor: "#0A0A0A",
            shadowOpacity: isDark ? 0.3 : 0.12,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
            paddingTop: 8,
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
