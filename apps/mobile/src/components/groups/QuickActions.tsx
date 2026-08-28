import { Pressable, Text, View } from "react-native";
import { Plus, UserPlus } from "lucide-react-native";

interface QuickAction {
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  onPress: () => void;
}

/**
 * Home-tab quick actions. Previously a 4-icon row that included "Activity"
 * and "Insights" shortcuts - those duplicated the bottom tab bar 1:1 (same
 * destination, different entry point), which read as redundant clutter.
 * Activity/Insights belong to the tab bar; Finances has its own banner
 * below. That leaves exactly two things you can do without picking a group
 * first - start one or join one - so those are the only two actions here,
 * given more visual weight instead of being squeezed into a 4-up row.
 */
export function QuickActions({
  onCreateGroup,
  onJoinGroup,
}: {
  onCreateGroup: () => void;
  onJoinGroup: () => void;
}) {
  const actions: QuickAction[] = [
    { label: "New group", sublabel: "Start a ledger", icon: Plus, onPress: onCreateGroup },
    { label: "Join group", sublabel: "Have an invite?", icon: UserPlus, onPress: onJoinGroup },
  ];

  return (
    <View className="mb-6 flex-row gap-3">
      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={action.onPress}
          className="flex-1 flex-row items-center gap-3 rounded-card bg-surface p-4 active:opacity-80 dark:bg-surface-dark"
          style={{
            shadowColor: "#0A0A0A",
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 1,
          }}
        >
          <View className="h-11 w-11 items-center justify-center rounded-lg bg-neutral-500/10">
            <action.icon color="#6B7169" size={20} />
          </View>
          <View className="shrink">
            <Text className="font-semibold text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
              {action.label}
            </Text>
            <Text className="text-xs text-neutral-500" numberOfLines={1}>
              {action.sublabel}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
