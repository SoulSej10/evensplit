import { useEffect, useRef } from "react";
import { Animated, View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";

/**
 * Simple pulsing skeleton block for loading states — consumer-fintech style
 * (rounded, soft, no spinners-as-primary-affordance where a shape preview
 * reads better). Uses Animated opacity loop rather than NativeWind's
 * `animate-pulse` (not reliably supported cross-platform in RN).
 */
export function Skeleton({ className, style, ...props }: ViewProps & { className?: string }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={cn("rounded-card bg-neutral-500/15", className)}
      style={[{ opacity }, style]}
      {...props}
    />
  );
}

/** A row of skeleton cards mimicking the app's Card list rows (avatar + two lines + trailing amount). */
export function SkeletonCardRows({ count = 3 }: { count?: number }) {
  return (
    <View className="gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className="flex-row items-center gap-3 rounded-card bg-surface p-4 dark:bg-surface-dark"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-3.5 w-2/3 rounded-md" />
            <Skeleton className="h-3 w-1/3 rounded-md" />
          </View>
          <Skeleton className="h-4 w-14 rounded-md" />
        </View>
      ))}
    </View>
  );
}
