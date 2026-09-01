"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users } from "@phosphor-icons/react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { acceptInvite, fetchInviteByCode, type InvitePreview } from "@/lib/api/invites";

function JoinGroupContent({ code }: { code: string }) {
  const router = useRouter();
  const { authUser } = useAuth();
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const found = await fetchInviteByCode(code);
        if (!found || !found.is_valid) {
          setError("This invite link is invalid or has expired.");
          return;
        }
        setInvite(found);
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
      const groupId = await acceptInvite(invite.invite_id);
      toast.success(`You've joined ${invite.group_name}`);
      router.push(`/groups/${groupId}`);
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
          {invite && <CardDescription>You&apos;ve been invited to join {invite.group_name}</CardDescription>}
        </CardHeader>
        <CardContent>
          {loading && <Skeleton className="h-10 w-full rounded-full" />}
          {!loading && error && <p className="text-center text-sm text-destructive">{error}</p>}
          {!loading && !error && (
            <Button className="w-full rounded-full" onClick={onJoin} disabled={joining}>
              Join {invite?.group_name}
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
