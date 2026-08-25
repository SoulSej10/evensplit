"use client";

import type { User } from "@evensplit/shared";
import { AlertCircle, ArrowRightLeft, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroupActivity } from "@/hooks/use-group-detail";
import { formatDateTime, formatMoney } from "@/lib/format";

export function ActivityTab({
  groupId,
  groupCurrency,
  members,
  currentUserId,
}: {
  groupId: string;
  groupCurrency: string;
  members: { user_id: string; users: User | null }[];
  currentUserId: string;
}) {
  const { data: activity, isLoading, isError, refetch, isRefetching } = useGroupActivity(groupId);

  function name(userId: string) {
    if (userId === currentUserId) return "You";
    return members.find((m) => m.user_id === userId)?.users?.display_name ?? "Someone";
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-destructive/40 py-14 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm font-medium">Couldn't load activity</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          {isRefetching ? "Retrying…" : "Try again"}
        </Button>
      </div>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
        No activity yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {activity.map((item) => (
        <div
          key={`${item.type}-${item.id}`}
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
            {item.type === "expense_added" ? (
              <Receipt className="h-4 w-4" />
            ) : (
              <ArrowRightLeft className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0 flex-1 text-sm">
            {item.type === "expense_added" ? (
              <p>
                <span className="font-medium">{name(item.paid_by)}</span> added{" "}
                <span className="font-medium">{item.description}</span> ·{" "}
                {formatMoney(item.amount, item.currency)}
              </p>
            ) : (
              <p>
                <span className="font-medium">{name(item.from_user)}</span> paid{" "}
                <span className="font-medium">{name(item.to_user)}</span>{" "}
                {formatMoney(item.amount, groupCurrency)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{formatDateTime(item.at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
