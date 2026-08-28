import { Dimensions, Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from "react-native-reanimated";
import { useSettingsDrawer } from "@/context/settings-drawer";
import { SettingsPanelContent } from "./SettingsPanelContent";

const PANEL_WIDTH = Math.round(Dimensions.get("window").width * 0.8);

/**
 * Left-sliding panel covering ~80% of the screen width, dismissed by
 * tapping the dimmed backdrop — per direct feedback ("I should have the
 * panel navigation open first that covers only about half the screen
 * where if I click on the outside, the panel will close"). Same
 * Modal + Reanimated pattern as BottomSheet, just horizontal.
 */
export function SettingsDrawer() {
  const { visible, close } = useSettingsDrawer();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} className="flex-1">
        <Pressable className="flex-1 bg-black/40" onPress={close} accessibilityLabel="Close settings" />
      </Animated.View>
      <Animated.View
        entering={SlideInLeft.springify().damping(24).stiffness(220)}
        exiting={SlideOutLeft.duration(200)}
        className="absolute bottom-0 left-0 top-0 bg-surface dark:bg-surface-dark"
        style={{ width: PANEL_WIDTH }}
      >
        <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
          <View className="flex-1">
            <SettingsPanelContent onClose={close} />
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}
