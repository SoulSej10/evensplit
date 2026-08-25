import {
  computeSplitShares,
  type CreateExpenseInput,
  type Expense,
  type ExpenseShare,
} from "@evensplit/shared";
import { getSupabaseClient } from "@/lib/supabase/client";

export interface ExpenseWithShares extends Expense {
  expense_shares: ExpenseShare[];
}

export async function fetchGroupExpenses(groupId: string): Promise<ExpenseWithShares[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, expense_shares(*)")
    .eq("group_id", groupId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ExpenseWithShares[];
}

export async function createExpense(
  input: CreateExpenseInput,
  createdBy: string
): Promise<Expense> {
  const supabase = getSupabaseClient();
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
  const supabase = getSupabaseClient();
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
    })
    .eq("id", expenseId)
    .select()
    .single();
  if (expenseError) throw expenseError;

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
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) throw error;
}

export async function uploadReceipt(
  groupId: string,
  expenseId: string,
  uri: string,
  fileName: string
): Promise<string> {
  const supabase = getSupabaseClient();
  const path = `${groupId}/${expenseId}/${Date.now()}-${fileName}`;
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const { error } = await supabase.storage.from("receipts").upload(path, arrayBuffer, {
    upsert: true,
    contentType: "image/jpeg",
  });
  if (error) throw error;
  return path;
}

export async function getReceiptSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
