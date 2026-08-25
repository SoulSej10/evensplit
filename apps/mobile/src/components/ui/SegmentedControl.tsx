import { Pressable, Text, View } from "react-native";
import { cn } from "@/lib/cn";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row rounded-pill bg-neutral-100 p-1 dark:bg-white/5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={cn("flex-1 items-center rounded-pill py-2", active && "bg-surface shadow-sm dark:bg-surface-dark")}
          >
            <Text
              className={cn(
                "text-sm font-semibold",
                active ? "text-primary" : "text-neutral-500"
              )}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
