import { describe, expect, it } from "vitest";
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
} from "../calculator";

function digits(state: CalculatorState, s: string): CalculatorState {
  for (const ch of s) state = calculatorPressDigit(state, ch);
  return state;
}

describe("calculator", () => {
  it("enters and reads back a plain number", () => {
    const state = digits(CALCULATOR_INITIAL_STATE, "1250");
    expect(state.display).toBe("1250");
    expect(calculatorValue(state)).toBe(1250);
  });

  it("does not let a leading zero linger", () => {
    let state = calculatorPressDigit(CALCULATOR_INITIAL_STATE, "0");
    state = calculatorPressDigit(state, "5");
    expect(state.display).toBe("5");
  });

  it("supports one decimal point only", () => {
    let state = digits(CALCULATOR_INITIAL_STATE, "12");
    state = calculatorPressDecimal(state);
    state = digits(state, "5");
    state = calculatorPressDecimal(state); // second one is a no-op
    state = calculatorPressDigit(state, "9");
    expect(state.display).toBe("12.59");
  });

  it("adds two numbers", () => {
    let state = digits(CALCULATOR_INITIAL_STATE, "12");
    state = calculatorPressOperator(state, "+");
    state = digits(state, "8");
    state = calculatorPressEquals(state);
    expect(calculatorValue(state)).toBe(20);
  });

  it("chains operators left-to-right without precedence", () => {
    // 10 + 5 * 2 -> a basic calculator resolves 15 first, then * 2 = 30
    let state = digits(CALCULATOR_INITIAL_STATE, "10");
    state = calculatorPressOperator(state, "+");
    state = digits(state, "5");
    state = calculatorPressOperator(state, "×");
    state = digits(state, "2");
    state = calculatorPressEquals(state);
    expect(calculatorValue(state)).toBe(30);
  });

  it("swaps a pending operator if pressed again before a new number", () => {
    let state = digits(CALCULATOR_INITIAL_STATE, "10");
    state = calculatorPressOperator(state, "+");
    state = calculatorPressOperator(state, "-");
    state = digits(state, "4");
    state = calculatorPressEquals(state);
    expect(calculatorValue(state)).toBe(6);
  });

  it("divides and avoids floating-point artifacts", () => {
    let state = digits(CALCULATOR_INITIAL_STATE, "1");
    state = calculatorPressOperator(state, "-");
    state = digits(state, "0");
    state = calculatorPressDecimal(state);
    state = digits(state, "9");
    state = calculatorPressEquals(state);
    expect(calculatorValue(state)).toBe(0.1);
  });

  it("reports Error on divide by zero and recovers on the next digit", () => {
    let state = digits(CALCULATOR_INITIAL_STATE, "5");
    state = calculatorPressOperator(state, "÷");
    state = calculatorPressDigit(state, "0");
    state = calculatorPressEquals(state);
    expect(state.display).toBe("Error");
    expect(calculatorValue(state)).toBe(0);

    state = calculatorPressDigit(state, "7");
    expect(state.display).toBe("7");
  });

  it("backspace removes the last character but not below empty", () => {
    let state = digits(CALCULATOR_INITIAL_STATE, "42");
    state = calculatorPressBackspace(state);
    expect(state.display).toBe("4");
    state = calculatorPressBackspace(state);
    expect(state.display).toBe("0");
    state = calculatorPressBackspace(state);
    expect(state.display).toBe("0");
  });

  it("clear resets to the initial state", () => {
    let state = digits(CALCULATOR_INITIAL_STATE, "999");
    state = calculatorPressClear();
    expect(state).toEqual(CALCULATOR_INITIAL_STATE);
  });
});
