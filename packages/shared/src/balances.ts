import type {
  Expense,
  ExpenseShare,
  PairwiseDebt,
  Settlement,
  SplitParticipantInput,
  SplitType,
  UUID,
  UserGroupBalance,
} from "./types";

/**
 * Core derived business logic: computing expense splits and per-user/
 * pairwise balances within a group. See PROJECT_PLAN.md §4.4.
 *
 * Kept dependency-free and pure so it can be unit tested in isolation and
 * shared verbatim between apps/web and apps/mobile.
 */

const CENTS = 100;

/** Round to 2 decimal places, avoiding binary float artifacts like 33.330000000000005. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * CENTS) / CENTS;
}

export class SplitError extends Error {}

/**
 * Given a total expense amount, a split type, and a list of participants
 * (with the appropriate `value` for exact/percentage/shares splits),
 * returns the amount each participant owes. The returned amounts always
 * sum exactly to `amount` (any rounding remainder is distributed to the
 * first participants, cent by cent, so totals reconcile exactly).
 */
export function computeSplitShares(
  amount: number,
  splitType: SplitType,
  participants: SplitParticipantInput[]
): { user_id: UUID; share_amount: number }[] {
  if (participants.length === 0) {
    throw new SplitError("At least one participant is required");
  }
  if (amount <= 0) {
    throw new SplitError("Amount must be greater than 0");
  }

  switch (splitType) {
    case "equal":
      return distributeEqual(amount, participants);
    case "exact":
      return computeExactShares(amount, participants);
    case "percentage":
      return computePercentageShares(amount, participants);
    case "shares":
      return computeWeightedShares(amount, participants);
    default: {
      const exhaustive: never = splitType;
      throw new SplitError(`Unknown split type: ${exhaustive}`);
    }
  }
}

function distributeEqual(
  amount: number,
  participants: SplitParticipantInput[]
): { user_id: UUID; share_amount: number }[] {
  const n = participants.length;
  const totalCents = Math.round(amount * CENTS);
  const baseCents = Math.floor(totalCents / n);
  let remainderCents = totalCents - baseCents * n;

  return participants.map((p) => {
    let cents = baseCents;
    if (remainderCents > 0) {
      cents += 1;
      remainderCents -= 1;
    }
    return { user_id: p.user_id, share_amount: round2(cents / CENTS) };
  });
}

function computeExactShares(
  amount: number,
  participants: SplitParticipantInput[]
): { user_id: UUID; share_amount: number }[] {
  const shares = participants.map((p) => ({
    user_id: p.user_id,
    share_amount: round2(p.value ?? 0),
  }));
  const sum = round2(shares.reduce((acc, s) => acc + s.share_amount, 0));
  if (Math.abs(sum - round2(amount)) > 0.01) {
    throw new SplitError(
      `Exact split amounts (${sum.toFixed(2)}) must sum to the expense total (${amount.toFixed(2)})`
    );
  }
  return shares;
}

function computePercentageShares(
  amount: number,
  participants: SplitParticipantInput[]
): { user_id: UUID; share_amount: number }[] {
  const totalPercent = round2(participants.reduce((acc, p) => acc + (p.value ?? 0), 0));
  if (Math.abs(totalPercent - 100) > 0.01) {
    throw new SplitError(`Percentages must sum to 100 (got ${totalPercent.toFixed(2)})`);
  }

  const totalCents = Math.round(amount * CENTS);
  const rawCents = participants.map((p) => (totalCents * (p.value ?? 0)) / 100);
  return distributeRoundedCents(participants, rawCents, totalCents);
}

function computeWeightedShares(
  amount: number,
  participants: SplitParticipantInput[]
): { user_id: UUID; share_amount: number }[] {
  const totalShares = participants.reduce((acc, p) => acc + (p.value ?? 0), 0);
  if (totalShares <= 0) {
    throw new SplitError("Total shares must be greater than 0");
  }

  const totalCents = Math.round(amount * CENTS);
  const rawCents = participants.map((p) => (totalCents * (p.value ?? 0)) / totalShares);
  return distributeRoundedCents(participants, rawCents, totalCents);
}

