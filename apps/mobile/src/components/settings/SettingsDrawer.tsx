import { Dimensions, Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from "react-native-reanimated";
import { useSettingsDrawer } from "@/context/settings-drawer";
import { SettingsPanelContent } from "./SettingsPanelContent";

const WINDOW = Dimensions.get("window");
const PANEL_WIDTH = Math.round(WINDOW.width * 0.8);

/**
 * Left-sliding panel covering ~80% of the screen width, dismissed by
 * tapping the dimmed backdrop. An explicit `height: WINDOW.height` on both
 * the panel and the backdrop (rather than `position: absolute` with
 * `top: 0, bottom: 0`) — the absolute version measured its height against
 * the Modal's own content area, which on Android can come up short of the
 * true screen height, letting the panel's last row (Sign out/Delete
 * account) render past the panel's real bottom edge, overlapping the
 * floating tab bar behind it instead of stopping cleanly above it.
 */
export function SettingsDrawer() {
  const { visible, close } = useSettingsDrawer();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <View style={{ flexDirection: "row", width: WINDOW.width, height: WINDOW.height }}>
        <Animated.View
          entering={SlideInLeft.springify().damping(24).stiffness(220)}
          exiting={SlideOutLeft.duration(200)}
          className="bg-surface dark:bg-surface-dark"
          style={{ width: PANEL_WIDTH, height: WINDOW.height }}
        >
          <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
            <View className="flex-1">
              <SettingsPanelContent onClose={close} />
            </View>
          </SafeAreaView>
        </Animated.View>
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(150)}
          style={{ flex: 1, height: WINDOW.height }}
        >
          <Pressable className="flex-1 bg-black/40" onPress={close} accessibilityLabel="Close settings" />
        </Animated.View>
      </View>
    </Modal>
  );
}
