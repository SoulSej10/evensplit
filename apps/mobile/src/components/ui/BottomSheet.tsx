import { useEffect, useState, type ReactNode } from "react";
import { Dimensions, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { X } from "phosphor-react-native";
import { cn } from "@/lib/cn";

const SHEET_HEIGHT = Dimensions.get("window").height;
const OPEN_DURATION = 220;
const CLOSE_DURATION = 200;

/**
 * Bottom-sheet modal used for Add Expense / Settle Up instead of full-screen
 * forms, per PROJECT_PLAN §3.5. Slides up from the bottom with a plain,
 * non-bouncy timing animation, dims the backdrop, and stays anchored to the
 * bottom of the screen with generous rounded corners.
 *
 * The animation is driven manually with shared values + withTiming (not
 * Reanimated's entering/exiting props) because this component's callers
 * always keep it mounted and just toggle `visible` - RN's <Modal visible>
 * doesn't actually remount its children, so entering/exiting (which only
 * fire on a real mount/unmount) only ever played once, the very first time
 * the sheet opened, and silently no-op'd on every open after that.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withTiming(0, { duration: OPEN_DURATION, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: OPEN_DURATION });
    } else if (mounted) {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: CLOSE_DURATION, easing: Easing.in(Easing.cubic) });
      backdropOpacity.value = withTiming(0, { duration: CLOSE_DURATION }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable refs, not reactive deps
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[{ flex: 1 }, backdropStyle]}>
        <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          { position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "88%" },
          sheetStyle,
        ]}
        className="rounded-t-[18px] bg-surface dark:bg-surface-dark"
      >
        <SafeAreaView edges={["bottom"]}>
          <View className="items-center pt-2.5">
            <View className="h-1.5 w-10 rounded-full bg-neutral-500/25" />
          </View>

          {title && (
            <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
              <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/10"
              >
                <X size={16} color="#6B7169" />
              </Pressable>
            </View>
          )}

          <ScrollView
            className={cn("px-5")}
            contentContainerClassName="gap-4 pb-4"
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {footer && <View className="border-t border-neutral-500/10 px-5 py-4">{footer}</View>}
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}
