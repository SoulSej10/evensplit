"use client";

import type { User } from "@evensplit/shared";
import { WarningCircle as AlertCircle, ArrowsLeftRight as ArrowRightLeft, Receipt } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { useGroupActivity } from "@/hooks/use-group-detail";
import { usePagination } from "@/hooks/use-pagination";
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
  const { page, setPage, pageCount, pageItems, totalCount, pageSize } = usePagination(activity ?? [], 10);

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
        <p className="text-sm font-medium">Couldn&apos;t load activity</p>
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
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageItems.map((item) => (
            <TableRow key={`${item.type}-${item.id}`}>
              <TableCell>
                {item.type === "expense_added" ? (
                  <Badge variant="secondary" className="gap-1">
                    <Receipt className="h-3 w-3" /> Expense
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-positive/30 bg-positive/10 text-positive">
                    <ArrowRightLeft className="h-3 w-3" /> Settlement
                  </Badge>
                )}
              </TableCell>

              <TableCell className="text-sm">
                {item.type === "expense_added" ? (
                  <span>
                    <span className="font-medium">{name(item.paid_by)}</span> added{" "}
                    <span className="font-medium">{item.description}</span>
                  </span>
                ) : (
                  <span>
                    <span className="font-medium">{name(item.from_user)}</span> paid{" "}
                    <span className="font-medium">{name(item.to_user)}</span>
                  </span>
                )}
              </TableCell>

              <TableCell className="text-right font-mono font-semibold tabular-nums">
                {formatMoney(item.amount, item.type === "expense_added" ? item.currency : groupCurrency)}
              </TableCell>

              <TableCell className="text-right text-xs text-muted-foreground">
                {formatDateTime(item.at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
      />
    </div>
  );
}
