"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import type { GroupWithMembers } from "@/lib/api/groups";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatMoney, initials } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { useGroupNetBalance } from "@/hooks/use-group-balance-preview";

/** One row of the Groups table: name/icon, member stack, currency, and this user's net balance as a status-style badge. */
export function GroupTableRow({ group }: { group: GroupWithMembers }) {
  const { authUser } = useAuth();
  const memberIds = useMemo(() => group.group_members.map((m) => m.user_id), [group]);
  const { data: netBalance, isError: balanceError } = useGroupNetBalance(group.id, memberIds, authUser?.id);

  const balance = netBalance ?? 0;
  const isPositive = balance > 0.005;
  const isNegative = balance < -0.005;

  return (
    <TableRow className="cursor-pointer">
      <TableCell className="w-full">
        <Link href={`/groups/${group.id}`} className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-lg">
            {group.icon || "👥"}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{group.name}</p>
            <p className="text-xs text-muted-foreground">
              {group.group_members.length} member{group.group_members.length === 1 ? "" : "s"}
            </p>
          </div>
        </Link>
      </TableCell>

      <TableCell>
        <div className="flex -space-x-2">
          {group.group_members.slice(0, 5).map((m) => (
            <Avatar key={m.id} className="h-7 w-7 border-2 border-card">
              <AvatarImage src={m.users?.avatar_url ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {m.users?.display_name ? initials(m.users.display_name) : "?"}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </TableCell>

      <TableCell className="text-muted-foreground">{group.currency}</TableCell>

      <TableCell className="text-right">
        {balanceError ? (
          <span className="text-xs text-muted-foreground">Unavailable</span>
        ) : (
          <Badge
            variant="outline"
            className={
              isPositive
                ? "border-positive/30 bg-positive/10 text-positive"
                : isNegative
                  ? "border-negative/30 bg-negative/10 text-negative"
                  : "text-muted-foreground"
            }
          >
            {isPositive ? "Owed " : isNegative ? "Owes " : "Settled"}
            {(isPositive || isNegative) && formatMoney(Math.abs(balance), group.currency)}
          </Badge>
        )}
      </TableCell>

      <TableCell className="w-8 pl-0">
        <Link
          href={`/groups/${group.id}`}
          aria-label={`Open ${group.name}`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </TableCell>
    </TableRow>
  );
}
