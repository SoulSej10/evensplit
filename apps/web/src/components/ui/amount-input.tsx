"use client";

import { useState } from "react";
import { Calculator as CalculatorIcon } from "@phosphor-icons/react";
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
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
        "flex h-9 items-center justify-center rounded-md text-sm font-medium tabular-nums transition-colors",
        TONE_CLASSES[tone]
      )}
    >
      {label}
    </button>
  );
}

/**
 * A money-amount input with a small embedded calculator (see
 * packages/shared/calculator.ts for the shared evaluation logic) so users
 * can work out a split, a sum of receipts, etc. right in the field instead
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
  const [open, setOpen] = useState(false);
  const [calc, setCalc] = useState<CalculatorState>(CALCULATOR_INITIAL_STATE);

  function update(next: CalculatorState) {
    setCalc(next);
    onChange(calculatorValue(next));
  }

  function openCalculator() {
    // Seed the calculator with whatever's already in the field, so it's a
    // continuation of the typed value rather than discarding it.
    setCalc({ ...CALCULATOR_INITIAL_STATE, display: value > 0 ? String(value) : "0" });
    setOpen(true);
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        type="number"
        step="0.01"
        inputMode="decimal"
        placeholder={placeholder}
        value={Number.isNaN(value) || value === 0 ? "" : value}
        onChange={(e) => onChange(e.target.valueAsNumber || 0)}
        className="pr-9"
        aria-invalid={ariaInvalid}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={openCalculator}
            aria-label="Open calculator"
            className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <CalculatorIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-60 p-2.5">
          <div className="mb-2 flex items-center justify-between rounded-md bg-muted px-3 py-2">
            <span className="truncate font-mono text-lg font-semibold tabular-nums">{calc.display}</span>
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
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full rounded-md border border-border py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Done
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
