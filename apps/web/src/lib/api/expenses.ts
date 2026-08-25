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
 * Creates an expense and its per-participant shares in one transaction-ish
 * call (two inserts; Postgres RLS scopes both by group membership). Shares
 * are computed client-side via the shared balance logic so web and mobile
 * always agree on split math, then written verbatim to `expense_shares`.
 */
export async function createExpense(input: CreateExpenseInput, createdBy: string): Promise<Expense> {
  const supabase = getSupabaseBrowserClient();

  const shares = computeSplitShares(input.amount, input.split_type, input.participants);

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      group_id: input.group_id,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      paid_by: input.paid_by,
      split_type: input.split_type,
      category: input.category ?? null,
      expense_date: input.expense_date,
      receipt_url: input.receipt_url ?? null,
      created_by: createdBy,
      is_recurring: input.is_recurring ?? false,
      recurrence_rule: input.is_recurring ? input.recurrence_rule ?? null : null,
    })
    .select()
    .single();
  if (expenseError) throw expenseError;

  const { error: sharesError } = await supabase.from("expense_shares").insert(
    shares.map((s) => ({
      expense_id: expense.id,
      user_id: s.user_id,
      share_amount: s.share_amount,
    }))
  );
  if (sharesError) throw sharesError;

  return expense as Expense;
}

export async function updateExpense(
  expenseId: string,
  input: CreateExpenseInput
): Promise<Expense> {
  const supabase = getSupabaseBrowserClient();
  const shares = computeSplitShares(input.amount, input.split_type, input.participants);

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .update({
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      paid_by: input.paid_by,
      split_type: input.split_type,
      category: input.category ?? null,
      expense_date: input.expense_date,
      receipt_url: input.receipt_url ?? null,
      is_recurring: input.is_recurring ?? false,
      recurrence_rule: input.is_recurring ? input.recurrence_rule ?? null : null,
    })
    .eq("id", expenseId)
    .select()
    .single();
  if (expenseError) throw expenseError;

  // Replace shares wholesale — simplest way to guarantee they stay in sync
  // with the (possibly changed) split type/participants/amount.
  const { error: deleteError } = await supabase
    .from("expense_shares")
    .delete()
    .eq("expense_id", expenseId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase.from("expense_shares").insert(
    shares.map((s) => ({
      expense_id: expenseId,
      user_id: s.user_id,
      share_amount: s.share_amount,
    }))
  );
  if (insertError) throw insertError;

  return expense as Expense;
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
