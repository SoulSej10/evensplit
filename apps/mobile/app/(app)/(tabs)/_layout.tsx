import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { Home, Settings } from "lucide-react-native";

/**
 * Floating, pill-shaped tab bar — explicitly not a flat bottom nav bar, per
 * PROJECT_PLAN §3.5 (consumer-fintech direction).
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#16A88F",
        tabBarInactiveTintColor: "#6B7169",
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          position: "absolute",
          left: 20,
          right: 20,
          bottom: Platform.OS === "ios" ? 28 : 20,
          height: 64,
          borderRadius: 32,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          shadowColor: "#0A0A0A",
          shadowOpacity: 0.12,
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
          title: "Groups",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
