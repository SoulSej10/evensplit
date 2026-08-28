import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** SVG path for one donut wedge (outer arc, in along the inner radius, back). */
function wedgePath(cx: number, cy: number, rOuter: number, rInner: number, startAngle: number, endAngle: number) {
  const start = Math.min(endAngle - startAngle, 359.99) + startAngle;
  const startOuter = polarToCartesian(cx, cy, rOuter, start);
  const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const startInner = polarToCartesian(cx, cy, rInner, start);
  const endInner = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArc = start - startAngle > 180 ? 1 : 0;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

/**
 * Hand-rolled SVG donut chart (react-native-svg is already a dependency;
 * mobile has no charting library, unlike web's recharts) - a category
 * breakdown reads more naturally as a donut than another bar list, per
 * direct feedback ("don't just use bar graphs"). Renders a center label
 * (total) and a legend below, matching the existing CategoryBars/bar-chart
 * layout convention so it drops into the same card slots.
 */
export function DonutChart({
  segments,
  centerLabel,
  size = 160,
}: {
  segments: DonutSegment[];
  centerLabel?: string;
  size?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2;
  const rInner = rOuter * 0.62;

  let angle = 0;
  const wedges = segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const sweep = total > 0 ? (seg.value / total) * 360 : 0;
      const path = wedgePath(cx, cy, rOuter, rInner, angle, angle + sweep);
      angle += sweep;
      return { ...seg, path };
    });

  return (
    <View className="items-center gap-4">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {wedges.length === 0 ? (
            <Path d={wedgePath(cx, cy, rOuter, rInner, 0, 359.99)} fill="#6B7169" opacity={0.12} />
          ) : (
            wedges.map((w) => <Path key={w.label} d={w.path} fill={w.color} />)
          )}
        </Svg>
        {centerLabel && (
          <View
            pointerEvents="none"
            style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}
          >
            <Text className="px-2 text-center text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              {centerLabel}
            </Text>
          </View>
        )}
      </View>
      <View className="w-full flex-row flex-wrap justify-center gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <View key={s.label} className="flex-row items-center gap-1.5">
            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <Text className="text-xs capitalize text-neutral-500">{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
