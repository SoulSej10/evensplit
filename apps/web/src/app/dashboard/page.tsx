"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/app-shell/top-nav";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { GroupCard } from "@/components/groups/group-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMyGroups } from "@/hooks/use-groups";
import { Users, AlertCircle } from "lucide-react";

// Note: an "overall balance across groups" total (PROJECT_PLAN §6.2 W3) is
// intentionally per-group here rather than summed across groups, since
// groups can have different currencies and true multi-currency conversion
// is an open question / out of scope (see PROJECT_PLAN §8).

function DashboardContent() {
  const { profile } = useAuth();
  const { data: groups, isLoading, isError, refetch, isRefetching } = useMyGroups();

  return (
    <AppShell>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {profile?.display_name ? `Hey, ${profile.display_name.split(" ")[0]}` : "Your groups"}
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
          <p className="font-medium">Couldn't load your groups</p>
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

      {!isLoading && !isError && (
        <div className="grid gap-3">
          {groups?.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
