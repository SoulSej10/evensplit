"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { acceptInvite, fetchInviteByCode } from "@/lib/api/invites";
import { fetchGroup } from "@/lib/api/groups";
import type { Group, Invite } from "@evensplit/shared";

function JoinGroupContent({ code }: { code: string }) {
  const router = useRouter();
  const { authUser } = useAuth();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const found = await fetchInviteByCode(code);
        if (!found) {
          setError("This invite link is invalid or has expired.");
          return;
        }
        setInvite(found);
        const g = await fetchGroup(found.group_id);
        setGroup(g);
      } catch {
        setError("This invite link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  async function onJoin() {
    if (!invite || !authUser) return;
    setJoining(true);
    try {
      await acceptInvite(invite.id, invite.group_id, authUser.id);
      toast.success(`You've joined ${group?.name ?? "the group"}`);
      router.push(`/groups/${invite.group_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not join group");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
            <Users className="h-6 w-6" />
          </span>
          <CardTitle>Join group</CardTitle>
          {group && <CardDescription>You've been invited to join {group.name}</CardDescription>}
        </CardHeader>
        <CardContent>
          {loading && <Skeleton className="h-10 w-full rounded-full" />}
          {!loading && error && <p className="text-center text-sm text-destructive">{error}</p>}
          {!loading && !error && (
            <Button className="w-full rounded-full" onClick={onJoin} disabled={joining}>
              Join {group?.name}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  return (
    <AuthGuard>
      <JoinGroupContent code={code} />
    </AuthGuard>
  );
}
