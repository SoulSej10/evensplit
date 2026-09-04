import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
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

function CalcButton({
  label,
  onPress,
  tone = "digit",
  wide = false,
}: {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  wide?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "h-12 items-center justify-center rounded-card active:opacity-70",
        wide ? "flex-[2]" : "flex-1",
        TONE_CLASSES[tone]
      )}
    >
      <Text className={cn("text-base font-semibold tabular-nums", TONE_TEXT_CLASSES[tone])}>{label}</Text>
    </Pressable>
  );
}

type CalcButtonSpec = {
  label: string;
  tone: ButtonTone;
  kind: "digit" | "decimal" | "op" | "clear" | "backspace" | "equals";
  wide?: boolean;
};

const ROWS: CalcButtonSpec[][] = [
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
    { label: "0", tone: "digit", kind: "digit", wide: true },
    { label: ".", tone: "digit", kind: "decimal" },
  ],
];

/**
 * A money-amount field whose own display doubles as both the typable amount
 * field and the calculator's running readout (see packages/shared/calculator.ts
 * for the shared evaluation logic) - one field, not a text field stacked on
 * top of a separate calculator screen. An always-visible keypad below it lets
 * users work out a split, a sum of receipts, etc. right in the field instead
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
  const [calc, setCalc] = useState<CalculatorState>(() => ({
    ...CALCULATOR_INITIAL_STATE,
    display: value && Number(value) > 0 ? value : "0",
  }));

  // Adjust state during render (React's recommended alternative to an effect
  // for this) when the external value genuinely diverges from what the
  // calculator holds - the sheet opened with an existing/suggested amount,
  // or reset the field after submit. A normal keystroke already updates both
  // `calc` and `value` together in handleTyped/update, so this condition is
  // false on every render caused by our own typing and never loops.
  const externalValue = Number(value) || 0;
  if (calculatorValue(calc) !== externalValue) {
    setCalc({ ...CALCULATOR_INITIAL_STATE, display: value && externalValue > 0 ? value : "0" });
  }

  function update(next: CalculatorState) {
    setCalc(next);
    onChangeText(String(calculatorValue(next)));
  }

  function handleTyped(text: string) {
    // Only accept what a person typing a number would produce - keeps the
    // field from getting stuck on invalid characters mid-keystroke.
    if (!/^\d*\.?\d*$/.test(text)) return;
    onChangeText(text);
    // Keep the calculator's running state in sync so the next keypad press
    // continues from whatever was typed, instead of a stale prior value.
    setCalc({ ...CALCULATOR_INITIAL_STATE, display: text });
  }

  return (
    <View className={containerClassName}>
      <View className="gap-2 rounded-card border border-neutral-200 p-2.5 dark:border-white/10">
        {label && (
          <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</Text>
        )}
        <TextInput
          keyboardType="decimal-pad"
          value={calc.display}
          onChangeText={handleTyped}
          className={cn(
            "rounded-card bg-neutral-100 px-4 py-3 text-right font-mono text-2xl font-bold tabular-nums text-neutral-900 dark:bg-white/5 dark:text-neutral-100",
            error && "border border-negative"
          )}
        />

        <View className="gap-2">
          {ROWS.map((row, i) => (
            <View key={i} className="flex-row gap-2">
              {row.map((btn) => (
                <CalcButton
                  key={btn.label}
                  label={btn.label}
                  tone={btn.tone}
                  wide={btn.wide}
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
              {row.length < 4 && <View className="flex-1" />}
            </View>
          ))}
        </View>
      </View>
      {error && <Text className="mt-1 text-xs text-negative">{error}</Text>}
    </View>
  );
}
