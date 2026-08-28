import type { ConfirmSettlementReceiptInput, SettleUpInput, Settlement } from "@evensplit/shared";
import { getSupabaseClient } from "@/lib/supabase/client";

export async function fetchGroupSettlements(groupId: string): Promise<Settlement[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("settlements")
    .select("*")
    .eq("group_id", groupId)
    .order("settled_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Settlement[];
}

/** Settlements across every group a user belongs to — powers Home's shared-balances summary. */
export async function fetchSettlementsForGroups(groupIds: string[]): Promise<Settlement[]> {
  if (groupIds.length === 0) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("settlements")
    .select("*")
    .in("group_id", groupIds)
    .order("settled_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Settlement[];
}

/**
 * Records a settlement via the record_settlement RPC. If `from_account_id`
 * is set (only meaningful when the current user is from_user, the payer),
 * the RPC also mirrors the debtor's outflow into personal_transactions as
 * real personal spending — see supabase/migrations/0015. The receiving
 * side is deliberately not created here; see confirmSettlementReceipt.
 */
export async function recordSettlement(input: SettleUpInput): Promise<Settlement> {
  const supabase = getSupabaseClient();
  const { data: settlementId, error } = await supabase.rpc("record_settlement", {
    p_group_id: input.group_id,
    p_from_user: input.from_user,
    p_to_user: input.to_user,
    p_amount: input.amount,
    p_method: input.method ?? null,
    p_note: input.note ?? null,
    p_from_account_id: input.from_account_id ?? null,
  });
  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("settlements")
    .select("*")
    .eq("id", settlementId)
    .single();
  if (fetchError) throw fetchError;
  return data as Settlement;
}

/**
 * Lets the receiving party attribute an already-recorded settlement's
 * inbound cash to one of their own accounts, inserting a
 * group_reimbursement personal_transactions row (never "income").
 */
export async function confirmSettlementReceipt(input: ConfirmSettlementReceiptInput): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("confirm_settlement_receipt", {
    p_settlement_id: input.settlement_id,
    p_to_account_id: input.to_account_id,
  });
  if (error) throw error;
}
