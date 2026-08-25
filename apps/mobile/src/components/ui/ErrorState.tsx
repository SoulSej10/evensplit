import { Text, View } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { Button } from "@/components/ui/Button";

/**
 * Inline error state for a failed query — friendly message + retry action.
 * Query-level failures use this (visible, in-flow) rather than Alert.alert,
 * which the app reserves for mutation failures (see ExpenseFormSheet,
 * SettleUpSheet, etc.) and destructive-action confirmations.
 */
export function ErrorState({
  message = "Something went wrong loading this.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View className="items-center gap-3 rounded-card bg-negative/5 px-5 py-10">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-negative/10">
        <AlertCircle color="#D95F5F" size={22} />
      </View>
      <Text className="text-center text-sm text-neutral-500">{message}</Text>
      {onRetry && (
        <Button size="sm" variant="outline" onPress={onRetry}>
          Try again
        </Button>
      )}
    </View>
  );
}
