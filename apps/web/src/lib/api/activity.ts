import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * The schema (§4.2) has no dedicated activity/audit-log table, so the
 * activity feed is derived from `expenses` and `settlements` directly,
 * merged and sorted by timestamp. This covers "expense added" and
 * "settlement recorded" events; it does not track edit/delete history
 * since nothing in the schema persists that. Noted as a scope decision in
 * PROJECT_PLAN.md's Progress Log.
 */
export type ActivityItem =
  | {
      type: "expense_added";
      id: string;
      at: string;
      description: string;
      amount: number;
      currency: string;
      paid_by: string;
    }
  | {
      type: "settlement";
      id: string;
      at: string;
      amount: number;
      from_user: string;
      to_user: string;
    };

export async function fetchGroupActivity(groupId: string): Promise<ActivityItem[]> {
  const supabase = getSupabaseBrowserClient();

  const [{ data: expenses, error: expensesError }, { data: settlements, error: settlementsError }] =
    await Promise.all([
      supabase
        .from("expenses")
        .select("id, description, amount, currency, paid_by, created_at")
        .eq("group_id", groupId),
      supabase
        .from("settlements")
        .select("id, amount, from_user, to_user, settled_at")
        .eq("group_id", groupId),
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
  }));

  const settlementItems: ActivityItem[] = (settlements ?? []).map((s) => ({
    type: "settlement" as const,
    id: s.id,
    at: s.settled_at,
    amount: s.amount,
    from_user: s.from_user,
    to_user: s.to_user,
  }));

  return [...expenseItems, ...settlementItems].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}
