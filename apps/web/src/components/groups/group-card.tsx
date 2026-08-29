"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { GroupWithMembers } from "@/lib/api/groups";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatMoney, initials } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { useGroupNetBalance } from "@/hooks/use-group-balance-preview";

export function GroupCard({ group }: { group: GroupWithMembers }) {
  const { authUser } = useAuth();
  const memberIds = useMemo(() => group.group_members.map((m) => m.user_id), [group]);

  const { data: netBalance, isError: balanceError } = useGroupNetBalance(group.id, memberIds, authUser?.id);

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