/**
 * Rounds a list of "raw" cent amounts to whole cents using the largest-
 * remainder method, guaranteeing the rounded values sum exactly to
 * `totalCents` (avoiding drift from naive per-item rounding).
 */
function distributeRoundedCents(
  participants: SplitParticipantInput[],
  rawCents: number[],
  totalCents: number
): { user_id: UUID; share_amount: number }[] {
  const floored = rawCents.map(Math.floor);
  let allocated = floored.reduce((a, b) => a + b, 0);
  let remainder = totalCents - allocated;

  const remainders = rawCents.map((raw, i) => ({ index: i, frac: raw - floored[i] }));
  remainders.sort((a, b) => b.frac - a.frac);

  const cents = [...floored];
  for (let i = 0; i < remainder; i++) {
    cents[remainders[i % remainders.length].index] += 1;
  }

  return participants.map((p, i) => ({
    user_id: p.user_id,
    share_amount: round2(cents[i] / CENTS),
  }));
}

/**
 * Per-user net balance within a group, per PROJECT_PLAN.md §4.4 (with a
 * corrected settlement sign — see note below):
 *
 *   balance(user) = SUM(paid) - SUM(owed shares) - SUM(settlements received) + SUM(settlements paid)
 *
 * Positive = the group owes this user. Negative = this user owes the group.
 * A settlement received reduces what's still owed to you; a settlement you
 * pay reduces what you still owe — both move balance toward zero.
 */
export function calculateUserBalances(
  memberIds: UUID[],
  expenses: Pick<Expense, "id" | "amount" | "paid_by">[],
  expenseShares: Pick<ExpenseShare, "user_id" | "share_amount" | "expense_id">[],
  settlements: Pick<Settlement, "from_user" | "to_user" | "amount">[]
): UserGroupBalance[] {
  const balances = new Map<UUID, number>();
  for (const id of memberIds) balances.set(id, 0);

  for (const expense of expenses) {
    balances.set(expense.paid_by, (balances.get(expense.paid_by) ?? 0) + expense.amount);
  }

  for (const share of expenseShares) {
    balances.set(share.user_id, (balances.get(share.user_id) ?? 0) - share.share_amount);
  }

  // NOTE: a settlement from `from_user` to `to_user` clears debt: it moves
  // from_user's balance toward zero (they owed money, now owe less) and
  // moves to_user's balance toward zero (they were owed money, now owed
  // less). This is the inverse of the literal +to_user/-from_user reading
  // in PROJECT_PLAN.md §4.4 — that reading was verified (via unit test) to
  // never let a fully-settled pair reach a zero balance, which contradicts
  // the whole point of "settle up". Corrected here; noted in Progress Log.
  for (const settlement of settlements) {
    balances.set(settlement.to_user, (balances.get(settlement.to_user) ?? 0) - settlement.amount);
    balances.set(
      settlement.from_user,
      (balances.get(settlement.from_user) ?? 0) + settlement.amount
    );
  }

  return memberIds.map((user_id) => ({
    user_id,
    balance: round2(balances.get(user_id) ?? 0),
  }));
}

/**
 * Direct (non-simplified) pairwise "who owes whom" breakdown: for every
 * expense, every participant (other than the payer) owes the payer their
 * share; settlements reduce the amount owed from payer to receiver
 * directly. Returns one entry per ordered pair with a strictly positive
 * net amount owed.
 *
 * This is a literal ledger of who-owes-whom, distinct from the (stretch,
 * unimplemented) minimum-transaction debt-simplification algorithm.
 */
