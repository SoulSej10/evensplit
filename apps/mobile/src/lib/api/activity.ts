import { getSupabaseClient } from "@/lib/supabase/client";

export type ActivityItem =
  | {
      type: "expense_added";
      id: string;
      at: string;
      description: string;
      amount: number;
      currency: string;
      paid_by: string;
      group_id: string;
    }
  | {
      type: "settlement";
      id: string;
      at: string;
      amount: number;
      from_user: string;
      to_user: string;
      group_id: string;
    };

export async function fetchGroupActivity(groupId: string): Promise<ActivityItem[]> {
  return fetchActivityForGroups([groupId]);
}

/** Activity across every group a user belongs to, newest first — powers the top-level Activity tab. */
export async function fetchActivityForGroups(groupIds: string[]): Promise<ActivityItem[]> {
  if (groupIds.length === 0) return [];
  const supabase = getSupabaseClient();

  const [{ data: expenses, error: expensesError }, { data: settlements, error: settlementsError }] =
    await Promise.all([
      supabase
        .from("expenses")
        .select("id, description, amount, currency, paid_by, created_at, group_id")
        .in("group_id", groupIds),
      supabase
        .from("settlements")
        .select("id, amount, from_user, to_user, settled_at, group_id")
        .in("group_id", groupIds),
    ]);

  if (expensesError) throw expensesError;
  if (settlementsError) throw settlementsError;

  const expenseItems: ActivityItem[] = (expenses ?? []).map((e) => ({
    type: "expense_added" as const,
    id: e.id,
    at: e.created_at,
    description: e.description,
    amount: e.amount,
    currency: e.currency,
    paid_by: e.paid_by,
    group_id: e.group_id,
  }));

  const settlementItems: ActivityItem[] = (settlements ?? []).map((s) => ({
    type: "settlement" as const,
    id: s.id,
    at: s.settled_at,
    amount: s.amount,
    from_user: s.from_user,
    to_user: s.to_user,
    group_id: s.group_id,
  }));

  return [...expenseItems, ...settlementItems].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}
