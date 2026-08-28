import {
  computeSplitShares,
  type CreateExpenseInput,
  type Expense,
  type ExpenseShare,
} from "@evensplit/shared";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ExpenseWithShares extends Expense {
  expense_shares: ExpenseShare[];
}

export async function fetchGroupExpenses(groupId: string): Promise<ExpenseWithShares[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, expense_shares(*)")
    .eq("group_id", groupId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ExpenseWithShares[];
}

/** Expenses across every group a user belongs to — powers the top-level Insights page. */
export async function fetchExpensesForGroups(groupIds: string[]): Promise<ExpenseWithShares[]> {
  if (groupIds.length === 0) return [];
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, expense_shares(*)")
    .in("group_id", groupIds)
    .order("expense_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ExpenseWithShares[];
}

export async function fetchExpense(expenseId: string): Promise<ExpenseWithShares> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, expense_shares(*)")
    .eq("id", expenseId)
    .single();
  if (error) throw error;
  return data as ExpenseWithShares;
}

/**
 * Creates an expense and its per-participant shares via the
 * create_group_expense RPC, atomically (fixing the previous two-separate-
 * inserts pattern). Shares are still computed client-side via the shared
 * balance logic so web and mobile always agree on split math — the RPC just
 * persists them. If `paid_from_account_id` is set (only meaningful when the
 * current user is the payer), the RPC also mirrors the cash movement into
 * personal_transactions: the payer's own share as real spending, and any
 * amount advanced for others as a receivable — see supabase/migrations/0015.
 */
export async function createExpense(
  input: CreateExpenseInput,
  createdBy: string,
  paidFromAccountId?: string | null
): Promise<Expense> {
  const supabase = getSupabaseBrowserClient();

  const shares = computeSplitShares(input.amount, input.split_type, input.participants);

  const { data: expenseId, error } = await supabase.rpc("create_group_expense", {
    p_group_id: input.group_id,
    p_description: input.description,
    p_amount: input.amount,
    p_currency: input.currency,
    p_paid_by: input.paid_by,
    p_split_type: input.split_type,
    p_category: input.category ?? null,
    p_expense_date: input.expense_date,
    p_receipt_url: input.receipt_url ?? null,
    p_is_recurring: input.is_recurring ?? false,
    p_recurrence_rule: input.is_recurring ? input.recurrence_rule ?? null : null,
    p_shares: shares,
    p_paid_from_account_id: paidFromAccountId ?? null,
  });
  if (error) throw error;

  return fetchExpense(expenseId as string);
}

export async function updateExpense(
  expenseId: string,
  input: CreateExpenseInput,
  paidFromAccountId?: string | null
): Promise<Expense> {
  const supabase = getSupabaseBrowserClient();
  const shares = computeSplitShares(input.amount, input.split_type, input.participants);

  const { error } = await supabase.rpc("update_group_expense", {
    p_expense_id: expenseId,
    p_description: input.description,
    p_amount: input.amount,
    p_currency: input.currency,
    p_paid_by: input.paid_by,
    p_split_type: input.split_type,
    p_category: input.category ?? null,
    p_expense_date: input.expense_date,
    p_receipt_url: input.receipt_url ?? null,
    p_shares: shares,
    p_paid_from_account_id: paidFromAccountId ?? null,
  });
  if (error) throw error;

  return fetchExpense(expenseId);
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) throw error;
}

/**
 * Uploads a receipt to the private `receipts` bucket and returns the
 * storage *path* (not a public URL — the bucket is private, scoped by RLS
 * to group members). Persist this path as `expenses.receipt_url`; resolve
 * it to a viewable URL on demand via {@link getReceiptSignedUrl}.
 */
export async function uploadReceipt(
  groupId: string,
  expenseId: string,
  file: File
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const path = `${groupId}/${expenseId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("receipts").upload(path, file, {
    upsert: true,
  });
  if (error) throw error;
  return path;
}

/** Resolves a stored receipt path to a time-limited signed URL for display. */
export async function getReceiptSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
