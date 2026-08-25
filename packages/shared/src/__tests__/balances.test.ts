import { describe, expect, it } from "vitest";
import {
  SplitError,
  calculatePairwiseDebts,
  calculateUserBalances,
  computeSplitShares,
} from "../balances";

const ALICE = "11111111-1111-1111-1111-111111111111";
const BOB = "22222222-2222-2222-2222-222222222222";
const CARL = "33333333-3333-3333-3333-333333333333";

describe("computeSplitShares - equal", () => {
  it("splits evenly across participants", () => {
    const shares = computeSplitShares(90, "equal", [
      { user_id: ALICE },
      { user_id: BOB },
      { user_id: CARL },
    ]);
    expect(shares).toEqual([
      { user_id: ALICE, share_amount: 30 },
      { user_id: BOB, share_amount: 30 },
      { user_id: CARL, share_amount: 30 },
    ]);
  });

  it("distributes rounding remainder cent-by-cent so shares sum exactly", () => {
    const shares = computeSplitShares(10, "equal", [
      { user_id: ALICE },
      { user_id: BOB },
      { user_id: CARL },
    ]);
    const sum = shares.reduce((a, s) => a + s.share_amount, 0);
    expect(Math.round(sum * 100) / 100).toBe(10);
    // 10 / 3 = 3.33, 3.33, 3.34 (first participant absorbs remainder)
    expect(shares.map((s) => s.share_amount).sort()).toEqual([3.33, 3.33, 3.34]);
  });
});

describe("computeSplitShares - exact", () => {
  it("accepts exact amounts that sum to the total", () => {
    const shares = computeSplitShares(100, "exact", [
      { user_id: ALICE, value: 60 },
      { user_id: BOB, value: 40 },
    ]);
    expect(shares).toEqual([
      { user_id: ALICE, share_amount: 60 },
      { user_id: BOB, share_amount: 40 },
    ]);
  });

  it("throws when exact amounts do not sum to the total", () => {
    expect(() =>
      computeSplitShares(100, "exact", [
        { user_id: ALICE, value: 60 },
        { user_id: BOB, value: 30 },
      ])
    ).toThrow(SplitError);
  });
});

describe("computeSplitShares - percentage", () => {
  it("splits by percentage and sums exactly to the total", () => {
    const shares = computeSplitShares(100, "percentage", [
      { user_id: ALICE, value: 50 },
      { user_id: BOB, value: 30 },
      { user_id: CARL, value: 20 },
    ]);
    expect(shares).toEqual([
      { user_id: ALICE, share_amount: 50 },
      { user_id: BOB, share_amount: 30 },
      { user_id: CARL, share_amount: 20 },
    ]);
  });

  it("handles non-round percentage splits without losing cents", () => {
    const shares = computeSplitShares(10, "percentage", [
      { user_id: ALICE, value: 33.33 },
      { user_id: BOB, value: 33.33 },
      { user_id: CARL, value: 33.34 },
    ]);
    const sum = shares.reduce((a, s) => a + s.share_amount, 0);
    expect(Math.round(sum * 100) / 100).toBe(10);
  });

  it("throws when percentages do not sum to 100", () => {
    expect(() =>
      computeSplitShares(100, "percentage", [
        { user_id: ALICE, value: 50 },
        { user_id: BOB, value: 30 },
      ])
    ).toThrow(SplitError);
  });
});

describe("computeSplitShares - shares (weighted)", () => {
  it("splits proportionally to weights", () => {
    const shares = computeSplitShares(120, "shares", [
      { user_id: ALICE, value: 1 },
      { user_id: BOB, value: 2 },
      { user_id: CARL, value: 3 },
    ]);
    expect(shares).toEqual([
      { user_id: ALICE, share_amount: 20 },
      { user_id: BOB, share_amount: 40 },
      { user_id: CARL, share_amount: 60 },
    ]);
  });

  it("throws when total shares are zero", () => {
    expect(() =>
      computeSplitShares(100, "shares", [
        { user_id: ALICE, value: 0 },
        { user_id: BOB, value: 0 },
      ])
    ).toThrow(SplitError);
  });
});

