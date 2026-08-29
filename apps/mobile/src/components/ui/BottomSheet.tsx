import { type ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { X } from "lucide-react-native";
import { cn } from "@/lib/cn";

/**
 * Bottom-sheet modal used for Add Expense / Settle Up instead of full-screen
 * forms, per PROJECT_PLAN §3.5. Slides up from the bottom with a plain,
 * non-bouncy timing animation, dims the backdrop, and stays anchored to the
 * bottom of the screen with generous rounded corners.
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
  return (
    // animationType="none": the native Modal transition and Reanimated's
    // entering/exiting animations used to run at the same time, which read
    // as a jump/pop instead of one clean motion. Reanimated now owns the
    // entire open/close transition - a fade on the backdrop, a slide on the
    // sheet - so there's exactly one animation per element.
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} className="flex-1">
        <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.duration(220).easing(Easing.out(Easing.cubic))}
        exiting={SlideOutDown.duration(200).easing(Easing.in(Easing.cubic))}
        className="absolute bottom-0 left-0 right-0 max-h-[88%] rounded-t-[18px] bg-surface dark:bg-surface-dark"
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
