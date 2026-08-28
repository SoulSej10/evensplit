import { Text, TextInput, View, type TextInputProps } from "react-native";
import { cn } from "@/lib/cn";

export function TextField({
  label,
  error,
  className,
  containerClassName,
  ...props
}: TextInputProps & { label?: string; error?: string; containerClassName?: string }) {
  return (
    <View className={cn("gap-1.5", containerClassName)}>
      {label && (
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</Text>
      )}
      <TextInput
        placeholderTextColor="#6B7169"
        className={cn(
          "h-12 rounded-card border border-neutral-500/20 bg-surface px-4 text-base text-neutral-900",
          "dark:bg-surface-dark dark:text-neutral-100",
          error && "border-negative",
          className
        )}
        {...props}
      />
      {error && <Text className="text-xs text-negative">{error}</Text>}
    </View>
  );
}