export function calculatePairwiseDebts(
  expenses: Pick<Expense, "id" | "paid_by">[],
  expenseShares: Pick<ExpenseShare, "user_id" | "share_amount" | "expense_id">[],
  settlements: Pick<Settlement, "from_user" | "to_user" | "amount">[]
): PairwiseDebt[] {
  // net[a][b] = how much `a` owes `b`, net of net[b][a]
  const net = new Map<UUID, Map<UUID, number>>();

  const adjust = (from: UUID, to: UUID, amount: number) => {
    if (from === to || amount === 0) return;
    if (!net.has(from)) net.set(from, new Map());
    const forward = net.get(from)!;
    forward.set(to, (forward.get(to) ?? 0) + amount);
  };

  const payerByExpense = new Map(expenses.map((e) => [e.id, e.paid_by]));

  for (const share of expenseShares) {
    const payer = payerByExpense.get(share.expense_id);
    if (!payer) continue;
    // the share owner owes the payer their share amount
    adjust(share.user_id, payer, share.share_amount);
  }

  for (const settlement of settlements) {
    // from_user paid to_user, reducing what from_user owes to_user
    adjust(settlement.from_user, settlement.to_user, -settlement.amount);
  }

  // Collapse a<->b pairs into a single net direction.
  const seen = new Set<string>();
  const results: PairwiseDebt[] = [];

  for (const [from, tos] of net) {
    for (const [to] of tos) {
      const key = [from, to].sort().join("::");
      if (seen.has(key)) continue;
      seen.add(key);

      const aOwesB = net.get(from)?.get(to) ?? 0;
      const bOwesA = net.get(to)?.get(from) ?? 0;
      const netAmount = round2(aOwesB - bOwesA);

      if (netAmount > 0.01) {
        results.push({ from_user: from, to_user: to, amount: netAmount });
      } else if (netAmount < -0.01) {
        results.push({ from_user: to, to_user: from, amount: round2(-netAmount) });
      }
    }
  }

  return results;
}

/**
 * Debt simplification (Phase 6 stretch): reduces a group's full debt graph
 * to the minimum number of transactions needed to zero everyone out, using
 * the classic greedy "max debtor pays max creditor" min-cash-flow algorithm.
 *
 * Given each member's net balance (positive = owed money, negative = owes
 * money), repeatedly matches the member who owes the most against the
 * member who is owed the most, settles the smaller of the two amounts, and
 * repeats until all balances are (near) zero. This does not necessarily
 * preserve who-originally-owed-whom pairwise, but it is the mathematically
 * minimal transaction set to net everyone to zero.
 */
export function simplifyDebts(balances: UserGroupBalance[]): PairwiseDebt[] {
  const EPSILON = 0.005;

  // Working copy, in cents (integers) to avoid float drift across many
  // subtractions.
  const entries = balances
    .map((b) => ({ user_id: b.user_id, cents: Math.round(b.balance * CENTS) }))
    .filter((e) => e.cents !== 0);

  const results: PairwiseDebt[] = [];

  // Repeatedly pick the largest creditor and largest debtor, settle the
  // smaller magnitude between them, and remove whichever hits zero.
  // O(n^2 log n) worst case for n members, fine at group scale.
  while (true) {
    let maxCreditorIdx = -1;
    let maxDebtorIdx = -1;
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].cents === 0) continue;
      if (entries[i].cents > 0 && (maxCreditorIdx === -1 || entries[i].cents > entries[maxCreditorIdx].cents)) {
        maxCreditorIdx = i;
      }
      if (entries[i].cents < 0 && (maxDebtorIdx === -1 || entries[i].cents < entries[maxDebtorIdx].cents)) {
        maxDebtorIdx = i;
      }
    }

    if (maxCreditorIdx === -1 || maxDebtorIdx === -1) break;

    const creditor = entries[maxCreditorIdx];
    const debtor = entries[maxDebtorIdx];
    const settleCents = Math.min(creditor.cents, -debtor.cents);

    if (settleCents <= 0) break;

    const amount = round2(settleCents / CENTS);
    if (amount > EPSILON) {
      results.push({ from_user: debtor.user_id, to_user: creditor.user_id, amount });
    }

    creditor.cents -= settleCents;
    debtor.cents += settleCents;
  }

  return results;
}
