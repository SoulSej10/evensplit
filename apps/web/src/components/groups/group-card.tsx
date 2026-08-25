"use client";

import Link from "next/link";
import { useMemo } from "react";
import { calculateUserBalances } from "@evensplit/shared";
import type { GroupWithMembers } from "@/lib/api/groups";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatMoney, initials } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function GroupCard({ group }: { group: GroupWithMembers }) {
  const { authUser } = useAuth();
  const memberIds = useMemo(() => group.group_members.map((m) => m.user_id), [group]);

  const { data: netBalance, isError: balanceError } = useQuery({
    queryKey: ["group-card-balance", group.id, authUser?.id],
    enabled: !!authUser?.id,
    queryFn: async () => {
      const supabase = getSupabaseBrowserClient();
      const [{ data: expenses }, { data: shares }, { data: settlements }] = await Promise.all([
        supabase.from("expenses").select("id, amount, paid_by").eq("group_id", group.id),
        supabase
          .from("expense_shares")
          .select("expense_id, user_id, share_amount, expenses!inner(group_id)")
          .eq("expenses.group_id", group.id),
        supabase
          .from("settlements")
          .select("from_user, to_user, amount")
          .eq("group_id", group.id),
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

  const balance = netBalance ?? 0;
  const isPositive = balance > 0.005;
  const isNegative = balance < -0.005;

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="group rounded-2xl border-border/60 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="flex items-center gap-4 pt-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-2xl">
            {group.icon || "👥"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{group.name}</p>
            <div className="mt-1 flex -space-x-2">
              {group.group_members.slice(0, 5).map((m) => (
                <Avatar key={m.id} className="h-6 w-6 border-2 border-card">
                  <AvatarImage src={m.users?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {m.users?.display_name ? initials(m.users.display_name) : "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
          <div className="text-right">
            {balanceError ? (
              <p className="text-xs text-muted-foreground">Balance unavailable</p>
            ) : (
              <>
                <p
                  className={`font-mono text-lg font-semibold tabular-nums ${
                    isPositive ? "text-positive" : isNegative ? "text-negative" : "text-muted-foreground"
                  }`}
                >
                  {formatMoney(Math.abs(balance), group.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPositive ? "you're owed" : isNegative ? "you owe" : "settled up"}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
