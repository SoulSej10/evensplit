import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { EdgeFade } from "@/components/ui/EdgeFade";
import { cn } from "@/lib/cn";

/** Horizontally scrollable pill tab row — used where SegmentedControl's fixed-width
 *  equal-flex layout would be too cramped (more than ~3 options). */
export function PillTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T; icon?: React.ComponentType<{ color: string; size: number }> }[];
  value: T;
  onChange: (value: T) => void;
}) {
  // Background color is applied via inline style, not a toggling className,
  // because a conditionally-applied className (especially a slash-opacity
  // one like `dark:bg-white/5`) on a Pressable is a documented
  // nativewind/react-native-css-interop + expo-router race condition
  // (nativewind/nativewind#1536, #1557, #1711) that intermittently throws
  // "Couldn't find a navigation context" on press.
  const { colorScheme } = useColorScheme();
  const inactiveBg = colorScheme === "dark" ? "rgba(255,255,255,0.05)" : "#F7F8F7";

  return (
    <View style={{ position: "relative" }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="items-center gap-2 px-5 pb-3"
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              className="flex-row items-center gap-1.5 rounded-lg px-4 py-2"
              style={{ backgroundColor: active ? "#5B3A8E" : inactiveBg }}
            >
              {opt.icon && <opt.icon color={active ? "white" : "#6B7169"} size={14} />}
              <Text className={cn("text-sm font-semibold", active ? "text-white" : "text-neutral-500")}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {/* Once there are enough tabs to overflow the screen, the row runs off
          both edges with no scroll indicator - this fades the cut-off tab
          on either side into the background instead of leaving a hard,
          broken-looking clip, so it reads as "more to scroll to" rather
          than a bug. */}
      <EdgeFade edge="left" size={24} />
      <EdgeFade edge="right" size={36} />
    </View>
  );
}
