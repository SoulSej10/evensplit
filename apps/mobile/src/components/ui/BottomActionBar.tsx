import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/cn";

/**
 * Persistent action bar pinned to the bottom of a screen — the "primary
 * button lives at the bottom, not wherever the form happened to end"
 * pattern from consumer fintech apps (Cash App, Revolut). Use for a
 * screen's one or two primary actions instead of an inline button at the
 * end of scrollable content.
 */
export function BottomActionBar({ children, className, ...props }: ViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn(
        "absolute inset-x-0 bottom-0 flex-row gap-3 border-t border-neutral-500/10 bg-neutral-100 px-5 pt-4 dark:border-white/10 dark:bg-neutral-900",
        className
      )}
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      {...props}
    >
      {children}
    </View>
  );
}
