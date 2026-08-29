import { useQuery } from "@tanstack/react-query";
import { calculateUserBalances, type UUID } from "@evensplit/shared";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * This user's net balance within one group, fetched directly (not via the
 * full group-detail hooks) so list/table rows across the app - the Groups
 * table, the Dashboard preview cards - can show a balance without loading
 * every expense/share/settlement for every group up front.
 */
export function useGroupNetBalance(groupId: UUID, memberIds: UUID[], userId: UUID | undefined) {
  return useQuery({
    queryKey: ["group-card-balance", groupId, userId],
    enabled: !!userId,
    queryFn: async () => {
      const supabase = getSupabaseBrowserClient();
      const [{ data: expenses }, { data: shares }, { data: settlements }] = await Promise.all([
        supabase.from("expenses").select("id, amount, paid_by").eq("group_id", groupId),
        supabase
          .from("expense_shares")
          .select("expense_id, user_id, share_amount, expenses!inner(group_id)")
          .eq("expenses.group_id", groupId),
        supabase.from("settlements").select("from_user, to_user, amount").eq("group_id", groupId),
      ]);
      const balances = calculateUserBalances(memberIds, expenses ?? [], shares ?? [], settlements ?? []);
      return balances.find((b) => b.user_id === userId)?.balance ?? 0;
    },
  });
}
