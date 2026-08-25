import type { SettleUpInput, Settlement } from "@evensplit/shared";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function fetchGroupSettlements(groupId: string): Promise<Settlement[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("settlements")
    .select("*")
    .eq("group_id", groupId)
    .order("settled_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Settlement[];
}

export async function recordSettlement(input: SettleUpInput): Promise<Settlement> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("settlements")
    .insert({
      group_id: input.group_id,
      from_user: input.from_user,
      to_user: input.to_user,
      amount: input.amount,
      method: input.method ?? null,
      note: input.note ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Settlement;
}
