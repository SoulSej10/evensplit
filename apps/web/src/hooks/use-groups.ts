"use client";

import { useQuery } from "@tanstack/react-query";
import { calculateUserBalances } from "@evensplit/shared";
import { fetchMyGroups } from "@/lib/api/groups";
import { fetchExpensesForGroups } from "@/lib/api/expenses";
import { fetchActivityForGroups } from "@/lib/api/activity";
import { fetchSettlementsForGroups } from "@/lib/api/settlements";
import { useAuth } from "@/hooks/use-auth";

/** Groups the current user is a member of, each annotated with their net balance. */
export function useMyGroups() {
  const { authUser } = useAuth();

  return useQuery({
    queryKey: ["groups", authUser?.id],
    queryFn: () => fetchMyGroups(authUser!.id),
    enabled: !!authUser?.id,
  });
}

/** Expenses aggregated across every group the user belongs to, for the top-level Insights page. */
export function useAllExpenses() {
  const { data: groups } = useMyGroups();
  const groupIds = groups?.map((g) => g.id) ?? [];
  return useQuery({
    queryKey: ["all-expenses", groupIds],
    queryFn: () => fetchExpensesForGroups(groupIds),
    enabled: !!groups,
  });
}

/** Settlements aggregated across every group the user belongs to, for Home's shared-balances summary. */
export function useAllSettlements() {
  const { data: groups } = useMyGroups();
  const groupIds = groups?.map((g) => g.id) ?? [];
  return useQuery({
    queryKey: ["all-settlements", groupIds],
    queryFn: () => fetchSettlementsForGroups(groupIds),
    enabled: !!groups,
  });
}

/** Activity feed aggregated across every group the user belongs to, for Home's recent-activity preview. */
export function useAllActivity() {
  const { data: groups } = useMyGroups();
  const groupIds = groups?.map((g) => g.id) ?? [];
  return useQuery({
    queryKey: ["all-activity", groupIds],
    queryFn: () => fetchActivityForGroups(groupIds),
    enabled: !!groups,
  });
}

/**
 * Per-group net balance for the current user, computed client-side via the
 * shared balance logic. Groups list rows show this so users can scan
 * "you owe / you're owed" without opening each group.
 */
export function useGroupNetBalance(groupId: string, memberIds: string[]) {
  const { authUser } = useAuth();

  return useQuery({
    queryKey: ["group-net-balance", groupId, authUser?.id],
    enabled: !!authUser?.id && memberIds.length > 0,
    queryFn: async () => {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseBrowserClient();

      const [{ data: expenses }, { data: shares }, { data: settlements }] = await Promise.all([
        supabase.from("expenses").select("id, amount, paid_by").eq("group_id", groupId),
        supabase
          .from("expense_shares")
          .select("expense_id, user_id, share_amount, expenses!inner(group_id)")
          .eq("expenses.group_id", groupId),
        supabase
          .from("settlements")
          .select("from_user, to_user, amount")
          .eq("group_id", groupId),
      ]);

      const balances = calculateUserBalances(
        memberIds,
        expenses ?? [],
        shares ?? [],
        settlements ?? []
      );
      return balances.find((b) => b.user_id === authUser!.id)?.balance ?? 0;
    },
  });
}
