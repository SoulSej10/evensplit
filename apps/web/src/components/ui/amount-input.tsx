"use client";

import { useState } from "react";
import {
  CALCULATOR_INITIAL_STATE,
  calculatorPressBackspace,
  calculatorPressClear,
  calculatorPressDecimal,
  calculatorPressDigit,
  calculatorPressEquals,
  calculatorPressOperator,
  calculatorValue,
  type CalculatorState,
} from "@evensplit/shared";
import { cn } from "@/lib/utils";

type ButtonTone = "digit" | "op" | "muted" | "primary";

const TONE_CLASSES: Record<ButtonTone, string> = {
  digit: "bg-muted/60 hover:bg-muted text-foreground",
  op: "bg-primary-light text-primary hover:opacity-80",
  muted: "bg-transparent text-muted-foreground hover:bg-muted",
  primary: "bg-primary text-primary-foreground hover:opacity-90",
};

function CalcButton({
  label,
  onClick,
  tone = "digit",
}: {
  label: string;
  onClick: () => void;
  tone?: ButtonTone;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 items-center justify-center rounded-md text-sm font-medium tabular-nums transition-colors",
        TONE_CLASSES[tone]
      )}
    >
      {label}
    </button>
  );
}

/**
 * A money-amount input whose own display doubles as both the typable amount
 * field and the calculator's running readout (see packages/shared/calculator.ts
 * for the shared evaluation logic) - one field, not a text input stacked on
 * top of a separate calculator screen. An always-visible keypad below it lets
 * users work out a split, a sum of receipts, etc. right in the field instead
 * of doing the math elsewhere and re-typing the result. Used everywhere an
 * amount/limit is entered - transactions, expenses, settle up, accounts,
 * budgets.
 */
export function AmountInput({
  id,
  value,
  onChange,
  placeholder,
  className,
  ariaInvalid,
}: {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  ariaInvalid?: boolean;
}) {
  const [calc, setCalc] = useState<CalculatorState>(() => ({
    ...CALCULATOR_INITIAL_STATE,
    display: value > 0 ? String(value) : "0",
  }));

  // Adjust state during render (React's recommended alternative to an effect
  // for this) when the external value genuinely diverges from what the
  // calculator holds - the dialog opened with an existing/suggested amount,
  // or reset the field after submit. A normal keystroke already updates both
  // `calc` and `value` together in handleTyped/update, so this condition is
  // false on every render caused by our own typing and never loops.
  if (calculatorValue(calc) !== value) {
    setCalc({ ...CALCULATOR_INITIAL_STATE, display: value > 0 ? String(value) : "0" });
  }

  function update(next: CalculatorState) {
    setCalc(next);
    onChange(calculatorValue(next));
  }

  function handleTyped(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // Only accept what a person typing a number would produce - keeps the
    // field from getting stuck on invalid characters mid-keystroke.
    if (!/^\d*\.?\d*$/.test(raw)) return;
    onChange(Number(raw) || 0);
    // Keep the calculator's running state in sync so the next keypad press
    // continues from whatever was typed, instead of a stale prior value.
    setCalc({ ...CALCULATOR_INITIAL_STATE, display: raw });
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="rounded-lg border border-border bg-card p-2.5">
        <div className="mb-2 flex items-center justify-between rounded-md bg-muted px-3 py-2">
          <input
            id={id}
            type="text"
            inputMode="decimal"
            placeholder={placeholder ?? "0"}
            value={calc.display}
            onChange={handleTyped}
            aria-invalid={ariaInvalid}
            className="w-full truncate bg-transparent font-mono text-lg font-semibold tabular-nums outline-none"
          />
          {calc.pendingOp && <span className="pl-1 text-xs text-muted-foreground">{calc.pendingOp}</span>}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <CalcButton label="C" tone="muted" onClick={() => update(calculatorPressClear())} />
          <CalcButton label="⌫" tone="muted" onClick={() => update(calculatorPressBackspace(calc))} />
          <CalcButton label="÷" tone="op" onClick={() => update(calculatorPressOperator(calc, "÷"))} />
          <CalcButton label="×" tone="op" onClick={() => update(calculatorPressOperator(calc, "×"))} />

          <CalcButton label="7" onClick={() => update(calculatorPressDigit(calc, "7"))} />
          <CalcButton label="8" onClick={() => update(calculatorPressDigit(calc, "8"))} />
          <CalcButton label="9" onClick={() => update(calculatorPressDigit(calc, "9"))} />
          <CalcButton label="−" tone="op" onClick={() => update(calculatorPressOperator(calc, "-"))} />

          <CalcButton label="4" onClick={() => update(calculatorPressDigit(calc, "4"))} />
          <CalcButton label="5" onClick={() => update(calculatorPressDigit(calc, "5"))} />
          <CalcButton label="6" onClick={() => update(calculatorPressDigit(calc, "6"))} />
          <CalcButton label="+" tone="op" onClick={() => update(calculatorPressOperator(calc, "+"))} />

          <CalcButton label="1" onClick={() => update(calculatorPressDigit(calc, "1"))} />
          <CalcButton label="2" onClick={() => update(calculatorPressDigit(calc, "2"))} />
          <CalcButton label="3" onClick={() => update(calculatorPressDigit(calc, "3"))} />
          <CalcButton label="=" tone="primary" onClick={() => update(calculatorPressEquals(calc))} />

          <CalcButton label="0" onClick={() => update(calculatorPressDigit(calc, "0"))} />
          <CalcButton label="." onClick={() => update(calculatorPressDecimal(calc))} />
        </div>
      </div>
    </div>
  );
}