describe("calculateUserBalances", () => {
  it("computes net balance per §4.4 formula: paid - owed + received - sent", () => {
    // Alice pays 90 for a meal split equally 3 ways (30 each).
    const expenses = [{ id: "e1", amount: 90, paid_by: ALICE }];
    const expenseShares = [
      { expense_id: "e1", user_id: ALICE, share_amount: 30 },
      { expense_id: "e1", user_id: BOB, share_amount: 30 },
      { expense_id: "e1", user_id: CARL, share_amount: 30 },
    ];
    const settlements: never[] = [];

    const balances = calculateUserBalances(
      [ALICE, BOB, CARL],
      expenses,
      expenseShares,
      settlements
    );

    expect(balances).toEqual(
      expect.arrayContaining([
        { user_id: ALICE, balance: 60 }, // paid 90, owes 30
        { user_id: BOB, balance: -30 },
        { user_id: CARL, balance: -30 },
      ])
    );
  });

  it("reflects settlements reducing/zeroing balances", () => {
    const expenses = [{ id: "e1", amount: 90, paid_by: ALICE }];
    const expenseShares = [
      { expense_id: "e1", user_id: ALICE, share_amount: 30 },
      { expense_id: "e1", user_id: BOB, share_amount: 30 },
      { expense_id: "e1", user_id: CARL, share_amount: 30 },
    ];
    // Bob and Carl each settle up their 30 with Alice.
    const settlements = [
      { from_user: BOB, to_user: ALICE, amount: 30 },
      { from_user: CARL, to_user: ALICE, amount: 30 },
    ];

    const balances = calculateUserBalances(
      [ALICE, BOB, CARL],
      expenses,
      expenseShares,
      settlements
    );

    expect(balances).toEqual(
      expect.arrayContaining([
        { user_id: ALICE, balance: 0 },
        { user_id: BOB, balance: 0 },
        { user_id: CARL, balance: 0 },
      ])
    );
  });

  it("returns zero balance for a member with no expenses or settlements", () => {
    const balances = calculateUserBalances([ALICE], [], [], []);
    expect(balances).toEqual([{ user_id: ALICE, balance: 0 }]);
  });
});

describe("calculatePairwiseDebts", () => {
  it("derives who-owes-whom directly from shares", () => {
    const expenses = [{ id: "e1", paid_by: ALICE }];
    const expenseShares = [
      { expense_id: "e1", user_id: ALICE, share_amount: 30 },
      { expense_id: "e1", user_id: BOB, share_amount: 30 },
      { expense_id: "e1", user_id: CARL, share_amount: 30 },
    ];

    const debts = calculatePairwiseDebts(expenses, expenseShares, []);

    expect(debts).toEqual(
      expect.arrayContaining([
        { from_user: BOB, to_user: ALICE, amount: 30 },
        { from_user: CARL, to_user: ALICE, amount: 30 },
      ])
    );
    expect(debts).toHaveLength(2);
  });

  it("nets out a settlement against the corresponding debt", () => {
    const expenses = [{ id: "e1", paid_by: ALICE }];
    const expenseShares = [
      { expense_id: "e1", user_id: ALICE, share_amount: 30 },
      { expense_id: "e1", user_id: BOB, share_amount: 30 },
    ];
    const settlements = [{ from_user: BOB, to_user: ALICE, amount: 30 }];

    const debts = calculatePairwiseDebts(expenses, expenseShares, settlements);
    expect(debts).toEqual([]);
  });

  it("nets debts in both directions between the same pair into one entry", () => {
    // Alice pays 100 split evenly with Bob (Bob owes Alice 50).
    // Bob pays 20 split evenly with Alice (Alice owes Bob 10).
    // Net: Bob owes Alice 40.
    const expenses = [
      { id: "e1", paid_by: ALICE },
      { id: "e2", paid_by: BOB },
    ];
    const expenseShares = [
      { expense_id: "e1", user_id: ALICE, share_amount: 50 },
      { expense_id: "e1", user_id: BOB, share_amount: 50 },
      { expense_id: "e2", user_id: ALICE, share_amount: 10 },
      { expense_id: "e2", user_id: BOB, share_amount: 10 },
    ];

    const debts = calculatePairwiseDebts(expenses, expenseShares, []);
    expect(debts).toEqual([{ from_user: BOB, to_user: ALICE, amount: 40 }]);
  });

  it("omits pairs that are fully settled or never owed anything", () => {
    const debts = calculatePairwiseDebts([], [], []);
    expect(debts).toEqual([]);
  });
});
