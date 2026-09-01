export type CalculatorOperator = "+" | "-" | "×" | "÷";

export interface CalculatorState {
  /** What the screen currently shows - either the number being entered or the last result. */
  display: string;
  /** The value carried over from the previous operand, once an operator has been pressed. */
  accumulator: number | null;
  /** The operator waiting to be applied once the next value is confirmed (by another operator or "="). */
  pendingOp: CalculatorOperator | null;
  /** True right after an operator/equals/clear - the next digit press starts a fresh number instead of appending. */
  overwrite: boolean;
}

export const CALCULATOR_INITIAL_STATE: CalculatorState = {
  display: "0",
  accumulator: null,
  pendingOp: null,
  overwrite: true,
};

const MAX_DIGITS = 15;

function applyOp(a: number, b: number, op: CalculatorOperator): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
  }
}

/** Rounds away floating-point artifacts (0.1 + 0.2) without truncating genuine precision. */
function formatResult(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  const rounded = Math.round(n * 1e8) / 1e8;
  return String(rounded);
}

/**
 * A basic (non-order-of-operations) calculator, the kind found on a
 * physical calculator: each operator immediately resolves the pending
 * operation against the previous result, left to right, rather than
 * respecting operator precedence. Shared between web and mobile so both
 * platforms' embedded calculators behave identically; each platform only
 * owns the button grid and how the resulting value gets committed back
 * into its amount field.
 */
export function calculatorPressDigit(state: CalculatorState, digit: string): CalculatorState {
  if (state.display === "Error") state = CALCULATOR_INITIAL_STATE;
  if (state.overwrite) return { ...state, display: digit === "0" ? "0" : digit, overwrite: false };
  if (state.display === "0") return { ...state, display: digit };
  if (state.display.replace(/[-.]/g, "").length >= MAX_DIGITS) return state;
  return { ...state, display: state.display + digit };
}

export function calculatorPressDecimal(state: CalculatorState): CalculatorState {
  if (state.display === "Error") state = CALCULATOR_INITIAL_STATE;
  if (state.overwrite) return { ...state, display: "0.", overwrite: false };
  if (state.display.includes(".")) return state;
  return { ...state, display: state.display + "." };
}

export function calculatorPressOperator(state: CalculatorState, op: CalculatorOperator): CalculatorState {
  if (state.display === "Error") return state;
  const current = parseFloat(state.display);

  if (state.accumulator === null) {
    return { display: state.display, accumulator: current, pendingOp: op, overwrite: true };
  }
  if (!state.overwrite) {
    const result = applyOp(state.accumulator, current, state.pendingOp!);
    return { display: formatResult(result), accumulator: result, pendingOp: op, overwrite: true };
  }
  // Operator pressed again before entering a new number - just swap it.
  return { ...state, pendingOp: op };
}

export function calculatorPressEquals(state: CalculatorState): CalculatorState {
  if (state.display === "Error" || state.accumulator === null || state.pendingOp === null) return state;
  const current = parseFloat(state.display);
  const result = applyOp(state.accumulator, current, state.pendingOp);
  return { display: formatResult(result), accumulator: null, pendingOp: null, overwrite: true };
}

export function calculatorPressClear(): CalculatorState {
  return CALCULATOR_INITIAL_STATE;
}

export function calculatorPressBackspace(state: CalculatorState): CalculatorState {
  if (state.overwrite || state.display === "Error") return state;
  if (state.display.length <= 1 || (state.display.startsWith("-") && state.display.length === 2)) {
    return { ...state, display: "0", overwrite: true };
  }
  return { ...state, display: state.display.slice(0, -1) };
}

/** The numeric value the display currently represents, for committing back into a form field. */
export function calculatorValue(state: CalculatorState): number {
  const n = parseFloat(state.display);
  return Number.isFinite(n) ? n : 0;
}
