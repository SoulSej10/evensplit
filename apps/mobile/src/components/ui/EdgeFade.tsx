import { View } from "react-native";
import { useColorScheme } from "nativewind";

const BANDS = 10;

/**
 * A soft fade toward the screen's own background color, used two places:
 *  - `edge="bottom"`: layered above the very bottom of a scrollable screen
 *    that uses the floating tab bar. The tab bar floats as an island
 *    (`left/right: 20`, rounded corners) rather than spanning edge-to-edge,
 *    so content can otherwise be glimpsed passing behind/beside it
 *    mid-scroll with a hard, unpolished cutoff. This eases that transition.
 *  - `edge="left"`/`edge="right"`: on a horizontally-scrolling row that
 *    overflows the screen (PillTabs, once there are enough tabs to not all
 *    fit), so a partially-visible tab at either edge - the first tab
 *    scrolled past on the left, or the last one not yet reached on the
 *    right - reads as "more to scroll to" instead of looking like broken,
 *    mid-word-truncated content.
 *
 * Built from stacked flat bands rather than a true gradient (no
 * linear-gradient native module in this project) - with 10 bands the
 * banding isn't perceptible at normal viewing distance. Purely decorative -
 * `pointerEvents="none"` so it never intercepts touches meant for the
 * content underneath.
 */
export function EdgeFade({ edge, size = 90 }: { edge: "bottom" | "left" | "right"; size?: number }) {
  const { colorScheme } = useColorScheme();
  const bg = colorScheme === "dark" ? "#0A120D" : "#F7F8F7";

  const bands = Array.from({ length: BANDS }, (_, i) => Math.pow((i + 1) / BANDS, 1.5));

  if (edge === "bottom") {
    return (
      <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: size }}>
        {bands.map((opacity, i) => (
          <View key={i} style={{ height: size / BANDS, backgroundColor: bg, opacity }} />
        ))}
      </View>
    );
  }

  // For the left edge, opacity should be highest right at the true left
  // edge and ease off toward the content - the reverse order of `bands`
  // (which ramps up left-to-right, correct as-is for the right edge).
  const ordered = edge === "left" ? [...bands].reverse() : bands;

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, bottom: 0, [edge]: 0, width: size, flexDirection: "row" }}
    >
      {ordered.map((opacity, i) => (
        <View key={i} style={{ width: size / BANDS, backgroundColor: bg, opacity }} />
      ))}
    </View>
  );
}
