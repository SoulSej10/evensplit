import { Text, type TextProps } from "react-native";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Bold tabular-numeral money display, colored by sign — PROJECT_PLAN §3.3/§3.4. */
export function MoneyText({
  amount,
  currency,
  tone = "neutral",
  className,
  ...props
}: TextProps & {
  amount: number;
  currency: string;
  tone?: "positive" | "negative" | "neutral" | "auto";
}) {
  const resolvedTone =
    tone === "auto" ? (amount > 0.005 ? "positive" : amount < -0.005 ? "negative" : "neutral") : tone;

  const toneClass =
    resolvedTone === "positive"
      ? "text-positive"
      : resolvedTone === "negative"
        ? "text-negative"
        : "text-neutral-900 dark:text-neutral-100";

  return (
    <Text
      className={cn("font-bold text-base", toneClass, className)}
      style={[{ fontVariant: ["tabular-nums"] }, props.style]}
      {...props}
    >
      {formatMoney(Math.abs(amount), currency)}
    </Text>
  );
}
