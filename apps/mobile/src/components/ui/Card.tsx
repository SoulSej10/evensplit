import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";

/**
 * Big rounded card with soft elevation — the base visual unit across the
 * app per PROJECT_PLAN §3.5 (consumer-fintech direction: no boxy forms,
 * no dense tables).
 */
export function Card({ className, style, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn(
        "rounded-card bg-surface p-4 dark:bg-surface-dark",
        className
      )}
      style={[
        {
          shadowColor: "#0A0A0A",
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        },
        style,
      ]}
      {...props}
    />
  );
}
