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
            className={cn("flex-1 items-center rounded-pill py-2", active && "bg-surface dark:bg-surface-dark")}
            // `shadow-*` (and slash-opacity color) classes that toggle on
            // press are a documented nativewind/react-native-css-interop
            // race condition with expo-router's navigation context
            // (nativewind/nativewind#1536, #1557, #1711) - it intermittently
            // throws "Couldn't find a navigation context" on press. Moving
            // the shadow to a plain style prop (never a className) avoids
            // triggering that interop path entirely.
            style={active ? { shadowColor: "#0A0A0A", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 } : undefined}
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
