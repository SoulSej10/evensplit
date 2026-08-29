"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/app-shell/top-nav";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupTableRow } from "@/components/groups/group-table-row";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMyGroups } from "@/hooks/use-groups";
import { Users, AlertCircle } from "lucide-react";

/**
 * The "Groups" destination - every group the user belongs to, plus the
 * entry point to create one. This used to be the Home/dashboard page's
 * whole content; Home ("/dashboard") is now a separate lightweight
 * command-center page and this route owns the full groups list on its own.
 */
function GroupsContent() {
  const { data: groups, isLoading, isError, refetch, isRefetching } = useMyGroups();

  return (
    <AppShell>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {groups?.length ? "Your groups" : "Groups"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {groups?.length ? `${groups.length} group${groups.length === 1 ? "" : "s"}` : "No groups yet"}
          </p>
        </div>
        <CreateGroupDialog />
      </div>

      {isLoading && (
        <div className="grid gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-destructive/40 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </span>
          <p className="font-medium">Couldn&apos;t load your groups</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Something went wrong fetching your groups. Try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            {isRefetching ? "Retrying…" : "Try again"}
          </Button>
        </div>
      )}

      {!isLoading && !isError && groups?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
            <Users className="h-6 w-6" />
          </span>
          <p className="font-medium">No groups yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Create a group for a trip, household, or anything you split costs on.
          </p>
          <CreateGroupDialog />
        </div>
      )}

      {!isLoading && !isError && groups && groups.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <GroupTableRow key={g.id} group={g} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppShell>
  );
}

export default function GroupsPage() {
  return (
    <AuthGuard>
      <GroupsContent />
    </AuthGuard>
  );
}
