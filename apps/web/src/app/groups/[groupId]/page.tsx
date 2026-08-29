"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { calculateUserBalances } from "@evensplit/shared";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/app-shell/top-nav";
import { BackLink } from "@/components/app-shell/back-link";
import { useSetBreadcrumbLabel } from "@/components/app-shell/breadcrumb-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InviteDialog } from "@/components/groups/invite-dialog";
import { OverviewTab } from "@/components/groups/overview-tab";
import { ExpensesTab } from "@/components/expenses/expenses-tab";
import { BalancesTab } from "@/components/balances/balances-tab";
import { ActivityTab } from "@/components/activity/activity-tab";
import { InsightsTab } from "@/components/insights/insights-tab";
import { useAuth } from "@/hooks/use-auth";
import { useGroup, useGroupExpenses, useGroupRealtime, useGroupSettlements } from "@/hooks/use-group-detail";
import { archiveGroup, leaveGroup, removeMember } from "@/lib/api/groups";
import { formatMoney, initials } from "@/lib/format";
import { downloadGroupLedgerCsv } from "@/lib/csv";
import { MoreVertical, UserPlus, UserMinus, Archive, LogOut, AlertCircle, Download } from "lucide-react";

function GroupDetailContent({ groupId }: { groupId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { authUser } = useAuth();
  const { data: group, isLoading, isError, refetch, isRefetching } = useGroup(groupId);
  const { data: expenses } = useGroupExpenses(groupId);
  const { data: settlements } = useGroupSettlements(groupId);
  useGroupRealtime(groupId);
  useSetBreadcrumbLabel(group?.name ?? null);

  const members = group?.group_members ?? [];
  const memberIds = useMemo(() => members.map((m) => m.user_id), [members]);
  const isOwner = members.find((m) => m.user_id === authUser?.id)?.role === "owner";

  const myBalance = useMemo(() => {
    if (!expenses || !authUser) return 0;
    const allShares = expenses.flatMap((e) => e.expense_shares);
    const balances = calculateUserBalances(memberIds, expenses, allShares, settlements ?? []);
    return balances.find((b) => b.user_id === authUser.id)?.balance ?? 0;
  }, [expenses, settlements, memberIds, authUser]);

  async function onLeave() {
    if (!authUser) return;
    try {
      await leaveGroup(groupId, authUser.id);
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Left group");
      router.push("/groups");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not leave group");
    }
  }

  async function onArchive() {
    try {
      await archiveGroup(groupId);
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group archived");
      router.push("/groups");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not archive group");
    }
  }

  async function onRemoveMember(userId: string) {
    try {
      await removeMember(groupId, userId);
      await queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      toast.success("Member removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove member");
    }
  }

  if (isError) {
    return (
      <AppShell>
        <BackLink href="/groups" label="Back to groups" />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-destructive/40 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </span>
          <p className="font-medium">Couldn&apos;t load this group</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Something went wrong loading this group&apos;s details. Try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            {isRefetching ? "Retrying…" : "Try again"}
          </Button>
        </div>
      </AppShell>
    );
  }

  if (isLoading || !group) {
    return (
      <AppShell>
        <BackLink href="/groups" label="Back to groups" />
        <Skeleton className="h-24 rounded-2xl" />
      </AppShell>
    );
  }

  const isPositive = myBalance > 0.005;
  const isNegative = myBalance < -0.005;

  return (
    <AppShell>
      <BackLink href="/groups" label="Back to groups" />
      <div className="mb-6 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-2xl">
              {group.icon || "👥"}
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{group.name}</h1>
              <p className="text-sm text-muted-foreground">{group.currency} · {members.length} members</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              title="Export CSV"
              onClick={() =>
                downloadGroupLedgerCsv({
                  groupName: group.name,
                  expenses: expenses ?? [],
                  settlements: settlements ?? [],
                  members,
                })
              }
            >
              <Download className="h-4 w-4" />
            </Button>
            <InviteDialog
              groupId={groupId}
              trigger={
                <Button size="icon" variant="outline" className="rounded-full">
                  <UserPlus className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Archive className="mr-2 h-4 w-4" /> Archive group
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Archive this group?</AlertDialogTitle>
                        <AlertDialogDescription>
                          It&apos;ll be hidden from your dashboard. This is reversible from the database
                          if needed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onArchive}>Archive</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} variant="destructive">
                      <LogOut className="mr-2 h-4 w-4" /> Leave group
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Leave this group?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You&apos;ll lose access to its expenses and balances.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onLeave} className="bg-destructive text-white">
                        Leave
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-2">
            {members.map((m) => (
              <DropdownMenu key={m.id}>
                <DropdownMenuTrigger asChild>
                  <button>
                    <Avatar className="h-8 w-8 border-2 border-card">
                      <AvatarImage src={m.users?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {m.users?.display_name ? initials(m.users.display_name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {m.users?.display_name}{" "}
                    {m.role === "owner" && (
                      <span className="text-xs text-muted-foreground">(owner)</span>
                    )}
                  </div>
                  {isOwner && m.user_id !== authUser?.id && (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onRemoveMember(m.user_id)}
                    >
                      <UserMinus className="mr-2 h-4 w-4" /> Remove from group
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </div>

          <div className="text-right">
            <p
              className={`font-mono text-2xl font-semibold tabular-nums ${
                isPositive ? "text-positive" : isNegative ? "text-negative" : "text-muted-foreground"
              }`}
            >
              {formatMoney(Math.abs(myBalance), group.currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {isPositive ? "you're owed" : isNegative ? "you owe" : "you're settled up"}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab groupId={groupId} groupCurrency={group.currency} members={members} currentUserId={authUser!.id} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesTab
            groupId={groupId}
            groupCurrency={group.currency}
            members={members}
            currentUserId={authUser!.id}
          />
        </TabsContent>
        <TabsContent value="balances">
          <BalancesTab
            groupId={groupId}
            groupCurrency={group.currency}
            members={members}
            currentUserId={authUser!.id}
          />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab
            groupId={groupId}
            groupCurrency={group.currency}
            members={members}
            currentUserId={authUser!.id}
          />
        </TabsContent>
        <TabsContent value="insights">
          <InsightsTab
            groupId={groupId}
            groupCurrency={group.currency}
            members={members}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  return (
    <AuthGuard>
      <GroupDetailContent groupId={groupId} />
    </AuthGuard>
  );
}
