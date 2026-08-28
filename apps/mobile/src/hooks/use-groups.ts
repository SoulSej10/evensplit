import { useQuery } from "@tanstack/react-query";
import { fetchMyGroups } from "@/lib/api/groups";
import { fetchActivityForGroups } from "@/lib/api/activity";
import { fetchExpensesForGroups } from "@/lib/api/expenses";
import { fetchSettlementsForGroups } from "@/lib/api/settlements";
import { useAuth } from "@/hooks/use-auth";

export function useMyGroups() {
  const { authUser } = useAuth();
  return useQuery({
    queryKey: ["groups", authUser?.id],
    queryFn: () => fetchMyGroups(authUser!.id),
    enabled: !!authUser?.id,
  });
}

/** Activity feed aggregated across every group the user belongs to. */
export function useAllActivity() {
  const { data: groups } = useMyGroups();
  const groupIds = groups?.map((g) => g.id) ?? [];
  return useQuery({
    queryKey: ["all-activity", groupIds],
    queryFn: () => fetchActivityForGroups(groupIds),
    enabled: !!groups,
  });
}

/** Expenses aggregated across every group the user belongs to, for the Insights tab. */
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
