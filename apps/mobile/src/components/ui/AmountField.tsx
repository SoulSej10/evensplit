import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  CALCULATOR_INITIAL_STATE,
  calculatorPressBackspace,
  calculatorPressClear,
  calculatorPressDecimal,
  calculatorPressDigit,
  calculatorPressEquals,
  calculatorPressOperator,
  calculatorValue,
  type CalculatorOperator,
  type CalculatorState,
} from "@evensplit/shared";
import { TextField } from "@/components/ui/TextField";
import { cn } from "@/lib/cn";

type ButtonTone = "digit" | "op" | "muted" | "primary";

const TONE_CLASSES: Record<ButtonTone, string> = {
  digit: "bg-neutral-100 dark:bg-white/5",
  op: "bg-primary-light",
  muted: "bg-transparent",
  primary: "bg-primary",
};

const TONE_TEXT_CLASSES: Record<ButtonTone, string> = {
  digit: "text-neutral-900 dark:text-neutral-100",
  op: "text-primary",
  muted: "text-neutral-500",
  primary: "text-white",
};

function CalcButton({ label, onPress, tone = "digit" }: { label: string; onPress: () => void; tone?: ButtonTone }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn("h-12 flex-1 items-center justify-center rounded-card active:opacity-70", TONE_CLASSES[tone])}
    >
      <Text className={cn("text-base font-semibold tabular-nums", TONE_TEXT_CLASSES[tone])}>{label}</Text>
    </Pressable>
  );
}

const ROWS: { label: string; tone: ButtonTone; kind: "digit" | "decimal" | "op" | "clear" | "backspace" | "equals" }[][] = [
  [
    { label: "C", tone: "muted", kind: "clear" },
    { label: "⌫", tone: "muted", kind: "backspace" },
    { label: "÷", tone: "op", kind: "op" },
    { label: "×", tone: "op", kind: "op" },
  ],
  [
    { label: "7", tone: "digit", kind: "digit" },
    { label: "8", tone: "digit", kind: "digit" },
    { label: "9", tone: "digit", kind: "digit" },
    { label: "−", tone: "op", kind: "op" },
  ],
  [
    { label: "4", tone: "digit", kind: "digit" },
    { label: "5", tone: "digit", kind: "digit" },
    { label: "6", tone: "digit", kind: "digit" },
    { label: "+", tone: "op", kind: "op" },
  ],
  [
    { label: "1", tone: "digit", kind: "digit" },
    { label: "2", tone: "digit", kind: "digit" },
    { label: "3", tone: "digit", kind: "digit" },
    { label: "=", tone: "primary", kind: "equals" },
  ],
  [
    { label: "0", tone: "digit", kind: "digit" },
    { label: ".", tone: "digit", kind: "decimal" },
  ],
];

/**
 * A money-amount field with an always-visible calculator keypad (see
 * packages/shared/calculator.ts for the shared evaluation logic) so users
 * can work out a split, a sum of receipts, etc. right in the field instead
 * of doing the math elsewhere and re-typing the result. Used everywhere an
 * amount/limit is entered - transactions, expenses, settle up, accounts,
 * budgets.
 */
export function AmountField({
  label = "Amount",
  value,
  onChangeText,
  error,
  containerClassName,
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  containerClassName?: string;
}) {
  const [calc, setCalc] = useState<CalculatorState>(CALCULATOR_INITIAL_STATE);

  function update(next: CalculatorState) {
    setCalc(next);
    onChangeText(String(calculatorValue(next)));
  }

  function handleTyped(text: string) {
    onChangeText(text);
    // Keep the calculator's running state in sync so the next keypad press
    // continues from whatever was typed, instead of a stale prior value.
    const n = Number(text);
    setCalc({ ...CALCULATOR_INITIAL_STATE, display: text && n > 0 ? text : "0" });
  }

  return (
    <View className={containerClassName}>
      <TextField
        label={label}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={handleTyped}
        error={error}
      />

      <View className="mt-2 gap-2 rounded-card border border-neutral-200 p-2.5 dark:border-white/10">
        <View className="items-end justify-center rounded-card bg-neutral-100 px-4 py-3 dark:bg-white/5">
          <Text className="font-mono text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
            {calc.display}
          </Text>
        </View>

        <View className="gap-2">
          {ROWS.map((row, i) => (
            <View key={i} className="flex-row gap-2">
              {row.map((btn) => (
                <CalcButton
                  key={btn.label}
                  label={btn.label}
                  tone={btn.tone}
                  onPress={() => {
                    switch (btn.kind) {
                      case "clear":
                        return update(calculatorPressClear());
                      case "backspace":
                        return update(calculatorPressBackspace(calc));
                      case "digit":
                        return update(calculatorPressDigit(calc, btn.label));
                      case "decimal":
                        return update(calculatorPressDecimal(calc));
                      case "op":
                        return update(calculatorPressOperator(calc, btn.label as CalculatorOperator));
                      case "equals":
                        return update(calculatorPressEquals(calc));
                    }
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
