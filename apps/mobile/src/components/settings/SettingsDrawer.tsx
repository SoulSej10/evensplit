import { useEffect, useState } from "react";
import { Dimensions, Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSettingsDrawer } from "@/context/settings-drawer";
import { SettingsPanelContent } from "./SettingsPanelContent";

const WINDOW = Dimensions.get("window");
const PANEL_WIDTH = Math.round(WINDOW.width * 0.8);
const OPEN_DURATION = 220;
const CLOSE_DURATION = 200;

/**
 * Left-sliding panel covering ~80% of the screen width, dismissed by
 * tapping the dimmed backdrop. An explicit `height: WINDOW.height` on both
 * the panel and the backdrop (rather than `position: absolute` with
 * `top: 0, bottom: 0`) — the absolute version measured its height against
 * the Modal's own content area, which on Android can come up short of the
 * true screen height, letting the panel's last row (Sign out/Delete
 * account) render past the panel's real bottom edge, overlapping the
 * floating tab bar behind it instead of stopping cleanly above it.
 *
 * The slide is driven manually with a shared value + withTiming (not
 * Reanimated's entering/exiting props) because this component is mounted
 * once in (tabs)/_layout.tsx and only ever has its `visible` prop toggled -
 * RN's <Modal visible> doesn't remount its children, so entering/exiting
 * (which only fire on a real mount/unmount) only played the very first
 * time the drawer opened and silently no-op'd on every open after that.
 */
export function SettingsDrawer() {
  const { visible, close } = useSettingsDrawer();
  const [mounted, setMounted] = useState(visible);
  const translateX = useSharedValue(-PANEL_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateX.value = withTiming(0, { duration: OPEN_DURATION, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: OPEN_DURATION });
    } else if (mounted) {
      translateX.value = withTiming(-PANEL_WIDTH, { duration: CLOSE_DURATION, easing: Easing.in(Easing.cubic) });
      backdropOpacity.value = withTiming(0, { duration: CLOSE_DURATION }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable refs, not reactive deps
  }, [visible]);

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={close}>
      <View style={{ flexDirection: "row", width: WINDOW.width, height: WINDOW.height }}>
        <Animated.View
          className="bg-surface dark:bg-surface-dark"
          style={[{ width: PANEL_WIDTH, height: WINDOW.height }, panelStyle]}
        >
          <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
            <View className="flex-1">
              <SettingsPanelContent onClose={close} />
            </View>
          </SafeAreaView>
        </Animated.View>
        <Animated.View style={[{ flex: 1, height: WINDOW.height }, backdropStyle]}>
          <Pressable className="flex-1 bg-black/40" onPress={close} accessibilityLabel="Close settings" />
        </Animated.View>
      </View>
    </Modal>
  );
}
