"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calculatePairwiseDebts, calculateUserBalances, type UpdateGroupInput } from "@evensplit/shared";
import { fetchGroup, updateGroup } from "@/lib/api/groups";
import { fetchGroupExpenses } from "@/lib/api/expenses";
import { fetchGroupSettlements } from "@/lib/api/settlements";
import { fetchGroupActivity } from "@/lib/api/activity";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: () => fetchGroup(groupId),
    enabled: !!groupId,
  });
}

/** Rename a group / change its icon or currency - owner-only, enforced by the groups_update_owner RLS policy. */
export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGroupInput) => updateGroup(groupId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useGroupExpenses(groupId: string) {
  return useQuery({
    queryKey: ["group-expenses", groupId],
    queryFn: () => fetchGroupExpenses(groupId),
    enabled: !!groupId,
  });
}

export function useGroupSettlements(groupId: string) {
  return useQuery({
    queryKey: ["group-settlements", groupId],
    queryFn: () => fetchGroupSettlements(groupId),
    enabled: !!groupId,
  });
}

export function useGroupActivity(groupId: string) {
  return useQuery({
    queryKey: ["group-activity", groupId],
    queryFn: () => fetchGroupActivity(groupId),
    enabled: !!groupId,
  });
}

/**
 * Derived per-user balances and who-owes-whom breakdown for a group, from
 * the shared, unit-tested business logic in packages/shared/balances.ts.
 */
export function useGroupBalances(
  groupId: string,
  memberIds: string[],
  expenses: { id: string; amount: number; paid_by: string }[],
  expenseShares: { expense_id: string; user_id: string; share_amount: number }[],
  settlements: { from_user: string; to_user: string; amount: number }[]
) {
  const balances = calculateUserBalances(memberIds, expenses, expenseShares, settlements);
  const pairwiseDebts = calculatePairwiseDebts(expenses, expenseShares, settlements);
  return { balances, pairwiseDebts };
}

/**
 * Subscribes to Supabase Realtime changes for a group's expenses,
 * expense_shares, and settlements, invalidating the relevant TanStack
 * Query caches so balances/lists update live across all connected clients
 * (PROJECT_PLAN §5.4 "real-time per-group balance view").
 */
export function useGroupRealtime(groupId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`group-${groupId}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `group_id=eq.${groupId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["group-expenses", groupId] });
          void queryClient.invalidateQueries({ queryKey: ["group-activity", groupId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expense_shares" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["group-expenses", groupId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settlements", filter: `group_id=eq.${groupId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["group-settlements", groupId] });
          void queryClient.invalidateQueries({ queryKey: ["group-activity", groupId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members", filter: `group_id=eq.${groupId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["group", groupId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);
}
