import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { BarChart3, ListChecks, Plus, UserPlus } from "lucide-react-native";

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  onPress: () => void;
}

/**
 * Icon-grid quick actions on the Home tab — the pattern every consumer
 * fintech app reference uses (a row of "Send / Load / Transfer / Bills"
 * style buttons above the main content), adapted to what SplitEven
 * actually supports: the two things you can do without picking a group
 * first (start or join one), plus shortcuts into the two new top-level
 * tabs for quick discovery.
 */
export function QuickActions({
  onCreateGroup,
  onJoinGroup,
}: {
  onCreateGroup: () => void;
  onJoinGroup: () => void;
}) {
  const actions: QuickAction[] = [
    { label: "New group", icon: Plus, onPress: onCreateGroup },
    { label: "Join group", icon: UserPlus, onPress: onJoinGroup },
    { label: "Activity", icon: ListChecks, onPress: () => router.push("/(app)/(tabs)/activity") },
    { label: "Insights", icon: BarChart3, onPress: () => router.push("/(app)/(tabs)/insights") },
  ];

  return (
    <View className="mb-6 flex-row justify-between">
      {actions.map((action) => (
        <Pressable key={action.label} onPress={action.onPress} className="items-center gap-2">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary-light active:opacity-70">
            <action.icon color="#16A88F" size={22} />
          </View>
          <Text className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
