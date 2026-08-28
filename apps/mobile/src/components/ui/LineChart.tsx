import { Text, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

export interface LineSeries {
  label: string;
  color: string;
  points: number[];
}

/**
 * Hand-rolled SVG multi-series line chart (react-native-svg is already a
 * dependency; mobile has no charting library). Replaces a paired-bar trend
 * view for anything with more than a handful of points - a line reads much
 * less compact/cluttered than N pairs of bars, per direct feedback ("use
 * line graphs to reduce compactness").
 */
export function LineChart({
  series,
  labels,
  width = 300,
  height = 100,
}: {
  series: LineSeries[];
  labels: string[];
  width?: number;
  height?: number;
}) {
  const allValues = series.flatMap((s) => s.points);
  const max = Math.max(...allValues, 0.01);
  const padding = 4;
  const usableHeight = height - padding * 2;
  const n = labels.length;
  const step = n > 1 ? width / (n - 1) : 0;

  function toXY(i: number, value: number): [number, number] {
    const x = n > 1 ? i * step : width / 2;
    const y = padding + usableHeight - (value / max) * usableHeight;
    return [x, y];
  }

  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap gap-3">
        {series.map((s) => (
          <View key={s.label} className="flex-row items-center gap-1.5">
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            <Text className="text-xs text-neutral-500">{s.label}</Text>
          </View>
        ))}
      </View>
      <Svg width={width} height={height}>
        <Line x1={0} y1={height - padding} x2={width} y2={height - padding} stroke="#6B7169" strokeOpacity={0.15} />
        {series.map((s) => {
          const points = s.points.map((v, i) => toXY(i, v).join(",")).join(" ");
          return (
            <Polyline
              key={s.label}
              points={points}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
        {series.map((s) =>
          s.points.map((v, i) => {
            const [x, y] = toXY(i, v);
            return <Circle key={`${s.label}-${i}`} cx={x} cy={y} r={2.5} fill={s.color} />;
          })
        )}
      </Svg>
      <View className="flex-row justify-between">
        {labels.map((l, i) => (
          <Text key={`${l}-${i}`} className="text-[9px] text-neutral-500">
            {i % Math.max(1, Math.ceil(n / 6)) === 0 ? l : ""}
          </Text>
        ))}
      </View>
    </View>
  );
}
