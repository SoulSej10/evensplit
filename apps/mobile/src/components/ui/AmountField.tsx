import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Calculator as CalculatorIcon } from "phosphor-react-native";
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
import { BottomSheet } from "@/components/ui/BottomSheet";
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
 * A money-amount field with a small embedded calculator (see
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
  const [visible, setVisible] = useState(false);
  const [calc, setCalc] = useState<CalculatorState>(CALCULATOR_INITIAL_STATE);

  function openCalculator() {
    const seed = value && Number(value) > 0 ? value : "0";
    setCalc({ ...CALCULATOR_INITIAL_STATE, display: seed });
    setVisible(true);
  }

  function update(next: CalculatorState) {
    setCalc(next);
    onChangeText(String(calculatorValue(next)));
  }

  return (
    <View className={containerClassName}>
      <View className="relative">
        <TextField
          label={label}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={onChangeText}
          error={error}
          className="pr-11"
        />
        <Pressable
          onPress={openCalculator}
          hitSlop={8}
          className={cn("absolute right-2 h-8 w-8 items-center justify-center rounded-lg active:opacity-70", label ? "top-9" : "top-2")}
          accessibilityLabel="Open calculator"
        >
          <CalculatorIcon size={18} color="#6B7169" />
        </Pressable>
      </View>

      <BottomSheet visible={visible} onClose={() => setVisible(false)} title="Calculator">
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
      </BottomSheet>
    </View>
  );
}
